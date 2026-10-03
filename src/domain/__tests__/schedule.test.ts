import { describe, it, expect } from 'vitest';
import {
  buildSchedule,
  projectSchedule,
  deriveMealInstruction,
  type VirtualScheduleInput,
  type ProjectedDose,
} from '../schedule';
import { todayInAppTz } from '../../lib/time';

describe('schedule generation legacy (src/domain/schedule.ts buildSchedule)', () => {
  it('generates zero doses for PRN / empty dose times', () => {
    const now = new Date('2026-08-15T10:00:00Z');
    const schedule = buildSchedule({
      medicineId: 'med-prn',
      startDate: '2026-08-15',
      durationDays: 5,
      isOngoing: false,
      doseTimes: [], // PRN has empty doseTimes
      now,
    });
    expect(schedule).toEqual([]);
  });

  it('generates zero doses when duration is null and not ongoing', () => {
    const now = new Date('2026-08-15T10:00:00Z');
    const schedule = buildSchedule({
      medicineId: 'med-null-dur',
      startDate: '2026-08-15',
      durationDays: null,
      isOngoing: false,
      doseTimes: [540, 1260],
      now,
    });
    expect(schedule).toEqual([]);
  });

  it('generates exact number of doses for a fixed duration (BD for 5 days = 10 doses)', () => {
    const now = new Date('2026-08-15T10:00:00Z');
    const schedule = buildSchedule({
      medicineId: 'med-bd-5d',
      startDate: '2026-08-15',
      durationDays: 5,
      isOngoing: false,
      doseTimes: [540, 1260], // 09:00, 21:00
      now,
    });

    expect(schedule).toHaveLength(10);
    // First day doses
    expect(schedule[0]).toEqual({ scheduled_date: '2026-08-15', scheduled_minutes: 540 });
    expect(schedule[1]).toEqual({ scheduled_date: '2026-08-15', scheduled_minutes: 1260 });
    // Last day doses (5th day: 2026-08-19)
    expect(schedule[8]).toEqual({ scheduled_date: '2026-08-19', scheduled_minutes: 540 });
    expect(schedule[9]).toEqual({ scheduled_date: '2026-08-19', scheduled_minutes: 1260 });
  });

  it('generates 30 days of doses for ongoing medication', () => {
    const now = new Date('2026-08-15T10:00:00Z');
    const schedule = buildSchedule({
      medicineId: 'med-ongoing-od',
      startDate: '2026-08-15',
      durationDays: null,
      isOngoing: true,
      doseTimes: [540], // OD (1/day)
      now,
    });

    expect(schedule).toHaveLength(30);
    expect(schedule[0]?.scheduled_date).toBe('2026-08-15');
    expect(schedule[29]?.scheduled_date).toBe('2026-09-13');
  });

  it('is idempotent (repeated runs produce identical outputs)', () => {
    const now = new Date('2026-08-15T10:00:00Z');
    const input = {
      medicineId: 'med-idemp',
      startDate: '2026-08-15',
      durationDays: 3,
      isOngoing: false,
      doseTimes: [480, 840, 1200], // TDS
      now,
    };

    const run1 = buildSchedule(input);
    const run2 = buildSchedule(input);
    expect(run1).toEqual(run2);
  });

  it('CRITICAL: A test run at 02:00 PKT asserts the first dose date is today, not yesterday', () => {
    // 02:00 PKT on 2026-08-16 corresponds to 2026-08-15T21:00:00Z in UTC
    const clockAt2amPkt = new Date('2026-08-15T21:00:00Z');
    const todayInPkt = todayInAppTz(clockAt2amPkt);
    expect(todayInPkt).toBe('2026-08-16');

    const schedule = buildSchedule({
      medicineId: 'med-pkt-test',
      startDate: todayInPkt,
      durationDays: 3,
      isOngoing: false,
      doseTimes: [540, 1260],
      now: clockAt2amPkt,
    });

    expect(schedule[0]?.scheduled_date).toBe('2026-08-16'); // Today (16th), NEVER 15th
  });

  describe('dosing interval', () => {
    const now = new Date('2026-08-15T10:00:00Z');

    it('CRITICAL: WEEKLY doses every 7th day, never daily', () => {
      // A weekly drug expanded daily (e.g. methotrexate) is a severe dosing error.
      const schedule = buildSchedule({
        medicineId: 'med-weekly',
        startDate: '2026-08-15',
        durationDays: 28,
        isOngoing: false,
        doseTimes: [540],
        now,
        frequencyCode: 'WEEKLY',
      });

      expect(schedule).toHaveLength(4);
      expect(schedule.map((d) => d.scheduled_date)).toEqual([
        '2026-08-15',
        '2026-08-22',
        '2026-08-29',
        '2026-09-05',
      ]);
    });

    it('CRITICAL: STAT produces exactly one dose regardless of duration', () => {
      const schedule = buildSchedule({
        medicineId: 'med-stat',
        startDate: '2026-08-15',
        durationDays: 5,
        isOngoing: false,
        doseTimes: [540],
        now,
        frequencyCode: 'STAT',
      });

      expect(schedule).toEqual([{ scheduled_date: '2026-08-15', scheduled_minutes: 540 }]);
    });

    it('STAT ignores isOngoing and extra dose times', () => {
      const schedule = buildSchedule({
        medicineId: 'med-stat-ongoing',
        startDate: '2026-08-15',
        durationDays: null,
        isOngoing: true,
        doseTimes: [540, 1260],
        now,
        frequencyCode: 'STAT',
      });

      expect(schedule).toHaveLength(1);
    });

    it('WEEKLY over an ongoing course covers the 30-day horizon weekly', () => {
      const schedule = buildSchedule({
        medicineId: 'med-weekly-ongoing',
        startDate: '2026-08-15',
        durationDays: null,
        isOngoing: true,
        doseTimes: [540],
        now,
        frequencyCode: 'WEEKLY',
      });

      // Offsets 0, 7, 14, 21, 28 within the 30-day horizon.
      expect(schedule).toHaveLength(5);
      expect(schedule[4]?.scheduled_date).toBe('2026-09-12');
    });

    it('multi-dose daily codes still dose every day', () => {
      for (const code of ['OD', 'BD', 'TDS', 'QID', 'QHS'] as const) {
        const schedule = buildSchedule({
          medicineId: `med-${code}`,
          startDate: '2026-08-15',
          durationDays: 3,
          isOngoing: false,
          doseTimes: [540, 1260],
          now,
          frequencyCode: code,
        });
        expect(schedule, code).toHaveLength(6);
      }
    });

    it('treats an unknown frequency code as daily', () => {
      const schedule = buildSchedule({
        medicineId: 'med-no-code',
        startDate: '2026-08-15',
        durationDays: 3,
        isOngoing: false,
        doseTimes: [540],
        now,
        frequencyCode: null,
      });
      expect(schedule).toHaveLength(3);
    });

    it('caps a very long fixed course at 365 days', () => {
      const schedule = buildSchedule({
        medicineId: 'med-long',
        startDate: '2026-08-15',
        durationDays: 5000,
        isOngoing: false,
        doseTimes: [540],
        now,
      });
      expect(schedule).toHaveLength(365);
    });
  });
});

describe('deterministic virtual schedule projection (projectSchedule ADR 0001)', () => {
  const clock = new Date('2026-08-15T09:00:00Z'); // Today in PKT: 2026-08-15 (14:00 PKT)

  it('projects complete schema for each dose including all 9 required attributes', () => {
    const input: VirtualScheduleInput = {
      activeMedicines: [
        {
          id: 'med-metformin-1',
          medicine_name: 'Metformin',
          strength: '500 mg',
          dose_amount: '1 tablet',
          frequency_code: 'OD',
          start_date: '2026-08-15',
          is_ongoing: true,
          with_food: true,
        },
      ],
      dateRange: { from: '2026-08-15', to: '2026-08-15' },
      now: clock,
    };

    const doses = projectSchedule(input);
    expect(doses).toHaveLength(1);

    const dose: ProjectedDose = doses[0]!;
    expect(dose.medicineId).toBe('med-metformin-1');
    expect(dose.medicineName).toBe('Metformin');
    expect(dose.strength).toBe('500 mg');
    expect(dose.doseAmount).toBe('1 tablet');
    expect(dose.scheduledDate).toBe('2026-08-15');
    expect(dose.scheduledMinutes).toBe(540); // 09:00 default morning
    expect(dose.bucket).toBe('morning');
    expect(dose.mealInstruction).toBe('Take with or after breakfast');
    expect(dose.isPrn).toBe(false);

    // Also verify snake_case backward compatibility
    expect(dose.scheduled_date).toBe('2026-08-15');
    expect(dose.scheduled_minutes).toBe(540);
  });

  describe('Horizon Rules', () => {
    it('ongoing medicines default to rolling 7-day window when dateRange is omitted', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-atorvastatin',
            medicine_name: 'Atorvastatin',
            strength: '20 mg',
            dose_amount: '1 tab',
            frequency_code: 'OD',
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
        ],
        now: clock, // 2026-08-15
      };

      const doses = projectSchedule(input);
      // Exactly 7 days: 2026-08-15 to 2026-08-21
      expect(doses).toHaveLength(7);
      expect(doses[0]?.scheduledDate).toBe('2026-08-15');
      expect(doses[6]?.scheduledDate).toBe('2026-08-21');
    });

    it('ongoing medicines project across custom dateRange when explicitly provided', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-lisinopril',
            medicine_name: 'Lisinopril',
            frequency_code: 'OD',
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-17' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toHaveLength(3);
      expect(doses.map((d) => d.scheduledDate)).toEqual([
        '2026-08-15',
        '2026-08-16',
        '2026-08-17',
      ]);
    });

    it('finite course (5 days BD) strictly projects for exact prescribed duration up to min(durationDays, range.to)', () => {
      // 5-day course BD = 10 doses total (day 0 to day 4: 2026-08-15 to 2026-08-19)
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-amox',
            medicine_name: 'Amoxicillin',
            strength: '500 mg',
            dose_amount: '1 capsule',
            frequency_code: 'BD',
            duration_days: 5,
            start_date: '2026-08-15',
            is_ongoing: false,
            with_food: true,
          },
        ],
        // 7-day default window: day 0 to day 6 (2026-08-15 to 2026-08-21)
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toHaveLength(10); // Exactly 5 days * 2 doses
      expect(doses[0]?.scheduledDate).toBe('2026-08-15');
      expect(doses[9]?.scheduledDate).toBe('2026-08-19');

      // Verify no doses are generated for day 6 (2026-08-20) or day 7 (2026-08-21)
      const lateDoses = doses.filter((d) => d.scheduledDate >= '2026-08-20');
      expect(lateDoses).toHaveLength(0);
    });

    it('finite course clamps to range.to when range.to is shorter than duration', () => {
      // 14-day antibiotic viewed for only 3 days
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-augmentin',
            medicine_name: 'Augmentin',
            frequency_code: 'BD',
            duration_days: 14,
            start_date: '2026-08-15',
            is_ongoing: false,
            with_food: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-17' }, // 3 days
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toHaveLength(6); // 3 days * 2 doses
      expect(doses[5]?.scheduledDate).toBe('2026-08-17');
    });

    it('finite course completed in the past generates zero doses', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-past',
            medicine_name: 'Azithromycin',
            frequency_code: 'OD',
            start_date: '2026-08-01',
            duration_days: 3, // ended 2026-08-03
            is_ongoing: false,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-21' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toEqual([]);
    });

    it('future starting medicine generates zero doses before its start date', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-future',
            medicine_name: 'Prednisone',
            frequency_code: 'OD',
            start_date: '2026-08-18', // starts on day 4 of window
            is_ongoing: true,
            with_food: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-21' },
        now: clock,
      };

      const doses = projectSchedule(input);
      // Doses only from 2026-08-18 to 2026-08-21 (4 days)
      expect(doses).toHaveLength(4);
      expect(doses[0]?.scheduledDate).toBe('2026-08-18');
      expect(doses[3]?.scheduledDate).toBe('2026-08-21');
    });

    it('PRN medications generate zero scheduled rows', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-panadol-sos',
            medicine_name: 'Panadol',
            frequency_code: 'PRN',
            start_date: '2026-08-15',
            is_ongoing: true,
            is_prn: true,
          },
          {
            id: 'med-ventolin',
            medicine_name: 'Ventolin Inhaler',
            frequency_raw: 'SOS as needed for wheeze',
            start_date: '2026-08-15',
            is_ongoing: true,
          },
        ],
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toEqual([]);
    });

    it('discontinued medicine generates zero doses if discontinued before range', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-stopped',
            medicine_name: 'Metformin',
            frequency_code: 'OD',
            start_date: '2026-08-01',
            is_ongoing: true,
            discontinued_at: '2026-08-14T10:00:00Z',
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-21' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toEqual([]);
    });

    it('non-ongoing medicine with null duration and no end date generates zero doses', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-invalid',
            medicine_name: 'Unknown Course',
            frequency_code: 'OD',
            start_date: '2026-08-15',
            duration_days: null,
            is_ongoing: false,
          },
        ],
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toEqual([]);
    });
  });

  describe('Meal Timing & Clear Guidance', () => {
    it('generates "Take with or after breakfast" for morning bucket with food', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-breakfast',
            medicine_name: 'Aspirin',
            frequency_code: 'OD',
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses[0]?.bucket).toBe('morning');
      expect(doses[0]?.mealInstruction).toBe('Take with or after breakfast');
    });

    it('generates "Take with or after dinner" for night bucket with food', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-dinner',
            medicine_name: 'Metformin',
            frequency_raw: '0+0+1', // night slot
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses[0]?.bucket).toBe('night');
      expect(doses[0]?.mealInstruction).toBe('Take with or after dinner');
    });

    it('generates "Take on an empty stomach" and shifts morning dose to 07:00 when with_food is false', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-ppi',
            medicine_name: 'Omeprazole',
            frequency_code: 'OD',
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: false, // empty stomach
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses[0]?.scheduledMinutes).toBe(420); // 07:00 AM
      expect(doses[0]?.bucket).toBe('morning');
      expect(doses[0]?.mealInstruction).toBe('Take on an empty stomach');
    });

    it('generates default guidance when meal timing is unspecified (null/undefined)', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-unspecified',
            medicine_name: 'Paracetamol',
            frequency_code: 'OD',
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: null,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses[0]?.mealInstruction).toBe(
        'Meal timing not specified — follow your doctor’s instructions'
      );
    });

    it('preserves specific clinician instructions when they include meal guidance (e.g. "Take after dinner")', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-custom-instr',
            medicine_name: 'Atorvastatin',
            frequency_code: 'QHS',
            instructions: 'Take after dinner',
            start_date: '2026-08-15',
            is_ongoing: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses[0]?.mealInstruction).toBe('Take after dinner');
    });

    it('deriveMealInstruction helper handles all buckets and explicit notes', () => {
      expect(deriveMealInstruction(true, 'morning')).toBe('Take with or after breakfast');
      expect(deriveMealInstruction(true, 'afternoon')).toBe('Take with or after lunch');
      expect(deriveMealInstruction(true, 'night')).toBe('Take with or after dinner');
      expect(deriveMealInstruction(true, 'bedtime')).toBe('Take at bedtime with food');
      expect(deriveMealInstruction(false, 'morning')).toBe('Take on an empty stomach');
      expect(deriveMealInstruction(false, 'night')).toBe('Take on an empty stomach');
      expect(deriveMealInstruction(null, 'morning')).toBe(
        'Meal timing not specified — follow your doctor’s instructions'
      );
      expect(deriveMealInstruction(null, 'night', 'Take 30 mins before dinner')).toBe(
        'Take 30 mins before dinner'
      );
    });
  });

  describe('Adaptive 3+1 Time Buckets & Bedtime Support', () => {
    it('projects bedtime medicines into the "bedtime" bucket', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-statin',
            medicine_name: 'Rosuvastatin',
            strength: '10 mg',
            frequency_code: 'QHS',
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toHaveLength(1);
      expect(doses[0]?.scheduledMinutes).toBe(1320); // 22:00
      expect(doses[0]?.bucket).toBe('bedtime');
    });

    it('detects bedtime requirement from free-text instructions', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-sleep',
            medicine_name: 'Melatonin',
            frequency_raw: 'at bedtime',
            instructions: 'Take 1 pill before going to bed',
            start_date: '2026-08-15',
            is_ongoing: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses[0]?.bucket).toBe('bedtime');
    });
  });

  describe('Patient Routines Custom Anchors', () => {
    it('uses patient anchor times when provided in patientRoutines', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-custom-routine',
            medicine_name: 'Metformin',
            frequency_code: 'BD', // morning & night
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
        ],
        patientRoutines: {
          morning: 480, // 08:00 AM instead of 09:00
          night: 1200, // 20:00 PM instead of 21:00
        },
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      };

      const doses = projectSchedule(input);
      expect(doses).toHaveLength(2);
      expect(doses[0]?.scheduledMinutes).toBe(480);
      expect(doses[0]?.bucket).toBe('morning');
      expect(doses[1]?.scheduledMinutes).toBe(1200);
      expect(doses[1]?.bucket).toBe('night');
    });
  });

  describe('Frequency Multiplicity & Intervals', () => {
    it('OD produces 1 dose per day', () => {
      const doses = projectSchedule({
        activeMedicines: [
          { id: 'm-od', medicine_name: 'OD Med', frequency_code: 'OD', is_ongoing: true },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-16' },
        now: clock,
      });
      expect(doses).toHaveLength(2);
    });

    it('BD produces 2 doses per day', () => {
      const doses = projectSchedule({
        activeMedicines: [
          { id: 'm-bd', medicine_name: 'BD Med', frequency_code: 'BD', is_ongoing: true },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-16' },
        now: clock,
      });
      expect(doses).toHaveLength(4);
    });

    it('TDS produces 3 doses per day across morning, afternoon, night', () => {
      const doses = projectSchedule({
        activeMedicines: [
          { id: 'm-tds', medicine_name: 'TDS Med', frequency_code: 'TDS', is_ongoing: true },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      });
      expect(doses).toHaveLength(3);
      expect(doses.map((d) => d.bucket)).toEqual(['morning', 'afternoon', 'night']);
    });

    it('QID produces 4 doses per day', () => {
      const doses = projectSchedule({
        activeMedicines: [
          { id: 'm-qid', medicine_name: 'QID Med', frequency_code: 'QID', is_ongoing: true },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      });
      expect(doses).toHaveLength(4);
    });

    it('numeric slot 1+0+1 produces 2 doses (morning & night)', () => {
      const doses = projectSchedule({
        activeMedicines: [
          {
            id: 'm-slot',
            medicine_name: 'Slot Med',
            frequency_raw: '1+0+1',
            is_ongoing: true,
            with_food: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-15' },
        now: clock,
      });
      expect(doses).toHaveLength(2);
      expect(doses[0]?.bucket).toBe('morning');
      expect(doses[1]?.bucket).toBe('night');
    });

    it('WEEKLY doses strictly every 7th day anchored to start date', () => {
      const doses = projectSchedule({
        activeMedicines: [
          {
            id: 'm-weekly',
            medicine_name: 'Methotrexate',
            frequency_code: 'WEEKLY',
            start_date: '2026-08-15',
            is_ongoing: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-09-05' }, // 22 days
        now: clock,
      });

      expect(doses.map((d) => d.scheduledDate)).toEqual([
        '2026-08-15',
        '2026-08-22',
        '2026-08-29',
        '2026-09-05',
      ]);
    });

    it('STAT produces exactly one dose on start date and never repeats', () => {
      const doses = projectSchedule({
        activeMedicines: [
          {
            id: 'm-stat',
            medicine_name: 'Monurol',
            frequency_code: 'STAT',
            start_date: '2026-08-15',
            duration_days: 7, // duration ignored for STAT
            is_ongoing: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-21' },
        now: clock,
      });

      expect(doses).toHaveLength(1);
      expect(doses[0]?.scheduledDate).toBe('2026-08-15');
    });
  });

  describe('Multi-Medicine Complex Regimen Integration', () => {
    it('projects and chronologically orders a multi-medicine regimen (chronic, acute, PRN, bedtime)', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'med-metformin',
            medicine_name: 'Metformin',
            strength: '500 mg',
            dose_amount: '1 tablet',
            frequency_code: 'BD', // 09:00, 21:00
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
          {
            id: 'med-amox',
            medicine_name: 'Amoxicillin',
            strength: '250 mg',
            dose_amount: '1 cap',
            frequency_code: 'TDS', // 08:00, 14:00, 20:00
            duration_days: 2, // 2026-08-15 to 2026-08-16
            start_date: '2026-08-15',
            is_ongoing: false,
            with_food: true,
          },
          {
            id: 'med-statin',
            medicine_name: 'Atorvastatin',
            frequency_code: 'QHS', // 22:00 bedtime
            start_date: '2026-08-15',
            is_ongoing: true,
            with_food: true,
          },
          {
            id: 'med-inhaler',
            medicine_name: 'Ventolin',
            frequency_code: 'PRN', // should generate 0 rows
            start_date: '2026-08-15',
            is_ongoing: true,
            is_prn: true,
          },
        ],
        dateRange: { from: '2026-08-15', to: '2026-08-16' },
        now: clock,
      };

      const doses = projectSchedule(input);

      // On 2026-08-15:
      // - Amoxicillin (08:00, 14:00, 20:00) = 3 doses
      // - Metformin (09:00, 21:00) = 2 doses
      // - Atorvastatin (22:00) = 1 dose
      // Total day 15 = 6 doses
      // On 2026-08-16:
      // Same = 6 doses
      // Total = 12 doses
      expect(doses).toHaveLength(12);

      // Verify PRN generated 0 rows
      expect(doses.some((d) => d.medicineName === 'Ventolin')).toBe(false);

      // Verify chronological sort for day 1 (2026-08-15):
      const day15Doses = doses.filter((d) => d.scheduledDate === '2026-08-15');
      expect(day15Doses.map((d) => `${d.scheduledMinutes}-${d.medicineName}`)).toEqual([
        '480-Amoxicillin', // 08:00
        '540-Metformin', // 09:00
        '840-Amoxicillin', // 14:00
        '1200-Amoxicillin', // 20:00
        '1260-Metformin', // 21:00
        '1320-Atorvastatin', // 22:00
      ]);

      // Verify bedtime bucket was correctly assigned
      const bedtimeDose = day15Doses.find((d) => d.medicineName === 'Atorvastatin');
      expect(bedtimeDose?.bucket).toBe('bedtime');
    });
  });

  describe('Determinism, Timezones & Idempotency', () => {
    it('is idempotent: running projectSchedule twice yields deep equality', () => {
      const input: VirtualScheduleInput = {
        activeMedicines: [
          {
            id: 'm-1',
            medicine_name: 'Aspirin',
            frequency_code: 'OD',
            start_date: '2026-08-15',
            is_ongoing: true,
          },
        ],
        now: clock,
      };

      const run1 = projectSchedule(input);
      const run2 = projectSchedule(input);
      expect(run1).toEqual(run2);
    });

    it('CRITICAL: A test run at 02:00 PKT roots rolling window on today in PKT, not UTC yesterday', () => {
      // 02:00 PKT on 2026-08-16 corresponds to 2026-08-15T21:00:00Z in UTC
      const clockAt2amPkt = new Date('2026-08-15T21:00:00Z');
      const todayInPkt = todayInAppTz(clockAt2amPkt);
      expect(todayInPkt).toBe('2026-08-16');

      const doses = projectSchedule({
        activeMedicines: [
          {
            id: 'm-pkt',
            medicine_name: 'Morning Med',
            frequency_code: 'OD',
            is_ongoing: true,
          },
        ],
        now: clockAt2amPkt,
      });

      // Default rolling 7-day window starts today (2026-08-16), never 2026-08-15
      expect(doses[0]?.scheduledDate).toBe('2026-08-16');
      expect(doses[6]?.scheduledDate).toBe('2026-08-22');
    });
  });
});
