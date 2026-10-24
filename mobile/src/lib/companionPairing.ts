/**
 * Standalone React Native Pairing & Security Engine
 *
 * Implements deterministic FIPS 180-4 SHA-256 for offline Smart QR verification,
 * 6-digit pairing code resolution, and session persistence without browser dependencies.
 */

export interface CompanionPairingPayload {
  userId: string;
  userEmail?: string;
  profileId: string;
  profileName: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
  refreshToken?: string;
  pairingCode?: string;
}

interface CompactPairingWire {
  u: string; // userId
  p: string; // profileId
  n: string; // profileName
  e?: string; // userEmail
  r?: string; // refreshToken
  c?: string; // pairingCode
  x: number; // expiresAt (sec)
  s: string; // signature
}

function sha256Bytes(msgBytes: Uint8Array): Uint8Array {
  const msgLength = msgBytes.length;
  const bitLength = msgLength * 8;
  const totalLength = ((msgLength + 9 + 63) >> 6) << 6;
  const buffer = new Uint8Array(totalLength);
  buffer.set(msgBytes, 0);
  buffer[msgLength] = 0x80;

  const view = new DataView(buffer.buffer);
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  view.setUint32(totalLength - 8, highBits, false);
  view.setUint32(totalLength - 4, lowBits, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

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
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let c = 0; c < totalLength; c += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(c + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3);
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }

    let a = h0, b = h1, d_ = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i]! + w[i]!) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & d_) ^ (b & d_);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = d_;
      d_ = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + d_) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

function computeShortSig(raw: string, len = 8): string {
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
  const hash = sha256Bytes(bytes);
  let hex = '';
  for (let i = 0; i < hash.length; i++) {
    hex += hash[i]!.toString(16).padStart(2, '0');
  }
  return hex.substring(0, len);
}

export function deriveSixDigitCode(sigHex: string): string {
  const num = parseInt(sigHex.substring(0, 8), 16) % 900000;
  return String(100000 + num);
}

function base64Decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let buffer = 0;
  let bits = 0;

  const clean = str.replace(/[^A-Za-z0-9+/=]/g, '');
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charAt(i);
    if (char === '=') break;
    const val = chars.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export function decompressUuid(val: string): string {
  if (val.startsWith('~') && val.length === 23) {
    try {
      const b64 = val.slice(1).replace(/-/g, '+').replace(/_/g, '/') + '==';
      const bin = base64Decode(b64);
      let hex = '';
      for (let i = 0; i < bin.length; i++) {
        hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
      }
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    } catch {
      return val;
    }
  }
  return val;
}

export function extractPairingTokenFromInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  if (trimmed.includes('pair=')) {
    try {
      const qIndex = trimmed.indexOf('?');
      if (qIndex !== -1) {
        const queryStr = trimmed.slice(qIndex + 1);
        const pairs = queryStr.split('&');
        for (const pair of pairs) {
          const [k, v] = pair.split('=');
          if (k === 'pair' && v) return decodeURIComponent(v);
        }
      }
    } catch {
      const match = trimmed.match(/[?&]pair=([^&#\s]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }
  }

  return trimmed;
}

export function verifyCompanionPairingToken(rawTokenOrUrl: string): {
  valid: boolean;
  payload?: CompanionPairingPayload;
  error?: string;
} {
  try {
    const token = extractPairingTokenFromInput(rawTokenOrUrl);
    if (!token) {
      return { valid: false, error: 'Please scan or enter a valid Smart QR code.' };
    }

    // 1. Compact `c1.` format
    if (token.startsWith('c1.')) {
      const b64url = token.slice(3);
      const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const decodedStr = base64Decode(padded);

      let userId = '';
      let profileId = '';
      let profileName = 'Paired Patient';
      let expSec = 0;
      let sig = '';
      let userEmail: string | undefined;
      let refreshToken: string | undefined;

      if (decodedStr.startsWith('{')) {
        const wire = JSON.parse(decodedStr) as CompactPairingWire;
        userId = wire.u;
        profileId = wire.p;
        profileName = wire.n || 'Paired Patient';
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
        profileName = parts[2] || 'Paired Patient';
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
          error: 'Smart QR code has expired. Please open Medfolio on your PC to get a fresh code.',
        };
      }

      const expectedSig = computeShortSig(`${userId}:${profileId}:${expSec}`, 8);
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
        issuedAt: expiresAt - 15 * 60 * 1000,
        expiresAt,
        signature: sig,
      };

      return { valid: true, payload };
    }

    // 2. Base64 JSON format
    const jsonStr = decodeURIComponent(base64Decode(token));
    const payload = JSON.parse(jsonStr) as CompanionPairingPayload;
    if (!payload.userId || !payload.expiresAt || !payload.signature) {
      return { valid: false, error: 'Malformed pairing token structure.' };
    }

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Pairing QR code has expired.' };
    }

    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: e?.message || 'Failed to decode pairing token.' };
  }
}
