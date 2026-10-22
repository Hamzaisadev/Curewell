import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { TrophyIcon, MedalIcon, TrendingUpIcon, XIcon } from './icons';
import { modalScaleSpring, bouncySpring } from '../../lib/motion';

export interface MilestoneCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  streakCount?: number;
}

export function MilestoneCelebrationModal({
  isOpen,
  onClose,
  title,
  description,
  tier = 'gold',
  streakCount,
}: MilestoneCelebrationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstEl = focusable?.[0];
      if (firstEl) {
        firstEl.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (first && last) {
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      prevActive?.focus();
    };
  }, [isOpen, onClose]);

  const tierColors = {
    bronze: 'from-amber-600 to-amber-800 shadow-amber-600/30',
    silver: 'from-slate-400 to-slate-600 shadow-slate-400/30',
    gold: 'from-amber-400 to-amber-600 shadow-amber-400/30',
    platinum: 'from-teal-500 to-teal-700 shadow-teal-500/30',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Celebration Card */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="milestone-title"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-line-strong bg-surface-raised p-6 text-center shadow-over z-10"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={modalScaleSpring}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center text-content-muted hover:bg-surface-hover hover:text-content transition-colors cursor-pointer"
              aria-label="Close celebration"
            >
              <XIcon size={18} />
            </button>

            {/* Animated Trophy / Medal Assembly */}
            <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full bg-brand-100/50 dark:bg-brand-900/30"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                transition={{ repeat: 2, duration: 1.2, ease: 'easeOut' }}
              />

              <motion.div
                className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${tierColors[tier]} text-white shadow-lg`}
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={bouncySpring}
              >
                {streakCount ? <TrophyIcon size={40} /> : <MedalIcon size={40} />}
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {streakCount && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-warn-bg text-warn-text border border-warn-border mb-2">
                  <TrendingUpIcon size={14} />
                  {streakCount}-Day Logging Streak Active
                </span>
              )}

              <h2 id="milestone-title" className="text-xl font-extrabold text-content tracking-tight">{title}</h2>
              <p className="mt-2 text-sm text-content-muted leading-relaxed">{description}</p>
            </motion.div>

            {/* Action Button */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Button variant="primary" size="lg" fullWidth onClick={onClose}>
                Keep Up the Great Work
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
