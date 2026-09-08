import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { listBloodPressureReadings } from '../../../lib/db/vitals';
import type { BloodPressureReading } from '../../../domain/vitals';
import { evaluateBloodPressure, calculateMap } from '../../../domain/vitals';
import { HeartPulseIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { Plus } from 'lucide-react';

interface BloodPressureTrendCardProps {
  onOpenLog?: () => void;
}

export function BloodPressureTrendCard({ onOpenLog }: BloodPressureTrendCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [bpLogs, setBpLogs] = useState<BloodPressureReading[]>([]);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;

    listBloodPressureReadings(effectiveProfileId)
      .then((data) => {
        if (!isMounted) return;
        setBpLogs(data);
      })
      .catch((err) => {
        console.error('Failed to load blood pressure readings:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  const latest = bpLogs[0] || null;
  const evaluation = latest ? evaluateBloodPressure(latest.systolic, latest.diastolic) : null;
  const mapValue = latest ? calculateMap(latest.systolic, latest.diastolic) : 93;

  // Last 7 readings chronological for sparkline
  const trendData = useMemo(() => {
    if (bpLogs.length === 0) {
      // Baseline mock trend points for demonstration when empty
      return [
        { sys: 122, dia: 82, label: 'Mon' },
        { sys: 120, dia: 80, label: 'Tue' },
        { sys: 124, dia: 83, label: 'Wed' },
        { sys: 119, dia: 79, label: 'Thu' },
        { sys: 121, dia: 80, label: 'Fri' },
        { sys: 118, dia: 78, label: 'Sat' },
        { sys: 120, dia: 80, label: 'Sun' },
      ];
    }
    return [...bpLogs.slice(0, 7)]
      .reverse()
      .map((r, idx) => ({
        sys: r.systolic,
        dia: r.diastolic,
        label: `R${idx + 1}`,
      }));
  }, [bpLogs]);

  // Compute SVG sparkline path
  const svgWidth = 320;
  const svgHeight = 70;
  const paddingY = 8;
  const minVal = 60;
  const maxVal = 160;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return svgHeight - paddingY - ((clamped - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return svgWidth / 2;
    return 10 + (index / (total - 1)) * (svgWidth - 20);
  };

  const systolicPoints = trendData.map((d, i) => `${getX(i, trendData.length)},${getY(d.sys)}`).join(' ');
  const diastolicPoints = trendData.map((d, i) => `${getX(i, trendData.length)},${getY(d.dia)}`).join(' ');

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-rose-500">
              <HeartPulseIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Blood Pressure Trend
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLog && (
              <button
                type="button"
                onClick={onOpenLog}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all active:scale-95"
                title="Log Blood Pressure"
              >
                <Plus size={12} className="stroke-[3]" />
                <span>Log BP</span>
              </button>
            )}

            <Link
              to="/vitals"
              className="p-1 text-content-subtle hover:text-content transition-colors"
              title="Full vitals tracker"
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
                {latest ? `${latest.systolic}/${latest.diastolic}` : '120/80'}
              </span>
              <span className="text-xs font-bold text-content-subtle">mmHg</span>
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
                {evaluation?.label || 'Optimal BP'}
              </span>
              <span className="text-2xs text-content-subtle font-medium">
                MAP: <strong className="text-content font-mono">{mapValue}</strong> mmHg
              </span>
            </div>
          </div>

          {latest?.pulse_bpm && (
            <div className="text-right">
              <span className="block text-xs font-semibold text-content-subtle">Pulse</span>
              <span className="text-base font-black text-content font-mono">{latest.pulse_bpm} bpm</span>
            </div>
          )}
        </div>

        {/* ── Trend Sparkline ───────────────────────────────────────── */}
        <div className="relative w-full rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 p-2 overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-content-subtle font-semibold px-1 mb-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Systolic
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
              Diastolic
            </span>
            <span>7-reading trend</span>
          </div>

          <svg className="w-full h-16 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            {/* Guide line for target systolic (120) */}
            <line
              x1="0"
              y1={getY(120)}
              x2={svgWidth}
              y2={getY(120)}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-line/60"
              strokeWidth="1"
            />
            {/* Systolic curve */}
            <polyline
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={systolicPoints}
            />
            {/* Diastolic curve */}
            <polyline
              fill="none"
              stroke="#0d9488"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={diastolicPoints}
            />
            {/* Systolic Dots */}
            {trendData.map((d, i) => (
              <circle
                key={`sys-${i}`}
                cx={getX(i, trendData.length)}
                cy={getY(d.sys)}
                r="3"
                className="fill-rose-500 stroke-white dark:stroke-ink-900"
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
        <span>Full Blood Pressure Analytics</span>
        <ChevronRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
