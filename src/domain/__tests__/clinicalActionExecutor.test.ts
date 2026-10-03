/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeClinicalAction } from '../clinicalActionExecutor';
import { medicinesRepo, sideEffectsRepo, testOrdersRepo, visitsRepo, dosesRepo } from '../../lib/db';

vi.mock('../../lib/db', () => ({
  medicinesRepo: {
    listMedicines: vi.fn(),
    updateMedicine: vi.fn(),
  },
  sideEffectsRepo: {
    createSideEffect: vi.fn(),
  },
  testOrdersRepo: {
    createTestOrder: vi.fn(),
  },
  visitsRepo: {
    createVisit: vi.fn(),
  },
  dosesRepo: {
    deleteFuturePendingDoses: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('clinicalActionExecutor module', () => {
  const profileId = 'patient-profile-executor';
  const userId = 'user-executor';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('adjust_schedule', () => {
    it('finds medication by fuzzy match and updates instructions and food flag', async () => {
      vi.mocked(medicinesRepo.listMedicines).mockResolvedValue([
        {
          id: 'med-metformin-id',
          medicine_name: 'Metformin 500mg',
          instructions: 'Take 1 tablet daily',
          with_food: false,
        } as any,
      ]);
      vi.mocked(medicinesRepo.updateMedicine).mockImplementation(async (id, updates) => ({
        id,
        ...updates,
      } as any));

      const result = await executeClinicalAction(
        {
          type: 'adjust_schedule',
          data: {
            medicine_name: 'Metformin',
            new_time: '08:00 AM',
            meal_relation: 'after breakfast',
            adjustment_reason: 'Prevent GI upset',
          },
        },
        { profileId, userId }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Metformin 500mg');
      expect(medicinesRepo.updateMedicine).toHaveBeenCalledWith('med-metformin-id', {
        instructions: 'Take 1 tablet daily [Updated schedule: 08:00 AM after breakfast]',
        with_food: true,
      });
      expect(dosesRepo.deleteFuturePendingDoses).toHaveBeenCalledWith('med-metformin-id', expect.any(String));
    });

    it('returns false when medication is not found in profile regimen', async () => {
      vi.mocked(medicinesRepo.listMedicines).mockResolvedValue([]);

      const result = await executeClinicalAction(
        {
          type: 'adjust_schedule',
          data: {
            medicine_name: 'NonexistentMed',
            new_time: '10:00 PM',
          },
        },
        { profileId, userId }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('NonexistentMed');
      expect(medicinesRepo.updateMedicine).not.toHaveBeenCalled();
    });
  });

  describe('log_symptom', () => {
    it('creates side effect in database with severity and timestamp', async () => {
      vi.mocked(sideEffectsRepo.createSideEffect).mockResolvedValue({
        id: 'se-123',
        medicine_name: 'Lipitor',
        note: 'Muscle pain in legs',
        severity: 'moderate',
        occurred_at: '2026-10-01T10:00:00.000Z',
      } as any);

      const result = await executeClinicalAction(
        {
          type: 'log_symptom',
          data: {
            medicine_name: 'Lipitor',
            symptom: 'Muscle pain in legs',
            severity: 'moderate',
          },
        },
        { profileId, userId }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Muscle pain in legs');
      expect(sideEffectsRepo.createSideEffect).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          profile_id: profileId,
          medicine_name: 'Lipitor',
          note: 'Muscle pain in legs',
          severity: 'moderate',
        })
      );
    });
  });

  describe('schedule_followup', () => {
    it('creates diagnostic test order if test_name is supplied', async () => {
      vi.mocked(testOrdersRepo.createTestOrder).mockResolvedValue({
        id: 'to-789',
        test_name: 'HbA1c',
        status: 'pending',
      } as any);

      const result = await executeClinicalAction(
        {
          type: 'schedule_followup',
          data: {
            test_name: 'HbA1c',
          },
        },
        { profileId, userId }
      );

      expect(result.success).toBe(true);
      expect(testOrdersRepo.createTestOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          test_name: 'HbA1c',
          profile_id: profileId,
          status: 'pending',
        })
      );
      expect(visitsRepo.createVisit).not.toHaveBeenCalled();
    });

    it('creates doctor consultation visit if test_name is not provided', async () => {
      vi.mocked(visitsRepo.createVisit).mockResolvedValue({
        id: 'visit-456',
        doctor_name: 'Smith',
      } as any);

      const result = await executeClinicalAction(
        {
          type: 'schedule_followup',
          data: {
            doctor_name: 'Smith',
            followupDate: '2026-10-15',
          },
        },
        { profileId, userId }
      );

      expect(result.success).toBe(true);
      expect(visitsRepo.createVisit).toHaveBeenCalledWith(
        expect.objectContaining({
          doctor_name: 'Smith',
          visit_date: '2026-10-15',
          profile_id: profileId,
        })
      );
    });
  });

  describe('log_expense', () => {
    it('persists expense in localStorage scoped to profile and legacy storage', async () => {
      const result = await executeClinicalAction(
        {
          type: 'log_expense',
          data: {
            expense_title: 'Pharmacy Refill Bill',
            expense_amount: 1500,
            expense_currency: 'PKR',
            pharmacy_name: 'City Meds',
          },
        },
        { profileId, userId }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('1,500');

      const profileStored = localStorage.getItem(`curewell_health_expenses_v1_${profileId}`);
      expect(profileStored).toBeTruthy();
      const parsed = JSON.parse(profileStored!);
      expect(parsed[0].amount).toBe(1500);
      expect(parsed[0].title).toBe('Pharmacy Refill Bill');
    });
  });

  describe('informational actions', () => {
    it('returns success for missed_dose and other informational clinical calls', async () => {
      const result = await executeClinicalAction(
        {
          type: 'missed_dose',
          data: {
            catchup_instructions: 'Take pill now',
            do_not_double: true,
          },
        },
        { profileId, userId }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('missed_dose');
    });
  });
});
