import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCompanionPairingToken,
  verifyCompanionPairingToken,
  hasCompanionPin,
  setCompanionPin,
  verifyCompanionPin,
  removeCompanionPin,
  isCompanionLocked,
  recordCompanionActivity,
} from '../companionPairing';

describe('companionPairing Security & PIN Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Pairing Token Lifecycle', () => {
    it('creates and verifies a valid pairing token', async () => {
      const token = await createCompanionPairingToken(
        'user-123',
        'profile-456',
        'Father (Muhammad Ali)',
        'caregiver@example.com'
      );

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      const verification = await verifyCompanionPairingToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.userId).toBe('user-123');
      expect(verification.payload?.profileId).toBe('profile-456');
      expect(verification.payload?.profileName).toBe('Father (Muhammad Ali)');
    });

    it('rejects an expired pairing token', async () => {
      vi.useFakeTimers();
      const token = await createCompanionPairingToken('user-123', 'profile-456', 'Father');

      // Fast forward past 15 min TTL
      vi.advanceTimersByTime(16 * 60 * 1000);

      const verification = await verifyCompanionPairingToken(token);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('expired');
      vi.useRealTimers();
    });

    it('rejects a tampered pairing token', async () => {
      const token = await createCompanionPairingToken('user-123', 'profile-456', 'Father');
      const decoded = JSON.parse(decodeURIComponent(atob(token)));
      decoded.userId = 'attacker-999'; // Tampering
      const tamperedToken = btoa(encodeURIComponent(JSON.stringify(decoded)));

      const verification = await verifyCompanionPairingToken(tamperedToken);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('signature');
    });
  });

  describe('4-Digit PIN Security', () => {
    it('initializes without PIN, then sets and verifies PIN with salt', async () => {
      expect(hasCompanionPin()).toBe(false);

      await setCompanionPin('4829');
      expect(hasCompanionPin()).toBe(true);

      // Verify correct PIN
      const correctRes = await verifyCompanionPin('4829');
      expect(correctRes.success).toBe(true);

      // Verify wrong PIN
      const wrongRes = await verifyCompanionPin('0000');
      expect(wrongRes.success).toBe(false);
      expect(wrongRes.remainingAttempts).toBe(4);
    });

    it('rejects non-4-digit PINs during setup', async () => {
      await expect(setCompanionPin('123')).rejects.toThrow('must be exactly 4 digits');
      await expect(setCompanionPin('12345')).rejects.toThrow('must be exactly 4 digits');
      await expect(setCompanionPin('abcd')).rejects.toThrow('must be exactly 4 digits');
    });

    it('enforces lockout after 5 consecutive incorrect attempts', async () => {
      await setCompanionPin('7777');

      for (let i = 0; i < 4; i++) {
        const res = await verifyCompanionPin('1111');
        expect(res.success).toBe(false);
      }

      // 5th failed attempt should trigger lockout
      const finalRes = await verifyCompanionPin('1111');
      expect(finalRes.success).toBe(false);
      expect(finalRes.remainingAttempts).toBe(0);
      expect(finalRes.error).toContain('Locked for 60 seconds');

      // Subsequent attempt even with correct PIN is blocked during lockout
      const blockedRes = await verifyCompanionPin('7777');
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.error).toContain('wait');
    });

    it('removes PIN and clears security state upon reset', async () => {
      await setCompanionPin('9999');
      expect(hasCompanionPin()).toBe(true);

      removeCompanionPin();
      expect(hasCompanionPin()).toBe(false);
    });

    it('handles inactivity locking', () => {
      vi.useFakeTimers();
      recordCompanionActivity();

      // Immediately after activity, not locked
      expect(isCompanionLocked()).toBe(false);

      // With a PIN set, advance 6 minutes (exceeds 5 min inactivity)
      localStorage.setItem('curewell_companion_pin_hash', 'dummy-hash');
      vi.advanceTimersByTime(6 * 60 * 1000);
      expect(isCompanionLocked()).toBe(true);

      vi.useRealTimers();
    });
  });
});
