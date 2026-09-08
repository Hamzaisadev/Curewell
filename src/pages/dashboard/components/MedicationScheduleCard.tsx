import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { dosesRepo, medicinesRepo } from '../../../lib/db';
import type { Dose } from '../../../lib/db/doses';
import type { Medicine } from '../../../lib/db/medicines';
import { decrementPill } from '../../../lib/inventory';
import {
  todayInAppTz,
  addDaysAppTz,
  minutesInAppTz,
  formatDoseTime,
} from '../../../lib/time';
import { CapsuleIcon, ChevronRightIcon } from '../../../components/ui/icons';

interface ScheduledDoseItem {
  id: string;
  medicineId: string;
  medicineName: string;
  strength: string | null;
  subtitle: string;
  dayLabel: string;
  timeStr: string;
  isOverdue: boolean;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
}

export function MedicationScheduleCard() {
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
      dosesRepo.listDosesForRange(effectiveProfileId, streakPastDate, tomorrow),
      medicinesRepo.listMedicines(effectiveProfileId),
    ])
      .then(([dosesList, medsList]) => {
        if (!isMounted) return;
        setDoses(dosesList);
        setMedicines(medsList);
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
  }, [effectiveProfileId]);

  const handleTakeDose = async (doseId: string, medicineId: string) => {
    if (!effectiveProfileId || takingDoseId) return;
    setTakingDoseId(doseId);
    try {
      const updated = await dosesRepo.updateDoseStatus(doseId, 'taken');
      setDoses((prev) => prev.map((d) => (d.id === doseId ? updated : d)));
      decrementPill(effectiveProfileId, medicineId);
    } catch (err) {
      console.error('Failed to mark dose as taken:', err);
    } finally {
      setTakingDoseId(null);
    }
  };

  const { pendingCount, overdueCount } = useMemo(() => {
    const today = todayInAppTz();
    const currentMins = minutesInAppTz();
    const todayDoses = doses.filter((d) => d.scheduled_date === today);

    const pending = todayDoses.filter((d) => d.status === 'pending').length;
    const overdue = todayDoses.filter(
      (d) => d.status === 'pending' && d.scheduled_minutes < currentMins
    ).length;

    return {
      pendingCount: pending,
      overdueCount: overdue,
    };
  }, [doses]);

  const items: ScheduledDoseItem[] = useMemo(() => {
    if (doses.length === 0) return [];

    const medsMap = new Map<string, Medicine>();
    for (const m of medicines) {
      medsMap.set(m.id, m);
    }

    const today = todayInAppTz();
    const currentMins = minutesInAppTz();

    // Sort doses: pending/overdue first, then by date and time
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

    const upcomingOrToday = sorted.filter(
      (d) => d.scheduled_date >= today || d.status === 'pending'
    );
    const displayList = upcomingOrToday.length > 0 ? upcomingOrToday : sorted;

    return displayList.slice(0, 2).map((d) => {
      const med = medsMap.get(d.medicine_id);
      const isToday = d.scheduled_date === today;
      const isOverdue = isToday && d.scheduled_minutes < currentMins && d.status === 'pending';

      const details: string[] = [];
      if (med?.dose_amount) {
        details.push(`${med.dose_amount} ${med.form || ''}`.trim());
      } else if (med?.form) {
        details.push(med.form);
      }
      if (med?.with_food === true) {
        details.push('With food');
      } else if (med?.with_food === false) {
        details.push('Before food');
      }

      return {
        id: d.id,
        medicineId: d.medicine_id,
        medicineName: med?.medicine_name?.trim() || 'Medication',
        strength: med?.strength?.trim() || null,
        subtitle: details.join(' · ') || (isToday ? 'Scheduled for today' : 'Upcoming dose'),
        dayLabel: isOverdue ? 'Overdue' : isToday ? 'Today' : 'Tomorrow',
        timeStr: formatDoseTime(d.scheduled_minutes),
        isOverdue,
        status: d.status,
      };
    });
  }, [doses, medicines]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200">
      {/* ── Card Header (matching PatientInfoCard styling) ──────────── */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-line/40">
        <div className="flex items-center gap-2">
          <span className="text-content-muted">
            <CapsuleIcon size={16} />
          </span>
          <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
            Upcoming Medications
          </h2>
          {overdueCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold tracking-wide">
              {overdueCount} Overdue
            </span>
          ) : pendingCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 text-[10px] font-bold tracking-wide">
              {pendingCount} Due Today
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold tracking-wide">
              All Caught Up
            </span>
          )}
        </div>

        <Link
          to="/medicines"
          className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline transition-colors"
        >
          <span>View All</span>
          <ChevronRightIcon size={14} />
        </Link>
      </div>

      {/* ── Card Body (Doses List) ────────────────────────────────── */}
      <div className="w-full flex flex-col justify-center space-y-2">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-sunken/50">
                <div className="w-10 h-10 rounded-xl bg-surface-sunken" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-surface-sunken rounded w-28" />
                  <div className="h-2 bg-surface-sunken rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface-sunken/40 dark:bg-ink-900/30 border border-line/50 hover:border-brand-500/30 hover:bg-surface-sunken/70 transition-all duration-150 group"
            >
              {/* Left: Capsule Icon with status squircle */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  item.status === 'taken'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : item.isOverdue
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                }`}
              >
                <CapsuleIcon size={18} />
              </div>

              {/* Center: Medicine Name & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-content truncate leading-snug">
                    {item.medicineName}
                  </h3>
                  {item.strength && (
                    <span className="px-1.5 py-0.2 rounded-md bg-surface border border-line/60 text-[10px] font-semibold text-content-subtle shrink-0">
                      {item.strength}
                    </span>
                  )}
                </div>
                <p className="text-2xs text-content-subtle truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              {/* Right: Time, Status, & Quick Take Action */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span
                    className={`block text-xs font-bold ${
                      item.isOverdue
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-content'
                    }`}
                  >
                    {item.timeStr}
                  </span>
                  <span
                    className={`block text-[10px] font-bold uppercase tracking-wider ${
                      item.isOverdue
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-content-subtle'
                    }`}
                  >
                    {item.dayLabel}
                  </span>
                </div>

                {item.status === 'taken' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    <Check size={13} className="stroke-[3]" />
                    <span>Taken</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTakeDose(item.id, item.medicineId)}
                    disabled={takingDoseId === item.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
                    title="Log as taken"
                  >
                    <Check size={13} className="stroke-[3]" />
                    <span>Take</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-1.5">
              <CapsuleIcon size={20} />
            </div>
            <p className="text-xs font-semibold text-content">No upcoming doses scheduled</p>
            <Link
              to="/prescriptions/new"
              className="text-2xs font-bold text-brand-600 hover:underline mt-0.5"
            >
              + Scan Prescription or Add Medicine
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
