# Issue 02: Deterministic Virtual Schedule Projection Engine

Status: resolved
Type: task
Blocked by: 01

## Summary

Implement ADR 0001: Zero pre-stored future dose rows in the database. Build the pure deterministic schedule projection engine that generates scheduled doses on the fly in memory for any requested date range.

## Requirements

1. **Pure Projection Contract**:
   - `projectSchedule(input: VirtualScheduleInput): ProjectedDose[]`
   - Inputs:
     - `activeMedicines`: list of active medicine records (dosage, frequency, start date, duration, is_ongoing, with_food).
     - `dateRange`: `{ from: string; to: string }` (defaulting to 7-day rolling window for ongoing medications).
     - `patientRoutines`: patient anchor times for buckets (morning, afternoon, night, bedtime).
     - `now`: deterministic injected clock for timezone safety.
2. **Horizon Rules**:
   - Finite courses (e.g. 5 days of antibiotics) project only for their exact prescribed duration.
   - Ongoing medications project up to 7 days forward from `now`.
   - PRN medications generate zero scheduled rows.
3. **Meal Timing & Clear Guidance**:
   - Project dose items with human-readable instruction notes: *"Take with or after breakfast"*, *"Take on an empty stomach"*, *"Take after dinner"*.
4. **Verification**:
   - Comprehensive unit tests in `src/domain/__tests__/schedule.test.ts` validating multi-day projections, finite course cutoffs, meal offsets, and frequency multiplicity (OD, BD, TDS, QID, WEEKLY).
