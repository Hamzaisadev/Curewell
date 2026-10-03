import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TodaySchedulePage } from '../TodaySchedulePage';
import * as medicationRegimen from '../../../domain/medicationRegimen';
import type { Tables } from '../../../lib/supabase/types';

vi.mock('../../../lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-test' },
    profile: { id: 'profile-test', user_id: 'user-test', full_name: 'Test Patient' },
  }),
}));

vi.mock('../../../domain/medicationRegimen', () => ({
  getDaySchedule: vi.fn(),
  recordDoseAction: vi.fn(),
  batchRecordDosesTaken: vi.fn(),
}));

vi.mock('../../../lib/db', () => ({
  dosesRepo: {
    listDosesForRange: vi.fn().mockResolvedValue([]),
    listDosesForDate: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../lib/inventory', () => ({
  readInventory: vi.fn().mockReturnValue({}),
}));

type Dose = Tables<'doses'>;
type Medicine = Tables<'medicines'>;

describe('TodaySchedulePage (Adaptive 3+1 Buckets, Past Doses Drawer & Meal Badges)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    // Set system time to 14:00 PKT (afternoon) on 2026-10-03 (09:00 UTC)
    vi.setSystemTime(new Date('2026-10-03T09:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders standard 3 buckets (Morning, Afternoon, Night) when no bedtime medicine is active', async () => {
    const mockMeds: Medicine[] = [
      {
        id: 'med-morning',
        profile_id: 'profile-test',
        medicine_name: 'Metformin',
        strength: '500 mg',
        dose_amount: '1 tablet',
        with_food: true,
        frequency_code: 'OD',
        instructions: 'Take in morning',
        is_active: true,
      } as unknown as Medicine,
      {
        id: 'med-afternoon',
        profile_id: 'profile-test',
        medicine_name: 'Paracetamol',
        strength: '500 mg',
        dose_amount: '1 tablet',
        with_food: true,
        frequency_code: 'NOON',
        instructions: null,
        is_active: true,
      } as unknown as Medicine,
      {
        id: 'med-night',
        profile_id: 'profile-test',
        medicine_name: 'Atorvastatin',
        strength: '20 mg',
        dose_amount: '1 tablet',
        with_food: false,
        frequency_code: 'OD',
        instructions: null,
        is_active: true,
      } as unknown as Medicine,
    ];

    const mockDoses: Dose[] = [
      {
        id: 'dose-m',
        profile_id: 'profile-test',
        medicine_id: 'med-morning',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 480, // 08:00 AM (morning)
        status: 'taken',
        taken_at: '2026-10-03T08:15:00Z',
      } as Dose,
      {
        id: 'dose-a',
        profile_id: 'profile-test',
        medicine_id: 'med-afternoon',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 840, // 14:00 PM (afternoon)
        status: 'pending',
        taken_at: null,
      } as Dose,
      {
        id: 'dose-n',
        profile_id: 'profile-test',
        medicine_id: 'med-night',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 1200, // 20:00 PM (night)
        status: 'pending',
        taken_at: null,
      } as Dose,
    ];

    const medicinesMap: Record<string, Medicine> = {
      'med-morning': mockMeds[0]!,
      'med-afternoon': mockMeds[1]!,
      'med-night': mockMeds[2]!,
    };

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: mockDoses,
      medicines: mockMeds,
      medicinesMap,
      inventory: {},
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Morning')).toBeInTheDocument();
      expect(screen.getByText('Afternoon')).toBeInTheDocument();
      expect(screen.getByText('Night')).toBeInTheDocument();
    });

    // Bedtime bucket should NOT be rendered when no bedtime medication is active
    expect(screen.queryByText('Bedtime')).not.toBeInTheDocument();

    // Doses in active dayparts show contextual meal badges
    expect(screen.getAllByText('Take with or after lunch').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Take on an empty stomach').length).toBeGreaterThan(0);
  });

  it('dynamically adapts to 3+1 buckets (renders Bedtime) when a bedtime medicine is present', async () => {
    const mockMeds: Medicine[] = [
      {
        id: 'med-bedtime',
        profile_id: 'profile-test',
        medicine_name: 'Zolpidem',
        strength: '10 mg',
        dose_amount: '1 tablet',
        with_food: null,
        frequency_code: 'QHS',
        instructions: 'Take 1 tablet at bedtime',
        is_active: true,
      } as unknown as Medicine,
    ];

    const mockDoses: Dose[] = [
      {
        id: 'dose-bt',
        profile_id: 'profile-test',
        medicine_id: 'med-bedtime',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 1350, // 22:30 PM (bedtime)
        status: 'pending',
        taken_at: null,
      } as Dose,
    ];

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: mockDoses,
      medicines: mockMeds,
      medicinesMap: { 'med-bedtime': mockMeds[0]! },
      inventory: {},
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Morning')).toBeInTheDocument();
      expect(screen.getByText('Afternoon')).toBeInTheDocument();
      expect(screen.getByText('Night')).toBeInTheDocument();
      expect(screen.getByText('Bedtime')).toBeInTheDocument();
    });

    // Bedtime time range is rendered properly
    expect(screen.getByText('22:00 – 04:59')).toBeInTheDocument();
    expect(screen.getAllByText('Zolpidem').length).toBeGreaterThan(0);
  });

  it('isolates unlogged doses from closed buckets into the dedicated "Past / Missed Doses" drawer', async () => {
    // Current time is 14:00 (afternoon). Morning window closed at 12:00.
    const mockMeds: Medicine[] = [
      {
        id: 'med-morning-unlogged',
        profile_id: 'profile-test',
        medicine_name: 'Levothyroxine',
        strength: '100 mcg',
        dose_amount: '1 tablet',
        with_food: false,
        frequency_code: 'OD',
        instructions: null,
        is_active: true,
      } as unknown as Medicine,
      {
        id: 'med-afternoon-active',
        profile_id: 'profile-test',
        medicine_name: 'Ibuprofen',
        strength: '400 mg',
        dose_amount: '1 tablet',
        with_food: true,
        frequency_code: 'PRN',
        instructions: null,
        is_active: true,
      } as unknown as Medicine,
    ];

    const mockDoses: Dose[] = [
      {
        id: 'dose-overdue',
        profile_id: 'profile-test',
        medicine_id: 'med-morning-unlogged',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 480, // 08:00 AM (morning window closed at 12:00)
        status: 'pending',
        taken_at: null,
      } as Dose,
      {
        id: 'dose-current',
        profile_id: 'profile-test',
        medicine_id: 'med-afternoon-active',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 840, // 14:00 PM (afternoon window open)
        status: 'pending',
        taken_at: null,
      } as Dose,
    ];

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: mockDoses,
      medicines: mockMeds,
      medicinesMap: {
        'med-morning-unlogged': mockMeds[0]!,
        'med-afternoon-active': mockMeds[1]!,
      },
      inventory: {},
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Past / Missed Doses drawer must appear
      expect(screen.getByText('Past / Missed Doses')).toBeInTheDocument();
      expect(screen.getByText('1 dose')).toBeInTheDocument();
    });

    // The overdue dose (Levothyroxine) is rendered inside the drawer with its contextual badge
    expect(screen.getByText('Levothyroxine')).toBeInTheDocument();
    expect(screen.getAllByText('Take on an empty stomach').length).toBeGreaterThan(0);

    // The Morning daypart block shows that the unlogged dose was moved to the drawer
    expect(screen.getByText(/1 overdue dose in Past Doses drawer/i)).toBeInTheDocument();

    // The Afternoon daypart block shows the active current dose
    expect(screen.getAllByText('Ibuprofen').length).toBeGreaterThan(0);
  });

  it('allows logging an on-time dose directly without triggering the safety modal', async () => {
    const mockMed: Medicine = {
      id: 'med-ontime',
      profile_id: 'profile-test',
      medicine_name: 'Paracetamol',
      strength: '500 mg',
      dose_amount: '1 tablet',
      with_food: true,
      frequency_code: 'NOON',
      instructions: null,
      is_active: true,
    } as unknown as Medicine;

    // Current time is 14:00 (840 min). Dose is scheduled for 14:00 (afternoon).
    const mockDose: Dose = {
      id: 'dose-ontime',
      profile_id: 'profile-test',
      medicine_id: 'med-ontime',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 840,
      status: 'pending',
      taken_at: null,
    } as Dose;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [mockDose],
      medicines: [mockMed],
      medicinesMap: { 'med-ontime': mockMed },
      inventory: {},
    });

    vi.mocked(medicationRegimen.recordDoseAction).mockResolvedValue({
      updatedDose: { ...mockDose, status: 'taken', taken_at: '2026-10-03T09:01:00Z' },
      remainingPills: null,
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Afternoon')).toBeInTheDocument();
    });

    // In the daypart block, the on-time dose has a "Take" button
    const takeBtn = screen.getByRole('button', { name: /^Take$/i });
    expect(takeBtn).toBeInTheDocument();
    fireEvent.click(takeBtn);

    await waitFor(() => {
      expect(medicationRegimen.recordDoseAction).toHaveBeenCalledWith({
        dose: mockDose,
        newStatus: 'taken',
        profileId: 'profile-test',
      });
    });

    // Safety modal was NOT triggered
    expect(screen.queryByText('Late Dose Safety Check')).not.toBeInTheDocument();
  });

  it('triggers Late Dose Safety modal for overdue dose and records with earlier timestamp on "I took it earlier today"', async () => {
    const mockMed: Medicine = {
      id: 'med-overdue',
      profile_id: 'profile-test',
      medicine_name: 'Metformin',
      strength: '500 mg',
      dose_amount: '1 tablet',
      with_food: true,
      frequency_code: 'OD',
      instructions: null,
      is_active: true,
    } as unknown as Medicine;

    const mockDose: Dose = {
      id: 'dose-overdue',
      profile_id: 'profile-test',
      medicine_id: 'med-overdue',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 480, // morning dose, current time 14:00 (overdue)
      status: 'pending',
      taken_at: null,
    } as Dose;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [mockDose],
      medicines: [mockMed],
      medicinesMap: { 'med-overdue': mockMed },
      inventory: {},
    });

    vi.mocked(medicationRegimen.recordDoseAction).mockResolvedValue({
      updatedDose: { ...mockDose, status: 'taken', taken_at: '2026-10-03T08:00:00Z' },
      remainingPills: null,
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Past / Missed Doses')).toBeInTheDocument();
    });

    // Click "Log Overdue" button inside the Past Doses drawer
    const logBtn = screen.getByRole('button', { name: /Log Overdue/i });
    expect(logBtn).toBeInTheDocument();
    fireEvent.click(logBtn);

    // Intercepted: Late Dose Safety Check Dialog opens
    await waitFor(() => {
      expect(screen.getByText('Late Dose Safety Check')).toBeInTheDocument();
      expect(
        screen.getByText('Did you take this dose earlier today, or are you taking it right now?')
      ).toBeInTheDocument();
    });

    // Option 1: "I took it earlier today"
    const earlierBtn = screen.getByRole('button', { name: /I took it earlier today/i });
    expect(earlierBtn).toBeInTheDocument();
    fireEvent.click(earlierBtn);

    await waitFor(() => {
      expect(medicationRegimen.recordDoseAction).toHaveBeenCalledWith({
        dose: mockDose,
        newStatus: 'taken',
        takenAt: expect.any(String),
        profileId: 'profile-test',
      });
    });
  });

  it('evaluates safe and logs immediately when patient chooses "I am taking it right now" with no conflicting upcoming dose', async () => {
    const mockMed: Medicine = {
      id: 'med-od',
      profile_id: 'profile-test',
      medicine_name: 'Atorvastatin',
      strength: '20 mg',
      dose_amount: '1 tablet',
      with_food: false,
      frequency_code: 'OD',
      instructions: null,
      is_active: true,
    } as unknown as Medicine;

    const mockDose: Dose = {
      id: 'dose-od',
      profile_id: 'profile-test',
      medicine_id: 'med-od',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 480, // morning dose, current time 14:00 (no other dose today)
      status: 'pending',
      taken_at: null,
    } as Dose;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [mockDose],
      medicines: [mockMed],
      medicinesMap: { 'med-od': mockMed },
      inventory: {},
    });

    vi.mocked(medicationRegimen.recordDoseAction).mockResolvedValue({
      updatedDose: { ...mockDose, status: 'taken', taken_at: '2026-10-03T09:00:00Z' },
      remainingPills: null,
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Past / Missed Doses')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Log Overdue/i }));

    await waitFor(() => {
      expect(screen.getByText('Late Dose Safety Check')).toBeInTheDocument();
    });

    const takingNowBtn = screen.getByRole('button', { name: /I am taking it right now/i });
    fireEvent.click(takingNowBtn);

    // Safe! Immediately logs as taken
    await waitFor(() => {
      expect(medicationRegimen.recordDoseAction).toHaveBeenCalledWith({
        dose: mockDose,
        newStatus: 'taken',
        takenAt: expect.any(String),
        profileId: 'profile-test',
      });
    });
  });

  it('displays dose-stacking clinical warning when "Taking now" is too close to upcoming dose, and allows skip or confirmation', async () => {
    // BD regimen: Morning at 08:00 (480), Afternoon/Evening at 16:00 (960).
    // Current time: 14:00 (840 min).
    // Morning dose is overdue. Taking now at 14:00 is only 120 minutes from 16:00 (< 240 min) -> dose-stacking risk!
    const mockMed: Medicine = {
      id: 'med-bd',
      profile_id: 'profile-test',
      medicine_name: 'Metformin',
      strength: '500 mg',
      dose_amount: '1 tablet',
      with_food: true,
      frequency_code: 'BD',
      instructions: null,
      is_active: true,
    } as unknown as Medicine;

    const morningDose: Dose = {
      id: 'dose-morning-overdue',
      profile_id: 'profile-test',
      medicine_id: 'med-bd',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 480, // 08:00 AM (overdue at 14:00)
      status: 'pending',
      taken_at: null,
    } as Dose;

    const eveningDose: Dose = {
      id: 'dose-evening-upcoming',
      profile_id: 'profile-test',
      medicine_id: 'med-bd',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 960, // 16:00 PM (upcoming in 120 min)
      status: 'pending',
      taken_at: null,
    } as Dose;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [morningDose, eveningDose],
      medicines: [mockMed],
      medicinesMap: { 'med-bd': mockMed },
      inventory: {},
    });

    vi.mocked(medicationRegimen.recordDoseAction).mockResolvedValue({
      updatedDose: {
        ...morningDose,
        status: 'skipped',
        skipped_reason: 'Skipped due to dose-stacking risk',
      },
      remainingPills: null,
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Past / Missed Doses')).toBeInTheDocument();
    });

    // Click Log Overdue on morning dose
    fireEvent.click(screen.getByRole('button', { name: /Log Overdue/i }));

    await waitFor(() => {
      expect(screen.getByText('Late Dose Safety Check')).toBeInTheDocument();
    });

    // Patient clicks "I am taking it right now"
    fireEvent.click(screen.getByRole('button', { name: /I am taking it right now/i }));

    // Clinical warning alert MUST appear
    await waitFor(() => {
      expect(screen.getByText(/Clinical Warning: Dose Stacking Risk/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Warning: Taking this dose right now is very close to your upcoming dose. Taking doses too close together can lead to accidental double-dosing or side effects./i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Skip this dose per safety advice/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Take anyway/i })).toBeInTheDocument();
    });

    // Action A: Patient chooses "Skip this dose per safety advice"
    fireEvent.click(screen.getByRole('button', { name: /Skip this dose per safety advice/i }));

    await waitFor(() => {
      expect(medicationRegimen.recordDoseAction).toHaveBeenCalledWith({
        dose: morningDose,
        newStatus: 'skipped',
        skipReason: 'Skipped due to dose-stacking risk',
        profileId: 'profile-test',
      });
    });
  });

  it('allows patient to proceed with "Take anyway" after dose-stacking warning', async () => {
    const mockMed: Medicine = {
      id: 'med-bd-2',
      profile_id: 'profile-test',
      medicine_name: 'Metformin',
      strength: '500 mg',
      dose_amount: '1 tablet',
      with_food: true,
      frequency_code: 'BD',
      instructions: null,
      is_active: true,
    } as unknown as Medicine;

    const morningDose: Dose = {
      id: 'dose-m-2',
      profile_id: 'profile-test',
      medicine_id: 'med-bd-2',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 480, // 08:00 AM (overdue at 14:00)
      status: 'pending',
      taken_at: null,
    } as Dose;

    const eveningDose: Dose = {
      id: 'dose-e-2',
      profile_id: 'profile-test',
      medicine_id: 'med-bd-2',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 960, // 16:00 PM (upcoming in 120 min)
      status: 'pending',
      taken_at: null,
    } as Dose;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [morningDose, eveningDose],
      medicines: [mockMed],
      medicinesMap: { 'med-bd-2': mockMed },
      inventory: {},
    });

    vi.mocked(medicationRegimen.recordDoseAction).mockResolvedValue({
      updatedDose: {
        ...morningDose,
        status: 'taken',
        taken_at: '2026-10-03T09:00:00Z',
      },
      remainingPills: 15,
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Past / Missed Doses')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Log Overdue/i }));

    await waitFor(() => {
      expect(screen.getByText('Late Dose Safety Check')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /I am taking it right now/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Take anyway/i })).toBeInTheDocument();
    });

    // Patient clicks "Take anyway"
    fireEvent.click(screen.getByRole('button', { name: /Take anyway/i }));

    await waitFor(() => {
      expect(medicationRegimen.recordDoseAction).toHaveBeenCalledWith({
        dose: morningDose,
        newStatus: 'taken',
        takenAt: expect.any(String),
        profileId: 'profile-test',
      });
    });
  });

  it('features Two-Tier Adherence UI: Daily Logging Streak and Pharmacological Compliance with documented skip reasons', async () => {
    const mockMeds: Medicine[] = [
      {
        id: 'med-1',
        profile_id: 'profile-test',
        medicine_name: 'Metformin',
        strength: '500 mg',
        dose_amount: '1 tablet',
        with_food: true,
        frequency_code: 'OD',
        instructions: null,
        is_active: true,
      } as unknown as Medicine,
      {
        id: 'med-2',
        profile_id: 'profile-test',
        medicine_name: 'Lisinopril',
        strength: '10 mg',
        dose_amount: '1 tablet',
        with_food: false,
        frequency_code: 'OD',
        instructions: null,
        is_active: true,
      } as unknown as Medicine,
    ];

    const mockDoses: Dose[] = [
      {
        id: 'dose-1',
        profile_id: 'profile-test',
        medicine_id: 'med-1',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 480,
        status: 'taken',
        taken_at: '2026-10-03T08:00:00Z',
      } as Dose,
      {
        id: 'dose-2',
        profile_id: 'profile-test',
        medicine_id: 'med-2',
        scheduled_date: '2026-10-03',
        scheduled_minutes: 840,
        status: 'skipped',
        skipped_reason: 'Doctor told me to stop',
        taken_at: null,
      } as Dose,
    ];

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: mockDoses,
      medicines: mockMeds,
      medicinesMap: {
        'med-1': mockMeds[0]!,
        'med-2': mockMeds[1]!,
      },
      inventory: {},
    });

    render(
      <MemoryRouter>
        <TodaySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Tier 1: Daily Logging Streak
      expect(screen.getByText('Tier 1: Habit Streak')).toBeInTheDocument();
      expect(screen.getByText('Daily Routine Maintained')).toBeInTheDocument();
      expect(
        screen.getByText('Logging all doses—including excused clinical holds—keeps your streak alive.')
      ).toBeInTheDocument();

      // Tier 2: Clinical Adherence Rate
      expect(screen.getByText('Tier 2: Clinical Rate')).toBeInTheDocument();
      expect(screen.getByText('Pharmacological Compliance')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText(/1 of 2 taken/i)).toBeInTheDocument();

      // Tooltip/badge showing documented skip reasons
      expect(screen.getByText(/1 dose held per doctor advice/i)).toBeInTheDocument();
    });
  });
});
