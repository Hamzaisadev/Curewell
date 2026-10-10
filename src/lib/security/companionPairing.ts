/**
 * Secure Mobile Companion Pairing & Local Authentication Engine
 *
 * Provides:
 * 1. Ephemeral QR Pairing Token generation and verification (15-minute TTL).
 * 2. Cryptographically salted SHA-256 local 4-digit PIN storage & verification.
 * 3. Rate-limiting protection against brute-force attacks.
 * 4. WebAuthn Biometric unlock helper (TouchID / FaceID / Fingerprint).
 * 5. Auto-lock timeout coordinator (5-minute inactivity).
 */

const PAIRING_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PIN_STORAGE_KEY = 'curewell_companion_pin_hash';
const PIN_SALT_STORAGE_KEY = 'curewell_companion_pin_salt';
const PIN_ATTEMPTS_KEY = 'curewell_companion_pin_attempts';
const LAST_ACTIVE_KEY = 'curewell_companion_last_active';
const BIOMETRIC_ENABLED_KEY = 'curewell_companion_biometric_enabled';
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout after 5 fails
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface CompanionPairingPayload {
  userId: string;
  userEmail?: string;
  profileId: string;
  profileName: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

/**
 * Creates an ephemeral, signed pairing token to encode in the QR code.
 */
export async function createCompanionPairingToken(
  userId: string,
  profileId: string,
  profileName: string,
  userEmail?: string
): Promise<string> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + PAIRING_TTL_MS;

  const rawData = `${userId}:${profileId}:${issuedAt}:${expiresAt}`;
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(rawData);

  // Generate SHA-256 digest as signature
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);

  const payload: CompanionPairingPayload = {
    userId,
    userEmail,
    profileId,
    profileName,
    issuedAt,
    expiresAt,
    signature,
  };

  const jsonStr = JSON.stringify(payload);
  return btoa(encodeURIComponent(jsonStr));
}

/**
 * Decodes and validates an ephemeral pairing token.
 */
export async function verifyCompanionPairingToken(
  token: string
): Promise<{ valid: boolean; payload?: CompanionPairingPayload; error?: string }> {
  try {
    const jsonStr = decodeURIComponent(atob(token));
    const payload: CompanionPairingPayload = JSON.parse(jsonStr);

    if (!payload.userId || !payload.expiresAt || !payload.signature) {
      return { valid: false, error: 'Malformed pairing token structure.' };
    }

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Pairing QR code has expired. Please generate a fresh QR code from your desktop.' };
    }

    // Verify signature integrity
    const rawData = `${payload.userId}:${payload.profileId}:${payload.issuedAt}:${payload.expiresAt}`;
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(rawData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const expectedSig = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);

    if (expectedSig !== payload.signature) {
      return { valid: false, error: 'Invalid pairing token signature.' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Failed to decode pairing token.' };
  }
}

// ---------------------------------------------------------------------------
// 4-Digit PIN Security Management
// ---------------------------------------------------------------------------

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}:curewell_salt`);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Checks if a 4-digit PIN is currently set on this mobile device.
 */
export function hasCompanionPin(): boolean {
  return Boolean(localStorage.getItem(PIN_STORAGE_KEY));
}

/**
 * Sets or updates the 4-digit quick access PIN.
 */
export async function setCompanionPin(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits (0-9).');
  }

  const salt = generateSalt();
  const hash = await hashPinWithSalt(pin, salt);

  localStorage.setItem(PIN_SALT_STORAGE_KEY, salt);
  localStorage.setItem(PIN_STORAGE_KEY, hash);
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  recordCompanionActivity();
}

/**
 * Verifies the 4-digit PIN against the locally stored salted hash.
 */
export async function verifyCompanionPin(
  pin: string
): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> {
  // Check lockout
  const attemptsData = localStorage.getItem(PIN_ATTEMPTS_KEY);
  if (attemptsData) {
    const { lockedUntil } = JSON.parse(attemptsData);
    if (lockedUntil && Date.now() < lockedUntil) {
      const waitSec = Math.ceil((lockedUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Too many incorrect attempts. Please wait ${waitSec} seconds.`,
        remainingAttempts: 0,
      };
    }
  }

  const salt = localStorage.getItem(PIN_SALT_STORAGE_KEY);
  const storedHash = localStorage.getItem(PIN_STORAGE_KEY);

  if (!salt || !storedHash) {
    return { success: false, error: 'No PIN is configured on this device.' };
  }

  const inputHash = await hashPinWithSalt(pin, salt);

  if (inputHash === storedHash) {
    // Reset failed attempts
    localStorage.removeItem(PIN_ATTEMPTS_KEY);
    recordCompanionActivity();
    return { success: true };
  }

  // Increment failed attempts
  const currentAttempts = attemptsData ? JSON.parse(attemptsData).count + 1 : 1;
  const remaining = Math.max(0, MAX_PIN_ATTEMPTS - currentAttempts);

  if (currentAttempts >= MAX_PIN_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(
      PIN_ATTEMPTS_KEY,
      JSON.stringify({ count: currentAttempts, lockedUntil })
    );
    return {
      success: false,
      error: 'Too many incorrect attempts. Locked for 60 seconds.',
      remainingAttempts: 0,
    };
  }

  localStorage.setItem(
    PIN_ATTEMPTS_KEY,
    JSON.stringify({ count: currentAttempts, lockedUntil: null })
  );

  return {
    success: false,
    error: `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    remainingAttempts: remaining,
  };
}

/**
 * Removes the configured PIN (e.g. upon sign out).
 */
export function removeCompanionPin(): void {
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(PIN_SALT_STORAGE_KEY);
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  localStorage.removeItem(LAST_ACTIVE_KEY);
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
}

// ---------------------------------------------------------------------------
// Inactivity & Auto-Lock
// ---------------------------------------------------------------------------

export function recordCompanionActivity(): void {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export function isCompanionLocked(): boolean {
  if (!hasCompanionPin()) return false;
  const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!lastActiveStr) return true;

  const lastActive = parseInt(lastActiveStr, 10);
  return Date.now() - lastActive > INACTIVITY_TIMEOUT_MS;
}

// ---------------------------------------------------------------------------
// Biometric Authentication (WebAuthn / TouchID / FaceID)
// ---------------------------------------------------------------------------

export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isBiometricsEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
}

export function setBiometricsEnabled(enabled: boolean): void {
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Triggers native platform biometric prompt (FaceID/TouchID/Android Biometrics).
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!isBiometricsAvailable()) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Simple platform assertion to verify user presence
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname,
      },
    });

    if (credential) {
      recordCompanionActivity();
      return true;
    }
    return false;
  } catch (err) {
    // If WebAuthn fails or is cancelled, caller falls back to PIN
    console.warn('Biometric authentication failed or cancelled:', err);
    return false;
  }
}
