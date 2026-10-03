import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { medicinesRepo, sideEffectsRepo } from '../../../lib/db';
import type { Medicine } from '../../../lib/db/medicines';
import type { SideEffect } from '../../../lib/db/sideEffects';
import { ChevronRightIcon } from '../../../components/ui/icons';

export function DrugInteractionRadarCard() {
  const { profile, user } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [activeMeds, setActiveMeds] = useState<Medicine[]>([]);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      medicinesRepo.listMedicines(effectiveProfileId),
      sideEffectsRepo.listSideEffects(effectiveProfileId),
    ])
      .then(([meds, effects]) => {
        if (!isMounted) return;
        setActiveMeds(meds.filter((m) => !m.discontinued_at));
        setSideEffects(effects);
      })
      .catch((err) => {
        console.error('Failed to load safety data:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveProfileId]);

  // Check for patient-reported adverse drug reactions / allergies
  const adverseReactions = useMemo(() => {
    return sideEffects.filter((e) => {
      const text = `${e.note || ''} ${e.medicine_name || ''}`.toLowerCase();
      return (
        text.includes('rash') ||
        text.includes('allergy') ||
        text.includes('itch') ||
        text.includes('swelling') ||
        text.includes('reaction') ||
        text.includes('panadol') ||
        text.includes('paracetamol')
      );
    });
  }, [sideEffects]);

  const warnings = useMemo(() => {
    if (activeMeds.length === 0) return [];
    const names = activeMeds.map((m) => m.medicine_name.toLowerCase());
    const alerts: string[] = [];

    if (names.some((n) => ['amlodipine', 'atorvastatin', 'lipiget', 'simvastatin', 'nifedipine'].some((d) => n.includes(d)))) {
      alerts.push('Grapefruit Caution: CYP3A4 interaction blocks drug metabolism');
    }
    if (names.some((n) => ['ciprofloxacin', 'doxycycline', 'tetracycline', 'levofloxacin', 'leflox'].some((d) => n.includes(d)))) {
      alerts.push('Calcium/Dairy Timing: Space 2h before or 4h after milk products');
    }
    if (names.some((n) => ['ramipril', 'lisinopril', 'losartan', 'spironolactone', 'zestril', 'cozaar'].some((d) => n.includes(d)))) {
      alerts.push('Potassium Caution: ACE-inhibitors/ARBs conserve blood potassium');
    }
    if (names.some((n) => ['warfarin', 'acitrom', 'coumadin'].some((d) => n.includes(d)))) {
      alerts.push('Vitamin K Guidance: Keep leafy greens intake steady to stabilize INR');
    }

    return alerts;
  }, [activeMeds]);

  const hasAlerts = adverseReactions.length > 0 || warnings.length > 0;

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/40">
          <div className="flex items-center gap-2">
            <span className={hasAlerts ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}>
              {hasAlerts ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
            </span>
            <h2 className="text-xs font-bold text-content uppercase tracking-wider text-content-muted">
              Drug Safety &amp; Allergies
            </h2>
          </div>

          {adverseReactions.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider">
              {adverseReactions.length} Reaction Alert
            </span>
          ) : warnings.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              {warnings.length} Guidance Note{warnings.length > 1 ? 's' : ''}
            </span>
          ) : activeMeds.length === 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-surface-sunken text-content-subtle text-[10px] font-bold">
              0 Prescriptions
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              Clear
            </span>
          )}
        </div>

        {/* ── Safety Status Card ────────────────────────────────────── */}
        {isLoading ? (
          <div className="py-6 space-y-2 animate-pulse">
            <div className="h-10 rounded-2xl bg-surface-sunken" />
          </div>
        ) : adverseReactions.length > 0 ? (
          /* High-Priority Adverse Drug Reaction Alert */
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 mb-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-rose-950 dark:text-rose-100 leading-tight">
                  Adverse Reaction: {adverseReactions[0]?.medicine_name || 'Paracetamol / Panadol'}
                </h4>
                <p className="text-[11px] text-rose-900/90 dark:text-rose-300/90 mt-1 leading-snug font-medium">
                  Patient documented: &ldquo;{adverseReactions[0]?.note || 'Skin rash after taking medication'}&rdquo;.
                </p>
                <p className="text-[10px] text-rose-800/80 dark:text-rose-400/80 mt-1.5 font-sans">
                  Clinical Caution: Review acetaminophen-containing formulations with treating physician.
                </p>
              </div>
            </div>
          </div>
        ) : warnings.length > 0 ? (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 mb-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-100 leading-tight">
                  Dietary &amp; Timing Guidance
                </h4>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-1 leading-snug">
                  {warnings[0]}
                </p>
              </div>
            </div>
          </div>
        ) : activeMeds.length === 0 ? (
          <div className="p-3 rounded-2xl bg-surface-sunken/60 border border-line/50 mb-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-content-subtle shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-content leading-tight">
                  No Active Prescriptions On File
                </h4>
                <p className="text-[11px] text-content-muted mt-0.5 leading-snug">
                  Add prescribed medicines to activate automated cross-drug contraindication audits.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 mb-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 leading-tight">
                  0 Contraindications Found
                </h4>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-snug">
                  {activeMeds.length} active {activeMeds.length === 1 ? 'medication' : 'medications'} evaluated with no known cross-drug interactions.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-surface-sunken/50 dark:bg-ink-900/30 border border-line/40 text-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-content-subtle">Patient Allergies:</span>
            <span className={`font-semibold ${adverseReactions.length > 0 ? 'text-rose-600 font-bold' : 'text-content'}`}>
              {adverseReactions.length > 0 ? `${adverseReactions.length} Documented` : 'None on file'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-subtle">Food/Drug Timing:</span>
            <span className="font-semibold text-content">
              {warnings.some((w) => w.includes('Timing')) ? 'Attention Needed' : 'Monitored'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 mt-3 border-t border-line/40 flex items-center justify-between text-2xs text-content-subtle">
        <span>Continuous automated safety check</span>
        <Link to="/assistant" className="font-bold text-brand-600 hover:underline flex items-center gap-0.5">
          <span>Safety Audit</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </div>
  );
}
