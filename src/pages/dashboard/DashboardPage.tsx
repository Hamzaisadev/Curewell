import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PatientInfoCard } from './components/PatientInfoCard';
import { MedicationScheduleCard } from './components/MedicationScheduleCard';
import { BloodPressureTrendCard } from './components/BloodPressureTrendCard';
import { BloodGlucoseTrendCard } from './components/BloodGlucoseTrendCard';
import { AdherenceHabitsCard } from './components/AdherenceHabitsCard';
import { UpNextCard } from './components/UpNextCard';
import { QuickVitalsModal } from '../../components/vitals/QuickVitalsModal';
import {
  HeartPulseIcon,
  DropletIcon,
  CapsuleIcon,
  LabFlaskIcon,
} from '../../components/ui/icons';

export function DashboardPage() {
  const [vitalsModal, setVitalsModal] = useState<{ open: boolean; type: 'glucose' | 'bp' }>({
    open: false,
    type: 'bp',
  });
  const [vitalsRefreshKey, setVitalsRefreshKey] = useState(0);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        {/* ── Patient Identity & Circadian Greeting ────────────────── */}
        <PatientInfoCard />

        {/* ── Streamlined Quick Action Bar (4 essential daily actions) ── */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setVitalsModal({ open: true, type: 'bp' })}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface hover:bg-surface-sunken border border-line text-xs font-bold text-content shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <HeartPulseIcon size={14} className="text-rose-500" />
            <span>+ Log Blood Pressure</span>
          </button>

          <button
            type="button"
            onClick={() => setVitalsModal({ open: true, type: 'glucose' })}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface hover:bg-surface-sunken border border-line text-xs font-bold text-content shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <DropletIcon size={14} className="text-amber-500" />
            <span>+ Log Blood Sugar</span>
          </button>

          <Link
            to="/prescriptions/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface hover:bg-surface-sunken border border-line text-xs font-bold text-content shadow-xs transition-all shrink-0"
          >
            <CapsuleIcon size={14} className="text-brand-600 dark:text-brand-400" />
            <span>+ Add Medicine</span>
          </Link>

          <Link
            to="/reports/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface hover:bg-surface-sunken border border-line text-xs font-bold text-content shadow-xs transition-all shrink-0"
          >
            <LabFlaskIcon size={14} className="text-teal-600 dark:text-teal-400" />
            <span>+ Upload Report</span>
          </Link>
        </div>

        {/* ── Asymmetric 2-Column Daily Health Companion Layout ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column (8 cols): Today's Medicines & Vitals */}
          <div className="lg:col-span-8 space-y-6">
            <MedicationScheduleCard
              onDoseRecorded={() => {
                setScheduleRefreshKey((prev) => prev + 1);
                setVitalsRefreshKey((prev) => prev + 1);
              }}
            />

            {/* Side-by-side Blood Pressure & Blood Sugar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <BloodPressureTrendCard
                key={`bp-trend-${vitalsRefreshKey}`}
                onOpenLog={() => setVitalsModal({ open: true, type: 'bp' })}
              />
              <BloodGlucoseTrendCard
                key={`glucose-trend-${vitalsRefreshKey}`}
                onOpenLog={() => setVitalsModal({ open: true, type: 'glucose' })}
              />
            </div>
          </div>

          {/* Side Rail (4 cols): Daily Routine Habits & Coming Up */}
          <div className="lg:col-span-4 space-y-6">
            <AdherenceHabitsCard refreshKey={scheduleRefreshKey} />
            <UpNextCard refreshKey={scheduleRefreshKey} />
          </div>
        </div>
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
