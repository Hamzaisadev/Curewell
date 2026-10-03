import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Dialog } from '../../components/ui/Dialog';
import { Toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { MedicineOrderModal } from '../../components/medicines/MedicineOrderModal';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { DoseCard } from '../../components/ui/DoseCard';
import { getSlotMeta } from '../../components/ui/slotMeta';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '../../components/ui/icons';
import {
  Archive,
  Check,
  RotateCcw,
  ShieldCheck,
  Clock,
  Flame,
  Package,
  ArrowUpRight,
  Utensils,
  Droplets,
  AlertCircle,
  AlertTriangle,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import {
  todayInAppTz,
  fromAppDate,
  addDaysAppTz,
  formatRelativeDay,
  formatDateShort,
  formatDoseTime,
  minutesInAppTz,
} from '../../lib/time';
import { bucketOf, Bucket, resolveActiveBuckets } from '../../domain/timeBuckets';
import { deriveMealInstruction } from '../../domain/schedule';
import {
  deriveStatusOnRead,
  calculateLoggingStreak,
  type LateDoseRiskResult,
  type EffectiveDose,
} from '../../domain/adherence';
import {
  isBucketWindowExpired,
  checkDoseLateRisk,
  type DailyScheduleView,
} from '../../domain/medicationScheduleFacade';
import {
  getDaySchedule,
  recordDoseAction,
  batchRecordDosesTaken,
} from '../../domain/medicationRegimen';
import { useAuth } from '../../lib/auth/AuthContext';
import { dosesRepo } from '../../lib/db';
import { readInventory } from '../../lib/inventory';
import type { Tables } from '../../lib/supabase/types';

type Dose = Tables<'doses'>;
type Medicine = Tables<'medicines'>;
type ScheduleFilter = 'all' | 'actionable' | 'taken';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SKIP_REASONS = [
  'Forgot',
  'Side effect',
  'Doctor told me to stop',
  'Out of stock',
  'Other',
] as const;

export function TodaySchedulePage() {
  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(todayInAppTz());
  const [doses, setDoses] = useState<Dose[]>([]);
  const [streakDoses, setStreakDoses] = useState<Dose[]>([]);
  const [medicinesMap, setMedicinesMap] = useState<Record<string, Medicine>>({});
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>('all');
  const [isPastDosesOpen, setIsPastDosesOpen] = useState(true);

  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [activeDoseForSkip, setActiveDoseForSkip] = useState<Dose | null>(null);
  const [selectedSkipReason, setSelectedSkipReason] = useState<string>(SKIP_REASONS[0]);

  const [lateDoseDialogOpen, setLateDoseDialogOpen] = useState(false);
  const [activeDoseForLateCheck, setActiveDoseForLateCheck] = useState<Dose | null>(null);
  const [lateDoseStep, setLateDoseStep] = useState<'prompt' | 'warning'>('prompt');
  const [lateDoseRisk, setLateDoseRisk] = useState<LateDoseRiskResult | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedMedicineForOrder, setSelectedMedicineForOrder] = useState<Medicine | null>(null);

  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'risk' } | null>(null);

  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const loadData = useCallback(
    async (dateStr: string) => {
      if (!effectiveProfileId) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const today = todayInAppTz();
        const streakFrom = addDaysAppTz(today, -60);
        const [dayResult, rangeDoses] = await Promise.all([
          getDaySchedule(effectiveProfileId, dateStr, effectiveUserId),
          dosesRepo.listDosesForRange(effectiveProfileId, streakFrom, today),
        ]);

        setMedicinesMap(dayResult.medicinesMap);
        setDoses(dayResult.doses);
        setInventory(dayResult.inventory);
        setStreakDoses(rangeDoses);
      } catch (err) {
        console.warn('Error loading schedule:', err);
        setDoses([]);
        setLoadError(
          err instanceof Error ? err.message : 'Could not load your schedule for this day.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [effectiveUserId, effectiveProfileId]
  );

  useEffect(() => {
    loadData(selectedDate);
  }, [loadData, selectedDate]);



  /** Batch action to mark all due doses in a specific routine slot as taken */
  const handleMarkRoutineTaken = async (routineDoses: Dose[], routineName: string) => {
    try {
      const { updatedDoses, count } = await batchRecordDosesTaken(routineDoses, effectiveProfileId);
      if (count === 0) return;

      setDoses(updatedDoses);
      setInventory(readInventory(effectiveProfileId));

      setToast({
        tone: 'ok',
        message: `Marked ${count} ${routineName.toLowerCase()} doses as taken.`,
      });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        tone: 'risk',
        message: 'Could not complete batch update. Please try marking individually.',
      });
    }
  };

  const handleUndo = async (dose: Dose) => {
    try {
      const { updatedDose } = await recordDoseAction({
        dose,
        newStatus: 'pending',
        profileId: effectiveProfileId,
      });
      setDoses((prev) => prev.map((d) => (d.id === dose.id ? updatedDose : d)));
      setInventory(readInventory(effectiveProfileId));
      setToast({ tone: 'ok', message: 'Dose reset to pending.' });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        tone: 'risk',
        message: err instanceof Error ? err.message : 'Could not update this dose. Please try again.',
      });
    }
  };

  const handleOpenSkip = (dose: Dose) => {
    setActiveDoseForSkip(dose);
    setSelectedSkipReason(SKIP_REASONS[0]);
    setSkipDialogOpen(true);
  };

  const handleConfirmSkip = async () => {
    if (!activeDoseForSkip) return;
    try {
      const { updatedDose } = await recordDoseAction({
        dose: activeDoseForSkip,
        newStatus: 'skipped',
        skipReason: selectedSkipReason,
        profileId: effectiveProfileId,
      });
      setDoses((prev) => prev.map((d) => (d.id === activeDoseForSkip.id ? updatedDose : d)));
      setSkipDialogOpen(false);
      setToast({ tone: 'ok', message: `Dose marked as skipped (${selectedSkipReason}).` });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        tone: 'risk',
        message: err instanceof Error ? err.message : 'Could not record this dose. Please try again.',
      });
    }
  };

  const handleOpenOrderModal = (medicine: Medicine | undefined) => {
    if (!medicine) return;
    setSelectedMedicineForOrder(medicine);
    setOrderModalOpen(true);
  };

  const handleStockUpdated = (newStock: number) => {
    if (!selectedMedicineForOrder) return;
    setInventory((prev) => ({
      ...prev,
      [selectedMedicineForOrder.id]: newStock,
    }));
    setToast({
      tone: 'ok',
      message: `Cabinet updated: ${newStock} units of ${selectedMedicineForOrder.medicine_name} in stock.`,
    });
  };

  const today = todayInAppTz();
  const isPast = selectedDate < today;

  // Filtered doses based on active filter tab
  const filteredDoses = useMemo(() => {
    return doses.filter((d) => {
      const status = deriveStatusOnRead(d, new Date());
      if (activeFilter === 'actionable') {
        return status === 'pending' || status === 'missed';
      }
      if (activeFilter === 'taken') {
        return status === 'taken' || status === 'skipped';
      }
      return true;
    });
  }, [doses, activeFilter]);

  const nowMinutes = minutesInAppTz();

  const activeBuckets = useMemo(() => {
    const medList = Object.values(medicinesMap);
    const resolved = resolveActiveBuckets(medList);
    // If any dose scheduled time falls in bedtime range (>= 1320 or < 300)
    const anyBedtimeDose = doses.some(
      (d) => d.scheduled_minutes >= 1320 || d.scheduled_minutes < 300
    );
    if (anyBedtimeDose && !resolved.includes('bedtime')) {
      resolved.push('bedtime');
    }
    return resolved;
  }, [medicinesMap, doses]);

  const hasBedtime = activeBuckets.includes('bedtime');

  // Dedicated Past / Missed Doses:
  // Isolate unlogged doses from closed buckets (e.g. afternoon doses when current time >= 17:00,
  // or morning doses when >= 12:00, or all past-date unlogged doses)
  const pastUnloggedDoses = useMemo(() => {
    return doses.filter((d) => {
      if (d.status === 'taken' || d.status === 'skipped') {
        return false;
      }
      const s = deriveStatusOnRead(d, new Date());
      if (s === 'missed') {
        return true;
      }
      const bucket = bucketOf(d.scheduled_minutes, hasBedtime);
      return isBucketWindowExpired(bucket, selectedDate, today, nowMinutes, hasBedtime);
    });
  }, [doses, hasBedtime, selectedDate, today, nowMinutes]);

  const filteredPastUnloggedDoses = useMemo(() => {
    if (activeFilter === 'taken') {
      return [];
    }
    return pastUnloggedDoses;
  }, [pastUnloggedDoses, activeFilter]);

  // Active daypart bucket doses exclude past unlogged doses, keeping daypart blocks focused on actionable upcoming medications
  const daypartDoses = useMemo(() => {
    const pastIds = new Set(pastUnloggedDoses.map((d) => d.id));
    return filteredDoses.filter((d) => !pastIds.has(d.id));
  }, [filteredDoses, pastUnloggedDoses]);

  const buckets: Record<Bucket, Dose[]> = {
    morning: [],
    afternoon: [],
    night: [],
    bedtime: [],
  };
  for (const d of daypartDoses) {
    buckets[bucketOf(d.scheduled_minutes, hasBedtime)].push(d);
  }
  for (const key of activeBuckets) {
    buckets[key].sort((a, b) => a.scheduled_minutes - b.scheduled_minutes);
  }

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const missedCount = doses.filter((d) => deriveStatusOnRead(d, new Date()) === 'missed').length;
  const pendingCount = doses.filter((d) => deriveStatusOnRead(d, new Date()) === 'pending').length;
  const actionableCount = pendingCount + missedCount;
  const totalCount = doses.length;
  const clinicalAdherencePercent =
    totalCount === 0 ? 100 : Math.round((takenCount / totalCount) * 100);
  const adherencePercent = clinicalAdherencePercent;

  const skipReasonsSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    for (const d of doses) {
      if (d.status === 'skipped') {
        const reason =
          d.skipped_reason ||
          (d as unknown as { skip_reason?: string }).skip_reason ||
          (d as unknown as { skipReason?: string }).skipReason ||
          'Unspecified';
        summary[reason] = (summary[reason] ?? 0) + 1;
      }
    }
    return summary;
  }, [doses]);

  const skipReasonText = useMemo(() => {
    const entries = Object.entries(skipReasonsSummary);
    if (entries.length === 0) return null;
    return entries
      .map(([reason, count]) => {
        const lower = reason.toLowerCase();
        if (lower.includes('doctor')) {
          return `${count} ${count === 1 ? 'dose' : 'doses'} held per doctor advice`;
        }
        return `${count} ${count === 1 ? 'dose' : 'doses'} held (${reason})`;
      })
      .join(', ');
  }, [skipReasonsSummary]);

  // Bento Hero: Next Actionable Dose Calculation
  const outstandingDoses = useMemo(() => {
    return doses.filter((d) => {
      const s = deriveStatusOnRead(d, new Date());
      return s === 'pending' || s === 'missed';
    });
  }, [doses]);

  const nextDose = useMemo(() => {
    if (outstandingDoses.length === 0) return null;
    const upcoming = outstandingDoses.find((d) => d.scheduled_minutes >= nowMinutes);
    return upcoming || outstandingDoses[0];
  }, [outstandingDoses, nowMinutes]);

  const nextMedicine = nextDose ? medicinesMap[nextDose.medicine_id] : null;
  const nextMedicineStock = nextDose ? inventory[nextDose.medicine_id] : undefined;

  // Low stock medicines count across the schedule
  const lowStockCount = useMemo(() => {
    const uniqueMedIds = new Set(doses.map((d) => d.medicine_id));
    let count = 0;
    for (const id of uniqueMedIds) {
      const stock = inventory[id];
      if (stock !== undefined && stock <= 5) count++;
    }
    return count;
  }, [doses, inventory]);

  const streakDays = useMemo(() => {
    const combinedMap = new Map<string, Dose>();
    for (const d of streakDoses) {
      combinedMap.set(d.id, d);
    }
    for (const d of doses) {
      combinedMap.set(d.id, d);
    }

    const projectedList = Array.from(combinedMap.values()).map((d) => {
      const isPrn =
        medicinesMap[d.medicine_id]?.frequency_code === 'PRN' ||
        medicinesMap[d.medicine_id]?.frequency_code === 'SOS' ||
        Boolean((d as unknown as { is_prn?: boolean }).is_prn);
      const skipReason =
        d.skipped_reason ||
        (d as unknown as { skip_reason?: string }).skip_reason ||
        (d as unknown as { skipReason?: string }).skipReason ||
        null;

      return {
        id: d.id,
        medicineId: d.medicine_id,
        medicine_id: d.medicine_id,
        scheduledDate: d.scheduled_date,
        scheduled_date: d.scheduled_date,
        scheduledMinutes: d.scheduled_minutes,
        scheduled_minutes: d.scheduled_minutes,
        bucket: bucketOf(d.scheduled_minutes, hasBedtime),
        mealInstruction: '',
        isPrn,
        status: d.status,
        takenAt: d.taken_at,
        taken_at: d.taken_at,
        skipReason,
        skip_reason: skipReason,
      };
    });

    return calculateLoggingStreak(projectedList as unknown as EffectiveDose[], [], new Date());
  }, [streakDoses, doses, medicinesMap, hasBedtime]);

  const handleMarkTaken = async (dose: Dose) => {
    if (dose.status === 'taken') return;

    const currentMinutes = minutesInAppTz();
    const isOverdue =
      selectedDate < today ||
      deriveStatusOnRead(dose, new Date()) === 'missed' ||
      isBucketWindowExpired(
        bucketOf(dose.scheduled_minutes, hasBedtime),
        selectedDate,
        today,
        currentMinutes,
        hasBedtime
      ) ||
      pastUnloggedDoses.some((d) => d.id === dose.id);

    if (isOverdue) {
      setActiveDoseForLateCheck(dose);
      setLateDoseStep('prompt');
      setLateDoseRisk(null);
      setLateDoseDialogOpen(true);
      return;
    }

    try {
      const { updatedDose, remainingPills } = await recordDoseAction({
        dose,
        newStatus: 'taken',
        profileId: effectiveProfileId,
      });
      setDoses((prev) => prev.map((d) => (d.id === dose.id ? updatedDose : d)));
      setInventory(readInventory(effectiveProfileId));

      setToast({
        tone: 'ok',
        message:
          remainingPills === null
            ? 'Dose marked as taken.'
            : `Dose marked as taken — ${remainingPills} left in cabinet.`,
      });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        tone: 'risk',
        message: err instanceof Error ? err.message : 'Could not record this dose. Please try again.',
      });
    }
  };

  const handleTookEarlier = async () => {
    if (!activeDoseForLateCheck) return;
    try {
      const earlierDate = fromAppDate(activeDoseForLateCheck.scheduled_date);
      earlierDate.setUTCMinutes(activeDoseForLateCheck.scheduled_minutes);
      const earlierIso = earlierDate.toISOString();
      const earlierTime =
        earlierIso < new Date().toISOString()
          ? earlierIso
          : new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { updatedDose, remainingPills } = await recordDoseAction({
        dose: activeDoseForLateCheck,
        newStatus: 'taken',
        takenAt: earlierTime,
        profileId: effectiveProfileId,
      });
      setDoses((prev) => prev.map((d) => (d.id === activeDoseForLateCheck.id ? updatedDose : d)));
      setInventory(readInventory(effectiveProfileId));
      setLateDoseDialogOpen(false);
      setActiveDoseForLateCheck(null);

      setToast({
        tone: 'ok',
        message:
          remainingPills === null
            ? 'Dose marked as taken earlier today.'
            : `Dose marked as taken earlier today — ${remainingPills} left in cabinet.`,
      });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        tone: 'risk',
        message: err instanceof Error ? err.message : 'Could not record this dose. Please try again.',
      });
    }
  };

  const handleTakingNow = async () => {
    if (!activeDoseForLateCheck) return;

    const currentMinutes = minutesInAppTz();
    const med = medicinesMap[activeDoseForLateCheck.medicine_id];
    const medName = med?.medicine_name || 'this medicine';

    const mapToEffectiveDose = (d: Dose, bucket: Bucket): EffectiveDose => {
      const m = medicinesMap[d.medicine_id];
      return {
        ...d,
        medicineName: m?.medicine_name || medName,
        medicine_name: m?.medicine_name || medName,
        medicineId: d.medicine_id,
        medicine_id: d.medicine_id,
        strength: m?.strength ?? null,
        doseAmount: m?.dose_amount ?? null,
        dose_amount: m?.dose_amount ?? null,
        mealInstruction: m?.instructions ?? '',
        scheduledMinutes: d.scheduled_minutes,
        scheduled_minutes: d.scheduled_minutes,
        scheduledDate: d.scheduled_date,
        scheduled_date: d.scheduled_date,
        bucket,
        status: deriveStatusOnRead(d, new Date()),
        isPrn: false,
        takenAt: d.taken_at,
        taken_at: d.taken_at,
        skipReason: d.skipped_reason,
        skip_reason: d.skipped_reason,
      };
    };

    const scheduleView: DailyScheduleView = {
      targetDate: selectedDate,
      activeBuckets,
      buckets: {
        morning: doses
          .filter((d) => bucketOf(d.scheduled_minutes, hasBedtime) === 'morning')
          .map((d) => mapToEffectiveDose(d, 'morning')),
        afternoon: doses
          .filter((d) => bucketOf(d.scheduled_minutes, hasBedtime) === 'afternoon')
          .map((d) => mapToEffectiveDose(d, 'afternoon')),
        night: doses
          .filter((d) => bucketOf(d.scheduled_minutes, hasBedtime) === 'night')
          .map((d) => mapToEffectiveDose(d, 'night')),
        bedtime: doses
          .filter((d) => bucketOf(d.scheduled_minutes, hasBedtime) === 'bedtime')
          .map((d) => mapToEffectiveDose(d, 'bedtime')),
      },
      pastUnloggedDoses: pastUnloggedDoses.map((d) =>
        mapToEffectiveDose(d, bucketOf(d.scheduled_minutes, hasBedtime))
      ),
      stats: {
        totalScheduled: doses.length,
        takenCount,
        missedCount,
        skippedCount: doses.filter((d) => d.status === 'skipped').length,
        pendingCount,
        actionableCount,
        clinicalAdherencePercent: adherencePercent,
        dailyLoggingStreak: streakDays,
        skipReasonsSummary: {},
      },
      hasBedtime,
    };

    const effectiveDose = mapToEffectiveDose(
      activeDoseForLateCheck,
      bucketOf(activeDoseForLateCheck.scheduled_minutes, hasBedtime)
    );

    const riskResult = checkDoseLateRisk(effectiveDose, scheduleView, currentMinutes);

    if (riskResult.riskLevel === 'warning_dose_stacking') {
      setLateDoseRisk(riskResult);
      setLateDoseStep('warning');
    } else {
      // Safe to take immediately
      try {
        const { updatedDose, remainingPills } = await recordDoseAction({
          dose: activeDoseForLateCheck,
          newStatus: 'taken',
          takenAt: new Date().toISOString(),
          profileId: effectiveProfileId,
        });
        setDoses((prev) => prev.map((d) => (d.id === activeDoseForLateCheck.id ? updatedDose : d)));
        setInventory(readInventory(effectiveProfileId));
        setLateDoseDialogOpen(false);
        setActiveDoseForLateCheck(null);

        setToast({
          tone: 'ok',
          message:
            remainingPills === null
              ? 'Dose marked as taken.'
              : `Dose marked as taken — ${remainingPills} left in cabinet.`,
        });
      } catch (err: unknown) {
        console.error(err);
        setToast({
          tone: 'risk',
          message: err instanceof Error ? err.message : 'Could not record this dose. Please try again.',
        });
      }
    }
  };

  const handleSkipPerSafety = async () => {
    if (!activeDoseForLateCheck) return;
    try {
      const { updatedDose } = await recordDoseAction({
        dose: activeDoseForLateCheck,
        newStatus: 'skipped',
        skipReason: 'Skipped due to dose-stacking risk',
        profileId: effectiveProfileId,
      });
      setDoses((prev) => prev.map((d) => (d.id === activeDoseForLateCheck.id ? updatedDose : d)));
      setInventory(readInventory(effectiveProfileId));
      setLateDoseDialogOpen(false);
      setActiveDoseForLateCheck(null);

      setToast({
        tone: 'ok',
        message: 'Dose marked as skipped per clinical safety advice.',
      });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        tone: 'risk',
        message: err instanceof Error ? err.message : 'Could not record this dose. Please try again.',
      });
    }
  };

  const handleTakeAnyway = async () => {
    if (!activeDoseForLateCheck) return;
    try {
      const { updatedDose, remainingPills } = await recordDoseAction({
        dose: activeDoseForLateCheck,
        newStatus: 'taken',
        takenAt: new Date().toISOString(),
        profileId: effectiveProfileId,
      });
      setDoses((prev) => prev.map((d) => (d.id === activeDoseForLateCheck.id ? updatedDose : d)));
      setInventory(readInventory(effectiveProfileId));
      setLateDoseDialogOpen(false);
      setActiveDoseForLateCheck(null);

      setToast({
        tone: 'ok',
        message:
          remainingPills === null
            ? 'Dose marked as taken.'
            : `Dose marked as taken — ${remainingPills} left in cabinet.`,
      });
    } catch (err: unknown) {
      console.error(err);
      setToast({
        tone: 'risk',
        message: err instanceof Error ? err.message : 'Could not record this dose. Please try again.',
      });
    }
  };

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [viewYear, setViewYear] = useState(() => {
    try {
      return fromAppDate(selectedDate).getUTCFullYear();
    } catch {
      return new Date().getFullYear();
    }
  });

  const [viewMonth, setViewMonth] = useState(() => {
    try {
      return fromAppDate(selectedDate).getUTCMonth();
    } catch {
      return new Date().getMonth();
    }
  });

  useEffect(() => {
    try {
      const d = fromAppDate(selectedDate);
      setViewYear(d.getUTCFullYear());
      setViewMonth(d.getUTCMonth());
    } catch {
      // ignore
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const calendarMonthDays = useMemo(() => {
    const firstDay = new Date(Date.UTC(viewYear, viewMonth, 1));
    const startDayIndex = (firstDay.getUTCDay() + 6) % 7;
    const totalDays = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

    const cells: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    const prevMonthTotalDays = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const mm = String(prevM + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ dateStr: `${prevY}-${mm}-${dd}`, dayNum: d, isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ dateStr: `${viewYear}-${mm}-${dd}`, dayNum: d, isCurrentMonth: true });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const mm = String(nextM + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ dateStr: `${nextY}-${mm}-${dd}`, dayNum: d, isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const displayDateLabel = useMemo(() => {
    const relative = formatRelativeDay(selectedDate);
    const shortDate = formatDateShort(selectedDate);
    if (relative === shortDate) return shortDate;
    return `${relative}, ${shortDate}`;
  }, [selectedDate]);

  return (
    <AppShell>
      {toast && (
        <Toast
          open
          onClose={() => setToast(null)}
          message={toast.message}
          tone={toast.tone}
        />
      )}

      {/* Bento Health OS Top Control Strip */}
      <div className="p-3 sm:p-4 px-4 sm:px-6 rounded-3xl bg-surface-raised border border-line shadow-2xs mb-6 overflow-visible relative z-30">
        <div className="flex items-center justify-between gap-4 w-full overflow-visible py-0.5 flex-wrap sm:flex-nowrap">
          {/* Left: App Title & Status */}
          <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarIcon size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-content tracking-tight leading-tight whitespace-nowrap">
                Medication Schedule
              </h1>
              <p className="text-xs text-content-muted font-medium hidden sm:block whitespace-nowrap">
                Bento Health OS · Chronotherapy regimen
              </p>
            </div>
          </div>

          {/* Right: Date Stepper, Calendar Popover & Cabinet Link */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
            <div className="flex items-center gap-1 shrink-0" ref={calendarRef}>
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => setSelectedDate(addDaysAppTz(selectedDate, -1))}
                className="w-8 h-8 rounded-xl bg-surface-sunken hover:bg-surface-hover border border-line text-content-muted hover:text-content flex items-center justify-center tap-spring transition-all shrink-0"
              >
                <ChevronLeftIcon size={13} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCalendarOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-surface-sunken hover:bg-surface-hover border border-line text-content text-xs font-bold shadow-2xs tap-spring whitespace-nowrap transition-all"
                  aria-expanded={isCalendarOpen}
                  aria-label="Select date"
                >
                  <CalendarIcon size={13} className="text-accent" />
                  <span>{displayDateLabel}</span>
                  <ChevronDownIcon
                    size={11}
                    className={clsx('text-content-subtle transition-transform duration-200', isCalendarOpen && 'rotate-180')}
                  />
                </button>

                {/* Calendar Dropdown */}
                {isCalendarOpen && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3.5 rounded-2xl bg-surface-raised border border-line-strong shadow-raise z-50 text-content animate-in fade-in zoom-in-95 duration-150"
                    role="dialog"
                    aria-label="Select date from calendar"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                      <button
                        type="button"
                        aria-label="Previous month"
                        onClick={handlePrevMonth}
                        className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-content-muted hover:bg-surface-hover"
                      >
                        <ChevronLeftIcon size={14} />
                      </button>

                      <div className="text-xs font-bold text-content">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                      </div>

                      <button
                        type="button"
                        aria-label="Next month"
                        onClick={handleNextMonth}
                        className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-content-muted hover:bg-surface-hover"
                      >
                        <ChevronRightIcon size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {WEEKDAYS.map((wd) => (
                        <span key={wd} className="text-[10px] font-bold text-content-subtle uppercase">
                          {wd}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarMonthDays.map((cell) => {
                        const isSelected = cell.dateStr === selectedDate;
                        const isTodayCell = cell.dateStr === today;

                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedDate(cell.dateStr);
                              setIsCalendarOpen(false);
                            }}
                            className={clsx(
                              'h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all relative',
                              isSelected
                                ? 'bg-accent text-content-onaccent font-bold shadow-xs'
                                : cell.isCurrentMonth
                                  ? 'text-content hover:bg-surface-hover'
                                  : 'text-content-subtle opacity-40 hover:opacity-100 hover:bg-surface-hover',
                              isTodayCell && !isSelected && 'ring-1 ring-accent font-bold text-accent'
                            )}
                          >
                            {cell.dayNum}
                            {isTodayCell && !isSelected && (
                              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-line text-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(addDaysAppTz(selectedDate, -7));
                          setIsCalendarOpen(false);
                        }}
                        className="px-2 py-1 rounded-md text-content-muted hover:bg-surface-hover hover:text-content font-medium transition-colors"
                      >
                        ← Prev Week
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(today);
                          setIsCalendarOpen(false);
                        }}
                        className="px-2 py-1 rounded-md bg-accent-subtle text-accent font-bold hover:bg-accent hover:text-content-onaccent transition-colors"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(addDaysAppTz(selectedDate, 7));
                          setIsCalendarOpen(false);
                        }}
                        className="px-2 py-1 rounded-md text-content-muted hover:bg-surface-hover hover:text-content font-medium transition-colors"
                      >
                        Next Week →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="Next day"
                onClick={() => setSelectedDate(addDaysAppTz(selectedDate, 1))}
                className="w-8 h-8 rounded-xl bg-surface-sunken hover:bg-surface-hover border border-line text-content-muted hover:text-content flex items-center justify-center tap-spring transition-all shrink-0"
              >
                <ChevronRightIcon size={13} />
              </button>
            </div>

            <Link
              to="/medicines/cabinet"
              aria-label="Medicine Cabinet"
              title="Medicine Cabinet"
              className="w-8 h-8 rounded-xl bg-surface-sunken hover:bg-surface-hover border border-line text-content-muted hover:text-content flex items-center justify-center tap-spring transition-all shrink-0"
            >
              <Archive size={14} />
            </Link>

            <Link to="/prescriptions/new">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={13} />}
                className="h-8 px-3 text-xs font-bold rounded-xl tap-spring shadow-2xs"
              >
                Scan Rx
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Stream */}
      <main className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-3xl" />
              ))}
            </div>
          </div>
        ) : loadError ? (
          <ErrorState
            title="Could not load schedule"
            message={loadError}
            onRetry={() => loadData(selectedDate)}
          />
        ) : doses.length === 0 ? (
          <EmptyState
            heading={isPast ? 'No records for this day' : 'No medications scheduled'}
            description={
              isPast
                ? 'There are no medication records recorded for this date.'
                : 'Scan a prescription or add active medicines to automatically generate your Bento Health OS schedule.'
            }
            action={
              !isPast ? (
                <Link to="/prescriptions/new">
                  <Button leftIcon={<Plus size={15} />} className="tap-spring">
                    Scan prescription
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Bento Grid Top Tier: Hero Next Due Widget + Adherence/Streak Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Bento 1: Hero Next Due Medication Card (7 Cols) */}
              <div className="lg:col-span-7 p-6 rounded-3xl bg-linear-to-br from-teal-900 to-emerald-950 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md text-xs font-black uppercase tracking-wider text-emerald-200 border border-white/10">
                      <ShieldCheck size={13} className="text-amber-300" />
                      {nextDose ? (
                        deriveStatusOnRead(nextDose, new Date()) === 'missed'
                          ? 'Overdue Administration'
                          : 'Next Due Administration'
                      ) : (
                        'All Doses Completed'
                      )}
                    </span>

                    {nextDose && (
                      <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                        <Clock size={12} /> {formatDoseTime(nextDose.scheduled_minutes)}
                      </span>
                    )}
                  </div>

                  {nextDose && nextMedicine ? (
                    <div className="mt-5 space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {nextMedicine.medicine_name}
                      </h2>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-100/90 flex-wrap">
                        {nextMedicine.strength && <span>{nextMedicine.strength}</span>}
                        {nextMedicine.strength && <span>·</span>}
                        <span>{nextMedicine.dose_amount || (nextMedicine.form ? `1 ${nextMedicine.form}` : '1 dose')}</span>
                        <span>·</span>
                        {nextMedicine.with_food === true ? (
                          <span className="inline-flex items-center gap-1 text-amber-200 font-bold">
                            <Utensils size={12} />
                            {deriveMealInstruction(true, bucketOf(nextDose.scheduled_minutes, hasBedtime), nextMedicine.instructions)}
                          </span>
                        ) : nextMedicine.with_food === false ? (
                          <span className="inline-flex items-center gap-1 text-sky-200 font-bold">
                            <Droplets size={12} />
                            {deriveMealInstruction(false, bucketOf(nextDose.scheduled_minutes, hasBedtime), nextMedicine.instructions)}
                          </span>
                        ) : (
                          <span>As directed</span>
                        )}
                      </div>

                      {nextMedicine.instructions && (
                        <p className="text-xs text-emerald-100/80 bg-white/10 p-2.5 rounded-2xl backdrop-blur-xs max-w-lg mt-3 leading-relaxed">
                          {nextMedicine.instructions}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 py-4 space-y-1">
                      <h3 className="text-xl sm:text-2xl font-black text-emerald-100">
                        All Caught Up For Today! 🎉
                      </h3>
                      <p className="text-xs text-emerald-200/80">
                        All scheduled medications for {displayDateLabel} have been completed.
                      </p>
                    </div>
                  )}
                </div>

                {nextDose && (
                  <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between gap-4 relative z-10 flex-wrap">
                    <span className="text-xs text-emerald-200 font-semibold flex items-center gap-1.5">
                      <Package size={13} />
                      {nextMedicineStock !== undefined
                        ? nextMedicineStock === 0
                          ? 'Out of stock in cabinet'
                          : `${nextMedicineStock} left in cabinet`
                        : 'Stock tracked'}
                    </span>

                    {!isPast && (
                      <button
                        type="button"
                        onClick={() => handleMarkTaken(nextDose)}
                        className="px-6 py-2.5 rounded-2xl bg-white text-teal-950 font-black text-xs hover:bg-emerald-50 shadow-lg tap-spring cursor-pointer flex items-center gap-2"
                      >
                        <Check size={16} className="stroke-[3] text-teal-700" />
                        Log Taken Now
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bento 2: Two-Tier Adherence & Inventory Hub (5 Cols) */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tier 1 Box: Daily Logging Streak (Habit) */}
                <div className="p-5 rounded-3xl bg-surface-raised border border-line shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame size={14} className="text-amber-500 fill-amber-500" />
                        Tier 1: Habit Streak
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
                        Daily Routine Maintained
                      </span>
                    </div>

                    <div className="text-3xl font-black text-content mt-2 flex items-baseline gap-2">
                      <Flame size={26} className="text-amber-500 fill-amber-500 shrink-0 self-center" />
                      <span>{streakDays}</span>
                      <span className="text-sm font-bold text-content-muted">
                        {streakDays === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    <p className="text-xs text-content-muted font-medium mt-1">
                      {streakDays > 0 ? `${streakDays}-day streak active` : 'Build your routine by logging daily'}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-line/60">
                    <p className="text-[11px] text-content-subtle leading-relaxed">
                      Logging all doses—including excused clinical holds—keeps your streak alive.
                    </p>
                  </div>
                </div>

                {/* Tier 2 Box: Clinical Adherence Rate (Doctor Truth) */}
                <div className="p-5 rounded-3xl bg-surface-raised border border-line shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400" />
                        Tier 2: Clinical Rate
                      </span>
                      <span className="text-[10px] font-extrabold text-content-subtle px-1.5 py-0.5 rounded bg-surface-sunken border border-line">
                        Doctor Truth
                      </span>
                    </div>

                    <div className="text-3xl font-black text-content mt-2 flex items-baseline gap-1.5">
                      <span>{clinicalAdherencePercent}%</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                        Pharmacological Compliance
                      </span>
                      <span className="text-[11px] text-content-muted font-medium">
                        ({takenCount} of {totalCount} taken)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="w-full bg-surface-sunken h-2.5 rounded-full overflow-hidden border border-line">
                      <div
                        style={{ width: `${clinicalAdherencePercent}%` }}
                        className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      />
                    </div>

                    {skipReasonText ? (
                      <div
                        title={skipReasonText}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 truncate max-w-full"
                      >
                        <ShieldCheck size={12} className="text-sky-600 dark:text-sky-400 shrink-0" />
                        <span className="truncate">{skipReasonText}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-content-subtle">
                        No clinical holds documented
                      </p>
                    )}
                  </div>
                </div>

                {/* Cabinet Stock Health Widget (Full Width below stats) */}
                <div className="col-span-1 sm:col-span-2 p-4 rounded-3xl bg-surface-raised border border-line shadow-2xs flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-surface-sunken border border-line flex items-center justify-center text-accent">
                      <Package size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-content">Cabinet Inventory</h4>
                      <p className="text-[11px] text-content-subtle">
                        {lowStockCount > 0
                          ? `${lowStockCount} items low in cabinet`
                          : 'All scheduled medicines stocked'}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/medicines/cabinet"
                    className="px-3 py-1.5 rounded-xl bg-surface-sunken hover:bg-surface-hover border border-line font-bold text-content text-xs flex items-center gap-1 transition-colors tap-spring"
                  >
                    Cabinet <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
              <div className="w-full sm:w-64">
                <SegmentedControl<ScheduleFilter>
                  value={activeFilter}
                  onChange={setActiveFilter}
                  size="sm"
                  fullWidth
                  options={[
                    { value: 'all', label: `All (${doses.length})` },
                    { value: 'actionable', label: `Due (${actionableCount})` },
                    { value: 'taken', label: `Done (${takenCount})` },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-content-subtle">
                <span>{actionableCount === 0 ? '✓ Daily regimen complete' : `${actionableCount} administrations remaining`}</span>
              </div>
            </div>

            {/* Dedicated Past / Missed Doses Drawer (for unlogged doses from closed buckets) */}
            {filteredPastUnloggedDoses.length > 0 && (
              <section
                aria-label="Past and missed doses"
                className="rounded-3xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden shadow-2xs transition-all"
              >
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-black text-content tracking-tight">
                          Past / Missed Doses
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          {filteredPastUnloggedDoses.length} {filteredPastUnloggedDoses.length === 1 ? 'dose' : 'doses'}
                        </span>
                      </div>
                      <p className="text-xs text-content-muted font-medium mt-0.5">
                        Unlogged medications from closed time windows. Log them now to maintain your daily streak and clinical record.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {!isPast && filteredPastUnloggedDoses.length > 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkRoutineTaken(filteredPastUnloggedDoses, 'past missed')}
                        leftIcon={<Check size={13} className="text-amber-700 dark:text-amber-400" />}
                        className="h-8 px-3 text-xs font-bold rounded-xl border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 hover:bg-amber-100/60 tap-spring shadow-2xs"
                      >
                        Log all {filteredPastUnloggedDoses.length}
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsPastDosesOpen((prev) => !prev)}
                      aria-expanded={isPastDosesOpen}
                      aria-label={isPastDosesOpen ? 'Collapse past doses' : 'Expand past doses'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-line text-xs font-bold text-content tap-spring shadow-2xs cursor-pointer"
                    >
                      <span>{isPastDosesOpen ? 'Collapse' : 'View Doses'}</span>
                      <ChevronDownIcon
                        size={13}
                        className={clsx(
                          'transition-transform duration-200 text-content-muted',
                          isPastDosesOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible Drawer Content */}
                {isPastDosesOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-amber-200/70 dark:border-amber-800/40 space-y-3">
                    <div className="space-y-2.5">
                      {filteredPastUnloggedDoses.map((dose) => {
                        const medicine = medicinesMap[dose.medicine_id];
                        const doseBucket = bucketOf(dose.scheduled_minutes, hasBedtime);
                        const mealInst = deriveMealInstruction(
                          medicine?.with_food,
                          doseBucket,
                          medicine?.instructions
                        );

                        return (
                          <DoseCard
                            key={dose.id}
                            medicineId={dose.medicine_id}
                            medicineName={medicine?.medicine_name || 'Prescribed medicine'}
                            strength={medicine?.strength}
                            doseAmount={
                              medicine?.dose_amount || (medicine?.form ? `1 ${medicine.form}` : '1 dose')
                            }
                            scheduledMinutes={dose.scheduled_minutes}
                            status={deriveStatusOnRead(dose, new Date())}
                            withFood={medicine?.with_food}
                            instructions={medicine?.instructions}
                            mealInstruction={mealInst}
                            remaining={inventory[dose.medicine_id]}
                            onTake={() => handleMarkTaken(dose)}
                            onSkip={() => handleOpenSkip(dose)}
                            onUndo={() => handleUndo(dose)}
                            onOrderRefill={() => handleOpenOrderModal(medicine)}
                            onViewDetails={() => handleOpenOrderModal(medicine)}
                            readOnly={isPast}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Bento Grid Bottom Tier: Adaptive Daypart Bento Blocks */}
            <div
              className={clsx(
                'grid gap-4 items-start',
                activeBuckets.length === 4
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
                  : 'grid-cols-1 md:grid-cols-3'
              )}
            >
              {activeBuckets.map((key) => {
                const slot = getSlotMeta(key, hasBedtime);
                const allBucketDoses = doses.filter((d) => bucketOf(d.scheduled_minutes, hasBedtime) === key);
                const completed = allBucketDoses.filter((d) => d.status === 'taken').length;
                const total = allBucketDoses.length;
                const bucketDoses = buckets[key];
                const pending = bucketDoses.filter(
                  (d) => deriveStatusOnRead(d, new Date()) === 'pending' || deriveStatusOnRead(d, new Date()) === 'missed'
                ).length;
                const allDone = total > 0 && completed === total;
                const pastFromThisBucket = pastUnloggedDoses.filter(
                  (d) => bucketOf(d.scheduled_minutes, hasBedtime) === key
                );

                return (
                  <div
                    key={key}
                    className={clsx(
                      'p-4 sm:p-5 rounded-3xl border bg-surface-raised transition-all duration-200 flex flex-col justify-between min-h-[320px] space-y-4',
                      allDone
                        ? 'border-teal-500/30 bg-teal-500/5'
                        : pending > 0
                          ? 'border-line shadow-2xs'
                          : 'border-line/60 opacity-80'
                    )}
                  >
                    <div>
                      {/* Daypart Bento Block Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-line/60">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={clsx(
                              'w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs',
                              slot.surface,
                              slot.text
                            )}
                          >
                            {slot.icon(14)}
                          </span>
                          <div>
                            <h3 className="text-xs font-black text-content uppercase tracking-tight">
                              {slot.label}
                            </h3>
                            <span className="text-[10px] text-content-subtle font-semibold">
                              {slot.timeRange}
                            </span>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-lg text-[10px] font-black',
                            allDone
                              ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
                              : 'bg-surface-sunken text-content-subtle border border-line'
                          )}
                        >
                          {completed}/{total}
                        </span>
                      </div>

                      {/* Batch Take Button if multiple pending */}
                      {pending > 1 && !isPast && (
                        <button
                          type="button"
                          onClick={() => handleMarkRoutineTaken(bucketDoses, slot.label)}
                          className="w-full mt-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-500/20 transition-all cursor-pointer tap-spring"
                        >
                          Take all {pending} due ✓
                        </button>
                      )}

                      {/* Daypart Medicine List */}
                      <div className="space-y-2.5 mt-3">
                        {bucketDoses.length === 0 ? (
                          pastFromThisBucket.length > 0 ? (
                            <div className="h-28 flex flex-col items-center justify-center text-xs text-content-subtle text-center p-2">
                              <span className="font-semibold text-content-muted">
                                {pastFromThisBucket.length} overdue {pastFromThisBucket.length === 1 ? 'dose' : 'doses'} in Past Doses drawer
                              </span>
                              <span className="text-[11px] mt-1 text-amber-700 dark:text-amber-400 font-bold">
                                Window closed · Log above
                              </span>
                            </div>
                          ) : allDone ? (
                            <div className="h-28 flex flex-col items-center justify-center text-xs text-teal-700 dark:text-teal-400 text-center p-2">
                              <span className="font-bold">✓ All {total} doses logged</span>
                              <span className="text-[11px] text-content-subtle mt-0.5">Great job!</span>
                            </div>
                          ) : (
                            <div className="h-28 flex items-center justify-center text-xs text-content-subtle italic">
                              No doses in {slot.label.toLowerCase()}
                            </div>
                          )
                        ) : (
                          bucketDoses.map((dose) => {
                            const medicine = medicinesMap[dose.medicine_id];
                            const isTaken = dose.status === 'taken';
                            const isSkipped = dose.status === 'skipped';
                            const isMissed = deriveStatusOnRead(dose, new Date()) === 'missed';
                            const stock = inventory[dose.medicine_id];
                            const mealInst = deriveMealInstruction(
                              medicine?.with_food,
                              key,
                              medicine?.instructions
                            );

                            return (
                              <div
                                key={dose.id}
                                className={clsx(
                                  'p-3.5 rounded-2xl border transition-all space-y-2.5',
                                  isTaken
                                    ? 'bg-surface-sunken/40 border-line/40 opacity-75'
                                    : isMissed
                                      ? 'bg-amber-500/5 border-amber-400/80 shadow-2xs'
                                      : 'bg-surface-sunken/70 border-line hover:border-line-strong shadow-2xs'
                                )}
                              >
                                {/* Top info row */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-content bg-surface px-2 py-0.5 rounded-lg border border-line">
                                    <Clock size={10} /> {formatDoseTime(dose.scheduled_minutes)}
                                  </span>

                                  {stock !== undefined && stock <= 5 && (
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                                      <AlertCircle size={10} /> {stock === 0 ? 'Out' : `${stock} left`}
                                    </span>
                                  )}
                                </div>

                                {/* Medicine name & strength */}
                                <div>
                                  <h4
                                    className={clsx(
                                      'text-xs sm:text-sm font-bold text-content tracking-tight leading-tight',
                                      isTaken && 'line-through text-content-muted'
                                    )}
                                  >
                                    {medicine?.medicine_name || 'Prescribed medicine'}
                                  </h4>
                                  <p className="text-[11px] text-content-muted font-medium mt-0.5">
                                    {medicine?.strength ? `${medicine.strength} · ` : ''}
                                    {medicine?.dose_amount || (medicine?.form ? `1 ${medicine.form}` : '1 dose')}
                                  </p>
                                </div>

                                {/* Bottom action bar */}
                                <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-2">
                                  <div className="text-[10px] font-bold text-content-subtle min-w-0 flex-1">
                                    {medicine?.with_food === true ? (
                                      <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[10px] sm:text-[11px] font-bold truncate shadow-2xs"
                                        title={mealInst}
                                      >
                                        <Utensils size={11} className="text-amber-700 dark:text-amber-400 shrink-0" />
                                        <span className="truncate">{mealInst}</span>
                                      </span>
                                    ) : medicine?.with_food === false ? (
                                      <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 text-[10px] sm:text-[11px] font-bold truncate shadow-2xs"
                                        title={mealInst}
                                      >
                                        <Droplets size={11} className="text-sky-700 dark:text-sky-400 shrink-0" />
                                        <span className="truncate">{mealInst}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-medium text-content-subtle">
                                        Direct
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {!isTaken && !isSkipped ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenSkip(dose)}
                                          className="p-1 rounded-lg text-[10px] text-content-subtle hover:text-content"
                                          title="Skip dose"
                                        >
                                          Skip
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleMarkTaken(dose)}
                                          className={clsx(
                                            'px-3 py-1 rounded-xl text-xs font-bold text-white shadow-2xs tap-spring cursor-pointer flex items-center gap-1',
                                            isMissed
                                              ? 'bg-amber-600 hover:bg-amber-700'
                                              : 'bg-teal-600 hover:bg-teal-700'
                                          )}
                                        >
                                          <Check size={12} className="stroke-[3]" />
                                          {isMissed ? 'Overdue' : 'Take'}
                                        </button>
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
                                          {isTaken ? '✓ Taken' : 'Skipped'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleUndo(dose)}
                                          className="p-1 rounded-lg text-content-subtle hover:text-content"
                                          title="Undo dose"
                                        >
                                          <RotateCcw size={11} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Bento Block Footer Action */}
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-content-subtle">
                      <span>{slot.label} Regimen</span>
                      <button
                        type="button"
                        onClick={() => {
                          const firstMed = bucketDoses[0] ? medicinesMap[bucketDoses[0].medicine_id] : null;
                          if (firstMed) handleOpenOrderModal(firstMed);
                        }}
                        className="text-accent hover:underline font-bold flex items-center gap-0.5"
                      >
                        <ShoppingBag size={11} /> Refill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Medication Order & WhatsApp Procurement Modal */}
      <MedicineOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        medicine={selectedMedicineForOrder}
        profileId={effectiveProfileId}
        onStockUpdated={handleStockUpdated}
      />

      {/* Skip Reason Recording Dialog */}
      <Dialog
        open={skipDialogOpen}
        onOpenChange={setSkipDialogOpen}
        title="Record Reason for Skipping Dose"
        description="Recording a reason ensures clinical accuracy for your attending physician and adherence analytics."
      >
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            {SKIP_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedSkipReason === reason
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                    : 'border-line hover:bg-surface-hover'
                }`}
              >
                <input
                  type="radio"
                  name="skipReason"
                  value={reason}
                  checked={selectedSkipReason === reason}
                  onChange={(e) => setSelectedSkipReason(e.target.value)}
                  className="accent-accent w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-semibold text-content">{reason}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-line">
            <Button
              variant="ghost"
              onClick={() => setSkipDialogOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSkip}
              className="text-xs font-bold tap-spring"
            >
              Confirm Skip
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Late Dose Safety & Dose-Stacking Risk Dialog */}
      <Dialog
        open={lateDoseDialogOpen}
        onOpenChange={(open) => {
          setLateDoseDialogOpen(open);
          if (!open) {
            setActiveDoseForLateCheck(null);
            setLateDoseStep('prompt');
            setLateDoseRisk(null);
          }
        }}
        title="Late Dose Safety Check"
        description={
          lateDoseStep === 'warning'
            ? 'Clinical dose-stacking risk alert'
            : 'Out-of-window administration verification'
        }
      >
        {activeDoseForLateCheck && (
          <div className="space-y-4 pt-1">
            {/* Context Medication Card */}
            {medicinesMap[activeDoseForLateCheck.medicine_id] && (
              <div className="p-3.5 rounded-2xl bg-surface-sunken border border-line flex items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-content text-sm">
                    {medicinesMap[activeDoseForLateCheck.medicine_id]?.medicine_name}
                  </h4>
                  <p className="text-content-muted text-[11px] mt-0.5">
                    {medicinesMap[activeDoseForLateCheck.medicine_id]?.strength
                      ? `${medicinesMap[activeDoseForLateCheck.medicine_id]?.strength} · `
                      : ''}
                    {medicinesMap[activeDoseForLateCheck.medicine_id]?.dose_amount || '1 dose'} ·
                    Scheduled at {formatDoseTime(activeDoseForLateCheck.scheduled_minutes)}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/20 whitespace-nowrap">
                  Overdue Dose
                </span>
              </div>
            )}

            {lateDoseStep === 'prompt' ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-content leading-relaxed">
                  Did you take this dose earlier today, or are you taking it right now?
                </p>

                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    variant="secondary"
                    onClick={handleTookEarlier}
                    className="w-full justify-start text-xs font-bold py-3 px-4 rounded-xl border-line hover:border-accent hover:bg-surface-hover tap-spring cursor-pointer"
                  >
                    <Clock size={15} className="mr-2 text-accent" />
                    I took it earlier today
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleTakingNow}
                    className="w-full justify-start text-xs font-bold py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white tap-spring cursor-pointer"
                  >
                    <Check size={15} className="mr-2 stroke-[3]" />
                    I am taking it right now
                  </Button>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLateDoseDialogOpen(false)}
                    className="text-xs text-content-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* High-visibility clinical warning alert */}
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400 dark:border-amber-600/50 text-amber-950 dark:text-amber-100 space-y-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                      size={20}
                    />
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-sm font-black tracking-tight text-amber-900 dark:text-amber-200">
                        Clinical Warning: Dose Stacking Risk
                      </h4>
                      <p className="text-xs font-semibold leading-relaxed">
                        Warning: Taking this dose right now is very close to your upcoming dose. Taking doses too close together can lead to accidental double-dosing or side effects.
                      </p>
                      {lateDoseRisk?.message && (
                        <p className="text-xs text-amber-900/90 dark:text-amber-200/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-400/30 leading-relaxed font-medium">
                          {lateDoseRisk.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Two clear actions */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    variant="secondary"
                    onClick={handleSkipPerSafety}
                    className="w-full text-xs font-bold py-2.5 rounded-xl border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100/60 tap-spring cursor-pointer"
                  >
                    Skip this dose per safety advice
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleTakeAnyway}
                    className="w-full text-xs font-bold py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white tap-spring cursor-pointer"
                  >
                    Take anyway
                  </Button>
                </div>

                <div className="pt-1 flex justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLateDoseStep('prompt')}
                    className="text-xs text-content-muted"
                  >
                    ← Back to options
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
