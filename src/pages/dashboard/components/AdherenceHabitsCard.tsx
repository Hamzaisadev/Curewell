import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { dosesRepo } from '../../../lib/db';
import type { Dose } from '../../../lib/db/doses';
import { calculateAdherence, calculateLoggingStreak, type EffectiveDose } from '../../../domain/adherence';
import { todayInAppTz, addDaysAppTz } from '../../../lib/time';
import { FlameIcon, ChevronRightIcon, DropletIcon } from '../../../components/ui/icons';
import { Check, Plus, Activity, Flame } from 'lucide-react';

const WATER_STORAGE_KEY = 'curewell_water_intake_';

interface AdherenceHabitsCardProps {
  className?: string;
  refreshKey?: number;
}

export function AdherenceHabitsCard({ className = '', refreshKey = 0 }: AdherenceHabitsCardProps) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [doses, setDoses] = useState<Dose[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(5);

  const today = todayInAppTz();

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;

    const streakPastDate = addDaysAppTz(today, -30);
    const tomorrow = addDaysAppTz(today, 1);

    dosesRepo
      .listDosesForRange(effectiveProfileId, streakPastDate, tomorrow)
      .then((dosesList) => {
        if (!isMounted) return;
        setDoses(dosesList);
      })
      .catch((err) => {
        console.error('Failed to load doses for adherence card:', err);
      });

    // Load water tracker from local storage for today
    try {
      const stored = localStorage.getItem(`${WATER_STORAGE_KEY}${effectiveProfileId}_${today}`);
      if (stored) setWaterGlasses(parseInt(stored, 10));
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId, today, refreshKey]);

  const handleAddWater = () => {
    const next = Math.min(12, waterGlasses + 1);
    setWaterGlasses(next);
    try {
      localStorage.setItem(`${WATER_STORAGE_KEY}${effectiveProfileId}_${today}`, String(next));
    } catch {
      // ignore
    }
  };

  const {
    takenCount,
    totalTodayCount,
    adherencePercent,
    streakDays,
    hasData,
    skipReasonText,
  } = useMemo(() => {
    const todayDoses = doses.filter((d) => d.scheduled_date === today);
    const total = todayDoses.length;
    const stats = calculateAdherence(doses, { from: today, to: today }, new Date());

    const hasDataToday = total > 0;
    // ADR 0001: Zero-dose state must be N/A, never a false 100%
    const percent = hasDataToday
      ? (stats.scheduled === 0 ? 100 : stats.percentage)
      : null;

    // Projected dose mapping for Two-Tier habit streak calculation
    const projectedList = doses.map((d) => ({
      id: d.id,
      medicineId: d.medicine_id,
      medicine_id: d.medicine_id,
      scheduledDate: d.scheduled_date,
      scheduled_date: d.scheduled_date,
      scheduledMinutes: d.scheduled_minutes,
      scheduled_minutes: d.scheduled_minutes,
      bucket: 'morning' as const,
      status: d.status,
      takenAt: d.taken_at,
      taken_at: d.taken_at,
      skipReason:
        (d as unknown as { skipped_reason?: string }).skipped_reason ||
        (d as unknown as { skip_reason?: string }).skip_reason ||
        null,
      skip_reason:
        (d as unknown as { skipped_reason?: string }).skipped_reason ||
        (d as unknown as { skip_reason?: string }).skip_reason ||
        null,
      isPrn: Boolean((d as unknown as { is_prn?: boolean }).is_prn),
      is_prn: Boolean((d as unknown as { is_prn?: boolean }).is_prn),
    }));

    const streak = calculateLoggingStreak(projectedList as unknown as EffectiveDose[], [], new Date());

    const skippedDoses = todayDoses.filter((d) => d.status === 'skipped');
    const skipMap: Record<string, number> = {};
    for (const d of skippedDoses) {
      const reason =
        (d as unknown as { skipped_reason?: string }).skipped_reason ||
        (d as unknown as { skip_reason?: string }).skip_reason ||
        'Unspecified';
      skipMap[reason] = (skipMap[reason] ?? 0) + 1;
    }
    const skipEntries = Object.entries(skipMap);
    const skipText =
      skipEntries.length > 0
        ? skipEntries
            .map(([reason, count]) => {
              if (reason.toLowerCase().includes('doctor')) {
                return `${count} ${count === 1 ? 'dose' : 'doses'} held per doctor advice`;
              }
              return `${count} ${count === 1 ? 'dose' : 'doses'} held (${reason})`;
            })
            .join(', ')
        : null;

    return {
      takenCount: stats.taken,
      totalTodayCount: total,
      adherencePercent: percent,
      streakDays: streak,
      hasData: hasDataToday,
      skippedCount: skippedDoses.length,
      skipReasonText: skipText,
    };
  }, [doses, today]);

  // SVG circular orbit metrics
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = adherencePercent !== null
    ? circumference - (adherencePercent / 100) * circumference
    : circumference;

  return (
    <div
      className={`bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-300 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/50">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">
              <FlameIcon size={16} />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Two-Tier Adherence &amp; Habits
            </h2>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-2xs font-bold border border-amber-300/40">
            🔥 {streakDays > 0 ? `${streakDays}-Day Streak` : 'Routine Active'}
          </span>
        </div>

        {/* ── Tier 1 Routine Guidance Strip ── */}
        <div className="mb-3 px-3 py-1.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-400/30 flex items-center justify-between gap-2 text-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold text-amber-900 dark:text-amber-200 shrink-0">
              Tier 1 Routine:
            </span>
            <span className="text-content-muted truncate">
              Logging all doses—including excused clinical holds—keeps your streak alive.
            </span>
          </div>
          <span className="font-bold text-amber-800 dark:text-amber-300 shrink-0 px-2 py-0.5 rounded-full bg-surface border border-amber-400/30">
            Daily Routine Maintained
          </span>
        </div>

        {/* ── Main Content: Orbit Meter & Habit Rows ────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center py-1">
          {/* Conic Orbit Adherence Meter (5 cols) */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <defs>
                  <linearGradient id="adherenceOrbitGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-line/50 dark:stroke-ink-800"
                  strokeWidth="7"
                  fill="none"
                />
                {hasData && (
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="url(#adherenceOrbitGradient)"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700 ease-out"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-content font-mono tracking-tight leading-none">
                  {adherencePercent !== null ? `${adherencePercent}%` : 'N/A'}
                </span>
                <span className="text-[8px] uppercase font-bold text-content-subtle tracking-wider mt-1 text-center px-0.5">
                  Compliance
                </span>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-content-muted mt-2 leading-tight">
              {hasData
                ? `${takenCount} of ${totalTodayCount} taken`
                : 'No scheduled doses today'}
            </p>

            {skipReasonText && (
              <span
                title={skipReasonText}
                className="mt-1.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full inline-block truncate max-w-full"
              >
                🛡️ {skipReasonText}
              </span>
            )}
          </div>

          {/* Daily Habits Quick Trackers (7 cols) */}
          <div className="sm:col-span-7 space-y-2">
            {/* Habit 1: Tier 1 Daily Routine Streak */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Flame size={12} className="fill-amber-500 text-amber-500" />
                </span>
                <span className="font-semibold text-content truncate">Daily Routine Streak</span>
              </div>
              <span className="text-2xs font-bold text-amber-700 dark:text-amber-300 font-mono shrink-0 ml-1">
                {streakDays > 0 ? `${streakDays}d Streak` : 'Routine Active'}
              </span>
            </div>

            {/* Habit 2: Tier 2 Pharmacological Compliance */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    adherencePercent === 100
                      ? 'bg-emerald-500 text-white'
                      : 'bg-teal-500/20 text-teal-600 dark:text-teal-400'
                  }`}
                >
                  <Check size={11} className="stroke-[3]" />
                </span>
                <span className="font-semibold text-content truncate">Pharmacological Intake</span>
              </div>
              <span className="text-2xs font-bold text-content font-mono shrink-0 ml-1">
                {takenCount}/{totalTodayCount}
              </span>
            </div>

            {/* Habit 3: Hydration Intake */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sky-500 shrink-0">
                  <DropletIcon size={15} />
                </span>
                <span className="font-semibold text-content truncate">
                  Water ({waterGlasses}/8 gl)
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddWater}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-2xs font-bold transition-colors shrink-0 ml-1 active:scale-95 cursor-pointer"
                title="Log 1 glass of water"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>+1</span>
              </button>
            </div>

            {/* Habit 4: Health Consistency Track */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-brand-600 dark:text-brand-400 shrink-0">
                  <Activity size={14} />
                </span>
                <span className="font-semibold text-content truncate">Vitals Tracking</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="pt-2.5 mt-3 border-t border-line/40 flex items-center justify-between text-2xs">
        <span className="text-content-subtle">Daily routine &amp; habit tracking</span>
        <Link
          to="/medicines"
          className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5 group"
        >
          <span>Schedule</span>
          <ChevronRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
