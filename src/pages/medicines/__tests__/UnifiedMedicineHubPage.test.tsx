import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UnifiedMedicineHubPage } from '../UnifiedMedicineHubPage';
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
  discontinueMedication: vi.fn(),
  logPrnDose: vi.fn(),
}));

vi.mock('../../../lib/db', () => ({
  dosesRepo: {
    listDosesForRange: vi.fn().mockResolvedValue([]),
    listDosesForDate: vi.fn().mockResolvedValue([]),
  },
  medicinesRepo: {
    listMedicines: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../lib/inventory', () => ({
  readInventory: vi.fn().mockReturnValue({}),
  writeInventory: vi.fn(),
}));

type Dose = Tables<'doses'>;
type Medicine = Tables<'medicines'>;

describe('UnifiedMedicineHubPage (Unified Medicine Command Center)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-03T09:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders top control strip with tabs and defaults to schedule tab', async () => {
    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [],
      medicines: [],
      medicinesMap: {},
      inventory: {},
    });

    render(
      <MemoryRouter initialEntries={['/medicines']}>
        <UnifiedMedicineHubPage defaultTab="schedule" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Medication Command Center')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Today's Schedule/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Cabinet & Supply/i })).toBeInTheDocument();
    });
  });

  it('shows proactive refill banner when any critical chronic medicine has <= 3 days supply', async () => {
    const lowStockChronicMed: Medicine = {
      id: 'med-metformin',
      profile_id: 'profile-test',
      medicine_name: 'Metformin',
      strength: '500 mg',
      dose_amount: '1 tablet',
      with_food: true,
      frequency_code: 'OD', // 1 per day
      instructions: null,
      is_active: true,
      is_ongoing: true,
      start_date: '2026-01-01',
    } as unknown as Medicine;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [],
      medicines: [lowStockChronicMed],
      medicinesMap: { 'med-metformin': lowStockChronicMed },
      inventory: { 'med-metformin': 2 }, // 2 pills left = 2 days left (<= 3 days)
    });

    render(
      <MemoryRouter initialEntries={['/medicines']}>
        <UnifiedMedicineHubPage defaultTab="schedule" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Critical Supply Alert: 1 medicine needs immediate refill/i)).toBeInTheDocument();
      expect(screen.getByText(/Metformin \(2 pills · 2d left\)/i)).toBeInTheDocument();
      expect(screen.getByText('≤ 3 Days Left')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Order via WhatsApp/i })).toBeInTheDocument();
    });
  });

  it('switches between Today Schedule and Cabinet & Supply view when segmented tab is clicked', async () => {
    const activeMed: Medicine = {
      id: 'med-atorvastatin',
      profile_id: 'profile-test',
      medicine_name: 'Atorvastatin',
      strength: '20 mg',
      dose_amount: '1 tablet',
      with_food: false,
      frequency_code: 'OD',
      instructions: null,
      is_active: true,
      is_ongoing: true,
      start_date: '2026-01-01',
    } as unknown as Medicine;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [],
      medicines: [activeMed],
      medicinesMap: { 'med-atorvastatin': activeMed },
      inventory: { 'med-atorvastatin': 20 },
    });

    render(
      <MemoryRouter initialEntries={['/medicines']}>
        <UnifiedMedicineHubPage defaultTab="schedule" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Cabinet & Supply/i })).toBeInTheDocument();
    });

    // Click on Cabinet & Supply tab
    fireEvent.click(screen.getByRole('tab', { name: /Cabinet & Supply/i }));

    // Verify Cabinet view renders
    await waitFor(() => {
      expect(screen.getByText(/Taking now/i)).toBeInTheDocument();
      expect(screen.getByText(/As needed/i)).toBeInTheDocument();
      expect(screen.getByText(/Finished/i)).toBeInTheDocument();
    });
  });

  it('displays live inventory badge and 1-tap refill button on schedule dose cards', async () => {
    const mockMed: Medicine = {
      id: 'med-noon',
      profile_id: 'profile-test',
      medicine_name: 'Paracetamol',
      strength: '500 mg',
      dose_amount: '1 tablet',
      with_food: true,
      frequency_code: 'NOON',
      instructions: null,
      is_active: true,
    } as unknown as Medicine;

    const mockDose: Dose = {
      id: 'dose-noon',
      profile_id: 'profile-test',
      medicine_id: 'med-noon',
      scheduled_date: '2026-10-03',
      scheduled_minutes: 840,
      status: 'pending',
      taken_at: null,
    } as Dose;

    vi.mocked(medicationRegimen.getDaySchedule).mockResolvedValue({
      doses: [mockDose],
      medicines: [mockMed],
      medicinesMap: { 'med-noon': mockMed },
      inventory: { 'med-noon': 3 },
    });

    render(
      <MemoryRouter initialEntries={['/medicines']}>
        <UnifiedMedicineHubPage defaultTab="schedule" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Afternoon')).toBeInTheDocument();
      expect(screen.getByText(/3 pills left/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Refill/i }).length).toBeGreaterThan(0);
    });
  });
});
