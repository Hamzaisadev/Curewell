import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { clsx } from 'clsx';
import { useAuth } from '../../lib/auth/AuthContext';
import { AddFamilyProfileModal } from './AddFamilyProfileModal';
import {
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
  SettingsIcon,
} from '../ui/icons';

function getRelationshipEmoji(relationship?: string | null): string {
  switch (relationship) {
    case 'parent':
      return '👴';
    case 'spouse':
      return '💍';
    case 'child':
      return '🧒';
    case 'self':
      return '👤';
    default:
      return '👥';
  }
}

function getRelationshipColor(relationship?: string | null): string {
  switch (relationship) {
    case 'parent':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'spouse':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    case 'child':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
    case 'self':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    default:
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
  }
}

export function ProfileSwitcher() {
  const { profiles, activeProfile, switchProfile, isGuest } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isGuest || !activeProfile) return null;

  const relationshipLabel =
    activeProfile.relationship === 'self'
      ? 'Self'
      : activeProfile.relationship
      ? activeProfile.relationship.charAt(0).toUpperCase() + activeProfile.relationship.slice(1)
      : 'Family';

  const shortName = activeProfile.full_name?.split(' ')[0] || 'Patient';
  const emoji = getRelationshipEmoji(activeProfile.relationship);
  const colorClasses = getRelationshipColor(activeProfile.relationship);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className={clsx(
            'inline-flex items-center gap-1.5 h-10 px-2 sm:px-3 rounded-full border transition-all cursor-pointer max-w-[125px] sm:max-w-none shrink min-w-0',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            colorClasses,
            'hover:shadow-xs'
          )}
          aria-label={`Switch profile: currently ${activeProfile.full_name}`}
        >
          <span className="text-sm select-none shrink-0" aria-hidden="true">
            {emoji}
          </span>
          <span className="text-xs font-bold truncate max-w-16 sm:max-w-28 md:max-w-36 text-content">
            {shortName}
          </span>
          {activeProfile.relationship !== 'self' && (
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full bg-surface/80 border border-line text-[10px] font-semibold text-content-muted">
              {relationshipLabel}
            </span>
          )}
          <ChevronDownIcon size={12} className="text-content-subtle shrink-0 ml-0.5" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-64 max-w-xs rounded-2xl border border-line bg-surface-raised shadow-over p-1.5 animate-in fade-in-0 zoom-in-95"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-line mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-content-subtle">
                Caregiver Profile Switcher
              </p>
              <p className="text-xs text-content-muted mt-0.5">
                Switch who you are tracking doses and vitals for:
              </p>
            </div>

            {/* Profile List */}
            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                const pEmoji = getRelationshipEmoji(p.relationship);
                const pRel =
                  p.relationship === 'self'
                    ? 'Self'
                    : p.relationship
                    ? p.relationship.charAt(0).toUpperCase() + p.relationship.slice(1)
                    : 'Dependent';

                return (
                  <DropdownMenu.Item
                    key={p.id}
                    onSelect={() => switchProfile(p.id)}
                    className={clsx(
                      'flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs cursor-pointer select-none outline-none transition-colors',
                      isActive
                        ? 'bg-accent-subtle text-accent-onsubtle font-bold'
                        : 'text-content hover:bg-surface-hover'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base select-none shrink-0">{pEmoji}</span>
                      <div className="truncate">
                        <p className="font-bold text-xs truncate text-content">{p.full_name}</p>
                        <p className="text-[10px] text-content-muted truncate">
                          {pRel}
                          {p.chronic_conditions && ` • ${p.chronic_conditions}`}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-accent shrink-0">
                        <CheckIcon size={14} />
                      </span>
                    )}
                  </DropdownMenu.Item>
                );
              })}
            </div>

            <DropdownMenu.Separator className="my-1.5 h-px bg-line" />

            {/* Add Family Profile Action */}
            <DropdownMenu.Item
              onSelect={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-accent hover:bg-accent-subtle cursor-pointer select-none outline-none transition-colors"
            >
              <span className="p-1 rounded-lg bg-accent-subtle text-accent shrink-0">
                <PlusIcon size={13} />
              </span>
              <span>+ Add Family Member (Dad, Mom, Child)</span>
            </DropdownMenu.Item>

            {/* Settings Link */}
            <DropdownMenu.Item asChild>
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-content-muted hover:text-content hover:bg-surface-hover cursor-pointer select-none outline-none transition-colors"
              >
                <SettingsIcon size={13} className="shrink-0 text-content-subtle" />
                <span>Manage Family Profiles</span>
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Add Family Profile Modal */}
      <AddFamilyProfileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}
