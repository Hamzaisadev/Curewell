import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Stethoscope, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { visitsRepo, medicinesRepo } from '../../../lib/db';
import type { Visit } from '../../../lib/db/visits';
import type { Medicine } from '../../../lib/db/medicines';
import { readInventory } from '../../../lib/inventory';
import { formatDateMedium, todayInAppTz } from '../../../lib/time';

interface UpNextCardProps {
  className?: string;
  refreshKey?: number;
}

export function UpNextCard({ className = '', refreshKey = 0 }: UpNextCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      visitsRepo.listVisits(effectiveProfileId),
      medicinesRepo.listMedicines(effectiveProfileId),
    ])
      .then(([vList, mList]) => {
        if (!isMounted) return;
        setVisits(vList);
        setMedicines(mList.filter((m) => !m.discontinued_at));
      })
      .catch((err) => {
        console.error('Failed to load upcoming events for UpNextCard:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId, refreshKey]);

  const { lowStockMeds, nextVisit } = useMemo(() => {
    const inventory = effectiveProfileId ? readInventory(effectiveProfileId) : {};
    const today = todayInAppTz();

    // Medicines with <= 7 doses remaining
    const lowStock = medicines
      .map((med) => ({
        ...med,
        remainingDoses: typeof inventory[med.id] === 'number' ? inventory[med.id]! : null,
      }))
      .filter((m) => m.remainingDoses !== null && m.remainingDoses <= 7);

    // Look for upcoming visit (visit_date >= today)
    const upcomingVisits = visits.filter((v) => v.visit_date && v.visit_date >= today);
    const sortedUpcoming = [...upcomingVisits].sort((a, b) =>
      (a.visit_date || '').localeCompare(b.visit_date || '')
    );

    const targetVisit = sortedUpcoming[0] || visits[0] || null;

    return {
      lowStockMeds: lowStock,
      nextVisit: targetVisit,
    };
  }, [medicines, visits, effectiveProfileId]);

  const hasEvents = lowStockMeds.length > 0 || nextVisit !== null;

  return (
    <div
      className={`bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-300 ${className}`}
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-line/50">
        <div className="flex items-center gap-2">
          <span className="text-brand-600 dark:text-brand-400">
            <Calendar size={16} />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted">
            Coming Up
          </h2>
        </div>

        <Link
          to="/visits"
          className="text-2xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5 hover:underline"
        >
          <span>All Visits</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2 py-1 animate-pulse">
          <div className="h-14 rounded-2xl bg-surface-sunken" />
        </div>
      ) : !hasEvents ? (
        <div className="py-4 px-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
          <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-content">You&apos;re All Set</p>
          <p className="text-2xs text-content-muted mt-0.5">
            No upcoming appointments or medicine refills needed right now.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Low Medicine Refill Warning (if any) */}
          {lowStockMeds.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-content truncate">
                    Refill {lowStockMeds[0]?.medicine_name}
                  </p>
                  <p className="text-2xs text-amber-700 dark:text-amber-300 font-medium">
                    {lowStockMeds[0]?.remainingDoses === 0
                      ? 'Out of doses'
                      : `${lowStockMeds[0]?.remainingDoses} doses remaining`}
                  </p>
                </div>
              </div>

              <Link
                to="/medicines"
                className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-2xs transition-all active:scale-95"
              >
                Refill
              </Link>
            </div>
          )}

          {/* Next Doctor Visit (if any) */}
          {nextVisit && (
            <div className="p-3 rounded-2xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <Stethoscope size={15} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-content truncate">
                    {nextVisit.doctor_name
                      ? nextVisit.doctor_name.startsWith('Dr.')
                        ? nextVisit.doctor_name
                        : `Dr. ${nextVisit.doctor_name}`
                      : nextVisit.clinic_name || 'Doctor Appointment'}
                  </p>
                  <p className="text-2xs text-content-muted truncate">
                    {nextVisit.diagnosis || 'Routine Follow-up'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-2xs font-bold text-content block">
                  {formatDateMedium(nextVisit.visit_date)}
                </span>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                  Scheduled
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="pt-2.5 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Upcoming appointments &amp; supplies</span>
        <Link to="/timeline" className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline">
          Full Timeline &rarr;
        </Link>
      </div>
    </div>
  );
}
