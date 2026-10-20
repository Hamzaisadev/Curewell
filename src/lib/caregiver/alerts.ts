/**
 * Caregiver Missed-Dose Alerts & Notifications.
 *
 * Provides utilities to:
 * 1. Check for overdue medication doses (e.g., scheduled dose not confirmed within 60 minutes).
 * 2. Generate WhatsApp Caregiver Alert links & structured notification templates.
 * 3. Manage caregiver contact details and alert preferences per profile.
 */

import { formatDoseTime, minutesInAppTz, todayInAppTz } from '../time';
import { dosesRepo, medicinesRepo } from '../db';
import type { Tables } from '../supabase/types';

export type DoseRecord = Tables<'doses'>;
export type MedicineRecord = Tables<'medicines'>;

export interface CaregiverAlertPreferences {
  enabled: boolean;
  caregiverName: string;
  caregiverPhone: string;
  relationship: string;
  overdueThresholdMinutes: number; // default: 60 minutes
  notifyOnMissedDose: boolean;
  autoOpenWhatsApp: boolean;
  notes?: string;
}

export const DEFAULT_CAREGIVER_PREFERENCES: CaregiverAlertPreferences = {
  enabled: false,
  caregiverName: '',
  caregiverPhone: '',
  relationship: 'caregiver',
  overdueThresholdMinutes: 60,
  notifyOnMissedDose: true,
  autoOpenWhatsApp: false,
  notes: '',
};

const PREFS_STORAGE_PREFIX = 'curewell_caregiver_prefs_';
const FAMILY_PASS_STORAGE_KEY = 'curewell_family_pass_active';
const FAMILY_PASS_PLAN_KEY = 'curewell_family_pass_plan';

/**
 * Normalizes phone numbers for WhatsApp URL scheme.
 * Strips formatting characters, handles Pakistani mobile formats (03XX -> 923XX),
 * and ensures international country code is present.
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d+]/g, '');

  // Strip leading plus for wa.me format
  const noPlus = digits.startsWith('+') ? digits.slice(1) : digits;

  // Pakistani standard local mobile: 03001234567 -> 923001234567
  if (/^03\d{9}$/.test(noPlus)) {
    return `92${noPlus.slice(1)}`;
  }

  // Pakistani 10-digit without leading zero: 3001234567 -> 923001234567
  if (/^3\d{9}$/.test(noPlus)) {
    return `92${noPlus}`;
  }

  return noPlus;
}

export interface CaregiverAlertTemplateParams {
  profileName: string;
  medicineName: string;
  doseAmount?: string | null;
  scheduledTime: string | number; // formatted string e.g. "09:00 AM" or minutes since midnight
}

/**
 * Generates the standardized Curewell Caregiver Health Alert notification copy:
 * "Curewell Health Alert: [Profile Name] has not taken their scheduled [Medicine Name] ([Dose Amount]) due at [Time]. Please check in with them."
 */
export function generateCaregiverAlertMessage(params: CaregiverAlertTemplateParams): string {
  const profile = params.profileName?.trim() || 'Your family member';
  const medicine = params.medicineName?.trim() || 'medication';
  const dose = params.doseAmount?.trim() ? params.doseAmount.trim() : 'Prescribed dose';
  const time =
    typeof params.scheduledTime === 'number'
      ? formatDoseTime(params.scheduledTime)
      : params.scheduledTime;

  return `Curewell Health Alert: ${profile} has not taken their scheduled ${medicine} (${dose}) due at ${time}. Please check in with them.`;
}

/**
 * Generates an optional bilingual Urdu translation for caregiver alerts.
 */
export function generateCaregiverAlertMessageUrdu(params: CaregiverAlertTemplateParams): string {
  const profile = params.profileName?.trim() || 'مریض';
  const medicine = params.medicineName?.trim() || 'دوا';
  const time =
    typeof params.scheduledTime === 'number'
      ? formatDoseTime(params.scheduledTime)
      : params.scheduledTime;

  return `کیورویل ہیلتھ الرٹ: ${profile} نے ابھی تک اپنی دوا ${medicine} وقت ${time} پر نہیں لی ہے۔ برائے مہربانی ان سے رابطہ کریں۔`;
}

/**
 * Creates a direct `https://wa.me/...` URL with prefilled alert text.
 */
export function generateWhatsAppAlertUrl(
  phone: string,
  paramsOrMessage: CaregiverAlertTemplateParams | string
): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const text =
    typeof paramsOrMessage === 'string'
      ? paramsOrMessage
      : generateCaregiverAlertMessage(paramsOrMessage);

  if (!cleanPhone) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface OverdueDoseItem {
  doseId?: string;
  profileId: string;
  profileName: string;
  medicineId: string;
  medicineName: string;
  doseAmount: string | null;
  scheduledDate: string;
  scheduledMinutes: number;
  scheduledTimeFormatted: string;
  status: string;
  minutesOverdue: number;
  alertMessage: string;
  whatsAppUrl: string;
}

export interface OverdueCheckOptions {
  now?: Date;
  thresholdMinutes?: number; // default: 60
}

/**
 * Checks whether a single scheduled dose is overdue past the configured threshold.
 * Dose is considered overdue if:
 * 1. Status is not 'taken' and not 'skipped' (i.e. 'pending' or 'missed')
 * 2. Date is before today, OR date is today and (nowMinutes >= scheduledMinutes + thresholdMinutes)
 */
export function isDoseOverdue(
  dose: {
    scheduled_date: string;
    scheduled_minutes: number;
    status: string;
  },
  options: OverdueCheckOptions = {}
): boolean {
  if (dose.status === 'taken' || dose.status === 'skipped') {
    return false;
  }

  const now = options.now ?? new Date();
  const today = todayInAppTz(now);
  const threshold = options.thresholdMinutes ?? 60;

  // Past dates are always overdue if unconfirmed
  if (dose.scheduled_date < today) {
    return true;
  }

  // Future dates are not overdue
  if (dose.scheduled_date > today) {
    return false;
  }

  // Same day: check elapsed minutes
  const currentMinutes = minutesInAppTz(now);
  return currentMinutes >= dose.scheduled_minutes + threshold;
}

/**
 * Calculates how many minutes past the scheduled dose time has elapsed.
 */
export function getDoseOverdueMinutes(
  dose: {
    scheduled_date: string;
    scheduled_minutes: number;
  },
  options: OverdueCheckOptions = {}
): number {
  const now = options.now ?? new Date();
  const today = todayInAppTz(now);

  if (dose.scheduled_date < today) {
    // Arbitrary large value or past-day offset
    return 1440;
  }
  if (dose.scheduled_date > today) {
    return 0;
  }

  const currentMinutes = minutesInAppTz(now);
  return Math.max(0, currentMinutes - dose.scheduled_minutes);
}

/**
 * Queries database for today's doses for a profile and flags any doses
 * that have not been confirmed within the threshold window (default 60 minutes).
 */
export async function checkOverdueDosesForProfile(
  profileId: string,
  profileName: string,
  caregiverPhone: string = '',
  options: OverdueCheckOptions = {}
): Promise<OverdueDoseItem[]> {
  if (!profileId) return [];

  const now = options.now ?? new Date();
  const today = todayInAppTz(now);
  const threshold = options.thresholdMinutes ?? 60;

  try {
    const [doses, medicines] = await Promise.all([
      dosesRepo.listDosesForDate(profileId, today),
      medicinesRepo.listMedicines(profileId),
    ]);

    const medMap = new Map<string, MedicineRecord>();
    medicines.forEach((m) => medMap.set(m.id, m));

    const overdueList: OverdueDoseItem[] = [];

    for (const dose of doses) {
      if (isDoseOverdue(dose, { now, thresholdMinutes: threshold })) {
        const med = medMap.get(dose.medicine_id);
        const medName = med?.medicine_name || 'Prescribed Medicine';
        const doseAmount = med?.dose_amount || med?.strength || '1 dose';
        const formattedTime = formatDoseTime(dose.scheduled_minutes);
        const overdueMins = getDoseOverdueMinutes(dose, { now });

        const templateParams: CaregiverAlertTemplateParams = {
          profileName,
          medicineName: medName,
          doseAmount,
          scheduledTime: formattedTime,
        };

        const alertMessage = generateCaregiverAlertMessage(templateParams);
        const whatsAppUrl = generateWhatsAppAlertUrl(caregiverPhone, alertMessage);

        overdueList.push({
          doseId: dose.id,
          profileId,
          profileName,
          medicineId: dose.medicine_id,
          medicineName: medName,
          doseAmount,
          scheduledDate: dose.scheduled_date,
          scheduledMinutes: dose.scheduled_minutes,
          scheduledTimeFormatted: formattedTime,
          status: dose.status,
          minutesOverdue: overdueMins,
          alertMessage,
          whatsAppUrl,
        });
      }
    }

    return overdueList;
  } catch (err) {
    console.warn('checkOverdueDosesForProfile failed:', err);
    return [];
  }
}

/**
 * Retrieves caregiver preferences from localStorage, with fallback defaults.
 */
export function getCaregiverPreferences(profileId?: string): CaregiverAlertPreferences {
  const key = `${PREFS_STORAGE_PREFIX}${profileId || 'default'}`;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CAREGIVER_PREFERENCES,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn('Failed to parse caregiver preferences:', err);
  }
  return { ...DEFAULT_CAREGIVER_PREFERENCES };
}

/**
 * Persists caregiver preferences to localStorage.
 */
export function saveCaregiverPreferences(
  prefs: Partial<CaregiverAlertPreferences>,
  profileId?: string
): CaregiverAlertPreferences {
  const current = getCaregiverPreferences(profileId);
  const updated: CaregiverAlertPreferences = {
    ...current,
    ...prefs,
  };
  const key = `${PREFS_STORAGE_PREFIX}${profileId || 'default'}`;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to save caregiver preferences:', err);
  }
  return updated;
}

/**
 * Checks whether the user has an active Curewell Family Pass.
 */
export function isFamilyPassActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(FAMILY_PASS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets the Family Pass subscription state in local store.
 */
export function setFamilyPassActive(active: boolean, plan: string = 'monthly_pkr'): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      localStorage.setItem(FAMILY_PASS_STORAGE_KEY, 'true');
      localStorage.setItem(FAMILY_PASS_PLAN_KEY, plan);
    } else {
      localStorage.removeItem(FAMILY_PASS_STORAGE_KEY);
      localStorage.removeItem(FAMILY_PASS_PLAN_KEY);
    }
  } catch (err) {
    console.error('Failed to update Family Pass status:', err);
  }
}

/**
 * Retrieves current Family Pass subscription status and metadata.
 */
export function getFamilyPassInfo(): {
  isActive: boolean;
  plan: string | null;
} {
  if (typeof window === 'undefined') {
    return { isActive: false, plan: null };
  }
  try {
    const active = localStorage.getItem(FAMILY_PASS_STORAGE_KEY) === 'true';
    const plan = localStorage.getItem(FAMILY_PASS_PLAN_KEY) || null;
    return { isActive: active, plan };
  } catch {
    return { isActive: false, plan: null };
  }
}
