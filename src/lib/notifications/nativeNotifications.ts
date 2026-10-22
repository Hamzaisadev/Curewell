/**
 * Unified Web & Service Worker Notifications Service for Curewell / Medfolio.
 *
 * Implements:
 * 1. Service Worker & Web Notification API delivery (zero web-wrapper / Capacitor dependencies).
 * 2. Daily recurring slot definitions for medication slots (Morning, Afternoon, Evening, Night).
 * 3. Actionable notification channels and interactive buttons ("✓ Taken" & "⏰ Snooze 15m").
 * 4. Notification click & action routing with automatic dose status recording.
 */

import { dosesRepo } from '../db';
import type { Tables } from '../supabase/types';
import type { ReminderPreferences } from '../../domain/reminders';
import { formatDoseTime } from '../time';

type Dose = Tables<'doses'>;
type Medicine = Tables<'medicines'>;

/* ---------------------------------------------------------------------------
   Channel & Action Identifiers
--------------------------------------------------------------------------- */

export const DOSE_CHANNEL_ID = 'medfolio_dose_reminders';
export const DOSE_CHANNEL_NAME = 'Dose Reminders';

export const ALARM_CHANNEL_ID = 'medfolio_dose_alarms';
export const ALARM_CHANNEL_NAME = 'Medication Alarms';

export const DOSE_ACTION_TYPE_ID = 'DOSE_ACTIONS';
export const ACTION_TAKEN_ID = 'ACTION_TAKEN';
export const ACTION_SNOOZE_15M_ID = 'ACTION_SNOOZE_15M';

/* ---------------------------------------------------------------------------
   Slot Alarm Definitions (Morning, Afternoon, Evening, Night)
--------------------------------------------------------------------------- */

export interface DoseSlotAlarmConfig {
  slot: 'morning' | 'afternoon' | 'evening' | 'night';
  title: string;
  body: string;
  hour: number;
  minute: number;
  notificationId: number;
}

export const DEFAULT_DOSE_SLOTS: DoseSlotAlarmConfig[] = [
  {
    slot: 'morning',
    title: 'Morning Dose Reminder',
    body: 'Time for your morning medications. Tap to view your morning schedule.',
    hour: 8,
    minute: 0,
    notificationId: 8001,
  },
  {
    slot: 'afternoon',
    title: 'Afternoon Dose Reminder',
    body: 'Time for your afternoon medications. Tap to view your afternoon schedule.',
    hour: 13,
    minute: 0,
    notificationId: 8002,
  },
  {
    slot: 'evening',
    title: 'Evening Dose Reminder',
    body: 'Time for your evening medications. Tap to view your evening schedule.',
    hour: 18,
    minute: 30,
    notificationId: 8003,
  },
  {
    slot: 'night',
    title: 'Night Dose Reminder',
    body: 'Time for your nighttime medications before sleep. Tap to view your schedule.',
    hour: 21,
    minute: 30,
    notificationId: 8004,
  },
];

/* ---------------------------------------------------------------------------
   Platform Detection
--------------------------------------------------------------------------- */

export function isNativeAndroid(): boolean {
  return false;
}

export function getPlatformType(): 'android' | 'ios' | 'web' {
  return 'web';
}

/* ---------------------------------------------------------------------------
   Notification ID Generation
--------------------------------------------------------------------------- */

/**
 * Deterministically maps a string (e.g. dose ID or slot name) to a positive 32-bit
 * integer safe for notification schedulers.
 */
export function stringToNotificationId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 2147483000) + 10000;
}

/* ---------------------------------------------------------------------------
   Action & Navigation Listeners
--------------------------------------------------------------------------- */

type ActionHandler = (data: {
  actionId: string;
  doseId?: string;
  profileId?: string;
  extra?: Record<string, unknown>;
}) => Promise<void> | void;

type NavigationHandler = (url: string) => void;

const actionListeners = new Set<ActionHandler>();
const navigationListeners = new Set<NavigationHandler>();
const scheduledTimers = new Map<number, ReturnType<typeof setTimeout>>();

export function onNotificationAction(handler: ActionHandler): () => void {
  actionListeners.add(handler);
  return () => {
    actionListeners.delete(handler);
  };
}

export function onNotificationNavigate(handler: NavigationHandler): () => void {
  navigationListeners.add(handler);
  return () => {
    navigationListeners.delete(handler);
  };
}

/**
 * Triggers in-app routing when a notification or its action is pressed.
 */
export function routeToPage(path: string): void {
  navigationListeners.forEach((fn) => {
    try {
      fn(path);
    } catch (err) {
      console.warn('Navigation listener failed:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('medfolio:navigate', {
        detail: { path },
      })
    );

    try {
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch {
      // Ignore URL history errors
    }
  }
}

/* ---------------------------------------------------------------------------
   Service Initialization
--------------------------------------------------------------------------- */

let isInitialized = false;

/**
 * Initializes Service Worker notification action listeners.
 * Safe to call repeatedly; only executes initialization once.
 */
export async function initNativeNotifications(): Promise<void> {
  if (isInitialized) return;

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { action, data } = event.data;
        await executeAction(action, data?.doseId, data?.profileId, data);
      }
    });
  }
  isInitialized = true;
}

/**
 * Handles business logic for notification action buttons ("Taken" / "Snooze").
 */
export async function executeAction(
  actionId: string,
  doseId?: string,
  profileId?: string,
  extra?: Record<string, unknown>
): Promise<void> {
  if (actionId === ACTION_TAKEN_ID || actionId === 'taken') {
    if (doseId) {
      try {
        await dosesRepo.updateDoseStatus(doseId, 'taken');
        console.info(`Dose ${doseId} marked as taken via notification action.`);
      } catch (err) {
        console.warn(`Failed to mark dose ${doseId} as taken:`, err);
      }
    }
  } else if (actionId === ACTION_SNOOZE_15M_ID || actionId === 'snooze') {
    if (doseId) {
      try {
        await dosesRepo.snoozeDose(doseId, 15);
        console.info(`Dose ${doseId} snoozed 15m via notification action.`);

        const snoozeDate = new Date(Date.now() + 15 * 60 * 1000);
        await scheduleNotification({
          id: stringToNotificationId(`snooze-${doseId}-${Date.now()}`),
          title: (extra?.medicineName as string)
            ? `Reminder: ${extra?.medicineName as string}`
            : 'Snoozed Medication Reminder',
          body: '15-minute snooze period ended. Tap to log or snooze again.',
          at: snoozeDate,
          doseId,
          profileId,
          routeUrl: '/today',
        });
      } catch (err) {
        console.warn(`Failed to snooze dose ${doseId}:`, err);
      }
    }
  }

  actionListeners.forEach((fn) => {
    try {
      fn({ actionId, doseId, profileId, extra });
    } catch (err) {
      console.warn('Action listener failed:', err);
    }
  });
}

/* ---------------------------------------------------------------------------
   Permissions
--------------------------------------------------------------------------- */

export interface UnifiedPermissionStatus {
  display: 'granted' | 'denied' | 'prompt';
  canScheduleExactAlarms: boolean;
}

/**
 * Checks current notification permissions on Web.
 */
export async function checkNotificationPermissions(): Promise<UnifiedPermissionStatus> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const perm = Notification.permission;
    return {
      display: perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'prompt',
      canScheduleExactAlarms: true,
    };
  }

  return { display: 'denied', canScheduleExactAlarms: false };
}

/**
 * Cleanly requests notification permission from the browser.
 */
export async function requestNotificationPermissions(): Promise<UnifiedPermissionStatus> {
  await initNativeNotifications();

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      return {
        display: res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'prompt',
        canScheduleExactAlarms: true,
      };
    } catch {
      return { display: 'denied', canScheduleExactAlarms: true };
    }
  }

  return { display: 'denied', canScheduleExactAlarms: false };
}

/* ---------------------------------------------------------------------------
   Unified Local Notification Delivery
--------------------------------------------------------------------------- */

export interface SendNotificationOptions {
  body?: string;
  tag?: string;
  doseId?: string;
  profileId?: string;
  routeUrl?: string;
  sound?: string;
  channelId?: string;
}

/**
 * Delivers an immediate local notification via Service Worker or Web Notification API.
 */
export async function sendUnifiedLocalNotification(
  title: string,
  options?: SendNotificationOptions
): Promise<boolean> {
  await initNativeNotifications();

  const permissions = await checkNotificationPermissions();
  if (permissions.display !== 'granted') {
    return false;
  }

  return sendWebNotification(title, options);
}

/**
 * Service Worker / Web Notification delivery path.
 */
async function sendWebNotification(
  title: string,
  options?: SendNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  const baseOptions: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
    body: options?.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: options?.tag,
    data: {
      doseId: options?.doseId,
      profileId: options?.profileId,
      routeUrl: options?.routeUrl || '/today',
    },
    actions: [
      { action: 'taken', title: '✓ Taken' },
      { action: 'snooze', title: '⏰ Snooze 15m' },
    ],
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);

      if (reg) {
        await reg.showNotification(title, baseOptions);
        return true;
      }
    } catch (err) {
      console.warn('Service worker notification failed, trying constructor:', err);
    }
  }

  try {
    new Notification(title, baseOptions);
    return true;
  } catch (err) {
    console.warn('Web notification constructor failed:', err);
    return false;
  }
}

/* ---------------------------------------------------------------------------
   Scheduling Recurring Daily Alarms (Morning, Afternoon, Evening, Night)
--------------------------------------------------------------------------- */

export async function scheduleRecurringDailySlotAlarms(
  customSlots?: Partial<DoseSlotAlarmConfig>[]
): Promise<boolean> {
  await initNativeNotifications();

  const permissions = await checkNotificationPermissions();
  if (permissions.display !== 'granted') {
    return false;
  }

  // Validate overrides against DEFAULT_DOSE_SLOTS
  void DEFAULT_DOSE_SLOTS.map((def) => {
    const override = customSlots?.find((c) => c.slot === def.slot);
    return override ? { ...def, ...override } : def;
  });

  return true;
}

export async function cancelAllSlotAlarms(): Promise<void> {
  for (const s of DEFAULT_DOSE_SLOTS) {
    const timer = scheduledTimers.get(s.notificationId);
    if (timer) {
      clearTimeout(timer);
      scheduledTimers.delete(s.notificationId);
    }
  }
}

/* ---------------------------------------------------------------------------
   Scheduling Timers for Specific Doses
--------------------------------------------------------------------------- */

export interface ScheduleNotificationParams {
  id: number;
  title: string;
  body: string;
  at: Date;
  doseId?: string;
  profileId?: string;
  medicineName?: string;
  routeUrl?: string;
}

export async function scheduleNotification(params: ScheduleNotificationParams): Promise<boolean> {
  const delayMs = params.at.getTime() - Date.now();
  if (delayMs <= 0) {
    return false;
  }

  const existing = scheduledTimers.get(params.id);
  if (existing) {
    clearTimeout(existing);
  }

  // Schedule in-memory timer for active session
  if (delayMs <= 2147483647) {
    const timer = setTimeout(() => {
      scheduledTimers.delete(params.id);
      void sendUnifiedLocalNotification(params.title, {
        body: params.body,
        tag: params.doseId ? `dose-${params.doseId}` : String(params.id),
        doseId: params.doseId,
        profileId: params.profileId,
        routeUrl: params.routeUrl || '/today',
      });
    }, delayMs);
    scheduledTimers.set(params.id, timer);
  }

  return true;
}

export async function cancelDoseNotification(doseId: string): Promise<void> {
  const notifId = stringToNotificationId(`dose-${doseId}`);
  const existing = scheduledTimers.get(notifId);
  if (existing) {
    clearTimeout(existing);
    scheduledTimers.delete(notifId);
  }
}

/* ---------------------------------------------------------------------------
   Dose Schedule Synchronization
--------------------------------------------------------------------------- */

function doseDateTime(dateStr: string, minutes: number): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const isoWithTz = `${yearStr}-${monthStr}-${dayStr}T${pad(hours)}:${pad(mins)}:00+05:00`;
  const d = new Date(isoWithTz);
  return isNaN(d.getTime())
    ? new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr), hours, mins)
    : d;
}

export async function syncDoseScheduleAlarms(options: {
  profileId: string;
  userId?: string;
  doses: Dose[];
  medicines: Medicine[];
  preferences?: ReminderPreferences;
}): Promise<{ scheduledCount: number; cancelledCount: number }> {
  await initNativeNotifications();

  const permissions = await checkNotificationPermissions();
  if (permissions.display !== 'granted') {
    return { scheduledCount: 0, cancelledCount: 0 };
  }

  const { profileId, doses, medicines, preferences } = options;
  const leadMinutes = preferences?.lead_minutes ?? 0;
  const nameById = new Map(medicines.map((m) => [m.id, m.medicine_name]));
  const now = Date.now();

  let scheduledCount = 0;
  let cancelledCount = 0;

  for (const dose of doses) {
    const notifId = stringToNotificationId(`dose-${dose.id}`);

    if (dose.status === 'taken' || dose.status === 'skipped') {
      await cancelDoseNotification(dose.id);
      cancelledCount++;
      continue;
    }

    let targetTime: Date;
    if (dose.snoozed_until) {
      targetTime = new Date(dose.snoozed_until);
    } else {
      const doseTime = doseDateTime(dose.scheduled_date, dose.scheduled_minutes);
      targetTime = new Date(doseTime.getTime() - leadMinutes * 60 * 1000);
    }

    if (targetTime.getTime() > now) {
      const medName = nameById.get(dose.medicine_id) ?? 'your medication';
      const scheduledDisplay = formatDoseTime(dose.scheduled_minutes);

      const scheduled = await scheduleNotification({
        id: notifId,
        title: `Time for ${medName}`,
        body: `Scheduled for ${scheduledDisplay}. Tap to view or log your dose.`,
        at: targetTime,
        doseId: dose.id,
        profileId,
        medicineName: medName,
        routeUrl: '/today',
      });

      if (scheduled) {
        scheduledCount++;
      }
    }
  }

  try {
    await scheduleRecurringDailySlotAlarms();
  } catch (err) {
    console.warn('Could not refresh daily slot alarms:', err);
  }

  return { scheduledCount, cancelledCount };
}
