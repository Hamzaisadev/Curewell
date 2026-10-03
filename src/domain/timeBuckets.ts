/**
 * Time Buckets for Schedule Segmentation.
 *
 * Implements an adaptive 3+1 bucket topology for patient medication scheduling
 * (Morning, Afternoon, Night, and optional Bedtime).
 *
 * Partitions a 24-hour day (1,440 minutes) into distinct, clinical milestone windows:
 * - morning:   05:00 – 11:59 (300 – 719 min)   - Standard wake/breakfast window
 * - afternoon: 12:00 – 16:59 (720 – 1019 min)  - Lunch window
 * - night:     17:00 – 21:59 (1020 – 1319 min) - Dinner/evening window (or 17:00 – 04:59 when bedtime is inactive)
 * - bedtime:   22:00 – 04:59 (1320 – 1439 min and 0 – 299 min) - Optional pre-sleep window
 */

export type Bucket = 'morning' | 'afternoon' | 'night' | 'bedtime';

export interface BucketDefinition {
  label: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  startMinute: number;
  endMinute: number;
}

export const BUCKET_DEFINITIONS: Record<Bucket, BucketDefinition> = {
  morning: {
    label: 'Morning',
    timeRange: '05:00 – 11:59',
    startHour: 5,
    endHour: 11,
    startMinute: 300,
    endMinute: 719,
  },
  afternoon: {
    label: 'Afternoon',
    timeRange: '12:00 – 16:59',
    startHour: 12,
    endHour: 16,
    startMinute: 720,
    endMinute: 1019,
  },
  night: {
    label: 'Night',
    timeRange: '17:00 – 21:59',
    startHour: 17,
    endHour: 21,
    startMinute: 1020,
    endMinute: 1319,
  },
  bedtime: {
    label: 'Bedtime',
    timeRange: '22:00 – 04:59',
    startHour: 22,
    endHour: 4,
    startMinute: 1320,
    endMinute: 299,
  },
};

export const DEFAULT_BUCKETS: Bucket[] = ['morning', 'afternoon', 'night'];
export const ALL_BUCKETS: Bucket[] = ['morning', 'afternoon', 'night', 'bedtime'];
export const BUCKET_ORDER: Bucket[] = ['morning', 'afternoon', 'night', 'bedtime'];

/**
 * Regex matching clinical indications of bedtime administration in frequencies or instructions.
 * Matches:
 * - 'hs', 'qhs' (hora somni / quaque hora somni)
 * - 'bedtime', 'bed time', 'at bedtime'
 * - 'before sleep', 'before sleeping', 'before bed', 'before going to bed'
 * - 'sone se pehle', 'sote waqt' (Urdu / Hindi dialect)
 * - 'nocte' (Latin nocte = at night/sleep)
 * - 'hora somni'
 */
const BEDTIME_REGEX =
  /\b(q?hs|bed\s*time|before\s+(?:going\s+to\s+)?(?:bed|sleep(?:ing)?)|at\s+bed\s*time|sleep\s*time|sone\s+se\s+pehle|sote\s+waqt|hora\s+somni|nocte)\b/i;

const BEDTIME_FREQUENCY_CODES = new Set(['HS', 'QHS', 'BEDTIME', 'BT']);

export interface MedicineCandidate {
  frequency_code?: string | null;
  frequency_raw?: string | null;
  frequency?: string | null;
  instructions?: string | null;
  notes?: string | null;
  raw_instructions?: string | null;
  direction?: string | null;
  directions?: string | null;
  scheduled_minutes?: number | null;
  [key: string]: unknown;
}

/**
 * Pure predicate checking whether a single medicine explicitly requires bedtime administration.
 */
export function requiresBedtime(med: MedicineCandidate | null | undefined): boolean {
  if (!med || typeof med !== 'object') {
    return false;
  }

  // 1. Explicit frequency code check
  const code = (med.frequency_code ?? med.frequency ?? '').toString().trim().toUpperCase();
  if (BEDTIME_FREQUENCY_CODES.has(code)) {
    return true;
  }

  // 2. Free-text inspection across relevant clinical instruction/note fields
  const candidateTexts = [
    med.frequency_raw,
    med.frequency,
    med.instructions,
    med.notes,
    med.raw_instructions,
    med.direction,
    med.directions,
  ];

  for (const text of candidateTexts) {
    if (typeof text === 'string' && BEDTIME_REGEX.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Pure predicate checking whether an active medicine regimen contains at least one medicine
 * requiring bedtime administration.
 */
export function hasBedtimeBucket(activeMedicines?: MedicineCandidate[] | null): boolean {
  if (!activeMedicines || !Array.isArray(activeMedicines) || activeMedicines.length === 0) {
    return false;
  }
  return activeMedicines.some(requiresBedtime);
}

/**
 * Returns the active time buckets for a given list of active medicines.
 * Returns ['morning', 'afternoon', 'night'] by default, appending 'bedtime'
 * if and only if at least one medicine explicitly requires bedtime administration.
 */
export function resolveActiveBuckets(activeMedicines?: MedicineCandidate[] | null): Bucket[] {
  if (!activeMedicines || !Array.isArray(activeMedicines) || activeMedicines.length === 0) {
    return [...DEFAULT_BUCKETS];
  }

  const hasBedtime = activeMedicines.some(requiresBedtime);
  return hasBedtime ? [...ALL_BUCKETS] : [...DEFAULT_BUCKETS];
}

export type BucketOfOptions =
  | boolean
  | { hasBedtime?: boolean }
  | MedicineCandidate[];

/**
 * Returns the corresponding time bucket for a given minute of the day (0–1439).
 * Bucketing is strictly performed by integer comparison on `scheduled_minutes`.
 * Supports optional adaptive bedtime flag or medicine list.
 */
export function bucketOf(
  minutes: number,
  optionsOrHasBedtime?: BucketOfOptions
): Bucket {
  let hasBedtime = false;
  if (typeof optionsOrHasBedtime === 'boolean') {
    hasBedtime = optionsOrHasBedtime;
  } else if (Array.isArray(optionsOrHasBedtime)) {
    hasBedtime = hasBedtimeBucket(optionsOrHasBedtime);
  } else if (optionsOrHasBedtime && typeof optionsOrHasBedtime === 'object') {
    hasBedtime = Boolean(optionsOrHasBedtime.hasBedtime);
  }

  const norm = ((Math.floor(minutes) % 1440) + 1440) % 1440;

  if (norm >= 300 && norm <= 719) {
    return 'morning';
  }
  if (norm >= 720 && norm <= 1019) {
    return 'afternoon';
  }

  if (hasBedtime) {
    if (norm >= 1020 && norm <= 1319) {
      return 'night';
    }
    // 1320 to 1439 OR 0 to 299 (22:00 – 04:59)
    return 'bedtime';
  }

  // When bedtime is not active, night covers 17:00 – 04:59
  // 1020 to 1439 OR 0 to 299
  return 'night';
}

/**
 * Returns the formatted time range for a given bucket, respecting whether
 * bedtime is active.
 */
export function getBucketTimeRange(bucket: Bucket, hasBedtime: boolean = false): string {
  if (bucket === 'night' && !hasBedtime) {
    return '17:00 – 04:59';
  }
  return BUCKET_DEFINITIONS[bucket].timeRange;
}
