# Issue 11: Doctor-Ready Ephemeral Web Viewer Page & Dossier Exporter

Status: ready-for-agent
Type: task
Blocked by: 08, 09, 10

## Summary

Build the standalone, responsive Doctor Web Viewer page (`src/pages/share/DoctorPortalPage.tsx` routed at `/view/:token`) per ADR 0002, allowing consulting clinicians to inspect scoped reports across conditions and years with zero login, optional PIN gate, inline preview, and 1-click dossier PDF download.

## Requirements

1. **Route & Layout**:
   - Routed at `/view/:token` (and `/share/view/:token` for compatibility).
   - High-contrast, clean clinical presentation optimized for hospital workstations, tablets, and phones.
2. **PIN Protection Gate**:
   - If token was created with a PIN, presents a clean 4-digit PIN entry dialog before decrypting and displaying records.
   - Rejects incorrect PIN with accessible error feedback.
3. **Security State Display**:
   - If token is expired or revoked by patient: displays dignified alert ("This clinical access link has expired or was revoked by the patient.").
   - If valid: displays non-intrusive security banner with expiration countdown badge (e.g. "Access valid for 23 hours · Scoped: Cardiology, Oncology").
4. **Interactive Scoped Timeline Viewer**:
   - Renders only the reports within the token's authorized scope (conditions and date range).
   - Multi-condition chips, category tabs, and year filter.
   - Inline multi-page document inspection modal.
   - 1-click "Download Complete Dossier (PDF)" button.
5. **Verification**:
   - Write comprehensive tests in `src/pages/share/__tests__/DoctorPortalPage.test.tsx`.
   - Run `npx vitest run src/pages/share/__tests__/DoctorPortalPage.test.tsx`.
   - Run `npx tsc --noEmit`.
   - Run `npx eslint`.
   - Mark Issue 11 resolved.
