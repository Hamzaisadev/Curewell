/**
 * Medication Schedule & Adherence Domain Facade.
 *
 * Unifies:
 * - Virtual Schedule Projection (ADR 0001)
 * - Sparse Intake Logs & Runtime Status Derivation
 * - Adaptive 3+1 Time Bucket Topology (Morning, Afternoon, Night + Bedtime)
 * - Two-Tier Adherence Metrics (Clinical Adherence % & Daily Logging Streak)
 * - Actionable Late / Overdue Dose Guardrails & Stacking Risk Analysis
 *
 * Serves as the single domain entry point for patient schedule views and testing seams.
 */

import { todayInAppTz, minutesInAppTz } from '../lib/time';
import { resolveActiveBuckets, type Bucket, type MedicineCandidate } from './timeBuckets';
import {
  projectSchedule,
  type ActiveMedicineRecord,
  type PatientRoutines,
} from './schedule';
import {
  deriveEffectiveDoses,
  calculateLoggingStreak,
  evaluateLateDoseRisk,
  type EffectiveDose,
  type IntakeLogRecord,
  type LateDoseRiskResult,
} from './adherence';
import type { MedicineRecord } from './activeMedicines';

export interface DailyScheduleFacadeInput {
  medicines: (MedicineRecord | ActiveMedicineRecord)[];
  intakeLogs?: IntakeLogRecord[];
  targetDate?: string; // 'YYYY-MM-DD', defaults to today in app tz
  now?: Date; // Injected clock, defaults to new Date()
  patientRoutines?: PatientRoutines;
}

export interface DailyScheduleStats {
  totalScheduled: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  pendingCount: number;
  actionableCount: number;
  clinicalAdherencePercent: number;
  dailyLoggingStreak: number;
  skipReasonsSummary: Record<string, number>;

  // Convenience aliases for flexible consumption
  clinicalAdherencePercentage?: number;
  loggingStreak?: number;
}

export interface DailyScheduleView {
  targetDate: string;
  activeBuckets: Bucket[];
  buckets: Record<Bucket, EffectiveDose[]>;
  pastUnloggedDoses: EffectiveDose[];
  stats: DailyScheduleStats;
  hasBedtime: boolean;
}

/**
 * Checks whether a single medicine record is active on a given calendar date.
 */
function isMedicineActiveOnDate(
  med: MedicineRecord | ActiveMedicineRecord,
  date: string
): boolean {
  const m = med as ActiveMedicineRecord;
  const disc = m.discontinuedAt ?? m.discontinued_at;
  if (disc && disc.slice(0, 10) < date) {
    return false;
  }

  const start = m.startDate ?? m.start_date;
  if (start && start > date) {
    return false;
  }

  const isOngoing = m.isOngoing ?? m.is_ongoing;
  const end = m.endDate ?? m.end_date;
  if (isOngoing === false && end && end < date) {
    return false;
  }

  return true;
}

/**
 * Determines whether a bucket's administration window has passed for a target date.
 * - Morning: 05:00 – 11:59 (passes at >= 12:00, minute 720)
 * - Afternoon: 12:00 – 16:59 (passes at >= 17:00, minute 1020)
 * - Night: 17:00 – 21:59 when bedtime is active (passes at >= 22:00, minute 1320);
 *   without bedtime, night extends across evening/night (does not pass before midnight).
 * - Bedtime: 22:00 – 04:59 (does not pass before midnight on same date).
 */
export function isBucketWindowExpired(
  bucket: Bucket,
  targetDate: string,
  today: string,
  currentMinutes: number,
  hasBedtime: boolean
): boolean {
  if (targetDate < today) {
    return true;
  }
  if (targetDate > today) {
    return false;
  }

  switch (bucket) {
    case 'morning':
      return currentMinutes > 719;
    case 'afternoon':
      return currentMinutes > 1019;
    case 'night':
      return hasBedtime ? currentMinutes > 1319 : false;
    case 'bedtime':
      return false;
  }
}

/**
 * High-level domain facade function building a complete daily schedule view.
 *
 * Projects scheduled doses in-memory, joins sparse intake logs, applies adaptive
 * bucket topology, identifies overdue unlogged doses for delayed logging, and
 * calculates Two-Tier adherence stats.
 */
export function buildDailyScheduleView(
  input: DailyScheduleFacadeInput
): DailyScheduleView {
  const now = input.now ?? new Date();
  const today = todayInAppTz(now);
  const targetDate = input.targetDate ?? today;
  const currentMinutes = minutesInAppTz(now);
  const intakeLogs = input.intakeLogs ?? [];
  const rawMedicines = input.medicines ?? [];

  // 1. Identify medicines active on the target date
  const activeMedsOnTargetDate = rawMedicines.filter((m) =>
    isMedicineActiveOnDate(m, targetDate)
  );

  // 2. Resolve active buckets adaptively (3+1 topology)
  const activeBuckets = resolveActiveBuckets(
    activeMedsOnTargetDate as MedicineCandidate[]
  );
  let hasBedtime = activeBuckets.includes('bedtime');

  // 3. Find earliest intake log or start date to project history for streak calculation
  let earliestDate = targetDate;
  for (const log of intakeLogs) {
    const logDate = log.scheduled_date ?? log.scheduledDate;
    if (logDate && logDate < earliestDate) {
      earliestDate = logDate;
    }
  }

  const projectionRange = {
    from: earliestDate,
    to: targetDate > today ? targetDate : today,
  };

  // 4. Project scheduled doses in-memory (ADR 0001)
  const allProjectedDoses = projectSchedule({
    activeMedicines: rawMedicines as ActiveMedicineRecord[],
    dateRange: projectionRange,
    patientRoutines: input.patientRoutines,
    now,
  });

  // 5. Derive effective doses with sparse intake logs
  const allEffectiveDoses = deriveEffectiveDoses(allProjectedDoses, intakeLogs, now);

  // 6. Filter effective doses for the requested target date
  const targetDateEffectiveDoses = allEffectiveDoses.filter(
    (d) => d.scheduledDate === targetDate
  );

  // Fallback check: if any projected dose on target date landed in bedtime bucket, activate bedtime
  if (!hasBedtime && targetDateEffectiveDoses.some((d) => d.bucket === 'bedtime')) {
    hasBedtime = true;
    if (!activeBuckets.includes('bedtime')) {
      activeBuckets.push('bedtime');
    }
  }

  // 7. Group doses into buckets (only populated for activeBuckets)
  const buckets = {} as Record<Bucket, EffectiveDose[]>;
  for (const b of activeBuckets) {
    buckets[b] = [];
  }

  for (const dose of targetDateEffectiveDoses) {
    if (buckets[dose.bucket]) {
      buckets[dose.bucket].push(dose);
    } else if (activeBuckets.includes(dose.bucket)) {
      buckets[dose.bucket] = [dose];
    } else if (dose.bucket === 'bedtime' && !hasBedtime) {
      buckets.night?.push(dose);
    }
  }

  // 8. Identify past unlogged doses whose bucket window has passed or are missed
  const pastUnloggedDoses = targetDateEffectiveDoses.filter((dose) => {
    if (dose.status === 'taken' || dose.status === 'skipped') {
      return false;
    }
    if (dose.status === 'missed') {
      return true;
    }
    return isBucketWindowExpired(
      dose.bucket,
      targetDate,
      today,
      currentMinutes,
      hasBedtime
    );
  });

  // 9. Compute Daily Schedule Stats
  let takenCount = 0;
  let missedCount = 0;
  let skippedCount = 0;
  let pendingCount = 0;
  const skipReasonsSummary: Record<string, number> = {};

  for (const dose of targetDateEffectiveDoses) {
    if (dose.status === 'taken') {
      takenCount++;
    } else if (dose.status === 'missed') {
      missedCount++;
    } else if (dose.status === 'skipped') {
      skippedCount++;
      const reason = (dose.skipReason && dose.skipReason.trim()) || 'Unspecified';
      skipReasonsSummary[reason] = (skipReasonsSummary[reason] ?? 0) + 1;
    } else if (dose.status === 'pending') {
      pendingCount++;
    }
  }

  const totalScheduled = targetDateEffectiveDoses.length;
  const actionableCount = pendingCount + missedCount;

  // Clinical Adherence Rate for target date: taken / settled (excluding future/active pending doses)
  const settledCount = takenCount + missedCount + skippedCount;
  const clinicalAdherencePercent =
    settledCount === 0 ? 0 : Math.round((takenCount / settledCount) * 100);

  // Daily Logging Streak calculated across contiguous patient history
  const dailyLoggingStreak = calculateLoggingStreak(allProjectedDoses, intakeLogs, now);

  const stats: DailyScheduleStats = {
    totalScheduled,
    takenCount,
    missedCount,
    skippedCount,
    pendingCount,
    actionableCount,
    clinicalAdherencePercent,
    dailyLoggingStreak,
    skipReasonsSummary,
    clinicalAdherencePercentage: clinicalAdherencePercent,
    loggingStreak: dailyLoggingStreak,
  };

  return {
    targetDate,
    activeBuckets,
    buckets,
    pastUnloggedDoses,
    stats,
    hasBedtime,
  };
}

/**
 * Returns the next upcoming pending dose on or after `currentMinutes` for the daily schedule.
 * Returns null if all doses for the day have already occurred or are settled.
 */
export function getUpcomingDose(
  view: DailyScheduleView,
  currentMinutes: number
): EffectiveDose | null {
  const allDoses: EffectiveDose[] = [];
  for (const bucket of view.activeBuckets) {
    const bucketDoses = view.buckets[bucket];
    if (bucketDoses) {
      allDoses.push(...bucketDoses);
    }
  }

  allDoses.sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);

  const upcoming = allDoses.find(
    (dose) => dose.status === 'pending' && dose.scheduledMinutes >= currentMinutes
  );

  return upcoming ?? null;
}

/**
 * Evaluates whether logging an overdue dose right now carries a dose-stacking risk
 * (<4 hours / 240 minutes interval) relative to an upcoming dose of the same medicine.
 */
export function checkDoseLateRisk(
  dose: EffectiveDose,
  view: DailyScheduleView,
  currentMinutes: number
): LateDoseRiskResult {
  const allDoses: EffectiveDose[] = [];
  for (const bucket of view.activeBuckets) {
    const bucketDoses = view.buckets[bucket];
    if (bucketDoses) {
      allDoses.push(...bucketDoses);
    }
  }

  const targetMedId = dose.medicineId ?? dose.medicine_id;
  const targetMedName = (dose.medicineName ?? dose.medicine_name ?? '').trim().toLowerCase();

  const sameMedicineDoses = allDoses.filter((d) => {
    const dId = d.medicineId ?? d.medicine_id;
    if (targetMedId && dId && targetMedId === dId) {
      return true;
    }
    const dName = (d.medicineName ?? d.medicine_name ?? '').trim().toLowerCase();
    return Boolean(targetMedName && dName && targetMedName === dName);
  });

  sameMedicineDoses.sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);

  const nextScheduledDose =
    sameMedicineDoses.find((d) => d.scheduledMinutes > dose.scheduledMinutes) ?? null;

  return evaluateLateDoseRisk(dose, nextScheduledDose, currentMinutes);
}
