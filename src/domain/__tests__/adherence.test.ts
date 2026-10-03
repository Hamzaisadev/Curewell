import { describe, it, expect } from 'vitest';
import {
  calculateAdherence,
  calculateAdherenceStreak,
  deriveStatusOnRead,
  deriveEffectiveDose,
  deriveEffectiveDoses,
  evaluateLateDoseRisk,
  calculateTwoTierAdherence,
  calculateAdherenceMetrics,
  calculateLoggingStreak,
  DoseRecord,
  IntakeLogRecord,
  EffectiveDose,
} from '../adherence';
import type { ProjectedDose } from '../schedule';

describe('adherence calculation (src/domain/adherence.ts)', () => {
  // Current time: 14:00 (840 min) PKT on 2026-08-15 -> 09:00 UTC
  const now = new Date('2026-08-15T09:00:00Z');

  it('excludes future pending doses from the denominator', () => {
    const doses: DoseRecord[] = [
      // Past yesterday taken dose
      { id: '1', medicine_id: 'm1', scheduled_date: '2026-08-14', scheduled_minutes: 540, status: 'taken' },
      // Future tomorrow pending dose
      { id: '2', medicine_id: 'm1', scheduled_date: '2026-08-16', scheduled_minutes: 540, status: 'pending' },
    ];

    const stats = calculateAdherence(doses, { from: '2026-08-14', to: '2026-08-16' }, now);
    expect(stats.scheduled).toBe(1); // ONLY the past dose, future is excluded
    expect(stats.taken).toBe(1);
    expect(stats.percentage).toBe(100);
  });

  it('excludes PRN medicines from adherence calculation entirely', () => {
    const doses: DoseRecord[] = [
      { id: '1', medicine_id: 'm-prn', scheduled_date: '2026-08-14', scheduled_minutes: 540, status: 'pending', is_prn: true },
      { id: '2', medicine_id: 'm-reg', scheduled_date: '2026-08-14', scheduled_minutes: 540, status: 'taken' },
    ];

    const stats = calculateAdherence(doses, { from: '2026-08-14', to: '2026-08-15' }, now);
    expect(stats.scheduled).toBe(1);
    expect(stats.taken).toBe(1);
  });

  it('marks pending dose > 4 hours overdue as missed on read', () => {
    // Current time: 14:00 PKT (840 min)
    // Morning 08:00 dose (480 min) is 6 hours ago (> 4 hours) -> missed
    // Afternoon 13:00 dose (780 min) is 1 hour ago (<= 4 hours) -> still pending (not missed yet)
    const doses: DoseRecord[] = [
      { id: '1', medicine_id: 'm1', scheduled_date: '2026-08-15', scheduled_minutes: 480, status: 'pending' },
      { id: '2', medicine_id: 'm1', scheduled_date: '2026-08-15', scheduled_minutes: 780, status: 'pending' },
    ];

    const stats = calculateAdherence(doses, { from: '2026-08-15', to: '2026-08-15' }, now);
    expect(stats.scheduled).toBe(1); // Only the >4h overdue dose counts in denominator
    expect(stats.missed).toBe(1);
    expect(stats.taken).toBe(0);
    expect(stats.percentage).toBe(0);
  });

  it('counts deliberate skip against adherence percentage', () => {
    const doses: DoseRecord[] = [
      { id: '1', medicine_id: 'm1', scheduled_date: '2026-08-14', scheduled_minutes: 540, status: 'taken' },
      { id: '2', medicine_id: 'm1', scheduled_date: '2026-08-14', scheduled_minutes: 1260, status: 'skipped' },
    ];

    const stats = calculateAdherence(doses, { from: '2026-08-14', to: '2026-08-14' }, now);
    expect(stats.scheduled).toBe(2);
    expect(stats.taken).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.percentage).toBe(50);
  });

  it('counts a stored missed dose dated today', () => {
    const doses: DoseRecord[] = [
      { id: '1', medicine_id: 'm1', scheduled_date: '2026-08-15', scheduled_minutes: 780, status: 'missed' },
      { id: '2', medicine_id: 'm1', scheduled_date: '2026-08-15', scheduled_minutes: 480, status: 'taken' },
    ];

    const stats = calculateAdherence(doses, { from: '2026-08-15', to: '2026-08-15' }, now);
    expect(stats.scheduled).toBe(2);
    expect(stats.missed).toBe(1);
    expect(stats.taken).toBe(1);
    expect(stats.percentage).toBe(50);
  });

  it('reports zeros rather than 100% when nothing is scheduled', () => {
    const stats = calculateAdherence([], { from: '2026-08-15', to: '2026-08-15' }, now);
    expect(stats.scheduled).toBe(0);
    expect(stats.percentage).toBe(0);
  });
});

describe('deriveStatusOnRead', () => {
  const now = new Date('2026-08-15T09:00:00Z'); // 14:00 PKT

  it('preserves a stored missed status instead of downgrading it to pending', () => {
    expect(
      deriveStatusOnRead(
        { status: 'missed', scheduled_date: '2026-08-15', scheduled_minutes: 780 },
        now
      )
    ).toBe('missed');
  });

  it('preserves taken and skipped', () => {
    expect(
      deriveStatusOnRead({ status: 'taken', scheduled_date: '2026-08-15', scheduled_minutes: 780 }, now)
    ).toBe('taken');
    expect(
      deriveStatusOnRead({ status: 'skipped', scheduled_date: '2026-08-15', scheduled_minutes: 780 }, now)
    ).toBe('skipped');
  });

  it('derives missed for a past pending dose and for one over the grace window', () => {
    expect(
      deriveStatusOnRead({ status: 'pending', scheduled_date: '2026-08-14', scheduled_minutes: 540 }, now)
    ).toBe('missed');
    expect(
      deriveStatusOnRead({ status: 'pending', scheduled_date: '2026-08-15', scheduled_minutes: 480 }, now)
    ).toBe('missed');
  });

  it('keeps a dose pending inside the grace window and in the future', () => {
    expect(
      deriveStatusOnRead({ status: 'pending', scheduled_date: '2026-08-15', scheduled_minutes: 780 }, now)
    ).toBe('pending');
    expect(
      deriveStatusOnRead({ status: 'pending', scheduled_date: '2026-08-16', scheduled_minutes: 540 }, now)
    ).toBe('pending');
  });

  it('CRITICAL: resolves the PKT date and time consistently after midnight UTC+5', () => {
    const earlyPkt = new Date('2026-08-15T20:00:00Z');
    expect(
      deriveStatusOnRead({ status: 'pending', scheduled_date: '2026-08-16', scheduled_minutes: 540 }, earlyPkt)
    ).toBe('pending');
    expect(
      deriveStatusOnRead({ status: 'pending', scheduled_date: '2026-08-15', scheduled_minutes: 540 }, earlyPkt)
    ).toBe('missed');
  });
});

describe('calculateAdherenceStreak', () => {
  const now = new Date('2026-08-15T09:00:00Z'); // 14:00 PKT on the 15th

  const perfectDay = (date: string, id: string): DoseRecord[] => [
    { id: `${id}a`, medicine_id: 'm1', scheduled_date: date, scheduled_minutes: 480, status: 'taken' },
    { id: `${id}b`, medicine_id: 'm1', scheduled_date: date, scheduled_minutes: 1200, status: 'taken' },
  ];

  it('CRITICAL: returns 0 for a user with no doses at all', () => {
    expect(calculateAdherenceStreak([], now)).toBe(0);
  });

  it('counts consecutive fully-taken days', () => {
    const doses = [
      ...perfectDay('2026-08-14', '1'),
      ...perfectDay('2026-08-13', '2'),
      ...perfectDay('2026-08-12', '3'),
    ];
    expect(calculateAdherenceStreak(doses, now)).toBe(3);
  });

  it('breaks the streak on a missed dose', () => {
    const doses: DoseRecord[] = [
      ...perfectDay('2026-08-14', '1'),
      { id: 'x', medicine_id: 'm1', scheduled_date: '2026-08-13', scheduled_minutes: 480, status: 'missed' },
      ...perfectDay('2026-08-12', '3'),
    ];
    expect(calculateAdherenceStreak(doses, now)).toBe(1);
  });

  it('breaks the streak on a skipped dose', () => {
    const doses: DoseRecord[] = [
      ...perfectDay('2026-08-14', '1'),
      { id: 'x', medicine_id: 'm1', scheduled_date: '2026-08-13', scheduled_minutes: 480, status: 'skipped' },
    ];
    expect(calculateAdherenceStreak(doses, now)).toBe(1);
  });

  it('does not penalise a day still in progress', () => {
    const doses: DoseRecord[] = [
      { id: 'today', medicine_id: 'm1', scheduled_date: '2026-08-15', scheduled_minutes: 1200, status: 'pending' },
      ...perfectDay('2026-08-14', '1'),
      ...perfectDay('2026-08-13', '2'),
    ];
    expect(calculateAdherenceStreak(doses, now)).toBe(2);
  });

  it('counts today once every dose has settled', () => {
    const doses = [...perfectDay('2026-08-15', '0'), ...perfectDay('2026-08-14', '1')];
    expect(calculateAdherenceStreak(doses, now)).toBe(2);
  });

  it('ignores PRN doses when judging a day', () => {
    const doses: DoseRecord[] = [
      ...perfectDay('2026-08-14', '1'),
      { id: 'prn', medicine_id: 'm-prn', scheduled_date: '2026-08-14', scheduled_minutes: 600, status: 'pending', is_prn: true },
    ];
    expect(calculateAdherenceStreak(doses, now)).toBe(1);
  });

  it('skips days with nothing scheduled without breaking the streak', () => {
    const doses = [
      ...perfectDay('2026-08-14', '1'),
      ...perfectDay('2026-08-12', '2'),
    ];
    expect(calculateAdherenceStreak(doses, now)).toBe(2);
  });
});

// =========================================================================
// ISSUE 03: SPARSE INTAKE LOGS, STATUS DERIVATION & TWO-TIER ADHERENCE TESTS
// =========================================================================

describe('deriveEffectiveDose (Sparse Intake Logs & Status Derivation)', () => {
  // Current time: 14:00 (840 min) PKT on 2026-08-15 -> 09:00 UTC
  const now = new Date('2026-08-15T09:00:00Z');

  const sampleDose: ProjectedDose = {
    medicineId: 'med-101',
    medicineName: 'Metformin',
    strength: '500mg',
    doseAmount: '1 tablet',
    scheduledDate: '2026-08-15',
    scheduledMinutes: 480, // 08:00 Morning
    bucket: 'morning',
    mealInstruction: 'Take with or after breakfast',
    isPrn: false,
  };

  it('derives status taken when matching intake log exists with status taken', () => {
    const logs: IntakeLogRecord[] = [
      {
        id: 'log-1',
        medicine_id: 'med-101',
        scheduled_date: '2026-08-15',
        bucket: 'morning',
        status: 'taken',
        taken_at: '2026-08-15T08:10:00Z',
      },
    ];

    const effective = deriveEffectiveDose(sampleDose, logs, now);
    expect(effective.status).toBe('taken');
    expect(effective.intakeLogId).toBe('log-1');
    expect(effective.takenAt).toBe('2026-08-15T08:10:00Z');
    expect(effective.taken_at).toBe('2026-08-15T08:10:00Z');
    expect(effective.skipReason).toBeNull();
  });

  it('derives status skipped with reason when matching intake log exists with status skipped', () => {
    const logs: IntakeLogRecord[] = [
      {
        id: 'log-2',
        medicine_id: 'med-101',
        scheduled_date: '2026-08-15',
        bucket: 'morning',
        status: 'skipped',
        skip_reason: 'Doctor advised hold due to blood test',
      },
    ];

    const effective = deriveEffectiveDose(sampleDose, logs, now);
    expect(effective.status).toBe('skipped');
    expect(effective.intakeLogId).toBe('log-2');
    expect(effective.skipReason).toBe('Doctor advised hold due to blood test');
    expect(effective.skip_reason).toBe('Doctor advised hold due to blood test');
    expect(effective.takenAt).toBeNull();
  });

  it('matches on scheduled_minutes when multiple doses exist for the same medicine in the same bucket', () => {
    const dose1: ProjectedDose = {
      medicineId: 'med-multi',
      medicineName: 'Painkiller',
      strength: '400mg',
      doseAmount: '1 tab',
      scheduledDate: '2026-08-15',
      scheduledMinutes: 720, // 12:00 afternoon
      bucket: 'afternoon',
      mealInstruction: 'Take with food',
      isPrn: false,
    };

    const dose2: ProjectedDose = {
      medicineId: 'med-multi',
      medicineName: 'Painkiller',
      strength: '400mg',
      doseAmount: '1 tab',
      scheduledDate: '2026-08-15',
      scheduledMinutes: 960, // 16:00 afternoon
      bucket: 'afternoon',
      mealInstruction: 'Take with food',
      isPrn: false,
    };

    const logs: IntakeLogRecord[] = [
      {
        id: 'log-noon',
        medicine_id: 'med-multi',
        scheduled_date: '2026-08-15',
        bucket: 'afternoon',
        scheduled_minutes: 720,
        status: 'taken',
        taken_at: '2026-08-15T12:05:00Z',
      },
      {
        id: 'log-four-pm',
        medicine_id: 'med-multi',
        scheduled_date: '2026-08-15',
        bucket: 'afternoon',
        scheduled_minutes: 960,
        status: 'skipped',
        skip_reason: 'Pain subsided',
      },
    ];

    const eff1 = deriveEffectiveDose(dose1, logs, now);
    const eff2 = deriveEffectiveDose(dose2, logs, now);

    expect(eff1.status).toBe('taken');
    expect(eff1.intakeLogId).toBe('log-noon');
    expect(eff2.status).toBe('skipped');
    expect(eff2.intakeLogId).toBe('log-four-pm');
    expect(eff2.skipReason).toBe('Pain subsided');
  });

  it('derives status missed when no intake log exists and dose is >4 hours overdue', () => {
    // Current time: 14:00 (840 min). Scheduled at 08:00 (480 min). 840 - 480 = 360 min (> 240) -> missed.
    const effective = deriveEffectiveDose(sampleDose, [], now);
    expect(effective.status).toBe('missed');
    expect(effective.intakeLogId).toBeNull();
  });

  it('derives status pending when no intake log exists and dose is within the 4-hour grace window', () => {
    // Current time: 14:00 (840 min). Scheduled at 13:00 (780 min). 840 - 780 = 60 min (<= 240) -> pending.
    const afternoonDose: ProjectedDose = {
      ...sampleDose,
      scheduledMinutes: 780,
      bucket: 'afternoon',
    };

    const effective = deriveEffectiveDose(afternoonDose, [], now);
    expect(effective.status).toBe('pending');
    expect(effective.intakeLogId).toBeNull();
  });

  it('derives status missed when no intake log exists and dose is from a past date', () => {
    const yesterdayDose: ProjectedDose = {
      ...sampleDose,
      scheduledDate: '2026-08-14',
    };

    const effective = deriveEffectiveDose(yesterdayDose, [], now);
    expect(effective.status).toBe('missed');
  });

  it('derives status pending when no intake log exists and dose is for a future date', () => {
    const tomorrowDose: ProjectedDose = {
      ...sampleDose,
      scheduledDate: '2026-08-16',
    };

    const effective = deriveEffectiveDose(tomorrowDose, [], now);
    expect(effective.status).toBe('pending');
  });

  it('keeps PRN medicines pending without deriving missed even if scheduled in the past', () => {
    const prnDose: ProjectedDose = {
      ...sampleDose,
      scheduledDate: '2026-08-14',
      isPrn: true,
    };

    const effective = deriveEffectiveDose(prnDose, [], now);
    expect(effective.status).toBe('pending');
  });

  it('batch resolves effective doses with deriveEffectiveDoses', () => {
    const doses: ProjectedDose[] = [
      { ...sampleDose, scheduledDate: '2026-08-14', scheduledMinutes: 480 },
      { ...sampleDose, scheduledDate: '2026-08-15', scheduledMinutes: 480 },
    ];
    const logs: IntakeLogRecord[] = [
      {
        id: 'log-past',
        medicine_id: 'med-101',
        scheduled_date: '2026-08-14',
        bucket: 'morning',
        status: 'taken',
      },
    ];

    const results = deriveEffectiveDoses(doses, logs, now);
    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe('taken');
    expect(results[1]?.status).toBe('missed');
  });
});

describe('evaluateLateDoseRisk (Out-of-Window Guardrail & Dose Stacking Risk)', () => {
  const afternoonDose: EffectiveDose = {
    medicineId: 'med-bp',
    medicineName: 'Amlodipine',
    strength: '5mg',
    doseAmount: '1 tablet',
    scheduledDate: '2026-08-15',
    scheduledMinutes: 840, // 14:00
    bucket: 'afternoon',
    mealInstruction: 'Take with or after lunch',
    isPrn: false,
    status: 'missed',
  };

  const nightDose: EffectiveDose = {
    medicineId: 'med-bp',
    medicineName: 'Amlodipine',
    strength: '5mg',
    doseAmount: '1 tablet',
    scheduledDate: '2026-08-15',
    scheduledMinutes: 1260, // 21:00
    bucket: 'night',
    mealInstruction: 'Take with or after dinner',
    isPrn: false,
    status: 'pending',
  };

  it('returns safe when there is no next scheduled dose', () => {
    const currentMinutes = 1140; // 19:00
    const result = evaluateLateDoseRisk(afternoonDose, null, currentMinutes);

    expect(result.riskLevel).toBe('safe');
    expect(result.recommendation).toBe('take_now');
    expect(result.intervalMinutes).toBeNull();
    expect(result.message).toContain('Safe to take');
  });

  it('triggers warning_dose_stacking when logging late close to the upcoming dose (< 4 hours)', () => {
    // Current time: 19:30 (1170 min). Next dose at 21:00 (1260 min).
    // Interval: 1260 - 1170 = 90 minutes (< 240 min).
    const currentMinutes = 1170;
    const result = evaluateLateDoseRisk(afternoonDose, nightDose, currentMinutes);

    expect(result.riskLevel).toBe('warning_dose_stacking');
    expect(result.recommendation).toBe('skip_and_resume');
    expect(result.intervalMinutes).toBe(90);
    expect(result.message).toContain('too close to your next scheduled dose');
    expect(result.message).toContain('avoid dose stacking');
    expect(result.message).toContain('21:00');
  });

  it('returns safe when taking the late dose with >= 4 hours buffer before next dose', () => {
    // Current time: 15:00 (900 min). Next dose at 21:00 (1260 min).
    // Interval: 1260 - 900 = 360 minutes (6 hours >= 240 min).
    const currentMinutes = 900;
    const result = evaluateLateDoseRisk(afternoonDose, nightDose, currentMinutes);

    expect(result.riskLevel).toBe('safe');
    expect(result.recommendation).toBe('take_now');
    expect(result.intervalMinutes).toBe(360);
    expect(result.message).toContain('Safe to take');
    expect(result.message).toContain('adequate spacing');
  });

  it('warns against double dose when next dose is already due or in the past', () => {
    // Current time: 21:15 (1275 min). Next dose was at 21:00 (1260 min).
    // Interval: 1260 - 1275 = -15 minutes (<= 0).
    const currentMinutes = 1275;
    const result = evaluateLateDoseRisk(afternoonDose, nightDose, currentMinutes);

    expect(result.riskLevel).toBe('warning_dose_stacking');
    expect(result.recommendation).toBe('skip_and_resume');
    expect(result.intervalMinutes).toBeLessThan(0);
    expect(result.message).toContain('already due');
    expect(result.message).toContain('double dose');
  });

  it('calculates interval across midnight when next dose is scheduled for the next day', () => {
    const lateNightDose: EffectiveDose = {
      ...afternoonDose,
      scheduledDate: '2026-08-15',
      scheduledMinutes: 1320, // 22:00
    };
    const nextDayMorningDose: EffectiveDose = {
      ...afternoonDose,
      scheduledDate: '2026-08-16',
      scheduledMinutes: 480, // 08:00 next day
    };

    // Patient considers taking late dose at 23:30 (1410 min) on the 15th
    // Next dose is 08:00 (480 min) on the 16th.
    // Minutes remaining in day: 1440 - 1410 = 30 min. Plus 480 min tomorrow = 510 min (8.5 hrs).
    const resultSafe = evaluateLateDoseRisk(lateNightDose, nextDayMorningDose, 1410);
    expect(resultSafe.riskLevel).toBe('safe');
    expect(resultSafe.intervalMinutes).toBe(510);

    // If patient considers taking it at 05:00 (300 min) on the 16th when next dose is 08:00 (480 min):
    // Interval is 180 min (< 240 min)
    const resultClose = evaluateLateDoseRisk(
      { ...lateNightDose, scheduledDate: '2026-08-16' },
      nextDayMorningDose,
      300
    );
    expect(resultClose.riskLevel).toBe('warning_dose_stacking');
    expect(resultClose.intervalMinutes).toBe(180);
  });
});

describe('calculateTwoTierAdherence & calculateLoggingStreak', () => {
  // Current time: 14:00 (840 min) PKT on 2026-08-15 -> 09:00 UTC
  const now = new Date('2026-08-15T09:00:00Z');

  const makeDose = (
    date: string,
    minutes: number,
    bucket: 'morning' | 'afternoon' | 'night' | 'bedtime',
    isPrn = false,
    medId = 'med-1'
  ): ProjectedDose => ({
    medicineId: medId,
    medicineName: 'CardioCare',
    strength: '10mg',
    doseAmount: '1 tab',
    scheduledDate: date,
    scheduledMinutes: minutes,
    bucket,
    mealInstruction: 'Take with food',
    isPrn,
  });

  it('calculates 100% clinical adherence and correct logging streak when all doses are taken', () => {
    const projectedDoses: ProjectedDose[] = [
      makeDose('2026-08-14', 480, 'morning'),
      makeDose('2026-08-14', 1200, 'night'),
      makeDose('2026-08-13', 480, 'morning'),
      makeDose('2026-08-13', 1200, 'night'),
    ];

    const intakeLogs: IntakeLogRecord[] = [
      { id: '1', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
      { id: '2', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'night', status: 'taken' },
      { id: '3', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'morning', status: 'taken' },
      { id: '4', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'night', status: 'taken' },
    ];

    const stats = calculateTwoTierAdherence(
      projectedDoses,
      intakeLogs,
      { from: '2026-08-13', to: '2026-08-14' },
      now
    );

    expect(stats.clinicalAdherencePercentage).toBe(100);
    expect(stats.percentage).toBe(100);
    expect(stats.scheduled).toBe(4);
    expect(stats.taken).toBe(4);
    expect(stats.dailyLoggingStreak).toBe(2);
    expect(stats.loggingStreak).toBe(2);
    expect(Object.keys(stats.skipReasonsSummary)).toHaveLength(0);
  });

  it('distinguishes clinical adherence from logging streak when doses are skipped with valid reasons', () => {
    // 2026-08-14: 1 taken, 1 skipped with valid reason ("Doctor advised hold")
    // 2026-08-13: 2 taken
    // Clinical Adherence: 3 taken / 4 scheduled = 75%
    // Daily Logging Streak: 2 days (both days fully settled with taken or validly skipped doses)
    const projectedDoses: ProjectedDose[] = [
      makeDose('2026-08-14', 480, 'morning'),
      makeDose('2026-08-14', 1200, 'night'),
      makeDose('2026-08-13', 480, 'morning'),
      makeDose('2026-08-13', 1200, 'night'),
    ];

    const intakeLogs: IntakeLogRecord[] = [
      { id: '1', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
      {
        id: '2',
        medicine_id: 'med-1',
        scheduled_date: '2026-08-14',
        bucket: 'night',
        status: 'skipped',
        skip_reason: 'Doctor advised hold',
      },
      { id: '3', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'morning', status: 'taken' },
      { id: '4', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'night', status: 'taken' },
    ];

    const stats = calculateTwoTierAdherence(
      projectedDoses,
      intakeLogs,
      { from: '2026-08-13', to: '2026-08-14' },
      now
    );

    // Doctor truth: skipped dose counts against clinical adherence rate
    expect(stats.clinicalAdherencePercentage).toBe(75);
    expect(stats.scheduled).toBe(4);
    expect(stats.taken).toBe(3);
    expect(stats.skipped).toBe(1);

    // Patient motivation: streak is preserved because patient actively logged with valid clinical reason
    expect(stats.dailyLoggingStreak).toBe(2);

    // Doctor reporting: aggregates documented skip reason
    expect(stats.skipReasonsSummary['Doctor advised hold']).toBe(1);
  });

  it('breaks logging streak on unexcused skip without a reason', () => {
    // 2026-08-14: 1 taken, 1 skipped without reason
    // 2026-08-13: 2 taken
    const projectedDoses: ProjectedDose[] = [
      makeDose('2026-08-14', 480, 'morning'),
      makeDose('2026-08-14', 1200, 'night'),
      makeDose('2026-08-13', 480, 'morning'),
      makeDose('2026-08-13', 1200, 'night'),
    ];

    const intakeLogs: IntakeLogRecord[] = [
      { id: '1', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
      { id: '2', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'night', status: 'skipped', skip_reason: '' },
      { id: '3', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'morning', status: 'taken' },
      { id: '4', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'night', status: 'taken' },
    ];

    const stats = calculateTwoTierAdherence(
      projectedDoses,
      intakeLogs,
      { from: '2026-08-13', to: '2026-08-14' },
      now
    );

    // Streak is 0 because the most recent settled day (14th) had an unexcused skip
    expect(stats.dailyLoggingStreak).toBe(0);
    expect(stats.skipReasonsSummary['Unspecified']).toBe(1);
  });

  it('breaks logging streak on a missed dose', () => {
    // 2026-08-14: 1 taken, 1 unlogged (>4h overdue -> missed)
    // 2026-08-13: 2 taken
    const projectedDoses: ProjectedDose[] = [
      makeDose('2026-08-14', 480, 'morning'),
      makeDose('2026-08-14', 1200, 'night'),
      makeDose('2026-08-13', 480, 'morning'),
      makeDose('2026-08-13', 1200, 'night'),
    ];

    const intakeLogs: IntakeLogRecord[] = [
      { id: '1', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
      // 14th night dose is unlogged -> missed
      { id: '3', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'morning', status: 'taken' },
      { id: '4', medicine_id: 'med-1', scheduled_date: '2026-08-13', bucket: 'night', status: 'taken' },
    ];

    const stats = calculateTwoTierAdherence(
      projectedDoses,
      intakeLogs,
      { from: '2026-08-13', to: '2026-08-14' },
      now
    );

    expect(stats.missed).toBe(1);
    expect(stats.clinicalAdherencePercentage).toBe(75);
    expect(stats.dailyLoggingStreak).toBe(0);
  });

  it('does not penalize a day still in progress for logging streak', () => {
    // Current time: 14:00 on 2026-08-15
    // Today (15th) has morning dose taken, night dose (21:00) still pending (future)
    // Yesterday (14th) has 2 taken
    const projectedDoses: ProjectedDose[] = [
      makeDose('2026-08-15', 480, 'morning'),
      makeDose('2026-08-15', 1260, 'night'),
      makeDose('2026-08-14', 480, 'morning'),
      makeDose('2026-08-14', 1260, 'night'),
    ];

    const intakeLogs: IntakeLogRecord[] = [
      { id: 'today-m', medicine_id: 'med-1', scheduled_date: '2026-08-15', bucket: 'morning', status: 'taken' },
      // 15th night dose is pending
      { id: 'yest-m', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
      { id: 'yest-n', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'night', status: 'taken' },
    ];

    const streak = calculateLoggingStreak(projectedDoses, intakeLogs, now);
    expect(streak).toBe(1); // 14th counted, 15th in progress ignored
  });

  it('counts today once all of today doses are settled and valid', () => {
    // Today (15th) has morning dose taken and afternoon dose taken
    const projectedDoses: ProjectedDose[] = [
      makeDose('2026-08-15', 480, 'morning'),
      makeDose('2026-08-15', 780, 'afternoon'),
      makeDose('2026-08-14', 480, 'morning'),
      makeDose('2026-08-14', 780, 'afternoon'),
    ];

    const intakeLogs: IntakeLogRecord[] = [
      { id: 't1', medicine_id: 'med-1', scheduled_date: '2026-08-15', bucket: 'morning', status: 'taken' },
      { id: 't2', medicine_id: 'med-1', scheduled_date: '2026-08-15', bucket: 'afternoon', status: 'taken' },
      { id: 'y1', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
      { id: 'y2', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'afternoon', status: 'taken' },
    ];

    const streak = calculateLoggingStreak(projectedDoses, intakeLogs, now);
    expect(streak).toBe(2);
  });

  it('aggregates multiple distinct skip reasons correctly', () => {
    const projectedDoses: ProjectedDose[] = [
      makeDose('2026-08-14', 480, 'morning'),
      makeDose('2026-08-14', 780, 'afternoon'),
      makeDose('2026-08-14', 1260, 'night'),
    ];

    const intakeLogs: IntakeLogRecord[] = [
      { id: '1', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'skipped', skip_reason: 'Fasting for lab test' },
      { id: '2', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'afternoon', status: 'skipped', skip_reason: 'Fasting for lab test' },
      { id: '3', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'night', status: 'skipped', skip_reason: 'Nausea' },
    ];

    const stats = calculateTwoTierAdherence(
      projectedDoses,
      intakeLogs,
      { from: '2026-08-14', to: '2026-08-14' },
      now
    );

    expect(stats.skipReasonsSummary['Fasting for lab test']).toBe(2);
    expect(stats.skipReasonsSummary['Nausea']).toBe(1);
    expect(stats.clinicalAdherencePercentage).toBe(0);
    expect(stats.dailyLoggingStreak).toBe(1); // Settled with valid reasons
  });

  it('works identically via calculateAdherenceMetrics alias', () => {
    const projectedDoses: ProjectedDose[] = [makeDose('2026-08-14', 480, 'morning')];
    const intakeLogs: IntakeLogRecord[] = [
      { id: '1', medicine_id: 'med-1', scheduled_date: '2026-08-14', bucket: 'morning', status: 'taken' },
    ];

    const res1 = calculateTwoTierAdherence(projectedDoses, intakeLogs, { from: '2026-08-14', to: '2026-08-14' }, now);
    const res2 = calculateAdherenceMetrics(projectedDoses, intakeLogs, { from: '2026-08-14', to: '2026-08-14' }, now);

    expect(res1).toEqual(res2);
  });
});
