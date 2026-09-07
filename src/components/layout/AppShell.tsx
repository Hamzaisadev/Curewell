import React from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from './ErrorBoundary';

export interface AppShellProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  noPadding?: boolean;
  fixedViewport?: boolean;
  maxWidth?: '5xl' | '6xl' | '7xl' | 'wide' | 'full';
}

export function AppShell({
  children,
  fullWidth,
  noPadding,
  fixedViewport,
  maxWidth = 'wide',
}: AppShellProps) {
  const widthClass = fullWidth
    ? 'max-w-none'
    : maxWidth === '5xl'
    ? 'max-w-5xl px-4 md:px-8'
    : maxWidth === '6xl'
    ? 'max-w-6xl px-4 md:px-8'
    : maxWidth === '7xl'
    ? 'max-w-7xl px-4 md:px-8'
    : maxWidth === 'full'
    ? 'max-w-none px-4 md:px-8'
    : 'max-w-[1200px] px-4 sm:px-6 md:px-8';

  return (
    <ErrorBoundary>
      <div
        className={`flex flex-col bg-surface-sunken text-content font-sans selection:bg-accent-subtle selection:text-accent-onsubtle ${
          // dvh, not vh: on mobile Safari `100vh` includes the collapsing URL bar,
          // so the page jumped as the bar hid and showed.
          fixedViewport ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'
        }`}
      >
        <TopBar />
        <main
          className={`flex-1 w-full mx-auto flex flex-col min-h-0 ${widthClass} ${
            noPadding
              ? 'p-0 pb-16 md:pb-0'
              : 'py-5 md:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10'
          } ${fixedViewport ? 'overflow-hidden' : ''}`}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </ErrorBoundary>
  );
}
