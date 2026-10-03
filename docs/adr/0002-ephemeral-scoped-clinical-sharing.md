# 0002. Ephemeral Scoped Clinical Sharing via Cryptographic Tokens

We decided to provide clinician access to patient medical reports through time-limited, scope-filtered cryptographic tokens with optional PIN protection and instant patient revocation, rather than static user URLs or requiring doctor account registration.

## Context

Patients living with any medical condition—whether chronic illnesses (cardiology, diabetes, kidney disease, autoimmune disorders), multi-year specialist treatments (oncology, neurology), surgeries, or routine longitudinal lab tracking—accumulate years of diagnostic reports across different clinics and specialties. When consulting a specialist, doctors need immediate, zero-friction access to relevant records without creating accounts or downloading massive unstructured files. At the same time, patients need absolute sovereignty over their data, including the ability to share only relevant records (e.g., cardiology only, hiding sensitive mental health or reproductive data) and revoke access at any time.

## Decision

1. **Cryptographic Ephemeral Token**: Access is granted via high-entropy, cryptographically secure tokens in URLs (`/view/:token`), never exposing the underlying patient UUID.
2. **Granular Scope Filtering**: The patient defines the access boundary per share instance:
   - Specific clinical conditions / health areas (e.g., "Cardiology only", "Endocrinology only", "All").
   - Date range boundaries (e.g., "Past 12 months", "All time").
   - Specific report inclusions/exclusions.
3. **Strict Time Limits & Expiration**: Tokens expire automatically after a patient-selected duration (24 hours, 7 days, 30 days, or single clinic visit).
4. **Optional PIN Gate**: Patients can require a 4-digit PIN for an extra verification barrier before the doctor can view decrypted records.
5. **Instant Revocation**: Patients can terminate an active token with one tap, immediately invalidating the link.
6. **Zero-Friction Doctor Web Viewer**: Clinicians view a fast, responsive read-only portal with chronological filtering, inline PDF/scan inspection, and 1-click dossier export.

## Consequences

- Completely protects patient identity and keeps unrelated sensitive medical records private.
- Clinicians face zero authentication friction while maintaining strict privacy standards.
- Token management and expiration checks must be enforced at both the API and database policy (RLS) layers.
