# 0003. Dual-Fidelity Diagnostic Archive (Original Documents + Longitudinal Biomarkers)

We decided to preserve all diagnostic lab reports, imaging scans, and pathology notes in their original document format (multi-page PDF or high-resolution images) while simultaneously extracting structured, longitudinal numeric biomarkers into a time-series database.

## Context

Consulting physicians and specialists across any medical discipline do not trust manually entered or AI-transcribed numbers alone without verifying the official hospital letterhead, reference ranges, and pathologist signatures. Conversely, browsing through dozens of raw PDF files makes it impossible to quickly see whether a patient's HbA1c, creatinine, liver enzymes, cardiac markers, or blood counts are rising or falling across a multi-year timeline.

## Decision

1. **Original Document Preservation**: Raw files are preserved in high-resolution multi-page PDF or image format in secure object storage, maintaining the legal authenticity of the clinical record.
2. **Longitudinal Biomarker Extraction**: Key diagnostic values (e.g., HbA1c, Lipid panels, Creatinine, Liver enzymes, Hemoglobin, WBC, Platelets, specific clinical markers) are extracted, normalized, and mapped with test dates and clinical reference ranges.
3. **Dual View Presentation**:
   - The primary report viewer presents the authentic document for clinical verification.
   - The visualizer dashboard charts biomarker trajectories across multiple years, enabling instant pattern detection for physicians.

## Consequences

- Requires a document ingestion pipeline with verification (human-in-the-loop review) to ensure extracted numbers match the original document.
- Storage must handle both binary assets (PDFs/images) and structured relational data.
- Gives consulting doctors both immediate macro-trend analysis and micro-level document verification.
