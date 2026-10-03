/**
 * Dose Schedule Generation & Virtual Projection.
 *
 * Implements deterministic virtual schedule projection per ADR 0001:
 * - Pure virtual projection: computes scheduled doses in-memory on demand with ZERO
 *   future rows written to the database.
 * - Enforces Horizon Rules:
 *   - Finite duration prescriptions project strictly up to min(durationDays, range.to).
 *   - Ongoing medicines project up to 7 days forward from `now` (unless dateRange specifies otherwise).
 *   - PRN medicines generate zero scheduled rows.
 * - Meal Timing Guidance:
 *   - Computes human-readable instruction notes tailored to buckets (e.g. "Take with or after breakfast",
 *     "Take on an empty stomach", "Take with or after dinner", "Take at bedtime with food").
 * - Adaptive Bedtime Bucket Support:
 *   - Correctly assigns 'bedtime' bucket when indicated by bedtime frequency (QHS, HS) or clinical instructions.
 * - Fully deterministic and timezone-safe via injected `now`.
 * - Maintains 100% backwards compatibility for callers of `buildSchedule`.
 */

import { addDaysAppTz, todayInAppTz, fromAppDate } from '../lib/time';
import { parseFrequency, defaultDoseTimes, type FrequencyCode } from './frequency';
import { computeEndDate, parseDuration } from './duration';
import { bucketOf, hasBedtimeBucket, requiresBedtime, type Bucket } from './timeBuckets';
import { mealRelationOf, morningDoseMinutes } from './mealRelation';

// ==========================================
// VIRTUAL SCHEDULE PROJECTION TYPES (ADR 0001)
// ==========================================

export interface ActiveMedicineRecord {
  id?: string;
  medicineId?: string;
  medicine_id?: string;
  name?: string;
  medicineName?: string;
  medicine_name?: string;
  strength?: string | null;
  doseAmount?: string | null;
  dose_amount?: string | null;
  frequencyCode?: FrequencyCode | null;
  frequency_code?: FrequencyCode | string | null;
  frequencyRaw?: string | null;
  frequency_raw?: string | null;
  frequency?: string | null;
  startDate?: string | null;
  start_date?: string | null;
  endDate?: string | null;
  end_date?: string | null;
  durationDays?: number | null;
  duration_days?: number | null;
  durationRaw?: string | null;
  duration_raw?: string | null;
  isOngoing?: boolean | null;
  is_ongoing?: boolean | null;
  isPrn?: boolean | null;
  is_prn?: boolean | null;
  withFood?: boolean | null;
  with_food?: boolean | null;
  doseTimes?: number[] | null;
  dose_times?: number[] | null;
  instructions?: string | null;
  notes?: string | null;
  direction?: string | null;
  directions?: string | null;
  discontinuedAt?: string | null;
  discontinued_at?: string | null;
  [key: string]: unknown;
}

export interface PatientRoutines {
  morning?: number; // minutes since midnight (0-1439)
  afternoon?: number;
  night?: number;
  bedtime?: number;
}

export interface DateRange {
  from: string; // 'YYYY-MM-DD'
  to: string; // 'YYYY-MM-DD'
}

export interface VirtualScheduleInput {
  activeMedicines: ActiveMedicineRecord[];
  dateRange?: DateRange;
  patientRoutines?: PatientRoutines;
  now?: Date;
}

export interface ProjectedDose {
  medicineId: string;
  medicineName: string;
  strength: string | null;
  doseAmount: string | null;
  scheduledDate: string; // 'YYYY-MM-DD'
  scheduledMinutes: number; // 0-1439
  bucket: Bucket; // 'morning' | 'afternoon' | 'night' | 'bedtime'
  mealInstruction: string;
  isPrn: boolean;

  // Convenience aliases for snake_case compatibility
  medicine_id?: string;
  medicine_name?: string;
  dose_amount?: string | null;
  scheduled_date?: string;
  scheduled_minutes?: number;
}

const SLOT = {
  earlyMorning: 480, // 08:00
  midday: 720, // 12:00
  afternoon: 840, // 14:00
  lateAfternoon: 960, // 16:00
  evening: 1200, // 20:00
  night: 1260, // 21:00
  bedtime: 1320, // 22:00
} as const;

/**
 * Derives patient-facing meal instructions based on food requirement, time bucket,
 * and any explicit clinical instructions provided by the doctor.
 */
export function deriveMealInstruction(
  withFood: boolean | null | undefined,
  bucket: Bucket,
  instructions?: string | null
): string {
  // If clinician provided specific instruction mentioning meal/food timing, honor it directly
  if (instructions && typeof instructions === 'string') {
    const trimmed = instructions.trim();
    if (/(breakfast|lunch|dinner|meal|food|empty\s*stomach|bedtime|snack)/i.test(trimmed)) {
      return trimmed;
    }
  }

  const relation = mealRelationOf(withFood);
  if (relation === 'empty_stomach') {
    return 'Take on an empty stomach';
  }

  if (relation === 'with_food') {
    switch (bucket) {
      case 'morning':
        return 'Take with or after breakfast';
      case 'afternoon':
        return 'Take with or after lunch';
      case 'night':
        return 'Take with or after dinner';
      case 'bedtime':
        return 'Take at bedtime with food';
    }
  }

  return 'Meal timing not specified — follow your doctor’s instructions';
}

function daysBetween(startStr: string, endStr: string): number {
  const dStart = fromAppDate(startStr);
  const dEnd = fromAppDate(endStr);
  return Math.round((dEnd.getTime() - dStart.getTime()) / (24 * 60 * 60 * 1000));
}

function resolveDoseTimesForMedicine(
  med: ActiveMedicineRecord,
  freqCode: FrequencyCode | null,
  withFood: boolean | null | undefined,
  rawFreq: string | null | undefined,
  patientRoutines?: PatientRoutines
): number[] {
  const explicitTimes = med.doseTimes ?? med.dose_times;
  if (Array.isArray(explicitTimes) && explicitTimes.length > 0) {
    return explicitTimes;
  }

  if (!freqCode) return [];
  if (freqCode === 'PRN' || freqCode === 'SOS') return [];

  if (patientRoutines) {
    const morningSlot = patientRoutines.morning ?? morningDoseMinutes(withFood);
    const afternoonSlot = patientRoutines.afternoon ?? SLOT.afternoon;
    const nightSlot = patientRoutines.night ?? SLOT.night;
    const bedtimeSlot = patientRoutines.bedtime ?? SLOT.bedtime;

    switch (freqCode) {
      case 'OD':
        return [morningSlot];
      case 'BD':
        return [morningSlot, nightSlot];
      case 'TDS':
        return [
          patientRoutines.morning ?? SLOT.earlyMorning,
          afternoonSlot,
          patientRoutines.night ?? SLOT.evening,
        ];
      case 'QID':
        return [
          patientRoutines.morning ?? SLOT.earlyMorning,
          SLOT.midday,
          SLOT.lateAfternoon,
          patientRoutines.night ?? SLOT.evening,
        ];
      case 'QHS':
        return [bedtimeSlot];
      case 'STAT':
      case 'WEEKLY':
      case 'CUSTOM':
        return [morningSlot];
    }
  }

  return defaultDoseTimes(freqCode, withFood, rawFreq);
}

/**
 * Pure Deterministic Schedule Projection Engine adhering to ADR 0001.
 *
 * Computes scheduled dose items dynamically in memory for any active medicine list,
 * date range, and patient routine settings.
 */
export function projectSchedule(input: VirtualScheduleInput): ProjectedDose[] {
  const now = input.now ?? new Date();
  const today = todayInAppTz(now);

  const defaultFrom = today;
  const defaultTo = addDaysAppTz(today, 6); // 7-day rolling window: day 0 to day 6 (7 days)

  const rangeFrom = input.dateRange?.from ?? defaultFrom;
  const rangeTo = input.dateRange?.to ?? defaultTo;

  if (rangeFrom > rangeTo) {
    return [];
  }

  const activeMedicines = input.activeMedicines || [];
  const regimenHasBedtime = hasBedtimeBucket(activeMedicines);
  const results: ProjectedDose[] = [];

  for (const med of activeMedicines) {
    // 1. Check if PRN
    const isPrn =
      med.isPrn === true ||
      med.is_prn === true ||
      med.frequencyCode === 'PRN' ||
      med.frequencyCode === 'SOS' ||
      med.frequency_code === 'PRN' ||
      med.frequency_code === 'SOS';

    const rawFreq = med.frequencyRaw ?? med.frequency_raw ?? med.frequency;
    const freqCode =
      (med.frequencyCode as FrequencyCode) ??
      (med.frequency_code as FrequencyCode) ??
      parseFrequency(rawFreq);

    if (isPrn || freqCode === 'PRN' || freqCode === 'SOS') {
      // PRN medicines generate zero scheduled rows
      continue;
    }

    // 2. Check if discontinued before requested range
    const disc = med.discontinuedAt ?? med.discontinued_at;
    if (disc) {
      const discDate = disc.slice(0, 10);
      if (discDate < rangeFrom) {
        continue;
      }
    }

    // 3. Resolve start date
    const medStartDate = med.startDate ?? med.start_date ?? today;

    // 4. Resolve ongoing vs finite duration
    const rawDuration = med.durationRaw ?? med.duration_raw;
    const parsedDur = parseDuration(rawDuration);

    let isOngoing = med.isOngoing ?? med.is_ongoing;
    if (isOngoing === undefined || isOngoing === null) {
      isOngoing = parsedDur.kind === 'ongoing';
    }

    let durationDays = med.durationDays ?? med.duration_days;
    if (durationDays === undefined || durationDays === null) {
      if (parsedDur.kind === 'days') {
        durationDays = parsedDur.days;
      }
    }

    const medEndDate = med.endDate ?? med.end_date;

    // Non-ongoing medicine with no duration and no end date generates zero rows
    if (
      !isOngoing &&
      (durationDays === null || durationDays === undefined || durationDays <= 0) &&
      !medEndDate
    ) {
      continue;
    }

    // Compute course end date for finite prescriptions
    let courseEndDate: string | null = null;
    if (!isOngoing) {
      if (durationDays && durationDays > 0) {
        courseEndDate = computeEndDate(medStartDate, durationDays);
        if (medEndDate && medEndDate < courseEndDate) {
          courseEndDate = medEndDate;
        }
      } else if (medEndDate) {
        courseEndDate = medEndDate;
      }
    }

    // If discontinued, cap the course end date
    if (disc) {
      const discDate = disc.slice(0, 10);
      if (!courseEndDate || discDate < courseEndDate) {
        courseEndDate = discDate;
      }
    }

    // 5. Effective range bounds
    const effectiveStart = medStartDate > rangeFrom ? medStartDate : rangeFrom;
    const effectiveEnd =
      !isOngoing && courseEndDate
        ? courseEndDate < rangeTo
          ? courseEndDate
          : rangeTo
        : courseEndDate && courseEndDate < rangeTo
          ? courseEndDate
          : rangeTo;

    if (effectiveStart > effectiveEnd) {
      continue;
    }

    // 6. Dose times
    const withFood = med.withFood ?? med.with_food;
    const doseTimes = resolveDoseTimesForMedicine(
      med,
      freqCode,
      withFood,
      rawFreq,
      input.patientRoutines
    );

    if (doseTimes.length === 0) {
      continue;
    }

    const medicineId = med.medicineId ?? med.medicine_id ?? med.id ?? '';
    const medicineName = med.medicineName ?? med.medicine_name ?? med.name ?? '';
    const strength = med.strength ?? null;
    const doseAmount = med.doseAmount ?? med.dose_amount ?? null;
    const medRequiresBedtime = requiresBedtime(med);
    const useBedtime = regimenHasBedtime || medRequiresBedtime;

    // Helper to push a dose
    const pushDose = (scheduledDate: string, minutes: number) => {
      const bucket = bucketOf(minutes, useBedtime);
      const mealInstruction = deriveMealInstruction(withFood, bucket, med.instructions);
      results.push({
        medicineId,
        medicineName,
        strength,
        doseAmount,
        scheduledDate,
        scheduledMinutes: minutes,
        bucket,
        mealInstruction,
        isPrn: false,
        scheduled_date: scheduledDate,
        scheduled_minutes: minutes,
      });
    };

    // 7. Generate based on frequency pattern
    if (freqCode === 'STAT') {
      if (medStartDate >= rangeFrom && medStartDate <= effectiveEnd) {
        const firstTime = doseTimes[0] ?? 540;
        pushDose(medStartDate, firstTime);
      }
      continue;
    }

    if (freqCode === 'WEEKLY') {
      let k = 0;
      if (medStartDate < effectiveStart) {
        const diff = daysBetween(medStartDate, effectiveStart);
        k = Math.ceil(diff / 7);
      }
      let curDate = addDaysAppTz(medStartDate, k * 7);
      while (curDate <= effectiveEnd) {
        for (const minutes of doseTimes) {
          pushDose(curDate, minutes);
        }
        k++;
        curDate = addDaysAppTz(medStartDate, k * 7);
      }
      continue;
    }

    // Daily codes (OD, BD, TDS, QID, QHS, CUSTOM, etc.)
    const totalDays = daysBetween(effectiveStart, effectiveEnd);
    for (let offset = 0; offset <= totalDays; offset++) {
      const curDate = addDaysAppTz(effectiveStart, offset);
      for (const minutes of doseTimes) {
        pushDose(curDate, minutes);
      }
    }
  }

  // 8. Deterministic chronological sort
  results.sort((a, b) => {
    const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
    if (dateCmp !== 0) return dateCmp;
    const minCmp = a.scheduledMinutes - b.scheduledMinutes;
    if (minCmp !== 0) return minCmp;
    const nameCmp = a.medicineName.localeCompare(b.medicineName);
    if (nameCmp !== 0) return nameCmp;
    return a.medicineId.localeCompare(b.medicineId);
  });

  return results;
}

// ==========================================
// LEGACY BUILD SCHEDULE (Backwards-compatible)
// ==========================================

export interface ScheduleGenerationInput {
  medicineId: string;
  startDate: string; // 'YYYY-MM-DD'
  durationDays: number | null;
  isOngoing: boolean;
  doseTimes: number[]; // array of minutes since midnight, e.g. [540, 1260]
  now: Date; // injected clock
  /**
   * Frequency code, when known. Controls the repeat interval:
   * WEEKLY → every 7 days, STAT → one dose only, everything else → daily.
   * Omitted or null is treated as daily, matching the doseTimes contract.
   */
  frequencyCode?: FrequencyCode | null;
}

export interface ScheduledDoseItem {
  scheduled_date: string;
  scheduled_minutes: number;
}

const MAX_DURATION_DAYS = 365;
const ONGOING_HORIZON_DAYS = 30;

/**
 * Days between consecutive dosing days for a frequency code.
 * Codes that describe several doses *within* one day (BD/TDS/QID) still dose
 * every day — their multiplicity lives in `doseTimes`, not in this interval.
 */
function dayIntervalFor(code: FrequencyCode | null | undefined): number {
  return code === 'WEEKLY' ? 7 : 1;
}

/** True when the code means "one dose, once" rather than a repeating course. */
function isSingleDose(code: FrequencyCode | null | undefined): boolean {
  return code === 'STAT';
}

export function buildSchedule(input: ScheduleGenerationInput): ScheduledDoseItem[] {
  const { startDate, durationDays, isOngoing, doseTimes, frequencyCode } = input;

  // 1. If no dose times provided (e.g. PRN/SOS), generate zero doses
  if (!doseTimes || doseTimes.length === 0) {
    return [];
  }

  // 2. A single immediate dose never repeats, whatever the duration says.
  if (isSingleDose(frequencyCode)) {
    const firstTime = doseTimes[0];
    return firstTime === undefined
      ? []
      : [{ scheduled_date: startDate, scheduled_minutes: firstTime }];
  }

  // 3. If non-ongoing and durationDays is null or <= 0, generate zero doses
  if (!isOngoing && (durationDays === null || durationDays <= 0)) {
    return [];
  }

  const daysToCover = isOngoing
    ? ONGOING_HORIZON_DAYS
    : Math.min(durationDays as number, MAX_DURATION_DAYS);

  const interval = dayIntervalFor(frequencyCode);
  const results: ScheduledDoseItem[] = [];

  for (let dayOffset = 0; dayOffset < daysToCover; dayOffset += interval) {
    const scheduledDate = addDaysAppTz(startDate, dayOffset);
    for (const minutes of doseTimes) {
      results.push({
        scheduled_date: scheduledDate,
        scheduled_minutes: minutes,
      });
    }
  }

  return results;
}
