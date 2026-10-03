# 0005. Unified Reactive Dashboard Cache & Invalidation

We decided to migrate the multi-tile clinical dashboard from disparate, uncoordinated component-level `useEffect` fetches to a unified query architecture using TanStack React Query with hierarchical keys and synchronized cache invalidation on clinical mutations.

## Context

The Curewell dashboard comprises over 16 interrelated clinical bento tiles (Medication Schedule, Medicine Cabinet, Adherence & Habits, Blood Pressure, Blood Glucose, Active Prescriptions, Recent Consultations, Lab Biomarkers, etc.). Previously, each tile initiated independent asynchronous fetching on mount. This produced:
1. Significant query duplication (e.g., `medicinesRepo.listMedicines` was called three times simultaneously by separate tiles).
2. Fractured mutation consistency: logging a scheduled dose in the `MedicationScheduleCard` locally updated that card's state, but left `AdherenceHabitsCard` (daily percentage and streak) and `CabinetSummaryCard` (inventory pill counts) stale until a full page reload.

## Decision

1. **Hierarchical Query Keys**: Standardize clinical query keys by domain scope:
   - `['medicines', profileId]`
   - `['doses', profileId, dateRange]`
   - `['vitals', profileId, 'bp' | 'glucose']`
   - `['reports', profileId]`
   - `['visits', profileId]`
2. **Synchronized Invalidation on Clinical Action**: Any dose logging mutation (`recordDoseAction`) invalidates `['doses', profileId]` and `['medicines', profileId]`, immediately triggering simultaneous, non-blocking background re-renders across the schedule, adherence gauge, and cabinet tiles.
3. **Pure Domain Derivation**: Tiles consume raw query data and compute metrics through pure functions (e.g., `calculateAdherence` from `domain/adherence.ts` and `evaluateAchievements` from `domain/achievements.ts`), ensuring mathematical and clinical consistency.

## Consequences

- Completely eliminates UI state desynchronization across dashboard tiles.
- Reduces database load and IndexedDB reads by sharing deduplicated query caches across sibling cards.
- Provides standard loading, error, and stale-while-revalidate lifecycle management out of the box.
