# Curewell Patient Health Companion

Defines the ubiquitous language for patient daily medicines, dose tracking, vitals (blood pressure and blood glucose), medical records, and doctor sharing.

## Daily Medicines & Schedule

**Patient**:
The individual recipient of care whose daily medicines, prescriptions, reports, and health readings are managed.
_Avoid_: User, client, account, customer

**Prescription**:
A formal doctor's authorization specifying medications, dosages, meal relations, and duration.
_Avoid_: Script, doctor note, order

**Active Medicine**:
A medication currently being taken (started, not discontinued, and within its prescribed duration).
_Avoid_: Current drug, active script, regimen item

**Medication Schedule**:
The daily schedule organized into Morning, Afternoon, Evening, and Night showing when each medicine should be taken.
_Avoid_: Regimen, medication protocol, drug timetable

**Dose**:
A single scheduled intake of medicine for a specific time of day.
_Avoid_: Pill event, scheduled dose, telemetry instance, future row

**Daily Meds**:
The set of medicines scheduled to be taken by the patient today.
_Avoid_: Daily regimen, course of drugs

**Intake Confirmation**:
A record created when a patient confirms taking or skipping a scheduled dose.
_Avoid_: Check-in, mark, telemetry log

**Streak**:
Consecutive days where the patient logged all their scheduled medicines, building a healthy daily routine.
_Avoid_: Compliance streak, gamification score, adherence index

**Adherence Rate**:
The percentage of scheduled doses confirmed taken (`taken / scheduled`) over time, excluding as-needed (PRN) medicines.
_Avoid_: Compliance percentage, health score, telemetry accuracy

**As-Needed Medicine (PRN)**:
A medicine taken only when needed (e.g. pain relief) with no fixed daily schedule, excluded from adherence rates.
_Avoid_: SOS drug, rescue med, emergency medicine

## Health Records & Doctor Sharing

**Medical Records**:
The patient's archive of doctor visits, lab reports, prescriptions, and health history.
_Avoid_: Clinical dossier, diagnostic vault, chart archive, repository

**Lab Report**:
A diagnostic test result (e.g., blood test, imaging, pathology) from a medical clinic or laboratory.
_Avoid_: File, scan, attachment, telemetry sheet

**Doctor Visit**:
A record of a consultation with a physician, including advice, diagnosis, and follow-up date.
_Avoid_: Care event, encounter, clinical review, consultation ticket

**Doctor Visit Companion**:
A unified consultation workspace that prepares the patient for a doctor visit with auto-generated questions, past lab/vital summaries, and doctor sharing (with optional anonymized second opinion mode).
_Avoid_: Second opinion pack, consultation ticket, interrogation checklist

**Doctor Sharing Link**:
A secure, time-limited link that allows a consulting doctor to view selected health records without an account.
_Avoid_: Ephemeral sharing link, public URL, file link

**Access PIN / Token**:
A secure 4-digit PIN or token protecting the doctor sharing link.
_Avoid_: Password, cryptographic key

## Caregivers & Family Network

**Caregiver**:
The primary account owner managing medicines, appointments, and vitals for themselves or loved ones.
_Avoid_: Admin, master user, account manager

**Family Profile**:
A dependent health profile (e.g., Mother, Father, Child) managed under a caregiver's account, with isolated schedules and records.
_Avoid_: Sub-account, secondary profile, patient slot

## Vitals & Daily Health Readings

**Vitals**:
Key health readings recorded by the patient (Blood Pressure, Blood Glucose, Heart Rate, Weight).
_Avoid_: Telemetry, biometric stream, sensor feed, physiological metrics

**Blood Pressure Reading**:
Systolic and diastolic blood pressure measured with a home cuff (e.g. 120/80 mmHg).
_Avoid_: Blood pressure telemetry, arterial pressure spline, MAP telemetry

**Blood Glucose Reading**:
Fasting or post-meal blood sugar level measured in mg/dL.
_Avoid_: Glycemic telemetry, glucose index, metabolic feed

**Target Range**:
Recommended healthy ranges for blood pressure (<120/80 mmHg) and glucose (70-130 mg/dL fasting) established by standard guidelines.
_Avoid_: Safe zone, clinical boundaries, ADA threshold

## Safety & Medicine Supply

**Medicine Interaction Warning**:
A warning displayed when two medicines or a medicine and food item shouldn't be taken together.
_Avoid_: Drug interaction radar, conflict alert, pill clash

**Symptom Log & Doctor Discussion Points**:
A non-diagnostic tool to record symptom characteristics (timing, severity, notes) and generate objective discussion questions for a physician consultation.
_Avoid_: Symptom checker, diagnosis engine, home care advice, self-remedy advisor

**Doctor Consultation Brief**:
A concise, one-page factual summary of a patient's active medicines, 7-day vitals averages, known allergies, and abnormal lab readings prepared for a physician's review during a consultation.
_Avoid_: Clinical assessment, diagnosis sheet, triage report

**Active Generic Ingredient**:
The recognized pharmacological chemical salt (e.g. Omeprazole) contained within a commercial brand product (e.g. Risek).
_Avoid_: Drug formula, cure chemical, remedy molecule

**Active Ingredient Matcher**:
A strictly factual comparison tool matching the active generic chemical molecules of two commercial brands at the pharmacy.
_Avoid_: Drug recommender, prescription substitute advice

**Medicine Supply**:
The number of pills or doses remaining in the medicine cabinet.
_Avoid_: Dose inventory, stock units, stash

**Refill Alert**:
A friendly notification when a medicine has 7 or fewer days remaining so the patient can request a refill in advance.
_Avoid_: Refill horizon, runout threshold, stock exhaustion

## Shifa AI Health Assistant

**Shifa AI Assistant**:
A helpful, conversational health assistant answering questions about medicines, reports, and symptoms in plain language.
_Avoid_: Clinical co-pilot, bot, LLM agent

**Bilingual Voice Support**:
Voice conversation allowing patients to speak and listen in clear everyday Urdu or English.
_Avoid_: Voice telemetry, clinical vocalization, bidirectional audio

## Mobile Companion & The Daily Survival Triad

**Mobile Companion**:
A distraction-free, installable Progressive Web App (PWA) on the patient or caregiver's smartphone (`/companion`), designed for high-frequency daily routines: logging doses, checking vitals, and emergency access.
_Avoid_: Mobile EHR, micro-app, mini-portal

**QR Code Device Pairing**:
A secure, 15-minute ephemeral QR code generated by the desktop app that logs into the companion app on a phone with zero password typing.
_Avoid_: Mobile login bypass, quick link, device binding

**4-Digit Companion PIN**:
A salted, local 4-digit PIN (or Face ID / fingerprint) that unlocks the mobile companion in 1 second, protecting medical data with automatic inactivity locking.
_Avoid_: Passcode, master password, app lock code

**The Daily Survival Triad**:
The three essential daily mobile workflows: Today's Doses, 10-Second Vitals Intake, and Emergency Medical ID Card.
_Avoid_: Core feature set, primary telemetry, operational triad


