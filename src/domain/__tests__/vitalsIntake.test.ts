import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordGlucose, recordBloodPressure } from '../vitalsIntake';
import { createGlucoseReading, createBloodPressureReading } from '../../lib/db/vitals';

vi.mock('../../lib/db/vitals', () => ({
  createGlucoseReading: vi.fn(),
  createBloodPressureReading: vi.fn(),
}));

describe('vitalsIntake module', () => {
  const profileId = 'patient-profile-vitals';
  const userId = 'user-vitals';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordGlucose', () => {
    it('converts mmol/L to mg/dL, evaluates against ADA thresholds, and persists', async () => {
      vi.mocked(createGlucoseReading).mockImplementation(async (r) => ({
        ...r,
        id: 'mock-glucose-id',
      }));

      // 5.5 mmol/L fasting => 5.5 * 18.0182 = ~99 mg/dL => normal fasting
      const res = await recordGlucose({
        userId,
        profileId,
        value: 5.5,
        unit: 'mmol/L',
        type: 'fasting',
        notes: 'Morning test before breakfast',
      });

      expect(res.reading.value_mg_dl).toBe(99);
      expect(res.reading.notes).toBe('Morning test before breakfast');
      expect(res.evaluation.status).toBe('normal');
      expect(res.evaluation.tone).toBe('ok');
      expect(createGlucoseReading).toHaveBeenCalledWith(
        expect.objectContaining({
          value_mg_dl: 99,
          type: 'fasting',
        })
      );
    });

    it('evaluates severe hypoglycaemia properly in mg/dL', async () => {
      vi.mocked(createGlucoseReading).mockImplementation(async (r) => ({
        ...r,
        id: 'mock-glucose-id-2',
      }));

      const res = await recordGlucose({
        userId,
        profileId,
        value: 50,
        unit: 'mg/dL',
        type: 'random',
      });

      expect(res.reading.value_mg_dl).toBe(50);
      expect(res.evaluation.status).toBe('severe_hypoglycemia');
      expect(res.evaluation.tone).toBe('critical');
    });
  });

  describe('recordBloodPressure', () => {
    it('rounds numbers, classifies stage, and persists', async () => {
      vi.mocked(createBloodPressureReading).mockImplementation(async (r) => ({
        ...r,
        id: 'mock-bp-id',
      }));

      const res = await recordBloodPressure({
        userId,
        profileId,
        systolic: 145.4,
        diastolic: 94.8,
        pulse: 78.2,
        arm: 'left',
        posture: 'sitting',
        notes: 'Evening reading',
      });

      expect(res.reading.systolic).toBe(145);
      expect(res.reading.diastolic).toBe(95);
      expect(res.reading.pulse_bpm).toBe(78);
      expect(res.evaluation.stage).toBe('stage_2');
      expect(res.evaluation.tone).toBe('risk');
      expect(createBloodPressureReading).toHaveBeenCalledWith(
        expect.objectContaining({
          systolic: 145,
          diastolic: 95,
          pulse_bpm: 78,
          arm: 'left',
          posture: 'sitting',
        })
      );
    });
  });
});
