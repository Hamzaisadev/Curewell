import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stringToNotificationId,
  isNativeAndroid,
  getPlatformType,
  DEFAULT_DOSE_SLOTS,
  scheduleRecurringDailySlotAlarms,
  syncDoseScheduleAlarms,
  checkNotificationPermissions,
  requestNotificationPermissions,
  onNotificationAction,
  onNotificationNavigate,
  routeToPage,
  sendUnifiedLocalNotification,
} from '../nativeNotifications';
import type { Tables } from '../../supabase/types';

type Dose = Tables<'doses'>;
type Medicine = Tables<'medicines'>;

vi.mock('../../db', () => ({
  dosesRepo: {
    updateDoseStatus: vi.fn().mockResolvedValue({ id: 'dose-1', status: 'taken' }),
    snoozeDose: vi.fn().mockResolvedValue({ id: 'dose-1', snoozed_until: new Date().toISOString() }),
  },
}));

describe('Notifications & Dose Alarm Scheduling Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockNotification = vi.fn();
    Object.assign(mockNotification, {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    });
    vi.stubGlobal('Notification', mockNotification);
  });

  describe('stringToNotificationId', () => {
    it('produces deterministic positive 32-bit integers', () => {
      const id1 = stringToNotificationId('dose-abc-123');
      const id2 = stringToNotificationId('dose-abc-123');
      const id3 = stringToNotificationId('dose-xyz-789');

      expect(id1).toBe(id2);
      expect(typeof id1).toBe('number');
      expect(id1).toBeGreaterThanOrEqual(10000);
      expect(id1).toBeLessThan(2147483647);
      expect(id1).not.toBe(id3);
    });
  });

  describe('Platform Detection', () => {
    it('identifies Web browser environment cleanly without any web wrapper', () => {
      expect(isNativeAndroid()).toBe(false);
      expect(getPlatformType()).toBe('web');
    });
  });

  describe('Recurring Daily Dose Slot Alarms', () => {
    it('defines 4 canonical dose slots (Morning, Afternoon, Evening, Night)', () => {
      expect(DEFAULT_DOSE_SLOTS).toHaveLength(4);
      const slots = DEFAULT_DOSE_SLOTS.map((s) => s.slot);
      expect(slots).toEqual(['morning', 'afternoon', 'evening', 'night']);

      const morning = DEFAULT_DOSE_SLOTS.find((s) => s.slot === 'morning');
      expect(morning?.hour).toBe(8);
      expect(morning?.minute).toBe(0);

      const afternoon = DEFAULT_DOSE_SLOTS.find((s) => s.slot === 'afternoon');
      expect(afternoon?.hour).toBe(13);
      expect(afternoon?.minute).toBe(0);

      const evening = DEFAULT_DOSE_SLOTS.find((s) => s.slot === 'evening');
      expect(evening?.hour).toBe(18);
      expect(evening?.minute).toBe(30);

      const night = DEFAULT_DOSE_SLOTS.find((s) => s.slot === 'night');
      expect(night?.hour).toBe(21);
      expect(night?.minute).toBe(30);
    });

    it('schedules 4 daily recurring slot alarms when permission is granted', async () => {
      const success = await scheduleRecurringDailySlotAlarms();
      expect(success).toBe(true);
    });
  });

  describe('Dose Schedule Synchronization (syncDoseScheduleAlarms)', () => {
    it('schedules future alarms and cancels taken doses', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      const doses: Dose[] = [
        {
          id: 'dose-future-1',
          user_id: 'user-1',
          profile_id: 'profile-1',
          medicine_id: 'med-1',
          scheduled_date: tomorrow,
          scheduled_minutes: 480,
          status: 'pending',
          taken_at: null,
          skipped_reason: null,
          snoozed_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'dose-taken-2',
          user_id: 'user-1',
          profile_id: 'profile-1',
          medicine_id: 'med-1',
          scheduled_date: tomorrow,
          scheduled_minutes: 840,
          status: 'taken',
          taken_at: new Date().toISOString(),
          skipped_reason: null,
          snoozed_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const medicines: Medicine[] = [
        {
          id: 'med-1',
          profile_id: 'profile-1',
          medicine_name: 'Metformin 500mg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Medicine,
      ];

      const result = await syncDoseScheduleAlarms({
        profileId: 'profile-1',
        doses,
        medicines,
        preferences: {
          enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          snooze_minutes: 15,
          lead_minutes: 5,
        },
      });

      expect(result.cancelledCount).toBe(1);
      expect(result.scheduledCount).toBe(1);
    });
  });

  describe('Permissions Handling', () => {
    it('requests notification permissions cleanly', async () => {
      const result = await requestNotificationPermissions();
      expect(result.display).toBe('granted');
      expect(result.canScheduleExactAlarms).toBe(true);
    });

    it('checks permissions accurately', async () => {
      const status = await checkNotificationPermissions();
      expect(status.display).toBe('granted');
      expect(status.canScheduleExactAlarms).toBe(true);
    });
  });

  describe('Action & Click Routing', () => {
    it('registers and invokes notification navigation listeners', () => {
      const navSpy = vi.fn();
      const unsub = onNotificationNavigate(navSpy);

      routeToPage('/medicines');
      expect(navSpy).toHaveBeenCalledWith('/medicines');

      unsub();
      routeToPage('/settings');
      expect(navSpy).not.toHaveBeenCalledWith('/settings');
    });

    it('registers and removes notification action listeners', () => {
      const actionSpy = vi.fn();
      const unsub = onNotificationAction(actionSpy);

      expect(typeof unsub).toBe('function');
      unsub();
    });
  });

  describe('sendUnifiedLocalNotification', () => {
    it('delivers notification when granted', async () => {
      const delivered = await sendUnifiedLocalNotification('Dose Reminder', {
        body: 'Time to take Metformin',
        doseId: 'dose-test',
      });

      expect(delivered).toBe(true);
    });
  });
});
