# Issue 05: Daily Schedule UI: Adaptive 3+1 Buckets, Past Doses Drawer & Meal Badges

Status: resolved
Type: task
Blocked by: none

## Summary

Enhance `TodaySchedulePage.tsx` and `DoseCard.tsx` to render adaptive 3+1 bucket sections, a dedicated "Past / Missed Doses" section for expired bucket items, and prominent contextual meal instruction badges.

## Requirements

1. **Adaptive 3+1 Buckets Rendering**:
   - Render `morning`, `afternoon`, and `night` cards by default.
   - Dynamically render `bedtime` bucket section if and only if `hasBedtime` is true.
2. **Past / Missed Doses Drawer**:
   - Isolate unlogged doses from closed buckets (e.g., afternoon doses when current time >= 17:00) into a dedicated collapsible "Past / Missed Doses" panel.
   - Keep active current/upcoming buckets uncluttered.
3. **Contextual Meal Timing Guidance**:
   - Display prominent meal relation badges on dose cards using the generated guidance (*"Take with or after breakfast"*, *"Take on an empty stomach"*, *"Take after dinner"*).
4. **Verification**:
   - Verify UI components render cleanly without regressions.
   - Run `npx vitest run` and `npx tsc --noEmit`.
