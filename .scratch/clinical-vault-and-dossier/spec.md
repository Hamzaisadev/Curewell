# Spec: Clinical Vault, Dynamic Schedule & Ephemeral Doctor Sharing

Status: ready-for-agent

## Problem Statement

Every person accumulates a personal medical history throughout their lifetime. Whether managing chronic conditions (such as diabetes, hypertension, cardiac disorders, kidney disease, or autoimmune illnesses), navigating complex multi-year treatments (such as oncology, neurological disorders, or infectious diseases), recovering from surgeries, or simply tracking routine lab work and diagnostic evaluations across different clinics, medical records are inherently fragmented. Patients often accumulate dozens or hundreds of physical and digital reports spanning months, years, or decades across different hospitals, diagnostic laboratories, and independent specialists.

Carrying heavy, disheveled paper folders to clinic appointments causes immense anxiety, wastes critical consultation minutes, and risks catastrophic clinical oversights when a physician needs to evaluate a historical baseline from two or three years ago against present symptoms. 

Simultaneously, managing everyday medication regimens with rigid minute-by-minute alarms creates friction and false records. Real life causes delayed doses, but existing tools either hard-lock overdue items into "missed" or risk dangerous dose-stacking when a patient takes an overdue afternoon pill right next to their night dose. Finally, sharing medical records with a consulting specialist currently forces patients to compromise their privacy—exposing their entire lifelong health history or unrelated sensitive diagnoses across unencrypted, unrevocable file links.

## Solution

Curewell transforms this experience into a dignified, intelligent Clinical Vault built for any medical history:

1. **A Longitudinal Clinical Dossier for Any Medical History**: A searchable, multi-faceted diagnostic archive organized by clinical condition (e.g., Cardiology, Endocrinology, Nephrology, Oncology, Autoimmune, Orthopedics, General Health), diagnostic category (Bloodwork/Labs, Imaging/Scans, Biopsies/Pathology, Surgical/Discharge Summaries), and chronological timeline. Patients and physicians can pinpoint any historical report across years in two taps while retaining the authentic high-resolution hospital letterhead alongside extracted longitudinal biomarker trendlines.
2. **Adaptive 3+1 Virtual Medication Schedule**: An intuitive daily schedule organized into three natural routine buckets (Morning, Afternoon, Night) with an adaptive Bedtime drawer appearing only when pre-sleep medications are prescribed. The engine projects doses dynamically on read with zero ghost database rows, safely routes expired bucket doses to a past section, and presents clinical guardrails against accidental double-dosing during delayed logging.
3. **Dual-Tier Adherence and Motivation**: A Daily Logging Streak that celebrates patient honesty and engagement (including clinically excused skips), coupled with an uncompromised Clinical Adherence Rate for physician review.
4. **Ephemeral Scoped Doctor Sharing**: A zero-friction, cryptographic sharing mechanism that allows patients to grant consulting doctors time-limited, scoped access (e.g. "Only Cardiology reports from the past 12 months" or "All records") via a secure web portal with optional PIN protection and instant one-tap revocation.

## User Stories

1. As a patient with a complex medical history across multiple conditions (e.g., cardiac, endocrine, or oncological), I want to organize years of diagnostic reports by condition and test type, so that I can immediately find specific reports without digging through unrelated tests.
2. As a patient, I want to upload multi-page diagnostic PDFs and high-resolution imaging or lab photos, so that any consulting specialist can verify official laboratory letterheads, reference ranges, and physician signatures.
3. As a patient tracking chronic biomarkers (such as HbA1c, Cholesterol, Creatinine, Liver enzymes, or Blood counts), I want the system to extract key numbers into longitudinal charts, so that my doctor can observe multi-year biological trends in seconds.
4. As a patient, I want to filter my entire clinical dossier by calendar year and month, so that I can review test results from 2022 alongside my recent 2025 results.
5. As a patient visiting a new doctor or specialist, I want to generate a secure ephemeral sharing link, so that they can view my relevant medical history on their own workstation without needing an account or login.
6. As a patient, I want to restrict the scope of my shared link to specific clinical conditions and date ranges, so that my consulting doctor only sees relevant records while unrelated sensitive medical history remains private.
7. As a patient, I want to set an automatic expiration on my sharing link (24 hours, 7 days, or 30 days), so that access automatically terminates after my clinic visit is over.
8. As a patient, I want to protect my sharing link with an optional 4-digit PIN, so that only the physician I verbally give the PIN to can open my dossier.
9. As a patient, I want an instant one-tap "Revoke Access" button in my app, so that I can immediately terminate an active link at any moment.
10. As a consulting doctor, I want to open a patient's shared link in a clean, responsive web viewer, so that I can review chronological reports on my desktop or tablet without installing any software.
11. As a consulting doctor, I want to preview multi-page lab reports and scans directly inline in the browser, so that I don't have to download dozens of individual files to my local machine.
12. As a consulting doctor, I want a single "Download Complete Dossier (PDF)" button in the shared viewer, so that I can archive the scoped medical history directly into the hospital's clinical records.
13. As a patient managing daily medications, I want my routine grouped into Morning, Afternoon, and Night buckets, so that I don't have to stress over artificial minute-by-minute alarms.
14. As a patient taking a cholesterol statin, acid-reflux PPI, or sedative before sleep, I want a dedicated Bedtime bucket to appear automatically, so that I don't confuse my pre-sleep medication with my dinner medication.
15. As a patient, I want clear meal instruction badges on my medication cards (e.g., "Take after dinner", "Take on an empty stomach"), so that I never take a pill incorrectly.
16. As a patient who took an afternoon medication on time but forgot to log it until 9:00 PM, I want to mark it as taken late, so that my medical records reflect what actually happened.
17. As a patient attempting to log an expired afternoon dose at night, I want the system to ask whether I took it earlier or am taking it now, so that I am warned against dangerous dose-stacking and accidental overdose.
18. As a patient who cannot take a scheduled dose because my doctor advised me to hold it, I want to record an excused skip with a reason, so that my doctor understands why the dose was skipped.
19. As a patient, I want an excused skip to preserve my Daily Logging Streak, so that I am encouraged to remain honest about my health rather than falsely marking doses taken.
20. As a patient, I want my doctor summary to display my true pharmacological Adherence Rate alongside my documented skip reasons, so that my physician has an accurate clinical basis for prescribing decisions.
21. As a patient updating a medication dosage or stopping a treatment, I want my future schedule to update immediately without generating orphan database rows or ghost reminders.
22. As a patient, I want ongoing medications to project a 7-day rolling schedule, so that my schedule is always ready without filling the database with months of empty rows.
23. As a patient, I want PRN as-needed rescue medications kept in a separate cabinet with dosage tracking, so that they do not distort my scheduled adherence metrics.

## Implementation Decisions

### 1. Longitudinal Dossier for Any Medical History
- Diagnostic reports are organized across three extensible dimensions:
  - **Clinical Condition / Health Area**: A flexible, user-extensible categorization system accommodating any disease, condition, or health focus (e.g., Cardiology, Endocrinology/Diabetes, Nephrology, Oncology, Autoimmune, Orthopedics, Gastrointestinal, Respiratory, Surgical History, or General Wellness).
  - **Diagnostic Category**: Standardized clinical document types including Bloodwork/Labs, Imaging/Radiology (X-Ray, CT, MRI, Ultrasound), Biopsies/Pathology, Surgical/Discharge Summaries, and Specialist Clinical Notes.
  - **Test Date / Timeline**: Chronological indexing supporting multi-year historical filtering across decades.
- Storage implements a dual-fidelity pattern (ADR 0003):
  - Original multi-page PDFs and high-resolution images are securely preserved in their authentic hospital letterhead format.
  - Quantitative biomarker values are extracted into a normalized time-series store, powering longitudinal trendline visualizations.
- Multi-faceted filter controls allow instant combination queries (e.g., Condition = "Cardiology" AND Category = "Imaging" AND Year = "2023").

### 2. Virtual Schedule Engine and Sparse Intake Architecture
- The system adopts a virtual projection architecture (ADR 0001). The database strictly avoids pre-generating or persisting future empty scheduled dose rows.
- A deterministic Schedule Engine computes expected daily dose slots dynamically in memory based on active medicine rules, patient routine milestones, and the requested date window (defaulting to a rolling 7-day window for ongoing regimens and exact durations for finite prescriptions).
- The database persists only explicit patient actions in an immutable Intake Log repository. Each log records the target medicine, scheduled date, scheduled bucket, settled status (`taken` or `skipped`), actual completion timestamp, and optional clinical notes or skip reasons.
- Projected dose slots in the past with no corresponding intake log are derived as `missed` at query time, leaving the underlying database storage completely unbloated.

### 3. Adaptive 3+1 Bucket Topology and Clinical Guardrails
- The Daily Schedule partitions the day into three default primary buckets: Morning, Afternoon, and Night.
- An adaptive fourth bucket, Bedtime, is dynamically rendered if and only if at least one active medicine requires administration explicitly at bedtime (*Hora Somni*).
- When a time bucket closes, any unlogged doses are visually transitioned into a "Past / Missed Doses" section.
- Attempting to log an expired bucket dose triggers an interactive safety confirmation modal:
  - If the patient confirms "Took earlier today", the intake log is saved with a delayed completion timestamp.
  - If the patient indicates "Taking right now", the system displays a prominent clinical alert warning of potential dose-stacking with upcoming night doses.

### 4. Two-Tier Adherence and Motivational Metrics
- The adherence domain calculates two distinct metrics:
  - **Daily Logging Streak**: Evaluates patient behavioral engagement. A day is credited toward the streak if all scheduled non-PRN doses for that date have reached a settled outcome (`taken` or `skipped` with a documented reason).
  - **Clinical Adherence Rate**: Evaluates pharmacological compliance (`taken / scheduled`) over the requested historical window, strictly excluding PRN medications and future dates from the denominator.
- Documented skip reasons are aggregated and presented alongside the raw percentage in doctor-facing summaries.

### 5. Ephemeral Scoped Doctor Sharing Portal
- Clinician access is governed by cryptographically random, high-entropy tokens embedded in URLs (`/view/:token`) without exposing patient identifiers (ADR 0002).
- When initiating a share, the patient specifies:
  - Scope filter: All records, or constrained by specific condition tags and date ranges.
  - Expiration duration: 24 hours, 7 days, 30 days, or single consult.
  - Optional 4-digit PIN verification barrier.
- The doctor landing experience requires zero account creation or authentication credentials. The web portal delivers a responsive, read-only interface featuring instant timeline filtering, inline multi-page PDF viewing, and a single-action "Download Dossier (PDF)" compiler.
- Active tokens can be revoked immediately with a single tap by the patient, invalidating all subsequent access requests at the security policy boundary.

## Testing Decisions

### What Makes a Good Test
Tests must verify observable clinical behavior and contracts from the boundary of the domain, avoiding assertions on internal state variables, private helpers, or ephemeral markup details. A good test proves that:
- A patient with multi-year reports across varying medical conditions can filter and locate relevant diagnostic files accurately.
- A patient with specific prescriptions sees the exact correct virtual schedule projected across appropriate buckets.
- Delayed doses trigger safety guardrails when logged out of window.
- Excused skips preserve engagement streaks while accurately reporting clinical intake percentages.
- A doctor opening an ephemeral link sees only the scoped reports, cannot access expired or revoked tokens, and successfully downloads the compiled dossier.

### Testing Seams
To minimize maintenance overhead and prevent brittle coupling, we establish two primary high-level testing seams:

1. **The Schedule and Adherence Boundary Seam**:
   - A single top-level domain facade that accepts active medicine definitions, patient routine anchors, and intake logs, returning projected schedules, bucket allocations, adherence percentages, and streak counts. All scheduling logic, bucket adaptations, and late-logging derivations are tested exclusively through this seam.
2. **The Clinical Sharing and Dossier Boundary Seam**:
   - A service boundary that handles token generation, scope filtering, PIN verification, report compilation, and revocation. All sharing security policies, time expirations, and doctor-view projections are validated through this seam.

### Prior Art in the Codebase
- Domain rule testing patterns in existing test suites for schedule projection, adherence calculation, and time buckets.
- Security and validation patterns in export and QR generator test suites.

## Out of Scope
- Automatic bidirectional synchronization with external hospital Electronic Health Record (EHR) systems via HL7/FHIR protocols.
- Automated algorithmic drug-drug interaction contraindication diagnosis (system provides safety guardrails and flags, not autonomous medical prescription overrides).
- Permanent doctor accounts or hospital clinician portal management.
- Multi-tenant healthcare organization billing.

## Further Notes
- All timestamps and date comparisons must use deterministic, timezone-aware utilities matching the patient's local clinical timezone.
- Visual styles for the doctor portal should maintain clean, accessible, high-contrast typography optimized for rapid scanning on hospital workstations and mobile devices.
