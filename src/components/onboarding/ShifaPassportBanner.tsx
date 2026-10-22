import { useAuth } from '../../lib/auth/AuthContext';
import { ShieldCheckIcon, ChevronRightIcon } from '../ui/icons';

interface ShifaPassportBannerProps {
  onOpenPassport: () => void;
}

export function ShifaPassportBanner({ onOpenPassport }: ShifaPassportBannerProps) {
  const { profile, user } = useAuth();

  const localCompleted = profile?.id ? localStorage.getItem(`curewell_onboarding_completed_${profile.id}`) === 'true' : false;

  // If completed in profile or explicitly marked, hide the banner
  if (profile?.onboarding_completed || localCompleted) {
    return null;
  }

  // Calculate completeness score
  let score = 0;
  if (profile?.blood_group && profile.blood_group !== 'unknown') score += 25;
  if (profile?.chronic_conditions) score += 25;
  if (profile?.allergies) score += 25;
  if (profile?.emergency_contact_phone) score += 25;

  // If 100% complete even without the boolean flag, hide it
  if (score >= 100) {
    return null;
  }

  const name = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-brand-500/5 to-emerald-500/10 p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Health Passport Emblem & Copy */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="relative shrink-0 mt-0.5 sm:mt-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 p-0.5 shadow-sm flex items-center justify-center ring-1 ring-teal-500/20">
              <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center text-teal-600 dark:text-teal-400">
                <ShieldCheckIcon size={22} className="stroke-[2.2]" />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Patient Health Profile
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-200">
                {score}% Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-content mt-1 leading-snug">
              Hey {name}! Complete your medical details so Shifa can guard against bad drug interactions.
            </p>
          </div>
        </div>

        {/* Right: Action Button */}
        <button
          type="button"
          onClick={onOpenPassport}
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          <span>Complete Health Profile</span>
          <ChevronRightIcon size={16} />
        </button>
      </div>

      {/* Progress Track */}
      <div
        className="mt-4 w-full bg-teal-500/20 dark:bg-teal-950/40 h-2 rounded-full overflow-hidden p-0.5"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Patient health profile completion progress"
      >
        <div
          className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs"
          style={{ width: `${Math.max(score, 12)}%` }}
        />
      </div>
    </div>
  );
}
