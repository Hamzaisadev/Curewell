# Issue 06: Out-of-Window Guardrail & Dose-Stacking Risk Modal

Status: resolved
Type: task
Blocked by: none

## Summary

Build an interactive safety modal in `TodaySchedulePage.tsx` that triggers when a patient marks an expired/overdue dose as taken, prompting whether they took it earlier or are taking it now, and evaluating dose-stacking risk.

## Requirements

1. **Trigger Condition**:
   - Triggers when a patient clicks "Log Taken" on an expired bucket dose or a dose overdue by >240 minutes.
2. **Interactive Choices**:
   - Prompt: *"Did you take this dose earlier today, or are you taking it right now?"*
   - Option A: *"I took it earlier today"* -> Marks taken with timestamp and success toast.
   - Option B: *"I am taking it right now"* -> Evaluates dose-stacking risk against upcoming doses using `checkDoseLateRisk` / `evaluateLateDoseRisk`.
3. **Clinical Warning**:
   - If risk is detected (e.g. interval < 4 hours to upcoming night dose), display clinical alert:
     *"Warning: Taking an afternoon dose close to your night dose may cause dose stacking. Consult your doctor or pharmacist if unsure."*
   - Provides safe options: "Proceed and take now" or "Skip this dose per safety advice".
4. **Verification**:
   - Unit and component tests verifying modal trigger, risk evaluation, and resolution.
