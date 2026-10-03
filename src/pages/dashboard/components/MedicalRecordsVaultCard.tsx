import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { reportsRepo } from '../../../lib/db';
import type { Report } from '../../../lib/db/reports';
import { formatDateMedium } from '../../../lib/time';
import { FolderIcon, ChevronRightIcon } from '../../../components/ui/icons';

function formatReportDateSafe(dateStr: string | null | undefined, dobStr: string | null | undefined): string {
  if (!dateStr) return 'Recent upload';
  const rYear = new Date(dateStr).getFullYear();
  const bYear = dobStr ? new Date(dobStr).getFullYear() : 0;
  if (bYear > 0 && rYear < bYear) {
    return 'Date pending verification';
  }
  return formatDateMedium(dateStr);
}

export function MedicalRecordsVaultCard() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    setIsLoading(true);

    reportsRepo
      .listReports(profile.id)
      .then((data) => {
        if (!isMounted) return;
        setReports(data.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load reports for vault card:', err);
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
            <span className="text-teal-600 dark:text-teal-400">
              <FolderIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content uppercase tracking-wider text-content-muted">
              Diagnostic Records Vault
            </h2>
          </div>

          <Link
            to="/reports"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            <span>All Files</span>
            <ChevronRightIcon size={13} />
          </Link>
        </div>

        {/* ── Reports List ──────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2 py-1 animate-pulse">
            <div className="h-10 rounded-xl bg-surface-sunken" />
            <div className="h-10 rounded-xl bg-surface-sunken" />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map((r) => (
              <Link
                key={r.id}
                to={`/reports/${r.id}`}
                className="p-3 rounded-2xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/40 flex items-center justify-between gap-3 hover:border-brand-500/40 transition-colors group"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-content truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {r.title || r.lab_name || 'Diagnostic Report'}
                  </h4>
                  <p className="text-[11px] text-content-subtle font-mono mt-0.5">
                    {formatReportDateSafe(r.report_date, profile?.date_of_birth)}
                  </p>
                </div>
                <span className="text-xs text-brand-600 font-bold group-hover:underline shrink-0">
                  View &rarr;
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-content-muted">No diagnostic files uploaded yet</p>
            <Link
              to="/reports/new"
              className="inline-block mt-1 text-2xs font-bold text-brand-600 hover:underline"
            >
              + Upload PDF / Image
            </Link>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Lab scans &amp; pathology PDFs</span>
        <Link to="/reports/new" className="font-bold text-brand-600 hover:underline">
          + Add File &rarr;
        </Link>
      </div>
    </div>
  );
}
