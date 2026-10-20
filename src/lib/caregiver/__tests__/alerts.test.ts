import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCaregiverAlertMessage,
  generateCaregiverAlertMessageUrdu,
  formatWhatsAppPhone,
  generateWhatsAppAlertUrl,
  isDoseOverdue,
  getDoseOverdueMinutes,
  getCaregiverPreferences,
  saveCaregiverPreferences,
  isFamilyPassActive,
  setFamilyPassActive,
  getFamilyPassInfo,
  DEFAULT_CAREGIVER_PREFERENCES,
} from '../alerts';

describe('Caregiver Alerts & Monetization Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateCaregiverAlertMessage', () => {
    it('produces the exact required alert copy structure', () => {
      const msg = generateCaregiverAlertMessage({
        profileName: 'Ammi Jan',
        medicineName: 'Glucophage',
        doseAmount: '500mg',
        scheduledTime: '08:00 AM',
      });

      expect(msg).toBe(
        'Curewell Health Alert: Ammi Jan has not taken their scheduled Glucophage (500mg) due at 08:00 AM. Please check in with them.'
      );
    });

    it('formats numeric scheduledTime minutes into 12h display', () => {
      const msg = generateCaregiverAlertMessage({
        profileName: 'Father',
        medicineName: 'Panadol CF',
        doseAmount: '2 tablets',
        scheduledTime: 540, // 09:00 AM
      });

      expect(msg).toBe(
        'Curewell Health Alert: Father has not taken their scheduled Panadol CF (2 tablets) due at 09:00 AM. Please check in with them.'
      );
    });

    it('falls back gracefully when dose amount is not provided', () => {
      const msg = generateCaregiverAlertMessage({
        profileName: 'Tariq',
        medicineName: 'Insulin Glargine',
        scheduledTime: '10:00 PM',
      });

      expect(msg).toBe(
        'Curewell Health Alert: Tariq has not taken their scheduled Insulin Glargine (Prescribed dose) due at 10:00 PM. Please check in with them.'
      );
    });

    it('produces bilingual Urdu translation when requested', () => {
      const urdu = generateCaregiverAlertMessageUrdu({
        profileName: 'والدہ صاحبہ',
        medicineName: 'Glucophage',
        scheduledTime: '08:00 AM',
      });

      expect(urdu).toContain('کیورویل ہیلتھ الرٹ');
      expect(urdu).toContain('والدہ صاحبہ');
      expect(urdu).toContain('Glucophage');
    });
  });

  describe('formatWhatsAppPhone & generateWhatsAppAlertUrl', () => {
    it('normalizes Pakistani local 03XX mobile numbers to international 923XX', () => {
      expect(formatWhatsAppPhone('03001234567')).toBe('923001234567');
      expect(formatWhatsAppPhone('0300 123 4567')).toBe('923001234567');
      expect(formatWhatsAppPhone('0300-1234567')).toBe('923001234567');
    });

    it('normalizes 10-digit 3XX numbers to 923XX', () => {
      expect(formatWhatsAppPhone('3001234567')).toBe('923001234567');
    });

    it('strips leading + and spaces from international format', () => {
      expect(formatWhatsAppPhone('+92 300 1234567')).toBe('923001234567');
      expect(formatWhatsAppPhone('+1 (555) 123-4567')).toBe('15551234567');
    });

    it('generates wa.me URL with clean phone and url-encoded text', () => {
      const url = generateWhatsAppAlertUrl('03001234567', {
        profileName: 'Father',
        medicineName: 'Amoxicillin',
        doseAmount: '500mg',
        scheduledTime: '08:00 AM',
      });

      expect(url).toContain('https://wa.me/923001234567?text=');
      expect(url).toContain(encodeURIComponent('Curewell Health Alert: Father has not taken their scheduled Amoxicillin (500mg) due at 08:00 AM. Please check in with them.'));
    });
  });

  describe('isDoseOverdue & getDoseOverdueMinutes', () => {
    const fixedNow = new Date('2026-10-20T10:00:00Z'); // 15:00 PKT (900 minutes since midnight)

    it('identifies unconfirmed dose past 60 min threshold as overdue', () => {
      // Scheduled at 13:00 PKT (780 mins), current time 15:00 PKT (900 mins) -> 120 mins elapsed (>60)
      const dose = {
        scheduled_date: '2026-10-20',
        scheduled_minutes: 780,
        status: 'pending',
      };

      expect(isDoseOverdue(dose, { now: fixedNow, thresholdMinutes: 60 })).toBe(true);
      expect(getDoseOverdueMinutes(dose, { now: fixedNow })).toBe(120);
    });

    it('does not flag a dose as overdue if within 60-minute window', () => {
      // Scheduled at 14:30 PKT (870 mins), current time 15:00 PKT (900 mins) -> 30 mins elapsed (<60)
      const dose = {
        scheduled_date: '2026-10-20',
        scheduled_minutes: 870,
        status: 'pending',
      };

      expect(isDoseOverdue(dose, { now: fixedNow, thresholdMinutes: 60 })).toBe(false);
      expect(getDoseOverdueMinutes(dose, { now: fixedNow })).toBe(30);
    });

    it('does not flag taken or skipped doses as overdue even if time has passed', () => {
      const takenDose = {
        scheduled_date: '2026-10-20',
        scheduled_minutes: 480,
        status: 'taken',
      };
      const skippedDose = {
        scheduled_date: '2026-10-20',
        scheduled_minutes: 480,
        status: 'skipped',
      };

      expect(isDoseOverdue(takenDose, { now: fixedNow })).toBe(false);
      expect(isDoseOverdue(skippedDose, { now: fixedNow })).toBe(false);
    });

    it('flags unconfirmed doses from previous dates as overdue', () => {
      const pastDose = {
        scheduled_date: '2026-10-19',
        scheduled_minutes: 480,
        status: 'missed',
      };

      expect(isDoseOverdue(pastDose, { now: fixedNow })).toBe(true);
    });
  });

  describe('Preferences & Family Pass state management', () => {
    it('returns default preferences if none saved', () => {
      const prefs = getCaregiverPreferences('profile-123');
      expect(prefs).toEqual(DEFAULT_CAREGIVER_PREFERENCES);
    });

    it('saves and retrieves preferences per profile', () => {
      saveCaregiverPreferences(
        {
          enabled: true,
          caregiverName: 'Fatima',
          caregiverPhone: '03009876543',
          overdueThresholdMinutes: 45,
        },
        'profile-test'
      );

      const loaded = getCaregiverPreferences('profile-test');
      expect(loaded.enabled).toBe(true);
      expect(loaded.caregiverName).toBe('Fatima');
      expect(loaded.caregiverPhone).toBe('03009876543');
      expect(loaded.overdueThresholdMinutes).toBe(45);
    });

    it('manages Family Pass subscription state', () => {
      expect(isFamilyPassActive()).toBe(false);

      setFamilyPassActive(true, 'annual_pkr');
      expect(isFamilyPassActive()).toBe(true);
      expect(getFamilyPassInfo()).toEqual({
        isActive: true,
        plan: 'annual_pkr',
      });

      setFamilyPassActive(false);
      expect(isFamilyPassActive()).toBe(false);
      expect(getFamilyPassInfo()).toEqual({
        isActive: false,
        plan: null,
      });
    });
  });
});
