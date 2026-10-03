import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Clock,
  AlertCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  ChevronRight,
  Utensils,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { dosesRepo } from '../../../lib/db';
import type { Dose } from '../../../lib/db/doses';
import type { Medicine } from '../../../lib/db/medicines';
import { getDaySchedule, recordDoseAction } from '../../../domain/medicationRegimen';
import {
  todayInAppTz,
  addDaysAppTz,
  minutesInAppTz,
  formatDoseTime,
} from '../../../lib/time';
import { CapsuleIcon } from '../../../components/ui/icons';

interface DaypartBucket {
  id: 'morning' | 'afternoon' | 'evening' | 'night';
  label: string;
  timeRange: string;
  icon: typeof Sun;
  startMin: number;
  endMin: number;
  doses: Dose[];
  isCurrent: boolean;
}

interface MedicationScheduleCardProps {
  onDoseRecorded?: () => void;
}

export function MedicationScheduleCard({ onDoseRecorded }: MedicationScheduleCardProps = {}) {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [doses, setDoses] = useState<Dose[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [takingDoseId, setTakingDoseId] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    const today = todayInAppTz();
    const tomorrow = addDaysAppTz(today, 1);
    const streakPastDate = addDaysAppTz(today, -30);

    Promise.all([
      getDaySchedule(effectiveProfileId, today, effectiveUserId),
      dosesRepo.listDosesForRange(effectiveProfileId, streakPastDate, tomorrow),
    ])
      .then(([todaySchedule, rangeDoses]) => {
        if (!isMounted) return;
        const todayDoseIds = new Set(todaySchedule.doses.map((d) => d.id));
        const combined = [
          ...rangeDoses.filter((d) => d.scheduled_date !== today && !todayDoseIds.has(d.id)),
          ...todaySchedule.doses,
        ];
        setDoses(combined);
        setMedicines(todaySchedule.medicines);
      })
      .catch((err) => {
        console.error('Failed to load medication schedule for dashboard:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId, effectiveUserId]);

  const handleTakeDose = async (doseId: string) => {
    if (!effectiveProfileId || takingDoseId) return;
    const targetDose = doses.find((d) => d.id === doseId);
    if (!targetDose) return;

    setTakingDoseId(doseId);
    try {
      const { updatedDose } = await recordDoseAction({
        dose: targetDose,
        newStatus: 'taken',
        profileId: effectiveProfileId,
      });
      setDoses((prev) => prev.map((d) => (d.id === doseId ? updatedDose : d)));
      onDoseRecorded?.();
    } catch (err) {
      console.error('Failed to mark dose as taken:', err);
    } finally {
      setTakingDoseId(null);
    }
  };

  const medsMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    for (const m of medicines) {
      map.set(m.id, m);
    }
    return map;
  }, [medicines]);

  const today = todayInAppTz();
  const currentMins = minutesInAppTz();

  // Circadian Daypart Buckets for Today
  const daypartBuckets: DaypartBucket[] = useMemo(() => {
    const todayDoses = doses.filter((d) => d.scheduled_date === today);

    const isCurrentBucket = (start: number, end: number) => {
      if (start <= end) {
        return currentMins >= start && currentMins < end;
      }
      return currentMins >= start || currentMins < end;
    };

    return [
      {
        id: 'morning',
        label: 'Morning',
        timeRange: '06:00 - 12:00',
        icon: Sunrise,
        startMin: 360,
        endMin: 720,
        doses: todayDoses.filter((d) => d.scheduled_minutes >= 360 && d.scheduled_minutes < 720),
        isCurrent: isCurrentBucket(360, 720),
      },
      {
        id: 'afternoon',
        label: 'Afternoon',
        timeRange: '12:00 - 17:00',
        icon: Sun,
        startMin: 720,
        endMin: 1020,
        doses: todayDoses.filter((d) => d.scheduled_minutes >= 720 && d.scheduled_minutes < 1020),
        isCurrent: isCurrentBucket(720, 1020),
      },
      {
        id: 'evening',
        label: 'Evening',
        timeRange: '17:00 - 21:00',
        icon: Sunset,
        startMin: 1020,
        endMin: 1260,
        doses: todayDoses.filter((d) => d.scheduled_minutes >= 1020 && d.scheduled_minutes < 1260),
        isCurrent: isCurrentBucket(1020, 1260),
      },
      {
        id: 'night',
        label: 'Night',
        timeRange: '21:00 - 06:00',
        icon: Moon,
        startMin: 1260,
        endMin: 360,
        doses: todayDoses.filter((d) => d.scheduled_minutes >= 1260 || d.scheduled_minutes < 360),
        isCurrent: isCurrentBucket(1260, 360),
      },
    ];
  }, [doses, today, currentMins]);

  // Today's pending and overdue stats
  const { pendingCount, overdueCount, takenTodayCount, totalTodayCount } = useMemo(() => {
    const todayDoses = doses.filter((d) => d.scheduled_date === today);
    const pending = todayDoses.filter((d) => d.status === 'pending').length;
    const overdue = todayDoses.filter(
      (d) => d.status === 'pending' && d.scheduled_minutes < currentMins
    ).length;
    const taken = todayDoses.filter((d) => d.status === 'taken').length;

    return {
      pendingCount: pending,
      overdueCount: overdue,
      takenTodayCount: taken,
      totalTodayCount: todayDoses.length,
    };
  }, [doses, today, currentMins]);

  // Ordered list of upcoming doses: pending/overdue first, then by date/time
  const sortedUpcomingDoses = useMemo(() => {
    if (doses.length === 0) return [];

    const sorted = [...doses].sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
      }
      if (a.scheduled_date !== b.scheduled_date) {
        return a.scheduled_date.localeCompare(b.scheduled_date);
      }
      return a.scheduled_minutes - b.scheduled_minutes;
    });

    const relevant = sorted.filter(
      (d) => d.scheduled_date >= today || d.status === 'pending'
    );
    return relevant.length > 0 ? relevant : sorted;
  }, [doses, today]);

  // Next dose spotlight: first pending dose
  const nextPendingDose = useMemo(() => {
    return sortedUpcomingDoses.find((d) => d.status === 'pending') || null;
  }, [sortedUpcomingDoses]);

  // Secondary upcoming doses
  const secondaryDoses = useMemo(() => {
    if (!nextPendingDose) {
      return sortedUpcomingDoses.slice(0, 3);
    }
    return sortedUpcomingDoses.filter((d) => d.id !== nextPendingDose.id).slice(0, 2);
  }, [sortedUpcomingDoses, nextPendingDose]);

  const spotlightMed = nextPendingDose ? medsMap.get(nextPendingDose.medicine_id) : null;
  const isSpotlightOverdue =
    nextPendingDose?.scheduled_date === today &&
    nextPendingDose.scheduled_minutes < currentMins &&
    nextPendingDose.status === 'pending';

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-6 shadow-card hover:shadow-raise transition-all duration-300">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-line/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <CapsuleIcon size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Today&apos;s Medicines &amp; Schedule
            </h2>
            <p className="text-xs font-semibold text-content">
              {totalTodayCount > 0
                ? `${takenTodayCount} of ${totalTodayCount} taken today`
                : 'No doses scheduled for today'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {overdueCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-2xs font-bold tracking-tight animate-pulse">
              <AlertCircle size={12} />
              <span>{overdueCount} Overdue</span>
            </span>
          ) : pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 text-2xs font-bold tracking-tight">
              <Clock size={12} />
              <span>{pendingCount} Remaining</span>
            </span>
          ) : totalTodayCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-2xs font-bold tracking-tight">
              <Check size={12} className="stroke-[3]" />
              <span>Completed Today</span>
            </span>
          ) : null}

          <Link
            to="/medicines"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 p-1 hover:underline"
          >
            <span>Full Schedule</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Circadian Routine Rail (rendered when medications exist) ── */}
      {doses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {daypartBuckets.map((bucket) => {
            const Icon = bucket.icon;
            const totalInBucket = bucket.doses.length;
            const takenInBucket = bucket.doses.filter((d) => d.status === 'taken').length;
            const isComplete = totalInBucket > 0 && takenInBucket === totalInBucket;
            const hasPending = totalInBucket > 0 && !isComplete;

            return (
              <div
                key={bucket.id}
                className={`p-2.5 rounded-2xl border transition-all duration-200 text-left ${
                  bucket.isCurrent
                    ? 'bg-brand-500/10 border-brand-500/40 ring-1 ring-brand-500/20'
                    : 'bg-surface-sunken/50 dark:bg-ink-900/30 border-line/60 hover:border-line'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-content-muted">
                    <Icon
                      size={14}
                      className={
                        bucket.isCurrent ? 'text-brand-600 dark:text-brand-400' : 'opacity-70'
                      }
                    />
                    <span className="text-2xs font-bold uppercase tracking-wider">{bucket.label}</span>
                  </div>
                  {bucket.isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[11px] font-mono text-content-subtle">{bucket.timeRange}</span>

                  {totalInBucket === 0 ? (
                    <span className="text-[10px] text-content-subtle font-medium">—</span>
                  ) : isComplete ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Check size={11} className="stroke-[3]" />
                      <span>Done</span>
                    </span>
                  ) : hasPending ? (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {totalInBucket - takenInBucket} Due
                    </span>
                  ) : (
                    <span className="text-[10px] text-content-subtle font-medium">
                      {totalInBucket} Doses
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Main Schedule Content ─────────────────────────────────── */}
      {isLoading ? (
        <div className="py-6 space-y-3 animate-pulse">
          <div className="h-20 rounded-2xl bg-surface-sunken" />
          <div className="h-12 rounded-2xl bg-surface-sunken" />
        </div>
      ) : nextPendingDose ? (
        /* Spotlight Hero for Immediate Pending Dose */
        <div className="space-y-3">
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              isSpotlightOverdue
                ? 'bg-rose-500/5 border-rose-500/30'
                : 'bg-gradient-to-r from-brand-500/10 via-surface-sunken/60 to-surface border-brand-500/30 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: Dose details */}
              <div className="min-w-0 flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isSpotlightOverdue
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      : 'bg-brand-500/15 border-brand-500/30 text-brand-600 dark:text-brand-400'
                  }`}
                >
                  <CapsuleIcon size={24} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isSpotlightOverdue
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          : 'bg-brand-500/20 text-brand-700 dark:text-brand-300'
                      }`}
                    >
                      {isSpotlightOverdue ? 'Overdue Dose' : 'Next Dose Spotlight'}
                    </span>

                    <span className="font-mono text-xs font-bold text-content">
                      {formatDoseTime(nextPendingDose.scheduled_minutes)} ·{' '}
                      {nextPendingDose.scheduled_date === today ? 'Today' : 'Tomorrow'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-content tracking-tight mt-1 truncate">
                    {spotlightMed?.medicine_name || 'Prescribed Medicine'}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 flex-wrap text-2xs text-content-subtle font-medium">
                    {spotlightMed?.strength && (
                      <span className="px-1.5 py-0.5 rounded-md bg-surface border border-line font-bold text-content">
                        {spotlightMed.strength}
                      </span>
                    )}
                    {spotlightMed?.form && (
                      <span className="capitalize">{spotlightMed.form}</span>
                    )}
                    {spotlightMed?.with_food !== undefined && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-sunken border border-line/60">
                        <Utensils size={10} />
                        <span>{spotlightMed.with_food ? 'With meal' : 'Empty stomach'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Primary 1-Tap Take Action Button with Spring Touch Target */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTakeDose(nextPendingDose.id)}
                  disabled={takingDoseId === nextPendingDose.id}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold transition-all duration-150 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Mark this dose as taken"
                >
                  <Check size={16} className="stroke-[3]" />
                  <span>{takingDoseId === nextPendingDose.id ? 'Recording...' : 'Mark Taken'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary upcoming doses list */}
          {secondaryDoses.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-content-subtle px-1">
                Later Today &amp; Tomorrow
              </span>
              {secondaryDoses.map((dose) => {
                const med = medsMap.get(dose.medicine_id);
                const isDoseToday = dose.scheduled_date === today;
                return (
                  <div
                    key={dose.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface-sunken/40 dark:bg-ink-900/30 border border-line/50 hover:bg-surface-sunken/70 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center text-content-subtle shrink-0">
                        <CapsuleIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-content truncate">
                          {med?.medicine_name || 'Prescription'}
                        </p>
                        <p className="text-2xs text-content-subtle font-mono">
                          {formatDoseTime(dose.scheduled_minutes)} ·{' '}
                          {isDoseToday ? 'Today' : 'Tomorrow'}
                        </p>
                      </div>
                    </div>

                    {dose.status === 'taken' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-2xs font-bold">
                        <Check size={12} className="stroke-[3]" />
                        <span>Taken</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTakeDose(dose.id)}
                        disabled={takingDoseId === dose.id}
                        className="px-3 py-1 rounded-xl bg-surface hover:bg-brand-500/10 border border-line hover:border-brand-500/30 text-content hover:text-brand-600 text-2xs font-bold transition-all cursor-pointer"
                      >
                        Take
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : totalTodayCount > 0 ? (
        /* Medicines fully complete for today! */
        <div className="py-7 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 shadow-xs">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-sm font-bold text-content">You&apos;re All Caught Up for Today!</h3>
          <p className="text-xs text-content-muted mt-1 max-w-sm">
            All scheduled medicines for today have been taken. Rest well.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-2xs font-semibold text-content-subtle bg-surface px-3 py-1 rounded-full border border-line">
            <Clock size={12} className="text-brand-500" />
            <span>Next dose scheduled for tomorrow morning</span>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 py-6 px-5 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/60">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20 shadow-xs">
              <CapsuleIcon size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-content leading-snug">
                No Medicines Scheduled for Today
              </h3>
              <p className="text-xs text-content-muted mt-0.5 max-w-md leading-relaxed">
                Add your medicines or scan a prescription to set up your daily schedule and reminders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              to="/prescriptions/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Scan Prescription</span>
            </Link>
            <Link
              to="/medicines"
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surface-sunken text-content border border-line text-xs font-bold transition-all cursor-pointer"
            >
              <span>Cabinet</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
