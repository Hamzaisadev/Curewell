# Issue 08: Longitudinal Diagnostic Dossier Filtering & Taxonomy Engine

Status: resolved
Type: task
Blocked by: none

## Summary

Build the pure domain filtering and taxonomy engine for the Longitudinal Clinical Dossier (`src/domain/dossierFilter.ts`), supporting universal multi-year health records across any medical condition.

## Requirements

1. **Taxonomy & Metadata**:
   - `ClinicalCondition`: flexible condition tags (e.g., "Cardiology", "Endocrinology", "Nephrology", "Oncology", "Autoimmune", "Orthopedics", "General Health").
   - `DiagnosticCategory`: `'bloodwork'` | `'imaging'` | `'pathology'` | `'surgical'` | `'notes'`.
   - `DiagnosticReportItem`: `id`, `profileId`, `title`, `condition`, `category`, `testDate` ('YYYY-MM-DD'), `facilityName`, `fileUrl`, `fileType` ('pdf' | 'image'), `pageCount`, `biomarkers?: BiomarkerItem[]`.
2. **Multi-Faceted Pure Filtering**:
   - `filterDossier(reports: DiagnosticReportItem[], filter: DossierFilterOptions): FilteredDossierResult`
     - Filters by condition (single or multi-select, with "All" option).
     - Filters by diagnostic category.
     - Filters by Year range or predefined timeline presets ("All Time", "2024", "2023", "Past 12 Months", etc.).
     - Text search across title, facility name, doctor name, and condition notes.
3. **Timeline Grouping**:
   - `groupReportsByTimeline(reports: DiagnosticReportItem[]): TimelineGroup[]`
     - Groups chronologically by Year and Month for seamless longitudinal browsing.
4. **Verification**:
   - Comprehensive unit tests in `src/domain/__tests__/dossierFilter.test.ts`.
   - Run `npx vitest run src/domain/__tests__/dossierFilter.test.ts`.
   - Run `npx tsc --noEmit`.
