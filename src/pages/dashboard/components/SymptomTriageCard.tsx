import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { sideEffectsRepo } from '../../../lib/db';
import type { SideEffect } from '../../../lib/db/sideEffects';
import { AlertTriangleIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { ShieldCheck } from 'lucide-react';

export function SymptomTriageCard() {
  const { profile } = useAuth();
  const [effects, setEffects] = useState<SideEffect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    setIsLoading(true);

    sideEffectsRepo
      .listSideEffects(profile.id)
      .then((data) => {
        if (!isMounted) return;
        setEffects(data.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load side effects for dashboard card:', err);
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
            <span className="text-amber-500">
              <AlertTriangleIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
              Symptom Tracker
            </h2>
          </div>

          <Link
            to="/symptoms"
            className="text-2xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            <span>Triage</span>
            <ChevronRightIcon size={13} />
          </Link>
        </div>

        {/* ── Red Flag Safety Status ────────────────────────────────── */}
        <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center gap-2.5 mb-3">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={14} className="stroke-[2.5]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-tight">
              No Red Flags Active
            </p>
            <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 truncate">
              Vitals &amp; symptoms within safe bounds
            </p>
          </div>
        </div>

        {/* ── Recent Logged Symptoms ────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2 py-1 animate-pulse">
            <div className="h-9 rounded-xl bg-surface-sunken" />
            <div className="h-9 rounded-xl bg-surface-sunken" />
          </div>
        ) : effects.length > 0 ? (
          <div className="space-y-2">
            {effects.map((e) => (
              <div
                key={e.id}
                className="p-2 rounded-xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 flex items-center justify-between text-2xs"
              >
                <span className="font-semibold text-content truncate">
                  {e.note || e.medicine_name || 'Reported Symptom'}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider text-[9px] ${
                    e.severity === 'mild'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : e.severity === 'moderate'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {e.severity || 'Logged'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="text-2xs text-content-muted">No adverse symptoms logged recently</p>
            <Link
              to="/symptoms"
              className="inline-block mt-0.5 text-2xs font-bold text-brand-600 hover:underline"
            >
              + Log New Symptom
            </Link>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Clinical triage checker</span>
        <Link to="/symptoms" className="font-bold text-brand-600 hover:underline">
          Check &rarr;
        </Link>
      </div>
    </div>
  );
}
