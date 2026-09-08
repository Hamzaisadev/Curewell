import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { visitsRepo } from '../../../lib/db';
import type { Visit } from '../../../lib/db/visits';
import { formatDateMedium } from '../../../lib/time';
import { StethoscopeIcon, ChevronRightIcon } from '../../../components/ui/icons';

export function RecentConsultationsCard() {
  const { profile } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    setIsLoading(true);

    visitsRepo
      .listVisits(profile.id)
      .then((data) => {
        if (!isMounted) return;
        setVisits(data.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load visits for dashboard card:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-brand-600 dark:text-brand-400">
              <StethoscopeIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Clinical Consultations
            </h2>
          </div>

          <Link
            to="/visits"
            className="text-2xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            <span>All Visits</span>
            <ChevronRightIcon size={13} />
          </Link>
        </div>

        {/* ── Visits List ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5 py-1 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 rounded-2xl bg-surface-sunken" />
            ))}
          </div>
        ) : visits.length > 0 ? (
          <div className="space-y-2.5">
            {visits.map((v) => (
              <Link
                key={v.id}
                to={`/visits/${v.id}`}
                className="p-2.5 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/50 hover:border-brand-500/40 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-content truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {v.doctor_name ? `Dr. ${v.doctor_name}` : 'General Consultation'}
                    </h4>
                    {v.clinic_name && (
                      <span className="text-2xs text-content-subtle truncate">
                        · {v.clinic_name}
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-content-muted truncate mt-0.5 font-medium">
                    {v.diagnosis || 'Clinical follow-up recorded'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-content-subtle font-semibold block">
                    {formatDateMedium(v.visit_date)}
                  </span>
                  <span className="text-[10px] text-brand-600 font-bold group-hover:underline">
                    Notes &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-content-muted">No clinical visits logged yet</p>
            <Link
              to="/visits"
              className="inline-block mt-1 text-2xs font-bold text-brand-600 hover:underline"
            >
              + Record Consultation
            </Link>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Doctor consults &amp; diagnosis notes</span>
        <Link to="/doctor/questions" className="font-bold text-brand-600 hover:underline">
          Prep Questions &rarr;
        </Link>
      </div>
    </div>
  );
}
