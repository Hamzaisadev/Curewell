import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { dosesRepo, medicinesRepo } from '../../../lib/db';
import type { Dose } from '../../../lib/db/doses';
import type { Medicine } from '../../../lib/db/medicines';
import { todayInAppTz, formatDoseTime } from '../../../lib/time';
import { deriveStatusOnRead } from '../../../domain/adherence';
import { MedicineIcon, CheckIcon, ClockIcon, PlusIcon } from '../../../components/ui/icons';

export function MedicationScheduleCard() {
  const { profile } = useAuth();
  const [doses, setDoses] = useState<Dose[]>([]);
  const [medicinesMap, setMedicinesMap] = useState<Record<string, Medicine>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const today = useMemo(() => todayInAppTz(), []);

  const loadData = useCallback(() => {
    if (!profile?.id) return;
    setIsLoading(true);

    Promise.all([
      dosesRepo.listDosesForDate(profile.id, today),
      medicinesRepo.listMedicines(profile.id),
    ])
      .then(([fetchedDoses, fetchedMeds]) => {
        setDoses(fetchedDoses);
        const map: Record<string, Medicine> = {};
        for (const m of fetchedMeds) {
          map[m.id] = m;
        }
        setMedicinesMap(map);
      })
      .catch((err) => {
        console.error('Failed to load doses for dashboard medication card:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [profile?.id, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTakeDose = async (doseId: string) => {
    setIsUpdating(doseId);
    try {
      await dosesRepo.updateDoseStatus(doseId, 'taken', new Date().toISOString());
      // Optimistic update
      setDoses((prev) =>
        prev.map((d) => (d.id === doseId ? { ...d, status: 'taken', taken_at: new Date().toISOString() } : d))
      );
    } catch (err) {
      console.error('Failed to take dose:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const { takenCount, totalCount, upcomingDoses } = useMemo(() => {
    const now = new Date();
    const total = doses.length;
    let taken = 0;

    const list = doses.map((d) => {
      const derived = deriveStatusOnRead(d, now);
      if (derived === 'taken') taken++;
      return {
        ...d,
        effectiveStatus: derived,
        medicine: medicinesMap[d.medicine_id],
      };
    });

    return {
      takenCount: taken,
      totalCount: total,
      upcomingDoses: list.slice(0, 3),
    };
  }, [doses, medicinesMap]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between overflow-hidden h-[195px] sm:h-[200px]">
      {/* ── Card Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-line/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
            <MedicineIcon size={14} />
          </div>
          <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
            Medication Schedule
          </h2>
          {totalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 text-[10px] font-bold font-mono">
              {takenCount}/{totalCount} Taken
            </span>
          )}
        </div>

        <Link
          to="/medicines"
          className="text-2xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
        >
          View all
        </Link>
      </div>

      {/* ── Card Body (Doses Tiles or Empty State) ───────────────────── */}
      <div className="flex-1 flex items-center py-1">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface-sunken rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : upcomingDoses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 w-full">
            {upcomingDoses.map((item) => {
              const medName = item.medicine?.medicine_name || 'Medication';
              const strength = item.medicine?.strength ? ` ${item.medicine.strength}` : '';
              const timeStr = formatDoseTime(item.scheduled_minutes);
              const isTaken = item.effectiveStatus === 'taken';
              const isMissed = item.effectiveStatus === 'missed';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-2.5 flex flex-col justify-between transition-all ${
                    isTaken
                      ? 'bg-ok-bg/50 border-ok-border/60 text-ok-text'
                      : isMissed
                        ? 'bg-warn-bg/50 border-warn-border/60'
                        : 'bg-surface-sunken/80 dark:bg-ink-800/40 border-line/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-content-subtle">
                      <ClockIcon size={10} />
                      {timeStr}
                    </span>
                    {isTaken ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-ok-text">
                        <CheckIcon size={11} /> Done
                      </span>
                    ) : isMissed ? (
                      <span className="text-[10px] font-bold text-warn-text">Overdue</span>
                    ) : null}
                  </div>

                  <div className="my-1">
                    <h3 className="text-xs font-bold text-content truncate leading-tight" title={medName + strength}>
                      {medName}{strength}
                    </h3>
                    <p className="text-[10px] text-content-subtle truncate mt-0.5">
                      {item.medicine?.instructions || item.medicine?.form || 'Prescribed dose'}
                    </p>
                  </div>

                  {!isTaken ? (
                    <button
                      onClick={() => handleTakeDose(item.id)}
                      disabled={isUpdating === item.id}
                      className="w-full py-1 px-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdating === item.id ? 'Taking...' : 'Take Dose'}
                    </button>
                  ) : (
                    <div className="py-0.5 text-center text-[10px] text-ok-text font-medium">
                      Logged
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-surface-sunken/60 border border-line/40">
            <div>
              <p className="text-xs font-bold text-content">No medications due today</p>
              <p className="text-2xs text-content-subtle mt-0.5">
                All scheduled doses are complete or none are registered.
              </p>
            </div>
            <Link
              to="/prescriptions/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shrink-0"
            >
              <PlusIcon size={13} />
              Add Prescription
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
