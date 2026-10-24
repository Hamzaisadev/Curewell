import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps, useReducedMotion } from 'motion/react';
import { Slot } from '@radix-ui/react-slot';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  'aria-label': string; // Mandatory for accessibility
  children?: React.ReactNode;
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger' | 'subtle' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  haptic?: boolean;
  asChild?: boolean;
}

const MotionSlot = motion.create(Slot);

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      loading = false,
      disabled,
      children,
      type = 'button',
      haptic = true,
      asChild = false,
      'aria-label': ariaLabel,
      onClick,
      onPointerDown,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const isInteractive = !disabled && !loading;

    const baseStyles = clsx(
      'relative inline-flex items-center justify-center shrink-0 aspect-square select-none cursor-pointer overflow-hidden',
      'rounded-[var(--radius-md)] transition-[background-color,border-color,color,box-shadow]',
      'duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
    );

    const sizeStyles = {
      xs: 'w-8 h-8 min-w-8 min-h-8 p-1.5',
      sm: 'w-10 h-10 min-w-10 min-h-10 p-2',
      md: 'w-11 h-11 min-w-11 min-h-11 p-2.5',
      lg: 'w-12 h-12 min-w-12 min-h-12 p-3',
      xl: 'w-14 h-14 min-w-14 min-h-14 p-3.5',
    };

    const variantStyles = {
      ghost:
        'bg-transparent text-content-muted hover:bg-surface-hover hover:text-content',
      secondary:
        'bg-surface-raised text-content border border-line hover:bg-surface-hover hover:border-line-strong shadow-card',
      primary:
        'bg-accent text-content-onaccent hover:bg-accent-hover active:bg-accent-active shadow-card',
      subtle:
        'bg-accent-subtle text-accent-onsubtle hover:brightness-[0.97] border border-transparent',
      danger:
        'bg-risk-bg text-risk-text border border-risk-border hover:brightness-[0.97]',
      outline:
        'bg-transparent text-content border border-line-strong hover:bg-surface-hover hover:border-content',
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (isInteractive && haptic && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // Gracefully ignore browsers with restricted haptic permissions
        }
      }
      onPointerDown?.(e);
    };

    const tapAnimation = isInteractive && !shouldReduceMotion ? { scale: 0.92 } : undefined;
    const hoverAnimation = isInteractive && !shouldReduceMotion ? { scale: 1.05 } : undefined;
    const springTransition = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.8 };

    const mergedClass = twMerge(
      clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)
    );

    if (asChild) {
      return (
        <MotionSlot
          ref={ref}
          aria-label={ariaLabel}
          aria-busy={loading}
          whileTap={tapAnimation}
          whileHover={hoverAnimation}
          transition={springTransition}
          className={mergedClass}
          {...props}
        >
          {children}
        </MotionSlot>
      );
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        disabled={disabled || loading}
        aria-busy={loading}
        whileTap={tapAnimation}
        whileHover={hoverAnimation}
        transition={springTransition}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        className={mergedClass}
        {...props}
      >
        <span
          className={clsx(
            'inline-flex items-center justify-center w-full h-full',
            loading && 'invisible opacity-0 select-none pointer-events-none'
          )}
        >
          {children}
        </span>

        {loading && (
          <span
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <svg
              className="animate-spin h-4 w-4 shrink-0 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
