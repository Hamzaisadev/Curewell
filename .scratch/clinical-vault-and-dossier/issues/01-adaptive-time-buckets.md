# Issue 01: Adaptive 3+1 Time Bucket Engine

Status: resolved
Type: task
Blocked by: none

## Summary

Refactor the time bucket domain logic to support an adaptive 3+1 bucket topology (*Morning*, *Afternoon*, *Night*, and optional *Bedtime*), replacing the static 3-bucket implementation while preserving timezone-aware arithmetic.

## Requirements

1. **Bucket Definitions**:
   - `morning`: Standard wake/breakfast window (05:00 – 11:59).
   - `afternoon`: Lunch window (12:00 – 16:59).
   - `night`: Dinner/evening window (17:00 – 21:59).
   - `bedtime`: Optional pre-sleep window (22:00 – 04:59).
2. **Adaptive Presence**:
   - Provide a pure function `resolveActiveBuckets(activeMedicines)`: returns `['morning', 'afternoon', 'night']` by default, appending `'bedtime'` if and only if at least one medicine explicitly requires bedtime administration (e.g., frequency code `HS` or instruction note `before sleep` / `bedtime`).
3. **Bucket Assignment**:
   - Pure function mapping minute of day (0–1439) to the appropriate bucket, respecting whether the bedtime bucket is enabled.
4. **Verification**:
   - Comprehensive unit tests in `src/domain/__tests__/timeBuckets.test.ts` covering boundary minutes, cross-midnight wrapping, and adaptive bedtime activation.
