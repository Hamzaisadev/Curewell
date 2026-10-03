# 0004. Zero-Falsification Mandate in Clinical Visualizations

We decided to strictly prohibit synthetic or placeholder mock data in clinical dashboards and charts. When physiological readings, schedules, or records are absent, components must render honest empty states with direct intake prompts rather than decorative baseline data.

## Context

Visual design templates often insert pleasant placeholder curves (e.g., oscillating 120/80 mmHg blood pressure sparklines or 95 mg/dL fasting glucose values) to avoid visual blank spaces. In clinical applications, displaying fabricated "normal" physiological trends or static "All Clear / 0 Contraindications" badges when a patient has recorded zero data presents an acute clinical hazard: patients or family members reviewing the dashboard may infer that their health markers are well-controlled when in reality no monitoring is occurring.

## Decision

1. **Zero Synthetic Vitals**: Blood pressure, blood glucose, and biomarker sparklines must never generate decorative sine waves or fake historical points. If `readings.length === 0`, render an actionable empty state ("No blood pressure recorded yet · Tap to log first reading").
2. **Honest Safety Audits**: The Drug Safety Radar must never display a static "All Clear" badge without evaluating active medications. When zero active medications exist, the status must report "No active medications to evaluate". When medications are active, it must execute real deterministic rule checks against known interactions and food timing.
3. **Derived Real Timelines**: Care timelines and refill alerts must derive exclusively from actual appointments (`visitsRepo`), laboratory orders (`reportsRepo`), and calculated dose inventories, never hardcoded fictional doctor names or mock follow-up dates.

## Consequences

- Eliminates patient false reassurance and legal/clinical liabilities regarding falsified health trends.
- Improves user onboarding by turning empty cards into intuitive entry points for logging first vitals and uploading initial reports.
- Requires robust, well-designed empty state UI components across all dashboard cards.
