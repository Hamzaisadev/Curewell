import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ChevronRightIcon } from '../../../components/ui/icons';

export function DrugInteractionRadarCard() {
  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Drug Safety Radar
            </h2>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            All Clear
          </span>
        </div>

        {/* ── Safety Status Card ────────────────────────────────────── */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 mb-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 leading-tight">
                0 Contraindications Found
              </h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-snug">
                Your current prescription regimen has zero adverse drug-to-drug interactions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 text-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-content-subtle">Food/Drug Timing:</span>
            <span className="font-semibold text-content">Compliant</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-subtle">Maternal/Renal Alerts:</span>
            <span className="font-semibold text-content">Safe</span>
          </div>
        </div>
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Continuous automated audit</span>
        <Link to="/assistant" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
          <span>Audit</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </div>
  );
}
