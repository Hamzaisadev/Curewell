import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { medicinesRepo } from '../../../lib/db';
import type { Medicine } from '../../../lib/db/medicines';
import { readInventory } from '../../../lib/inventory';
import { CabinetIcon, ChevronRightIcon } from '../../../components/ui/icons';

interface CabinetSummaryCardProps {
  className?: string;
}

export function CabinetSummaryCard({ className = '' }: CabinetSummaryCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [activeMeds, setActiveMeds] = useState<Medicine[]>([]);
  const [totalPills, setTotalPills] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;

    medicinesRepo
      .listMedicines(effectiveProfileId)
      .then((meds) => {
        if (!isMounted) return;
        const active = meds.filter((m) => !m.discontinued_at);
        setActiveMeds(active);

        const inventory = readInventory(effectiveProfileId);
        let count = 0;
        let lowCount = 0;

        for (const m of active) {
          const invVal = inventory[m.id];
          if (typeof invVal === 'number') {
            count += invVal;
            if (invVal <= 5) lowCount += 1;
          } else {
            // Default assumed 15 doses if not explicitly set
            count += 15;
          }
        }

        setTotalPills(count);
        setLowStockCount(lowCount);
      })
      .catch((err) => {
        console.error('Failed to load medicine cabinet summary:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  const ongoingCount = useMemo(
    () => activeMeds.filter((m) => m.is_ongoing).length,
    [activeMeds]
  );
  const acuteCount = activeMeds.length - ongoingCount;

  // Approximate days of supply remaining (assuming average 2 doses per medication per day)
  const coverageDays = useMemo(() => {
    if (activeMeds.length === 0) return 0;
    const dailyDoseEst = Math.max(1, activeMeds.length * 2);
    return Math.max(1, Math.round(totalPills / dailyDoseEst));
  }, [activeMeds.length, totalPills]);

  return (
    <div
      className={`bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-teal-600 dark:text-teal-400">
              <CabinetIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Medicine Cabinet &amp; Inventory
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {lowStockCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold tracking-wide">
                ⚠️ {lowStockCount} Low
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold tracking-wide">
                ✓ Supply Stocked
              </span>
            )}
            <Link
              to="/medicines"
              className="p-1 text-content-subtle hover:text-content transition-colors"
              title="Open Medicine Cabinet"
            >
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>

        {/* ── Inventory Metric Pillars ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-1">
          {/* Pillar 1: Total Active Formulations */}
          <div className="p-3 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-content font-mono tracking-tight">
                {activeMeds.length}
              </span>
              <span className="text-2xs font-bold text-content-subtle uppercase tracking-wider">
                {activeMeds.length === 1 ? 'Med' : 'Meds'}
              </span>
            </div>
            <p className="text-2xs text-content-muted mt-1 truncate">
              {ongoingCount} ongoing · {acuteCount} acute
            </p>
          </div>

          {/* Pillar 2: Total Doses Remaining */}
          <div className="p-3 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-content font-mono tracking-tight">
                ~{totalPills}
              </span>
              <span className="text-2xs font-bold text-content-subtle uppercase tracking-wider">
                Doses
              </span>
            </div>
            <p className="text-2xs text-content-muted mt-1 truncate">
              Est. ~{coverageDays}d supply coverage
            </p>
          </div>

          {/* Pillar 3: Refill Health */}
          <div className="p-3 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-content tracking-tight">
                {lowStockCount === 0 ? 'Optimal' : `${lowStockCount} Refill${lowStockCount > 1 ? 's' : ''}`}
              </span>
            </div>
            <p className="text-2xs text-content-muted mt-1 truncate">
              {lowStockCount === 0 ? 'No urgent shortage' : 'Need pharmacy restock'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer Link ───────────────────────────────────────────── */}
      <div className="pt-2.5 mt-3 border-t border-line/40 flex items-center justify-between text-2xs">
        <span className="text-content-subtle">Track batch, expiry &amp; pill reserve</span>
        <Link
          to="/medicines"
          className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5 group"
        >
          <span>Manage Cabinet &amp; Refills</span>
          <ChevronRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
