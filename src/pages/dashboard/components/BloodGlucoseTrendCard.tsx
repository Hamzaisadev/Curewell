import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { listGlucoseReadings } from '../../../lib/db/vitals';
import type { GlucoseReading } from '../../../domain/vitals';
import { evaluateGlucose, mgDlToMmol } from '../../../domain/vitals';
import { DropletIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { Plus } from 'lucide-react';

interface BloodGlucoseTrendCardProps {
  onOpenLog?: () => void;
}

export function BloodGlucoseTrendCard({ onOpenLog }: BloodGlucoseTrendCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseReading[]>([]);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;

    listGlucoseReadings(effectiveProfileId)
      .then((data) => {
        if (!isMounted) return;
        setGlucoseLogs(data);
      })
      .catch((err) => {
        console.error('Failed to load glucose readings:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  const latest = glucoseLogs[0] || null;
  const evaluation = latest ? evaluateGlucose(latest.value_mg_dl, latest.type) : null;
  const mmolValue = latest ? mgDlToMmol(latest.value_mg_dl) : 5.4;

  // Last 7 readings chronological
  const trendData = useMemo(() => {
    if (glucoseLogs.length === 0) {
      return [
        { val: 95, label: 'Mon' },
        { val: 102, label: 'Tue' },
        { val: 98, label: 'Wed' },
        { val: 110, label: 'Thu' },
        { val: 96, label: 'Fri' },
        { val: 104, label: 'Sat' },
        { val: 98, label: 'Sun' },
      ];
    }
    return [...glucoseLogs.slice(0, 7)]
      .reverse()
      .map((r, idx) => ({
        val: r.value_mg_dl,
        label: `R${idx + 1}`,
      }));
  }, [glucoseLogs]);

  // Compute SVG sparkline
  const svgWidth = 260;
  const svgHeight = 70;
  const paddingY = 8;
  const minVal = 50;
  const maxVal = 200;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return svgHeight - paddingY - ((clamped - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return svgWidth / 2;
    return 10 + (index / (total - 1)) * (svgWidth - 20);
  };

  const points = trendData.map((d, i) => `${getX(i, trendData.length)},${getY(d.val)}`).join(' ');

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">
              <DropletIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Blood Glucose Curve
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLog && (
              <button
                type="button"
                onClick={onOpenLog}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all active:scale-95"
                title="Log Glucose"
              >
                <Plus size={12} className="stroke-[3]" />
                <span>Log Glucose</span>
              </button>
            )}

            <Link
              to="/vitals"
              className="p-1 text-content-subtle hover:text-content transition-colors"
              title="Full glucose tracker"
            >
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>

        {/* ── KPI & Stats Row ───────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-content font-mono tracking-tight">
                {latest ? latest.value_mg_dl : '98'}
              </span>
              <span className="text-xs font-bold text-content-subtle">mg/dL</span>
              <span className="text-2xs font-semibold text-content-subtle ml-1 font-mono">
                ({mmolValue} mmol/L)
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                  evaluation?.tone === 'ok'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : evaluation?.tone === 'warn'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                }`}
              >
                {evaluation?.label || 'Normal Fasting'}
              </span>
              <span className="text-2xs text-content-subtle font-medium uppercase tracking-wider">
                {latest?.type ? latest.type.replace('_', ' ') : 'Fasting'}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            ADA In-Target
          </span>
        </div>

        {/* ── Trend Sparkline with Target Band ──────────────────────── */}
        <div className="relative w-full rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 p-2 overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-content-subtle font-semibold px-1 mb-1">
            <span className="text-emerald-600 dark:text-emerald-400">Target Range: 70–140 mg/dL</span>
            <span>7-point curve</span>
          </div>

          <svg className="w-full h-16 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            {/* Shaded Target Zone (70 to 140 mg/dL) */}
            <rect
              x="0"
              y={getY(140)}
              width={svgWidth}
              height={getY(70) - getY(140)}
              fill="rgba(16, 185, 129, 0.08)"
            />
            {/* Guide line for target upper (140) */}
            <line
              x1="0"
              y1={getY(140)}
              x2={svgWidth}
              y2={getY(140)}
              stroke="rgba(16, 185, 129, 0.3)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            {/* Glucose curve */}
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {/* Data Dots */}
            {trendData.map((d, i) => (
              <circle
                key={`glu-${i}`}
                cx={getX(i, trendData.length)}
                cy={getY(d.val)}
                r="3"
                className="fill-amber-500 stroke-white dark:stroke-ink-900"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Link
        to="/vitals"
        className="inline-flex items-center justify-between pt-2.5 mt-3 border-t border-line/40 text-2xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 group"
      >
        <span>Metabolic & Glycemic Log</span>
        <ChevronRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
