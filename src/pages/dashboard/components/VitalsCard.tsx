import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { listBloodPressureReadings, listGlucoseReadings } from '../../../lib/db/vitals';
import type { BloodPressureReading, GlucoseReading } from '../../../domain/vitals';
import { evaluateBloodPressure, evaluateGlucose } from '../../../domain/vitals';
import { HeartPulseIcon, DropletIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { Plus } from 'lucide-react';

interface VitalsCardProps {
  onOpenLog?: (type: 'glucose' | 'bp') => void;
}

export function VitalsCard({ onOpenLog }: VitalsCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [latestBp, setLatestBp] = useState<BloodPressureReading | null>(null);
  const [latestGlucose, setLatestGlucose] = useState<GlucoseReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      listBloodPressureReadings(effectiveProfileId),
      listGlucoseReadings(effectiveProfileId),
    ])
      .then(([bpList, glucoseList]) => {
        if (!isMounted) return;
        setLatestBp(bpList[0] || null);
        setLatestGlucose(glucoseList[0] || null);
      })
      .catch((err) => {
        console.error('Failed to load latest vitals for dashboard card:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  const bpEval = latestBp
    ? evaluateBloodPressure(latestBp.systolic, latestBp.diastolic)
    : null;

  const glucoseEval = latestGlucose
    ? evaluateGlucose(latestGlucose.value_mg_dl, latestGlucose.type)
    : null;

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-1.5">
            <span className="text-rose-500">
              <HeartPulseIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Vitals Tracker
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLog && (
              <button
                type="button"
                onClick={() => onOpenLog('bp')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold transition-all active:scale-95"
                title="Quick Log Vital"
              >
                <Plus size={12} className="stroke-[3]" />
                <span>Log</span>
              </button>
            )}

            <Link
              to="/vitals"
              className="p-1 text-content-subtle hover:text-content transition-colors"
              title="View all vitals"
            >
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>

        {/* ── Two Metric Tiles (BP + Glucose) ───────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5 animate-pulse">
            <div className="h-16 rounded-2xl bg-surface-sunken/60" />
            <div className="h-16 rounded-2xl bg-surface-sunken/60" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
          {/* Blood Pressure Tile */}
          <div className="p-2.5 rounded-2xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/50 hover:border-brand-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xs font-bold text-content-subtle uppercase tracking-wider flex items-center gap-1">
                <HeartPulseIcon size={11} className="text-rose-500" />
                BP
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  bpEval?.tone === 'ok'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : bpEval?.tone === 'warn'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : bpEval?.tone === 'risk' || bpEval?.tone === 'critical'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : 'bg-surface text-content-subtle'
                }`}
              >
                {bpEval?.label || 'Target 120/80'}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base sm:text-lg font-black text-content font-mono tracking-tight">
                {latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '120/80'}
              </span>
              <span className="text-[10px] text-content-subtle font-semibold">mmHg</span>
            </div>
          </div>

          {/* Blood Glucose Tile */}
          <div className="p-2.5 rounded-2xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/50 hover:border-brand-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xs font-bold text-content-subtle uppercase tracking-wider flex items-center gap-1">
                <DropletIcon size={11} className="text-amber-500" />
                Glucose
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  glucoseEval?.tone === 'ok'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : glucoseEval?.tone === 'warn'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : glucoseEval?.tone === 'risk' || glucoseEval?.tone === 'critical'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : 'bg-surface text-content-subtle'
                }`}
              >
                {glucoseEval?.label || 'Fasting Normal'}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base sm:text-lg font-black text-content font-mono tracking-tight">
                {latestGlucose ? latestGlucose.value_mg_dl : '98'}
              </span>
              <span className="text-[10px] text-content-subtle font-semibold">mg/dL</span>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-line/40 text-2xs text-content-subtle">
        <span>{latestBp ? 'Logged recently' : 'Typical baseline'}</span>
        <Link
          to="/vitals"
          className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-0.5"
        >
          <span>Trends</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </div>
  );
}
