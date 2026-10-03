import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { sideEffectsRepo } from '../../../lib/db';
import type { SideEffect } from '../../../lib/db/sideEffects';
import { checkRedFlags } from '../../../domain/redFlags';
import { formatDateMedium } from '../../../lib/time';
import { AlertTriangleIcon, ChevronRightIcon } from '../../../components/ui/icons';
import { ShieldCheck, AlertTriangle, PhoneCall } from 'lucide-react';

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

  // Evaluate red flag state dynamically across all logged symptoms
  const activeRedFlag = useMemo(() => {
    return effects.find((e) => {
      const isSevere = e.severity === 'severe';
      const flagResult = checkRedFlags(`${e.note || ''} ${e.medicine_name || ''}`);
      return isSevere || flagResult.isEmergency;
    });
  }, [effects]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className={activeRedFlag ? 'text-rose-600' : 'text-amber-500'}>
              <AlertTriangleIcon size={16} />
            </span>
            <h2 className="text-xs font-bold text-content uppercase tracking-wider text-content-muted">
              Symptom Tracker &amp; Triage
            </h2>
          </div>

          <Link
            to="/symptoms"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            <span>Triage</span>
            <ChevronRightIcon size={13} />
          </Link>
        </div>

        {/* ── Red Flag Safety Status (Truthful Dynamic State) ────────── */}
        {activeRedFlag ? (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 mb-3 animate-pulse">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle size={14} className="stroke-[2.5]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200 leading-tight">
                  Critical Alert: Severe Symptom Active
                </p>
                <p className="text-2xs text-rose-800/90 dark:text-rose-300/90 mt-1 leading-normal font-medium">
                  &ldquo;{activeRedFlag.note || activeRedFlag.medicine_name}&rdquo; requires immediate medical evaluation. Do not delay emergency care.
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <a
                    href="tel:1122"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <PhoneCall size={12} />
                    <span>Call 1122 Ambulance</span>
                  </a>
                  <Link
                    to="/symptoms"
                    className="text-2xs font-bold text-rose-700 dark:text-rose-300 hover:underline"
                  >
                    Open Triage &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : effects.length > 0 ? (
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-2.5 mb-3">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={13} className="stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-tight">
                {effects.length} Reported Symptom{effects.length > 1 ? 's' : ''} Monitored
              </p>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                No immediate red-flag thresholds breached
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center gap-2.5 mb-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={14} className="stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-tight">
                All Symptoms Stable
              </p>
              <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                No active red flags or severe discomfort logged
              </p>
            </div>
          </div>
        )}

        {/* ── Recent Logged Symptoms List (Full visibility, no truncation) ─ */}
        {isLoading ? (
          <div className="space-y-2 py-1 animate-pulse">
            <div className="h-10 rounded-xl bg-surface-sunken" />
            <div className="h-10 rounded-xl bg-surface-sunken" />
          </div>
        ) : effects.length > 0 ? (
          <div className="space-y-2">
            {effects.map((e) => (
              <div
                key={e.id}
                className="p-2.5 rounded-xl bg-surface-sunken/60 dark:bg-ink-900/30 border border-line/40 flex items-start justify-between gap-3 text-2xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-content block leading-tight text-xs">
                    {e.note || e.medicine_name || 'Reported Symptom'}
                  </span>
                  <span className="text-[10px] text-content-subtle mt-0.5 block font-mono">
                    {e.occurred_at ? formatDateMedium(e.occurred_at.split('T')[0] ?? '') : 'Logged recently'}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] shrink-0 ${
                    e.severity === 'mild'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : e.severity === 'moderate'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black'
                  }`}
                >
                  {e.severity || 'Logged'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center">
            <p className="text-2xs text-content-muted">No adverse symptoms logged recently</p>
            <Link
              to="/symptoms"
              className="inline-block mt-1 text-2xs font-bold text-brand-600 hover:underline"
            >
              + Log New Symptom
            </Link>
          </div>
        )}
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Clinical triage protocol</span>
        <Link to="/symptoms" className="font-bold text-brand-600 hover:underline">
          Check Symptoms &rarr;
        </Link>
      </div>
    </div>
  );
}
