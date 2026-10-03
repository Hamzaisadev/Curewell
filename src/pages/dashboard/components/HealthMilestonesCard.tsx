import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { medicinesRepo, reportsRepo, visitsRepo } from '../../../lib/db';
import { listBloodPressureReadings, listGlucoseReadings } from '../../../lib/db/vitals';
import { formatDateShort } from '../../../lib/time';

interface ClinicalMilestoneItem {
  id: string;
  title: string;
  status: 'on_track' | 'due_soon' | 'completed';
  statusLabel: string;
  dateNote: string;
  category: string;
}

export function HealthMilestonesCard() {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [milestones, setMilestones] = useState<ClinicalMilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      medicinesRepo.listMedicines(effectiveProfileId),
      reportsRepo.listReports(effectiveProfileId),
      visitsRepo.listVisits(effectiveProfileId),
      listBloodPressureReadings(effectiveProfileId),
      listGlucoseReadings(effectiveProfileId),
    ])
      .then(([_meds, reports, visits, bpLogs, glucoseLogs]) => {
        if (!isMounted) return;

        const items: ClinicalMilestoneItem[] = [];

        // 1. Blood Pressure Cadence
        const latestBp = bpLogs[0];
        if (latestBp) {
          items.push({
            id: 'milestone-bp',
            title: 'Blood Pressure Monitoring',
            status: 'completed',
            statusLabel: 'Logged Recently',
            dateNote: latestBp.measured_at ? `Last: ${formatDateShort(latestBp.measured_at)}` : 'Logged',
            category: 'Cardiovascular',
          });
        } else {
          items.push({
            id: 'milestone-bp',
            title: 'Baseline Blood Pressure Reading',
            status: 'due_soon',
            statusLabel: 'Due for Baseline',
            dateNote: 'Schedule home reading',
            category: 'Cardiovascular',
          });
        }

        // 2. Glycemic / Fasting Check
        const latestGlucose = glucoseLogs[0];
        if (latestGlucose) {
          items.push({
            id: 'milestone-glucose',
            title: 'Fasting Glycemic Check',
            status: 'on_track',
            statusLabel: 'On Track',
            dateNote: latestGlucose.measured_at ? `Last: ${formatDateShort(latestGlucose.measured_at)}` : 'On track',
            category: 'Endocrine',
          });
        } else {
          items.push({
            id: 'milestone-glucose',
            title: 'Fasting Glucose Baseline',
            status: 'due_soon',
            statusLabel: 'Recommended',
            dateNote: 'Morning fasting test',
            category: 'Endocrine',
          });
        }

        // 3. Clinical Follow-up Consultation
        const latestVisit = visits[0];
        items.push({
          id: 'milestone-visit',
          title: 'Physician Health Review',
          status: latestVisit ? 'on_track' : 'due_soon',
          statusLabel: latestVisit ? 'Documented' : 'Follow-up Due',
          dateNote: latestVisit?.visit_date ? `Review: ${formatDateShort(latestVisit.visit_date)}` : 'Consultation review',
          category: 'Clinical Follow-up',
        });

        // 4. Diagnostic Records Audit
        items.push({
          id: 'milestone-reports',
          title: 'Pathology & Lab Panel Audit',
          status: reports.length > 0 ? 'completed' : 'due_soon',
          statusLabel: reports.length > 0 ? `${reports.length} File${reports.length > 1 ? 's' : ''} on Record` : 'Upload Needed',
          dateNote: reports.length > 0 ? 'Diagnostic vault active' : 'Upload recent blood panel',
          category: 'Diagnostics',
        });

        setMilestones(items.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load clinical milestones:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-teal-600 dark:text-teal-400">
              <CalendarCheck size={16} />
            </span>
            <h2 className="text-xs font-bold text-content uppercase tracking-wider text-content-muted">
              Clinical Care Milestones
            </h2>
          </div>

          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
            <ShieldCheck size={11} />
            <span>Care Protocol</span>
          </span>
        </div>

        {/* ── Milestones List (Real clinical care tracks, zero gamification) ── */}
        {isLoading ? (
          <div className="space-y-2 py-1 animate-pulse">
            <div className="h-12 rounded-xl bg-surface-sunken" />
            <div className="h-12 rounded-xl bg-surface-sunken" />
          </div>
        ) : milestones.length > 0 ? (
          <div className="space-y-2.5">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-2xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-content-subtle">
                      {m.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-content truncate mt-0.5 text-xs">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-content-muted font-medium">
                    {m.dateNote}
                  </p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                    m.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : m.status === 'on_track'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {m.statusLabel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-2xs text-content-muted">Establishing care milestones...</p>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Routine preventative health roadmap</span>
        <Link to="/timeline" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
          <span>Roadmap</span>
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
