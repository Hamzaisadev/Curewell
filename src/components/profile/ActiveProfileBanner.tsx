import { useAuth } from '../../lib/auth/AuthContext';
import { ShieldIcon } from '../ui/icons';

export function ActiveProfileBanner() {
  const { activeProfile, profiles, switchProfile } = useAuth();

  if (!activeProfile || activeProfile.relationship === 'self' || activeProfile.is_default) {
    return null;
  }

  const defaultProfile = profiles.find((p) => p.is_default || p.relationship === 'self');
  const relationshipLabel = activeProfile.relationship
    ? activeProfile.relationship.charAt(0).toUpperCase() + activeProfile.relationship.slice(1)
    : 'Family Member';

  return (
    <div
      role="status"
      aria-live="polite"
      className="p-3.5 sm:px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in-0 duration-200 shadow-2xs"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
          <ShieldIcon size={14} />
        </span>
        <div className="truncate">
          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400 block sm:inline sm:mr-2">
            Caregiver Mode
          </span>
          <span className="text-content">
            You are logging health records for{' '}
            <strong className="font-bold text-amber-900 dark:text-amber-100">
              {activeProfile.full_name}
            </strong>{' '}
            ({relationshipLabel})
          </span>
        </div>
      </div>

      {defaultProfile && (
        <button
          type="button"
          onClick={() => switchProfile(defaultProfile.id)}
          className="self-end sm:self-center shrink-0 font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 hover:underline cursor-pointer text-xs"
        >
          Switch back to Self &rarr;
        </button>
      )}
    </div>
  );
}
