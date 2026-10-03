# Issue 03: Sparse Intake Logs, Status Derivation & Two-Tier Adherence

Status: resolved
Type: task
Blocked by: 02

## Summary

Implement the sparse intake log model, out-of-window status derivation with dose-stacking risk analysis, and the two-tier adherence metric (Daily Logging Streak for habit motivation vs Clinical Adherence Rate for doctor truth).

## Requirements

1. **Sparse Intake Log Model**:
   - `IntakeLogRecord`: `id`, `medicine_id`, `scheduled_date`, `bucket`, `status` (`taken` | `skipped`), `taken_at` (ISO timestamp), `skip_reason` (optional clinical reason e.g., "Doctor advised hold", "Nausea", "Fasting").
2. **Status Derivation on Read**:
   - `deriveEffectiveDose(projectedDose, intakeLogs, now)`:
     - If matching intake log exists with `taken` ➔ `taken` (with `taken_at`).
     - If matching intake log exists with `skipped` ➔ `skipped` (with `skip_reason`).
     - If no log exists and bucket window has expired ➔ derived `missed`.
     - If no log exists and bucket window is current or future ➔ `pending`.
3. **Out-of-Window Guardrail & Dose Stacking Risk**:
   - Pure function `evaluateLateDoseRisk(dose, nextScheduledDose, currentMinutes)`:
     - Returns risk level (`safe` | `warning_dose_stacking`) and clinical guidance when an afternoon dose is logged late close to the night dose.
4. **Two-Tier Adherence Calculations**:
   - `calculateAdherenceMetrics(projectedDoses, intakeLogs, range, now)`:
     - **Clinical Adherence %**: `taken / scheduled` (excluding PRN and future pending doses).
     - **Daily Logging Streak**: Consecutive days where all scheduled doses are settled (`taken` or `skipped` with reason).
5. **Verification**:
   - Comprehensive unit tests in `src/domain/__tests__/adherence.test.ts`.
