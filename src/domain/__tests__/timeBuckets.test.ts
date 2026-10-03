import { describe, it, expect } from 'vitest';
import {
  bucketOf,
  resolveActiveBuckets,
  hasBedtimeBucket,
  requiresBedtime,
  getBucketTimeRange,
  Bucket,
  BUCKET_DEFINITIONS,
  DEFAULT_BUCKETS,
  ALL_BUCKETS,
  BUCKET_ORDER,
} from '../timeBuckets';

describe('timeBuckets (src/domain/timeBuckets.ts)', () => {
  describe('Constants & Metadata', () => {
    it('defines standard default 3-bucket order and adaptive 4-bucket array', () => {
      expect(DEFAULT_BUCKETS).toEqual(['morning', 'afternoon', 'night']);
      expect(ALL_BUCKETS).toEqual(['morning', 'afternoon', 'night', 'bedtime']);
      expect(BUCKET_ORDER).toEqual(['morning', 'afternoon', 'night', 'bedtime']);
    });

    it('contains canonical clinical definitions for all 4 buckets', () => {
      expect(BUCKET_DEFINITIONS.morning).toEqual({
        label: 'Morning',
        timeRange: '05:00 – 11:59',
        startHour: 5,
        endHour: 11,
        startMinute: 300,
        endMinute: 719,
      });

      expect(BUCKET_DEFINITIONS.afternoon).toEqual({
        label: 'Afternoon',
        timeRange: '12:00 – 16:59',
        startHour: 12,
        endHour: 16,
        startMinute: 720,
        endMinute: 1019,
      });

      expect(BUCKET_DEFINITIONS.night).toEqual({
        label: 'Night',
        timeRange: '17:00 – 21:59',
        startHour: 17,
        endHour: 21,
        startMinute: 1020,
        endMinute: 1319,
      });

      expect(BUCKET_DEFINITIONS.bedtime).toEqual({
        label: 'Bedtime',
        timeRange: '22:00 – 04:59',
        startHour: 22,
        endHour: 4,
        startMinute: 1320,
        endMinute: 299,
      });
    });

    it('returns adaptive time range string via getBucketTimeRange', () => {
      // When bedtime is not active, night expands to 17:00 – 04:59
      expect(getBucketTimeRange('night', false)).toBe('17:00 – 04:59');
      // When bedtime is active, night is 17:00 – 21:59
      expect(getBucketTimeRange('night', true)).toBe('17:00 – 21:59');

      expect(getBucketTimeRange('morning')).toBe('05:00 – 11:59');
      expect(getBucketTimeRange('afternoon')).toBe('12:00 – 16:59');
      expect(getBucketTimeRange('bedtime')).toBe('22:00 – 04:59');
    });
  });

  describe('Standard 3-Bucket Topology (hasBedtime = false / default)', () => {
    it('maps specific sample times to their correct 3-bucket partition', () => {
      // 05:00 (300 min) -> morning
      expect(bucketOf(300)).toBe('morning');
      // 09:00 (540 min) -> morning
      expect(bucketOf(540)).toBe('morning');
      // 11:59 (719 min) -> morning
      expect(bucketOf(719)).toBe('morning');

      // 12:00 (720 min) -> afternoon
      expect(bucketOf(720)).toBe('afternoon');
      // 14:00 (840 min) -> afternoon
      expect(bucketOf(840)).toBe('afternoon');
      // 16:59 (1019 min) -> afternoon
      expect(bucketOf(1019)).toBe('afternoon');

      // 17:00 (1020 min) -> night
      expect(bucketOf(1020)).toBe('night');
      // 19:30 (1170 min) -> night
      expect(bucketOf(1170)).toBe('night');
      // 20:59 (1259 min) -> night
      expect(bucketOf(1259)).toBe('night');
      // 21:00 (1260 min) -> night
      expect(bucketOf(1260)).toBe('night');
      // 21:59 (1319 min) -> night
      expect(bucketOf(1319)).toBe('night');

      // 22:00 (1320 min) -> night (in 3-bucket topology)
      expect(bucketOf(1320)).toBe('night');
      // 23:59 (1439 min) -> night
      expect(bucketOf(1439)).toBe('night');
      // 00:00 (0 min) -> night (wraps midnight)
      expect(bucketOf(0)).toBe('night');
      // 04:59 (299 min) -> night
      expect(bucketOf(299)).toBe('night');
    });

    it('exhaustively partitions all 1,440 minutes into exactly 3 buckets', () => {
      const validBuckets = new Set<Bucket>(['morning', 'afternoon', 'night']);
      let morningCount = 0;
      let afternoonCount = 0;
      let nightCount = 0;

      for (let minute = 0; minute < 1440; minute++) {
        const bucket = bucketOf(minute, false);
        expect(validBuckets.has(bucket)).toBe(true);

        if (bucket === 'morning') morningCount++;
        if (bucket === 'afternoon') afternoonCount++;
        if (bucket === 'night') nightCount++;
      }

      // morning: 300 to 719 = 420 minutes
      expect(morningCount).toBe(420);
      // afternoon: 720 to 1019 = 300 minutes
      expect(afternoonCount).toBe(300);
      // night: (1440 - 1020) + 300 = 420 + 300 = 720 minutes
      expect(nightCount).toBe(720);

      // Sum must equal total minutes in a day
      expect(morningCount + afternoonCount + nightCount).toBe(1440);
    });
  });

  describe('Adaptive 4-Bucket Topology (hasBedtime = true)', () => {
    it('correctly isolates bedtime from night window', () => {
      // Morning window: 05:00 - 11:59 (300 - 719)
      expect(bucketOf(300, true)).toBe('morning');
      expect(bucketOf(719, true)).toBe('morning');

      // Afternoon window: 12:00 - 16:59 (720 - 1019)
      expect(bucketOf(720, true)).toBe('afternoon');
      expect(bucketOf(1019, true)).toBe('afternoon');

      // Night window: 17:00 - 21:59 (1020 - 1319)
      expect(bucketOf(1020, true)).toBe('night');
      expect(bucketOf(1200, true)).toBe('night');
      expect(bucketOf(1319, true)).toBe('night');

      // Bedtime window: 22:00 - 04:59 (1320 - 1439 and 0 - 299)
      expect(bucketOf(1320, true)).toBe('bedtime');
      expect(bucketOf(1380, true)).toBe('bedtime'); // 23:00
      expect(bucketOf(1439, true)).toBe('bedtime'); // 23:59
      expect(bucketOf(0, true)).toBe('bedtime'); // 00:00 midnight
      expect(bucketOf(150, true)).toBe('bedtime'); // 02:30
      expect(bucketOf(299, true)).toBe('bedtime'); // 04:59
    });

    it('accurately distinguishes critical boundaries when bedtime is active', () => {
      // 04:59 -> bedtime; 05:00 -> morning
      expect(bucketOf(299, true)).toBe('bedtime');
      expect(bucketOf(300, true)).toBe('morning');

      // 11:59 -> morning; 12:00 -> afternoon
      expect(bucketOf(719, true)).toBe('morning');
      expect(bucketOf(720, true)).toBe('afternoon');

      // 16:59 -> afternoon; 17:00 -> night
      expect(bucketOf(1019, true)).toBe('afternoon');
      expect(bucketOf(1020, true)).toBe('night');

      // 21:59 -> night; 22:00 -> bedtime
      expect(bucketOf(1319, true)).toBe('night');
      expect(bucketOf(1320, true)).toBe('bedtime');
    });

    it('exhaustively partitions all 1,440 minutes into exactly 4 buckets', () => {
      const validBuckets = new Set<Bucket>(['morning', 'afternoon', 'night', 'bedtime']);
      let morningCount = 0;
      let afternoonCount = 0;
      let nightCount = 0;
      let bedtimeCount = 0;

      for (let minute = 0; minute < 1440; minute++) {
        const bucket = bucketOf(minute, true);
        expect(validBuckets.has(bucket)).toBe(true);

        if (bucket === 'morning') morningCount++;
        if (bucket === 'afternoon') afternoonCount++;
        if (bucket === 'night') nightCount++;
        if (bucket === 'bedtime') bedtimeCount++;
      }

      // morning: 300 to 719 = 420 minutes (7 hours)
      expect(morningCount).toBe(420);
      // afternoon: 720 to 1019 = 300 minutes (5 hours)
      expect(afternoonCount).toBe(300);
      // night: 1020 to 1319 = 300 minutes (5 hours: 17:00 - 21:59)
      expect(nightCount).toBe(300);
      // bedtime: (1440 - 1320) + 300 = 120 + 300 = 420 minutes (7 hours: 22:00 - 04:59)
      expect(bedtimeCount).toBe(420);

      // Sum of all 4 buckets must equal 1,440
      expect(morningCount + afternoonCount + nightCount + bedtimeCount).toBe(1440);
    });
  });

  describe('Cross-Midnight & Out-of-Bounds Arithmetic', () => {
    it('handles negative minute values across midnight correctly', () => {
      // -1 min is 23:59 previous day (1439 normalized)
      expect(bucketOf(-1, false)).toBe('night');
      expect(bucketOf(-1, true)).toBe('bedtime');

      // -60 min is 23:00 previous day (1380 normalized)
      expect(bucketOf(-60, false)).toBe('night');
      expect(bucketOf(-60, true)).toBe('bedtime');

      // -121 min is 21:59 previous day (1319 normalized)
      expect(bucketOf(-121, false)).toBe('night');
      expect(bucketOf(-121, true)).toBe('night');

      // -720 min is 12:00 previous day (720 normalized)
      expect(bucketOf(-720, false)).toBe('afternoon');
      expect(bucketOf(-720, true)).toBe('afternoon');

      // -1140 min is 05:00 previous day (300 normalized)
      expect(bucketOf(-1140, false)).toBe('morning');
      expect(bucketOf(-1140, true)).toBe('morning');
    });

    it('handles minute values greater than 1,440 correctly', () => {
      // 1440 min is 00:00 next day (0 normalized)
      expect(bucketOf(1440, false)).toBe('night');
      expect(bucketOf(1440, true)).toBe('bedtime');

      // 1740 min is 05:00 next day (300 normalized)
      expect(bucketOf(1740, false)).toBe('morning');
      expect(bucketOf(1740, true)).toBe('morning');

      // 2160 min is 12:00 next day (720 normalized)
      expect(bucketOf(2160, false)).toBe('afternoon');
      expect(bucketOf(2160, true)).toBe('afternoon');

      // 2460 min is 17:00 next day (1020 normalized)
      expect(bucketOf(2460, false)).toBe('night');
      expect(bucketOf(2460, true)).toBe('night');

      // 2760 min is 22:00 next day (1320 normalized)
      expect(bucketOf(2760, false)).toBe('night');
      expect(bucketOf(2760, true)).toBe('bedtime');
    });

    it('handles fractional / floating point minutes cleanly', () => {
      expect(bucketOf(299.9, true)).toBe('bedtime');
      expect(bucketOf(300.1, true)).toBe('morning');
      expect(bucketOf(719.8, true)).toBe('morning');
      expect(bucketOf(720.2, true)).toBe('afternoon');
      expect(bucketOf(1019.9, true)).toBe('afternoon');
      expect(bucketOf(1020.1, true)).toBe('night');
      expect(bucketOf(1319.9, true)).toBe('night');
      expect(bucketOf(1320.0, true)).toBe('bedtime');
    });
  });

  describe('Bedtime Clinical Detection (requiresBedtime & hasBedtimeBucket)', () => {
    it('detects bedtime requirement via frequency codes', () => {
      expect(requiresBedtime({ frequency_code: 'HS' })).toBe(true);
      expect(requiresBedtime({ frequency_code: 'hs' })).toBe(true);
      expect(requiresBedtime({ frequency_code: 'QHS' })).toBe(true);
      expect(requiresBedtime({ frequency_code: 'qhs' })).toBe(true);
      expect(requiresBedtime({ frequency_code: 'BEDTIME' })).toBe(true);
      expect(requiresBedtime({ frequency_code: 'BT' })).toBe(true);

      // Non-bedtime codes
      expect(requiresBedtime({ frequency_code: 'OD' })).toBe(false);
      expect(requiresBedtime({ frequency_code: 'BD' })).toBe(false);
      expect(requiresBedtime({ frequency_code: 'TDS' })).toBe(false);
      expect(requiresBedtime({ frequency_code: 'QID' })).toBe(false);
      expect(requiresBedtime({ frequency_code: 'PRN' })).toBe(false);
    });

    it('detects bedtime requirement via clinical instruction notes', () => {
      expect(requiresBedtime({ instructions: 'Take 1 tablet before sleep' })).toBe(true);
      expect(requiresBedtime({ instructions: 'Take 1 tablet before sleeping' })).toBe(true);
      expect(requiresBedtime({ instructions: 'Take 2 pills at bedtime with water' })).toBe(true);
      expect(requiresBedtime({ instructions: 'Take at bed time' })).toBe(true);
      expect(requiresBedtime({ instructions: 'Take 1 tablet before bed' })).toBe(true);
      expect(requiresBedtime({ instructions: 'Before going to bed' })).toBe(true);
      expect(requiresBedtime({ instructions: '1 tab nocte' })).toBe(true);
      expect(requiresBedtime({ instructions: 'hora somni' })).toBe(true);
      expect(requiresBedtime({ instructions: 'raat ko sone se pehle' })).toBe(true);
      expect(requiresBedtime({ instructions: 'sote waqt' })).toBe(true);
    });

    it('detects bedtime requirement via raw frequency strings', () => {
      expect(requiresBedtime({ frequency_raw: 'at bedtime' })).toBe(true);
      expect(requiresBedtime({ frequency_raw: 'QHS' })).toBe(true);
      expect(requiresBedtime({ frequency_raw: 'hs' })).toBe(true);
      expect(requiresBedtime({ frequency_raw: 'before sleep' })).toBe(true);
    });

    it('does not false-positive on general night or evening instructions', () => {
      expect(requiresBedtime({ instructions: 'Take 1 tablet at night with food' })).toBe(false);
      expect(requiresBedtime({ instructions: 'Take after dinner' })).toBe(false);
      expect(requiresBedtime({ instructions: 'In the evening' })).toBe(false);
      expect(requiresBedtime({ instructions: 'With breakfast in the morning' })).toBe(false);
      expect(requiresBedtime({ instructions: 'Take twice daily' })).toBe(false);
    });

    it('safely handles null, undefined, or empty candidates', () => {
      expect(requiresBedtime(null)).toBe(false);
      expect(requiresBedtime(undefined)).toBe(false);
      expect(requiresBedtime({})).toBe(false);
      expect(requiresBedtime({ instructions: null, frequency_code: null })).toBe(false);
    });

    it('evaluates medication lists via hasBedtimeBucket', () => {
      expect(hasBedtimeBucket([])).toBe(false);
      expect(hasBedtimeBucket(null)).toBe(false);
      expect(hasBedtimeBucket(undefined)).toBe(false);

      const regularList = [
        { medicine_name: 'Metformin', frequency_code: 'BD' },
        { medicine_name: 'Atorvastatin', frequency_code: 'OD' },
      ];
      expect(hasBedtimeBucket(regularList)).toBe(false);

      const withBedtimeList = [
        { medicine_name: 'Metformin', frequency_code: 'BD' },
        { medicine_name: 'Zolpidem', frequency_code: 'HS' },
      ];
      expect(hasBedtimeBucket(withBedtimeList)).toBe(true);
    });
  });

  describe('Adaptive Presence: resolveActiveBuckets', () => {
    it('returns default 3 buckets for empty or non-bedtime medicine lists', () => {
      expect(resolveActiveBuckets()).toEqual(['morning', 'afternoon', 'night']);
      expect(resolveActiveBuckets([])).toEqual(['morning', 'afternoon', 'night']);
      expect(resolveActiveBuckets(null)).toEqual(['morning', 'afternoon', 'night']);

      const standardRegimen = [
        { medicine_name: 'Aspirin', frequency_code: 'OD' },
        { medicine_name: 'Amoxicillin', frequency_code: 'TDS' },
      ];
      expect(resolveActiveBuckets(standardRegimen)).toEqual(['morning', 'afternoon', 'night']);
    });

    it('appends bedtime if and only if at least one medicine requires bedtime', () => {
      const regimenWithHS = [
        { medicine_name: 'Aspirin', frequency_code: 'OD' },
        { medicine_name: 'Clonazepam', frequency_code: 'HS' },
      ];
      expect(resolveActiveBuckets(regimenWithHS)).toEqual([
        'morning',
        'afternoon',
        'night',
        'bedtime',
      ]);

      const regimenWithInstruction = [
        { medicine_name: 'Melatonin', instructions: 'Take 1 gummy before sleep' },
      ];
      expect(resolveActiveBuckets(regimenWithInstruction)).toEqual([
        'morning',
        'afternoon',
        'night',
        'bedtime',
      ]);
    });

    it('maintains array immutability and order', () => {
      const result1 = resolveActiveBuckets([]);
      result1.push('bedtime');

      const result2 = resolveActiveBuckets([]);
      expect(result2).toEqual(['morning', 'afternoon', 'night']);
      expect(DEFAULT_BUCKETS).toEqual(['morning', 'afternoon', 'night']);
    });
  });

  describe('bucketOf Call Signatures & Interoperability', () => {
    it('supports direct boolean flag', () => {
      expect(bucketOf(1320, true)).toBe('bedtime');
      expect(bucketOf(1320, false)).toBe('night');
    });

    it('supports options object', () => {
      expect(bucketOf(1320, { hasBedtime: true })).toBe('bedtime');
      expect(bucketOf(1320, { hasBedtime: false })).toBe('night');
    });

    it('supports passing activeMedicines array directly', () => {
      expect(bucketOf(1320, [{ frequency_code: 'HS' }])).toBe('bedtime');
      expect(bucketOf(1320, [{ frequency_code: 'OD' }])).toBe('night');
    });

    it('defaults to 3-bucket topology when context is omitted', () => {
      expect(bucketOf(1320)).toBe('night');
      expect(bucketOf(0)).toBe('night');
    });
  });
});
