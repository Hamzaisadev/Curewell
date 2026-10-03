# 0007. Patient-Centric Dashboard Architecture and Plain-Language Domain Model

We decided to restructure the primary dashboard from a 17-card clinical workstation into a focused, 4-widget daily health companion and permanently retire clinical/engineering jargon (such as "regimen", "telemetry", and "clinical dossier") in favor of plain patient language.

## Context

The previous dashboard layout presented 17 separate clinical cards in multi-column rows with stretch alignment (`items-stretch`). This caused visual overload, severe text clutter, and prominent empty white voids when cards had differing amounts of data. Furthermore, the UI used intimidating clinical vocabulary ("Medication Regimen", "Arterial Pressure Splines", "Mean Arterial Pressure (MAP)", "Clinical Dossier", "Telemetry") that confused everyday patients and their family caregivers.

## Decision

1. **Retire Jargon in Domain Vocabulary**:
   - Replace "Medication Regimen" with "Today's Medicines" / "Medication Schedule".
   - Replace "Telemetry" with "Vitals" / "Health Readings".
   - Replace "Clinical Dossier / Diagnostic Vault" with "Medical Records".
   - Replace "Symptom Triage" with "Symptom Checker".
   - Remove internal clinical acronyms (e.g. raw MAP equations, spline formulas) from primary user views.

2. **Consolidate to 4 Purposeful Dashboard Widgets**:
   - **Hero Greeting & Daily Focus**: Welcome message, patient identity chip, emergency 1122 quick-access, and a clean quick-log action strip.
   - **Today's Medicine Schedule**: Central hero displaying morning/afternoon/evening/night doses with 1-tap completion and visual feedback.
   - **Vitals at a Glance**: Clean, side-by-side Blood Pressure and Blood Glucose cards with easy-to-read status tags and zero cluttered formulas.
   - **Daily Habits & Next Up**: A balanced side-column widget combining the daily streak, water tracker, and upcoming doctor visit or medicine refill alert.

3. **Eliminate Layout Stretching & White Space Voids**:
   - Transition from arbitrary 3-column rows to an asymmetric 2-column layout (70% main feed, 30% side rail) where cards size to their natural content height, preventing empty blank areas.
   - Secondary destinations (Reports, Symptoms, Full Visits Timeline) are accessible via dedicated top-level pages rather than crammed onto the home view.

## Consequences

- Dramatically reduces visual noise and cognitive burden for patients taking daily medications.
- Eliminates awkward blank white voids across varying screen sizes and data counts.
- Improves app performance by removing redundant database queries and unneeded SVG re-renders on the root dashboard page.
- Aligns all component labels, tests, and documentation with the updated `CONTEXT.md` ubiquitous language.
