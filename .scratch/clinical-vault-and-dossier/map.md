# Effort Map: Clinical Vault & Dynamic Schedule (Complete Roadmap)

## Decisions So Far
- **ADR 0001**: Virtual Schedule Projection with Sparse Intake Logs (no empty future rows in DB).
- **ADR 0002**: Ephemeral Scoped Clinical Sharing via Cryptographic Tokens.
- **ADR 0003**: Dual-Fidelity Diagnostic Archive (Original signed documents + longitudinal biomarkers for any condition).
- **Time Bucket Topology**: Adaptive 3+1 (Morning, Afternoon, Night + Bedtime when indicated).
- **Two-Tier Adherence**: Daily Logging Streak (patient habit) vs Clinical Adherence Rate (doctor truth).

## Phase 1 Issue Frontier: Domain Refactor & Virtual Projection Engine
- [Issue 01: Adaptive 3+1 Time Bucket Engine](./issues/01-adaptive-time-buckets.md) — Status: `resolved` (Completed & 26 tests passed)
- [Issue 02: Deterministic Virtual Schedule Projection Engine](./issues/02-virtual-schedule-projection.md) — Status: `resolved` (Completed & 42 tests passed)
- [Issue 03: Sparse Intake Logs, Status Derivation & Two-Tier Adherence](./issues/03-sparse-intake-logs-and-adherence.md) — Status: `resolved` (Completed & 41 tests passed)
- [Issue 04: Medication Schedule & Adherence Domain Facade](./issues/04-medication-schedule-facade.md) — Status: `resolved` (Completed & 21 tests passed)

**Phase 1 Status: COMPLETE!** All foundational domain engines (Adaptive Time Buckets, Virtual Schedule Projection, Sparse Intake Logs & Adherence, and Unified Domain Facade) are implemented, integrated, and verified with 100% green tests.

## Phase 2 Issue Frontier: Daily Schedule UI & Out-of-Window Guardrails
- [Issue 05: Daily Schedule UI: Adaptive 3+1 Buckets, Past Doses Drawer & Meal Badges](./issues/05-schedule-ui-past-doses-drawer.md) — Status: `resolved` (Completed & verified across UI and Facade)
- [Issue 06: Out-of-Window Guardrail & Dose-Stacking Risk Modal](./issues/06-late-dose-safety-modal.md) — Status: `resolved` (Completed & verified across UI and tests)
- [Issue 07: Two-Tier Adherence UI & Logging Habit Display](./issues/07-two-tier-adherence-ui.md) — Status: `resolved` (Completed & verified with vitest, tsc, and eslint)

**Phase 2 Status: COMPLETE!** All daily schedule UI features (Adaptive 3+1 time buckets, Past Doses Drawer, Meal timing badges, Out-of-window dose-stacking safety modal, and Two-Tier Adherence UI separating Daily Logging Streak from Pharmacological Compliance) are fully implemented and verified with 100% green tests.

## Phase 3 Issue Frontier: Longitudinal Diagnostic Dossier
- [Issue 08: Longitudinal Diagnostic Dossier Filtering & Taxonomy Engine](./issues/08-longitudinal-dossier-filter-domain.md) — Status: `resolved` (Completed & 27 tests passed)
- [Issue 09: Longitudinal Diagnostic Dossier Vault UI](./issues/09-reports-vault-ui.md) — Status: `resolved` (Completed & 7 tests passed)

**Phase 3 Status: COMPLETE!** Longitudinal Diagnostic Dossier Vault UI (`ReportsVaultPage.tsx`) and Taxonomy Filtering Engine (`dossierFilter.ts`) support multi-year records across any medical condition (Cardiology, Endocrinology, Nephrology, Oncology, Autoimmune, Orthopedics, General Health) with horizontal condition chips, category tabs, timeline grouping, fast search, and inline multi-page scan/PDF viewer.

## Phase 4 Issue Frontier: Ephemeral Doctor Sharing & Clinician Portal
- [Issue 10: Ephemeral Scoped Doctor Sharing & Cryptographic Token Service](./issues/10-ephemeral-doctor-share-service.md) — Status: `resolved` (Completed & 22 tests passed)
- [Issue 11: Doctor-Ready Ephemeral Web Viewer Page & Dossier Exporter](./issues/11-doctor-view-portal.md) — Status: `resolved` (Completed & 6 tests passed)

**Phase 4 Status: COMPLETE!** Ephemeral Scoped Doctor Sharing (`doctorShare.ts`) and Standalone Doctor Portal (`DoctorPortalPage.tsx` routed at `/view/:token` and `/share/view/:token`) allow clinicians to view scoped records across conditions and years with zero login, optional 4-digit PIN gate, expiration/revocation countdown, inline document inspection, and 1-click complete dossier PDF export.

---
**Overall Implementation Status: 100% COMPLETE & VERIFIED (11/11 Issues Resolved, 199/199 Unit & UI Tests Passing, 0 Type Errors, 0 Lint Errors).**
