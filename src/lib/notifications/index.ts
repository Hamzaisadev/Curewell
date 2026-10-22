/**
 * Local & Service Worker notification delivery for Curewell / Medfolio.
 */

import {
  requestNotificationPermissions,
  scheduleRecurringDailySlotAlarms,
  initNativeNotifications,
} from './nativeNotifications';

export * from './nativeNotifications';

const SW_READY_TIMEOUT_MS = 3000;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
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
 * Requests notification permissions on Web browsers.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const result = await requestNotificationPermissions();
  const perm: NotificationPermission =
    result.display === 'granted'
      ? 'granted'
      : result.display === 'denied'
      ? 'denied'
      : 'default';

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
 * Sends a local notification via Service Worker showNotification with fallback to Notification constructor.
 */
export async function sendLocalNotification(
  title: string,
  options?: NotificationOptions & { doseId?: string; profileId?: string; routeUrl?: string }
): Promise<boolean> {
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

  try {
    new Notification(title, baseOptions);
    return true;
  } catch (err) {
    console.warn('Notification could not be shown:', err);
    return false;
  }
}
