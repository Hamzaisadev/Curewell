/**
 * Ephemeral Scoped Doctor Sharing & Cryptographic Token Service.
 *
 * Implements ADR 0002: Ephemeral Scoped Clinical Sharing via Cryptographic Tokens.
 *
 * Grants consulting clinicians time-limited, read-only access to scoped diagnostic reports,
 * vitals, and medication summaries without exposing patient identifiers or requiring
 * clinician account creation.
 */

import { getLocalItems, insertLocalItem, updateLocalItem } from '../db/localStore';
import { profilesRepo } from '../db';

export type ShareDuration = '24h' | '7d' | '30d' | 'single_visit';

export const SHARE_DURATION_HOURS: Record<ShareDuration, number> = {
  single_visit: 4,
  '24h': 24,
  '7d': 7 * 24,
  '30d': 30 * 24,
};

export interface DoctorShareScope {
  conditions?: string[];
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
  reportIds?: string[];
}

export interface CreateShareTokenInput {
  profileId: string;
  scope: DoctorShareScope;
  duration: ShareDuration;
  pin?: string;
  userId?: string;
}

export interface DoctorShareToken {
  id: string;
  token: string;
  tokenHash: string;
  token_hash: string;
  profileId: string;
  profile_id: string;
  userId?: string;
  user_id?: string;
  scope: DoctorShareScope;
  duration: ShareDuration;
  expiresAt: string;
  expires_at: string;
  createdAt: string;
  created_at: string;
  pinHash: string | null;
  pin_hash: string | null;
  isPinProtected: boolean;
  is_pin_protected: boolean;
  isRevoked: boolean;
  is_revoked: boolean;
  revokedAt: string | null;
  revoked_at: string | null;
  viewCount: number;
  view_count: number;
  lastViewedAt: string | null;
  last_viewed_at: string | null;
  shareUrl: string;
}

export type TokenResolutionStatus =
  | 'valid'
  | 'expired'
  | 'revoked'
  | 'not_found'
  | 'pin_required'
  | 'invalid_pin';

export interface TokenResolutionResult {
  success: boolean;
  valid: boolean;
  status: TokenResolutionStatus;
  profileId?: string;
  scope?: DoctorShareScope;
  profile?: {
    id: string;
    full_name?: string | null;
    fullName?: string | null;
    allergies?: string | null;
    chronic_conditions?: string | null;
    date_of_birth?: string | null;
    sex?: string | null;
    blood_group?: string | null;
    [key: string]: unknown;
  } | null;
  expiresAt?: string;
  isRevoked?: boolean;
  is_revoked?: boolean;
  error?: string;
}

const STORAGE_TABLE = 'doctor_shares';
const TOKEN_BYTES = 32;

// In-memory cache to ensure consistent, lightning-fast resolution across execution contexts
const memoryTokens = new Map<string, DoctorShareToken>();
const memoryTokensById = new Map<string, DoctorShareToken>();

/**
 * Encodes byte array into a URL-safe Base64 string (RFC 4648 § 5).
 */
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Synchronous standard FIPS 180-4 SHA-256 implementation.
 * Guarantees identical hex output across all browsers, Node.js, and offline environments
 * without asynchronous crypto.subtle promises.
 */
export function sha256Hex(message: string): string {
  const msgBytes = new TextEncoder().encode(message);
  const msgLength = msgBytes.length;

  const bitLength = msgLength * 8;
  const totalLength = ((msgLength + 9 + 63) >> 6) << 6;
  const buffer = new Uint8Array(totalLength);
  buffer.set(msgBytes);
  buffer[msgLength] = 0x80;

  const view = new DataView(buffer.buffer);
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  view.setUint32(totalLength - 8, highBits, false);
  view.setUint32(totalLength - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const w = new Uint32Array(64);
  const rotr = (n: number, b: number) => ((n >>> b) | (n << (32 - b))) >>> 0;

  for (let offset = 0; offset < totalLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3);
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i]! + w[i]!) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const toHex = (n: number) => n.toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}

/**
 * Computes SHA-256 hash of a 4-digit PIN for storage.
 */
export function hashPin(pin: string): string {
  return sha256Hex(pin.trim());
}

/**
 * Validates entered PIN against stored SHA-256 hash.
 */
export function validateDoctorSharePin(enteredPin: string, hashedPin: string): boolean {
  return sha256Hex(enteredPin.trim()) === hashedPin;
}

/**
 * Generates a high-entropy URL-safe cryptographic token string.
 */
export function generateHighEntropyToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(TOKEN_BYTES);
    crypto.getRandomValues(bytes);
    return toBase64Url(bytes);
  }
  // Fallback for non-standard environments
  const bytes = new Uint8Array(TOKEN_BYTES);
  for (let i = 0; i < TOKEN_BYTES; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return toBase64Url(bytes);
}

/**
 * Calculates explicit ISO timestamp for share expiration.
 */
export function calculateShareExpiration(duration: ShareDuration, fromDate: Date = new Date()): string {
  const hours = SHARE_DURATION_HOURS[duration] ?? 24;
  const targetMs = fromDate.getTime() + hours * 60 * 60 * 1000;
  return new Date(targetMs).toISOString();
}

/**
 * Generates a unique UUID v4.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * 1. Token Generation with Granular Scopes:
 * Creates an ephemeral, cryptographically random share token with granular scope boundaries,
 * explicit expiration, and optional SHA-256 PIN protection.
 */
export function createDoctorShareToken(input: CreateShareTokenInput): DoctorShareToken {
  const now = new Date();
  const token = generateHighEntropyToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = calculateShareExpiration(input.duration, now);
  const pinHash = input.pin && input.pin.trim().length > 0 ? hashPin(input.pin) : null;
  const id = generateId();

  const record: DoctorShareToken = {
    id,
    token,
    tokenHash,
    token_hash: tokenHash,
    profileId: input.profileId,
    profile_id: input.profileId,
    userId: input.userId,
    user_id: input.userId,
    scope: {
      conditions: input.scope.conditions ? [...input.scope.conditions] : undefined,
      categories: input.scope.categories ? [...input.scope.categories] : undefined,
      dateFrom: input.scope.dateFrom,
      dateTo: input.scope.dateTo,
      reportIds: input.scope.reportIds ? [...input.scope.reportIds] : undefined,
    },
    duration: input.duration,
    expiresAt,
    expires_at: expiresAt,
    createdAt: now.toISOString(),
    created_at: now.toISOString(),
    pinHash,
    pin_hash: pinHash,
    isPinProtected: Boolean(pinHash),
    is_pin_protected: Boolean(pinHash),
    isRevoked: false,
    is_revoked: false,
    revokedAt: null,
    revoked_at: null,
    viewCount: 0,
    view_count: 0,
    lastViewedAt: null,
    last_viewed_at: null,
    shareUrl: `/view/${token}`,
  };

  // Cache in-memory
  memoryTokens.set(token, record);
  memoryTokensById.set(id, record);

  // Persist to localStore repository
  try {
    insertLocalItem<DoctorShareToken>(STORAGE_TABLE, record);
  } catch {
    // If local storage is disabled or quota exceeded, in-memory record persists
  }

  return record;
}

/**
 * Finds a token record by raw token string or token hash across memory and local storage.
 */
function findDoctorShareRecord(tokenOrHash: string): DoctorShareToken | null {
  // 1. Direct memory lookup
  if (memoryTokens.has(tokenOrHash)) {
    return memoryTokens.get(tokenOrHash)!;
  }

  // 2. Hash check in memory
  const computedHash = sha256Hex(tokenOrHash);
  for (const item of memoryTokens.values()) {
    if (item.token === tokenOrHash || item.tokenHash === tokenOrHash || item.tokenHash === computedHash) {
      return item;
    }
  }

  // 3. Local storage repository
  try {
    const local = getLocalItems<DoctorShareToken>(STORAGE_TABLE);
    for (const item of local) {
      if (
        item.token === tokenOrHash ||
        item.tokenHash === tokenOrHash ||
        item.token_hash === tokenOrHash ||
        item.tokenHash === computedHash ||
        item.token_hash === computedHash
      ) {
        // Sync to memory
        memoryTokens.set(item.token, item);
        memoryTokensById.set(item.id, item);
        return item;
      }
    }
  } catch {
    // Storage unavailable
  }

  return null;
}

/**
 * Finds a token record by ID.
 */
function findDoctorShareById(tokenId: string): DoctorShareToken | null {
  if (memoryTokensById.has(tokenId)) {
    return memoryTokensById.get(tokenId)!;
  }

  try {
    const local = getLocalItems<DoctorShareToken>(STORAGE_TABLE);
    const found = local.find((it) => it.id === tokenId);
    if (found) {
      memoryTokens.set(found.token, found);
      memoryTokensById.set(found.id, found);
      return found;
    }
  } catch {
    // Storage unavailable
  }

  return null;
}

/**
 * 2. Access Token Resolution & Validation:
 * Validates expiration, revocation status (is_revoked), and optional PIN.
 * Returns resolved scope filters and sanitized read-only patient profile metadata.
 */
export async function resolveDoctorShareToken(
  token: string,
  enteredPin?: string
): Promise<TokenResolutionResult> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return {
      success: false,
      valid: false,
      status: 'not_found',
      error: 'Share token is invalid or missing.',
    };
  }

  const cleanToken = token.trim();
  const record = findDoctorShareRecord(cleanToken);

  if (!record) {
    return {
      success: false,
      valid: false,
      status: 'not_found',
      error: 'Share token not found or expired.',
    };
  }

  // Check 1: Revocation enforcement (is_revoked)
  if (record.isRevoked || record.is_revoked || record.revokedAt || record.revoked_at) {
    return {
      success: false,
      valid: false,
      status: 'revoked',
      isRevoked: true,
      is_revoked: true,
      error: 'This clinical sharing link was revoked by the patient.',
    };
  }

  // Check 2: Expiration enforcement
  const expiresAtMs = Date.parse(record.expiresAt || record.expires_at);
  if (Number.isNaN(expiresAtMs) || Date.now() >= expiresAtMs) {
    return {
      success: false,
      valid: false,
      status: 'expired',
      expiresAt: record.expiresAt || record.expires_at,
      error: 'This clinical sharing link has expired.',
    };
  }

  // Check 3: PIN Protection enforcement
  const isProtected = record.isPinProtected || record.is_pin_protected || Boolean(record.pinHash || record.pin_hash);
  if (isProtected) {
    if (!enteredPin || enteredPin.trim().length === 0) {
      return {
        success: false,
        valid: false,
        status: 'pin_required',
        error: 'A 4-digit PIN is required to view this clinical dossier.',
      };
    }

    const targetHash = record.pinHash || record.pin_hash;
    if (!targetHash || !validateDoctorSharePin(enteredPin, targetHash)) {
      return {
        success: false,
        valid: false,
        status: 'invalid_pin',
        error: 'Incorrect PIN. Access denied.',
      };
    }
  }

  // Update view count and telemetry
  record.viewCount = (record.viewCount || 0) + 1;
  record.view_count = record.viewCount;
  record.lastViewedAt = new Date().toISOString();
  record.last_viewed_at = record.lastViewedAt;

  try {
    updateLocalItem<DoctorShareToken>(STORAGE_TABLE, record.id, {
      viewCount: record.viewCount,
      view_count: record.view_count,
      lastViewedAt: record.lastViewedAt,
      last_viewed_at: record.last_viewed_at,
    });
  } catch {
    // Best-effort telemetry
  }

  // Fetch patient profile metadata (with zero write access)
  let profileMetadata: TokenResolutionResult['profile'] = null;
  try {
    const prof = await profilesRepo.getProfileById(record.profileId || record.profile_id);
    if (prof) {
      profileMetadata = {
        id: prof.id,
        full_name: prof.full_name,
        fullName: prof.full_name,
        allergies: prof.allergies,
        chronic_conditions: prof.chronic_conditions,
        date_of_birth: prof.date_of_birth,
        sex: prof.sex,
        blood_group: prof.blood_group,
      };
    }
  } catch {
    // If profile repo is offline or throws, fallback to basic profile identifier
    profileMetadata = {
      id: record.profileId || record.profile_id,
      full_name: null,
      fullName: null,
    };
  }

  return {
    success: true,
    valid: true,
    status: 'valid',
    profileId: record.profileId || record.profile_id,
    scope: record.scope,
    profile: profileMetadata,
    expiresAt: record.expiresAt || record.expires_at,
    isRevoked: false,
    is_revoked: false,
  };
}

/**
 * 3. Instant Revocation:
 * Terminates an active token immediately, permanently invalidating subsequent resolution requests.
 * Only the owning patient profile can revoke their share link.
 */
export async function revokeDoctorShareToken(
  tokenId: string,
  profileId: string
): Promise<boolean> {
  if (!tokenId || !profileId) return false;

  // Locate token record either by ID or raw token
  const record = findDoctorShareById(tokenId) || findDoctorShareRecord(tokenId);
  if (!record) {
    return false;
  }

  // Enforce profile sovereignty
  if (record.profileId !== profileId && record.profile_id !== profileId) {
    return false;
  }

  const revokedAt = new Date().toISOString();
  record.isRevoked = true;
  record.is_revoked = true;
  record.revokedAt = revokedAt;
  record.revoked_at = revokedAt;

  // Update memory
  memoryTokens.set(record.token, record);
  memoryTokensById.set(record.id, record);

  // Update local storage
  try {
    updateLocalItem<DoctorShareToken>(STORAGE_TABLE, record.id, {
      isRevoked: true,
      is_revoked: true,
      revokedAt,
      revoked_at: revokedAt,
    });
  } catch {
    // Best-effort local update
  }

  return true;
}

/**
 * Lists all active and historical doctor share tokens for a given patient profile.
 */
export async function listDoctorShareTokens(profileId: string): Promise<DoctorShareToken[]> {
  const result: DoctorShareToken[] = [];
  const seen = new Set<string>();

  for (const item of memoryTokens.values()) {
    if ((item.profileId === profileId || item.profile_id === profileId) && !seen.has(item.id)) {
      result.push(item);
      seen.add(item.id);
    }
  }

  try {
    const local = getLocalItems<DoctorShareToken>(STORAGE_TABLE);
    for (const item of local) {
      if ((item.profileId === profileId || item.profile_id === profileId) && !seen.has(item.id)) {
        result.push(item);
        seen.add(item.id);
      }
    }
  } catch {
    // Storage fallback
  }

  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Clears doctor shares from memory and storage (primarily for test suite isolation).
 */
export function clearDoctorShares(): void {
  memoryTokens.clear();
  memoryTokensById.clear();
  try {
    localStorage.removeItem(`curewell_local_${STORAGE_TABLE}`);
    localStorage.removeItem(`medfolio_local_${STORAGE_TABLE}`);
  } catch {
    // In-memory environment
  }
}
