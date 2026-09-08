import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { dosesRepo } from '../../../lib/db';
import type { Dose } from '../../../lib/db/doses';
import { calculateAdherenceStreak } from '../../../domain/adherence';
import { todayInAppTz, addDaysAppTz } from '../../../lib/time';
import { FlameIcon, ChevronRightIcon, DropletIcon } from '../../../components/ui/icons';
import { Check, Plus } from 'lucide-react';

const WATER_STORAGE_KEY = 'curewell_water_intake_';

interface AdherenceHabitsCardProps {
  className?: string;
}

export function AdherenceHabitsCard({ className = '' }: AdherenceHabitsCardProps) {
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
  }, [effectiveProfileId, today]);

  const handleAddWater = () => {
    const next = Math.min(12, waterGlasses + 1);
    setWaterGlasses(next);
    try {
      localStorage.setItem(`${WATER_STORAGE_KEY}${effectiveProfileId}_${today}`, String(next));
    } catch {
      // ignore
    }
  };

  const { takenCount, totalTodayCount, adherencePercent, streakDays } = useMemo(() => {
    const todayDoses = doses.filter((d) => d.scheduled_date === today);
    const taken = todayDoses.filter((d) => d.status === 'taken').length;
    const total = todayDoses.length;
    const percent = total > 0 ? Math.round((taken / total) * 100) : 100;
    const streak = calculateAdherenceStreak(doses, new Date());

    return {
      takenCount: taken,
      totalTodayCount: total,
      adherencePercent: percent,
      streakDays: streak,
    };
  }, [doses, today]);

  // SVG circle calculations for the gauge
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (adherencePercent / 100) * circumference;

  return (
    <div
      className={`bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">
              <FlameIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Daily Adherence &amp; Habits
            </h2>
          </div>

          {streakDays > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              🔥 {streakDays}d Streak
            </span>
          )}
        </div>

        {/* ── Main Content: Gauge on left, Habit trackers on right ── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center py-1">
          {/* Circular Adherence Meter (5 cols) */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-surface-sunken/40 dark:bg-ink-900/30 border border-line/30">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  className="stroke-line/60 dark:stroke-ink-800"
                  strokeWidth="7"
                  fill="none"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  className="stroke-brand-500 transition-all duration-700 ease-out"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-content font-mono tracking-tight">
                  {adherencePercent}%
                </span>
                <span className="text-[8px] uppercase font-bold text-content-subtle tracking-wider">
                  Today
                </span>
              </div>
            </div>

            <p className="text-[10px] font-bold text-content-muted mt-1 leading-tight">
              {totalTodayCount > 0 ? `${takenCount}/${totalTodayCount} Doses Taken` : 'All Caught Up'}
            </p>
          </div>

          {/* Daily Habits Quick Loggers (7 cols) */}
          <div className="sm:col-span-7 space-y-2">
            {/* Dose status habit */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/50 text-2xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    adherencePercent === 100
                      ? 'bg-emerald-500 text-white'
                      : 'bg-brand-500/20 text-brand-600'
                  }`}
                >
                  <Check size={10} className="stroke-[3]" />
                </span>
                <span className="font-semibold text-content truncate">Doses Routine</span>
              </div>
              <span className="text-[10px] font-bold text-content-subtle shrink-0 ml-1">
                {takenCount}/{totalTodayCount}
              </span>
            </div>

            {/* Hydration habit */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/50 text-2xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sky-500 shrink-0">
                  <DropletIcon size={13} />
                </span>
                <span className="font-semibold text-content truncate">Water ({waterGlasses}/8)</span>
              </div>

              <button
                type="button"
                onClick={handleAddWater}
                className="p-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold transition-colors shrink-0 ml-1"
                title="Add 1 glass of water"
              >
                <Plus size={11} className="stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Footer ───────────────────────────────────────────── */}
      <div className="pt-2.5 mt-3 border-t border-line/40 flex items-center justify-between text-2xs">
        <span className="text-content-subtle">Real-time daily consistency</span>
        <Link
          to="/medicines"
          className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5 group"
        >
          <span>Routine</span>
          <ChevronRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
