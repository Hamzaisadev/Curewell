import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { reportsRepo } from '../../../lib/db';
import type { Report } from '../../../lib/db/reports';
import { listResultsForReport, type ReportResult } from '../../../lib/db/reports';
import { LabFlaskIcon, ChevronRightIcon, FileTextIcon } from '../../../components/ui/icons';
import { Plus } from 'lucide-react';
import { formatDateMedium } from '../../../lib/time';

interface DisplayBiomarker {
  id: string;
  name: string;
  value: number | string;
  refHigh: number | null;
  unit: string | null;
  percentage: number;
  isOutOfRange: boolean;
}

export function LabsCard() {
  const { profile } = useAuth();
  const [results, setResults] = useState<ReportResult[]>([]);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [hasReports, setHasReports] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    setIsLoading(true);

    reportsRepo
      .listReports(profile.id)
      .then(async (reports) => {
        if (!isMounted) return;
        if (!reports || reports.length === 0) {
          setHasReports(false);
          setResults([]);
          setLatestReport(null);
          return;
        }

        setHasReports(true);
        setLatestReport(reports[0] || null);

        // Fetch results for the most recent report that contains parsed items
        for (const r of reports.slice(0, 3)) {
          const reportItems = await listResultsForReport(r.id);
          if (reportItems && reportItems.length > 0) {
            if (isMounted) {
              setResults(reportItems);
              setLatestReport(r);
            }
            return;
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load lab results for dashboard card:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  // Date sanity check (e.g. year 2000 report for a 2004-born patient)
  const sanitizedReportDate = useMemo(() => {
    if (!latestReport?.report_date) return 'Recently uploaded';
    const reportYear = new Date(latestReport.report_date).getFullYear();
    const birthYear = profile?.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : 0;
    if (birthYear > 0 && reportYear < birthYear) {
      return 'Date unverified (pre-dates birth)';
    }
    return formatDateMedium(latestReport.report_date);
  }, [latestReport, profile?.date_of_birth]);

  // Transform real lab results for the bars
  const biomarkers: DisplayBiomarker[] = useMemo(() => {
    if (results.length === 0) return [];

    return results.slice(0, 4).map((r) => {
      const valNum = r.value_numeric;
      const refHigh = r.ref_high;
      let pct = 50;

      if (valNum !== null && refHigh !== null && refHigh > 0) {
        pct = Math.min(100, Math.max(10, Math.round((valNum / refHigh) * 100)));
      } else if (valNum !== null && r.ref_low !== null && r.ref_low > 0) {
        pct = Math.min(100, Math.max(10, Math.round((valNum / (r.ref_low * 2)) * 100)));
      }

      return {
        id: r.id,
        name: r.canonical_name || r.test_name,
        value: valNum !== null ? valNum : r.value_text,
        refHigh: refHigh,
        unit: r.unit,
        percentage: pct,
        isOutOfRange: r.range_status === 'below' || r.range_status === 'above',
      };
    });
  }, [results]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        {/* ── Card Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <LabFlaskIcon size={14} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Diagnostic Labs &amp; Pathology
            </h2>
          </div>

          <Link
            to="/reports"
            className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
          >
            <span>View All</span>
            <ChevronRightIcon size={13} />
          </Link>
        </div>

        {/* ── Biomarkers List / Report on File / Empty State ─────────── */}
        {isLoading ? (
          <div className="space-y-3 py-2 animate-pulse">
            <div className="h-10 rounded-xl bg-surface-sunken" />
            <div className="h-10 rounded-xl bg-surface-sunken" />
          </div>
        ) : biomarkers.length > 0 ? (
          <div className="space-y-3 py-1">
            {biomarkers.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content truncate max-w-[170px]">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <span
                      className={`font-bold ${
                        item.isOutOfRange
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {item.value} {item.unit || ''}
                    </span>
                    {item.refHigh && (
                      <span className="text-[10px] text-content-subtle">
                        (&le;{item.refHigh})
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden border border-line/40"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(148, 163, 184, 0.25) 4px, rgba(148, 163, 184, 0.25) 8px)',
                  }}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-brand-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : hasReports && latestReport ? (
          /* Report exists in vault but discrete test items haven't been parsed yet */
          <div className="p-3.5 rounded-2xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/50 my-1">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileTextIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-content truncate">
                    {latestReport.title || latestReport.lab_name || 'Diagnostic Lab Sheet'}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[9px] font-bold">
                    File on Record
                  </span>
                </div>
                <p className="text-[11px] text-content-subtle font-mono mt-0.5">
                  {sanitizedReportDate}
                </p>
                <p className="text-[11px] text-content-muted mt-1 leading-snug">
                  Document stored in Medical Vault. Discrete numeric analyte extraction pending.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Link
                    to={`/reports/${latestReport.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>View Report</span>
                    <ChevronRightIcon size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Zero reports exist */
          <div className="flex flex-col items-center justify-center text-center py-5 px-3 rounded-2xl bg-surface-sunken/40 border border-line/40 my-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-2">
              <LabFlaskIcon size={20} />
            </div>
            <h3 className="text-xs font-bold text-content">No Lab Reports Uploaded</h3>
            <p className="text-[11px] text-content-muted mt-0.5 max-w-xs leading-relaxed">
              Upload blood tests, CBC, lipid panels, or urinalysis to track clinical biomarkers.
            </p>
            <Link
              to="/reports/new"
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={13} className="stroke-[2.5]" />
              <span>Upload Lab Report</span>
            </Link>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Analyte range tracking</span>
        <Link to="/reports" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
          <span>Medical Records</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </div>
  );
}
