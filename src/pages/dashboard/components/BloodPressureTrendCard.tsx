import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { listBloodPressureReadings } from '../../../lib/db/vitals';
import type { BloodPressureReading } from '../../../domain/vitals';
import { evaluateBloodPressure } from '../../../domain/vitals';
import { HeartPulseIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { Plus, Activity } from 'lucide-react';
import { formatDateShort } from '../../../lib/time';

interface BloodPressureTrendCardProps {
  onOpenLog?: () => void;
}

function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1]! : points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = i < points.length - 2 ? points[i + 2]! : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

function createAreaPath(points: { x: number; y: number }[], height: number): string {
  if (points.length < 2) return '';
  const curve = createSmoothPath(points);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${curve} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;
}

export function BloodPressureTrendCard({ onOpenLog }: BloodPressureTrendCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [bpLogs, setBpLogs] = useState<BloodPressureReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    listBloodPressureReadings(effectiveProfileId)
      .then((data) => {
        if (!isMounted) return;
        setBpLogs(data);
      })
      .catch((err) => {
        console.error('Failed to load blood pressure readings:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  const latest = bpLogs[0] || null;
  const evaluation = latest ? evaluateBloodPressure(latest.systolic, latest.diastolic) : null;

  // Last 7 readings chronological (strictly real data)
  const trendData = useMemo(() => {
    if (bpLogs.length === 0) return [];
    return [...bpLogs.slice(0, 8)]
      .reverse()
      .map((r, idx) => ({
        sys: r.systolic,
        dia: r.diastolic,
        pulse: r.pulse_bpm,
        date: r.measured_at,
        label: `R${idx + 1}`,
      }));
  }, [bpLogs]);

  // Chart dimensions & scaling
  const svgWidth = 400;
  const svgHeight = 110;
  const paddingX = 16;
  const paddingY = 12;
  const minVal = 55;
  const maxVal = 175;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return (
      svgHeight -
      paddingY -
      ((clamped - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY)
    );
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return svgWidth / 2;
    return paddingX + (index / (total - 1)) * (svgWidth - 2 * paddingX);
  };

  const systolicPoints = useMemo(
    () => trendData.map((d, i) => ({ x: getX(i, trendData.length), y: getY(d.sys) })),
    [trendData]
  );

  const diastolicPoints = useMemo(
    () => trendData.map((d, i) => ({ x: getX(i, trendData.length), y: getY(d.dia) })),
    [trendData]
  );

  const systolicSpline = useMemo(() => createSmoothPath(systolicPoints), [systolicPoints]);
  const diastolicSpline = useMemo(() => createSmoothPath(diastolicPoints), [diastolicPoints]);
  const systolicArea = useMemo(
    () => createAreaPath(systolicPoints, svgHeight),
    [systolicPoints, svgHeight]
  );

  // Pointer event for interactive scrubber
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || trendData.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - paddingX) / (rect.width - 2 * paddingX)));
    const targetIdx = Math.round(ratio * (trendData.length - 1));
    setHoverIndex(targetIdx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const activeHoverReading = hoverIndex !== null ? trendData[hoverIndex] : null;
  const activeHoverEval = activeHoverReading
    ? evaluateBloodPressure(activeHoverReading.sys, activeHoverReading.dia)
    : null;

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-6 shadow-card hover:shadow-raise transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-line/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <HeartPulseIcon size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted">
                Blood Pressure
              </h2>
              <p className="text-xs font-semibold text-content">
                Systolic, Diastolic &amp; Pulse
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLog && (
              <button
                type="button"
                onClick={onOpenLog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="Log Blood Pressure"
              >
                <Plus size={13} className="stroke-[3]" />
                <span>Log BP</span>
              </button>
            )}

            <Link
              to="/vitals"
              className="p-1.5 rounded-xl text-content-subtle hover:text-content hover:bg-surface-sunken transition-colors"
              title="Full vitals analytics"
            >
              <ChevronRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* ── Content Area: Loading / Empty / Data ─────────────────── */}
        {isLoading ? (
          <div className="py-8 space-y-3 animate-pulse">
            <div className="h-8 w-36 rounded-xl bg-surface-sunken" />
            <div className="h-28 w-full rounded-2xl bg-surface-sunken" />
          </div>
        ) : bpLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-2xl bg-surface-sunken/40 border border-line/40 my-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2.5">
              <HeartPulseIcon size={24} />
            </div>
            <h3 className="text-sm font-bold text-content">No Blood Pressure Recorded</h3>
            <p className="text-xs text-content-muted mt-1 max-w-xs leading-relaxed">
              Log your daily blood pressure readings to keep track of your heart health over time.
            </p>
            {onOpenLog && (
              <button
                type="button"
                onClick={onOpenLog}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>Log First Reading</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Active Metrics Strip ───────────────────────────────── */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-content font-mono tracking-tight">
                    {activeHoverReading
                      ? `${activeHoverReading.sys}/${activeHoverReading.dia}`
                      : `${latest?.systolic}/${latest?.diastolic}`}
                  </span>
                  <span className="text-xs font-bold text-content-subtle">mmHg</span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                      (activeHoverEval || evaluation)?.tone === 'ok'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : (activeHoverEval || evaluation)?.tone === 'warn'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {(activeHoverEval || evaluation)?.label || 'Recorded'}
                  </span>

                  {activeHoverReading?.date ? (
                    <span className="text-2xs text-content-subtle font-mono">
                      · {formatDateShort(activeHoverReading.date)}
                    </span>
                  ) : latest?.measured_at ? (
                    <span className="text-2xs text-content-subtle font-mono">
                      · {formatDateShort(latest.measured_at)}
                    </span>
                  ) : null}
                </div>
              </div>

              {(activeHoverReading?.pulse || latest?.pulse_bpm) && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-content-subtle justify-end">
                    <Activity size={12} className="text-rose-500" />
                    <span className="text-2xs font-bold uppercase tracking-wider">Pulse</span>
                  </div>
                  <span className="text-lg font-black text-content font-mono">
                    {activeHoverReading?.pulse || latest?.pulse_bpm} <span className="text-xs font-normal text-content-subtle">bpm</span>
                  </span>
                </div>
              )}
            </div>

            {/* ── Bloomberg-Grade Bezier Spline SVG Canvas ─────────────── */}
            <div className="relative w-full rounded-2xl bg-surface-sunken/60 dark:bg-ink-950/40 border border-line/50 p-3 pt-2 overflow-hidden">
              {/* Spline Legend & Readout */}
              <div className="flex items-center justify-between text-[11px] text-content-subtle font-semibold mb-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="w-2.5 h-1 rounded-full bg-rose-500" />
                    Systolic
                  </span>
                  <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                    <span className="w-2.5 h-1 rounded-full bg-teal-500" />
                    Diastolic
                  </span>
                </div>
                <span className="text-2xs font-mono text-content-subtle">
                  {hoverIndex !== null
                    ? `Reading ${hoverIndex + 1} of ${trendData.length}`
                    : `${trendData.length} records · Hover to scrub`}
                </span>
              </div>

              <div className="relative cursor-crosshair">
                <svg
                  ref={svgRef}
                  className="w-full h-28 overflow-visible select-none"
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  preserveAspectRatio="none"
                  onPointerMove={handlePointerMove}
                  onPointerLeave={handlePointerLeave}
                >
                  <defs>
                    {/* Glowing Area Gradient for Systolic */}
                    <linearGradient id="sysAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                      <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Gradient for Diastolic */}
                    <linearGradient id="diaAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Target Reference Line: Normal Systolic Ceiling (120 mmHg) */}
                  <line
                    x1={paddingX}
                    y1={getY(120)}
                    x2={svgWidth - paddingX}
                    y2={getY(120)}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-emerald-500/40"
                    strokeWidth="1.2"
                  />
                  <text
                    x={paddingX + 2}
                    y={getY(120) - 3}
                    fill="currentColor"
                    className="text-[8px] font-mono fill-emerald-600/70 dark:fill-emerald-400/70"
                  >
                    120 Normal Target
                  </text>

                  {/* Target Reference Line: Normal Diastolic Ceiling (80 mmHg) */}
                  <line
                    x1={paddingX}
                    y1={getY(80)}
                    x2={svgWidth - paddingX}
                    y2={getY(80)}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-teal-500/30"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX + 2}
                    y={getY(80) - 3}
                    fill="currentColor"
                    className="text-[8px] font-mono fill-teal-600/60 dark:fill-teal-400/60"
                  >
                    80 Diastolic
                  </text>

                  {/* Area Fill */}
                  {trendData.length > 1 && (
                    <path d={systolicArea} fill="url(#sysAreaGradient)" />
                  )}

                  {/* Systolic Bezier Spline */}
                  {trendData.length > 1 && (
                    <path
                      d={systolicSpline}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Diastolic Bezier Spline */}
                  {trendData.length > 1 && (
                    <path
                      d={diastolicSpline}
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {trendData.map((d, i) => {
                    const isHovered = hoverIndex === i;
                    const x = getX(i, trendData.length);
                    return (
                      <g key={`bp-dot-${i}`}>
                        <circle
                          cx={x}
                          cy={getY(d.sys)}
                          r={isHovered ? 5 : 3.5}
                          className="fill-rose-500 stroke-surface transition-all duration-150"
                          strokeWidth="2"
                        />
                        <circle
                          cx={x}
                          cy={getY(d.dia)}
                          r={isHovered ? 4.5 : 3}
                          className="fill-teal-500 stroke-surface transition-all duration-150"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}

                  {/* Interactive Cursor Scrubber Line */}
                  {hoverIndex !== null && (
                    <g>
                      <line
                        x1={getX(hoverIndex, trendData.length)}
                        y1={paddingY}
                        x2={getX(hoverIndex, trendData.length)}
                        y2={svgHeight - paddingY}
                        stroke="#f43f5e"
                        strokeDasharray="2 2"
                        strokeWidth="1.5"
                        className="opacity-70"
                      />
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer Link ───────────────────────────────────────────── */}
      <Link
        to="/vitals"
        className="inline-flex items-center justify-between pt-3 mt-4 border-t border-line/40 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 group"
      >
        <span>Full Blood Pressure Analytics &amp; Log History</span>
        <ChevronRightIcon size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
