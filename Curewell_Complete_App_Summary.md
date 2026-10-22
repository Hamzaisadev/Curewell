# Curewell (Medfolio v2) — Master Application Specification & Complete Context Dossier

> **Official Application Name:** Curewell (`curewell`, repository folder `Medfolio v2`)  
> **Version:** `4.0.0`  
> **Brand Subtitle:** *ZERO-KNOWLEDGE HEALTH VAULT*  
> **Primary Target Geography & Localization:** Global English with deep clinical localization for South Asia / Pakistan (Urdu Nastaliq script, Roman Urdu, Hindi, and Bengali script/digit normalization, Pakistani commercial pharmaceutical brand registry, PKR default currency, and Pakistan emergency ambulance helplines).  
> **Platform Form Factors:** Responsive Web App (Desktop/Tablet/Mobile), Installable Progressive Web App (PWA), Dedicated Mobile Companion (`/companion`), and Capacitor 8 Native Android App (`.apk`).

---

## 1. Executive Summary & Product Vision

**Curewell** is a privacy-first, human-in-the-loop personal and family health companion designed to bridge the gap between fragmented paper medical records and daily chronic care routines. In many healthcare ecosystems, patients carry plastic bags of handwritten paper prescriptions, faded thermal lab receipts, and unorganized diagnostic reports from multiple clinics. Curewell turns this chaos into a structured, verifiable, and doctor-ready digital health vault.

### Core Design Pillars
1. **Human-in-the-Loop Clinical Safety:** AI vision models extract handwritten prescriptions and complex lab reports into structured fields, but **zero clinical records are saved without explicit human review and confirmation**. Every AI extraction and subsequent user edit is recorded in an immutable `extraction_audit` table.
2. **Deterministic Clinical Math (Never AI-Guessed):** Critical medical calculations—such as medication end dates, daily scheduled dose times, adherence percentages, blood pressure/glucose crisis classification, reference range evaluations, and emergency red-flag symptom triage—are executed by **pure, deterministic, unit-tested TypeScript domain engines**, never delegated to LLM guesswork.
3. **Caregiver & Multi-Profile Isolation:** A single caregiver account can manage isolated health profiles for themselves (`self`), aging parents (`parent`), a `spouse`, `child`, or `other` dependents, with a persistent visual guardrail banner (`ActiveProfileBanner`) preventing cross-profile logging mistakes.
4. **Zero-Account Ephemeral Clinician Sharing:** Patients can generate a 1-page printable A4 Doctor Consultation Brief or a time-limited (`4h`, `24h`, `7d`, `30d`), PIN-protected, revocable web link/QR code (`/view/:token`) that lets a consulting physician inspect scoped records and lab trends in a dedicated Clinician Portal without creating an account.
5. **Offline-First & Real-Time Hybrid Persistence:** Every repository in `src/lib/db/` supports dual persistence (Supabase PostgreSQL + browser `localStorage` fallback) coupled with a sub-50ms WebSocket broadcast sync engine (`curewell-live-sync`) between the web dashboard and the mobile companion.

---

## 2. Ubiquitous Domain Language (`CONTEXT.md`)

External integrations and cloud prompts interacting with Curewell must respect its strict domain vocabulary:

| Canonical Term | Definition | Terms Strictly Avoided |
| :--- | :--- | :--- |
| **Patient** | The individual recipient of care whose daily medicines, prescriptions, reports, and readings are managed. | *User, client, account, customer* |
| **Caregiver** | The primary account owner managing medicines, appointments, and vitals for themselves or loved ones. | *Admin, master user, account manager* |
| **Family Profile** | A dependent health profile (e.g., Mother, Father, Child) managed under a caregiver's account with isolated schedules and records. | *Sub-account, secondary profile, patient slot* |
| **Prescription** | A formal doctor's authorization specifying medications, dosages, meal relations, and duration. | *Script, doctor note, order* |
| **Active Medicine** | A medication currently being taken (started, not discontinued, and within its prescribed duration). | *Current drug, active script, regimen item* |
| **Medication Schedule** | The daily schedule organized into **Morning**, **Afternoon**, **Night**, and **Bedtime** showing when each medicine should be taken. | *Regimen, medication protocol, drug timetable* |
| **Dose** | A single scheduled intake of medicine for a specific time of day. | *Pill event, telemetry instance, future row* |
| **Intake Confirmation** | A record created when a patient confirms taking or skipping a scheduled dose. | *Check-in, mark, telemetry log* |
| **Streak** | Consecutive days where the patient logged all their scheduled medicines. | *Compliance streak, gamification score* |
| **Adherence Rate** | Percentage of scheduled doses confirmed taken (`taken / scheduled`) over time, excluding PRN medicines. | *Compliance percentage, health score* |
| **As-Needed Medicine (PRN)** | Medicine taken only when needed (e.g., pain relief) with no fixed daily schedule; excluded from adherence rates. | *SOS drug, rescue med* |
| **Medical Records** | The patient's archive of doctor visits, lab reports, prescriptions, and health history. | *Clinical dossier, diagnostic vault, repository* |
| **Doctor Visit Companion** | Unified consultation workspace preparing the patient with auto-generated questions, vital/lab summaries, and sharing. | *Second opinion pack, consultation ticket* |
| **Doctor Consultation Brief** | Concise, 1-page A4 factual summary of active medicines, 7-day vitals averages, allergies, and abnormal labs. | *Clinical assessment, diagnosis sheet, triage report* |
| **Active Generic Ingredient** | Recognized pharmacological chemical salt (e.g., *Omeprazole*) within a commercial brand (e.g., *Risek*). | *Drug formula, cure chemical, remedy molecule* |
| **Shifa AI Assistant** | Helpful, conversational health assistant answering questions about medicines, reports, and symptoms in plain English or Urdu. | *Clinical co-pilot, bot, LLM agent* |
| **The Daily Survival Triad** | The three essential daily mobile workflows on `/companion`: Today's Doses, 10-Second Vitals Intake, and Emergency Medical ID Card. | *Core feature set, operational triad* |

---

## 3. Complete Route & Screen Architecture (`src/routes.tsx`)

All routes use React Router v7 with lazy code-splitting (`React.lazy` + `Suspense`) and skeleton loading fallbacks (`RouteLoadingFallback`).

### A. Public & Authentication Routes
| Path | Component | Access Guard | Detailed Behaviour & Features |
| :--- | :--- | :--- | :--- |
| `/` | `HomeRoute` (`DashboardPage` or `LandingPage`) | Hybrid | Renders `LandingPage` for unauthenticated visitors and `DashboardPage` for authenticated users. |
| `/landing` | `LandingPage` | Public | Interactive marketing page showcasing prescription scanning, lab trends, schedule rings, and APK download links. |
| `/login` | `LoginPage` | `PublicOnlyRoute` | Email/password sign-in, Google OAuth, and demo/local mode entry. Redirects to `/` if already signed in. |
| `/signup` | `SignUpPage` | `PublicOnlyRoute` | Account registration capturing full name, sex, date of birth, and blood group (triggers `handle_new_user()` in PostgreSQL). |
| `/forgot-password` | `ForgotPasswordPage` | `PublicOnlyRoute` | Supabase password reset email flow. |
| `/auth/callback` | `AuthCallbackPage` | Public | Handles PKCE OAuth / magic link redirect tokens from Supabase Auth. |
| `/download`, `/download/apk` | `DownloadApkPage` | Public | Direct download page for the native Android APK (`curewell.apk`), QR code scanner instructions, and PWA install guide. |

### B. Ephemeral Clinician Sharing Routes (No Account Required)
| Path | Component | Access Guard | Detailed Behaviour & Features |
| :--- | :--- | :--- | :--- |
| `/share/verify` | `ShareVerifyPage` | Public | Standalone verification screen where a doctor or patient can enter a share token or 6-digit code to open a shared record. |
| `/share/:token` | `PublicShareView` | Public (Token + PIN) | Classic read-only shared health summary view protected by token expiration and optional 4-digit PIN. |
| `/view/:token`, `/share/view/:token` | `DoctorPortalPage` | Public (Token + PIN) | **Ephemeral Clinician Portal (ADR 0002):** Full-featured read-only diagnostic workspace for doctors. Displays anonymized patient initials (e.g., `Patient Initials: H.A.`), remaining access countdown timer, condition/category/timeline filters, inline multi-page zoomable report image viewer, biomarker tables with out-of-range badges, and 1-click PDF export. |

### C. Core Protected Patient & Caregiver Routes
| Path | Component | Access Guard | Detailed Behaviour & Features |
| :--- | :--- | :--- | :--- |
| `/` (signed in) | `DashboardPage` | `ProtectedRoute` | **Asymmetric 12-Column Daily Health Companion:**<br>• `ActiveProfileBanner` (caregiver guardrail)<br>• `ShifaPassportBanner` & `ShifaMedicalPassportModal` (onboarding for blood group, allergies, chronic conditions, emergency contact)<br>• `PatientInfoCard` (circadian greeting, profile switcher, quick stats)<br>• Streamlined 4-button Quick Action Bar (`+ Log Blood Pressure`, `+ Log Blood Sugar`, `+ Add Medicine`, `+ Upload Report`)<br>• **Main 8-Col:** `MedicationScheduleCard` (today's slots & 1-tap intake), side-by-side `BloodPressureTrendCard` & `BloodGlucoseTrendCard`<br>• **Right 4-Col:** `UpNextCard` (upcoming doses/appointments), `AdherenceHabitsCard` (streak & milestone badges), `RecentConsultationsCard`, `ClinicalDossierCard`, and `EmergencyHotlinesStripCard`. |
| `/medicines` | `TodaySchedulePage` | `ProtectedRoute` | **Unified Daily Medication Schedule:** Horizontal swipeable `DateStrip`, circadian time buckets (`Morning`, `Afternoon`, `Night`, `Bedtime`), `ProgressRing` completion percentage, 1-tap `Taken` / `Skip` (with reason modal) / `Snooze` actions, PRN rescue medicine logging, and direct link to the Medicine Cabinet. |
| `/medicines/cabinet` | `MedicineCabinetPage` | `ProtectedRoute` | **Medicine Cabinet & Pharmacy Hub:** Active vs. past/discontinued medications, remaining pill inventory bars, low-supply 7-day refill warnings, **Smart Generic Switcher** (compares prescribed brands like *Risek* against bioequivalent generics like *Omega* with % savings in PKR), and 1-click WhatsApp refill ordering to partner pharmacies (*Dvago*, *Servaid*, *Dawaai.pk*, *Fazal Din's*, or custom local chemist). |
| `/medicines/:id` | `MedicineDetailPage` | `ProtectedRoute` | **Single Medication Deep-Dive:** Regimen schedule, meal relation badge, inventory counter & refill calculator, AI plain-language medicine breakdown (`What is it for?`, `How to take`, `Common side effects`, `When to call doctor`), patient side-effect logger (`mild`/`moderate`/`severe`), and discontinue/delete controls. |
| `/prescriptions/new` | `CapturePrescriptionPage` | `ProtectedRoute` | Multi-page camera/file upload (up to 5 images per prescription), client-side image enhancement (`imageEnhancer.ts`), and Gemini Vision extraction trigger. |
| `/prescriptions/review` | `ReviewPrescriptionPage` | `ProtectedRoute` | **Human-in-the-Loop Prescription Verification:** Side-by-side view of original prescription photo and editable extracted fields (doctor, clinic, visit date, diagnosis, advice, follow-up date, medicines array with confidence badges, and ordered lab tests). Saves to `visits`, `medicines`, `test_orders`, and `extraction_audit`. |
| `/reports` | `ReportsListPage` | `ProtectedRoute` | **Lab Reports & Biomarker Trends:** Lists uploaded diagnostic reports, pending `test_orders` from doctor visits, and interactive Recharts longitudinal biomarker trendlines with normal reference range shading. |
| `/reports/vault` | `ReportsVaultPage` | `ProtectedRoute` | **Diagnostic Vault:** Condition-tagged and category-filtered (`Hematology`, `Biochemistry`, `Endocrinology`, `Lipid Panel`, `Urinalysis`, `Radiology`) archive with instant search and abnormal flag filtering. |
| `/reports/new` | `CaptureReportPage` | `ProtectedRoute` | Upload up to 10 images or multi-page PDF lab reports (rendered via `pdfjs-dist` to high-res images) for AI extraction. |
| `/reports/review` | `ReviewReportPage` | `ProtectedRoute` | **Human-in-the-Loop Lab Result Verification:** Editable table of extracted analytes, values, units, and reference ranges. Automatically computes `canonical_name` and deterministic `range_status` (`within`, `below`, `above`, `unknown`) and auto-links matching pending `test_orders`. |
| `/timeline` | `TimelinePage` | `ProtectedRoute` | Unified chronological stream combining doctor consultations, prescriptions, and lab reports with year/month grouping and type filters. |
| `/visits/:id`, `/doctor/visits/:id` | `VisitDetailPage` | `ProtectedRoute` | Detailed view of a single doctor consultation: original prescription photos, diagnosis, clinical advice, prescribed medicines, ordered lab tests, and visit cost. |
| `/doctors` | `DoctorDirectoryPage` | `ProtectedRoute` | Directory of all consulting physicians extracted from past visits, grouped by specialty, clinic location, and consultation count. |
| `/doctor/visit-prep` | `DoctorVisitCompanionPage` | `ProtectedRoute` | **Unified 3-Tab Consultation Workspace (`?tab=questions|brief|share`):**<br>1. `questions`: Auto-generated priority-ranked discussion checklist based on recent abnormal labs, high/low vitals, and long-term meds.<br>2. `brief`: Printable/exportable 1-page A4 **Doctor Consultation Brief** with tamper-evident SHA-256 clinical watermark.<br>3. `share`: Anonymized Second Opinion dossier builder and quick share link generator. |
| `/share` | `ShareManagementPage` | `ProtectedRoute` | Create new scoped Doctor Sharing Links (`single_visit` 4h, `24h`, `7d`, `30d`), set 4-digit access PINs, display scannable QR codes, monitor view counts/timestamps, and immediately revoke active links. |
| `/vitals` | `VitalsTrackerPage` | `ProtectedRoute` | **Blood Pressure & Blood Sugar Hub:** Interactive `RollerNumberInput` and quick-entry forms, AHA/ADA clinical stage classification badges, time-series Recharts graphs, 7-day/30-day averages, and historical reading logs. |
| `/symptoms` | `SymptomTriagePage` | `ProtectedRoute` | **Symptom Diary & Offline Red-Flag Triage:** Instant on-device screening for 6 critical emergency categories (`Cardiac`, `Breathing`, `Stroke`, `Severe Bleeding`, `Loss of Consciousness`, `Self-Harm/Overdose`) across English, Roman Urdu, and Urdu script, plus non-diagnostic symptom logging and specialist recommendation guide. |
| `/assistant` | `AssistantPage` | `ProtectedRoute` | **Shifa AI Health Co-Pilot:** Multi-session chat workspace with pinned threads, voice input/output (English & Urdu), prescription/report photo attachment, and intent-gated interactive clinical cards (medication diff analysis, daily schedule cards, biomarker trajectory charts, safety sentinel alerts). |
| `/search` | `SearchRecordsPage` | `ProtectedRoute` | Instant cross-entity search across medicines, doctor names, diagnoses, clinics, lab report titles, and individual biomarker names. |
| `/settings` | `SettingsPage` | `ProtectedRoute` | Manage family profiles, configure quiet hours & snooze duration for dose reminders, pair mobile devices via Smart QR code (`c1.`), export full JSON/PDF archives, or delete account data. |
| `/companion` | `MobileCompanionPage` | `CompanionRoute` | **Dedicated Mobile Companion PWA:** Supports zero-password sign-in via `?pair=` Smart QR token or 6-digit pairing code, 4-digit local PIN / WebAuthn biometric lock screen (`CompanionLockScreen`) with 5-minute inactivity auto-lock, and 5 bottom tabs: `Doses`, `Vitals` (10-second intake), `SOS` (Emergency Medical ID Card & 1-tap ambulance dialer), `All Tools`, and `Settings`. |
| `/__ui` | `UiCataloguePage` | Dev Only (`import.meta.env.DEV`) | Interactive living design system showcase displaying all ~25 UI primitives, color tokens, badges, and motion patterns. |

### D. Legacy Redirect Aliases (Zero Broken Links)
- `/mobile` → `/companion`
- `/chat` → `/assistant`
- `/doctor`, `/doctor/brief`, `/brief`, `/doctor-brief` → `/doctor/visit-prep?tab=brief`
- `/doctor/questions` → `/doctor/visit-prep?tab=questions`
- `/doctor/second-opinion` → `/doctor/visit-prep?tab=share`
- `/finances`, `/finance` → `/`

---

## 4. Deterministic Clinical Domain Engines (`src/domain/`)

Curewell separates presentation from clinical logic through 19 pure TypeScript modules in `src/domain/`:

1. **Virtual Dose Schedule Projection (`schedule.ts`, `medicationRegimen.ts`, `medicationScheduleFacade.ts` — ADR 0001):**
   - Computes scheduled doses in-memory on demand with **zero future database rows pre-populated**.
   - **Horizon Rules:** Finite prescriptions project strictly up to `min(durationDays, range.to)` using `end_date = start_date + duration_days - 1`. Ongoing medicines project up to 7 days forward. PRN/SOS medicines project zero scheduled rows.
   - **Meal Timing Guidance (`mealRelation.ts`):** Translates English, Urdu (`کھانے کے بعد` / `کھانے سے پہلے` / `nihar munh`), Hindi (`खाने के बाद` / `खाने से पहले`), and Bengali (`খাওয়ার পর` / `খাওয়ার আগে`) instructions into structured `with_food` booleans and human-friendly slot instructions (e.g., *"Take with or after breakfast"*, *"Take on an empty stomach"*). Adjusts morning empty-stomach doses to `07:00` (`420` min) vs. standard morning `08:00–09:00`.
2. **Adaptive 3+1 Circadian Time Buckets (`timeBuckets.ts`):**
   - Partitions the 1,440 minutes of a day into:
     - **Morning:** `05:00 – 11:59` (`300 – 719` min)
     - **Afternoon:** `12:00 – 16:59` (`720 – 1019` min)
     - **Night:** `17:00 – 21:59` (`1020 – 1319` min)
     - **Bedtime (Adaptive):** `22:00 – 04:59` (`1320 – 299` min) — automatically activates when a medicine carries `QHS`/`HS` frequency or bedtime instructions (`sone se pehle`, `sote waqt`, `at bedtime`).
3. **Clinical Frequency & Duration Parsers (`frequency.ts`, `duration.ts`):**
   - Normalizes Eastern Arabic/Urdu (`۰-۹`), Bengali (`০-৯`), and Devanagari (`०-९`) digits to ASCII.
   - Parses Latin abbreviations (`OD`, `BD`/`BID`, `TDS`/`TID`, `QID`, `QHS`, `PRN`, `SOS`, `STAT`, `Q8H`, `Q12H`), numeric slot notation (`1+0+1`, `1-1-1`, `১+০+১`, `۱+۰+۱`), and local dialect phrases (`subah shaam`, `din mein teen dafa`, `5/7`, `x5`, `do hafte`, `ek mah`).
4. **AHA Blood Pressure & ADA Blood Glucose Evaluators (`vitals.ts`, `vitalsIntake.ts`):**
   - **Blood Glucose (ADA Standards in `mg/dL` & `mmol/L`):**
     - `< 54 mg/dL`: `severe_hypoglycemia` (`critical` tone — immediate 15–20g fast-acting sugar + emergency alert)
     - `54 – 69 mg/dL`: `hypoglycemia` (`warn` tone)
     - `Fasting 70 – 99` / `Post-Meal <= 140`: `normal` (`ok` tone)
     - `Fasting 100 – 125` / `Post-Meal 141 – 199`: `elevated` (`warn` tone)
     - `Fasting >= 126` / `Post-Meal 200 – 299`: `high` (`risk` tone)
     - `>= 300 mg/dL`: `crisis` (`critical` tone — DKA/HHS urgent medical care alert)
   - **Blood Pressure (AHA Standards in `mmHg`):** Classifies `hypotension` (`<90/<60`), `normal` (`<120` and `<80`), `elevated` (`120–129` and `<80`), `stage_1` (`130–139` or `80–89`), `stage_2` (`>=140` or `>=90`), and `hypertensive_crisis` (`>180` and/or `>120`).
5. **Lab Reference Range & Canonical Test Alias Resolver (`referenceRange.ts`, `testAliases.ts`):**
   - Maps 43+ canonical pathology/radiology investigations across hundreds of shorthand aliases (e.g., `SGPT` / `ALT` → `ALT / SGPT`; `Blood CP` / `CBC` → `Complete Blood Count`; `FBS` → `Fasting Blood Sugar`; `RFT` / `KFT` → `Renal Function Test`).
   - Deterministically parses interval ranges (`12.0 - 16.0`), thousands-separated ranges (`4,000 - 11,000`), single-sided bounds (`< 100`, `>= 40`), sex-specific ranges (`M: 13-17, F: 12-15`), and qualitative strings (`Negative`, `Non-Reactive`).
6. **Offline Emergency Red-Flag Triage (`redFlags.ts`):**
   - Runs 100% offline with zero latency before any network call.
   - Screens input against 6 critical emergency categories (`Cardiac Emergency`, `Severe Breathing Difficulty`, `Stroke Symptoms`, `Severe Bleeding`, `Loss of Consciousness / Seizure`, `Acute Emergency / Poisoning / Self-Harm`) in English, Roman Urdu (`seene mein dard`, `saans nahi aa rahi`, `falij`, `khoon ki ulti`), and Urdu script (`دل کا دورہ`, `سانس نہیں آرہی`, `فالج`).
   - Surfaces 1-tap dialing to **Rescue 1122 (`1122`)**, **Edhi Ambulance (`115`)**, and **Chhipa Ambulance (`1020`)**.
7. **Adherence & Milestone Achievement Engine (`adherence.ts`, `achievements.ts`):**
   - Tracks 6 clinical milestones across `bronze`, `silver`, `gold`, and `platinum` tiers: *7-Day Adherence Master*, *Monthly Adherence Champion (30d)*, *Glycemic Guardian*, *Cardiovascular Anchor*, *Consistent Monitor (20 vitals)*, and *Master Health Archivist (5 records)*.

---

## 5. AI & Serverless Backend Architecture (`api/`)

All AI endpoints run as authenticated Node.js/Vercel Serverless Functions backed by `@google/genai` with an automatic multi-model fallback chain (`gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.5-flash`), IPv4-first DNS resolution, per-user rate limiting (`rateLimit.ts`), Supabase JWT verification (`auth.ts`), and Zod schema validation (`schemas.ts`).

| Endpoint | Method | Rate Limit | Input / Output & Clinical Pipeline |
| :--- | :--- | :--- | :--- |
| `/api/extract-prescription` | `POST` | Auth + Rate Limit | Accepts 1–5 base64 images. Extracts `doctor_name`, `clinic_name`, normalized ISO `visit_date`, `diagnosis`, `doctor_advice`, `follow_up`, `medicines[]` (name, generic salt, strength, form, dose, frequency, duration, meal instructions, confidence), and `tests_ordered[]`. |
| `/api/extract-lab-report` | `POST` | Auth + Rate Limit | Accepts 1–10 base64 images/PDF pages. Extracts `lab_name`, `report_date`, `title`, and `results[]` (`test_name`, `value_text`, `unit`, `reference_range`, `confidence`). |
| `/api/explain-medicine` | `POST` | Auth + Rate Limit | Generates a patient-friendly breakdown of a specific medicine (`purpose`, `how_to_take`, `common_side_effects`, `warnings`, `food_interactions`). |
| `/api/compare-medicines` | `POST` | Auth + Rate Limit | Compares two commercial medicine brands to verify if they share the exact same **Active Generic Ingredient** (pharmacological salt) and strength, warning against strength/form mismatches. |
| `/api/chat-assistant` | `POST` | 40 req / window | **Shifa AI Clinical Co-Pilot:** Executes a 3-stage Clinical RAG pipeline (`api/_lib/rag/`):<br>1. `retrieval.ts`: Multi-turn pronoun resolution + drug/biomarker knowledge corpus retrieval (`clinicalKnowledge.ts`).<br>2. `sentinel.ts`: Deterministic **Safety Sentinel** checking active & queried drugs against `GENERIC_MOLECULE_REGISTRY` for duplicate generics, class overlaps, and cumulative daily mg overdose (e.g., Paracetamol > 4000mg/day).<br>3. `biomarkerTrajectory.ts`: Computes longitudinal slopes/deltas across patient lab history.<br>Streams structured JSON responses with strict intent-gating for embedded UI widgets (`medicines`, `dailySchedule`, `biomarkerTrajectories`, `diffAnalysis`, `actionCall`, `safetyAlerts`, `suggestions`). |

---

## 6. Database Schema & Security Model (`supabase/deploy_schema.sql`)

Curewell uses **Supabase PostgreSQL** with **Row-Level Security (RLS)** enabled across all 17 tables (`auth.uid() = user_id`), ensuring strict tenant isolation.

### Complete Table Inventory
1. **`public.profiles`**: `id (uuid PK)`, `user_id (uuid FK)`, `full_name`, `relationship ('self'|'parent'|'child'|'spouse'|'other')`, `date_of_birth`, `sex`, `blood_group`, `height_cm`, `weight_kg`, `allergies`, `chronic_conditions`, `emergency_contact_name`, `emergency_contact_phone`, `is_default`, `onboarding_completed`.
2. **`public.visits`**: `id`, `user_id`, `profile_id`, `visit_date`, `doctor_name`, `clinic_name`, `specialty`, `diagnosis`, `doctor_advice`, `follow_up_date`, `visit_cost`, `currency ('PKR')`, `notes`.
3. **`public.visit_images`**: `id`, `user_id`, `visit_id`, `storage_path`, `page_number`, `width_px`, `height_px`, `byte_size`.
4. **`public.medicines`**: `id`, `user_id`, `profile_id`, `visit_id`, `medicine_name`, `strength`, `form`, `dose_amount`, `frequency_raw`, `frequency_code ('OD'|'BD'|'TDS'|'QID'|'QHS'|'PRN'|'SOS'|'STAT'|'WEEKLY'|'CUSTOM')`, `duration_raw`, `duration_days`, `start_date`, `end_date`, `instructions`, `with_food`, `is_ongoing`, `is_otc`, `unit_cost`, `currency ('PKR')`, `discontinued_at`.
5. **`public.doses`**: `id`, `user_id`, `profile_id`, `medicine_id`, `scheduled_date`, `scheduled_minutes (0–1439)`, `status ('pending'|'taken'|'skipped'|'missed')`, `taken_at`, `skipped_reason`, `snoozed_until`. Unique constraint on `(medicine_id, scheduled_date, scheduled_minutes)`.
6. **`public.reports`**: `id`, `user_id`, `profile_id`, `title`, `report_date`, `lab_name`, `report_cost`, `currency ('PKR')`, `source_type ('image'|'pdf'|'manual')`, `notes`.
7. **`public.report_images`**: `id`, `user_id`, `report_id`, `storage_path`, `page_number`.
8. **`public.report_results`**: `id`, `user_id`, `report_id`, `test_name`, `canonical_name`, `value_text`, `value_numeric`, `unit`, `reference_range`, `ref_low`, `ref_high`, `range_status ('within'|'below'|'above'|'unknown')`.
9. **`public.test_orders`**: `id`, `user_id`, `profile_id`, `visit_id`, `test_name`, `canonical_name`, `status ('pending'|'scheduled'|'completed'|'cancelled')`, `ordered_date`, `scheduled_date`, `completed_date`, `report_id`, `link_method ('auto'|'manual')`, `estimated_cost`, `currency`.
10. **`public.glucose_readings`**: `id (text PK)`, `user_id`, `profile_id`, `measured_at`, `type ('fasting'|'post_prandial'|'random'|'bedtime')`, `value_mg_dl`, `meal_context`, `notes`.
11. **`public.blood_pressure_readings`**: `id (text PK)`, `user_id`, `profile_id`, `measured_at`, `systolic`, `diastolic`, `pulse_bpm`, `arm ('left'|'right')`, `posture ('sitting'|'standing'|'lying')`, `notes`.
12. **`public.side_effects`**: `id`, `user_id`, `profile_id`, `medicine_id`, `medicine_name`, `note`, `severity ('mild'|'moderate'|'severe')`, `occurred_at`.
13. **`public.reminder_settings`**: `id`, `user_id`, `profile_id (unique)`, `enabled`, `quiet_hours_start`, `quiet_hours_end`, `snooze_minutes (default 15)`, `lead_minutes`.
14. **`public.shares`**: `id`, `user_id`, `profile_id`, `token_hash (unique)`, `snapshot (jsonb)`, `expires_at`, `revoked_at`, `view_count`, `last_viewed_at`. Includes public RLS policy allowing `SELECT` only when `revoked_at IS NULL AND expires_at > now()`.
15. **`public.extraction_audit`**: `id`, `user_id`, `entity_type ('visit'|'report')`, `entity_id`, `model`, `raw_response (jsonb)`, `confirmed_data (jsonb)`, `edited_fields (text[])`.
16. **`public.chat_sessions` & `public.chat_messages`**: Stores per-profile Shifa AI conversations, pinned flags, image attachments, and structured clinical widget metadata.

---

## 7. UI, Theme & Visual Design System (`src/styles/theme.css`)

### Design Philosophy
- **Warm Stone & Clinical Teal Aesthetic:** Rejects cold corporate blue-greys in favor of **Clinical Teal & Health Mint (`Hue 186–192`)** paired with **Warm Stone Neutrals (`Hue 64–78`)**.
- **Light-Mode Enforced for Clinical Legibility:** Guaranteed light mode (`#0F766E` theme color) so high-contrast dark charcoal typography on warm alabaster/white surfaces remains effortlessly readable for older adults and patients in bright clinic environments.
- **Glassmorphism & Spring Motion:** Uses `.glass-card`, `.glass-panel`, and `.glass-elevated` (`backdrop-filter: blur(16px–24px)`) alongside tactile spring animations (`--ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1)`).
- **Patient-First Typography Scale:**
  - Font Stack: `"Inter Variable", "Noto Nastaliq Urdu", "Gulzar", "Jameel Noori Nastaleeq", "Urdu Typesetting", system-ui, sans-serif`
  - Monospace Stack: `"JetBrains Mono", ui-monospace, monospace`
  - Scale: `2xs` (`12px` hard minimum floor), `xs` (`13px`), `sm` (`15px`), `base` (`17px` body default), `lg` (`19px`), `xl` (`22px`), `2xl` (`26px`), `3xl` (`32px`), `4xl` (`40px`), `5xl` (`50px`).
- **A4 Portrait Print Engine (`@media print`):** Automatically hides headers, navbars, floating assistant buttons, and banners, and re-maps all semantic tokens to pure white backgrounds (`#FFFFFF`) and high-contrast borders so printed Doctor Consultation Briefs never waste ink or photocopy poorly.

### Complete Color Token Reference

#### A. Brand Ramp (Clinical Teal & Health Mint)
| CSS Variable | OKLCH Value | Hex Equivalent | Primary Usage |
| :--- | :--- | :--- | :--- |
| `--color-brand-50` | `oklch(0.979 0.019 186)` | `#F0FDFA` | `--surface-accent`, `--accent-subtle` |
| `--color-brand-100` | `oklch(0.949 0.044 186)` | `#CCFBF1` | Subtle pill/badge backgrounds |
| `--color-brand-200` | `oklch(0.901 0.078 186)` | `#99F6E4` | Soft accent borders |
| `--color-brand-300` | `oklch(0.833 0.114 187)` | `#5EEAD4` | Logo cross beam start & telemetry dashes |
| `--color-brand-400` | `oklch(0.753 0.132 187)` | `#2DD4BF` | Logo inner bevel stroke |
| `--color-brand-500` | `oklch(0.679 0.129 188)` | `#14B8A6` | Logo cross beam end |
| `--color-brand-600` | `oklch(0.593 0.115 188)` | `#0D9488` | **`--accent` (Primary buttons, active links, logo wordmark)** |
| `--color-brand-700` | `oklch(0.513 0.097 189)` | `#0F766E` | **`--accent-hover` & PWA `<meta name="theme-color">`** |
| `--color-brand-800` | `oklch(0.444 0.080 190)` | `#115E59` | `--accent-active`, `--accent-onsubtle` |
| `--color-brand-900` | `oklch(0.391 0.067 191)` | `#134E4A` | Deep forest accent |
| `--color-brand-950` | `oklch(0.281 0.048 192)` | `#042F2E` | Logo shield bottom gradient stop |

#### B. Warm Stone Neutral Ramp (`--color-ink-*`)
| CSS Variable | OKLCH Value | Semantic Mapping & Role |
| :--- | :--- | :--- |
| `--color-ink-50` | `oklch(0.985 0.003 75)` | `--surface-sunken` (Main warm alabaster app background) |
| `--color-ink-100` | `oklch(0.970 0.006 75)` | `--surface-hover` |
| `--color-ink-200` | `oklch(0.932 0.010 78)` | `--line` (Standard card and table borders) |
| `--color-ink-300` | `oklch(0.872 0.015 78)` | `--line-strong` (Emphasized borders & scrollbars) |
| `--color-ink-400` | `oklch(0.709 0.024 76)` | Disabled controls & print borders |
| `--color-ink-500` | `oklch(0.560 0.026 74)` | `--content-subtle` (Captions/labels — passes 4.5:1 AA on white) |
| `--color-ink-600` | `oklch(0.452 0.026 72)` | `--content-muted` (Secondary descriptions) |
| `--color-ink-700` | `oklch(0.378 0.025 70)` | Subheadings |
| `--color-ink-800` | `oklch(0.284 0.022 68)` | Strong body text |
| `--color-ink-900` | `oklch(0.212 0.020 66)` | `--content` (Primary headings & body text) |
| `--color-ink-950` | `oklch(0.164 0.017 64)` | Print primary ink |

#### C. Semantic Status & Circadian Daypart Tokens
| Token Group | Background (`-bg`) | Border (`-border`) | Text (`-text`) |
| :--- | :--- | :--- | :--- |
| **OK (Normal / Taken)** | `oklch(0.979 0.021 166)` | `oklch(0.905 0.056 165)` | `oklch(0.360 0.120 151)` |
| **Warn (Elevated / Low Stock)** | `oklch(0.975 0.035 90)` | `oklch(0.820 0.095 85)` | `oklch(0.310 0.115 50)` |
| **Risk (Abnormal / Crisis)** | `oklch(0.971 0.013 18)` | `oklch(0.885 0.062 18)` | `oklch(0.400 0.180 26)` |
| **Info (Clinical Note)** | `oklch(0.970 0.014 254)` | `oklch(0.882 0.059 254)` | `oklch(0.380 0.180 264)` |
| **Morning Slot (`05:00–11:59`)** | `oklch(0.975 0.035 90)` | `oklch(0.820 0.095 85)` | `oklch(0.310 0.115 50)` |
| **Afternoon Slot (`12:00–16:59`)** | `oklch(0.973 0.021 230)` | `oklch(0.890 0.060 232)` | `oklch(0.462 0.132 245)` |
| **Evening Slot** | `oklch(0.973 0.020 305)` | `oklch(0.892 0.058 305)` | `oklch(0.458 0.155 300)` |
| **Night Slot (`17:00–21:59`)** | `oklch(0.968 0.016 275)` | `oklch(0.884 0.052 275)` | `oklch(0.440 0.150 272)` |
| **Bedtime Slot (`22:00–04:59`)** | `oklch(0.965 0.025 295)` | `oklch(0.875 0.065 295)` | `oklch(0.400 0.160 295)` |

---

## 8. Official Brand Logos (Complete SVG Source Code)

### A. Full Horizontal Master Logo (`public/logo.svg` — `1024×512`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 512" width="1024" height="512" fill="none">
  <defs>
    <!-- 100% Blue Removed: Pure Clinical Teal, Emerald & Deep Forest Ink -->
    <linearGradient id="cw-it1-shield-grad" x1="140" y1="110" x2="370" y2="410" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="45%" stop-color="#0F766E" />
      <stop offset="100%" stop-color="#042F2E" />
    </linearGradient>
    <linearGradient id="cw-it1-beam" x1="200" y1="200" x2="310" y2="310" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5EEAD4" />
      <stop offset="100%" stop-color="#14B8A6" />
    </linearGradient>
    <filter id="cw-it1-glow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0D9488" flood-opacity="0.28" />
    </filter>
  </defs>

  <!-- Icon Mark: Hex Shield with Pure Emerald & Medical Teal Geometry -->
  <g id="icon" filter="url(#cw-it1-glow)">
    <!-- Outer Faceted Shield Path -->
    <path d="M256 116 L376 172 V292 C376 348 324 394 256 412 C188 394 136 348 136 292 V172 L256 116 Z" fill="url(#cw-it1-shield-grad)" />
    <!-- Luminous Mint Bevel Stroke -->
    <path d="M256 122 L370 176 V292 C370 344 320 388 256 405 C192 388 142 344 142 292 V176 L256 122 Z" stroke="#2DD4BF" stroke-opacity="0.35" stroke-width="2" />

    <!-- Concentric Hex Vault Telemetry Lines (Pure Mint / Emerald) -->
    <path d="M256 156 L340 196 V284 C340 324 302 358 256 372 C210 358 172 324 172 284 V196 L256 156 Z" stroke="#5EEAD4" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 6" />

    <!-- Central Precision Medical Cross (Mint Glow) -->
    <path d="M256 206 V306 M206 256 H306" stroke="url(#cw-it1-beam)" stroke-width="14" stroke-linecap="round" />
    
    <!-- Central Health Core Node -->
    <circle cx="256" cy="256" r="14" fill="#FFFFFF" />
    <circle cx="256" cy="256" r="6" fill="#0D9488" />
  </g>

  <!-- Wordmark Text Lockup (Dark Ink + Signature Teal) -->
  <g id="wordmark">
    <text x="440" y="278" font-family="'Inter Variable', system-ui, -apple-system, sans-serif" font-size="82" font-weight="900" letter-spacing="-0.035em" fill="#0F172A">
      CURE<tspan fill="#0D9488">WELL</tspan>
    </text>
    <text x="444" y="324" font-family="'Inter Variable', system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" letter-spacing="0.3em" fill="#0F766E">
      ZERO-KNOWLEDGE HEALTH VAULT
    </text>
  </g>
</svg>
```

### B. Standalone App Icon / Favicon Shield (`public/favicon.svg` — `512×512`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="cw-ico-shield-grad" x1="140" y1="110" x2="370" y2="410" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="45%" stop-color="#0F766E" />
      <stop offset="100%" stop-color="#042F2E" />
    </linearGradient>
    <linearGradient id="cw-ico-beam" x1="200" y1="200" x2="310" y2="310" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5EEAD4" />
      <stop offset="100%" stop-color="#14B8A6" />
    </linearGradient>
    <filter id="cw-ico-glow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0D9488" flood-opacity="0.28" />
    </filter>
  </defs>

  <g id="icon" filter="url(#cw-ico-glow)">
    <!-- Outer Faceted Shield Path -->
    <path d="M256 90 L396 156 V298 C396 364 334 418 256 438 C178 418 116 364 116 298 V156 L256 90 Z" fill="url(#cw-ico-shield-grad)" />
    <!-- Luminous Mint Bevel Stroke -->
    <path d="M256 96 L390 160 V298 C390 358 330 410 256 430 C182 410 122 358 122 298 V160 L256 96 Z" stroke="#2DD4BF" stroke-opacity="0.4" stroke-width="2.5" />

    <!-- Concentric Hex Vault Telemetry Lines -->
    <path d="M256 136 L356 184 V288 C356 336 310 376 256 392 C202 376 156 336 156 288 V184 L256 136 Z" stroke="#5EEAD4" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 6" />

    <!-- Central Precision Medical Cross -->
    <path d="M256 196 V316 M196 256 H316" stroke="url(#cw-ico-beam)" stroke-width="18" stroke-linecap="round" />
    
    <!-- Central Health Core Node -->
    <circle cx="256" cy="256" r="16" fill="#FFFFFF" />
    <circle cx="256" cy="256" r="7" fill="#0D9488" />
  </g>
</svg>
```
