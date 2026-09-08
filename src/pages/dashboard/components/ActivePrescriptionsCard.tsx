import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { medicinesRepo } from '../../../lib/db';
import type { Medicine } from '../../../lib/db/medicines';
import { activeMedicines } from '../../../domain/activeMedicines';
import { todayInAppTz } from '../../../lib/time';
import { CapsuleIcon, ChevronRightIcon } from '../../../components/ui/icons';

export function ActivePrescriptionsCard() {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [activeMeds, setActiveMeds] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    medicinesRepo
      .listMedicines(effectiveProfileId)
      .then((meds) => {
        if (!isMounted) return;
        const currentActive = activeMedicines(meds, todayInAppTz());
        setActiveMeds(currentActive.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load active medicines for card:', err);
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
              <CapsuleIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Active Prescriptions
            </h2>
          </div>

          <Link
            to="/medicines"
            className="text-2xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            <span>All Courses</span>
            <ChevronRightIcon size={13} />
          </Link>
        </div>

        {/* ── Meds List ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5 py-1 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 rounded-2xl bg-surface-sunken" />
            ))}
          </div>
        ) : activeMeds.length > 0 ? (
          <div className="space-y-2.5">
            {activeMeds.map((med) => (
              <div
                key={med.id}
                className="p-2.5 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                    <CapsuleIcon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-content truncate leading-tight">
                        {med.medicine_name}
                      </h4>
                      {med.strength && (
                        <span className="px-1.5 py-0.2 rounded-md bg-surface text-[10px] font-semibold text-content-subtle shrink-0">
                          {med.strength}
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-content-subtle truncate mt-0.5">
                      {med.frequency_raw || med.frequency_code || 'Daily'} · {med.with_food ? 'With food' : 'Standard'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    {med.is_ongoing ? 'Ongoing' : med.duration_days ? `${med.duration_days}d course` : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-content-muted">No active prescriptions currently</p>
            <Link
              to="/prescriptions/new"
              className="inline-block mt-1 text-2xs font-bold text-brand-600 hover:underline"
            >
              + Upload Prescription
            </Link>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Verified drug schedules</span>
        <Link to="/medicines" className="font-bold text-brand-600 hover:underline">
          Cabinet &rarr;
        </Link>
      </div>
    </div>
  );
}
