# Issue 07: Two-Tier Adherence UI & Logging Habit Display

Status: resolved
Type: task
Blocked by: 05, 06

## Summary

Enhance the adherence display in `TodaySchedulePage.tsx` and dashboard cards to present the Two-Tier metric: Daily Logging Streak (patient habit) alongside Clinical Adherence Rate (pharmacological compliance for doctor reporting), with documented skip reasons breakdown.

## Requirements

1. **Daily Logging Streak**:
   - Prominently feature the Daily Logging Streak with streak flame badge, celebrating honest daily engagement.
   - Explain that logging every scheduled dose (including excused clinical skips) keeps the streak alive.
2. **Clinical Adherence Rate**:
   - Display the true clinical intake percentage (`taken / scheduled`).
   - Show documented skip reasons breakdown (e.g. "2 doses held per doctor advice").
3. **Verification**:
   - Verify UI rendering, streak presentation, and calculations across edge cases.
   - Run `npm run verify` (`vitest`, `tsc`, `eslint`).
