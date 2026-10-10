# 0008. Unified Doctor Visit Companion, Caregiver Focus, and Domain Decluttering

We decided to retire fragmented doctor sub-pages (`/doctor/questions` and `/doctor/second-opinion`) and the detached `localStorage` finance tracker (`/finances`), consolidating consultation preparation and clinical exports into a single **Doctor Visit Companion** (`/doctor/visit-prep`) while establishing a caregiver-first multi-profile architecture.

## Context

Curewell accumulated feature sprawl across several uncoordinated endpoints:
1. **Redundant Doctor Screens**: Patients faced separate routes for consultation questions (`/doctor/questions`), second opinion dossiers (`/doctor/second-opinion`), clinical briefs (`/doctor/brief`), and doctor histories (`/doctors`). Both the Second Opinion and Doctor Brief pages executed identical database queries across medicines, visits, and lab reports, differing only by an anonymization toggle and a cryptographic watermark hash.
2. **Disconnected Financial Ledger**: The `/finances` screen stored healthcare expenses exclusively in browser `localStorage`. It was unbacked by Supabase, did not persist across devices, and was disconnected from actual prescription and visit records.
3. **Caregiver Reality**: In South Asia and globally, chronic disease management is rarely done by solo patients alone. Adult children and family caregivers manage medications, lab reports, and appointments for aging parents and dependents.

## Decision

1. **Consolidate Doctor Tools into Doctor Visit Companion**:
   - Replace `/doctor/questions` and `/doctor/second-opinion` with a unified workspace at `/doctor/visit-prep`.
   - Organize into three focused workflows:
     - **Discussion Checklist**: Rule-synthesized questions based on recent abnormal labs, blood pressure spikes, and glucose anomalies.
     - **Clinical Brief**: A4 1-page health summary with active medicines, conditions, and allergies.
     - **Share & Export**: Time-limited PIN sharing link, QR code, and PDF download with an inline toggle for *"Anonymize for Second Opinion"*.
   - Add permanent redirects from `/doctor/questions`, `/doctor/second-opinion`, and `/doctor/brief` to `/doctor/visit-prep`.

2. **Retire Standalone Financial Ledger**:
   - Remove `/finances` and its `localStorage` persistence layer from primary and secondary navigation.
   - Redirect `/finances` and `/finance` to the dashboard (`/`).
   - Move healthcare cost awareness natively into the Medicine Cabinet (passive monthly chronic run-rate estimate) and Shifa AI (generic salt cost-saving alternatives), eliminating budgeting spreadsheet bloat.

3. **Caregiver & Family Network Direction**:
   - Adopt a multi-profile data model allowing a primary caregiver account to switch between managed dependent profiles (e.g. "Self", "Father", "Mother").
   - Define ubiquitous language in `CONTEXT.md` for `Caregiver`, `Family Profile`, and `Doctor Visit Companion`.

4. **Companion App Strategy**:
   - Target a lightweight companion app (Capacitor native package) focused on the "Daily Survival Triad": Today's Doses with home-screen widgets, Quick Vitals Logger, and unmissable alarm-clock notifications, backed by biometric FaceID/PIN login.

## Consequences

- Cuts navigation destinations from 13 down to a streamlined set, eliminating patient cognitive fatigue.
- Eliminates ~600 lines of duplicate data fetching and PDF rendering code across doctor tools.
- Prevents data loss from unpersisted `localStorage` expenses.
- Provides a clean, modern launchpad for Level 100 caregiver and mobile companion features.
