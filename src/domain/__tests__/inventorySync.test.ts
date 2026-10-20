import { describe, it, expect, beforeEach } from 'vitest';
import {
  dailyBurn,
  calculateRemainingDays,
  calculateDaysOfSupply,
  projectedRunOutDate,
  categorizeStockLevel,
  getStockLevel,
  evaluateMedicineStock,
  parseDoseAmount,
  onDoseConfirmed,
  onDoseConfirmedSync,
  onRefillAdded,
  onRefillAddedSync,
} from '../inventorySync';
import {
  getMedicineStock,
  updateMedicineStock,
  recordDoseConsumption,
  decrementPill,
  incrementPill,
  clearProfileInventory,
} from '../../lib/inventory';
import { setLocalItems } from '../../lib/db/localStore';

describe('Inventory Domain & Synchronization Engine', () => {
  const profileId = 'patient-profile-alpha';
  const medicineId = 'med-metformin-500';

  beforeEach(() => {
    localStorage.clear();
    clearProfileInventory(profileId);
    clearProfileInventory('patient-profile-beta');
  });

  describe('dailyBurn calculation', () => {
    it('calculates standard frequency daily burns accurately', () => {
      expect(dailyBurn('OD')).toBe(1);
      expect(dailyBurn('BD')).toBe(2);
      expect(dailyBurn('TDS')).toBe(3);
      expect(dailyBurn('QID')).toBe(4);
      expect(dailyBurn('QHS')).toBe(1);
      expect(dailyBurn('STAT')).toBe(1);
      expect(dailyBurn('WEEKLY')).toBeCloseTo(1 / 7, 5);
      expect(dailyBurn('PRN')).toBe(0);
      expect(dailyBurn('SOS')).toBe(0);
      expect(dailyBurn('CUSTOM')).toBe(1);
    });

    it('parses numeric slot shorthand notations correctly', () => {
      // 1 morning + 0 afternoon + 1 night = 2
      expect(dailyBurn('1+0+1')).toBe(2);
      // 1+1+1 = 3
      expect(dailyBurn('1+1+1')).toBe(3);
      // 2+0+2 = 4
      expect(dailyBurn('2+0+2')).toBe(4);
      // 1-0-1 with dashes
      expect(dailyBurn('1-0-1')).toBe(2);
      // 4 slot notation (1+1+1+1)
      expect(dailyBurn('1+1+1+1')).toBe(4);
    });

    it('parses multilingual digits in slot notation', () => {
      // Eastern Arabic / Urdu: ۱+۰+۱ (1+0+1 = 2)
      expect(dailyBurn('۱+۰+۱')).toBe(2);
      // Bengali: ১+১+১ (1+1+1 = 3)
      expect(dailyBurn('১+১+১')).toBe(3);
      // Devanagari: २+०+२ (2+0+2 = 4)
      expect(dailyBurn('२+०+२')).toBe(4);
    });

    it('respects dosePerIntake multiplier', () => {
      // BD with 2 tablets per dose = 4 pills per day
      expect(dailyBurn('BD', 2)).toBe(4);
      expect(dailyBurn('OD', '2 tablets')).toBe(2);
      expect(dailyBurn('TDS', '2 capsules')).toBe(6);
    });

    it('handles null, undefined, and PRN gracefully', () => {
      expect(dailyBurn(null)).toBe(0);
      expect(dailyBurn(undefined)).toBe(0);
      expect(dailyBurn('PRN', 2)).toBe(0);
      expect(dailyBurn('SOS', 3)).toBe(0);
    });
  });

  describe('calculateRemainingDays / calculateDaysOfSupply', () => {
    it('calculates remaining days correctly with frequency code', () => {
      // 14 pills at BD (2/day) = 7 days
      expect(calculateRemainingDays(14, 'BD')).toBe(7);
      expect(calculateDaysOfSupply(30, 'OD')).toBe(30);
      expect(calculateRemainingDays(21, 'TDS')).toBe(7);
    });

    it('calculates remaining days using direct burn numbers', () => {
      expect(calculateRemainingDays(20, 2)).toBe(10);
      expect(calculateRemainingDays(5, 2)).toBe(2); // Math.floor(2.5) = 2
    });

    it('returns 0 for non-positive inventory stock', () => {
      expect(calculateRemainingDays(0, 'OD')).toBe(0);
      expect(calculateRemainingDays(-10, 'BD')).toBe(0);
    });

    it('returns Infinity for PRN/zero-burn medications', () => {
      expect(calculateRemainingDays(10, 'PRN')).toBe(Infinity);
      expect(calculateRemainingDays(15, 0)).toBe(Infinity);
    });
  });

  describe('projectedRunOutDate', () => {
    const fixedToday = '2026-10-20';

    it('calculates future run-out date accurately', () => {
      // 10 pills at 2 pills/day = 5 days -> 2026-10-25
      const runOut = projectedRunOutDate(10, 'BD', fixedToday);
      expect(runOut).toBe('2026-10-25');
    });

    it('calculates run-out date for monthly supplies', () => {
      // 30 pills at 1 pill/day = 30 days -> 2026-11-19
      const runOut = projectedRunOutDate(30, 'OD', fixedToday);
      expect(runOut).toBe('2026-11-19');
    });

    it('returns base date when already out of stock', () => {
      expect(projectedRunOutDate(0, 'BD', fixedToday)).toBe(fixedToday);
      expect(projectedRunOutDate(-5, 'BD', fixedToday)).toBe(fixedToday);
    });

    it('returns null for PRN medicines with 0 burn', () => {
      expect(projectedRunOutDate(20, 'PRN', fixedToday)).toBeNull();
    });

    it('accepts Date objects as fromDate', () => {
      const fromDate = new Date('2026-10-20T00:00:00Z');
      const runOut = projectedRunOutDate(6, 'BD', fromDate);
      expect(runOut).toBeDefined();
      expect(typeof runOut).toBe('string');
    });
  });

  describe('categorizeStockLevel & getStockLevel', () => {
    it('categorizes out_of_stock properly', () => {
      expect(categorizeStockLevel(0, 0)).toBe('out_of_stock');
      expect(categorizeStockLevel(0, -2)).toBe('out_of_stock');
      expect(getStockLevel(0)).toBe('out_of_stock');
    });

    it('categorizes low_stock_urgent (<= 3 days)', () => {
      expect(categorizeStockLevel(1, 1)).toBe('low_stock_urgent');
      expect(categorizeStockLevel(2, 2)).toBe('low_stock_urgent');
      expect(categorizeStockLevel(3, 3)).toBe('low_stock_urgent');
    });

    it('categorizes low_stock_warning (<= 7 days and > 3 days)', () => {
      expect(categorizeStockLevel(4, 4)).toBe('low_stock_warning');
      expect(categorizeStockLevel(5, 5)).toBe('low_stock_warning');
      expect(categorizeStockLevel(7, 7)).toBe('low_stock_warning');
    });

    it('categorizes healthy (> 7 days and Infinity)', () => {
      expect(categorizeStockLevel(8, 8)).toBe('healthy');
      expect(categorizeStockLevel(30, 30)).toBe('healthy');
      expect(categorizeStockLevel(Infinity, 50)).toBe('healthy');
    });
  });

  describe('evaluateMedicineStock', () => {
    it('produces a comprehensive stock status summary', () => {
      const status = evaluateMedicineStock(14, 'BD', {
        fromDate: '2026-10-20',
      });

      expect(status).toEqual({
        currentStock: 14,
        dailyBurn: 2,
        remainingDays: 7,
        projectedRunOutDate: '2026-10-27',
        stockLevel: 'low_stock_warning',
      });
    });

    it('evaluates urgent stock levels correctly', () => {
      const status = evaluateMedicineStock(4, 'BD', {
        fromDate: '2026-10-20',
      });

      expect(status.remainingDays).toBe(2);
      expect(status.stockLevel).toBe('low_stock_urgent');
      expect(status.projectedRunOutDate).toBe('2026-10-22');
    });
  });

  describe('parseDoseAmount', () => {
    it('parses integers and decimals from string formats', () => {
      expect(parseDoseAmount('1 tablet')).toBe(1);
      expect(parseDoseAmount('2 capsules')).toBe(2);
      expect(parseDoseAmount('2.5 ml')).toBe(2.5);
      expect(parseDoseAmount(3)).toBe(3);
    });

    it('falls back safely to 1 for unparseable input', () => {
      expect(parseDoseAmount(null)).toBe(1);
      expect(parseDoseAmount(undefined)).toBe(1);
      expect(parseDoseAmount('')).toBe(1);
      expect(parseDoseAmount('none')).toBe(1);
      expect(parseDoseAmount(0)).toBe(1);
    });
  });

  describe('onDoseConfirmed & onRefillAdded actions', () => {
    it('returns null when medicine is not tracked in inventory', async () => {
      const remaining = await onDoseConfirmed(profileId, 'untracked-med-id');
      expect(remaining).toBeNull();
    });

    it('decrements tracked inventory by 1 when dose is confirmed', async () => {
      updateMedicineStock(profileId, medicineId, 20);
      expect(getMedicineStock(profileId, medicineId)).toBe(20);

      const remaining = await onDoseConfirmed(profileId, medicineId);
      expect(remaining).toBe(19);
      expect(getMedicineStock(profileId, medicineId)).toBe(19);
    });

    it('decrements tracked inventory by custom dose amount', async () => {
      updateMedicineStock(profileId, medicineId, 20);

      const remaining = await onDoseConfirmed(profileId, medicineId, 2);
      expect(remaining).toBe(18);
      expect(getMedicineStock(profileId, medicineId)).toBe(18);
    });

    it('decrements using medicine dose_amount if stored in database/cache', async () => {
      // Seed a medicine with dose_amount '2 tablets'
      setLocalItems('medicines', [
        {
          id: 'med-dose-2',
          profile_id: profileId,
          medicine_name: 'Panadol Extra',
          dose_amount: '2 tablets',
        },
      ]);
      updateMedicineStock(profileId, 'med-dose-2', 10);

      const remaining = await onDoseConfirmed(profileId, 'med-dose-2');
      expect(remaining).toBe(8); // decremented by 2
      expect(getMedicineStock(profileId, 'med-dose-2')).toBe(8);
    });

    it('clamps remaining stock at zero and never goes negative', async () => {
      updateMedicineStock(profileId, medicineId, 1);

      const remaining = await onDoseConfirmed(profileId, medicineId, 3);
      expect(remaining).toBe(0);
      expect(getMedicineStock(profileId, medicineId)).toBe(0);
    });

    it('increments inventory on refill added', async () => {
      updateMedicineStock(profileId, medicineId, 5);

      const updated = await onRefillAdded(profileId, medicineId, 30);
      expect(updated).toBe(35);
      expect(getMedicineStock(profileId, medicineId)).toBe(35);
    });

    it('initializes inventory on refill if previously untracked', async () => {
      const updated = await onRefillAdded(profileId, 'brand-new-med', 50);
      expect(updated).toBe(50);
      expect(getMedicineStock(profileId, 'brand-new-med')).toBe(50);
    });

    it('synchronous variants perform atomic updates as expected', () => {
      updateMedicineStock(profileId, medicineId, 15);

      const afterDose = onDoseConfirmedSync(profileId, medicineId, 2);
      expect(afterDose).toBe(13);

      const afterRefill = onRefillAddedSync(profileId, medicineId, 20);
      expect(afterRefill).toBe(33);
      expect(getMedicineStock(profileId, medicineId)).toBe(33);
    });
  });

  describe('src/lib/inventory helpers & Profile Isolation', () => {
    it('isolates inventory strictly between different profiles', () => {
      const profileA = 'profile-father';
      const profileB = 'profile-mother';
      const sharedMedId = 'panadol-500';

      updateMedicineStock(profileA, sharedMedId, 30);
      updateMedicineStock(profileB, sharedMedId, 10);

      expect(getMedicineStock(profileA, sharedMedId)).toBe(30);
      expect(getMedicineStock(profileB, sharedMedId)).toBe(10);

      recordDoseConsumption(profileA, sharedMedId, 2);

      // Father's stock decrements to 28, Mother's stock remains 10
      expect(getMedicineStock(profileA, sharedMedId)).toBe(28);
      expect(getMedicineStock(profileB, sharedMedId)).toBe(10);
    });

    it('maintains backwards compatibility for decrementPill & incrementPill', () => {
      updateMedicineStock(profileId, medicineId, 10);

      const dec = decrementPill(profileId, medicineId);
      expect(dec).toBe(9);
      expect(getMedicineStock(profileId, medicineId)).toBe(9);

      incrementPill(profileId, medicineId);
      expect(getMedicineStock(profileId, medicineId)).toBe(10);
    });

    it('decrementPill returns null when stock is 0 or untracked', () => {
      expect(decrementPill(profileId, 'non-existent')).toBeNull();

      updateMedicineStock(profileId, medicineId, 0);
      expect(decrementPill(profileId, medicineId)).toBeNull();
    });
  });
});
