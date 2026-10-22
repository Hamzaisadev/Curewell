import { useEffect, useRef, useCallback } from 'react';
import { dosesRepo, medicinesRepo, remindersRepo } from '../db';
import {
  selectDueReminders,
  reminderBody,
  type ReminderCandidate,
  type ReminderPreferences,
} from '../../domain/reminders';
import { formatDoseTime, minutesInAppTz, todayInAppTz } from '../time';
import {
  sendLocalNotification,
  syncDoseScheduleAlarms,
  checkNotificationPermissions,
  onNotificationAction,
} from './index';

const POLL_INTERVAL_MS = 60_000;

/**
 * Delivers dose reminders and manages scheduled dose notifications for the active profile.
 *
 * Capabilities:
 * 1. Synchronizes scheduled notifications for due doses.
 * 2. In foreground, runs a 60-second tick to announce due doses immediately.
 * 3. Listens for interactive notification actions ("Taken" / "Snooze 15m") and updates
 *    state reactively.
 */
export function useDoseReminders(profileId: string, userId: string): void {
  // Per-dose dedupe so a dose is announced once in foreground, not every poll.
  const notifiedRef = useRef<Set<string>>(new Set());
  const notifiedDayRef = useRef<string>('');
  const lastSyncHashRef = useRef<string>('');

  const runSync = useCallback(async () => {
    if (!profileId) return;

    try {
      const perm = await checkNotificationPermissions();
      if (perm.display !== 'granted') return;

      const today = todayInAppTz();

      // Reset dedupe on day rollover
      if (notifiedDayRef.current !== today) {
        notifiedDayRef.current = today;
        notifiedRef.current = new Set();
      }

      const [settings, doses, medicines] = await Promise.all([
        remindersRepo.getReminderSettings(profileId, userId),
        dosesRepo.listDosesForDate(profileId, today),
        medicinesRepo.listMedicines(profileId),
      ]);

      if (!settings.enabled) return;

      const preferences: ReminderPreferences = {
        enabled: settings.enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
        snooze_minutes: settings.snooze_minutes,
        lead_minutes: settings.lead_minutes,
      };

      // 1. Sync native alarms into the device OS when doses or settings change
      const currentSyncHash = `${today}-${doses.map((d) => `${d.id}:${d.status}:${d.snoozed_until}`).join(',')}`;
      if (currentSyncHash !== lastSyncHashRef.current) {
        lastSyncHashRef.current = currentSyncHash;
        await syncDoseScheduleAlarms({
          profileId,
          userId,
          doses,
          medicines,
          preferences,
        });
      }

      // 2. Foreground check for due reminders
      const nameById = new Map(medicines.map((m) => [m.id, m.medicine_name]));
      const candidates: ReminderCandidate[] = doses.map((d) => ({
        doseId: d.id,
        medicineName: nameById.get(d.medicine_id) ?? 'your medicine',
        scheduledDate: d.scheduled_date,
        scheduledMinutes: d.scheduled_minutes,
        status: d.status,
        snoozedUntilMinutes: d.snoozed_until ? minutesInAppTz(new Date(d.snoozed_until)) : null,
      }));

      const due = selectDueReminders(
        candidates,
        preferences,
        minutesInAppTz(),
        today,
        notifiedRef.current
      );

      for (const reminder of due) {
        const shown = await sendLocalNotification(`Time for ${reminder.medicineName}`, {
          body: reminderBody(reminder, formatDoseTime),
          tag: `dose-${reminder.doseId}`,
          doseId: reminder.doseId,
          profileId,
          routeUrl: '/today',
        });

        if (shown) {
          notifiedRef.current.add(reminder.doseId);
        }
      }
    } catch (err) {
      console.warn('Dose reminder check/sync failed:', err);
    }
  }, [profileId, userId]);

  useEffect(() => {
    if (!profileId) return;

    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      await runSync();
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);

    // Listen for notification action button clicks (Taken / Snooze) and re-sync
    const unsubscribe = onNotificationAction(async () => {
      // Small delay to allow DB writes to settle before re-syncing
      setTimeout(() => {
        if (!cancelled) {
          runSync();
        }
      }, 500);
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [profileId, userId, runSync]);
}
