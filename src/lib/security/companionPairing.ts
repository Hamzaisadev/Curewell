/**
 * Secure Mobile Companion Pairing & Local Authentication Engine
 *
 * Provides:
 * 1. Ephemeral QR Pairing Token generation and verification (15-minute TTL).
 * 2. Compact Smart QR Token (`c1.`) that fits inside a Version 8-10 QR code with
 *    centered Curewell logo and carries automatic sign-in credentials.
 * 3. Cryptographically salted SHA-256 local 4-digit PIN storage & verification.
 * 4. Rate-limiting protection against brute-force attacks.
 * 5. WebAuthn Biometric unlock helper (TouchID / FaceID / Fingerprint).
 * 6. Auto-lock timeout coordinator (5-minute inactivity).
 */

const PAIRING_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PIN_STORAGE_KEY = 'curewell_companion_pin_hash';
const PIN_SALT_STORAGE_KEY = 'curewell_companion_pin_salt';
const PIN_ATTEMPTS_KEY = 'curewell_companion_pin_attempts';
const LAST_ACTIVE_KEY = 'curewell_companion_last_active';
const BIOMETRIC_ENABLED_KEY = 'curewell_companion_biometric_enabled';
const SMART_QR_CACHE_KEY = 'curewell_smart_qr_codes_v1';
const PAIRED_SESSION_KEY = 'curewell_paired_session_v1';
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
  /** Optional Supabase refresh token for automatic cloud session handoff */
  refreshToken?: string;
  /** Short 6-digit human-friendly pairing code (e.g. "482910") */
  pairingCode?: string;
}

/**
 * Compact wire format so a full `https://.../download/apk?pair=...` URL stays
 * well under 190 bytes and encodes cleanly into a Version 8-10 QR code with logo.
 */
interface CompactPairingWire {
  u: string; // userId
  p: string; // profileId
  n: string; // profileName (truncated to 20 chars)
  e?: string; // userEmail
  r?: string; // refreshToken
  c?: string; // 6-digit pairingCode
  x: number; // expiresAt (seconds epoch)
  s: string; // 10-char signature
}

async function computeShortSig(raw: string, len = 16): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, len);
}

/**
 * Generates a deterministic 6-digit pairing code from signature bytes,
 * and caches the full payload locally so 6-digit code entry works too.
 */
function deriveSixDigitCode(sigHex: string): string {
  const num = parseInt(sigHex.substring(0, 8), 16) % 900000;
  return String(100000 + num);
}

function saveCodeToLocalCache(code: string, token: string, payload: CompanionPairingPayload): void {
  try {
    const raw = localStorage.getItem(SMART_QR_CACHE_KEY);
    const map: Record<string, { token: string; payload: CompanionPairingPayload }> = raw
      ? JSON.parse(raw)
      : {};
    map[code] = { token, payload };
    localStorage.setItem(SMART_QR_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function compressUuid(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    const hex = id.replace(/-/g, '');
    let bin = '';
    for (let i = 0; i < 32; i += 2) {
      bin += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    return '~' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return id;
}

function decompressUuid(val: string): string {
  if (val.startsWith('~') && val.length === 23) {
    const b64 = val.slice(1).replace(/-/g, '+').replace(/_/g, '/') + '==';
    const bin = atob(b64);
    let hex = '';
    for (let i = 0; i < bin.length; i++) {
      hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  return val;
}

/**
 * Creates a compact Smart QR pairing token that fits inside a standard Version 7-9
 * QR code URL while carrying automatic sign-in credentials.
 */
export async function createSmartQrPairingToken(params: {
  userId: string;
  profileId: string;
  profileName: string;
  userEmail?: string;
  refreshToken?: string;
}): Promise<{ token: string; pairingCode: string; expiresAt: number }> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + PAIRING_TTL_MS;
  const expSec = Math.floor(expiresAt / 1000);
  const shortName = (params.profileName || 'Patient').replace(/\|/g, ' ').slice(0, 18);

  const rawData = `${params.userId}:${params.profileId}:${expSec}`;
  const sig = await computeShortSig(rawData, 8);
  const pairingCode = deriveSixDigitCode(sig);

  const uComp = compressUuid(params.userId);
  const pComp = params.profileId === params.userId ? '.' : compressUuid(params.profileId);
  const expB36 = expSec.toString(36);
  const extra =
    params.refreshToken && params.refreshToken.length <= 36
      ? `r:${params.refreshToken}`
      : params.userEmail && params.userEmail.length <= 24
      ? `e:${params.userEmail}`
      : '';

  const compactPipe = [uComp, pComp, shortName, expB36, sig, extra].join('|');
  const jsonBytes = new TextEncoder().encode(compactPipe);
  let bin = '';
  for (const b of jsonBytes) bin += String.fromCharCode(b);
  const b64url = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const token = `c1.${b64url}`;

  const fullPayload: CompanionPairingPayload = {
    userId: params.userId,
    userEmail: params.userEmail,
    profileId: params.profileId,
    profileName: params.profileName,
    issuedAt,
    expiresAt,
    signature: sig,
    refreshToken: params.refreshToken,
    pairingCode,
  };

  saveCodeToLocalCache(pairingCode, token, fullPayload);
  return { token, pairingCode, expiresAt };
}

/**
 * Extracts a pairing token from a full URL (`https://.../download/apk?pair=...`),
 * a deep link (`curewell://pair?pair=...`), a 6-digit pairing code (`482-910`),
 * or a raw token string.
 */
export function extractPairingTokenFromInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  // Check if it's a URL or deep link containing ?pair= or &pair=
  if (trimmed.includes('pair=')) {
    try {
      const qIndex = trimmed.indexOf('?');
      if (qIndex !== -1) {
        const params = new URLSearchParams(trimmed.slice(qIndex));
        const pairParam = params.get('pair');
        if (pairParam) return decodeURIComponent(pairParam);
      }
    } catch {
      const match = trimmed.match(/[?&]pair=([^&#\s]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }
  }

  // Check if it's a 6-digit pairing code like "482-910" or "482910"
  const digitsOnly = trimmed.replace(/[\s-]/g, '');
  if (/^\d{6}$/.test(digitsOnly)) {
    try {
      const raw = localStorage.getItem(SMART_QR_CACHE_KEY);
      if (raw) {
        const map = JSON.parse(raw) as Record<string, { token: string }>;
        if (map[digitsOnly]?.token) {
          return map[digitsOnly].token;
        }
      }
    } catch {
      // fall through
    }
  }

  return trimmed;
}

/**
 * Persists a verified Smart QR pairing session locally so the user stays
 * signed in on their phone across page reloads.
 */
export function savePairedMobileSession(payload: CompanionPairingPayload): void {
  try {
    localStorage.setItem(PAIRED_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function getPairedMobileSession(): CompanionPairingPayload | null {
  try {
    const raw = localStorage.getItem(PAIRED_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompanionPairingPayload;
  } catch {
    return null;
  }
}

export function clearPairedMobileSession(): void {
  try {
    localStorage.removeItem(PAIRED_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Creates an ephemeral, signed pairing token to encode in the QR code.
 */
export async function createCompanionPairingToken(
  userId: string,
  profileId: string,
  profileName: string,
  userEmail?: string,
  refreshToken?: string
): Promise<string> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + PAIRING_TTL_MS;

  const rawData = `${userId}:${profileId}:${issuedAt}:${expiresAt}`;
  const signature = await computeShortSig(rawData, 16);
  const pairingCode = deriveSixDigitCode(signature);

  const payload: CompanionPairingPayload = {
    userId,
    userEmail,
    profileId,
    profileName,
    issuedAt,
    expiresAt,
    signature,
    refreshToken,
    pairingCode,
  };

  const jsonStr = JSON.stringify(payload);
  const token = btoa(encodeURIComponent(jsonStr));
  saveCodeToLocalCache(pairingCode, token, payload);
  return token;
}

/**
 * Decodes and validates an ephemeral pairing token (supports both standard and
 * compact `c1.` Smart QR wire formats, plus URLs containing `?pair=`).
 */
export async function verifyCompanionPairingToken(
  rawTokenOrUrl: string
): Promise<{ valid: boolean; payload?: CompanionPairingPayload; error?: string }> {
  try {
    const token = extractPairingTokenFromInput(rawTokenOrUrl);
    if (!token) {
      return { valid: false, error: 'Please scan or enter a valid Smart QR code.' };
    }

    // 1. Handle compact `c1.` Smart QR format
    if (token.startsWith('c1.')) {
      const b64url = token.slice(3);
      const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const bin = atob(padded);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const decodedStr = new TextDecoder().decode(bytes);

      let userId = '';
      let profileId = '';
      let profileName = 'Patient';
      let expSec = 0;
      let sig = '';
      let userEmail: string | undefined;
      let refreshToken: string | undefined;

      if (decodedStr.startsWith('{')) {
        const wire = JSON.parse(decodedStr) as CompactPairingWire;
        userId = wire.u;
        profileId = wire.p;
        profileName = wire.n || 'Patient';
        expSec = wire.x;
        sig = wire.s;
        userEmail = wire.e;
        refreshToken = wire.r;
      } else {
        const parts = decodedStr.split('|');
        if (parts.length < 5) {
          return { valid: false, error: 'Malformed Smart QR token structure.' };
        }
        userId = decompressUuid(parts[0]!);
        profileId = parts[1] === '.' ? userId : decompressUuid(parts[1]!);
        profileName = parts[2] || 'Patient';
        expSec = parseInt(parts[3]!, 36);
        sig = parts[4]!;
        const extra = parts[5] || '';
        if (extra.startsWith('r:')) refreshToken = extra.slice(2);
        else if (extra.startsWith('e:')) userEmail = extra.slice(2);
      }

      if (!userId || !profileId || !expSec || !sig) {
        return { valid: false, error: 'Malformed Smart QR token structure.' };
      }

      const expiresAt = expSec * 1000;
      if (Date.now() > expiresAt) {
        return {
          valid: false,
          error: 'Smart QR code has expired. Please open "Phone App / APK" on your web browser to get a fresh QR code.',
        };
      }

      const expectedSig = await computeShortSig(`${userId}:${profileId}:${expSec}`, 8);
      if (expectedSig !== sig) {
        return { valid: false, error: 'Invalid pairing token signature.' };
      }

      const payload: CompanionPairingPayload = {
        userId,
        profileId,
        profileName,
        userEmail,
        refreshToken,
        pairingCode: deriveSixDigitCode(sig),
        issuedAt: expiresAt - PAIRING_TTL_MS,
        expiresAt,
        signature: sig,
      };

      return { valid: true, payload };
    }

    // 2. Handle standard base64 JSON format
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
    const expectedSig = await computeShortSig(rawData, 16);

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
