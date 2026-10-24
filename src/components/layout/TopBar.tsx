import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { clsx } from 'clsx';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../lib/auth/AuthContext';
import { PRIMARY_NAV, SECONDARY_NAV, isNavItemActive } from './navigation';
import { AddFamilyProfileModal } from '../profile/AddFamilyProfileModal';
import { MobileCompanionModal } from '../companion/MobileCompanionModal';
import {
  SearchIcon,
  PlusIcon,
  ChevronDownIcon,
  SettingsIcon,
  FileTextIcon,
  LogOutIcon,
  AndroidIcon,
  CheckIcon,
} from '../ui/icons';

const menuPanel = clsx(
  'z-50 min-w-56 rounded-[var(--radius-lg)] border border-line bg-surface-raised shadow-over p-1.5',
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
);

const menuItem = clsx(
  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-content-muted',
  'cursor-pointer select-none outline-none transition-colors',
  'data-[highlighted]:bg-surface-hover data-[highlighted]:text-content'
);

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

export function TopBar() {
  const location = useLocation();
  const { user, profile, activeProfile, profiles, switchProfile, isGuest, signOut } = useAuth();
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);

  // Radix closes on select, but a route change driven by anything else (back
  // button, redirect) should close it too.
  const [menuKey, setMenuKey] = useState(0);
  useEffect(() => setMenuKey((k) => k + 1), [location.pathname]);

  // Track xl viewport (>= 1280px) to show/hide overflow nav items responsively
  const [isXl, setIsXl] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 1280px)');
    const handler = (e: MediaQueryListEvent) => setIsXl(e.matches);
    setIsXl(mq.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password';

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-line bg-surface/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center rounded-[var(--radius-sm)]" aria-label="Curewell home">
            <Logo size="md" />
          </Link>
          <Link
            to={location.pathname === '/login' ? '/signup' : '/login'}
            className="inline-flex items-center h-9 px-3 sm:px-4 text-xs font-bold rounded-lg border border-line bg-surface-raised text-content hover:bg-surface-hover transition-colors"
          >
            {location.pathname === '/login' ? 'Create account' : 'Sign in'}
          </Link>
        </div>
      </header>
    );
  }

  const isMoreActive =
    SECONDARY_NAV.some(
      (item) => item.path !== '/settings' && isNavItemActive(item.path, location.pathname)
    ) ||
    (!isXl &&
      (isNavItemActive('/reports', location.pathname) ||
        isNavItemActive('/symptoms', location.pathname)));
  const displayName = profile?.full_name || user?.email || 'Patient';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-surface/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8 min-w-0">
        <Link
          to="/"
          className="flex items-center shrink-0 rounded-[var(--radius-sm)]"
          aria-label="Curewell home"
        >
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0" aria-label="Main">
          {PRIMARY_NAV.map((link) => {
            const active = isNavItemActive(link.path, location.pathname);

            if (link.prominent) {
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'group relative inline-flex items-center gap-1.5 px-3 py-1.5 mx-0.5 text-xs font-semibold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0',
                    active
                      ? 'bg-accent text-content-onaccent shadow-xs border border-accent ring-2 ring-accent/20'
                      : 'bg-accent-subtle/70 text-accent-onsubtle border border-accent/30 hover:border-accent hover:bg-accent-subtle'
                  )}
                >
                  <span
                    className={clsx(
                      'shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6',
                      active ? 'text-content-onaccent' : 'text-accent'
                    )}
                  >
                    {link.icon(14)}
                  </span>
                  <span>{link.label}</span>
                </Link>
              );
            }

            // On md and lg screens (1024-1279px), move Lab reports and Symptom check to More dropdown
            const isSecondaryOnMdLg = link.path === '/reports' || link.path === '/symptoms';

            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  isSecondaryOnMdLg ? 'hidden xl:inline-flex' : 'inline-flex',
                  'px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0',
                  active
                    ? 'bg-accent-subtle text-accent-onsubtle font-semibold'
                    : 'text-content-muted hover:text-content hover:bg-surface-hover'
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Radix rather than a hand-rolled dropdown: the previous version had no
              arrow-key navigation, no Escape handling and no aria-expanded. */}
          <DropdownMenu.Root key={`more-${menuKey}`}>
            <DropdownMenu.Trigger
              className={clsx(
                'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                isMoreActive
                  ? 'bg-accent-subtle text-accent-onsubtle font-semibold'
                  : 'text-content-muted hover:text-content hover:bg-surface-hover',
                'data-[state=open]:bg-surface-hover data-[state=open]:text-content'
              )}
            >
              More
              <ChevronDownIcon
                size={13}
                className="transition-transform data-[state=open]:rotate-180 text-content-subtle"
              />
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content align="start" sideOffset={8} className={clsx(menuPanel, 'w-72')}>
                <DropdownMenu.Label className="px-3 py-2 text-2xs font-bold uppercase tracking-wide text-content-subtle">
                  Health tools
                </DropdownMenu.Label>

                {/* Show Lab reports and Symptom check inside More when below xl screen width */}
                {PRIMARY_NAV.filter((item) => item.path === '/reports' || item.path === '/symptoms').map((item) => {
                  const active = isNavItemActive(item.path, location.pathname);
                  return (
                    <DropdownMenu.Item key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={clsx(menuItem, 'xl:hidden', active && 'bg-accent-subtle text-accent-onsubtle')}
                      >
                        <span className="shrink-0 text-content-subtle">{item.icon(17)}</span>
                        <span className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{item.label}</span>
                          {item.description && (
                            <span className="text-2xs text-content-subtle truncate">
                              {item.description}
                            </span>
                          )}
                        </span>
                      </Link>
                    </DropdownMenu.Item>
                  );
                })}

                {SECONDARY_NAV.filter((item) => item.path !== '/settings').map((item) => {
                  const active = isNavItemActive(item.path, location.pathname);
                  return (
                    <DropdownMenu.Item key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={clsx(menuItem, active && 'bg-accent-subtle text-accent-onsubtle')}
                      >
                        <span className="shrink-0 text-content-subtle">{item.icon(17)}</span>
                        <span className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{item.label}</span>
                          {item.description && (
                            <span className="text-2xs text-content-subtle truncate">
                              {item.description}
                            </span>
                          )}
                        </span>
                      </Link>
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            to="/search"
            aria-label="Search records"
            className={clsx(
              'inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0',
              location.pathname === '/search'
                ? 'bg-surface-hover text-content'
                : 'text-content-muted hover:bg-surface-hover hover:text-content'
            )}
          >
            <SearchIcon size={17} />
          </Link>

          {isGuest ? (
            <Link
              to="/login"
              className="inline-flex items-center h-9 px-4 text-xs font-bold rounded-lg border border-line bg-surface-raised text-content hover:bg-surface-hover transition-colors shrink-0"
            >
              Sign in
            </Link>
          ) : (
            <>
              {/* Mobile Companion & APK Button - compact label on md/lg to prevent header overflow */}
              <button
                type="button"
                onClick={() => setIsCompanionModalOpen(true)}
                title="Get Curewell Phone App & Android APK"
                aria-label="Curewell Mobile App & Android APK"
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-medium text-content-muted hover:text-content hover:bg-surface-hover border border-line/70 transition-colors shrink-0"
              >
                <AndroidIcon size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="hidden xl:inline">Phone App / APK</span>
                <span className="hidden md:inline xl:hidden">APK</span>
              </button>

              <DropdownMenu.Root key={`user-${menuKey}`}>
                <DropdownMenu.Trigger
                  className={clsx(
                    'inline-flex items-center gap-1.5 h-9 px-2 sm:px-2.5 rounded-lg border border-line/70 transition-colors shrink-0',
                    'text-content-muted hover:text-content hover:bg-surface-hover',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    'data-[state=open]:bg-surface-hover'
                  )}
                  aria-label="Account menu"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-6 h-6 rounded-full object-cover border border-line shrink-0"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-accent text-content-onaccent flex items-center justify-center text-[11px] font-bold shrink-0">
                      {userInitial}
                    </span>
                  )}
                  <span className="text-xs font-semibold hidden xl:inline-block max-w-24 truncate text-content">
                    {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDownIcon size={12} className="text-content-subtle shrink-0" />
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={8} className={clsx(menuPanel, 'w-72 sm:w-80')}>
                    <div className="px-3 py-2.5 border-b border-line mb-1 flex items-center gap-2.5">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-accent text-content-onaccent flex items-center justify-center text-sm font-bold shrink-0">
                          {userInitial}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-content truncate">
                            {profile?.full_name || 'Patient'}
                          </p>
                          {activeProfile?.relationship && activeProfile.relationship !== 'self' && (
                            <span className="px-1.5 py-0.2 rounded-full bg-accent-subtle text-accent-onsubtle text-[10px] font-semibold shrink-0">
                              {activeProfile.relationship.charAt(0).toUpperCase() + activeProfile.relationship.slice(1)}
                            </span>
                          )}
                        </div>
                        {user?.email && (
                          <p className="text-xs text-content-subtle truncate">{user.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Caregiver Profile Switcher */}
                    {profiles && profiles.length > 0 && (
                      <div className="pb-1">
                        <div className="px-3 pt-1 pb-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-content-subtle">
                            Caregiver Profiles
                          </p>
                          <p className="text-2xs text-content-muted">
                            Switch who you are tracking for:
                          </p>
                        </div>

                        <div className="space-y-0.5 max-h-48 overflow-y-auto px-1 py-1">
                          {profiles.map((p) => {
                            const isActive = p.id === (activeProfile?.id || profile?.id);
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
                                  'flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs cursor-pointer select-none outline-none transition-colors',
                                  isActive
                                    ? 'bg-accent-subtle text-accent-onsubtle font-bold'
                                    : 'text-content hover:bg-surface-hover'
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-base select-none shrink-0">{pEmoji}</span>
                                  <div className="truncate">
                                    <p className="font-semibold text-xs truncate text-content">{p.full_name}</p>
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

                        <DropdownMenu.Item
                          onSelect={() => setIsAddFamilyModalOpen(true)}
                          className="flex items-center gap-2 px-2.5 py-1.5 mx-1 rounded-[var(--radius-md)] text-xs font-semibold text-accent hover:bg-accent-subtle cursor-pointer select-none outline-none transition-colors"
                        >
                          <span className="p-0.5 rounded bg-accent-subtle text-accent shrink-0">
                            <PlusIcon size={12} />
                          </span>
                          <span>+ Add Family Member (Dad, Mom, Child)</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator className="my-1.5 h-px bg-line" />
                      </div>
                    )}

                    <DropdownMenu.Item asChild>
                      <Link to="/settings" className={menuItem}>
                        <SettingsIcon size={17} className="shrink-0 text-content-subtle" />
                        Settings & profile
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link to="/doctor/visit-prep" className={menuItem}>
                        <FileTextIcon size={17} className="shrink-0 text-content-subtle" />
                        Doctor visit companion
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      className={menuItem}
                      onSelect={() => setIsCompanionModalOpen(true)}
                    >
                      <svg className="w-4 h-4 text-content-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Mobile Companion QR
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-line" />

                    <DropdownMenu.Item asChild>
                      <button
                        type="button"
                        onClick={() => signOut()}
                        className={clsx(menuItem, 'w-full text-left text-risk-text font-semibold')}
                      >
                        <LogOutIcon size={17} className="shrink-0" />
                        Sign out
                      </button>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          )}

          <Link
            to="/prescriptions/new"
            className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-3.5 text-xs font-semibold rounded-lg bg-accent text-content-onaccent hover:bg-accent-hover active:bg-accent-active transition-colors shadow-xs shrink-0"
          >
            <PlusIcon size={15} />
            <span className="hidden sm:inline">Scan record</span>
            <span className="sm:hidden">Scan</span>
          </Link>
        </div>
      </div>

      <MobileCompanionModal
        isOpen={isCompanionModalOpen}
        onClose={() => setIsCompanionModalOpen(false)}
      />

      <AddFamilyProfileModal
        isOpen={isAddFamilyModalOpen}
        onClose={() => setIsAddFamilyModalOpen(false)}
      />
    </header>
  );
}
