# Curewell Domain Glossary

Curewell is a patient-centric, clinical-grade medical management system and mobile companion designed for chronic condition tracking, medication adherence, vitals telemetry, and clinician dossier sharing.

## Clinical Domain Language

**Patient**:
The primary individual managing their health records, regimens, and consultations.
_Avoid_: User, client, consumer, customer

**Caregiver**:
An authorized family member or guardian managing or observing health profiles for dependents.
_Avoid_: Manager, supervisor, proxy

**Regimen**:
The active, structured schedule of medications prescribed to a patient.
_Avoid_: Medicine list, pill routine, prescription list

**Dose**:
A scheduled intake event of a specific medicine at an appointed time or time bucket.
_Avoid_: Pill, intake, event

**Biomarker**:
An objectively measured biological metric such as blood glucose, systolic/diastolic blood pressure, or pulse.
_Avoid_: Metric, vital stat, reading, test result

**Clinical Dossier**:
A time-scoped, cryptographically verifiable health summary shared ephemerally with a healthcare provider.
_Avoid_: Export, report dump, profile bundle

**Red Flag**:
A critical biometric threshold requiring immediate clinical triage or emergency care.
_Avoid_: Error, warning, bad alert

## Design System & Interface Language

**Action Primitive**:
A unified interactive component representing user intent with tactile spring physics, deterministic sizing, and zero layout shift.
_Avoid_: Clickable, touchable, custom button, raw button

**Tactile Spring**:
Physics-based micro-interaction giving immediate physical feedback during press and release cycles.
_Avoid_: Button bounce, click effect, tap animation

**Layout Stability**:
The invariant that an interactive element preserves its visual geometry across all states (idle, hover, active, loading, disabled) without shifting surrounding layouts.
_Avoid_: Anti-jitter, button freeze, fixed width hack

**Touch Target Floor**:
The minimum interactive boundary (44px / 2.75rem) guaranteed for mobile accessibility and one-handed operation by unwell patients.
_Avoid_: Padding hack, big button, fat-finger zone
