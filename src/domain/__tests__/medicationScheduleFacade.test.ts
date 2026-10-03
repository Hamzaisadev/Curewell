import { describe, it, expect } from 'vitest';
import {
  buildDailyScheduleView,
  getUpcomingDose,
  checkDoseLateRisk,
  type DailyScheduleFacadeInput,
} from '../medicationScheduleFacade';
import type { IntakeLogRecord } from '../adherence';
import type { MedicineRecord } from '../activeMedicines';
import type { ActiveMedicineRecord } from '../schedule';

describe('medicationScheduleFacade (src/domain/medicationScheduleFacade.ts)', () => {
  // Base fixed clock: 2026-08-15 08:30 PKT (03:30 UTC) -> Morning window (510 min)
  const morningClock = new Date('2026-08-15T03:30:00Z');
  // Afternoon clock: 2026-08-15 12:30 PKT (07:30 UTC) -> Afternoon window (750 min)
  const afternoonClock = new Date('2026-08-15T07:30:00Z');
  // Evening clock: 2026-08-15 19:30 PKT (14:30 UTC) -> Night window (1170 min)
  const eveningClock = new Date('2026-08-15T14:30:00Z');
  // Late evening clock: 2026-08-15 22:30 PKT (17:30 UTC) -> Bedtime window (1350 min)
  const bedtimeClock = new Date('2026-08-15T17:30:00Z');

  describe('3-bucket vs Adaptive 4-bucket Regimens', () => {
    it('generates standard 3-bucket schedule when no bedtime medicines exist', () => {
      const medicines: MedicineRecord[] = [
        {
          id: 'med-1',
          medicine_name: 'Metformin',
          strength: '500mg',
          dose_amount: '1 tablet',
          frequency_code: 'OD',
          start_date: '2026-08-01',
          is_ongoing: true,
          with_food: true,
        },
        {
          id: 'med-2',
          medicine_name: 'Amoxicillin',
          strength: '250mg',
          dose_amount: '1 capsule',
          frequency_code: 'TDS',
          start_date: '2026-08-10',
          duration_days: 7,
          is_ongoing: false,
          with_food: false,
        },
      ];

      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-15',
        now: morningClock,
      };

      const view = buildDailyScheduleView(input);

      expect(view.targetDate).toBe('2026-08-15');
      expect(view.hasBedtime).toBe(false);
      expect(view.activeBuckets).toEqual(['morning', 'afternoon', 'night']);

      // Check buckets object contains only active buckets
      expect(Object.keys(view.buckets).sort()).toEqual(['afternoon', 'morning', 'night']);
      expect('bedtime' in view.buckets).toBe(false);

      // Verify doses partitioned into correct buckets
      // Metformin OD (with food) -> 09:00 (540 min) morning
      // Amoxicillin TDS -> 08:00 (480 min) morning, 14:00 (840 min) afternoon, 20:00 (1200 min) night
      expect(view.buckets.morning).toHaveLength(2);
      expect(view.buckets.afternoon).toHaveLength(1);
      expect(view.buckets.night).toHaveLength(1);

      expect(view.buckets.morning[0]?.medicineName).toBe('Amoxicillin');
      expect(view.buckets.morning[0]?.scheduledMinutes).toBe(480);
      expect(view.buckets.morning[1]?.medicineName).toBe('Metformin');
      expect(view.buckets.morning[1]?.scheduledMinutes).toBe(540);
      expect(view.buckets.morning[1]?.mealInstruction).toBe('Take with or after breakfast');

      expect(view.buckets.afternoon[0]?.medicineName).toBe('Amoxicillin');
      expect(view.buckets.afternoon[0]?.scheduledMinutes).toBe(840);

      expect(view.buckets.night[0]?.medicineName).toBe('Amoxicillin');
      expect(view.buckets.night[0]?.scheduledMinutes).toBe(1200);

      expect(view.stats.totalScheduled).toBe(4);
      expect(view.stats.pendingCount).toBe(4);
      expect(view.stats.actionableCount).toBe(4);
      expect(view.stats.takenCount).toBe(0);
    });

    it('adaptively adds bedtime bucket when a medicine requires bedtime administration (QHS code)', () => {
      const medicines: MedicineRecord[] = [
        {
          id: 'med-1',
          medicine_name: 'Metformin',
          frequency_code: 'OD',
          start_date: '2026-08-01',
          is_ongoing: true,
        },
        {
          id: 'med-bedtime',
          medicine_name: 'Atorvastatin',
          strength: '20mg',
          dose_amount: '1 tablet',
          frequency_code: 'QHS',
          start_date: '2026-08-01',
          is_ongoing: true,
          with_food: true,
        },
      ];

      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-15',
        now: morningClock,
      };

      const view = buildDailyScheduleView(input);

      expect(view.hasBedtime).toBe(true);
      expect(view.activeBuckets).toEqual(['morning', 'afternoon', 'night', 'bedtime']);
      expect('bedtime' in view.buckets).toBe(true);

      expect(view.buckets.bedtime).toHaveLength(1);
      const bedtimeDose = view.buckets.bedtime[0];
      expect(bedtimeDose?.medicineName).toBe('Atorvastatin');
      expect(bedtimeDose?.scheduledMinutes).toBe(1320); // 22:00
      expect(bedtimeDose?.bucket).toBe('bedtime');
      expect(bedtimeDose?.mealInstruction).toBe('Take at bedtime with food');

      expect(view.stats.totalScheduled).toBe(2);
    });

    it('adaptively adds bedtime bucket via free-text clinical instructions ("at bedtime")', () => {
      const medicines: ActiveMedicineRecord[] = [
        {
          id: 'med-free-text',
          medicine_name: 'Zolpidem',
          frequency_code: 'OD',
          instructions: 'Take 1 tablet at bedtime before sleep',
          start_date: '2026-08-01',
          is_ongoing: true,
        },
      ];

      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-15',
        now: morningClock,
      };

      const view = buildDailyScheduleView(input);
      expect(view.hasBedtime).toBe(true);
      expect(view.activeBuckets).toContain('bedtime');
      expect('bedtime' in view.buckets).toBe(true);
    });

    it('does NOT activate bedtime bucket if bedtime medicine was discontinued before target date', () => {
      const medicines: MedicineRecord[] = [
        {
          id: 'med-active',
          medicine_name: 'Metformin',
          frequency_code: 'OD',
          start_date: '2026-08-01',
          is_ongoing: true,
        },
        {
          id: 'med-disc',
          medicine_name: 'Atorvastatin',
          frequency_code: 'QHS',
          start_date: '2026-07-01',
          is_ongoing: true,
          discontinued_at: '2026-08-10T00:00:00Z', // Discontinued 5 days before targetDate
        },
      ];

      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-15',
        now: morningClock,
      };

      const view = buildDailyScheduleView(input);
      expect(view.hasBedtime).toBe(false);
      expect(view.activeBuckets).toEqual(['morning', 'afternoon', 'night']);
      expect('bedtime' in view.buckets).toBe(false);
      expect(view.stats.totalScheduled).toBe(1);
    });
  });

  describe('Placement into pastUnloggedDoses when bucket window passes', () => {
    const medicines: ActiveMedicineRecord[] = [
      {
        id: 'med-morning',
        medicine_name: 'Thyroxine',
        frequency_code: 'OD',
        start_date: '2026-08-01',
        is_ongoing: true,
        with_food: false, // 08:00 (480 min) empty stomach
      },
      {
        id: 'med-afternoon',
        medicine_name: 'Probiotic',
        frequency_code: 'CUSTOM',
        dose_times: [840], // 14:00 (840 min)
        start_date: '2026-08-01',
        is_ongoing: true,
      },
    ];

    it('keeps pastUnloggedDoses empty while current time is still within morning bucket window', () => {
      // Clock is 08:30 PKT (510 min) -> Morning window (300 - 719 min) is active
      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-15',
        now: morningClock, // 08:30
      };

      const view = buildDailyScheduleView(input);

      expect(view.buckets.morning).toHaveLength(1);
      expect(view.buckets.morning[0]?.status).toBe('pending');
      expect(view.pastUnloggedDoses).toHaveLength(0);
      expect(view.stats.pendingCount).toBe(2);
      expect(view.stats.missedCount).toBe(0);
      expect(view.stats.actionableCount).toBe(2);
    });

    it('places unlogged morning dose into pastUnloggedDoses once morning window passes at 12:00', () => {
      // Clock is 12:30 PKT (750 min) -> Morning window (ended 11:59) has passed!
      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-15',
        now: afternoonClock, // 12:30
      };

      const view = buildDailyScheduleView(input);

      // Morning dose was at 08:00 (480 min). At 12:30 (750 min), elapsed = 270 min (> 240 min) -> status: 'missed'
      expect(view.pastUnloggedDoses).toHaveLength(1);
      expect(view.pastUnloggedDoses[0]?.medicineName).toBe('Thyroxine');
      expect(view.pastUnloggedDoses[0]?.bucket).toBe('morning');
      expect(view.pastUnloggedDoses[0]?.status).toBe('missed');

      // Afternoon dose (14:00) is in the current active window (12:00 - 16:59), so it is NOT past unlogged
      expect(view.buckets.afternoon[0]?.status).toBe('pending');

      expect(view.stats.missedCount).toBe(1);
      expect(view.stats.pendingCount).toBe(1);
      expect(view.stats.actionableCount).toBe(2); // 1 missed + 1 pending
    });

    it('places pending morning dose into pastUnloggedDoses even if within 4-hour missed window (e.g. 12:15)', () => {
      // Morning dose at 11:00 (660 min).
      // Clock is 12:15 PKT (735 min).
      // Elapsed = 75 min (<= 240 min, so status remains 'pending').
      // BUT morning bucket window ended at 11:59 (719 min), so it has expired!
      const lateMeds: ActiveMedicineRecord[] = [
        {
          id: 'med-late-morning',
          medicine_name: 'Calcium',
          frequency_code: 'CUSTOM',
          dose_times: [660], // 11:00
          start_date: '2026-08-01',
          is_ongoing: true,
        },
      ];

      const clock1215 = new Date('2026-08-15T07:15:00Z'); // 12:15 PKT
      const view = buildDailyScheduleView({
        medicines: lateMeds,
        targetDate: '2026-08-15',
        now: clock1215,
      });

      expect(view.buckets.morning[0]?.status).toBe('pending');
      expect(view.pastUnloggedDoses).toHaveLength(1);
      expect(view.pastUnloggedDoses[0]?.medicineName).toBe('Calcium');
      expect(view.pastUnloggedDoses[0]?.status).toBe('pending');
    });

    it('does NOT place a taken or skipped dose into pastUnloggedDoses even if bucket expired', () => {
      const intakeLogs: IntakeLogRecord[] = [
        {
          id: 'log-1',
          medicine_id: 'med-morning',
          scheduled_date: '2026-08-15',
          bucket: 'morning',
          status: 'taken',
          taken_at: '2026-08-15T03:05:00Z', // 08:05 PKT
        },
      ];

      const input: DailyScheduleFacadeInput = {
        medicines,
        intakeLogs,
        targetDate: '2026-08-15',
        now: afternoonClock, // 12:30 PKT
      };

      const view = buildDailyScheduleView(input);

      // Morning dose is taken, so it is NOT past unlogged
      expect(view.pastUnloggedDoses).toHaveLength(0);
      expect(view.buckets.morning[0]?.status).toBe('taken');
      expect(view.stats.takenCount).toBe(1);
      expect(view.stats.missedCount).toBe(0);
    });

    it('places all unlogged doses into pastUnloggedDoses when viewing a past date (yesterday)', () => {
      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-14', // Yesterday
        now: morningClock, // Today 2026-08-15
      };

      const view = buildDailyScheduleView(input);

      // Both doses from yesterday were unlogged, so both are in pastUnloggedDoses
      expect(view.pastUnloggedDoses).toHaveLength(2);
      expect(view.stats.missedCount).toBe(2);
      expect(view.stats.pendingCount).toBe(0);
      expect(view.stats.actionableCount).toBe(2);
    });

    it('keeps pastUnloggedDoses empty when viewing a future date (tomorrow)', () => {
      const input: DailyScheduleFacadeInput = {
        medicines,
        targetDate: '2026-08-16', // Tomorrow
        now: morningClock, // Today 2026-08-15
      };

      const view = buildDailyScheduleView(input);

      expect(view.pastUnloggedDoses).toHaveLength(0);
      expect(view.stats.pendingCount).toBe(2);
      expect(view.stats.missedCount).toBe(0);
    });
  });

  describe('Adherence Metrics & Daily Logging Streak Computation', () => {
    const med: MedicineRecord = {
      id: 'med-daily',
      medicine_name: 'Lisinopril',
      frequency_code: 'OD',
      start_date: '2026-08-10',
      is_ongoing: true,
    };

    it('computes 100% clinical adherence and active daily logging streak when doses are logged', () => {
      // 3 consecutive logged days: Aug 13, Aug 14, Aug 15
      const intakeLogs: IntakeLogRecord[] = [
        { id: 'l1', medicine_id: 'med-daily', scheduled_date: '2026-08-13', bucket: 'morning', status: 'taken' },
        { id: 'l2', medicine_id: 'med-daily', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
        { id: 'l3', medicine_id: 'med-daily', scheduled_date: '2026-08-15', bucket: 'morning', status: 'taken' },
      ];

      const view = buildDailyScheduleView({
        medicines: [med],
        intakeLogs,
        targetDate: '2026-08-15',
        now: afternoonClock,
      });

      expect(view.stats.totalScheduled).toBe(1);
      expect(view.stats.takenCount).toBe(1);
      expect(view.stats.missedCount).toBe(0);
      expect(view.stats.skippedCount).toBe(0);
      expect(view.stats.pendingCount).toBe(0);
      expect(view.stats.actionableCount).toBe(0);
      expect(view.stats.clinicalAdherencePercent).toBe(100);
      expect(view.stats.dailyLoggingStreak).toBe(3);
    });

    it('correctly calculates clinical adherence when doses are skipped with valid reasons', () => {
      const bdMed: MedicineRecord = {
        id: 'med-bd',
        medicine_name: 'Metformin',
        frequency_code: 'BD', // 09:00, 21:00
        start_date: '2026-08-14',
        is_ongoing: true,
      };

      // Target date 2026-08-15:
      // Morning dose: taken
      // Night dose: skipped with reason "Doctor advised hold"
      const intakeLogs: IntakeLogRecord[] = [
        // Aug 14: both taken (streak continues)
        { id: 'l1', medicine_id: 'med-bd', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
        { id: 'l2', medicine_id: 'med-bd', scheduled_date: '2026-08-14', bucket: 'night', status: 'taken' },
        // Aug 15: 1 taken, 1 skipped with valid reason
        { id: 'l3', medicine_id: 'med-bd', scheduled_date: '2026-08-15', bucket: 'morning', status: 'taken' },
        {
          id: 'l4',
          medicine_id: 'med-bd',
          scheduled_date: '2026-08-15',
          bucket: 'night',
          status: 'skipped',
          skip_reason: 'Doctor advised hold',
        },
      ];

      const view = buildDailyScheduleView({
        medicines: [bdMed],
        intakeLogs,
        targetDate: '2026-08-15',
        now: bedtimeClock,
      });

      expect(view.stats.totalScheduled).toBe(2);
      expect(view.stats.takenCount).toBe(1);
      expect(view.stats.skippedCount).toBe(1);
      expect(view.stats.missedCount).toBe(0);

      // Clinical adherence rate: 1 taken / 2 scheduled = 50%
      expect(view.stats.clinicalAdherencePercent).toBe(50);

      // Skip reasons summary contains documented reason
      expect(view.stats.skipReasonsSummary).toEqual({ 'Doctor advised hold': 1 });

      // Daily logging streak: both days are fully settled and valid -> 2 days streak!
      expect(view.stats.dailyLoggingStreak).toBe(2);
    });

    it('excludes future pending doses from clinical adherence calculation', () => {
      const bdMed: MedicineRecord = {
        id: 'med-bd',
        medicine_name: 'Metformin',
        frequency_code: 'BD', // 09:00, 21:00
        start_date: '2026-08-15',
        is_ongoing: true,
      };

      // At 12:30 (afternoon): morning dose is taken, night dose is pending in the future
      const intakeLogs: IntakeLogRecord[] = [
        { id: 'l1', medicine_id: 'med-bd', scheduled_date: '2026-08-15', bucket: 'morning', status: 'taken' },
      ];

      const view = buildDailyScheduleView({
        medicines: [bdMed],
        intakeLogs,
        targetDate: '2026-08-15',
        now: afternoonClock,
      });

      expect(view.stats.takenCount).toBe(1);
      expect(view.stats.pendingCount).toBe(1);
      expect(view.stats.actionableCount).toBe(1);

      // Future dose not settled yet -> clinical adherence percent is 1 taken / 1 settled = 100%
      expect(view.stats.clinicalAdherencePercent).toBe(100);
    });

    it('breaks daily logging streak when a past day has a missed dose', () => {
      // Aug 13: taken
      // Aug 14: NO log -> missed! (breaks streak)
      // Aug 15: taken
      const intakeLogs: IntakeLogRecord[] = [
        { id: 'l1', medicine_id: 'med-daily', scheduled_date: '2026-08-13', bucket: 'morning', status: 'taken' },
        { id: 'l3', medicine_id: 'med-daily', scheduled_date: '2026-08-15', bucket: 'morning', status: 'taken' },
      ];

      const view = buildDailyScheduleView({
        medicines: [med],
        intakeLogs,
        targetDate: '2026-08-15',
        now: afternoonClock,
      });

      // Aug 14 was missed, so streak only counts Aug 15 (1 day)
      expect(view.stats.dailyLoggingStreak).toBe(1);
    });
  });

  describe('getUpcomingDose helper', () => {
    const medicines: ActiveMedicineRecord[] = [
      {
        id: 'med-morning',
        medicine_name: 'Thyroxine',
        frequency_code: 'CUSTOM',
        dose_times: [480], // 08:00
        start_date: '2026-08-01',
        is_ongoing: true,
      },
      {
        id: 'med-noon',
        medicine_name: 'Probiotic',
        frequency_code: 'CUSTOM',
        dose_times: [780], // 13:00
        start_date: '2026-08-01',
        is_ongoing: true,
      },
      {
        id: 'med-night',
        medicine_name: 'Stat-Statin',
        frequency_code: 'CUSTOM',
        dose_times: [1260], // 21:00
        start_date: '2026-08-01',
        is_ongoing: true,
      },
    ];

    it('returns the next upcoming dose at or after current minutes', () => {
      const view = buildDailyScheduleView({
        medicines,
        targetDate: '2026-08-15',
        now: morningClock,
      });

      // At 07:00 (420 min), upcoming is the 08:00 dose
      const next1 = getUpcomingDose(view, 420);
      expect(next1?.medicineName).toBe('Thyroxine');
      expect(next1?.scheduledMinutes).toBe(480);

      // At 10:00 (600 min), upcoming is the 13:00 dose
      const next2 = getUpcomingDose(view, 600);
      expect(next2?.medicineName).toBe('Probiotic');
      expect(next2?.scheduledMinutes).toBe(780);

      // At 15:00 (900 min), upcoming is the 21:00 dose
      const next3 = getUpcomingDose(view, 900);
      expect(next3?.medicineName).toBe('Stat-Statin');
      expect(next3?.scheduledMinutes).toBe(1260);
    });

    it('skips doses that are already taken or settled', () => {
      const intakeLogs: IntakeLogRecord[] = [
        {
          id: 'log-noon',
          medicine_id: 'med-noon',
          scheduled_date: '2026-08-15',
          bucket: 'afternoon',
          status: 'taken',
        },
      ];

      const view = buildDailyScheduleView({
        medicines,
        intakeLogs,
        targetDate: '2026-08-15',
        now: morningClock,
      });

      // At 11:00 (660 min), Probiotic at 13:00 is already taken, so upcoming dose is Stat-Statin at 21:00
      const next = getUpcomingDose(view, 660);
      expect(next?.medicineName).toBe('Stat-Statin');
      expect(next?.scheduledMinutes).toBe(1260);
    });

    it('returns null if all doses for today have passed or are settled', () => {
      const view = buildDailyScheduleView({
        medicines,
        targetDate: '2026-08-15',
        now: bedtimeClock, // 22:30
      });

      // At 22:00 (1320 min), all scheduled doses (last at 1260) have passed
      const next = getUpcomingDose(view, 1320);
      expect(next).toBeNull();
    });
  });

  describe('checkDoseLateRisk helper (Dose Stacking Guardrail)', () => {
    const medicines: MedicineRecord[] = [
      {
        id: 'med-bp',
        medicine_name: 'Amlodipine',
        frequency_code: 'BD', // 09:00 (540 min), 21:00 (1260 min)
        start_date: '2026-08-01',
        is_ongoing: true,
      },
    ];

    it('triggers warning_dose_stacking when taking a late dose too close to the next dose (<4 hours)', () => {
      const view = buildDailyScheduleView({
        medicines,
        targetDate: '2026-08-15',
        now: eveningClock, // 19:30 PKT (1170 min)
      });

      const morningDose = view.buckets.morning[0];
      expect(morningDose).toBeDefined();

      // Current time is 19:30 (1170 min). Next dose of Amlodipine is at 21:00 (1260 min).
      // Interval = 1260 - 1170 = 90 min (< 240 min)
      const risk = checkDoseLateRisk(morningDose!, view, 1170);

      expect(risk.riskLevel).toBe('warning_dose_stacking');
      expect(risk.recommendation).toBe('skip_and_resume');
      expect(risk.intervalMinutes).toBe(90);
      expect(risk.message).toContain('too close to your next scheduled dose');
      expect(risk.message).toContain('avoid dose stacking');
      expect(risk.message).toContain('21:00');
    });

    it('returns safe when taking the late dose with >= 4 hours buffer before next dose', () => {
      const view = buildDailyScheduleView({
        medicines,
        targetDate: '2026-08-15',
        now: afternoonClock, // 12:30 PKT
      });

      const morningDose = view.buckets.morning[0];
      expect(morningDose).toBeDefined();

      // At 14:00 (840 min), next dose is at 21:00 (1260 min).
      // Interval = 1260 - 840 = 420 min (7 hours >= 240 min)
      const risk = checkDoseLateRisk(morningDose!, view, 840);

      expect(risk.riskLevel).toBe('safe');
      expect(risk.recommendation).toBe('take_now');
      expect(risk.intervalMinutes).toBe(420);
      expect(risk.message).toContain('Safe to take');
      expect(risk.message).toContain('adequate spacing');
    });

    it('warns against double dose when next dose is already due or in the past', () => {
      const view = buildDailyScheduleView({
        medicines,
        targetDate: '2026-08-15',
        now: bedtimeClock, // 22:30 PKT
      });

      const morningDose = view.buckets.morning[0];
      expect(morningDose).toBeDefined();

      // At 21:15 (1275 min), next dose was at 21:00 (1260 min).
      // Interval = 1260 - 1275 = -15 min (<= 0)
      const risk = checkDoseLateRisk(morningDose!, view, 1275);

      expect(risk.riskLevel).toBe('warning_dose_stacking');
      expect(risk.recommendation).toBe('skip_and_resume');
      expect(risk.intervalMinutes).toBeLessThan(0);
      expect(risk.message).toContain('already due');
      expect(risk.message).toContain('double dose');
    });

    it('returns safe when there is no subsequent scheduled dose for this medicine today (OD regimen)', () => {
      const odMedicines: MedicineRecord[] = [
        {
          id: 'med-od',
          medicine_name: 'Atorvastatin',
          frequency_code: 'OD',
          start_date: '2026-08-01',
          is_ongoing: true,
        },
      ];

      const view = buildDailyScheduleView({
        medicines: odMedicines,
        targetDate: '2026-08-15',
        now: afternoonClock,
      });

      const dose = view.buckets.morning[0];
      expect(dose).toBeDefined();

      const risk = checkDoseLateRisk(dose!, view, 900); // 15:00

      expect(risk.riskLevel).toBe('safe');
      expect(risk.recommendation).toBe('take_now');
      expect(risk.intervalMinutes).toBeNull();
      expect(risk.message).toContain('Safe to take');
    });
  });
});
