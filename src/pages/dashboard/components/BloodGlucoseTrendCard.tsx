import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { listGlucoseReadings } from '../../../lib/db/vitals';
import type { GlucoseReading } from '../../../domain/vitals';
import { evaluateGlucose, mgDlToMmol } from '../../../domain/vitals';
import { DropletIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { Plus } from 'lucide-react';
import { formatDateShort } from '../../../lib/time';

interface BloodGlucoseTrendCardProps {
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

export function BloodGlucoseTrendCard({ onOpenLog }: BloodGlucoseTrendCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    listGlucoseReadings(effectiveProfileId)
      .then((data) => {
        if (!isMounted) return;
        setGlucoseLogs(data);
      })
      .catch((err) => {
        console.error('Failed to load glucose readings:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  const latest = glucoseLogs[0] || null;
  const evaluation = latest ? evaluateGlucose(latest.value_mg_dl, latest.type) : null;
  const mmolValue = latest ? mgDlToMmol(latest.value_mg_dl) : null;

  // Last 8 readings chronological (strictly real data)
  const trendData = useMemo(() => {
    if (glucoseLogs.length === 0) return [];
    return [...glucoseLogs.slice(0, 8)]
      .reverse()
      .map((r, idx) => ({
        val: r.value_mg_dl,
        type: r.type,
        date: r.measured_at,
        label: `R${idx + 1}`,
      }));
  }, [glucoseLogs]);

  // Chart dimensions & scaling
  const svgWidth = 400;
  const svgHeight = 110;
  const paddingX = 16;
  const paddingY = 12;
  const minVal = 50;
  const maxVal = 240;

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

  const glucosePoints = useMemo(
    () => trendData.map((d, i) => ({ x: getX(i, trendData.length), y: getY(d.val) })),
    [trendData]
  );

  const glucoseSpline = useMemo(() => createSmoothPath(glucosePoints), [glucosePoints]);
  const glucoseArea = useMemo(
    () => createAreaPath(glucosePoints, svgHeight),
    [glucosePoints, svgHeight]
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
    ? evaluateGlucose(activeHoverReading.val, activeHoverReading.type)
    : null;
  const activeHoverMmol = activeHoverReading ? mgDlToMmol(activeHoverReading.val) : null;

  const currentType = activeHoverReading ? activeHoverReading.type : latest?.type || 'fasting';
  const isFasting = currentType === 'fasting';

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-6 shadow-card hover:shadow-raise transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-line/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <DropletIcon size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted">
                Blood Glucose
              </h2>
              <p className="text-xs font-semibold text-content">
                Daily Glycemic Tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLog && (
              <button
                type="button"
                onClick={onOpenLog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="Log Glucose"
              >
                <Plus size={13} className="stroke-[3]" />
                <span>Log Glucose</span>
              </button>
            )}

            <Link
              to="/vitals"
              className="p-1.5 rounded-xl text-content-subtle hover:text-content hover:bg-surface-sunken transition-colors"
              title="Full glucose tracker"
            >
              <ChevronRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* ── Content Area: Loading / Empty / Data ─────────────────── */}
        {isLoading ? (
          <div className="py-8 space-y-3 animate-pulse">
            <div className="h-8 w-32 rounded-xl bg-surface-sunken" />
            <div className="h-28 w-full rounded-2xl bg-surface-sunken" />
          </div>
        ) : glucoseLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-2xl bg-surface-sunken/40 border border-line/40 my-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2.5">
              <DropletIcon size={24} />
            </div>
            <h3 className="text-sm font-bold text-content">No Blood Glucose Recorded</h3>
            <p className="text-xs text-content-muted mt-1 max-w-xs leading-relaxed">
              Keep track of your blood sugar before and after meals to stay in a healthy range.
            </p>
            {onOpenLog && (
              <button
                type="button"
                onClick={onOpenLog}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>Log First Reading</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Active Metrics / HUD Strip ───────────────────────────── */}
            <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-content font-mono tracking-tight">
                    {activeHoverReading ? activeHoverReading.val : latest?.value_mg_dl}
                  </span>
                  <span className="text-xs font-bold text-content-subtle">mg/dL</span>
                  <span className="text-xs font-mono font-medium text-content-subtle ml-1">
                    ({activeHoverMmol !== null ? activeHoverMmol : mmolValue} mmol/L)
                  </span>
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

                  <span className="text-2xs text-content-subtle font-medium capitalize">
                    {currentType === 'fasting' ? 'Fasting' : currentType === 'post_prandial' ? 'Post-Meal' : 'Random'}
                  </span>

                  {activeHoverReading?.date && (
                    <span className="text-2xs text-content-subtle font-mono">
                      · {formatDateShort(activeHoverReading.date)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="block text-2xs font-bold uppercase tracking-wider text-content-subtle">
                  {isFasting ? 'Fasting Target' : 'Post-Meal Target'}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {isFasting ? '70–99 mg/dL' : '< 140 mg/dL'}
                </span>
              </div>
            </div>

            {/* ── Spline Canvas ────────────────────────────────────────── */}
            <div className="relative w-full rounded-2xl bg-surface-sunken/60 dark:bg-ink-950/40 border border-line/50 p-3 pt-2 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-content-subtle font-semibold mb-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="w-2.5 h-1 rounded-full bg-amber-500" />
                    Glucose Curve
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600/80 dark:text-emerald-400/80">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500/20 border border-emerald-500/40" />
                    Target ({isFasting ? '70–99' : '70–130'})
                  </span>
                </div>
                <span className="text-2xs font-mono text-content-subtle">
                  {hoverIndex !== null
                    ? `Reading ${hoverIndex + 1} of ${trendData.length}`
                    : `${trendData.length} records`}
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
                    <linearGradient id="glucoseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Target Ribbon (70 to 100 mg/dL for fasting, 70-130 for post-meal) */}
                  <rect
                    x={paddingX}
                    y={getY(isFasting ? 100 : 130)}
                    width={svgWidth - 2 * paddingX}
                    height={Math.max(2, getY(70) - getY(isFasting ? 100 : 130))}
                    fill="#10b981"
                    fillOpacity="0.08"
                    rx="4"
                  />

                  {/* Ceiling Line */}
                  <line
                    x1={paddingX}
                    y1={getY(isFasting ? 100 : 130)}
                    x2={svgWidth - paddingX}
                    y2={getY(isFasting ? 100 : 130)}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-emerald-500/40"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX + 2}
                    y={getY(isFasting ? 100 : 130) - 3}
                    fill="currentColor"
                    className="text-[8px] font-mono fill-emerald-600/70 dark:fill-emerald-400/70"
                  >
                    {isFasting ? '100 mg/dL Fasting Ceiling' : '130 mg/dL Target Ceiling'}
                  </text>

                  {/* Floor Line */}
                  <line
                    x1={paddingX}
                    y1={getY(70)}
                    x2={svgWidth - paddingX}
                    y2={getY(70)}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-line-strong/30"
                    strokeWidth="0.8"
                  />
                  <text
                    x={paddingX + 2}
                    y={getY(70) + 9}
                    fill="currentColor"
                    className="text-[8px] font-mono fill-content-subtle"
                  >
                    70 Glycemic Floor
                  </text>

                  {/* Area fill */}
                  {glucoseArea && (
                    <path
                      d={glucoseArea}
                      fill="url(#glucoseAreaGradient)"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Continuous Hermite / Bezier Curve */}
                  {glucoseSpline && (
                    <path
                      d={glucoseSpline}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />
                  )}

                  {/* Knot Points */}
                  {glucosePoints.map((pt, idx) => {
                    const isHovered = hoverIndex === idx;
                    const isCurrent = idx === glucosePoints.length - 1;
                    return (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5.5 : isCurrent ? 4 : 2.5}
                        fill={isHovered ? '#b45309' : '#f59e0b'}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2 : 1.5}
                        className="transition-all duration-150"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="pt-3 mt-4 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Fasting normal: 70–99 · Pre-diabetes: 100–125</span>
        <Link
          to="/vitals"
          className="font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
        >
          <span>Analytics</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </div>
  );
}
