import { useAuth } from '../../lib/auth/AuthContext';
import { SparklesIcon, ShieldIcon, ChevronRightIcon } from '../ui/icons';

interface ShifaPassportBannerProps {
  onOpenPassport: () => void;
}

export function ShifaPassportBanner({ onOpenPassport }: ShifaPassportBannerProps) {
  const { profile, user } = useAuth();

  // If completed in profile or explicitly marked, hide the banner
  if (profile?.onboarding_completed) {
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
        {/* Left: Shifa Avatar & Copy */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-teal-500 to-emerald-400 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center text-teal-600 dark:text-teal-400">
                <SparklesIcon size={20} className="animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1">
                <ShieldIcon size={12} /> Shifa Health Passport
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-200">
                {score}% Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-content mt-0.5">
              Hey {name}! Complete your medical details so Shifa can guard against bad drug interactions.
            </p>
          </div>
        </div>

        {/* Right: Action Button */}
        <button
          type="button"
          onClick={onOpenPassport}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <span>Complete with Shifa</span>
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {/* Progress Track */}
      <div className="mt-3.5 w-full bg-teal-500/20 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-teal-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(score, 15)}%` }}
        />
      </div>
    </div>
  );
}
