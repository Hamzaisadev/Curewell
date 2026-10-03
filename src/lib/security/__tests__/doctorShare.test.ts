import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDoctorShareToken,
  resolveDoctorShareToken,
  revokeDoctorShareToken,
  listDoctorShareTokens,
  clearDoctorShares,
  sha256Hex,
  calculateShareExpiration,
  validateDoctorSharePin,
  SHARE_DURATION_HOURS,
  type DoctorShareScope,
} from '../doctorShare';
import { profilesRepo } from '../../db';

vi.mock('../../db', () => ({
  profilesRepo: {
    getProfileById: vi.fn(),
  },
}));

describe('Ephemeral Scoped Doctor Sharing & Cryptographic Token Service', () => {
  const profileId = 'patient-profile-42';
  const sampleScope: DoctorShareScope = {
    conditions: ['Cardiology', 'Endocrinology'],
    categories: ['bloodwork', 'imaging'],
    dateFrom: '2025-01-01',
    dateTo: '2026-01-01',
    reportIds: ['rep-001', 'rep-002'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearDoctorShares();
    vi.mocked(profilesRepo.getProfileById).mockResolvedValue({
      id: profileId,
      user_id: 'user-auth-1',
      full_name: 'Dr. Tariq Khan (Patient)',
      relationship: 'self',
      date_of_birth: '1978-06-15',
      sex: 'male',
      blood_group: 'B+',
      height_cm: 175,
      weight_kg: 80,
      allergies: 'Aspirin',
      chronic_conditions: 'Cardiology, Hypertension',
      emergency_contact_name: 'Amina Khan',
      emergency_contact_phone: '+92 300 1234567',
      is_default: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Cryptographic Token Generation & High-Entropy Strings', () => {
    it('generates a URL-safe, high-entropy cryptographic token', () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
      });

      expect(share).toBeDefined();
      expect(typeof share.token).toBe('string');
      // 32 bytes base64url encoded is 43 characters
      expect(share.token.length).toBeGreaterThanOrEqual(32);
      // Strictly URL-safe characters: A-Z, a-z, 0-9, -, _
      expect(share.token).toMatch(/^[A-Za-z0-9_-]+$/);
      // Disallows characters that would corrupt URLs without encoding
      expect(share.token).not.toContain('+');
      expect(share.token).not.toContain('/');
      expect(share.token).not.toContain('=');
      expect(share.token).not.toContain(' ');
    });

    it('generates distinct, non-colliding entropy on consecutive calls', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const share = createDoctorShareToken({
          profileId,
          scope: sampleScope,
          duration: '24h',
        });
        expect(tokens.has(share.token)).toBe(false);
        tokens.add(share.token);
      }
      expect(tokens.size).toBe(20);
    });

    it('calculates explicit ISO timestamps for all supported durations', () => {
      const baseTime = new Date('2026-10-03T10:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);

      const singleVisitShare = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: 'single_visit',
      });
      const share24h = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
      });
      const share7d = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '7d',
      });
      const share30d = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '30d',
      });

      // single_visit = 4 hours
      expect(singleVisitShare.expiresAt).toBe('2026-10-03T14:00:00.000Z');
      expect(singleVisitShare.expires_at).toBe('2026-10-03T14:00:00.000Z');

      // 24h
      expect(share24h.expiresAt).toBe('2026-10-04T10:00:00.000Z');

      // 7d = 7 * 24h
      expect(share7d.expiresAt).toBe('2026-10-10T10:00:00.000Z');

      // 30d = 30 * 24h
      expect(share30d.expiresAt).toBe('2026-11-02T10:00:00.000Z');
    });

    it('hashes optional PIN with SHA-256 for secure storage and verifies digest accuracy', () => {
      const pin = '4829';
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
        pin,
      });

      expect(share.isPinProtected).toBe(true);
      expect(share.is_pin_protected).toBe(true);
      expect(share.pinHash).not.toBeNull();
      expect(share.pin_hash).not.toBeNull();
      expect(share.pinHash).toBe(sha256Hex(pin));
      expect(share.pinHash).toMatch(/^[0-9a-f]{64}$/);

      // Verify SHA-256 against known test vector: "abc"
      expect(sha256Hex('abc')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
      // Known vector for "1234"
      expect(sha256Hex('1234')).toBe(
        '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
      );
    });

    it('sets null PIN hash and isPinProtected: false when no PIN is supplied', () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '7d',
      });

      expect(share.isPinProtected).toBe(false);
      expect(share.is_pin_protected).toBe(false);
      expect(share.pinHash).toBeNull();
      expect(share.pin_hash).toBeNull();
    });
  });

  describe('2. Expiration Enforcement', () => {
    it('resolves an active, unexpired token successfully', async () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
      });

      const result = await resolveDoctorShareToken(share.token);
      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.status).toBe('valid');
      expect(result.profileId).toBe(profileId);
    });

    it('rejects resolution when the token has expired in time', async () => {
      const baseTime = new Date('2026-10-03T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);

      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
      });

      // Still valid at 23 hours
      vi.setSystemTime(new Date(baseTime.getTime() + 23 * 60 * 60 * 1000));
      const validCheck = await resolveDoctorShareToken(share.token);
      expect(validCheck.success).toBe(true);
      expect(validCheck.status).toBe('valid');

      // Expired at 25 hours
      vi.setSystemTime(new Date(baseTime.getTime() + 25 * 60 * 60 * 1000));
      const expiredCheck = await resolveDoctorShareToken(share.token);
      expect(expiredCheck.success).toBe(false);
      expect(expiredCheck.valid).toBe(false);
      expect(expiredCheck.status).toBe('expired');
      expect(expiredCheck.error).toMatch(/expired/i);
    });

    it('rejects access for single_visit shares after the 4-hour window', async () => {
      const baseTime = new Date('2026-10-03T09:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);

      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: 'single_visit',
      });

      // 3 hours in -> valid
      vi.setSystemTime(new Date(baseTime.getTime() + 3 * 60 * 60 * 1000));
      const activeRes = await resolveDoctorShareToken(share.token);
      expect(activeRes.success).toBe(true);

      // 4 hours 1 second in -> expired
      vi.setSystemTime(new Date(baseTime.getTime() + 4 * 60 * 60 * 1000 + 1000));
      const expiredRes = await resolveDoctorShareToken(share.token);
      expect(expiredRes.success).toBe(false);
      expect(expiredRes.status).toBe('expired');
    });
  });

  describe('3. PIN Protection Enforcement', () => {
    it('demands PIN entry when token is protected and enteredPin is absent', async () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '7d',
        pin: '1234',
      });

      const result = await resolveDoctorShareToken(share.token);
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.status).toBe('pin_required');
      expect(result.error).toMatch(/pin is required/i);
    });

    it('rejects resolution when incorrect PIN is entered', async () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '7d',
        pin: '9876',
      });

      const result = await resolveDoctorShareToken(share.token, '0000');
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.status).toBe('invalid_pin');
      expect(result.error).toMatch(/incorrect pin/i);
    });

    it('grants full access when the correct PIN is provided', async () => {
      const pin = '8821';
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '7d',
        pin,
      });

      // Trimming test: handles trailing whitespace from clinic keyboards
      const result = await resolveDoctorShareToken(share.token, `  ${pin}  `);
      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.status).toBe('valid');
      expect(result.scope).toEqual(sampleScope);
    });

    it('validates PIN helper functions', () => {
      const pin = '5544';
      const hash = sha256Hex(pin);
      expect(validateDoctorSharePin('5544', hash)).toBe(true);
      expect(validateDoctorSharePin('0000', hash)).toBe(false);
    });
  });

  describe('4. Scope Filtration & Read-Only Profile Projection', () => {
    it('faithfully preserves and returns the granular clinical scope', async () => {
      const customScope: DoctorShareScope = {
        conditions: ['Nephrology', 'Diabetes'],
        categories: ['bloodwork'],
        dateFrom: '2024-06-01',
        dateTo: '2024-12-31',
        reportIds: ['rep-kidney-panel-1'],
      };

      const share = createDoctorShareToken({
        profileId,
        scope: customScope,
        duration: '30d',
      });

      const result = await resolveDoctorShareToken(share.token);
      expect(result.success).toBe(true);
      expect(result.scope).toBeDefined();
      expect(result.scope?.conditions).toEqual(['Nephrology', 'Diabetes']);
      expect(result.scope?.categories).toEqual(['bloodwork']);
      expect(result.scope?.dateFrom).toBe('2024-06-01');
      expect(result.scope?.dateTo).toBe('2024-12-31');
      expect(result.scope?.reportIds).toEqual(['rep-kidney-panel-1']);
    });

    it('returns sanitized patient profile metadata with zero write capability', async () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
      });

      const result = await resolveDoctorShareToken(share.token);
      expect(result.profile).toBeDefined();
      expect(result.profile?.id).toBe(profileId);
      expect(result.profile?.full_name).toBe('Dr. Tariq Khan (Patient)');
      expect(result.profile?.allergies).toBe('Aspirin');
      expect(result.profile?.chronic_conditions).toBe('Cardiology, Hypertension');
      // Verify sensitive auth fields like user_id or passwords are not leaked
      expect((result.profile as Record<string, unknown>).user_id).toBeUndefined();
    });

    it('increments view count telemetry upon each successful resolution', async () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
      });

      await resolveDoctorShareToken(share.token);
      await resolveDoctorShareToken(share.token);
      const res = await resolveDoctorShareToken(share.token);

      expect(res.success).toBe(true);
      const tokens = await listDoctorShareTokens(profileId);
      const found = tokens.find((t) => t.id === share.id);
      expect(found?.viewCount).toBe(3);
      expect(found?.lastViewedAt).not.toBeNull();
    });
  });

  describe('5. Instant Revocation Boundary', () => {
    it('immediately terminates access upon patient revocation', async () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '7d',
      });

      // Initially valid
      const initialRes = await resolveDoctorShareToken(share.token);
      expect(initialRes.success).toBe(true);

      // Patient executes 1-tap instant revocation
      const revoked = await revokeDoctorShareToken(share.id, profileId);
      expect(revoked).toBe(true);

      // Subsequent attempt by doctor is blocked on the spot
      const blockedRes = await resolveDoctorShareToken(share.token);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.valid).toBe(false);
      expect(blockedRes.status).toBe('revoked');
      expect(blockedRes.is_revoked).toBe(true);
      expect(blockedRes.isRevoked).toBe(true);
      expect(blockedRes.error).toMatch(/revoked/i);
    });

    it('allows revocation by passing raw token string directly', async () => {
      const share = createDoctorShareToken({
        profileId,
        scope: sampleScope,
        duration: '24h',
      });

      const revoked = await revokeDoctorShareToken(share.token, profileId);
      expect(revoked).toBe(true);

      const res = await resolveDoctorShareToken(share.token);
      expect(res.status).toBe('revoked');
    });

    it('prohibits unauthorized patients from revoking shares belonging to another profile', async () => {
      const share = createDoctorShareToken({
        profileId: 'patient-A',
        scope: sampleScope,
        duration: '24h',
      });

      const maliciousRevocation = await revokeDoctorShareToken(share.id, 'patient-B');
      expect(maliciousRevocation).toBe(false);

      // Token remains active for patient A's consulting physician
      const checkRes = await resolveDoctorShareToken(share.token);
      expect(checkRes.success).toBe(true);
      expect(checkRes.status).toBe('valid');
    });
  });

  describe('6. Edge Cases & Boundary Handling', () => {
    it('returns not_found status for non-existent or fabricated tokens', async () => {
      const res = await resolveDoctorShareToken('non-existent-fake-token-xyz-123');
      expect(res.success).toBe(false);
      expect(res.status).toBe('not_found');
      expect(res.error).toBeDefined();
    });

    it('returns not_found status for empty or malformed token strings', async () => {
      const res1 = await resolveDoctorShareToken('');
      expect(res1.status).toBe('not_found');

      const res2 = await resolveDoctorShareToken('   ');
      expect(res2.status).toBe('not_found');
    });

    it('lists multiple active tokens in reverse chronological order', async () => {
      const baseTime = new Date('2026-10-03T08:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);

      const t1 = createDoctorShareToken({
        profileId,
        scope: { conditions: ['Cardiology'] },
        duration: '24h',
      });

      vi.setSystemTime(new Date(baseTime.getTime() + 60 * 1000));
      const t2 = createDoctorShareToken({
        profileId,
        scope: { conditions: ['Endocrinology'] },
        duration: '7d',
      });

      const list = await listDoctorShareTokens(profileId);
      expect(list.length).toBe(2);
      expect(list[0]?.id).toBe(t2.id);
      expect(list[1]?.id).toBe(t1.id);
    });

    it('calculates expiration durations using SHARE_DURATION_HOURS constants', () => {
      expect(SHARE_DURATION_HOURS.single_visit).toBe(4);
      expect(SHARE_DURATION_HOURS['24h']).toBe(24);
      expect(SHARE_DURATION_HOURS['7d']).toBe(168);
      expect(SHARE_DURATION_HOURS['30d']).toBe(720);

      const testDate = new Date('2026-01-01T00:00:00.000Z');
      const expiry = calculateShareExpiration('24h', testDate);
      expect(expiry).toBe('2026-01-02T00:00:00.000Z');
    });
  });
});
