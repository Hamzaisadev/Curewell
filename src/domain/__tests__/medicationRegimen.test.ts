import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recordPrescription,
  recordDoseAction,
  batchRecordDosesTaken,
  getDaySchedule,
  discontinueMedication,
  logPrnDose,
  type Medicine,
  type Dose,
} from '../medicationRegimen';
import { medicinesRepo, dosesRepo } from '../../lib/db';
import { readInventory, writeInventory } from '../../lib/inventory';

vi.mock('../../lib/db', () => ({
  medicinesRepo: {
    createMedicine: vi.fn(),
    listMedicines: vi.fn(),
    discontinueMedicine: vi.fn(),
  },
  dosesRepo: {
    createDoses: vi.fn(),
    listDosesForDate: vi.fn(),
    updateDoseStatus: vi.fn(),
    deleteFuturePendingDoses: vi.fn(),
  },
}));

describe('medicationRegimen module', () => {
  const profileId = 'test-profile-1';
  const userId = 'test-user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('recordPrescription', () => {
    it('creates medicine, seeds inventory, and expands deterministic doses', async () => {
      const mockCreatedMed: Medicine = {
        id: 'med-123',
        user_id: userId,
        profile_id: profileId,
        visit_id: 'visit-999',
        medicine_name: 'Metformin',
        strength: '500mg',
        form: 'Tablet',
        dose_amount: '1 tablet',
        frequency_code: 'BD',
        frequency_raw: 'BD',
        duration_days: 7,
        duration_raw: '7 days',
        start_date: '2026-10-01',
        end_date: '2026-10-07',
        is_ongoing: false,
        is_otc: false,
        instructions: 'After meals',
        with_food: true,
        currency: 'PKR',
        unit_cost: null,
        discontinued_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(medicinesRepo.createMedicine).mockResolvedValue(mockCreatedMed);
      vi.mocked(dosesRepo.createDoses).mockResolvedValue([]);

      const result = await recordPrescription({
        userId,
        profileId,
        visitId: 'visit-999',
        scheduleStartDate: '2026-10-01',
        medicines: [
          {
            medicine_name: 'Metformin',
            strength: '500mg',
            frequency_raw: 'BD',
            duration_raw: '7 days',
            with_food: true,
          },
        ],
      });

      expect(result.createdMedicines).toHaveLength(1);
      expect(medicinesRepo.createMedicine).toHaveBeenCalledWith(
        expect.objectContaining({
          medicine_name: 'Metformin',
          frequency_code: 'BD',
          duration_days: 7,
          start_date: '2026-10-01',
          end_date: '2026-10-07',
        })
      );

      // BD = 2 times per day * 7 days = 14 doses
      expect(dosesRepo.createDoses).toHaveBeenCalled();
      const doseArgs = vi.mocked(dosesRepo.createDoses).mock.calls[0]![0];
      expect(doseArgs).toHaveLength(14);
      expect(result.createdDosesCount).toBe(14);

      // Inventory should be seeded: 7 * 2 + 4 = 18 pills
      const inv = readInventory(profileId);
      expect(inv['med-123']).toBe(18);
    });

    it('honors initial_pill_count if provided', async () => {
      const mockCreatedMed: Medicine = {
        id: 'med-custom',
        user_id: userId,
        profile_id: profileId,
        visit_id: null,
        medicine_name: 'Panadol',
        strength: '500mg',
        form: 'Tablet',
        dose_amount: '1 tablet',
        frequency_code: 'PRN',
        frequency_raw: 'As needed',
        duration_days: null,
        duration_raw: null,
        start_date: '2026-10-01',
        end_date: null,
        is_ongoing: true,
        is_otc: true,
        instructions: null,
        with_food: null,
        currency: 'PKR',
        unit_cost: null,
        discontinued_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(medicinesRepo.createMedicine).mockResolvedValue(mockCreatedMed);

      await recordPrescription({
        userId,
        profileId,
        medicines: [
          {
            medicine_name: 'Panadol',
            initial_pill_count: 50,
            frequency_raw: 'PRN',
          },
        ],
      });

      const inv = readInventory(profileId);
      expect(inv['med-custom']).toBe(50);
    });
  });

  describe('recordDoseAction', () => {
    const sampleDose: Dose = {
      id: 'dose-1',
      user_id: userId,
      profile_id: profileId,
      medicine_id: 'med-1',
      scheduled_date: '2026-10-01',
      scheduled_minutes: 540,
      status: 'pending',
      taken_at: null,
      skipped_reason: null,
      snoozed_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('decrements pill count when marking dose taken', async () => {
      writeInventory(profileId, { 'med-1': 10 });
      vi.mocked(dosesRepo.updateDoseStatus).mockResolvedValue({
        ...sampleDose,
        status: 'taken',
        taken_at: new Date().toISOString(),
      });

      const res = await recordDoseAction({
        dose: sampleDose,
        newStatus: 'taken',
        profileId,
      });

      expect(dosesRepo.updateDoseStatus).toHaveBeenCalledWith('dose-1', 'taken');
      expect(res.remainingPills).toBe(9);
      expect(readInventory(profileId)['med-1']).toBe(9);
    });

    it('increments pill count back when undoing taken dose to pending', async () => {
      writeInventory(profileId, { 'med-1': 9 });
      const takenDose: Dose = { ...sampleDose, status: 'taken', taken_at: new Date().toISOString() };
      vi.mocked(dosesRepo.updateDoseStatus).mockResolvedValue({ ...sampleDose, status: 'pending' });

      const res = await recordDoseAction({
        dose: takenDose,
        newStatus: 'pending',
        profileId,
      });

      expect(dosesRepo.updateDoseStatus).toHaveBeenCalledWith('dose-1', 'pending');
      expect(res.remainingPills).toBe(10);
      expect(readInventory(profileId)['med-1']).toBe(10);
    });

    it('records skip reason and leaves inventory intact when skipping pending dose', async () => {
      writeInventory(profileId, { 'med-1': 10 });
      vi.mocked(dosesRepo.updateDoseStatus).mockResolvedValue({
        ...sampleDose,
        status: 'skipped',
        skipped_reason: 'Side effect',
      });

      const res = await recordDoseAction({
        dose: sampleDose,
        newStatus: 'skipped',
        skipReason: 'Side effect',
        profileId,
      });

      expect(res.updatedDose.status).toBe('skipped');
      expect(dosesRepo.updateDoseStatus).toHaveBeenCalledWith('dose-1', 'skipped', 'Side effect');
      expect(readInventory(profileId)['med-1']).toBe(10);
    });
  });

  describe('batchRecordDosesTaken', () => {
    it('marks all actionable doses as taken and decrements inventory', async () => {
      writeInventory(profileId, { 'med-1': 10, 'med-2': 5 });
      const d1: Dose = {
        id: 'd-1',
        user_id: userId,
        profile_id: profileId,
        medicine_id: 'med-1',
        scheduled_date: '2026-10-01',
        scheduled_minutes: 540,
        status: 'pending',
        taken_at: null,
        skipped_reason: null,
        snoozed_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const d2: Dose = {
        ...d1,
        id: 'd-2',
        medicine_id: 'med-2',
      };

      vi.mocked(dosesRepo.updateDoseStatus).mockImplementation(async (id) => ({
        ...d1,
        id,
        status: 'taken',
      }));

      const res = await batchRecordDosesTaken([d1, d2], profileId);
      expect(res.count).toBe(2);
      expect(res.updatedDoses.every((d) => d.status === 'taken')).toBe(true);

      const inv = readInventory(profileId);
      expect(inv['med-1']).toBe(9);
      expect(inv['med-2']).toBe(4);
    });
  });

  describe('discontinueMedication', () => {
    it('discontinues medicine and deletes future pending doses', async () => {
      vi.mocked(medicinesRepo.discontinueMedicine).mockResolvedValue({} as Medicine);
      vi.mocked(dosesRepo.deleteFuturePendingDoses).mockResolvedValue();

      await discontinueMedication('med-123', profileId, '2026-10-01');

      expect(medicinesRepo.discontinueMedicine).toHaveBeenCalledWith(
        'med-123',
        expect.any(String)
      );
      expect(dosesRepo.deleteFuturePendingDoses).toHaveBeenCalledWith('med-123', '2026-10-01');
    });
  });

  describe('logPrnDose', () => {
    it('creates taken dose and decrements inventory', async () => {
      writeInventory(profileId, { 'med-prn': 20 });
      const createdDose: Dose = {
        id: 'dose-prn',
        user_id: userId,
        profile_id: profileId,
        medicine_id: 'med-prn',
        scheduled_date: '2026-10-01',
        scheduled_minutes: 720,
        status: 'taken',
        taken_at: new Date().toISOString(),
        skipped_reason: null,
        snoozed_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(dosesRepo.createDoses).mockResolvedValue([createdDose]);

      const res = await logPrnDose({
        medicineId: 'med-prn',
        profileId,
        userId,
        dateStr: '2026-10-01',
        scheduledMinutes: 720,
      });

      expect(res.id).toBe('dose-prn');
      expect(readInventory(profileId)['med-prn']).toBe(19);
    });
  });

  describe('getDaySchedule', () => {
    it('returns existing doses if already in database for that date', async () => {
      const existingDose: Dose = {
        id: 'dose-existing',
        user_id: userId,
        profile_id: profileId,
        medicine_id: 'med-1',
        scheduled_date: '2026-10-01',
        scheduled_minutes: 480,
        status: 'pending',
        taken_at: null,
        skipped_reason: null,
        snoozed_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      vi.mocked(dosesRepo.listDosesForDate).mockResolvedValue([existingDose]);
      vi.mocked(medicinesRepo.listMedicines).mockResolvedValue([]);

      const result = await getDaySchedule(profileId, '2026-10-01');

      expect(result.doses).toHaveLength(1);
      expect(result.doses[0]?.id).toBe('dose-existing');
    });
  });
});
