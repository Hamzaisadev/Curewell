import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/AuthContext';
import { visitsRepo } from '../../../lib/db';
import type { Visit } from '../../../lib/db/visits';
import { formatDateMedium } from '../../../lib/time';
import { MoreVerticalIcon } from '../../../components/ui/icons';

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

export function PatientInfoCard() {
  const { profile, user } = useAuth();
  const [latestVisit, setLatestVisit] = useState<Visit | null>(null);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    setIsLoadingVisits(true);

    visitsRepo
      .listVisits(profile.id)
      .then((visits) => {
        if (!isMounted) return;
        const diagnosedVisit = visits.find((v) => v.diagnosis) || visits[0] || null;
        setLatestVisit(diagnosedVisit);
      })
      .catch((err) => {
        console.error('Failed to load patient visits for info card:', err);
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

  const ageAndWeight = useMemo(() => {
    const parts: string[] = [];
    if (age !== null) parts.push(`${age} Years`);
    if (weight) parts.push(`${weight} Kg`);
    return parts.length > 0 ? parts.join(' & ') : '—';
  }, [age, weight]);

  const bloodGroup =
    profile?.blood_group && profile.blood_group !== 'unknown' ? profile.blood_group : '—';

  const issueTitle =
    latestVisit?.diagnosis || profile?.chronic_conditions || 'No active conditions';

  const issueDate = latestVisit?.visit_date
    ? formatDateMedium(latestVisit.visit_date)
    : profile?.created_at
      ? formatDateMedium(profile.created_at.split('T')[0] ?? '')
      : null;

  // Generate initials for avatar fallback
  const initials = useMemo(() => {
    if (!fullName) return 'PT';
    const words = fullName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0]![0]! + words[1]![0]!).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }, [fullName]);

  return (
    <div className="bg-surface rounded-3xl border border-line p-4 sm:p-5 shadow-card hover:shadow-raise transition-all duration-200">
      {/* ── Card Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-line/40">
        <h2 className="text-xs font-bold text-content tracking-tight uppercase tracking-wider text-content-muted">
          Patient Info
        </h2>
        <Link
          to="/settings"
          className="p-1 -mr-1 rounded-xl text-content-subtle hover:text-content hover:bg-surface-sunken transition-colors"
          title="Edit Profile"
          aria-label="Edit Profile"
        >
          <MoreVerticalIcon size={16} />
        </Link>
      </div>

      {/* ── Card Body (Tight ~180-200px footprint) ───────────────────── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3.5 sm:gap-5">
        {/* 1. Avatar Container */}
        <div className="w-20 h-20 sm:w-22 sm:h-22 shrink-0 rounded-2xl overflow-hidden bg-brand-500/10 border border-brand-500/20 flex flex-col items-center justify-center text-brand-700 dark:text-brand-300 relative select-none">
          <span className="text-lg sm:text-xl font-black font-mono">{initials}</span>
          <span className="text-[9px] uppercase font-bold tracking-widest opacity-60 mt-0.5">
            Patient
          </span>
        </div>

        {/* 2. Patient Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left space-y-1">
          <h3
            className="text-base sm:text-lg font-bold text-content tracking-tight truncate leading-snug"
            title={fullName}
          >
            {fullName}
          </h3>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-content-subtle font-medium w-24 shrink-0 text-left whitespace-nowrap">
                Gender
              </span>
              <span className="text-content-subtle">:</span>
              <span className="font-semibold text-content truncate">{gender}</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-content-subtle font-medium w-24 shrink-0 text-left whitespace-nowrap">
                Age &amp; Weight
              </span>
              <span className="text-content-subtle">:</span>
              <span className="font-semibold text-content truncate">{ageAndWeight}</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-content-subtle font-medium w-24 shrink-0 text-left whitespace-nowrap">
                Blood Group
              </span>
              <span className="text-content-subtle">:</span>
              <span className="font-bold text-content font-mono">{bloodGroup}</span>
            </div>
          </div>
        </div>

        {/* 3. Issues Sub-Card */}
        <div className="w-full sm:w-56 md:w-64 lg:w-72 shrink-0 rounded-2xl bg-surface-sunken/80 dark:bg-ink-800/40 border border-line/60 p-3 flex flex-col justify-between">
          <div>
            <p className="text-2xs font-bold text-content-subtle uppercase tracking-wider">
              Issues
            </p>
            <p
              className="text-xs font-bold text-content mt-1 leading-snug line-clamp-2 break-words"
              title={issueTitle}
            >
              {isLoadingVisits ? 'Loading...' : issueTitle}
            </p>
          </div>

          {issueDate && (
            <p className="text-2xs text-content-subtle mt-2 font-mono">
              Date: {issueDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
