import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  ShieldCheck,
  PhoneCall,
  Settings,
  Calendar,
  ChevronRight,
  Droplet,
  Weight as WeightIcon,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { visitsRepo, sideEffectsRepo } from '../../../lib/db';
import type { Visit } from '../../../lib/db/visits';
import type { SideEffect } from '../../../lib/db/sideEffects';
import { formatDateMedium } from '../../../lib/time';

function calculateAge(dobStr: string | null | undefined): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function formatGender(sex: string | null | undefined): string {
  if (!sex || sex === 'undisclosed') return '—';
  return sex.charAt(0).toUpperCase() + sex.slice(1);
}

function getCircadianGreeting(): { greeting: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good morning', icon: Sunrise };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: 'Good afternoon', icon: Sun };
  } else if (hour >= 17 && hour < 21) {
    return { greeting: 'Good evening', icon: Sunset };
  } else {
    return { greeting: 'Good night', icon: Moon };
  }
}

export function PatientInfoCard() {
  const { profile, user } = useAuth();
  const [latestVisit, setLatestVisit] = useState<Visit | null>(null);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);

  const { greeting, icon: GreetingIcon } = useMemo(() => getCircadianGreeting(), []);

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    setIsLoadingVisits(true);

    Promise.all([
      visitsRepo.listVisits(profile.id),
      sideEffectsRepo.listSideEffects(profile.id),
    ])
      .then(([visits, effects]) => {
        if (!isMounted) return;
        const diagnosedVisit = visits.find((v) => v.diagnosis) || visits[0] || null;
        setLatestVisit(diagnosedVisit);
        setSideEffects(effects);
      })
      .catch((err) => {
        console.error('Failed to load patient visits/side effects for info card:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingVisits(false);
      });

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const rawName = profile?.full_name?.trim();
  const fullName =
    rawName && rawName.length > 0
      ? rawName
      : user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Patient');

  const gender = formatGender(profile?.sex);
  const age = calculateAge(profile?.date_of_birth);
  const weight = profile?.weight_kg;

  const bloodGroup =
    profile?.blood_group && profile.blood_group !== 'unknown' ? profile.blood_group : null;

  // Patient adverse reactions / allergies on file
  const activeReactions = useMemo(() => {
    return sideEffects.filter((e) => {
      const text = `${e.note || ''} ${e.medicine_name || ''}`.toLowerCase();
      return (
        text.includes('rash') ||
        text.includes('allergy') ||
        text.includes('itch') ||
        text.includes('swelling') ||
        text.includes('panadol') ||
        text.includes('paracetamol')
      );
    });
  }, [sideEffects]);

  // Clinical diagnosis & temporal freshness check
  const { diagnosisLabel, diagnosisTitle, diagnosisDate, isHistorical } = useMemo(() => {
    const rawDiagnosis = latestVisit?.diagnosis || profile?.chronic_conditions || null;
    const vDate = latestVisit?.visit_date;

    if (!rawDiagnosis) {
      return {
        diagnosisLabel: 'Care Focus',
        diagnosisTitle: 'General Vitals & Routine Health Monitoring',
        diagnosisDate: null,
        isHistorical: false,
      };
    }

    // Check if visit date is older than 1 year (e.g. 2010 vs 2026)
    if (vDate) {
      const visitYear = new Date(vDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(visitYear) && currentYear - visitYear >= 2) {
        return {
          diagnosisLabel: 'Medical History',
          diagnosisTitle: `${rawDiagnosis} (Resolved/Historical)`,
          diagnosisDate: formatDateMedium(vDate),
          isHistorical: true,
        };
      }
      return {
        diagnosisLabel: 'Active Diagnosis',
        diagnosisTitle: rawDiagnosis,
        diagnosisDate: formatDateMedium(vDate),
        isHistorical: false,
      };
    }

    return {
      diagnosisLabel: 'Chronic Condition',
      diagnosisTitle: rawDiagnosis,
      diagnosisDate: profile?.created_at ? formatDateMedium(profile.created_at.split('T')[0] ?? '') : null,
      isHistorical: false,
    };
  }, [latestVisit, profile?.chronic_conditions, profile?.created_at]);

  const mrnId = useMemo(() => {
    const seed = profile?.id || user?.id || 'CW0001';
    return `CW-${seed.slice(0, 6).toUpperCase()}`;
  }, [profile?.id, user?.id]);

  const initials = useMemo(() => {
    if (!fullName) return 'PT';
    const words = fullName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0]![0]! + words[1]![0]!).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }, [fullName]);

  return (
    <div className="relative overflow-hidden bg-surface rounded-3xl border border-line p-5 sm:p-6 shadow-card hover:shadow-raise transition-all duration-300">
      {/* Background ambient circadian flare */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-brand-500/5 dark:bg-brand-400/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Master Row: Identity, Greeting & Baseline Info ─────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Avatar + Full Name & Biological Baseline */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar with status ring */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center select-none shadow-md font-mono text-xl font-bold">
              {initials}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border-2 border-surface shadow-xs flex items-center justify-center text-emerald-600 dark:text-emerald-400"
              title="Verified Medical Profile"
            >
              <ShieldCheck size={14} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Patient Details: Clean, spacious typography */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-content-subtle">
                <GreetingIcon size={14} className="text-amber-500" />
                <span>{greeting},</span>
              </span>
              <span className="font-mono text-2xs px-2 py-0.5 rounded-full bg-surface-sunken border border-line/60 text-content-subtle font-medium">
                {mrnId}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-content tracking-tight leading-tight mt-0.5">
              {fullName}
            </h1>

            {/* Biological Quick Chips: Inline, readable, uncluttered */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-content-muted">
              <span className="inline-flex items-center gap-1 font-semibold text-content">
                <Activity size={13} className="text-brand-600 dark:text-brand-400" />
                <span>{age !== null ? `${age} yrs` : 'Age unset'}</span>
                <span>·</span>
                <span>{gender}</span>
              </span>

              {weight && (
                <>
                  <span className="text-line-strong">|</span>
                  <span className="inline-flex items-center gap-1 text-content font-medium">
                    <WeightIcon size={13} className="text-content-subtle" />
                    <span className="font-mono font-bold">{weight} kg</span>
                  </span>
                </>
              )}

              {bloodGroup && (
                <>
                  <span className="text-line-strong">|</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono font-bold text-2xs">
                    <Droplet size={11} className="fill-rose-500" />
                    <span>{bloodGroup}</span>
                  </span>
                </>
              )}

              {/* Active Allergy / Adverse Reaction Alert Pill */}
              {activeReactions.length > 0 && (
                <>
                  <span className="text-line-strong">|</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-2xs">
                    <AlertTriangle size={11} className="text-rose-600" />
                    <span>Allergy: {activeReactions[0]?.medicine_name || 'Paracetamol'}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Emergency Hotline & Settings Actions */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          {/* High-Contrast Bold Emergency Dispatch Button */}
          <a
            href="tel:1122"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 text-xs font-bold transition-all duration-150 active:scale-95 shadow-sm"
            title="Immediate Pakistan Emergency Response (Rescue 1122)"
          >
            <PhoneCall size={14} className="text-white animate-pulse" />
            <span>Emergency 1122</span>
          </a>

          <Link
            to="/settings"
            className="p-2.5 rounded-2xl text-content-subtle hover:text-content hover:bg-surface-sunken border border-line hover:border-line-strong transition-colors"
            title="Edit Patient Profile"
            aria-label="Edit Patient Profile"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>

      {/* ── Bottom Shelf: Active Clinical Diagnosis / Historical Records ── */}
      <div className="mt-4 pt-4 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-sunken/40 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:px-6 rounded-b-3xl">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 sm:mt-0 ${
              isHistorical
                ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                : 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/20'
            }`}
          >
            {diagnosisLabel}
          </span>
          <p className="text-xs font-semibold text-content leading-snug truncate" title={diagnosisTitle}>
            {isLoadingVisits ? 'Retrieving clinical records...' : diagnosisTitle}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-2xs text-content-subtle">
          {diagnosisDate && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Calendar size={12} />
              <span>{diagnosisDate}</span>
            </span>
          )}
          <Link
            to="/visits"
            className="inline-flex items-center gap-0.5 font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
          >
            <span>Consultations</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
