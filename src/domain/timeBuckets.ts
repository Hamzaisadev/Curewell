/**
 * Time Buckets for Schedule Segmentation.
 *
 * Partitions a 24-hour day (1,440 minutes) into 3 distinct, clinical buckets:
 * - morning:   05:00 – 11:59 (300 – 719)
 * - afternoon: 12:00 – 16:59 (720 – 1019)
 * - night:     17:00 – 04:59 (1020 – 1439 and 0 – 299)
 */

export type Bucket = 'morning' | 'afternoon' | 'night';

export const BUCKET_DEFINITIONS: Record<
  Bucket,
  { label: string; timeRange: string; startHour: number; endHour: number }
> = {
  morning: { label: 'Morning', timeRange: '05:00 – 11:59', startHour: 5, endHour: 11 },
  afternoon: { label: 'Afternoon', timeRange: '12:00 – 16:59', startHour: 12, endHour: 16 },
  night: { label: 'Night', timeRange: '17:00 – 04:59', startHour: 17, endHour: 4 },
};

export const BUCKET_ORDER: Bucket[] = ['morning', 'afternoon', 'night'];

/**
 * Returns the corresponding time bucket for a given minute of the day (0–1439).
 * Bucketing is strictly performed by integer comparison on `scheduled_minutes`.
 */
export function bucketOf(minutes: number): Bucket {
  const norm = ((minutes % 1440) + 1440) % 1440;

  if (norm >= 300 && norm <= 719) {
    return 'morning';
  }
  if (norm >= 720 && norm <= 1019) {
    return 'afternoon';
  }
  // 1020 to 1439 OR 0 to 299
  return 'night';
}
