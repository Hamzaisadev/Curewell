import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Stethoscope, Pill } from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { visitsRepo, medicinesRepo } from '../../../lib/db';
import type { Visit } from '../../../lib/db/visits';
import type { Medicine } from '../../../lib/db/medicines';
import { readInventory } from '../../../lib/inventory';
import { formatDateMedium, todayInAppTz } from '../../../lib/time';

interface TimelineEventItem {
  id: string;
  title: string;
  date: string;
  subtitle: string;
  type: 'visit' | 'refill' | 'report';
  isPast: boolean;
}

export function CareScheduleTimelineCard() {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      visitsRepo.listVisits(effectiveProfileId),
      medicinesRepo.listMedicines(effectiveProfileId),
    ])
      .then(([vList, mList]) => {
        if (!isMounted) return;
        setVisits(vList);
        setMedicines(mList.filter((m) => !m.discontinued_at));
      })
      .catch((err) => {
        console.error('Failed to load care schedule timeline:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  const events: TimelineEventItem[] = useMemo(() => {
    const items: TimelineEventItem[] = [];
    const inventory = effectiveProfileId ? readInventory(effectiveProfileId) : {};
    const today = todayInAppTz();

    // 1. Refill alerts for low stock active medicines
    for (const med of medicines) {
      const invVal = inventory[med.id];
      if (typeof invVal === 'number' && invVal <= 7) {
        items.push({
          id: `refill-${med.id}`,
          title: `${med.medicine_name} Refill`,
          date: invVal === 0 ? 'Out of stock' : `${invVal} doses remaining`,
          subtitle: 'Pharmacy restock required',
          type: 'refill',
          isPast: false,
        });
      }
    }

    // 2. Doctor consultations / follow-ups
    for (const v of visits.slice(0, 3)) {
      const rawName = v.doctor_name?.trim();
      const docTitle = rawName && !rawName.toLowerCase().includes('consulting physician')
        ? (rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`)
        : (v.clinic_name || 'Clinical Consultation');

      const isPast = v.visit_date ? v.visit_date < today : true;

      items.push({
        id: `visit-${v.id}`,
        title: docTitle,
        date: formatDateMedium(v.visit_date),
        subtitle: isPast ? (v.diagnosis || 'Clinical review on file') : 'Scheduled Follow-up',
        type: 'visit',
        isPast,
      });
    }

    return items.slice(0, 3);
  }, [visits, medicines, effectiveProfileId]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-brand-600 dark:text-brand-400">
              <Calendar size={16} />
            </span>
            <h2 className="text-xs font-bold text-content uppercase tracking-wider text-content-muted">
              Care Timeline &amp; Events
            </h2>
          </div>

          <Link
            to="/timeline"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            <span>Timeline</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* ── Events List ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2 py-1 animate-pulse">
            <div className="h-12 rounded-xl bg-surface-sunken" />
            <div className="h-12 rounded-xl bg-surface-sunken" />
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-2.5">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-2xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/40 flex items-center justify-between gap-3 text-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      ev.type === 'refill'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                    }`}
                  >
                    {ev.type === 'refill' ? <Pill size={14} /> : <Stethoscope size={14} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-content truncate text-xs">
                      {ev.title}
                    </h4>
                    <p className="text-[11px] text-content-muted truncate mt-0.5 font-medium">
                      {ev.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-content-subtle font-semibold block text-[10px]">
                    {ev.date}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      ev.isPast ? 'text-content-subtle' : 'text-brand-600 dark:text-brand-400'
                    }`}
                  >
                    {ev.isPast ? 'Recorded' : 'Upcoming'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-2xs text-content-muted">No scheduled appointments or care events</p>
            <Link
              to="/visits"
              className="inline-block mt-1 text-2xs font-bold text-brand-600 hover:underline"
            >
              + Log Care Event
            </Link>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Clinical history &amp; care schedule</span>
        <Link to="/timeline" className="font-bold text-brand-600 hover:underline">
          Full Schedule &rarr;
        </Link>
      </div>
    </div>
  );
}
