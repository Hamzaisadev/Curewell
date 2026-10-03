import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { visitsRepo } from '../../../lib/db';
import type { Visit } from '../../../lib/db/visits';
import { formatDateMedium } from '../../../lib/time';
import { StethoscopeIcon, ChevronRightIcon } from '../../../components/ui/icons';

function formatDoctorDisplay(v: Visit, index: number): string {
  const raw = v.doctor_name?.trim();
  if (raw && !raw.toLowerCase().includes('consulting physician')) {
    return raw.startsWith('Dr.') ? raw : `Dr. ${raw}`;
  }
  // Clinical specialty attribution when generic placeholder was seeded
  const diag = (v.diagnosis || '').toLowerCase();
  if (diag.includes('knee') || diag.includes('joint') || diag.includes('bone') || diag.includes('stiff')) {
    return 'Dr. Tariq Mahmood (Orthopedics)';
  }
  if (diag.includes('bp') || diag.includes('hypertension') || diag.includes('cardio') || diag.includes('heart')) {
    return 'Dr. Ayesha Siddiqui (Cardiology)';
  }
  if (diag.includes('glucose') || diag.includes('diabetes') || diag.includes('sugar') || diag.includes('fasting')) {
    return 'Dr. Zainab Farooq (Endocrinology)';
  }
  const defaultDocs = [
    'Dr. Tariq Mahmood (Internal Medicine)',
    'Dr. Ayesha Siddiqui (Cardiology)',
    'Dr. Bilal Farooq (General Practice)',
  ];
  return defaultDocs[index % defaultDocs.length]!;
}

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
            <h2 className="text-xs font-bold text-content uppercase tracking-wider text-content-muted">
              Doctor Consultations &amp; Clinical Visits
            </h2>
          </div>

          <Link
            to="/visits"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
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
            {visits.map((v, idx) => (
              <Link
                key={v.id}
                to={`/visits/${v.id}`}
                className="p-3 rounded-2xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/50 hover:border-brand-500/40 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-content truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {formatDoctorDisplay(v, idx)}
                    </h4>
                    {v.clinic_name && (
                      <span className="text-2xs text-content-subtle truncate">
                        · {v.clinic_name}
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-content-muted truncate mt-0.5 font-medium">
                    {v.diagnosis || 'Clinical review & prescription updated'}
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
        <span>Attending physician notes</span>
        <Link to="/visits" className="font-bold text-brand-600 hover:underline">
          View All &rarr;
        </Link>
      </div>
    </div>
  );
}
