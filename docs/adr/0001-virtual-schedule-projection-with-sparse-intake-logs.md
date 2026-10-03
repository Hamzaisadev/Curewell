# 0001. Virtual Schedule Projection with Sparse Intake Logs

We decided to calculate future medication doses dynamically on demand (virtual projection) rather than pre-generating and storing rows for future dates in the database. Only actual user actions (`taken` or `skipped`) write persistent records into a sparse `intake_logs` table.

## Context

Medication schedules can span weeks or years. Pre-generating database rows for every scheduled dose creates massive write amplification, requires recurring background cron jobs to advance horizons, and forces complex cache invalidation and mass deletion whenever a patient updates a dosage, pauses a course, or changes meal times.

## Decision

1. **Zero Future Dose Rows**: The database never stores empty or pending future dose rows.
2. **Pure Projection Function**: A deterministic function `projectSchedule(activeMedicines, dateRange, patientRoutines)` computes scheduled slots in-memory for the active view (today, this week).
3. **Sparse Intake Logs**: The database only writes a row to `intake_logs` when a patient explicitly logs an outcome (`taken`, `skipped`).
4. **Derived Missed Doses**: If a projected slot is in the past and has no corresponding intake log, it is derived as `missed` at query time.
5. **Dosing Horizon**: Fixed-duration prescriptions project only for their specified duration; ongoing regimens project forward up to a rolling 7-day window.

## Consequences

- Updating, pausing, or discontinuing a medicine takes effect immediately with zero stale future records to purge.
- Database storage remains minimal and scales linearly with actual patient actions rather than the passage of time.
- Offline storage (IndexedDB / SQLite) remains ultra-lightweight.
