import { AppShell } from '../../components/layout/AppShell';
import { PatientInfoCard } from './components/PatientInfoCard';
import { LabsCard } from './components/LabsCard';
import { MedicationScheduleCard } from './components/MedicationScheduleCard';

export function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5 pb-12">
        {/* ── True Bento Grid Layout ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] xl:grid-cols-[62%_1fr] gap-5 items-start">
          {/* Left Column: Stack of compact cards */}
          <div className="space-y-5 flex flex-col">
            {/* Card 1: Patient Info (Compact ~195-200px) */}
            <PatientInfoCard />

            {/* Card 3: Medication Schedule (Compact ~195-200px) */}
            <MedicationScheduleCard />
          </div>

          {/* Right Column: Labs Card (Full ~400px height, untouched) */}
          <div className="h-full">
            <LabsCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
