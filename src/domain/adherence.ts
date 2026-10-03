/**
 * Adherence Calculation & Tracking, Sparse Intake Logs, and Status Derivation.
 *
 * Implements:
 * - Sparse Intake Log model (ADR 0001): Only actual patient actions ('taken' | 'skipped')
 *   are stored. Status of scheduled doses is derived on read.
 * - Out-of-window status derivation: Pending doses >4 hours (240 minutes) overdue
 *   or from past calendar dates are derived as 'missed'.
 * - Dose Stacking Risk Analysis: Evaluates whether taking an overdue dose too close
 *   to an upcoming dose carries a dose-stacking risk (<4 hour interval).
 * - Two-Tier Adherence Metrics:
 *   1. Clinical Adherence Rate: taken / scheduled (excluding PRN and future pending doses)
 *      representing medical truth for doctors.
 *   2. Daily Logging Streak: consecutive days where all scheduled doses are settled
 *      ('taken' or 'skipped' with valid reason), building patient daily habit.
 *   3. Aggregated documented skip reasons for doctor review.
 * - 100% backwards compatibility for deriveStatusOnRead, calculateAdherence, and calculateAdherenceStreak.
 */

import { addDaysAppTz, minutesInAppTz, todayInAppTz, fromAppDate } from '../lib/time';
import type { Bucket } from './timeBuckets';
import type { ProjectedDose } from './schedule';

/**
 * A pending dose becomes 'missed' once it is this many minutes past its
 * scheduled time (06-DOMAIN-RULES.md §Adherence, ADR 0001).
 */
export const MISSED_AFTER_MINUTES = 240;

/**
 * Minimum safe interval (in minutes) between consecutive doses to prevent dose-stacking toxicity.
 */
export const DOSE_STACKING_THRESHOLD_MINUTES = 240; // 4 hours

export type IntakeStatus = 'taken' | 'skipped';

export interface IntakeLogRecord {
  id: string;
  medicine_id: string;
  scheduled_date: string; // 'YYYY-MM-DD'
  bucket: Bucket; // 'morning' | 'afternoon' | 'night' | 'bedtime'
  status: IntakeStatus;
  taken_at?: string | null; // ISO timestamp
  skip_reason?: string | null; // e.g., 'Doctor advised hold', 'Nausea', 'Fasting'
  scheduled_minutes?: number | null; // optional matching aid

  // Convenience aliases for camelCase compatibility
  medicineId?: string;
  scheduledDate?: string;
  takenAt?: string | null;
  skipReason?: string | null;
  scheduledMinutes?: number | null;
}

export interface EffectiveDose extends ProjectedDose {
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  intakeLogId?: string | null;
  takenAt?: string | null;
  skipReason?: string | null;

  // Convenience aliases
  taken_at?: string | null;
  skip_reason?: string | null;
  medicine_id?: string;
  medicine_name?: string;
  dose_amount?: string | null;
}

export type LateDoseRiskLevel = 'safe' | 'warning_dose_stacking';

export interface LateDoseRiskResult {
  riskLevel: LateDoseRiskLevel;
  risk_level: LateDoseRiskLevel;
  intervalMinutes: number | null;
  interval_minutes: number | null;
  message: string;
  recommendation: 'take_now' | 'skip_and_resume';
}

export interface TwoTierAdherenceStats {
  scheduled: number;
  taken: number;
  skipped: number;
  missed: number;
  clinicalAdherencePercentage: number;
  dailyLoggingStreak: number;
  skipReasonsSummary: Record<string, number>;

  // Convenience & backwards compatibility aliases
  percentage: number;
  streak: number;
  loggingStreak: number;
  clinical_percentage: number;
  clinical_adherence_percentage: number;
  daily_logging_streak: number;
  skip_reasons_summary: Record<string, number>;
}

export interface DoseRecord {
  id: string;
  medicine_id: string;
  scheduled_date: string; // 'YYYY-MM-DD'
  scheduled_minutes: number; // 0–1439
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  taken_at?: string | null;
  is_prn?: boolean;
}

export interface AdherenceStats {
  scheduled: number;
  taken: number;
  skipped: number;
  missed: number;
  percentage: number;
}

/**
 * Finds matching sparse intake log for a projected or effective dose.
 * Prioritizes exact scheduled_minutes match if present, falling back to bucket match.
 */
export function findMatchingIntakeLog(
  dose: ProjectedDose | EffectiveDose,
  intakeLogs: IntakeLogRecord[]
): IntakeLogRecord | undefined {
  if (!intakeLogs || intakeLogs.length === 0) return undefined;

  const medId = dose.medicineId ?? dose.medicine_id;
  const schedDate = dose.scheduledDate ?? dose.scheduled_date;
  const schedMin = dose.scheduledMinutes ?? dose.scheduled_minutes;
  const bucket = dose.bucket;

  // 1. If log has exact scheduled_minutes matching dose, match with highest precedence
  if (schedMin != null) {
    const exactMinMatch = intakeLogs.find((log) => {
      const logMedId = log.medicine_id ?? log.medicineId;
      const logDate = log.scheduled_date ?? log.scheduledDate;
      const logMin = log.scheduled_minutes ?? log.scheduledMinutes;
      return logMedId === medId && logDate === schedDate && logMin != null && logMin === schedMin;
    });
    if (exactMinMatch) return exactMinMatch;
  }

  // 2. Match on medicine_id + scheduled_date + bucket
  return intakeLogs.find((log) => {
    const logMedId = log.medicine_id ?? log.medicineId;
    const logDate = log.scheduled_date ?? log.scheduledDate;
    const logBucket = log.bucket;
    return (
      logMedId === medId &&
      logDate === schedDate &&
      logBucket != null &&
      bucket != null &&
      logBucket.toLowerCase() === bucket.toLowerCase()
    );
  });
}

/**
 * Derives the effective status of a projected dose by joining against sparse intake logs
 * and applying out-of-window expiration rules at runtime.
 */
export function deriveEffectiveDose(
  projectedDose: ProjectedDose,
  intakeLogs: IntakeLogRecord[],
  now: Date
): EffectiveDose {
  const matchingLog = findMatchingIntakeLog(projectedDose, intakeLogs);

  const medId = projectedDose.medicineId ?? projectedDose.medicine_id ?? '';
  const medName = projectedDose.medicineName ?? projectedDose.medicine_name ?? '';
  const schedDate = projectedDose.scheduledDate ?? projectedDose.scheduled_date ?? '';
  const schedMin = projectedDose.scheduledMinutes ?? projectedDose.scheduled_minutes ?? 0;
  const strength = projectedDose.strength ?? null;
  const doseAmount = projectedDose.doseAmount ?? projectedDose.dose_amount ?? null;
  const bucket = projectedDose.bucket;
  const mealInstruction = projectedDose.mealInstruction ?? '';
  const isPrn = Boolean(projectedDose.isPrn);

  let status: 'pending' | 'taken' | 'skipped' | 'missed';
  let intakeLogId: string | null = null;
  let takenAt: string | null = null;
  let skipReason: string | null = null;

  if (matchingLog) {
    intakeLogId = matchingLog.id;
    if (matchingLog.status === 'taken') {
      status = 'taken';
      takenAt = matchingLog.taken_at ?? matchingLog.takenAt ?? null;
    } else {
      status = 'skipped';
      skipReason = matchingLog.skip_reason ?? matchingLog.skipReason ?? null;
    }
  } else {
    // Check if the input object already carries a stored settled status (e.g. legacy records)
    const existingStatus = (projectedDose as Partial<EffectiveDose>).status;
    if (existingStatus === 'taken' || existingStatus === 'skipped' || existingStatus === 'missed') {
      status = existingStatus;
      takenAt = (projectedDose as Partial<EffectiveDose>).takenAt ?? (projectedDose as Partial<EffectiveDose>).taken_at ?? null;
      skipReason = (projectedDose as Partial<EffectiveDose>).skipReason ?? (projectedDose as Partial<EffectiveDose>).skip_reason ?? null;
    } else if (isPrn) {
      status = 'pending';
    } else {
      const today = todayInAppTz(now);
      if (schedDate < today) {
        status = 'missed';
      } else if (schedDate === today) {
        const curMinutes = minutesInAppTz(now);
        if (curMinutes - schedMin > MISSED_AFTER_MINUTES) {
          status = 'missed';
        } else {
          status = 'pending';
        }
      } else {
        status = 'pending';
      }
    }
  }

  return {
    ...projectedDose,
    medicineId: medId,
    medicineName: medName,
    strength,
    doseAmount,
    scheduledDate: schedDate,
    scheduledMinutes: schedMin,
    bucket,
    mealInstruction,
    isPrn,
    status,
    intakeLogId,
    takenAt,
    skipReason,

    // Aliases
    taken_at: takenAt,
    skip_reason: skipReason,
    scheduled_date: schedDate,
    scheduled_minutes: schedMin,
    medicine_id: medId,
    medicine_name: medName,
    dose_amount: doseAmount,
  };
}

/**
 * Batch resolves effective doses for a list of projected doses.
 */
export function deriveEffectiveDoses(
  projectedDoses: ProjectedDose[],
  intakeLogs: IntakeLogRecord[],
  now: Date
): EffectiveDose[] {
  return projectedDoses.map((dose) => deriveEffectiveDose(dose, intakeLogs, now));
}

/**
 * Backwards-compatible runtime status derivation for legacy dose objects.
 */
export function deriveStatusOnRead(
  dose: {
    status: 'pending' | 'taken' | 'skipped' | 'missed';
    scheduled_date?: string;
    scheduled_minutes?: number;
    scheduledDate?: string;
    scheduledMinutes?: number;
  },
  now: Date
): 'pending' | 'taken' | 'skipped' | 'missed' {
  if (dose.status === 'taken' || dose.status === 'skipped' || dose.status === 'missed') {
    return dose.status;
  }

  const date = dose.scheduled_date ?? dose.scheduledDate ?? '';
  const minutes = dose.scheduled_minutes ?? dose.scheduledMinutes ?? 0;
  const today = todayInAppTz(now);

  if (date < today) {
    return 'missed';
  }
  if (date === today) {
    if (minutesInAppTz(now) - minutes > MISSED_AFTER_MINUTES) {
      return 'missed';
    }
  }
  return 'pending';
}

function formatMinutesToTime(minutes: number): string {
  const norm = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const mins = norm % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Pure function evaluating whether taking an overdue dose now carries a dose-stacking risk
 * with an upcoming scheduled dose (<4 hours / 240 minutes interval).
 */
export function evaluateLateDoseRisk(
  dose: EffectiveDose | ProjectedDose,
  nextScheduledDose: EffectiveDose | ProjectedDose | null,
  currentMinutes: number,
  thresholdMinutes: number = DOSE_STACKING_THRESHOLD_MINUTES
): LateDoseRiskResult {
  const medName = dose.medicineName ?? (dose as Partial<EffectiveDose>).medicine_name ?? 'this medicine';

  if (!nextScheduledDose) {
    return {
      riskLevel: 'safe',
      risk_level: 'safe',
      intervalMinutes: null,
      interval_minutes: null,
      message: `Safe to take ${medName}. No upcoming dose conflicts detected.`,
      recommendation: 'take_now',
    };
  }

  const doseDate = dose.scheduledDate ?? (dose as Partial<EffectiveDose>).scheduled_date;
  const nextDate = nextScheduledDose.scheduledDate ?? (nextScheduledDose as Partial<EffectiveDose>).scheduled_date;
  const nextMin = nextScheduledDose.scheduledMinutes ?? (nextScheduledDose as Partial<EffectiveDose>).scheduled_minutes ?? 0;

  let intervalMinutes: number;

  if (doseDate && nextDate && doseDate !== nextDate) {
    const d1 = fromAppDate(doseDate);
    const d2 = fromAppDate(nextDate);
    const days = Math.round((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
    intervalMinutes = 1440 - currentMinutes + nextMin + (days - 1) * 1440;
  } else {
    intervalMinutes = nextMin - currentMinutes;
  }

  const nextTimeFormatted = formatMinutesToTime(nextMin);

  if (intervalMinutes < thresholdMinutes) {
    let message: string;
    if (intervalMinutes <= 0) {
      message = `Your next scheduled dose of ${medName} is already due or past due at ${nextTimeFormatted}. To avoid taking a double dose, skip this overdue dose and take only your next scheduled dose.`;
    } else {
      const hours = Math.round((intervalMinutes / 60) * 10) / 10;
      message = `Taking ${medName} now is too close to your next scheduled dose at ${nextTimeFormatted} (in ${intervalMinutes} mins / ${hours} hrs). To avoid dose stacking, skip this overdue dose and resume your regular schedule.`;
    }

    return {
      riskLevel: 'warning_dose_stacking',
      risk_level: 'warning_dose_stacking',
      intervalMinutes,
      interval_minutes: intervalMinutes,
      message,
      recommendation: 'skip_and_resume',
    };
  }

  const hours = Math.round((intervalMinutes / 60) * 10) / 10;
  return {
    riskLevel: 'safe',
    risk_level: 'safe',
    intervalMinutes,
    interval_minutes: intervalMinutes,
    message: `Safe to take ${medName}. Next scheduled dose is at ${nextTimeFormatted} (in ${intervalMinutes} mins / ${hours} hrs), providing adequate spacing.`,
    recommendation: 'take_now',
  };
}

/**
 * Counts consecutive days where all scheduled doses are settled ('taken' or 'skipped' with valid reason).
 *
 * Rules:
 * - PRN medicines are excluded from streak evaluations.
 * - Days with no scheduled non-PRN doses are skipped without breaking the streak.
 * - Today is not penalized if still in progress (some doses still pending).
 * - Today is counted if all doses today are settled and valid.
 * - Walks backwards from today until the earliest recorded dosing date.
 */
export function calculateLoggingStreak(
  projectedDoses: ProjectedDose[],
  intakeLogs: IntakeLogRecord[],
  now: Date
): number {
  const effectiveDoses = deriveEffectiveDoses(projectedDoses, intakeLogs, now);

  const byDate = new Map<
    string,
    {
      total: number;
      settled: number;
      valid: number;
    }
  >();

  for (const dose of effectiveDoses) {
    if (dose.isPrn) continue;

    const date = dose.scheduledDate;
    if (!date) continue;

    const day = byDate.get(date) ?? { total: 0, settled: 0, valid: 0 };
    day.total++;

    if (dose.status === 'taken') {
      day.settled++;
      day.valid++;
    } else if (dose.status === 'skipped') {
      day.settled++;
      const hasReason = Boolean(dose.skipReason && dose.skipReason.trim().length > 0);
      if (hasReason) {
        day.valid++;
      }
    } else if (dose.status === 'missed') {
      day.settled++;
    }

    byDate.set(date, day);
  }

  const sortedDates = [...byDate.keys()].sort();
  const earliestDate = sortedDates[0];
  if (!earliestDate) return 0;

  const today = todayInAppTz(now);
  let streak = 0;
  let cursor = today;

  while (cursor >= earliestDate) {
    const day = byDate.get(cursor);

    if (day) {
      const isSettled = day.settled === day.total;
      const isValid = day.valid === day.total;

      if (cursor === today && !isSettled) {
        // Today is still in progress: don't count it, don't break the streak.
      } else if (isValid) {
        streak++;
      } else {
        break;
      }
    }

    cursor = addDaysAppTz(cursor, -1);
  }

  return streak;
}

/**
 * Calculates Two-Tier Adherence metrics:
 * 1. Clinical Adherence Rate (taken / scheduled) for doctor clinical evaluation (excluding PRN and future pending doses).
 * 2. Daily Logging Streak for patient habit formation.
 * 3. Aggregated documented skip reasons for doctor review.
 */
export function calculateTwoTierAdherence(
  projectedDoses: ProjectedDose[],
  intakeLogs: IntakeLogRecord[],
  range: { from: string; to: string },
  now: Date
): TwoTierAdherenceStats {
  const effectiveDoses = deriveEffectiveDoses(projectedDoses, intakeLogs, now);

  let scheduled = 0;
  let taken = 0;
  let skipped = 0;
  let missed = 0;
  const skipReasonsSummary: Record<string, number> = {};

  for (const dose of effectiveDoses) {
    // 1. Exclude PRN doses
    if (dose.isPrn) {
      continue;
    }

    // 2. Filter by date range
    const date = dose.scheduledDate;
    if (date < range.from || date > range.to) {
      continue;
    }

    // 3. Evaluate effective status
    if (dose.status === 'taken') {
      scheduled++;
      taken++;
    } else if (dose.status === 'skipped') {
      scheduled++;
      skipped++;
      const reason = (dose.skipReason && dose.skipReason.trim()) || 'Unspecified';
      skipReasonsSummary[reason] = (skipReasonsSummary[reason] ?? 0) + 1;
    } else if (dose.status === 'missed') {
      scheduled++;
      missed++;
    }
    // dose.status === 'pending': future or active grace window -> excluded from denominator
  }

  const clinicalAdherencePercentage =
    scheduled === 0 ? 0 : Math.round((taken / scheduled) * 100);

  const dailyLoggingStreak = calculateLoggingStreak(projectedDoses, intakeLogs, now);

  return {
    scheduled,
    taken,
    skipped,
    missed,
    clinicalAdherencePercentage,
    dailyLoggingStreak,
    skipReasonsSummary,

    // Aliases
    percentage: clinicalAdherencePercentage,
    streak: dailyLoggingStreak,
    loggingStreak: dailyLoggingStreak,
    clinical_percentage: clinicalAdherencePercentage,
    clinical_adherence_percentage: clinicalAdherencePercentage,
    daily_logging_streak: dailyLoggingStreak,
    skip_reasons_summary: skipReasonsSummary,
  };
}

/** Alias for calculateTwoTierAdherence matching ticket naming */
export const calculateAdherenceMetrics = calculateTwoTierAdherence;

/**
 * Legacy adherence calculation for backwards compatibility with pre-existing callers.
 */
export function calculateAdherence(
  doses: DoseRecord[],
  range: { from: string; to: string },
  now: Date
): AdherenceStats {
  let scheduled = 0;
  let taken = 0;
  let skipped = 0;
  let missed = 0;

  for (const dose of doses) {
    if (dose.is_prn) {
      continue;
    }

    if (dose.scheduled_date < range.from || dose.scheduled_date > range.to) {
      continue;
    }

    const status = deriveStatusOnRead(dose, now);

    if (status === 'taken') {
      scheduled++;
      taken++;
    } else if (status === 'skipped') {
      scheduled++;
      skipped++;
    } else if (status === 'missed') {
      scheduled++;
      missed++;
    }
  }

  const percentage = scheduled === 0 ? 0 : Math.round((taken / scheduled) * 100);

  return {
    scheduled,
    taken,
    skipped,
    missed,
    percentage,
  };
}

/**
 * Legacy adherence streak calculation for backwards compatibility with pre-existing callers.
 */
export function calculateAdherenceStreak(doses: DoseRecord[], now: Date): number {
  const byDate = new Map<string, { total: number; taken: number; settled: number }>();

  for (const dose of doses) {
    if (dose.is_prn) continue;

    const status = deriveStatusOnRead(dose, now);
    const day = byDate.get(dose.scheduled_date) ?? { total: 0, taken: 0, settled: 0 };
    day.total++;
    if (status === 'taken') {
      day.taken++;
      day.settled++;
    } else if (status === 'skipped' || status === 'missed') {
      day.settled++;
    }
    byDate.set(dose.scheduled_date, day);
  }

  const earliestDate = [...byDate.keys()].sort()[0];
  if (!earliestDate) return 0;

  const today = todayInAppTz(now);
  let streak = 0;
  let cursor = today;

  while (cursor >= earliestDate) {
    const day = byDate.get(cursor);

    if (day) {
      const isSettled = day.settled === day.total;
      const isPerfect = day.taken === day.total;

      if (cursor === today && !isSettled) {
        // Today is still in progress: don't count it, don't break the streak.
      } else if (isPerfect) {
        streak++;
      } else {
        break;
      }
    }

    cursor = addDaysAppTz(cursor, -1);
  }

  return streak;
}
