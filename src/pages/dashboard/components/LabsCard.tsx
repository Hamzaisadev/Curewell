import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { reportsRepo } from '../../../lib/db';
import { listResultsForReport, type ReportResult } from '../../../lib/db/reports';
import { LabFlaskIcon, ChevronRightIcon } from '../../../components/ui/icons';

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
          return;
        }

        setHasReports(true);
        // Fetch results for the most recent report that contains items
        for (const r of reports.slice(0, 3)) {
          const reportItems = await listResultsForReport(r.id);
          if (reportItems && reportItems.length > 0) {
            if (isMounted) setResults(reportItems);
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

  const issuesCount = useMemo(() => {
    return results.filter((r) => r.range_status === 'below' || r.range_status === 'above').length;
  }, [results]);

  return (
    <div className="h-full bg-surface rounded-3xl border border-line p-5 sm:p-6 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* ── Card Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-content-subtle">
              <LabFlaskIcon size={18} />
            </span>
            <h2 className="text-sm font-bold text-content tracking-tight">Labs</h2>
          </div>

          <Link
            to="/reports"
            className="text-2xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
          >
            View all
          </Link>
        </div>

        {/* ── Biomarkers List ───────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="flex justify-between h-3.5 bg-surface-sunken rounded w-full" />
                <div className="h-2.5 bg-surface-sunken rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : biomarkers.length > 0 ? (
          <div className="space-y-3.5">
            {biomarkers.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-content truncate max-w-[140px]">
                    {item.name}
                  </span>
                  <div className="font-mono text-xs text-right">
                    <span className="font-bold text-content">{item.value}</span>
                    {item.refHigh !== null ? (
                      <span className="text-content-subtle"> / {item.refHigh}</span>
                    ) : item.unit ? (
                      <span className="text-2xs text-content-subtle ml-1">{item.unit}</span>
                    ) : null}
                  </div>
                </div>

                {/* Progress bar with hatched track pattern */}
                <div
                  className="relative w-full h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-ink-800 border border-line/40"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(148, 163, 184, 0.25) 4px, rgba(148, 163, 184, 0.25) 8px)',
                  }}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300 dark:from-sky-500 dark:to-teal-400 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state when no lab results exist */
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-content-muted leading-relaxed">
              {hasReports
                ? 'No biomarker values found in recent reports.'
                : 'No lab reports uploaded yet. Upload a lab report to monitor your biomarkers.'}
            </p>
            <Link
              to="/reports/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-500/10 text-brand-700 dark:text-brand-300 hover:bg-brand-500/20 text-xs font-bold transition-colors"
            >
              Upload Lab Report
            </Link>
          </div>
        )}
      </div>

      {/* ── Bottom AI Assistant Banner ──────────────────────────────── */}
      <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40 p-3.5 flex items-center justify-between gap-3 mt-4">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-sky-900 dark:text-sky-200">
            Clinical Health Summary
          </h3>
          <p className="text-2xs text-sky-800/80 dark:text-sky-300/80 mt-0.5 leading-snug">
            {issuesCount > 0 ? (
              <>
                The assistant has identified{' '}
                <span className="font-bold underline text-sky-950 dark:text-sky-100">
                  {issuesCount} {issuesCount === 1 ? 'issue' : 'issues'}
                </span>{' '}
                that necessitate medical attention.
              </>
            ) : biomarkers.length > 0 ? (
              'All tested biomarkers are currently within typical reference ranges.'
            ) : (
              'Upload your reports to generate automated biomarker tracking.'
            )}
          </p>
        </div>

        <Link
          to="/reports"
          className="w-8 h-8 rounded-full bg-white dark:bg-ink-800 shadow-sm border border-line/60 flex items-center justify-center text-content-muted hover:text-content hover:scale-105 transition-all shrink-0"
          aria-label="Open lab reports"
        >
          <ChevronRightIcon size={16} />
        </Link>
      </div>
    </div>
  );
}
