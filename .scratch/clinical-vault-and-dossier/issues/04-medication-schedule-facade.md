# Issue 04: Medication Schedule & Adherence Domain Facade

Status: resolved
Type: task
Blocked by: 01, 02, 03

## Summary

Build the unified domain facade (`medicationScheduleFacade.ts`) representing the single high-level testing and consumer seam for the medication engine, uniting virtual projection, intake logs, adaptive buckets, and adherence metrics.

## Requirements

1. **Unified Facade Interface**:
   - `buildDailyScheduleView(input: FacadeScheduleInput): DailyScheduleView`
     - Returns grouped buckets (`morning`, `afternoon`, `night`, and optional `bedtime`).
     - Includes separate `pastUnloggedDoses` section for expired bucket items.
     - Computes current `Daily Logging Streak` and `Clinical Adherence %`.
2. **Single Seam Testing**:
   - Write comprehensive domain tests in `src/domain/__tests__/medicationScheduleFacade.test.ts` validating the entire scheduling lifecycle from input medicines + logs to output view models.
3. **Integration Verification**:
   - Run `npm run verify` (`typecheck`, `lint`, `test`) to ensure zero regressions across the codebase.
