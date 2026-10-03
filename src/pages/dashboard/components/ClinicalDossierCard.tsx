import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { reportsRepo } from '../../../lib/db';
import { listResultsForReport } from '../../../lib/db/reports';
import {
  QuestionIcon,
  FileTextIcon,
  EmergencyAmbulanceIcon,
  ChevronRightIcon,
} from '../../../components/ui/icons';
import { Stethoscope } from 'lucide-react';

export function ClinicalDossierCard() {
  const { profile } = useAuth();
  const [issuesCount, setIssuesCount] = useState<number>(0);

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;

    reportsRepo
      .listReports(profile.id)
      .then(async (reports) => {
        if (!isMounted || !reports || reports.length === 0) return;
        for (const r of reports.slice(0, 3)) {
          const items = await listResultsForReport(r.id);
          if (items && items.length > 0) {
            const flagged = items.filter(
              (it) => it.range_status === 'below' || it.range_status === 'above'
            ).length;
            if (isMounted) setIssuesCount(flagged);
            return;
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load clinical issues for doctor summary card:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  return (
    <div className="h-full bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-brand-600 dark:text-brand-400">
              <Stethoscope size={16} />
            </span>
            <h2 className="text-xs font-bold text-content uppercase tracking-wider text-content-muted">
              Doctor&apos;s Brief &amp; Care Tools
            </h2>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 text-[10px] font-bold">
            Care Protocol
          </span>
        </div>

        {/* ── Clinical Health Summary Banner ────────────────────────── */}
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 p-3 mb-3">
          <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
            Health Summary Status
          </h3>
          <p className="text-2xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-snug">
            {issuesCount > 0 ? (
              <>
                Identified{' '}
                <span className="font-bold underline text-emerald-950 dark:text-emerald-100">
                  {issuesCount} out-of-range {issuesCount === 1 ? 'biomarker' : 'biomarkers'}
                </span>{' '}
                for your doctor to review.
              </>
            ) : (
              'All analyzed patient records, prescriptions, and vitals are documented and in order.'
            )}
          </p>
        </div>

        {/* ── Action Links ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <Link
            to="/doctor/questions"
            className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line hover:border-brand-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-cyan-600 dark:text-cyan-400 shrink-0">
                <QuestionIcon size={15} />
              </span>
              <span className="text-xs font-bold text-content truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Doctor Consultation Questions
              </span>
            </div>
            <ChevronRightIcon
              size={13}
              className="text-content-subtle shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>

          <Link
            to="/doctor/second-opinion"
            className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line hover:border-brand-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileTextIcon size={15} />
              </span>
              <span className="text-xs font-bold text-content truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Second Opinion Medical Summary
              </span>
            </div>
            <ChevronRightIcon
              size={13}
              className="text-content-subtle shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>

          <a
            href="tel:1122"
            className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 hover:border-rose-400 transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-rose-600 dark:text-rose-400 shrink-0">
                <EmergencyAmbulanceIcon size={15} />
              </span>
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate">
                Emergency Ambulance Protocol (1122 / 115)
              </span>
            </div>
            <ChevronRightIcon
              size={13}
              className="text-rose-500 shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </a>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Encrypted &amp; patient-controlled</span>
        <Link to="/doctor/brief" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
          <span>Doctor Brief</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </div>
  );
}
