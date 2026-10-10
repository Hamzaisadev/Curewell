# 0009. Non-Diagnostic Clinical Scribing and Physician Consultation Brief Architecture

We decided to permanently eliminate all prescriptive medical directives and self-diagnosis features from Curewell, pivoting the platform into an objective clinical intake scribe, 1-page physician consultation brief, and factual pharmaceutical active ingredient comparator.

## Context

Following hackathon evaluation and clinical feedback, the previous implementation presented significant regulatory and clinical liability risks. Specifically, the symptom triage module issued prescriptive directives (such as recommending fluid volumes and naming over-the-counter analgesics like Paracetamol) and offered speculative recovery predictions. In clinical practice, unmonitored fluid or analgesic guidance poses severe risks to patients with underlying cardiovascular or renal comorbidities. Furthermore, patient safety was hindered by the lack of active generic molecule resolution for fragmented regional pharmaceutical brands (such as those registered under DRAP in Pakistan).

## Decision

1. **Strict Zero-Diagnosis & Zero-Prescription Boundary**:
   - Permanently remove all prescriptive "home care" directives, medication recommendations, and recovery forecasts from the symptom logging interface.
   - Replace prescriptive text with structured **Doctor Discussion Points** (questions tailored to logged symptoms and current medications) and objective **Emergency Warning Signs** indicating when immediate emergency care is warranted.

2. **1-Page Doctor Consultation Brief (High-Density SBAR Snapshot)**:
   - Provide a unified, single-page clinical summary optimized for 3-minute outpatient consultations (OPD).
   - Incorporate 4 core clinical data blocks:
     - Patient profile, known drug/food allergies, and chronic medical conditions.
     - 7-day home vitals telemetry averages (Blood Pressure and Blood Glucose).
     - Authoritative active prescribed medication courses with dosing frequencies and meal relations.
     - Recent out-of-range diagnostic laboratory biomarker flags.
   - Support one-tap export to WhatsApp formatted text and printable/PDF clinical records.

3. **Active Generic Molecule Extraction & Commercial Brand Comparison**:
   - Upgrade the Gemini prescription extraction schema to resolve both commercial `medicine_name` and pharmacological `generic_name` (active chemical salt), flagging ambiguous handwriting for manual verification.
   - Introduce a dedicated, non-diagnostic **Pharmacy Brand & Generic Comparator** (`/api/compare-medicines`) allowing patients to factually compare active molecules and strengths between prescribed products and pharmacy-offered substitutes without providing medical advice.

## Consequences

- Completely eliminates FDA/SaMD clinical decision support liability and hazardous contraindication advice.
- Provides immediate real-world utility for both patients and healthcare providers during time-constrained clinical encounters.
- Solves patient confusion surrounding regional pharmaceutical brand proliferation and pharmacy substitutions.
- Keeps backend infrastructure lightweight and serverless with zero custom model training or GPU hosting costs.
