# Issue 09: Longitudinal Diagnostic Dossier Vault UI

Status: ready-for-agent
Type: task
Blocked by: 08

## Summary

Build the responsive, clinical-grade Diagnostic Reports Vault UI (`src/pages/reports/ReportsVaultPage.tsx`), integrating `src/domain/dossierFilter.ts` with multi-faceted filtering (Condition / Health Area, Diagnostic Category, Multi-Year Timeline), fast search, and inline multi-page scan/PDF previews.

## Requirements

1. **Header & Navigation**:
   - Title: "Clinical Dossier & Diagnostic Archive".
   - Subtitle: "Longitudinal health records spanning all conditions, diagnostics, and years."
   - Quick action: "Upload New Report" modal trigger.
   - Quick action: "Share Scoped Dossier with Doctor" trigger.
2. **Multi-Faceted Filter Controls**:
   - **Condition Chips**: All, Cardiology, Oncology, Endocrinology, Nephrology, Autoimmune, General, etc.
   - **Category Segmented Controls / Tabs**: All Types, Bloodwork / Labs, Imaging / Scans, Biopsy / Pathology, Surgical / Notes.
   - **Timeline Dropdown**: All Time, 2025, 2024, 2023, 2022, Past 12 Months.
   - **Search Input**: Live full-text search by test name, hospital/lab, or notes.
3. **Timeline Grouped View**:
   - Renders reports grouped by Year and Month using `groupReportsByTimeline`.
   - Each report card shows:
     - Test title, facility/lab name, test date.
     - Category badge and condition tag badge.
     - Multi-page indicator (e.g. "3 pages · PDF").
     - Quick "View Report" button (opens inline preview modal).
     - "Download" button.
4. **Verification**:
   - Write/update tests in `src/pages/reports/__tests__/ReportsVaultPage.test.tsx`.
   - Run `npx vitest run src/pages/reports/__tests__/ReportsVaultPage.test.tsx`.
   - Run `npx tsc --noEmit`.
   - Run `npx eslint`.
   - Mark Issue 09 resolved.
