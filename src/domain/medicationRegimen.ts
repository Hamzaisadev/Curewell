/**
 * Medication Regimen Module.
 *
 * Deep domain module consolidating medicine intake, schedule expansion,
 * dose lifecycle state transitions, and inventory synchronization.
 * Callers interact with this single seam rather than coordinating multiple
 * shallow database repositories and local storage helpers.
 */

import { dosesRepo, medicinesRepo } from '../lib/db';
import {
  readInventory,
  writeInventory,
  decrementPill,
  incrementPill,
  type PillInventory,
} from '../lib/inventory';
import { buildSchedule } from './schedule';
import { parseFrequency, defaultDoseTimes, type FrequencyCode } from './frequency';
import { computeEndDate, parseDuration } from './duration';
import { todayInAppTz } from '../lib/time';
import { deriveStatusOnRead } from './adherence';
import type { Tables } from '../lib/supabase/types';

export type Medicine = Tables<'medicines'>;
export type Dose = Tables<'doses'>;

export interface MedicineIntakeItem {
  id?: string;
  medicine_name: string;
  strength?: string | null;
  form?: string | null;
  dose_amount?: string | null;
  frequency_raw?: string | null;
  frequency_code?: FrequencyCode | null;
  duration_raw?: string | null;
  duration_days?: number | null;
  start_date?: string | null;
  is_ongoing?: boolean | null;
  with_food?: boolean | null;
  instructions?: string | null;
  initial_pill_count?: number | null;
}

export interface RecordPrescriptionInput {
  userId: string;
  profileId: string;
  visitId?: string | null;
  scheduleStartDate?: string | null;
  medicines: MedicineIntakeItem[];
}

export interface RecordPrescriptionResult {
  createdMedicines: Medicine[];
  createdDosesCount: number;
}

export interface DoseActionInput {
  dose: Dose;
  newStatus: 'taken' | 'pending' | 'skipped';
  profileId: string;
  skipReason?: string;
  takenAt?: string | null;
}

export interface DoseActionResult {
  updatedDose: Dose;
  remainingPills: number | null;
}

export interface DayScheduleResult {
  doses: Dose[];
  medicines: Medicine[];
  medicinesMap: Record<string, Medicine>;
  inventory: PillInventory;
}

/**
 * Top-up routine to generate missing doses for active medicines on a given date.
 * Encapsulated as internal implementation detail.
 */
async function topUpScheduleForDate(
  medicines: Medicine[],
  dateStr: string,
  userId: string,
  profileId: string
): Promise<boolean> {
  const rows: Array<{
    user_id: string;
    profile_id: string;
    medicine_id: string;
    scheduled_date: string;
    scheduled_minutes: number;
    status: 'pending';
  }> = [];

  for (const m of medicines) {
    if (m.discontinued_at) continue;
    const effectiveStartDate = m.start_date || todayInAppTz();
    if (effectiveStartDate > dateStr) continue;

    const isOngoing = m.is_ongoing ?? false;
    const effectiveEndDate =
      m.end_date || (m.duration_days ? computeEndDate(effectiveStartDate, m.duration_days) : null);

    if (!isOngoing && effectiveEndDate && effectiveEndDate < dateStr) continue;

    const freqCode = m.frequency_code ?? parseFrequency(m.frequency_raw);
    if (!freqCode) continue;

    const doseTimes = defaultDoseTimes(freqCode, m.with_food, m.frequency_raw);
    if (doseTimes.length === 0) continue;

    const generated = buildSchedule({
      medicineId: m.id,
      startDate: effectiveStartDate,
      durationDays: m.duration_days,
      isOngoing,
      doseTimes,
      now: new Date(),
      frequencyCode: freqCode,
    });

    for (const slot of generated) {
      if (slot.scheduled_date !== dateStr) continue;
      rows.push({
        user_id: userId,
        profile_id: profileId,
        medicine_id: m.id,
        scheduled_date: slot.scheduled_date,
        scheduled_minutes: slot.scheduled_minutes,
        status: 'pending',
      });
    }
  }

  if (rows.length === 0) return false;
  await dosesRepo.createDoses(rows);
  return true;
}

/**
 * Records a full prescription intake: saves medicines, calculates schedules,
 * generates dose rows, and initializes pill inventory.
 */
export async function recordPrescription(
  input: RecordPrescriptionInput
): Promise<RecordPrescriptionResult> {
  const { userId, profileId, visitId = null, scheduleStartDate, medicines } = input;
  const effectiveStartDate = scheduleStartDate || todayInAppTz();
  const inventoryMap = readInventory(profileId);
  const createdMedicines: Medicine[] = [];
  let totalDosesCreated = 0;

  for (const item of medicines) {
    if (!item.medicine_name || !item.medicine_name.trim()) continue;

    const freqCode = item.frequency_code || parseFrequency(item.frequency_raw);
    const dur = item.duration_days
      ? { kind: 'days' as const, days: item.duration_days }
      : parseDuration(item.duration_raw);

    const isOngoing = item.is_ongoing ?? dur.kind === 'ongoing';
    const durationDays = dur.kind === 'days' ? dur.days : null;

    const endDate =
      durationDays !== null && !isOngoing
        ? computeEndDate(effectiveStartDate, durationDays)
        : null;

    const doseTimes = freqCode
      ? defaultDoseTimes(freqCode, item.with_food, item.frequency_raw)
      : [];

    const createdMed = await medicinesRepo.createMedicine({
      user_id: userId,
      profile_id: profileId,
      visit_id: visitId,
      medicine_name: item.medicine_name.trim(),
      strength: item.strength?.trim() || null,
      form: item.form || 'Tablet',
      dose_amount: item.dose_amount?.trim() || null,
      frequency_code: freqCode,
      frequency_raw: item.frequency_raw?.trim() || null,
      with_food: item.with_food ?? null,
      duration_days: durationDays,
      start_date: effectiveStartDate,
      end_date: endDate,
      is_ongoing: isOngoing,
      instructions: item.instructions || null,
    });

    createdMedicines.push(createdMed);

    // Initialize pill inventory if not already tracked
    if (createdMed.id && !inventoryMap[createdMed.id]) {
      const initialCount =
        item.initial_pill_count ??
        (durationDays ? durationDays * (doseTimes.length || 1) + 4 : 20);
      inventoryMap[createdMed.id] = initialCount;
    }

    // Generate dose timetable rows
    if (doseTimes.length > 0) {
      const scheduleItems = buildSchedule({
        medicineId: createdMed.id,
        startDate: effectiveStartDate,
        durationDays,
        isOngoing,
        doseTimes,
        now: new Date(),
        frequencyCode: freqCode,
      });

      if (scheduleItems.length > 0) {
        await dosesRepo.createDoses(
          scheduleItems.map((d) => ({
            user_id: userId,
            profile_id: profileId,
            medicine_id: createdMed.id,
            scheduled_date: d.scheduled_date,
            scheduled_minutes: d.scheduled_minutes,
            status: 'pending',
          }))
        );
        totalDosesCreated += scheduleItems.length;
      }
    }
  }

  writeInventory(profileId, inventoryMap);

  return {
    createdMedicines,
    createdDosesCount: totalDosesCreated,
  };
}

/**
 * Executes a dose state transition while synchronizing physical pill inventory.
 */
export async function recordDoseAction(input: DoseActionInput): Promise<DoseActionResult> {
  const { dose, newStatus, profileId, skipReason, takenAt } = input;
  let remainingPills: number | null = null;

  if (newStatus === 'taken' && dose.status !== 'taken') {
    const updated = takenAt
      ? await dosesRepo.updateDoseStatus(dose.id, 'taken', takenAt)
      : await dosesRepo.updateDoseStatus(dose.id, 'taken');
    remainingPills = decrementPill(profileId, dose.medicine_id);
    return { updatedDose: updated, remainingPills };
  }

  if (newStatus === 'pending') {
    const updated = await dosesRepo.updateDoseStatus(dose.id, 'pending');
    if (dose.status === 'taken') {
      incrementPill(profileId, dose.medicine_id);
    }
    const inv = readInventory(profileId);
    remainingPills = inv[dose.medicine_id] ?? null;
    return { updatedDose: updated, remainingPills };
  }

  if (newStatus === 'skipped') {
    const updated = await dosesRepo.updateDoseStatus(dose.id, 'skipped', skipReason);
    if (dose.status === 'taken') {
      incrementPill(profileId, dose.medicine_id);
    }
    const inv = readInventory(profileId);
    remainingPills = inv[dose.medicine_id] ?? null;
    return { updatedDose: updated, remainingPills };
  }

  const updated = await dosesRepo.updateDoseStatus(dose.id, newStatus, skipReason);
  return { updatedDose: updated, remainingPills };
}

/**
 * Batch marks routine doses as taken and decrements inventory for each.
 */
export async function batchRecordDosesTaken(
  doses: Dose[],
  profileId: string
): Promise<{ updatedDoses: Dose[]; count: number }> {
  const now = new Date();
  const actionable = doses.filter((d) => {
    const status = deriveStatusOnRead(d, now);
    return status === 'pending' || status === 'missed';
  });

  if (actionable.length === 0) {
    return { updatedDoses: doses, count: 0 };
  }

  const updatedList = await Promise.all(
    actionable.map((d) => dosesRepo.updateDoseStatus(d.id, 'taken'))
  );

  for (const d of actionable) {
    decrementPill(profileId, d.medicine_id);
  }

  const updatedMap = new Map(updatedList.map((d) => [d.id, d]));
  const merged = doses.map((d) => updatedMap.get(d.id) || d);

  return { updatedDoses: merged, count: actionable.length };
}

/**
 * Loads a patient's schedule for a specific date, automatically ensuring
 * active medicines have their schedule rows expanded if missing.
 */
export async function getDaySchedule(
  profileId: string,
  dateStr: string,
  userId?: string
): Promise<DayScheduleResult> {
  const effectiveUserId = userId || profileId;
  const today = todayInAppTz();

  const [fetchedDoses, fetchedMeds] = await Promise.all([
    dosesRepo.listDosesForDate(profileId, dateStr),
    medicinesRepo.listMedicines(profileId),
  ]);

  let doses = fetchedDoses;

  if (fetchedDoses.length === 0 && fetchedMeds.length > 0 && dateStr >= today) {
    const created = await topUpScheduleForDate(
      fetchedMeds,
      dateStr,
      effectiveUserId,
      profileId
    );
    if (created) {
      doses = await dosesRepo.listDosesForDate(profileId, dateStr);
    }
  }

  const medicinesMap: Record<string, Medicine> = {};
  for (const m of fetchedMeds) {
    medicinesMap[m.id] = m;
  }

  const inventory = readInventory(profileId);

  return {
    doses,
    medicines: fetchedMeds,
    medicinesMap,
    inventory,
  };
}

/**
 * Discontinues a medication course and removes all future pending doses.
 */
export async function discontinueMedication(
  medicineId: string,
  _profileId: string,
  todayStr: string
): Promise<void> {
  await medicinesRepo.discontinueMedicine(medicineId, new Date().toISOString());
  await dosesRepo.deleteFuturePendingDoses(medicineId, todayStr);
}

/**
 * Logs an on-demand (PRN) dose intake and updates inventory.
 */
export async function logPrnDose(input: {
  medicineId: string;
  profileId: string;
  userId: string;
  dateStr: string;
  scheduledMinutes?: number;
}): Promise<Dose> {
  const { medicineId, profileId, userId, dateStr, scheduledMinutes } = input;
  const now = new Date();
  const minutes =
    scheduledMinutes !== undefined ? scheduledMinutes : now.getHours() * 60 + now.getMinutes();

  const createdList = await dosesRepo.createDoses([
    {
      user_id: userId,
      profile_id: profileId,
      medicine_id: medicineId,
      scheduled_date: dateStr,
      scheduled_minutes: minutes,
      status: 'taken',
      taken_at: now.toISOString(),
    },
  ]);

  decrementPill(profileId, medicineId);

  const dose = createdList[0];
  if (!dose) {
    throw new Error('Failed to record PRN dose.');
  }

  return dose;
}
