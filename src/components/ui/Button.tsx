import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps, useReducedMotion } from 'motion/react';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Stretches to the container width — the default for primary mobile actions. */
  fullWidth?: boolean;
  /** Triggers a gentle tactile haptic pulse on supported mobile touch devices */
  haptic?: boolean;
  /** Delegates rendering to child component (e.g. react-router Link or anchor) */
  asChild?: boolean;
}

const MotionSlot = motion.create(Slot);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      disabled,
      children,
      leftIcon,
      rightIcon,
      fullWidth = false,
      haptic = true,
      asChild = false,
      type = 'button',
      onClick,
      onPointerDown,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const isInteractive = !disabled && !loading;

    const baseStyles = clsx(
      'relative inline-flex items-center justify-center font-semibold select-none cursor-pointer overflow-hidden',
      'rounded-[var(--radius-md)] transition-[background-color,border-color,color,box-shadow]',
      'duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
    );

    const sizeStyles = {
      xs: 'h-8 min-h-8 px-2.5 text-xs gap-1',
      sm: 'h-10 min-h-10 px-3.5 text-xs gap-1.5',
      md: 'h-12 min-h-12 px-5 text-sm gap-2',
      lg: 'h-14 min-h-14 px-7 text-base gap-2.5',
      xl: 'h-16 min-h-16 px-8 text-lg gap-3',
    };

    const variantStyles = {
      primary:
        'bg-accent text-content-onaccent hover:bg-accent-hover active:bg-accent-active shadow-card',
      secondary:
        'bg-surface-raised text-content border border-line hover:bg-surface-hover hover:border-line-strong shadow-card',
      subtle:
        'bg-accent-subtle text-accent-onsubtle hover:brightness-[0.97] border border-transparent',
      ghost:
        'bg-transparent text-content-muted hover:bg-surface-hover hover:text-content',
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

    const tapAnimation = isInteractive && !shouldReduceMotion ? { scale: 0.96 } : undefined;
    const hoverAnimation = isInteractive && !shouldReduceMotion ? { y: -1 } : undefined;
    const springTransition = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.8 };

    const mergedClass = twMerge(
      clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )
    );

    if (asChild) {
      return (
        <MotionSlot
          ref={ref}
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
        {/* Layout-preserving content wrapper: preserves exact button geometry during loading */}
        <span
          className={clsx(
            'inline-flex items-center justify-center gap-[inherit] w-full h-full',
            loading && 'invisible opacity-0 select-none pointer-events-none'
          )}
        >
          {leftIcon && (
            <span className="shrink-0 inline-flex items-center justify-center leading-none" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {children != null && children !== '' && (
            <span className="truncate leading-none">{children}</span>
          )}
          {rightIcon && (
            <span className="shrink-0 inline-flex items-center justify-center leading-none" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </span>

        {/* Absolute loading overlay: centered perfectly with zero layout shift */}
        {loading && (
          <span
            className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none px-2"
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
            {loadingText && (
              <span className="truncate text-xs font-semibold tracking-wide text-current">
                {loadingText}
              </span>
            )}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
