import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { Badge } from './Badge';
import { SLOT_META } from './slotMeta';
import { CheckIcon } from './icons';
import { bucketOf } from '../../domain/timeBuckets';
import { mealRelationOf } from '../../domain/mealRelation';
import { deriveMealInstruction } from '../../domain/schedule';
import { formatDoseTime } from '../../lib/time';
import {
  Package,
  AlertCircle,
  Utensils,
  Droplets,
  HelpCircle,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ShoppingBag,
  Info,
  RotateCcw,
} from 'lucide-react';

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'missed';

export interface DoseCardProps {
  medicineId?: string;
  medicineName: string;
  strength?: string | null;
  /** e.g. "1 tablet" — shown next to the strength when known. */
  doseAmount?: string | null;
  scheduledMinutes: number;
  status: DoseStatus;
  withFood?: boolean | null;
  instructions?: string | null;
  /** Contextual meal guidance (e.g. "Take with or after breakfast", "Take on an empty stomach") */
  mealInstruction?: string | null;
  skippedReason?: string | null;
  /** Remaining pills, when the cabinet is tracking this medicine. */
  remaining?: number | null;
  onTake?: () => void;
  onSkip?: () => void;
  onUndo?: () => void;
  /** Callback when the patient clicks to view details or trigger order/refill */
  onSelect?: () => void;
  /** Secondary action callback to order/refill this medication */
  onOrderRefill?: () => void;
  /** Secondary action callback to view the full medication monograph/details */
  onViewDetails?: () => void;
  /** Disables actions, e.g. while browsing a past date. */
  readOnly?: boolean;
  /** Optional controlled expansion state */
  isExpanded?: boolean;
  /** Optional callback when expanded state changes */
  onToggleExpand?: () => void;
  className?: string;
}

const statusBadge: Record<DoseStatus, { tone: 'ok' | 'warn' | 'neutral' | 'info'; label: string } | null> = {
  pending: null,
  taken: { tone: 'ok', label: 'Taken' },
  missed: { tone: 'warn', label: 'Overdue' },
  skipped: { tone: 'neutral', label: 'Skipped' },
};

/**
 * Modern Clinical Medication Accordion Item
 * Features scannable single-line collapsed row with primary "Log Taken" action,
 * and a smooth expandable drawer revealing "Order Refill", "View Details", and inventory count.
 */
export function DoseCard({
  medicineName,
  strength,
  doseAmount,
  scheduledMinutes,
  status,
  withFood,
  instructions,
  mealInstruction,
  skippedReason,
  remaining,
  onTake,
  onSkip,
  onUndo,
  onSelect,
  onOrderRefill,
  onViewDetails,
  readOnly = false,
  isExpanded: controlledExpanded,
  onToggleExpand,
  className,
}: DoseCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const bucket = bucketOf(scheduledMinutes);
  const slot = SLOT_META[bucket];
  const relation = mealRelationOf(withFood);
  const badge = statusBadge[status];
  const isActionable = status === 'pending' || status === 'missed';
  const isOutOfStock = typeof remaining === 'number' && remaining <= 0;
  const isLowStock = typeof remaining === 'number' && remaining > 0 && remaining <= 5;

  const contextualMealInstruction =
    mealInstruction && mealInstruction.trim().length > 0
      ? mealInstruction.trim()
      : deriveMealInstruction(withFood, bucket, instructions);

  const hasSpecificMealInstruction =
    Boolean(contextualMealInstruction) &&
    contextualMealInstruction !== 'Meal timing not specified — follow your doctor’s instructions' &&
    contextualMealInstruction !== 'Not specified';

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand();
    }
  };

  const handleRefillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOrderRefill) {
      onOrderRefill();
    } else if (onSelect) {
      onSelect();
    }
  };

  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails();
    } else if (onSelect) {
      onSelect();
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border bg-surface-raised transition-all duration-200 shadow-2xs hover:shadow-card-hover text-left',
        isExpanded && 'ring-1 ring-accent/25 shadow-sm',
        status === 'missed'
          ? 'border-warn-border bg-warn-bg/20 hover:border-warn-border'
          : status === 'taken'
            ? 'border-line/60 bg-surface-raised'
            : 'border-line hover:border-line-strong',
        className
      )}
    >
      {/* Left Chronotherapy Slot Vertical Accent Line */}
      <span
        className={clsx(
          'absolute top-0 bottom-0 left-0 w-1.5 transition-all',
          status === 'taken' ? 'bg-ok-border' : status === 'missed' ? 'bg-warn-border' : slot.surface
        )}
        aria-hidden="true"
      />

      {/* Collapsed Row Header (Single Scannable Line) */}
      <div
        className={clsx(
          'select-none pl-4.5 sm:pl-5 pr-3.5 sm:pr-4 py-3 sm:py-3.5 flex items-center justify-between gap-3 min-h-[64px]',
          isExpanded && 'bg-surface-sunken/30'
        )}
      >
        {/* Left Side: Scheduled Time + Medicine Name & Dosage (Disclosure Button) */}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={`${medicineName}, ${formatDoseTime(scheduledMinutes)}. Click to ${isExpanded ? 'collapse' : 'expand'} details and refill options.`}
          onClick={toggleExpand}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer rounded-xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          {/* Scheduled Time Chip */}
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs shrink-0 transition-colors',
              status === 'taken'
                ? 'bg-ok-bg text-ok-text border-ok-border'
                : status === 'missed'
                  ? 'bg-warn-bg text-warn-text border-warn-border'
                  : 'bg-surface-sunken text-content border-line-strong/60'
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                'shrink-0',
                status === 'taken'
                  ? 'text-ok-text'
                  : status === 'missed'
                    ? 'text-warn-text'
                    : 'text-accent'
              )}
            >
              {status === 'taken' ? (
                <CheckCircle2 size={13} className="text-ok-text" />
              ) : status === 'missed' ? (
                <AlertCircle size={13} className="text-warn-text" />
              ) : (
                slot.icon(13)
              )}
            </span>
            <time data-numeric className="whitespace-nowrap font-black tracking-tight text-inherit">
              {formatDoseTime(scheduledMinutes)}
            </time>
          </span>

          {/* Medicine Name and Dosage summary */}
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5">
            <h3
              className={clsx(
                'text-sm sm:text-base font-bold text-content leading-snug tracking-tight truncate',
                status === 'taken' && 'line-through text-content-muted decoration-accent/50'
              )}
              title={medicineName}
            >
              {medicineName}
            </h3>

            {/* Dosage & Metadata pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {strength && (
                <span className="px-2 py-0.5 rounded-md bg-surface-sunken border border-line text-content font-bold text-2xs">
                  {strength}
                </span>
              )}
              {doseAmount && (
                <span className="text-content-muted font-medium text-2xs truncate">
                  {doseAmount}
                </span>
              )}
              {badge && (
                <span className="hidden sm:inline-flex">
                  <Badge tone={badge.tone} size="sm" withIcon>
                    {badge.label}
                  </Badge>
                </span>
              )}
              {!isExpanded && hasSpecificMealInstruction && (
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-bold border transition-colors shadow-2xs',
                    relation === 'empty_stomach'
                      ? 'bg-info-bg border-info-border text-info-text'
                      : 'bg-warn-bg border-warn-border text-warn-text'
                  )}
                  title={contextualMealInstruction}
                >
                  {relation === 'empty_stomach' ? (
                    <Droplets size={11} className="text-info-text shrink-0" />
                  ) : (
                    <Utensils size={11} className="text-warn-text shrink-0" />
                  )}
                  <span className="truncate max-w-[180px] sm:max-w-[280px]">
                    {contextualMealInstruction}
                  </span>
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Right Side: Primary "Log Taken" Action & Dedicated Expand Disclosure Button */}
        <div className="flex items-center gap-2 shrink-0">
          {!readOnly && isActionable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onTake?.();
              }}
              leftIcon={<CheckIcon size={14} />}
              className={clsx(
                'h-8 sm:h-9 px-3 sm:px-4 text-xs font-bold rounded-xl whitespace-nowrap tap-spring shadow-2xs cursor-pointer',
                status === 'missed'
                  ? 'bg-warn-text hover:brightness-95 border-warn-border text-content-onaccent'
                  : 'bg-accent hover:bg-accent-hover border-accent text-content-onaccent'
              )}
            >
              {status === 'missed' ? 'Log Overdue' : 'Log Taken'}
            </Button>
          )}

          {!readOnly && status === 'taken' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-ok-bg text-ok-text text-xs font-bold border border-ok-border">
              <CheckCircle2 size={13} className="text-ok-text" />
              <span className="hidden sm:inline">Logged</span>
            </span>
          )}

          {!readOnly && status === 'skipped' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-sunken text-content-muted text-xs font-bold border border-line">
              <XCircle size={13} />
              <span className="hidden sm:inline">Skipped</span>
            </span>
          )}

          {/* Dedicated Expand/Collapse Disclosure Chevron Button */}
          <button
            type="button"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            className={clsx(
              'w-8 h-8 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-content-subtle hover:text-content hover:bg-surface-hover transition-colors duration-200 cursor-pointer',
              isExpanded && 'text-accent'
            )}
          >
            <ChevronDown size={16} className={clsx('transition-transform duration-200', isExpanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Expanded State (Downward Revealing Drawer) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="accordion-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4.5 sm:px-5 pb-4 pt-2.5 border-t border-line/60 space-y-3.5 bg-surface-sunken/20">
              {/* Context Row: Inventory Count & Meal / Clinical Guidelines */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Current Inventory Count */}
                <div className="flex items-center gap-2">
                  {typeof remaining === 'number' ? (
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs',
                        isOutOfStock
                          ? 'bg-risk-bg text-risk-text border-risk-border'
                          : isLowStock
                            ? 'bg-warn-bg text-warn-text border-warn-border'
                            : 'bg-surface-sunken text-content border-line'
                      )}
                    >
                      {isOutOfStock ? (
                        <>
                          <AlertCircle size={13} className="text-risk-text" />
                          Out of stock (0 left in cabinet)
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertCircle size={13} className="text-warn-text" />
                          Low stock: {remaining} remaining
                        </>
                      ) : (
                        <>
                          <Package size={13} className="text-content-subtle" />
                          {remaining} in cabinet inventory
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-sunken text-content-subtle border border-line text-xs font-medium">
                      <Package size={13} />
                      Course active
                    </span>
                  )}

                  {/* Meal Guidance Callout */}
                  {hasSpecificMealInstruction ? (
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs',
                        relation === 'empty_stomach'
                          ? 'bg-info-bg border-info-border text-info-text'
                          : 'bg-warn-bg border-warn-border text-warn-text'
                      )}
                    >
                      {relation === 'empty_stomach' ? (
                        <Droplets size={12} className="text-info-text" />
                      ) : (
                        <Utensils size={12} className="text-warn-text" />
                      )}
                      {contextualMealInstruction}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-sunken border border-line text-content-subtle text-xs font-medium">
                      <HelpCircle size={12} />
                      As directed by physician
                    </span>
                  )}
                </div>

                {/* Status or Reason summary */}
                {status === 'skipped' && skippedReason && (
                  <span className="text-xs text-content-subtle italic">
                    Reason: {skippedReason}
                  </span>
                )}
              </div>

              {/* Special Clinical Instructions (if present and distinct from meal callout) */}
              {instructions && instructions.trim().toLowerCase() !== contextualMealInstruction?.toLowerCase() && (
                <div className="text-xs text-content-muted bg-surface-sunken border border-line/60 rounded-xl px-3 py-2 flex items-start gap-2 leading-relaxed">
                  <FileText size={14} className="text-accent shrink-0 mt-0.5" />
                  <span>{instructions}</span>
                </div>
              )}

              {/* Secondary Actions Row: Order Refill, View Details, Skip & Undo */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                {/* Secondary Feature Buttons: Order Refill & View Details */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(onOrderRefill || onSelect) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRefillClick}
                      leftIcon={<ShoppingBag size={13} />}
                      className="h-8 px-3 text-xs font-bold rounded-xl border border-line text-content hover:text-accent tap-spring shadow-2xs cursor-pointer"
                    >
                      Order Refill
                    </Button>
                  )}

                  {(onViewDetails || onSelect) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleViewDetailsClick}
                      leftIcon={<Info size={13} />}
                      className="h-8 px-3 text-xs font-bold rounded-xl border border-line text-content hover:text-accent tap-spring shadow-2xs cursor-pointer"
                    >
                      View Details
                    </Button>
                  )}
                </div>

                {/* Contextual actions: Skip Dose or Undo */}
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    {isActionable && onSkip && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSkip();
                        }}
                        className="h-8 px-2.5 text-xs text-content-muted hover:text-content font-semibold rounded-lg cursor-pointer"
                      >
                        Skip Dose
                      </Button>
                    )}

                    {!isActionable && onUndo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUndo();
                        }}
                        leftIcon={<RotateCcw size={12} />}
                        className="h-8 px-2.5 text-xs text-content-subtle hover:text-content font-semibold rounded-lg cursor-pointer"
                      >
                        Undo
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
