# Issue 10: Ephemeral Scoped Doctor Sharing & Cryptographic Token Service

Status: resolved
Type: task
Blocked by: none

## Summary

Implement ADR 0002: Ephemeral Scoped Clinical Sharing via Cryptographic Tokens. Build `src/lib/security/doctorShare.ts` to generate, validate, verify, and revoke time-limited access tokens for consulting physicians without exposing patient identifiers.

## Requirements

1. **Token Generation with Granular Scopes**:
   - `createDoctorShareToken(input: CreateShareTokenInput): DoctorShareToken`
     - Inputs:
       - `profileId`: patient profile ID.
       - `scope`: `{ conditions?: string[]; categories?: string[]; dateFrom?: string; dateTo?: string; reportIds?: string[] }`.
       - `duration`: `'24h'` | `'7d'` | `'30d'` | `'single_visit'`.
       - `pin?: string`: optional 4-digit PIN.
     - Embeds high-entropy random cryptographic token (never raw UUID).
     - Calculates explicit `expiresAt` ISO timestamp.
     - Hashes PIN using SHA-256 for secure storage.
2. **Access Token Resolution & Validation**:
   - `resolveDoctorShareToken(token: string, enteredPin?: string): TokenResolutionResult`
     - Checks existence and revocation status (`is_revoked`).
     - Enforces expiration time.
     - Validates PIN if token is PIN-protected.
     - Returns resolved scope and patient profile metadata (with zero write access).
3. **Instant Revocation**:
   - `revokeDoctorShareToken(tokenId: string, profileId: string): boolean`
     - Immediately marks token as revoked, killing access on the spot.
4. **Verification**:
   - Comprehensive unit tests in `src/lib/security/__tests__/doctorShare.test.ts` covering token creation, expiration enforcement, PIN validation, scope filtering, and instant revocation.
