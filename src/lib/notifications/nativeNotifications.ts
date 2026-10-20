/**
 * Native Android & Unified Notifications Service for Curewell / Medfolio.
 *
 * Implements:
 * 1. Runtime environment detection (Capacitor Native Android vs Web/PWA).
 * 2. Native Android Local Notifications via `@capacitor/local-notifications` with
 *    graceful fallback to Service Worker / Web Notification API.
 * 3. Daily recurring alarms for medication slots (Morning, Afternoon, Evening, Night).
 * 4. Actionable notification channels and interactive buttons ("✓ Taken" & "⏰ Snooze 15m").
 * 5. Notification click & action routing with automatic dose status recording.
 * 6. Clean Android 13+ `POST_NOTIFICATIONS` and Android 12+ exact alarm permission handling.
 */

import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type Channel,
  type ActionPerformed,
  type LocalNotificationSchema,
  type ScheduleOn,
} from '@capacitor/local-notifications';
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

export function isCapacitor(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export function getPlatformType(): 'android' | 'ios' | 'web' {
  try {
    if (!Capacitor.isNativePlatform()) return 'web';
    return Capacitor.getPlatform() === 'android' ? 'android' : 'ios';
  } catch {
    return 'web';
  }
}

/* ---------------------------------------------------------------------------
   Notification ID Generation
--------------------------------------------------------------------------- */

/**
 * Deterministically maps a string (e.g. dose ID or slot name) to a positive 32-bit
 * integer safe for Android NotificationManager.
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

    // If BrowserRouter history is available, trigger navigation
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
 * Initializes notification channels, action types, and background event listeners.
 * Safe to call repeatedly; only executes initialization once.
 */
export async function initNativeNotifications(): Promise<void> {
  if (isInitialized) return;

  if (isCapacitor()) {
    try {
      // 1. Setup notification channels (Android 8.0+ / API 26+)
      const reminderChannel: Channel = {
        id: DOSE_CHANNEL_ID,
        name: DOSE_CHANNEL_NAME,
        description: 'High-priority notifications and alerts for scheduled medicine doses',
        importance: 5, // High importance (heads-up banner and sound)
        visibility: 1, // Visible on lockscreen
        vibration: true,
        lights: true,
        lightColor: '#059669', // Medfolio brand emerald
      };

      const alarmChannel: Channel = {
        id: ALARM_CHANNEL_ID,
        name: ALARM_CHANNEL_NAME,
        description: 'Medication dose alarms and urgent timers',
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#DC2626', // Red
      };

      await LocalNotifications.createChannel(reminderChannel);
      await LocalNotifications.createChannel(alarmChannel);

      // 2. Register actionable buttons ("Taken" and "Snooze 15m")
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: DOSE_ACTION_TYPE_ID,
            actions: [
              {
                id: ACTION_TAKEN_ID,
                title: '✓ Taken',
                foreground: false,
              },
              {
                id: ACTION_SNOOZE_15M_ID,
                title: '⏰ Snooze 15m',
                foreground: false,
              },
            ],
          },
        ],
      });

      // 3. Register click and action listeners
      await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        async (action: ActionPerformed) => {
          await handleNotificationActionPerformed(action);
        }
      );

      await LocalNotifications.addListener(
        'localNotificationReceived',
        (notification: LocalNotificationSchema) => {
          console.info('Medfolio notification delivered:', notification.id, notification.title);
        }
      );

      isInitialized = true;
    } catch (err) {
      console.warn('Native notification initialization warning:', err);
      // Still mark initialized so we don't spam errors
      isInitialized = true;
    }
  } else {
    // Web fallback: listen for service worker messages when action buttons are clicked
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
}

/* ---------------------------------------------------------------------------
   Action Performed Handler
--------------------------------------------------------------------------- */

async function handleNotificationActionPerformed(action: ActionPerformed): Promise<void> {
  const actionId = action.actionId;
  const extra = action.notification.extra || {};
  const doseId = extra.doseId as string | undefined;
  const profileId = extra.profileId as string | undefined;
  const routeUrl = (extra.routeUrl as string) || '/today';

  // 1. Tapping the notification body (default action)
  if (actionId === 'tap') {
    routeToPage(routeUrl);
    return;
  }

  // 2. Interactive action buttons
  await executeAction(actionId, doseId, profileId, extra);

  // Clear delivered notification if an action button was selected
  try {
    await LocalNotifications.removeDeliveredNotificationsById({
      ids: [action.notification.id],
    });
  } catch {
    // Non-fatal if removal fails
  }
}

/**
 * Handles business logic for notification action buttons ("Taken" / "Snooze").
 */
async function executeAction(
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

        // Schedule new notification in 15 minutes
        const snoozeDate = new Date(Date.now() + 15 * 60 * 1000);
        await scheduleNotification({
          id: stringToNotificationId(`snooze-${doseId}-${Date.now()}`),
          title: (extra?.medicineName as string)
            ? `Reminder: ${(extra?.medicineName as string)}`
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

  // Notify registered in-app action listeners
  actionListeners.forEach((fn) => {
    try {
      fn({ actionId, doseId, profileId, extra });
    } catch (err) {
      console.warn('Action listener failed:', err);
    }
  });
}

/* ---------------------------------------------------------------------------
   Permissions (Android 13+ POST_NOTIFICATIONS & Exact Alarms)
--------------------------------------------------------------------------- */

export interface UnifiedPermissionStatus {
  display: 'granted' | 'denied' | 'prompt';
  canScheduleExactAlarms: boolean;
}

/**
 * Checks current notification and alarm permissions across Native and Web.
 */
export async function checkNotificationPermissions(): Promise<UnifiedPermissionStatus> {
  if (isCapacitor()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      let canScheduleExact = true;

      if (isNativeAndroid()) {
        try {
          const exactSetting = await LocalNotifications.checkExactNotificationSetting();
          canScheduleExact = exactSetting.exact_alarm === 'granted';
        } catch {
          // Exact notification setting not supported on older Android versions
          canScheduleExact = true;
        }
      }

      const display =
        perm.display === 'granted' ? 'granted' : perm.display === 'denied' ? 'denied' : 'prompt';

      return {
        display,
        canScheduleExactAlarms: canScheduleExact,
      };
    } catch {
      return { display: 'prompt', canScheduleExactAlarms: true };
    }
  }

  // Web check
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
 * Cleanly requests notification permission from the operating system.
 * Handles Android 13+ runtime POST_NOTIFICATIONS dialog and exact alarm prompt.
 */
export async function requestNotificationPermissions(): Promise<UnifiedPermissionStatus> {
  await initNativeNotifications();

  if (isCapacitor()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      let canScheduleExact = true;

      if (isNativeAndroid()) {
        try {
          const exactSetting = await LocalNotifications.checkExactNotificationSetting();
          canScheduleExact = exactSetting.exact_alarm === 'granted';

          // On Android 12+, if exact alarms are denied, direct user to settings screen if necessary
          if (!canScheduleExact) {
            const updatedExact = await LocalNotifications.changeExactNotificationSetting();
            canScheduleExact = updatedExact.exact_alarm === 'granted';
          }
        } catch {
          canScheduleExact = true;
        }
      }

      const display =
        res.display === 'granted' ? 'granted' : res.display === 'denied' ? 'denied' : 'prompt';

      return {
        display,
        canScheduleExactAlarms: canScheduleExact,
      };
    } catch (err) {
      console.warn('Native requestPermissions failed:', err);
      return { display: 'denied', canScheduleExactAlarms: false };
    }
  }

  // Web request
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
   Unified Local Notification Delivery (Foreground & Immediate)
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
 * Delivers an immediate local notification using Capacitor LocalNotifications on Android/iOS
 * or Service Worker / Web Notification API on Web.
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

  if (isCapacitor()) {
    try {
      const notifId = options?.tag
        ? stringToNotificationId(options.tag)
        : Math.floor(Math.random() * 1000000) + 1;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body: options?.body || '',
            channelId: options?.channelId || DOSE_CHANNEL_ID,
            actionTypeId: DOSE_ACTION_TYPE_ID,
            extra: {
              doseId: options?.doseId,
              profileId: options?.profileId,
              routeUrl: options?.routeUrl || '/today',
            },
            schedule: {
              at: new Date(Date.now() + 500), // Fire in 500ms
              allowWhileIdle: true,
            },
            isExactNotification: true,
            autoCancel: true,
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Native local notification delivery failed, falling back to Web:', err);
    }
  }

  // Fallback to Web / Service Worker
  return sendWebNotification(title, options);
}

/**
 * Service Worker / Web Notification fallback path.
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
    // Web Action buttons for supported browsers
    actions: [
      { action: 'taken', title: '✓ Taken' },
      { action: 'snooze', title: '⏰ Snooze 15m' },
    ],
  };

  // Attempt delivery via Service Worker
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

  // Final fallback to Notification constructor
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

/**
 * Schedules recurring daily background alarms for the 4 primary medicine dose slots:
 * - Morning: 08:00
 * - Afternoon: 13:00
 * - Evening: 18:30
 * - Night: 21:30
 *
 * When on Native Android, uses `LocalNotifications.schedule` with `on: { hour, minute }`,
 * `repeats: true`, and `allowWhileIdle: true` (Doze mode wakeup).
 */
export async function scheduleRecurringDailySlotAlarms(
  customSlots?: Partial<DoseSlotAlarmConfig>[]
): Promise<boolean> {
  await initNativeNotifications();

  const permissions = await checkNotificationPermissions();
  if (permissions.display !== 'granted') {
    return false;
  }

  const slotsToSchedule: DoseSlotAlarmConfig[] = DEFAULT_DOSE_SLOTS.map((def) => {
    const override = customSlots?.find((c) => c.slot === def.slot);
    return override ? { ...def, ...override } : def;
  });

  if (isCapacitor()) {
    try {
      const notifications: LocalNotificationSchema[] = slotsToSchedule.map((slot) => {
        const scheduleOn: ScheduleOn = {
          hour: slot.hour,
          minute: slot.minute,
        };

        return {
          id: slot.notificationId,
          title: slot.title,
          body: slot.body,
          channelId: ALARM_CHANNEL_ID,
          actionTypeId: DOSE_ACTION_TYPE_ID,
          schedule: {
            on: scheduleOn,
            repeats: true,
            allowWhileIdle: true,
          },
          extra: {
            slot: slot.slot,
            type: 'recurring_slot_alarm',
            routeUrl: '/today',
          },
          isExactNotification: true,
          autoCancel: true,
        };
      });

      // Cancel existing slot notifications before rescheduling to prevent duplicates
      await LocalNotifications.cancel({
        notifications: slotsToSchedule.map((s) => ({ id: s.notificationId })),
      });

      await LocalNotifications.schedule({ notifications });
      console.info('Scheduled 4 recurring daily dose slot alarms into device.');
      return true;
    } catch (err) {
      console.warn('Failed to schedule recurring daily slot alarms:', err);
      return false;
    }
  }

  // On Web: background alarms cannot wake up a dead tab without native wrappers,
  // but we record the preference cleanly.
  return true;
}

/**
 * Cancels all recurring daily slot alarms.
 */
export async function cancelAllSlotAlarms(): Promise<void> {
  if (isCapacitor()) {
    try {
      await LocalNotifications.cancel({
        notifications: DEFAULT_DOSE_SLOTS.map((s) => ({ id: s.notificationId })),
      });
    } catch (err) {
      console.warn('cancelAllSlotAlarms failed:', err);
    }
  }
}

/* ---------------------------------------------------------------------------
   Scheduling Exact Alarms for Specific Doses
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

/**
 * Schedules a single local notification at an exact future date/time.
 */
export async function scheduleNotification(params: ScheduleNotificationParams): Promise<boolean> {
  if (params.at.getTime() <= Date.now()) {
    return false;
  }

  if (isCapacitor()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: params.id,
            title: params.title,
            body: params.body,
            channelId: DOSE_CHANNEL_ID,
            actionTypeId: DOSE_ACTION_TYPE_ID,
            schedule: {
              at: params.at,
              allowWhileIdle: true,
            },
            extra: {
              doseId: params.doseId,
              profileId: params.profileId,
              medicineName: params.medicineName,
              routeUrl: params.routeUrl || '/today',
            },
            isExactNotification: true,
            autoCancel: true,
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Failed to schedule exact native notification:', err);
      return false;
    }
  }

  return false;
}

/**
 * Cancels a scheduled notification by dose ID.
 */
export async function cancelDoseNotification(doseId: string): Promise<void> {
  if (isCapacitor()) {
    try {
      const notifId = stringToNotificationId(`dose-${doseId}`);
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
    } catch {
      // Ignore cancel errors
    }
  }
}

/* ---------------------------------------------------------------------------
   Dose Schedule Synchronization
--------------------------------------------------------------------------- */

/**
 * Helper to construct a Date object for a dose scheduled on `dateStr` (YYYY-MM-DD)
 * at `minutes` (0-1439 PKT / Asia/Karachi UTC+5).
 */
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

/**
 * Connects the native notification scheduler to the user's active medication schedule.
 * When dose schedules change:
 * 1. Cancels completed or skipped doses.
 * 2. Schedules exact native alarms into Android for pending doses due today and upcoming.
 * 3. Ensures recurring slot alarms (Morning, Afternoon, Evening, Night) are active.
 */
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

    // If dose is taken or skipped, cancel pending notification
    if (dose.status === 'taken' || dose.status === 'skipped') {
      if (isCapacitor()) {
        try {
          await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
          cancelledCount++;
        } catch {
          // Ignore cancel error
        }
      }
      continue;
    }

    // Pending dose: compute target alarm time
    let targetTime: Date;
    if (dose.snoozed_until) {
      targetTime = new Date(dose.snoozed_until);
    } else {
      const doseTime = doseDateTime(dose.scheduled_date, dose.scheduled_minutes);
      targetTime = new Date(doseTime.getTime() - leadMinutes * 60 * 1000);
    }

    // Only schedule if the alarm time is in the future
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

  // Ensure recurring daily slot alarms are also present on the device
  try {
    await scheduleRecurringDailySlotAlarms();
  } catch (err) {
    console.warn('Could not refresh daily slot alarms:', err);
  }

  return { scheduledCount, cancelledCount };
}
