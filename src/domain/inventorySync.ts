/**
 * Clinical Domain & Inventory Synchronization Engine.
 *
 * Implements:
 * 1. Daily burn rate calculation based on medical frequency codes & dosage amounts.
 * 2. Projected run-out calendar date calculation anchored in app timezone (Asia/Karachi).
 * 3. Clinical stock level categorization (out_of_stock, low_stock_urgent, low_stock_warning, healthy).
 * 4. Automatic inventory decrement when scheduled or PRN doses are confirmed taken.
 * 5. Inventory increment when medication refills are logged.
 */

import {
  getMedicineStock,
  updateMedicineStock,
  recordDoseConsumption,
} from '../lib/inventory';
import { parseFrequency, type FrequencyCode } from './frequency';
import { todayInAppTz, addDaysAppTz } from '../lib/time';
import { medicinesRepo } from '../lib/db';
import { getLocalItems } from '../lib/db/localStore';
import type { Tables } from '../lib/supabase/types';

export type StockLevel =
  | 'out_of_stock'
  | 'low_stock_urgent'
  | 'low_stock_warning'
  | 'healthy';

export interface MedicineStockStatus {
  medicineId?: string;
  currentStock: number;
  dailyBurn: number;
  remainingDays: number;
  projectedRunOutDate: string | null;
  stockLevel: StockLevel;
}

type Medicine = Tables<'medicines'>;

/**
 * Normalizes Eastern Arabic, Urdu, Bengali, and Devanagari digits to ASCII digits.
 */
function normalizeDigits(str: string = ''): string {
  if (!str) return '';
  const digitMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return str.replace(/[০-৯۰-۹०-९]/g, (ch) => digitMap[ch] || ch);
}

/**
 * Parses numeric units from dose_amount strings (e.g. '2 tablets' -> 2, '1 capsule' -> 1).
 * Defaults to 1 if unspecified or unparseable.
 */
export function parseDoseAmount(doseAmount: string | number | null | undefined): number {
  if (typeof doseAmount === 'number') {
    return !isNaN(doseAmount) && doseAmount > 0 ? doseAmount : 1;
  }
  if (!doseAmount) return 1;

  const normalized = normalizeDigits(String(doseAmount).trim());
  const match = normalized.match(/^(\d+(?:\.\d+)?)/);
  if (match) {
    const rawVal = match[1];
    if (rawVal) {
      const val = parseFloat(rawVal);
      return !isNaN(val) && val > 0 ? val : 1;
    }
  }
  return 1;
}

/**
 * Calculates the daily burn rate (units per day) based on frequency code / pattern and dose amount.
 *
 * Rules:
 * - OD / Once daily: 1 intake / day
 * - BD / Twice daily: 2 intakes / day
 * - TDS / 3 times daily: 3 intakes / day
 * - QID / 4 times daily: 4 intakes / day
 * - QHS / Bedtime: 1 intake / day
 * - STAT: 1 intake (single event)
 * - WEEKLY: 1/7 intake / day (~0.142857)
 * - PRN / SOS: 0 intakes / day (taken on-demand, no predictable daily depletion)
 * - Numeric slot notations (e.g. 1+0+1 -> 2, 2+0+2 -> 4)
 * - Multiplied by dosePerIntake (default 1).
 */
export function dailyBurn(
  frequencyCode: FrequencyCode | string | null | undefined,
  dosePerIntake: number | string | null = 1
): number {
  const multiplier = parseDoseAmount(dosePerIntake);

  if (!frequencyCode) {
    return 0;
  }

  // Check if raw string is numeric slot notation (e.g. 1+0+1, 2+0+2, 1-1-1)
  const rawStr = String(frequencyCode).trim();
  const slotRaw = normalizeDigits(rawStr).replace(/[><|]/g, '1');
  const slotMatch = slotRaw.match(
    /^(\d+)\s*[+\-x/\\.]\s*(\d+)(?:\s*[+\-x/\\.]\s*(\d+))?(?:\s*[+\-x/\\.]\s*(\d+))?$/
  );

  if (slotMatch) {
    const d1 = parseInt(slotMatch[1] || '0', 10);
    const d2 = parseInt(slotMatch[2] || '0', 10);
    const d3 = slotMatch[3] !== undefined ? parseInt(slotMatch[3], 10) : 0;
    const d4 = slotMatch[4] !== undefined ? parseInt(slotMatch[4], 10) : 0;
    const slotTotal = d1 + d2 + d3 + d4;
    if (slotTotal > 0) {
      return slotTotal * multiplier;
    }
  }

  // Normalize frequency code using clinical parser
  const code: FrequencyCode | null =
    typeof frequencyCode === 'string' &&
    ['OD', 'BD', 'TDS', 'QID', 'QHS', 'PRN', 'SOS', 'STAT', 'WEEKLY', 'CUSTOM'].includes(
      frequencyCode.toUpperCase()
    )
      ? (frequencyCode.toUpperCase() as FrequencyCode)
      : parseFrequency(rawStr);

  if (!code) {
    return 1 * multiplier; // Default conservative estimate for unclassified scheduled med
  }

  switch (code) {
    case 'OD':
      return 1 * multiplier;
    case 'BD':
      return 2 * multiplier;
    case 'TDS':
      return 3 * multiplier;
    case 'QID':
      return 4 * multiplier;
    case 'QHS':
      return 1 * multiplier;
    case 'STAT':
      return 1 * multiplier;
    case 'WEEKLY':
      return (1 / 7) * multiplier;
    case 'PRN':
    case 'SOS':
      return 0;
    case 'CUSTOM':
      return 1 * multiplier;
    default:
      return 1 * multiplier;
  }
}

/**
 * Calculates remaining days of supply.
 * Returns 0 if currentStock <= 0.
 * Returns Infinity if daily burn is 0 (e.g. PRN medications).
 */
export function calculateRemainingDays(
  currentStock: number,
  frequencyOrBurn: FrequencyCode | string | number | null | undefined,
  dosePerIntake?: number | string | null
): number {
  if (currentStock <= 0) return 0;

  const burn =
    typeof frequencyOrBurn === 'number'
      ? frequencyOrBurn
      : dailyBurn(frequencyOrBurn, dosePerIntake);

  if (burn <= 0) {
    return Infinity;
  }

  return Math.floor(currentStock / burn);
}

/** Alias for calculateRemainingDays. */
export const calculateDaysOfSupply = calculateRemainingDays;

/**
 * Calculates the projected calendar date when medication will run out.
 *
 * Rules:
 * - Anchored in Asia/Karachi application timezone.
 * - If burn <= 0 (e.g. PRN), returns null (no predictable run-out date).
 * - If stock <= 0, returns fromDate (already out of stock today).
 * - If stock > 0, adds floor(currentStock / burn) days to base date.
 */
export function projectedRunOutDate(
  currentStock: number,
  frequencyOrBurn: FrequencyCode | string | number | null | undefined,
  fromDate?: string | Date,
  dosePerIntake?: number | string | null
): string | null {
  const burn =
    typeof frequencyOrBurn === 'number'
      ? frequencyOrBurn
      : dailyBurn(frequencyOrBurn, dosePerIntake);

  if (burn <= 0) {
    return null;
  }

  const baseDate =
    typeof fromDate === 'string'
      ? fromDate
      : fromDate instanceof Date
        ? todayInAppTz(fromDate)
        : todayInAppTz();

  if (currentStock <= 0) {
    return baseDate;
  }

  const daysRemaining = Math.floor(currentStock / burn);
  return addDaysAppTz(baseDate, daysRemaining);
}

/**
 * Categorizes stock level into standard clinical tiers:
 * - 'out_of_stock': remainingDays <= 0 or currentStock <= 0
 * - 'low_stock_urgent': remainingDays <= 3 days
 * - 'low_stock_warning': remainingDays <= 7 days
 * - 'healthy': remainingDays > 7 days (or Infinity for PRN)
 */
export function categorizeStockLevel(
  remainingDays: number,
  currentStock?: number
): StockLevel {
  if ((currentStock !== undefined && currentStock <= 0) || remainingDays <= 0) {
    return 'out_of_stock';
  }
  if (remainingDays <= 3) {
    return 'low_stock_urgent';
  }
  if (remainingDays <= 7) {
    return 'low_stock_warning';
  }
  return 'healthy';
}

/** Alias for categorizeStockLevel */
export const getStockLevel = categorizeStockLevel;

/**
 * Evaluates full inventory status for a medicine including daily burn,
 * remaining days, run-out date, and clinical stock tier.
 */
export function evaluateMedicineStock(
  currentStock: number,
  frequency: FrequencyCode | string | null | undefined,
  options?: {
    doseAmount?: number | string | null;
    fromDate?: string | Date;
  }
): MedicineStockStatus {
  const burn = dailyBurn(frequency, options?.doseAmount);
  const remainingDays = calculateRemainingDays(currentStock, burn);
  const runOut = projectedRunOutDate(currentStock, burn, options?.fromDate);
  const stockLevel = categorizeStockLevel(remainingDays, currentStock);

  return {
    currentStock,
    dailyBurn: burn,
    remainingDays,
    projectedRunOutDate: runOut,
    stockLevel,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves dose amount for a medicine, falling back to local/remote record or 1.
 */
async function resolveDoseAmount(
  medicineId: string,
  customDoseAmount?: number | string | null
): Promise<number> {
  if (customDoseAmount !== undefined && customDoseAmount !== null) {
    return parseDoseAmount(customDoseAmount);
  }

  // 1. Check local store (instant offline check)
  const localMeds = getLocalItems<Medicine>('medicines');
  const found = localMeds.find((m) => m.id === medicineId);
  if (found?.dose_amount) {
    return parseDoseAmount(found.dose_amount);
  }

  // 2. Query repository fallback if valid UUID format
  if (UUID_REGEX.test(medicineId)) {
    try {
      const med = await medicinesRepo.getMedicineById(medicineId);
      if (med?.dose_amount) {
        return parseDoseAmount(med.dose_amount);
      }
    } catch {
      // Network / DB failure fallback
    }
  }

  return 1;
}

/**
 * Automatically decrements inventory by dose amount when a dose is confirmed taken.
 * Returns the remaining stock count, or null if the medicine is not tracked.
 */
export async function onDoseConfirmed(
  profileId: string,
  medicineId: string,
  doseAmount?: number | string
): Promise<number | null> {
  const amount = await resolveDoseAmount(medicineId, doseAmount);
  return recordDoseConsumption(profileId, medicineId, amount);
}

/**
 * Synchronous variant of onDoseConfirmed for tight loop / synchronous handlers.
 */
export function onDoseConfirmedSync(
  profileId: string,
  medicineId: string,
  doseAmount?: number | string
): number | null {
  const amount = parseDoseAmount(doseAmount);
  return recordDoseConsumption(profileId, medicineId, amount);
}

/**
 * Increments inventory when a medication refill is logged.
 * Returns the updated stock count.
 */
export async function onRefillAdded(
  profileId: string,
  medicineId: string,
  quantity: number
): Promise<number> {
  const safeQty = Math.max(0, Math.floor(quantity));
  const current = getMedicineStock(profileId, medicineId);
  const newStock = current !== null ? current + safeQty : safeQty;
  return updateMedicineStock(profileId, medicineId, newStock);
}

/**
 * Synchronous variant of onRefillAdded.
 */
export function onRefillAddedSync(
  profileId: string,
  medicineId: string,
  quantity: number
): number {
  const safeQty = Math.max(0, Math.floor(quantity));
  const current = getMedicineStock(profileId, medicineId);
  const newStock = current !== null ? current + safeQty : safeQty;
  return updateMedicineStock(profileId, medicineId, newStock);
}
