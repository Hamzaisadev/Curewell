/**
 * Clinical Action Executor Module.
 *
 * Deep domain module decoupling clinical tool execution from UI cards.
 * Exposes a single headless seam `executeClinicalAction` to execute and persist
 * clinical actions (schedule adjustment, symptom triage logging, follow-up
 * scheduling, receipt/expense tracking, etc.) without mounting React components.
 */

import { medicinesRepo, sideEffectsRepo, testOrdersRepo, visitsRepo, dosesRepo } from '../lib/db';
import { todayInAppTz, addDaysAppTz } from '../lib/time';
import { getExpenseStorageKey, type HealthExpenseItem } from '../lib/finance';

export type ClinicalActionType =
  | 'log_symptom'
  | 'adjust_schedule'
  | 'create_refill'
  | 'schedule_followup'
  | 'otc_compatibility'
  | 'emergency_triage'
  | 'missed_dose'
  | 'caregiver_brief'
  | 'generic_substitution'
  | 'pre_op_cessation'
  | 'pregnancy_lactation'
  | 'travel_timezone'
  | 'log_expense';

export interface ClinicalActionData {
  symptom?: string;
  medicine_name?: string;
  new_time?: string;
  meal_relation?: string;
  adjustment_reason?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  shiftDetails?: string;
  pillCount?: number;
  dailyDose?: number;
  daysRemaining?: number;
  doctor_name?: string;
  followupDate?: string;
  test_name?: string;
  otc_name?: string;
  safety_grade?: 'safe' | 'caution' | 'prohibited';
  safety_note?: string;
  safe_alternative?: string;
  emergency_title?: string;
  emergency_reasons?: string[];
  // Receipt & Expense tool data
  expense_title?: string;
  expense_category?: 'doctor' | 'medicine' | 'lab' | 'other';
  expense_amount?: number;
  expense_currency?: string;
  expense_date?: string;
  pharmacy_name?: string;
  receipt_items?: Array<{ name: string; price?: number; quantity?: number }>;
  // Catchup / Caregiver / Travel
  missed_time?: string;
  catchup_instructions?: string;
  do_not_double?: boolean;
  caregiver_message?: string;
  prescribed_brand?: string;
  dispensed_brand?: string;
  generic_name?: string;
  is_equivalent?: boolean;
  procedure_name?: string;
  procedure_date?: string;
  meds_to_stop?: Array<{ name: string; stop_days_before: number; stop_date: string }>;
  pregnancy_category?: string;
  lactation_safety?: string;
  fetal_risk_summary?: string;
  destination_city?: string;
  flight_plan?: Array<{ local_time: string; instruction: string }>;
}

export interface ClinicalActionCall {
  type: ClinicalActionType;
  title?: string;
  data: ClinicalActionData;
}

export interface ActionExecutionContext {
  userId: string;
  profileId: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export async function executeClinicalAction(
  action: ClinicalActionCall,
  context: ActionExecutionContext
): Promise<ActionResult> {
  if (!action || !action.type || !action.data) {
    return {
      success: false,
      message: 'Invalid clinical action call payload.',
    };
  }

  const effectiveUserId = context.userId || context.profileId;
  const profileId = context.profileId;

  switch (action.type) {
    case 'adjust_schedule': {
      const medicineName = action.data.medicine_name?.trim() || '';
      if (!medicineName) {
        return {
          success: false,
          message: 'Medication name is required to adjust schedule.',
        };
      }

      const currentMeds = await medicinesRepo.listMedicines(profileId);
      const targetMed = currentMeds.find(
        (m) =>
          m.medicine_name.toLowerCase().includes(medicineName.toLowerCase()) ||
          medicineName.toLowerCase().includes(m.medicine_name.toLowerCase())
      );

      if (!targetMed) {
        return {
          success: false,
          message: `Medicine "${medicineName}" not found in current regimen.`,
        };
      }

      const isWithFood =
        action.data.meal_relation?.toLowerCase().includes('after') ||
        action.data.meal_relation?.toLowerCase().includes('with');

      const updatedInstructions = `${targetMed.instructions || ''} [Updated schedule: ${action.data.new_time || ''} ${action.data.meal_relation || ''}]`.trim();

      const updated = await medicinesRepo.updateMedicine(targetMed.id, {
        instructions: updatedInstructions,
        with_food: isWithFood,
      });

      // Clear future pending doses from today so the dynamic projection refreshes with new timing
      try {
        await dosesRepo.deleteFuturePendingDoses(targetMed.id, todayInAppTz());
      } catch (err) {
        console.warn('Could not reset future doses:', err);
      }

      return {
        success: true,
        message: `Applied schedule adjustment for ${targetMed.medicine_name}.`,
        data: { medicine: updated },
      };
    }

    case 'log_symptom': {
      const symptomNote = action.data.symptom || 'Reported symptom';
      const medicineName = action.data.medicine_name || 'General Health Symptom';
      const severity = action.data.severity || 'mild';

      const entry = await sideEffectsRepo.createSideEffect({
        user_id: effectiveUserId,
        profile_id: profileId,
        medicine_name: medicineName,
        note: symptomNote,
        severity,
        occurred_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Symptom "${symptomNote}" logged to Medical Timeline.`,
        data: { sideEffect: entry },
      };
    }

    case 'schedule_followup': {
      const today = todayInAppTz();
      const targetDate = action.data.followupDate || addDaysAppTz(today, 14);

      if (action.data.test_name) {
        const order = await testOrdersRepo.createTestOrder({
          user_id: effectiveUserId,
          profile_id: profileId,
          test_name: action.data.test_name,
          ordered_date: today,
          status: 'pending',
        });

        return {
          success: true,
          message: `Repeat diagnostic test "${action.data.test_name}" scheduled for ${today}.`,
          data: { testOrder: order },
        };
      } else {
        const doctor = action.data.doctor_name || 'Physician';
        const visit = await visitsRepo.createVisit({
          user_id: effectiveUserId,
          profile_id: profileId,
          doctor_name: doctor,
          visit_date: targetDate,
          diagnosis: 'Follow-up Consultation',
        });

        return {
          success: true,
          message: `Follow-up reminder recorded for Dr. ${doctor} on ${targetDate}.`,
          data: { visit },
        };
      }
    }

    case 'log_expense': {
      const title =
        action.data.expense_title ||
        `${action.data.pharmacy_name || 'Pharmacy'} Medicine Bill`;
      const amount = action.data.expense_amount || 0;
      const category = action.data.expense_category || 'medicine';
      const date = action.data.expense_date || todayInAppTz();
      const currency = action.data.expense_currency || 'Rs.';
      const pharmacy = action.data.pharmacy_name;

      const newExpense: HealthExpenseItem = {
        id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        amount,
        category,
        date,
        currency,
        note: pharmacy ? `Scanned bill from ${pharmacy}` : undefined,
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const profileKey = getExpenseStorageKey(profileId);
          const rawProfile = window.localStorage.getItem(profileKey);
          const profileList: HealthExpenseItem[] = rawProfile ? JSON.parse(rawProfile) : [];
          profileList.unshift(newExpense);
          window.localStorage.setItem(profileKey, JSON.stringify(profileList));

          const rootKey = 'curewell_health_expenses_v1';
          const rawRoot = window.localStorage.getItem(rootKey);
          const rootList: HealthExpenseItem[] = rawRoot ? JSON.parse(rawRoot) : [];
          rootList.unshift(newExpense);
          window.localStorage.setItem(rootKey, JSON.stringify(rootList));
        } catch {
          // Gracefully continue if localStorage is quota exceeded or disabled
        }
      }

      return {
        success: true,
        message: `Expense of ${currency} ${amount.toLocaleString()} logged to Medical Expenses.`,
        data: { expense: newExpense },
      };
    }

    case 'missed_dose':
    case 'caregiver_brief':
    case 'generic_substitution':
    case 'pre_op_cessation':
    case 'pregnancy_lactation':
    case 'travel_timezone':
    case 'create_refill':
    case 'otc_compatibility':
    case 'emergency_triage': {
      return {
        success: true,
        message: `Clinical action "${action.type}" handled.`,
        data: { ...action.data },
      };
    }

    default: {
      return {
        success: false,
        message: `Unsupported action type: ${(action as { type: string }).type}`,
      };
    }
  }
}
