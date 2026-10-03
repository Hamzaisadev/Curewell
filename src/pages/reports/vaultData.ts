import type { DiagnosticReportItem, DiagnosticCategory, ClinicalCondition } from '../../domain/dossierFilter';
import type { Tables } from '../../lib/supabase/types';

export const SAMPLE_VAULT_REPORTS: DiagnosticReportItem[] = [
  {
    id: 'rep-01',
    profileId: 'patient-01',
    title: 'Comprehensive Lipid Profile & Liver Panel',
    condition: 'Cardiology',
    category: 'bloodwork',
    testDate: '2026-10-01',
    facilityName: 'Aga Khan University Hospital',
    fileUrl: '/storage/rep-01.pdf',
    fileType: 'pdf',
    pageCount: 3,
    doctorName: 'Dr. Tariq Siddiqui',
    conditionNotes: 'Routine post-stent cardiac evaluation and statin monitoring',
    biomarkers: [
      { name: 'Total Cholesterol', valueText: '215', unit: 'mg/dL', referenceRange: '125 - 200', rangeStatus: 'above' },
      { name: 'HDL Cholesterol', valueText: '42', unit: 'mg/dL', referenceRange: '40 - 60', rangeStatus: 'within' },
      { name: 'LDL Cholesterol', valueText: '145', unit: 'mg/dL', referenceRange: '< 100', rangeStatus: 'above' },
      { name: 'Triglycerides', valueText: '160', unit: 'mg/dL', referenceRange: '< 150', rangeStatus: 'above' },
      { name: 'SGPT / ALT', valueText: '34', unit: 'U/L', referenceRange: '7 - 56', rangeStatus: 'within' },
    ],
  },
  {
    id: 'rep-02',
    profileId: 'patient-01',
    title: 'Echocardiogram 2D Color Doppler',
    condition: 'Cardiology',
    category: 'imaging',
    testDate: '2026-08-15',
    facilityName: 'National Institute of Cardiovascular Diseases (NICVD)',
    fileUrl: '/storage/rep-02.pdf',
    fileType: 'pdf',
    pageCount: 2,
    doctorName: 'Dr. Tariq Siddiqui',
    conditionNotes: 'Mild concentric LV hypertrophy, Ejection Fraction 60%, no regional wall motion abnormalities',
  },
  {
    id: 'rep-03',
    profileId: 'patient-01',
    title: 'HbA1c & Fasting Plasma Glucose',
    condition: 'Endocrinology',
    category: 'bloodwork',
    testDate: '2026-08-01',
    facilityName: 'Chughtai Healthcare Lab',
    fileUrl: '/storage/rep-03.pdf',
    fileType: 'pdf',
    pageCount: 1,
    doctorName: 'Dr. Ayesha Malik',
    conditionNotes: 'Quarterly diabetic follow-up and glycemic control monitoring',
    biomarkers: [
      { name: 'HbA1c', valueText: '7.1', unit: '%', referenceRange: '4.0 - 5.6', rangeStatus: 'above' },
      { name: 'Fasting Blood Glucose', valueText: '138', unit: 'mg/dL', referenceRange: '70 - 99', rangeStatus: 'above' },
    ],
  },
  {
    id: 'rep-04',
    profileId: 'patient-01',
    title: 'Renal Function Panel & Serum Creatinine',
    condition: 'Nephrology',
    category: 'bloodwork',
    testDate: '2025-11-20',
    facilityName: 'Sindh Institute of Urology & Transplantation (SIUT)',
    fileUrl: '/storage/rep-04.pdf',
    fileType: 'pdf',
    pageCount: 2,
    doctorName: 'Dr. Farhan Qureshi',
    conditionNotes: 'eGFR and serum electrolyte monitoring on ACE inhibitor therapy',
    biomarkers: [
      { name: 'Serum Creatinine', valueText: '1.2', unit: 'mg/dL', referenceRange: '0.7 - 1.3', rangeStatus: 'within' },
      { name: 'Blood Urea Nitrogen', valueText: '18', unit: 'mg/dL', referenceRange: '7 - 20', rangeStatus: 'within' },
      { name: 'eGFR', valueText: '68', unit: 'mL/min/1.73m2', referenceRange: '> 60', rangeStatus: 'within' },
      { name: 'Serum Potassium', valueText: '4.6', unit: 'mEq/L', referenceRange: '3.5 - 5.0', rangeStatus: 'within' },
    ],
  },
  {
    id: 'rep-05',
    profileId: 'patient-01',
    title: 'Contrast-Enhanced Chest CT Scan',
    condition: 'Oncology',
    category: 'imaging',
    testDate: '2025-05-10',
    facilityName: 'Shaukat Khanum Memorial Cancer Hospital',
    fileUrl: '/storage/rep-05.pdf',
    fileType: 'pdf',
    pageCount: 5,
    doctorName: 'Dr. Haris Mehmood',
    conditionNotes: 'Surveillance imaging post-nodule observation. Stable appearance; no suspicious lymphadenopathy',
  },
  {
    id: 'rep-06',
    profileId: 'patient-01',
    title: 'Endometrial Biopsy Histopathology',
    condition: 'General Health',
    category: 'pathology',
    testDate: '2024-03-12',
    facilityName: 'Excel Diagnostic Services',
    fileUrl: '/storage/rep-06.pdf',
    fileType: 'pdf',
    pageCount: 1,
    doctorName: 'Dr. Nida Fatima',
    conditionNotes: 'Benign secretory endometrium confirmed. No hyperplasia or atypia noted',
    notes: 'Microscopic examination reveals uniform tubular glands in secretory phase',
  },
  {
    id: 'rep-07',
    profileId: 'patient-01',
    title: 'Coronary Angiography Procedure Notes',
    condition: 'Cardiology',
    category: 'surgical',
    testDate: '2023-09-04',
    facilityName: 'Tabba Heart Institute',
    fileUrl: '/storage/rep-07.pdf',
    fileType: 'pdf',
    pageCount: 4,
    doctorName: 'Dr. Tariq Siddiqui',
    notes: 'Single drug-eluting stent (DES) placed in mid-LAD with TIMI 3 flow restored',
  },
  {
    id: 'rep-08',
    profileId: 'patient-01',
    title: 'Discharge Summary & Clinical Post-Op Instructions',
    condition: 'Orthopedics',
    category: 'notes',
    testDate: '2023-01-18',
    facilityName: 'South City Hospital',
    fileUrl: '/storage/rep-08.pdf',
    fileType: 'pdf',
    pageCount: 3,
    doctorName: 'Dr. Asad Raza',
    notes: 'Right knee arthroscopic partial meniscectomy completed without intraoperative complications',
  },
  {
    id: 'rep-09',
    profileId: 'patient-01',
    title: 'Autoimmune Antinuclear Antibody (ANA) Profile',
    condition: 'Autoimmune',
    category: 'bloodwork',
    testDate: '2022-02-14',
    facilityName: 'Liaquat National Hospital',
    fileUrl: '/storage/rep-09.pdf',
    fileType: 'pdf',
    pageCount: 2,
    doctorName: 'Dr. Samina Khan',
    conditionNotes: 'Investigation for joint arthralgia and fatigue',
    biomarkers: [
      { name: 'ANA IFA Screen', valueText: 'Negative (<1:40)', unit: 'titer', rangeStatus: 'within' },
      { name: 'Anti-dsDNA', valueText: '12', unit: 'IU/mL', referenceRange: '< 25', rangeStatus: 'within' },
      { name: 'Rheumatoid Factor', valueText: '9.4', unit: 'IU/mL', referenceRange: '< 14', rangeStatus: 'within' },
    ],
  },
  {
    id: 'rep-10',
    profileId: 'patient-01',
    title: 'Laparoscopic Cholecystectomy Post-Op Summary',
    condition: 'General Health',
    category: 'surgical',
    testDate: '2021-08-05',
    facilityName: 'South City Hospital',
    fileUrl: '/storage/rep-10.pdf',
    fileType: 'pdf',
    pageCount: 3,
    doctorName: 'Dr. Bilal Ahmed',
    notes: 'Elective 4-port laparoscopic cholecystectomy for symptomatic cholelithiasis. Uneventful recovery',
  },
];

/**
 * Infers clinical condition specialty from report title and notes.
 */
export function inferClinicalCondition(title: string, notes?: string | null): ClinicalCondition {
  const text = `${title} ${notes || ''}`.toLowerCase();
  if (text.includes('cardio') || text.includes('lipid') || text.includes('cholesterol') || text.includes('echo') || text.includes('heart') || text.includes('stent') || text.includes('angio')) {
    return 'Cardiology';
  }
  if (text.includes('glucose') || text.includes('hba1c') || text.includes('diabet') || text.includes('thyroid') || text.includes('tsh') || text.includes('endocrine')) {
    return 'Endocrinology';
  }
  if (text.includes('renal') || text.includes('kidney') || text.includes('creatinine') || text.includes('egfr') || text.includes('bun') || text.includes('nephro')) {
    return 'Nephrology';
  }
  if (text.includes('cancer') || text.includes('onco') || text.includes('tumor') || text.includes('chemo') || text.includes('nodule')) {
    return 'Oncology';
  }
  if (text.includes('ana') || text.includes('autoimmune') || text.includes('lupus') || text.includes('rheum') || text.includes('arthriti')) {
    return 'Autoimmune';
  }
  if (text.includes('ortho') || text.includes('bone') || text.includes('joint') || text.includes('knee') || text.includes('spine') || text.includes('fracture')) {
    return 'Orthopedics';
  }
  return 'General Health';
}

/**
 * Infers diagnostic category from report title, source type, and notes.
 */
export function inferDiagnosticCategory(title: string, _sourceType?: string | null, notes?: string | null): DiagnosticCategory {
  void _sourceType;
  const text = `${title} ${notes || ''}`.toLowerCase();
  if (text.includes('scan') || text.includes('ct') || text.includes('mri') || text.includes('x-ray') || text.includes('echo') || text.includes('ultrasound') || text.includes('radiology')) {
    return 'imaging';
  }
  if (text.includes('biopsy') || text.includes('patho') || text.includes('histol') || text.includes('cytology')) {
    return 'pathology';
  }
  if (text.includes('surgical') || text.includes('surgery') || text.includes('op notes') || text.includes('operation') || text.includes('procedure')) {
    return 'surgical';
  }
  if (text.includes('summary') || text.includes('discharge') || text.includes('notes') || text.includes('consultation')) {
    return 'notes';
  }
  return 'bloodwork';
}

/**
 * Converts a database Report record into a domain DiagnosticReportItem.
 */
export function mapDbReportToDiagnosticItem(
  dbReport: Tables<'reports'>,
  results?: Tables<'report_results'>[]
): DiagnosticReportItem {
  const condition = inferClinicalCondition(dbReport.title, dbReport.notes);
  const category = inferDiagnosticCategory(dbReport.title, dbReport.source_type, dbReport.notes);
  const fileType = dbReport.source_type === 'image' ? 'image' : 'pdf';

  return {
    id: dbReport.id,
    profileId: dbReport.profile_id,
    title: dbReport.title,
    condition,
    category,
    testDate: dbReport.report_date,
    facilityName: dbReport.lab_name || 'Diagnostic Facility',
    fileUrl: `/storage/${dbReport.id}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`,
    fileType,
    pageCount: 1,
    doctorName: null,
    notes: dbReport.notes,
    labName: dbReport.lab_name,
    reportCost: dbReport.report_cost,
    currency: dbReport.currency,
    biomarkers: (results || []).map((r) => ({
      name: r.test_name,
      valueText: r.value_text,
      valueNumeric: r.value_numeric,
      unit: r.unit,
      referenceRange: r.reference_range,
      rangeStatus: r.range_status,
    })),
  };
}
