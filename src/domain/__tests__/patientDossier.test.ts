/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assembleClinicalContext, getUnifiedTimeline } from '../patientDossier';
import {
  visitsRepo,
  reportsRepo,
  medicinesRepo,
  sideEffectsRepo,
  profilesRepo,
  vitalsRepo,
} from '../../lib/db';

vi.mock('../../lib/db', () => ({
  profilesRepo: {
    getProfileById: vi.fn(),
  },
  medicinesRepo: {
    listMedicines: vi.fn(),
  },
  visitsRepo: {
    listVisits: vi.fn(),
  },
  reportsRepo: {
    listReports: vi.fn(),
    listReportResults: vi.fn(),
  },
  vitalsRepo: {
    listGlucoseReadings: vi.fn(),
    listBloodPressureReadings: vi.fn(),
  },
  sideEffectsRepo: {
    listSideEffects: vi.fn(),
  },
}));

describe('patientDossier module', () => {
  const profileId = 'patient-profile-100';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assembleClinicalContext', () => {
    it('aggregates profile, active meds, reports with results, and vitals into structured context', async () => {
      vi.mocked(profilesRepo.getProfileById).mockResolvedValue({
        id: profileId,
        user_id: 'user-1',
        full_name: 'Fatima Ahmed',
        sex: 'female',
        date_of_birth: '1985-04-12',
        allergies: 'Penicillin',
        chronic_conditions: 'Type 2 Diabetes',
      } as any);

      vi.mocked(medicinesRepo.listMedicines).mockResolvedValue([
        {
          id: 'med-1',
          medicine_name: 'Metformin',
          strength: '500mg',
          dose_amount: '1 tab',
          frequency_code: 'BD',
          start_date: '2026-09-01',
          end_date: null,
          is_ongoing: true,
          with_food: true,
          instructions: 'After meals',
          discontinued_at: null,
        } as any,
      ]);

      vi.mocked(visitsRepo.listVisits).mockResolvedValue([
        {
          id: 'visit-1',
          doctor_name: 'Dr. Sarah Khan',
          visit_date: '2026-09-15',
          diagnosis: 'Routine Checkup',
          doctor_advice: 'Continue current medications',
        } as any,
      ]);

      vi.mocked(reportsRepo.listReports).mockResolvedValue([
        {
          id: 'rep-1',
          title: 'Complete Blood Count',
          report_date: '2026-09-20',
        } as any,
      ]);

      vi.mocked(reportsRepo.listReportResults).mockResolvedValue([
        {
          id: 'res-1',
          test_name: 'HbA1c',
          value_text: '6.5',
          unit: '%',
          reference_range: '< 5.7',
          range_status: 'high',
        } as any,
      ]);

      vi.mocked(vitalsRepo.listGlucoseReadings).mockResolvedValue([
        {
          id: 'g-1',
          measured_at: '2026-09-30T08:00:00Z',
          value_mg_dl: 115,
          type: 'fasting',
          notes: null,
        } as any,
      ]);

      vi.mocked(vitalsRepo.listBloodPressureReadings).mockResolvedValue([
        {
          id: 'bp-1',
          measured_at: '2026-09-30T08:05:00Z',
          systolic: 120,
          diastolic: 80,
          pulse_bpm: 72,
          arm: 'left',
          posture: 'sitting',
          notes: null,
        } as any,
      ]);

      vi.mocked(sideEffectsRepo.listSideEffects).mockResolvedValue([
        {
          id: 'se-1',
          medicine_name: 'Metformin',
          note: 'Mild nausea',
          severity: 'mild',
          occurred_at: '2026-09-02T10:00:00Z',
        } as any,
      ]);

      const context = await assembleClinicalContext(profileId);

      expect(context.profile?.full_name).toBe('Fatima Ahmed');
      expect(context.profile?.allergies).toBe('Penicillin');
      expect(context.activeMedicines).toHaveLength(1);
      expect(context.activeMedicines[0]?.medicine_name).toBe('Metformin');
      expect(context.recentVisits[0]?.doctor_name).toBe('Dr. Sarah Khan');
      expect(context.recentReports[0]?.results[0]?.test_name).toBe('HbA1c');
      expect(context.glucoseLogs[0]?.value_mg_dl).toBe(115);
      expect(context.bloodPressureLogs[0]?.systolic).toBe(120);
      expect(context.sideEffectsHistory[0]?.note).toBe('Mild nausea');
    });
  });

  describe('getUnifiedTimeline', () => {
    it('collates visits, lab reports, side effects and groups multi-medicine prescriptions', async () => {
      vi.mocked(visitsRepo.listVisits).mockResolvedValue([
        {
          id: 'v-10',
          visit_date: '2026-09-10',
          doctor_name: 'Dr. Tariq',
          clinic_name: 'City Clinic',
          diagnosis: 'Hypertension',
          doctor_advice: 'Low salt diet',
          visit_cost: 2000,
        } as any,
      ]);

      vi.mocked(reportsRepo.listReports).mockResolvedValue([
        {
          id: 'r-10',
          report_date: '2026-09-12',
          title: 'Lipid Panel',
          lab_name: 'Chughtai Lab',
        } as any,
      ]);

      // Two medicines from the same visit
      vi.mocked(medicinesRepo.listMedicines).mockResolvedValue([
        {
          id: 'm-1',
          visit_id: 'v-10',
          medicine_name: 'Amlodipine',
          strength: '5mg',
          start_date: '2026-09-10',
          is_ongoing: true,
          instructions: 'Morning',
        } as any,
        {
          id: 'm-2',
          visit_id: 'v-10',
          medicine_name: 'Losartan',
          strength: '50mg',
          start_date: '2026-09-10',
          is_ongoing: true,
          instructions: 'Night',
        } as any,
      ]);

      vi.mocked(sideEffectsRepo.listSideEffects).mockResolvedValue([
        {
          id: 's-1',
          note: 'Dizziness',
          severity: 'mild',
          occurred_at: '2026-09-11T12:00:00Z',
          created_at: '2026-09-11T12:00:00Z',
        } as any,
      ]);

      const timeline = await getUnifiedTimeline(profileId);

      // We expect: 1 visit, 1 report, 1 grouped prescription (combining 2 meds), 1 side effect = 4 items
      expect(timeline).toHaveLength(4);

      // Verify chronological sorting (newest first):
      // 2026-09-12 (report) -> 2026-09-11 (side effect) -> 2026-09-10 (prescription & visit)
      expect(timeline[0]?.type).toBe('report');
      expect(timeline[0]?.title).toBe('Lipid Panel');

      const prescriptionItem = timeline.find((item) => item.type === 'medicine');
      expect(prescriptionItem).toBeDefined();
      expect(prescriptionItem?.title).toBe('Prescription • 2 Medications');
      expect(prescriptionItem?.medicinesList).toHaveLength(2);
    });
  });
});
