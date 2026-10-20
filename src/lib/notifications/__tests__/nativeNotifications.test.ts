import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stringToNotificationId,
  isCapacitor,
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
  DOSE_CHANNEL_ID,
  DOSE_ACTION_TYPE_ID,
  ACTION_TAKEN_ID,
  ACTION_SNOOZE_15M_ID,
} from '../nativeNotifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import type { Tables } from '../../supabase/types';

type Dose = Tables<'doses'>;
type Medicine = Tables<'medicines'>;

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    createChannel: vi.fn().mockResolvedValue(undefined),
    registerActionTypes: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    checkExactNotificationSetting: vi.fn().mockResolvedValue({ exact_alarm: 'granted' }),
    changeExactNotificationSetting: vi.fn().mockResolvedValue({ exact_alarm: 'granted' }),
    schedule: vi.fn().mockResolvedValue({ notifications: [] }),
    cancel: vi.fn().mockResolvedValue(undefined),
    removeDeliveredNotificationsById: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../db', () => ({
  dosesRepo: {
    updateDoseStatus: vi.fn().mockResolvedValue({ id: 'dose-1', status: 'taken' }),
    snoozeDose: vi.fn().mockResolvedValue({ id: 'dose-1', snoozed_until: new Date().toISOString() }),
  },
}));

describe('Native Android Notifications & Alarm Scheduling Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    it('identifies Capacitor native Android environment correctly', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

      expect(isCapacitor()).toBe(true);
      expect(isNativeAndroid()).toBe(true);
      expect(getPlatformType()).toBe('android');
    });

    it('identifies Web browser environment when not native', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

      expect(isCapacitor()).toBe(false);
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

    it('schedules 4 daily recurring alarms in Capacitor Android', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

      const success = await scheduleRecurringDailySlotAlarms();
      expect(success).toBe(true);

      expect(LocalNotifications.createChannel).toHaveBeenCalled();
      expect(LocalNotifications.registerActionTypes).toHaveBeenCalledWith({
        types: [
          expect.objectContaining({
            id: DOSE_ACTION_TYPE_ID,
            actions: expect.arrayContaining([
              expect.objectContaining({ id: ACTION_TAKEN_ID }),
              expect.objectContaining({ id: ACTION_SNOOZE_15M_ID }),
            ]),
          }),
        ],
      });

      expect(LocalNotifications.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              id: 8001,
              schedule: { on: { hour: 8, minute: 0 }, repeats: true, allowWhileIdle: true },
            }),
            expect.objectContaining({
              id: 8002,
              schedule: { on: { hour: 13, minute: 0 }, repeats: true, allowWhileIdle: true },
            }),
            expect.objectContaining({
              id: 8003,
              schedule: { on: { hour: 18, minute: 30 }, repeats: true, allowWhileIdle: true },
            }),
            expect.objectContaining({
              id: 8004,
              schedule: { on: { hour: 21, minute: 30 }, repeats: true, allowWhileIdle: true },
            }),
          ]),
        })
      );
    });
  });

  describe('Dose Schedule Synchronization (syncDoseScheduleAlarms)', () => {
    it('schedules exact future alarms and cancels taken doses', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

      // Tomorrow's date in YYYY-MM-DD
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      const doses: Dose[] = [
        {
          id: 'dose-future-1',
          user_id: 'user-1',
          profile_id: 'profile-1',
          medicine_id: 'med-1',
          scheduled_date: tomorrow,
          scheduled_minutes: 480, // 08:00 AM
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

      // Verify notification payload
      expect(LocalNotifications.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              id: stringToNotificationId('dose-dose-future-1'),
              title: 'Time for Metformin 500mg',
              channelId: DOSE_CHANNEL_ID,
              actionTypeId: DOSE_ACTION_TYPE_ID,
              isExactNotification: true,
            }),
          ]),
        })
      );
    });
  });

  describe('Permissions Handling (Android 13+ & Exact Alarms)', () => {
    it('requests POST_NOTIFICATIONS and checks exact alarms on Android', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

      const result = await requestNotificationPermissions();
      expect(result.display).toBe('granted');
      expect(result.canScheduleExactAlarms).toBe(true);
      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
      expect(LocalNotifications.checkExactNotificationSetting).toHaveBeenCalled();
    });

    it('checks permissions accurately', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

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
    it('schedules notification through Capacitor when native', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      const delivered = await sendUnifiedLocalNotification('Dose Reminder', {
        body: 'Time to take Metformin',
        doseId: 'dose-test',
      });

      expect(delivered).toBe(true);
      expect(LocalNotifications.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              title: 'Dose Reminder',
              body: 'Time to take Metformin',
              channelId: DOSE_CHANNEL_ID,
              actionTypeId: DOSE_ACTION_TYPE_ID,
            }),
          ]),
        })
      );
    });
  });
});
