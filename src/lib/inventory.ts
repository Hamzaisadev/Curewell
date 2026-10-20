/**
 * Pill Inventory Engine & Storage Layer.
 *
 * Provides resilient, profile-isolated pill count inventory management.
 * Guarantees:
 * 1. Resilient offline-first caching via localStorage with legacy key migration.
 * 2. Cloud persistence bridge (Supabase cloud sync with graceful offline fallback).
 * 3. Atomic stock lookups, updates, and dose consumption operations.
 */

import { supabase } from './supabase/client';
import { getLocalItems, setLocalItems } from './db/localStore';

const PREFIX = 'curewell_pill_inventory_v2_';
const LEGACY_PREFIX = 'medfolio_pill_inventory_v2_';
const CLOUD_SYNC_TABLE = 'pill_inventories';

export type PillInventory = Record<string, number>;

export interface InventoryRecord {
  profile_id: string;
  medicine_id: string;
  stock_count: number;
  updated_at: string;
}

/**
 * Returns the profile-scoped localStorage key.
 */
export function inventoryKey(profileId: string): string {
  return `${PREFIX}${profileId}`;
}

/**
 * Reads inventory from local cache synchronously.
 */
export function readInventory(profileId: string): PillInventory {
  if (!profileId) return {};
  try {
    const raw =
      localStorage.getItem(inventoryKey(profileId)) ||
      localStorage.getItem(`${LEGACY_PREFIX}${profileId}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as PillInventory) : {};
  } catch {
    return {};
  }
}

/**
 * Writes inventory to local cache and localStore fallback.
 */
export function writeInventory(profileId: string, inventory: PillInventory): void {
  if (!profileId) return;
  try {
    localStorage.setItem(inventoryKey(profileId), JSON.stringify(inventory));
    // Dual-write into localStore for backup offline resilience
    const backupList: InventoryRecord[] = Object.entries(inventory).map(([medId, count]) => ({
      profile_id: profileId,
      medicine_id: medId,
      stock_count: count,
      updated_at: new Date().toISOString(),
    }));
    setLocalItems(`pill_inventory_${profileId}`, backupList);
  } catch {
    // Quota or storage unavailable — graceful degradation
  }
}

/**
 * Retrieves the stock count for a specific medicine under a profile.
 * Returns null if the medicine is not currently tracked in inventory.
 */
export function getMedicineStock(profileId: string, medicineId: string): number | null {
  if (!profileId || !medicineId) return null;
  const inventory = readInventory(profileId);
  const count = inventory[medicineId];
  return typeof count === 'number' && !isNaN(count) ? count : null;
}

/**
 * Updates the stock count for a specific medicine under a profile.
 * Automatically persists to local cache and triggers cloud sync.
 * Clamps negative counts to 0.
 */
export function updateMedicineStock(profileId: string, medicineId: string, count: number): number {
  if (!profileId || !medicineId) return 0;
  const inventory = readInventory(profileId);
  const safeCount = Math.max(0, Math.floor(count));
  inventory[medicineId] = safeCount;
  writeInventory(profileId, inventory);

  // Background cloud persistence (non-blocking)
  syncMedicineStockToCloud(profileId, medicineId, safeCount).catch(() => {});

  return safeCount;
}

/**
 * Records consumption of medicine doses (e.g. taking 1 or more pills).
 * Decrements the current stock by count, clamped to 0.
 * Returns the updated stock count, or null if the medicine is not tracked.
 */
export function recordDoseConsumption(
  profileId: string,
  medicineId: string,
  count: number = 1
): number | null {
  const current = getMedicineStock(profileId, medicineId);
  if (current === null) {
    return null;
  }
  const safeDeduct = Math.max(0, count);
  const newCount = Math.max(0, current - safeDeduct);
  return updateMedicineStock(profileId, medicineId, newCount);
}

/**
 * Decrements the count for one medicine by one pill.
 * Maintained for backward compatibility.
 * Returns the new count, or null if no inventory was tracked or count was <= 0.
 */
export function decrementPill(profileId: string, medicineId: string): number | null {
  const current = getMedicineStock(profileId, medicineId);
  if (typeof current !== 'number' || current <= 0) {
    return null;
  }
  return recordDoseConsumption(profileId, medicineId, 1);
}

/**
 * Restores one or more pills to inventory (e.g. when an accidental dose mark is reverted).
 * Maintained for backward compatibility.
 */
export function incrementPill(profileId: string, medicineId: string, count: number = 1): void {
  const current = getMedicineStock(profileId, medicineId);
  if (typeof current !== 'number') return;
  updateMedicineStock(profileId, medicineId, current + Math.max(1, count));
}

/**
 * Clears inventory for a profile (e.g. on profile deletion or testing reset).
 */
export function clearProfileInventory(profileId: string): void {
  if (!profileId) return;
  try {
    localStorage.removeItem(inventoryKey(profileId));
    localStorage.removeItem(`${LEGACY_PREFIX}${profileId}`);
    setLocalItems(`pill_inventory_${profileId}`, []);
  } catch {
    // ignore
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cloud persistence: Syncs single medicine stock change to Supabase.
 * Gracefully handles offline state and schema differences.
 */
export async function syncMedicineStockToCloud(
  profileId: string,
  medicineId: string,
  count: number
): Promise<boolean> {
  if (!UUID_REGEX.test(profileId) || !UUID_REGEX.test(medicineId)) {
    return false;
  }
  try {
    // 1. Attempt to upsert to dedicated inventory table if present
    const { error: dedicatedErr } = await supabase
      .from(CLOUD_SYNC_TABLE as any)
      .upsert(
        {
          profile_id: profileId,
          medicine_id: medicineId,
          stock_count: count,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,medicine_id' }
      );

    if (!dedicatedErr) {
      return true;
    }

    // 2. Fallback: Touch medicine updated_at so remote sync knows it changed
    await supabase
      .from('medicines')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', medicineId)
      .eq('profile_id', profileId);

    return true;
  } catch {
    // Storage or network unavailable: local cache remains authoritative
    return false;
  }
}

/**
 * Cloud persistence: Syncs entire profile inventory to Supabase cloud.
 */
export async function syncInventoryToCloud(profileId: string): Promise<boolean> {
  if (!profileId) return false;
  try {
    const inventory = readInventory(profileId);
    const rows = Object.entries(inventory).map(([medicineId, stockCount]) => ({
      profile_id: profileId,
      medicine_id: medicineId,
      stock_count: stockCount,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length === 0) return true;

    const { error } = await supabase
      .from(CLOUD_SYNC_TABLE as any)
      .upsert(rows, { onConflict: 'profile_id,medicine_id' });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Cloud persistence: Hydrates local cache from Supabase cloud if available.
 */
export async function syncInventoryFromCloud(profileId: string): Promise<PillInventory> {
  if (!profileId) return {};
  try {
    const { data, error } = await (supabase.from as any)(CLOUD_SYNC_TABLE)
      .select('medicine_id, stock_count')
      .eq('profile_id', profileId);

    if (!error && Array.isArray(data) && data.length > 0) {
      const cloudInventory: PillInventory = {};
      const rows = data as unknown as Array<{ medicine_id: string; stock_count: number }>;
      for (const row of rows) {
        if (row.medicine_id && typeof row.stock_count === 'number') {
          cloudInventory[row.medicine_id] = row.stock_count;
        }
      }
      // Merge with local cache (cloud overrides)
      const merged = { ...readInventory(profileId), ...cloudInventory };
      writeInventory(profileId, merged);
      return merged;
    }
  } catch {
    // Cloud fetch failed; fall back to local store
  }

  // Fallback: check local backup store
  const localBackup = getLocalItems<InventoryRecord>(`pill_inventory_${profileId}`);
  if (localBackup && localBackup.length > 0) {
    const backupInventory: PillInventory = {};
    for (const item of localBackup) {
      backupInventory[item.medicine_id] = item.stock_count;
    }
    const merged = { ...backupInventory, ...readInventory(profileId) };
    writeInventory(profileId, merged);
    return merged;
  }

  return readInventory(profileId);
}
