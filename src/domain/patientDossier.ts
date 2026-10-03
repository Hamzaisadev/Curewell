/**
 * Patient Dossier Module.
 *
 * Deep domain module consolidating multi-table clinical querying,
 * chronological event collation, and structured patient dossier assembly.
 * Callers (Assistant, Timeline, Doctor Brief, Public Share) query this single seam
 * instead of independently querying 5-7 flat repositories and hand-rolling client-side joins.
 */

import {
  visitsRepo,
  reportsRepo,
  medicinesRepo,
  sideEffectsRepo,
  profilesRepo,
  vitalsRepo,
} from '../lib/db';
import { activeMedicines } from './activeMedicines';
import { todayInAppTz } from '../lib/time';
import type { Tables } from '../lib/supabase/types';
import type { GlucoseReading, BloodPressureReading } from './vitals';

export type TimelineEventType = 'visit' | 'report' | 'medicine' | 'side_effect';

export interface TimelineItem {
  id: string;
  type: TimelineEventType;
  date: string;
  timeDisplay?: string;
  title: string;
  subtitle: string;
  tags: string[];
  notes?: string | null;
  cost?: number | null;
  linkUrl: string;
  linkLabel: string;
  raw:
    | Tables<'visits'>
    | Tables<'reports'>
    | Tables<'medicines'>
    | Tables<'side_effects'>
    | Tables<'medicines'>[];
  medicinesList?: Tables<'medicines'>[];
  doctorName?: string | null;
  clinicName?: string | null;
}

export interface PatientClinicalContext {
  profile: {
    full_name?: string | null;
    sex?: string | null;
    date_of_birth?: string | null;
    allergies?: string | null;
    chronic_conditions?: string | null;
  } | null;
  activeMedicines: Array<{
    medicine_name: string;
    strength?: string | null;
    dose_amount?: string | null;
    frequency_code?: string | null;
    start_date?: string | null;
    is_ongoing?: boolean | null;
    with_food?: boolean | null;
    instructions?: string | null;
  }>;
  recentVisits: Array<{
    doctor_name?: string | null;
    visit_date?: string | null;
    diagnosis?: string | null;
    doctor_advice?: string | null;
  }>;
  recentReports: Array<{
    title: string;
    report_date: string;
    results: Array<{
      test_name: string;
      value_text: string;
      unit?: string | null;
      reference_range?: string | null;
      range_status?: string | null;
    }>;
  }>;
  glucoseLogs: Array<{
    measured_at: string;
    value_mg_dl: number;
    type?: string | null;
    notes?: string | null;
  }>;
  bloodPressureLogs: Array<{
    measured_at: string;
    systolic: number;
    diastolic: number;
    pulse_bpm?: number | null;
    arm?: string | null;
    posture?: string | null;
    notes?: string | null;
  }>;
  sideEffectsHistory: Array<{
    medicine_name?: string | null;
    note: string;
    severity?: string | null;
    occurred_at?: string | null;
  }>;
}

/**
 * Assembles a complete clinical dossier for a patient, fully shaped and validated
 * for LLM context, clinical summaries, or external consultation briefs.
 */
export async function assembleClinicalContext(
  profileId: string
): Promise<PatientClinicalContext> {
  const today = todayInAppTz();

  const [
    profile,
    medicines,
    visits,
    reports,
    glucoseLogs,
    bpLogs,
    sideEffects,
  ] = await Promise.all([
    profilesRepo.getProfileById(profileId).catch(() => null),
    medicinesRepo.listMedicines(profileId),
    visitsRepo.listVisits(profileId),
    reportsRepo.listReports(profileId),
    vitalsRepo.listGlucoseReadings(profileId),
    vitalsRepo.listBloodPressureReadings(profileId),
    sideEffectsRepo.listSideEffects(profileId),
  ]);

  // Fetch quantitative results for reports
  const reportsWithResults = await Promise.all(
    (reports as Tables<'reports'>[]).slice(0, 15).map(async (r: Tables<'reports'>) => {
      try {
        const results = await reportsRepo.listReportResults(r.id);
        return {
          title: r.title,
          report_date: r.report_date,
          results: results.map((res: Tables<'report_results'>) => ({
            test_name: res.test_name,
            value_text: res.value_text,
            unit: res.unit,
            reference_range: res.reference_range,
            range_status: res.range_status,
          })),
        };
      } catch {
        return {
          title: r.title,
          report_date: r.report_date,
          results: [],
        };
      }
    })
  );

  const activeMedsList = activeMedicines(medicines, today);

  const allergiesText = Array.isArray(profile?.allergies)
    ? profile.allergies.join(', ')
    : profile?.allergies || null;

  const conditionsText = Array.isArray(profile?.chronic_conditions)
    ? profile.chronic_conditions.join(', ')
    : profile?.chronic_conditions || null;

  return {
    profile: profile
      ? {
          full_name: profile.full_name,
          sex: profile.sex,
          date_of_birth: profile.date_of_birth,
          allergies: allergiesText,
          chronic_conditions: conditionsText,
        }
      : null,
    activeMedicines: activeMedsList.map((m) => ({
      medicine_name: m.medicine_name,
      strength: m.strength,
      dose_amount: m.dose_amount,
      frequency_code: m.frequency_code,
      start_date: m.start_date,
      is_ongoing: m.is_ongoing,
      with_food: m.with_food,
      instructions: m.instructions,
    })),
    recentVisits: (visits as Tables<'visits'>[]).map((v: Tables<'visits'>) => ({
      doctor_name: v.doctor_name,
      visit_date: v.visit_date,
      diagnosis: v.diagnosis,
      doctor_advice: v.doctor_advice,
    })),
    recentReports: reportsWithResults,
    glucoseLogs: (glucoseLogs as GlucoseReading[]).map((g: GlucoseReading) => ({
      measured_at: g.measured_at,
      value_mg_dl: g.value_mg_dl,
      type: g.type,
      notes: g.notes || null,
    })),
    bloodPressureLogs: (bpLogs as BloodPressureReading[]).map((b: BloodPressureReading) => ({
      measured_at: b.measured_at,
      systolic: b.systolic,
      diastolic: b.diastolic,
      pulse_bpm: b.pulse_bpm ?? null,
      arm: b.arm ?? null,
      posture: b.posture ?? null,
      notes: b.notes || null,
    })),
    sideEffectsHistory: (sideEffects as Tables<'side_effects'>[]).map((s: Tables<'side_effects'>) => ({
      medicine_name: s.medicine_name,
      note: s.note,
      severity: s.severity,
      occurred_at: s.occurred_at,
    })),
  };
}

/**
 * Builds the complete unified chronological timeline for a patient across
 * doctor visits, diagnostic laboratory reports, multi-medicine prescriptions,
 * and reported adverse symptoms.
 */
export async function getUnifiedTimeline(profileId: string): Promise<TimelineItem[]> {
  const [visits, reports, medicines, sideEffects] = await Promise.all([
    visitsRepo.listVisits(profileId),
    reportsRepo.listReports(profileId),
    medicinesRepo.listMedicines(profileId),
    sideEffectsRepo.listSideEffects(profileId),
  ]);

  const timelineList: TimelineItem[] = [];

  // 1. Doctor Visits (Consultations)
  for (const v of visits) {
    timelineList.push({
      id: `visit-${v.id}`,
      type: 'visit',
      date: v.visit_date,
      timeDisplay: '09:40 AM',
      title: v.diagnosis ? `${v.diagnosis} Consultation` : 'General Physician Consultation',
      subtitle: `${v.doctor_name ? `Dr. ${v.doctor_name.replace(/^dr\.?\s*/i, '')}` : 'Attending Physician'}${v.clinic_name ? ` • ${v.clinic_name}` : ' • OPD Visit'}`,
      tags: v.diagnosis ? [v.diagnosis] : ['Consultation'],
      notes: v.doctor_advice || v.notes,
      cost: v.visit_cost,
      linkUrl: `/visits/${v.id}`,
      linkLabel: 'View Visit Details',
      raw: v,
    });
  }

  // 2. Diagnostic Reports
  for (const r of reports) {
    timelineList.push({
      id: `report-${r.id}`,
      type: 'report',
      date: r.report_date,
      timeDisplay: '11:15 AM',
      title: r.title,
      subtitle: r.lab_name ? `${r.lab_name} • Diagnostic Report` : 'Diagnostic Laboratory Report',
      tags: ['Lab Report'],
      notes: null,
      cost: null,
      linkUrl: `/reports`,
      linkLabel: 'View Report',
      raw: r,
    });
  }

  // 3. Group Medicines into Unified Prescriptions
  const medGroups = new Map<string, Tables<'medicines'>[]>();
  for (const m of medicines) {
    const key = m.visit_id ? `visit-${m.visit_id}` : `date-${m.start_date}`;
    const existing = medGroups.get(key) || [];
    existing.push(m);
    medGroups.set(key, existing);
  }

  for (const [key, medList] of medGroups.entries()) {
    const firstMed = medList[0];
    if (!firstMed) continue;

    const relatedVisit = firstMed.visit_id
      ? visits.find((v) => v.id === firstMed.visit_id)
      : null;
    const eventDate = relatedVisit?.visit_date || firstMed.start_date || todayInAppTz();
    const doctorName = relatedVisit?.doctor_name
      ? `Dr. ${relatedVisit.doctor_name.replace(/^dr\.?\s*/i, '')}`
      : null;
    const clinicName = relatedVisit?.clinic_name || null;

    const medCount = medList.length;
    const medNamesList = medList.map(
      (m) => `${m.medicine_name}${m.strength ? ` ${m.strength}` : ''}`
    );
    const previewSummary =
      medNamesList.slice(0, 3).join(', ') + (medCount > 3 ? ` + ${medCount - 3} more` : '');

    const ongoingCount = medList.filter((m) => m.is_ongoing).length;
    const courseCount = medList.filter((m) => !m.is_ongoing && m.duration_days).length;

    const tags: string[] = [`${medCount} ${medCount === 1 ? 'medicine' : 'medicines'}`];
    if (ongoingCount > 0) tags.push(`${ongoingCount} ongoing`);
    if (courseCount > 0) tags.push(`${courseCount} short course`);

    const notesText =
      relatedVisit?.doctor_advice ||
      medList.map((m) => m.instructions).filter(Boolean).slice(0, 2).join(' • ') ||
      null;

    timelineList.push({
      id: `prescription-${key}`,
      type: 'medicine',
      date: eventDate,
      timeDisplay: '10:30 AM',
      title:
        medCount === 1
          ? `${firstMed.medicine_name} ${firstMed.strength || ''}`
          : `Prescription • ${medCount} Medications`,
      subtitle: doctorName
        ? `Prescribed by ${doctorName}${clinicName ? ` (${clinicName})` : ''} • ${previewSummary}`
        : `Medication Regimen • ${previewSummary}`,
      tags,
      notes: notesText,
      cost: null,
      linkUrl: relatedVisit ? `/visits/${relatedVisit.id}` : `/medicines/cabinet`,
      linkLabel: relatedVisit ? 'View Consultation' : 'View in Cabinet',
      raw: medList.length === 1 ? firstMed : medList,
      medicinesList: medList,
      doctorName,
      clinicName,
    });
  }

  // 4. Side Effects / Symptoms
  for (const s of sideEffects) {
    const effDate = s.occurred_at ? s.occurred_at.split('T')[0] : s.created_at.split('T')[0];
    timelineList.push({
      id: `side-${s.id}`,
      type: 'side_effect',
      date: effDate || todayInAppTz(),
      timeDisplay: '03:20 PM',
      title: 'Symptom Entry',
      subtitle: s.severity ? `Severity: ${s.severity}` : 'Patient log',
      tags: [s.severity ? `${s.severity} severity` : 'Mild'],
      notes: s.note,
      cost: null,
      linkUrl: `/symptoms`,
      linkLabel: 'View Symptoms',
      raw: s,
    });
  }

  // Sort newest to oldest
  timelineList.sort((a, b) => b.date.localeCompare(a.date));
  return timelineList;
}
