import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { dosesRepo } from '../../../lib/db';
import { listGlucoseReadings, listBloodPressureReadings } from '../../../lib/db/vitals';
import type { Dose } from '../../../lib/db/doses';
import { calculateAdherence, calculateLoggingStreak, type EffectiveDose } from '../../../domain/adherence';
import { todayInAppTz, addDaysAppTz } from '../../../lib/time';
import { FlameIcon, ChevronRightIcon, DropletIcon } from '../../../components/ui/icons';
import { Check, Plus, Minus, Activity, Flame } from 'lucide-react';

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
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [vitalsRecordedToday, setVitalsRecordedToday] = useState(false);

  const today = todayInAppTz();

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;

    const streakPastDate = addDaysAppTz(today, -30);
    const tomorrow = addDaysAppTz(today, 1);

    Promise.all([
      dosesRepo.listDosesForRange(effectiveProfileId, streakPastDate, tomorrow),
      listGlucoseReadings(effectiveProfileId),
      listBloodPressureReadings(effectiveProfileId),
    ])
      .then(([dosesList, glucoseLogs, bpLogs]) => {
        if (!isMounted) return;
        setDoses(dosesList);
        const hasVitalsToday =
          glucoseLogs.some((g) => g.measured_at && g.measured_at.startsWith(today)) ||
          bpLogs.some((b) => b.measured_at && b.measured_at.startsWith(today));
        setVitalsRecordedToday(hasVitalsToday);
      })
      .catch((err) => {
        console.error('Failed to load adherence & vitals data:', err);
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

  const handleRemoveWater = () => {
    const next = Math.max(0, waterGlasses - 1);
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
            {streakDays > 0 ? `${streakDays}-Day Streak` : 'Routine Active'}
          </span>
        </div>

        {/* ── Tier 1 Routine Guidance Strip ── */}
        <div className="mb-3.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-400/30 text-2xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Tier 1 Routine
            </span>
            <span className="font-bold text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full bg-surface/90 border border-amber-400/30 shrink-0">
              {streakDays > 0 ? `${streakDays}d Streak Active` : 'Daily Routine Maintained'}
            </span>
          </div>
          <p className="text-content-muted leading-relaxed">
            Logging all doses—including excused clinical holds—keeps your streak alive.
          </p>
        </div>

        {/* ── Adherence Telemetry Banner ── */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 mb-3.5">
          <div className="relative w-[72px] h-[72px] shrink-0 flex items-center justify-center">
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
              <span className="text-[9px] uppercase font-bold text-content-subtle tracking-wider mt-0.5 text-center px-0.5">
                Adherence
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-content">
                {adherencePercent === 100
                  ? '100% Intake Adherence'
                  : adherencePercent !== null && adherencePercent >= 80
                  ? 'High Intake Adherence'
                  : adherencePercent !== null
                  ? 'In Progress Today'
                  : 'No Scheduled Doses'}
              </span>
            </div>
            <p className="text-2xs font-semibold text-content-muted mt-0.5 leading-snug">
              {hasData
                ? `${takenCount} of ${totalTodayCount} scheduled doses logged`
                : 'No medication scheduled for today'}
            </p>

            {skipReasonText && (
              <div className="mt-1.5">
                <span
                  title={skipReasonText}
                  className="text-2xs font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full inline-block leading-normal"
                >
                  {skipReasonText}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Daily Habits Quick Trackers (Full Width) ── */}
        <div className="space-y-2">
          {/* Habit 1: Tier 1 Daily Routine Streak */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Flame size={13} className="fill-amber-500 text-amber-500" />
              </span>
              <span className="font-semibold text-content whitespace-nowrap">Daily Routine Streak</span>
            </div>
            <span className="text-2xs font-bold text-amber-700 dark:text-amber-300 font-mono shrink-0 ml-2 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-300/30">
              {streakDays > 0 ? `${streakDays}d Streak` : 'Routine Active'}
            </span>
          </div>

          {/* Habit 2: Tier 2 Pharmacological Compliance */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  adherencePercent === 100
                    ? 'bg-emerald-500 text-white'
                    : 'bg-teal-500/20 text-teal-600 dark:text-teal-400'
                }`}
              >
                <Check size={12} className="stroke-[3]" />
              </span>
              <span className="font-semibold text-content whitespace-nowrap">Pharmacological Intake</span>
            </div>
            <span className="text-2xs font-bold text-content font-mono shrink-0 ml-2 px-2 py-0.5 rounded-md bg-surface border border-line/40">
              {takenCount}/{totalTodayCount}
            </span>
          </div>

          {/* Habit 3: Hydration Intake */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-sky-500/15 text-sky-500">
                <DropletIcon size={14} />
              </span>
              <span className="font-semibold text-content whitespace-nowrap">
                Water ({waterGlasses}/8 glasses)
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={handleRemoveWater}
                disabled={waterGlasses <= 0}
                className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-surface hover:bg-sky-500/10 text-content-subtle hover:text-sky-600 dark:hover:text-sky-400 text-2xs font-bold border border-line/60 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
                title="Remove 1 glass of water"
                aria-label="Remove 1 glass of water"
              >
                <Minus size={11} className="stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={handleAddWater}
                disabled={waterGlasses >= 12}
                className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-2xs font-bold transition-colors active:scale-95 cursor-pointer"
                title="Log 1 glass of water"
                aria-label="Log 1 glass of water"
              >
                <Plus size={11} className="stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Habit 4: Health Consistency Track */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/40 border border-line/50 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-brand-500/15 text-brand-600 dark:text-brand-400">
                <Activity size={13} />
              </span>
              <span className="font-semibold text-content whitespace-nowrap">Vitals Tracking</span>
            </div>
            {vitalsRecordedToday ? (
              <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                Logged Today
              </span>
            ) : (
              <span className="text-2xs font-bold text-content-subtle shrink-0 ml-2 px-2 py-0.5 rounded-md bg-surface border border-line/40">
                Pending
              </span>
            )}
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
