import { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PatientInfoCard } from './components/PatientInfoCard';
import { LabsCard } from './components/LabsCard';
import { MedicationScheduleCard } from './components/MedicationScheduleCard';
import { AdherenceHabitsCard } from './components/AdherenceHabitsCard';
import { CabinetSummaryCard } from './components/CabinetSummaryCard';
import { ClinicalDossierCard } from './components/ClinicalDossierCard';
import { BloodPressureTrendCard } from './components/BloodPressureTrendCard';
import { BloodGlucoseTrendCard } from './components/BloodGlucoseTrendCard';
import { ActivePrescriptionsCard } from './components/ActivePrescriptionsCard';
import { RecentConsultationsCard } from './components/RecentConsultationsCard';
import { SymptomTriageCard } from './components/SymptomTriageCard';
import { MedicalRecordsVaultCard } from './components/MedicalRecordsVaultCard';
import { DrugInteractionRadarCard } from './components/DrugInteractionRadarCard';
import { HealthMilestonesCard } from './components/HealthMilestonesCard';
import { CareScheduleTimelineCard } from './components/CareScheduleTimelineCard';
import { EmergencyHotlinesStripCard } from './components/EmergencyHotlinesStripCard';
import { QuickVitalsModal } from '../../components/vitals/QuickVitalsModal';

export function DashboardPage() {
  const [vitalsModal, setVitalsModal] = useState<{ open: boolean; type: 'glucose' | 'bp' }>({
    open: false,
    type: 'bp',
  });
  const [vitalsRefreshKey, setVitalsRefreshKey] = useState(0);

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        {/* ═══════════════════════════════════════════════════════════════
            BENTO SECTION 1: MASTER OVERVIEW (Cards 1–6)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Master Column: 8 cols (equivalent to 4 units wide) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Tile 1: Patient Demographics & Conditions */}
            <PatientInfoCard />

            {/* Tile 2: Upcoming Medications Schedule (Full width across left master col) */}
            <MedicationScheduleCard />

            {/* Sub-grid: Medicine Cabinet & Daily Adherence (Balanced 50/50 side-by-side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1 items-stretch">
              {/* Tile 3: Medicine Cabinet & Inventory Supply */}
              <div className="flex flex-col">
                <CabinetSummaryCard className="h-full" />
              </div>

              {/* Tile 4: Daily Adherence & Habits */}
              <div className="flex flex-col">
                <AdherenceHabitsCard className="h-full" />
              </div>
            </div>
          </div>

          {/* Right Master Column: 4 cols (equivalent to 2 units wide) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Tile 1: Diagnostic Labs (Emerald Green Theme) */}
            <LabsCard />

            {/* Tile 14: Clinical Care Guidance & Assistant Dossier */}
            <div className="flex-1 flex flex-col">
              <ClinicalDossierCard />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BENTO SECTION 2: DEDICATED VITALS & METABOLIC TRENDS (Cards 8 & 9)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 8: Blood Pressure Trend Analytics */}
          <div className="lg:col-span-7 flex flex-col">
            <BloodPressureTrendCard
              key={`bp-trend-${vitalsRefreshKey}`}
              onOpenLog={() => setVitalsModal({ open: true, type: 'bp' })}
            />
          </div>

          {/* Card 9: Blood Glucose Curve & ADA Range */}
          <div className="lg:col-span-5 flex flex-col">
            <BloodGlucoseTrendCard
              key={`glucose-trend-${vitalsRefreshKey}`}
              onOpenLog={() => setVitalsModal({ open: true, type: 'glucose' })}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BENTO SECTION 3: PRESCRIPTIONS & CLINICAL VISITS (Cards 10 & 11)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 10: Active Prescriptions & Regimens */}
          <div className="lg:col-span-6 flex flex-col">
            <ActivePrescriptionsCard />
          </div>

          {/* Card 11: Recent Consultations & Doctor Notes */}
          <div className="lg:col-span-6 flex flex-col">
            <RecentConsultationsCard />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BENTO SECTION 4: TRIAGE, RECORDS & SAFETY (Cards 12, 13 & 14)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Card 12: Symptom Tracker & Red Flags */}
          <div className="flex flex-col">
            <SymptomTriageCard />
          </div>

          {/* Card 13: Diagnostic Scans & Records Vault */}
          <div className="flex flex-col">
            <MedicalRecordsVaultCard />
          </div>

          {/* Card 14: Drug Interaction Radar */}
          <div className="flex flex-col">
            <DrugInteractionRadarCard />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BENTO SECTION 5: CARE TIMELINE & AWARDS (Cards 15 & 16)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 15: Care Schedule & Next Appointments */}
          <div className="lg:col-span-6 flex flex-col">
            <CareScheduleTimelineCard />
          </div>

          {/* Card 16: Health Milestones & Badges */}
          <div className="lg:col-span-6 flex flex-col">
            <HealthMilestonesCard />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BENTO SECTION 6: 24/7 EMERGENCY HOTLINES STRIP
            ═══════════════════════════════════════════════════════════════ */}
        <EmergencyHotlinesStripCard />
      </div>

      {/* Quick Vitals Modal for Instant Logging */}
      {vitalsModal.open && (
        <QuickVitalsModal
          open={vitalsModal.open}
          initialType={vitalsModal.type}
          onClose={() => setVitalsModal({ open: false, type: 'bp' })}
          onSaved={() => setVitalsRefreshKey((prev) => prev + 1)}
        />
      )}
    </AppShell>
  );
}
