/**
 * Local & Native notification delivery for Curewell / Medfolio.
 *
 * Provides a unified notification interface across Web (PWA / Service Worker)
 * and Native Android / Capacitor (LocalNotifications, Exact Alarms, Channels).
 */

import {
  isCapacitor,
  checkNotificationPermissions,
  requestNotificationPermissions,
  sendUnifiedLocalNotification,
  scheduleRecurringDailySlotAlarms,
  initNativeNotifications,
} from './nativeNotifications';

export * from './nativeNotifications';

const SW_READY_TIMEOUT_MS = 3000;

let cachedNativePermission: NotificationPermission | null = null;

// Proactively update native permission cache on load if in Capacitor
if (typeof window !== 'undefined' && isCapacitor()) {
  checkNotificationPermissions().then((status) => {
    cachedNativePermission =
      status.display === 'granted'
        ? 'granted'
        : status.display === 'denied'
        ? 'denied'
        : 'default';
  }).catch(() => {
    // Ignore error
  });
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Also initialize native channels and action listeners
  initNativeNotifications().catch((err) => {
    console.warn('initNativeNotifications failed during SW registration:', err);
  });

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Requests notification permissions across both Native Android (Android 13+ POST_NOTIFICATIONS)
 * and Web browsers.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const result = await requestNotificationPermissions();
  const perm: NotificationPermission =
    result.display === 'granted'
      ? 'granted'
      : result.display === 'denied'
      ? 'denied'
      : 'default';

  cachedNativePermission = perm;

  // If granted, proactively ensure recurring daily dose slot alarms are active
  if (perm === 'granted') {
    scheduleRecurringDailySlotAlarms().catch((err) => {
      console.warn('scheduleRecurringDailySlotAlarms after permission grant failed:', err);
    });
  }

  return perm;
}

/**
 * Synchronous permission check. Returns 'granted', 'denied', or 'default'.
 */
export function notificationPermission(): NotificationPermission {
  if (isCapacitor()) {
    return cachedNativePermission ?? 'default';
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }

  return 'denied';
}

/** Resolves the SW registration, or null if none arrives promptly. */
async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
}

/**
 * Sends a local notification.
 * In Capacitor Android: routes to native NotificationManager with high-priority channel & actions.
 * In Web: routes to Service Worker showNotification with fallback to Notification constructor.
 */
export async function sendLocalNotification(
  title: string,
  options?: NotificationOptions & { doseId?: string; profileId?: string; routeUrl?: string }
): Promise<boolean> {
  if (isCapacitor()) {
    return sendUnifiedLocalNotification(title, {
      body: options?.body,
      tag: options?.tag,
      doseId: options?.doseId,
      profileId: options?.profileId,
      routeUrl: options?.routeUrl || '/today',
    });
  }

  // Web path
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const baseOptions: NotificationOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options,
  };

  const registration = await readyRegistration();
  if (registration) {
    try {
      await registration.showNotification(title, baseOptions);
      return true;
    } catch (err) {
      console.warn('Service worker notification failed, falling back:', err);
    }
  }

  // Fallback path
  try {
    new Notification(title, baseOptions);
    return true;
  } catch (err) {
    console.warn('Notification could not be shown:', err);
    return false;
  }
}
