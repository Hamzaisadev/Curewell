import { describe, it, expect } from 'vitest';
import {
  filterDossier,
  groupReportsByTimeline,
  groupReportsByYear,
  type DiagnosticReportItem,
  type DossierFilterOptions,
} from '../dossierFilter';

describe('dossierFilter domain engine', () => {
  const sampleReports: DiagnosticReportItem[] = [
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
      conditionNotes: 'Routine post-stent cardiac evaluation',
      biomarkers: [
        { name: 'Total Cholesterol', valueText: '215', unit: 'mg/dL', rangeStatus: 'above' },
        { name: 'HDL', valueText: '42', unit: 'mg/dL', rangeStatus: 'within' },
        { name: 'LDL', valueText: '145', unit: 'mg/dL', rangeStatus: 'above' },
      ],
    },
    {
      id: 'rep-02',
      profileId: 'patient-01',
      title: 'Echocardiogram 2D Doppler',
      condition: 'Cardiology',
      category: 'imaging',
      testDate: '2026-08-15',
      facilityName: 'National Institute of Cardiovascular Diseases',
      fileUrl: '/storage/rep-02.pdf',
      fileType: 'pdf',
      pageCount: 2,
      doctorName: 'Dr. Tariq Siddiqui',
      conditionNotes: 'Mild LV hypertrophy noted',
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
      conditionNotes: 'Quarterly diabetic follow-up',
      biomarkers: [
        { name: 'HbA1c', valueText: '7.1', unit: '%', rangeStatus: 'above' },
        { name: 'Fasting Blood Glucose', valueText: '138', unit: 'mg/dL', rangeStatus: 'above' },
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
      conditionNotes: 'eGFR monitoring on ACE inhibitors',
      biomarkers: [
        { name: 'Serum Creatinine', valueText: '1.2', unit: 'mg/dL', rangeStatus: 'within' },
        { name: 'eGFR', valueText: '68', unit: 'mL/min/1.73m2', rangeStatus: 'within' },
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
      conditionNotes: 'Surveillance imaging post nodule observation',
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
      conditionNotes: 'Benign secretory tissue confirmed',
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
      notes: 'Drug-eluting stent placed in proximal LAD',
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
      notes: 'Arthroscopic meniscectomy completed without complications',
    },
  ];

  describe('Taxonomy and Faceted Filtering', () => {
    it('returns all reports when no filter is provided or when condition and category are "All"', () => {
      const res1 = filterDossier(sampleReports, {});
      expect(res1.reports).toHaveLength(sampleReports.length);
      expect(res1.totalCount).toBe(sampleReports.length);

      const res2 = filterDossier(sampleReports, { condition: 'All', category: 'All' });
      expect(res2.reports).toHaveLength(sampleReports.length);
    });

    it('filters by a single clinical condition', () => {
      const res = filterDossier(sampleReports, { condition: 'Cardiology' });
      expect(res.reports).toHaveLength(3);
      expect(res.reports.every((r) => r.condition === 'Cardiology')).toBe(true);
    });

    it('filters by condition in case-insensitive manner', () => {
      const res = filterDossier(sampleReports, { condition: 'endocrinology' });
      expect(res.reports).toHaveLength(1);
      expect(res.reports[0]?.id).toBe('rep-03');
    });

    it('filters by multiple clinical conditions simultaneously (OR logic)', () => {
      const res = filterDossier(sampleReports, {
        conditions: ['Cardiology', 'Nephrology'],
      });
      expect(res.reports).toHaveLength(4);
      const conditions = new Set(res.reports.map((r) => r.condition));
      expect(conditions.has('Cardiology')).toBe(true);
      expect(conditions.has('Nephrology')).toBe(true);
      expect(conditions.has('Endocrinology')).toBe(false);
    });

    it('filters by single diagnostic category', () => {
      const resBloodwork = filterDossier(sampleReports, { category: 'bloodwork' });
      expect(resBloodwork.reports).toHaveLength(3);
      expect(resBloodwork.reports.every((r) => r.category === 'bloodwork')).toBe(true);

      const resImaging = filterDossier(sampleReports, { category: 'imaging' });
      expect(resImaging.reports).toHaveLength(2);
      expect(resImaging.reports.every((r) => r.category === 'imaging')).toBe(true);
    });

    it('filters by multiple diagnostic categories', () => {
      const res = filterDossier(sampleReports, {
        categories: ['surgical', 'notes'],
      });
      expect(res.reports).toHaveLength(2);
      const ids = res.reports.map((r) => r.id);
      expect(ids).toContain('rep-07');
      expect(ids).toContain('rep-08');
    });

    it('returns empty array when condition or category has no match', () => {
      const res = filterDossier(sampleReports, { condition: 'Autoimmune' });
      expect(res.reports).toHaveLength(0);
      expect(res.totalCount).toBe(0);
      expect(res.timelineGroups).toHaveLength(0);
    });
  });

  describe('Timeline and Year Range Filtering', () => {
    it('filters by single year via filter.year', () => {
      const res2026 = filterDossier(sampleReports, { year: 2026 });
      expect(res2026.reports).toHaveLength(3);
      expect(res2026.reports.every((r) => r.testDate.startsWith('2026'))).toBe(true);

      const res2025 = filterDossier(sampleReports, { year: '2025' });
      expect(res2025.reports).toHaveLength(2);
      expect(res2025.reports.every((r) => r.testDate.startsWith('2025'))).toBe(true);
    });

    it('filters by 4-digit timeline preset string', () => {
      const res = filterDossier(sampleReports, { timelinePreset: '2023' });
      expect(res.reports).toHaveLength(2);
      expect(res.reports.every((r) => r.testDate.startsWith('2023'))).toBe(true);
    });

    it('filters by multiple years via filter.years', () => {
      const res = filterDossier(sampleReports, { years: [2024, 2025] });
      expect(res.reports).toHaveLength(3);
      const years = new Set(res.reports.map((r) => r.testDate.slice(0, 4)));
      expect(years.has('2024')).toBe(true);
      expect(years.has('2025')).toBe(true);
      expect(years.has('2026')).toBe(false);
    });

    it('filters by startYear and endYear range', () => {
      const res = filterDossier(sampleReports, { startYear: 2024, endYear: 2025 });
      expect(res.reports).toHaveLength(3);
      const ids = res.reports.map((r) => r.id);
      expect(ids).toEqual(['rep-04', 'rep-05', 'rep-06']);
    });

    it('filters by dateFrom and dateTo exact range', () => {
      const res = filterDossier(sampleReports, {
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
      });
      expect(res.reports).toHaveLength(2);
      const ids = res.reports.map((r) => r.id);
      expect(ids).toContain('rep-02');
      expect(ids).toContain('rep-03');
    });

    it('filters by relative preset "Past 12 Months" with deterministic referenceDate', () => {
      // Reference date: 2026-10-02 -> Past 12 Months: 2025-10-02 to 2026-10-02
      const res = filterDossier(sampleReports, {
        timelinePreset: 'Past 12 Months',
        referenceDate: '2026-10-02',
      });
      // Expected in window: rep-01 (2026-10-01), rep-02 (2026-08-15), rep-03 (2026-08-01), rep-04 (2025-11-20)
      expect(res.reports).toHaveLength(4);
      const ids = res.reports.map((r) => r.id);
      expect(ids).toEqual(['rep-01', 'rep-02', 'rep-03', 'rep-04']);
    });

    it('filters by relative preset "Past 6 Months" with deterministic referenceDate', () => {
      // Reference date: 2026-10-02 -> Past 6 Months: 2026-04-02 to 2026-10-02
      const res = filterDossier(sampleReports, {
        timelinePreset: 'Past 6 Months',
        referenceDate: '2026-10-02',
      });
      expect(res.reports).toHaveLength(3);
      const ids = res.reports.map((r) => r.id);
      expect(ids).toEqual(['rep-01', 'rep-02', 'rep-03']);
    });

    it('filters by relative preset "Past 30 Days" with deterministic referenceDate', () => {
      const res = filterDossier(sampleReports, {
        timelinePreset: 'Past 30 Days',
        referenceDate: '2026-10-02',
      });
      // 30 days prior is ~2026-09-02. Only rep-01 (2026-10-01) falls in this window
      expect(res.reports).toHaveLength(1);
      expect(res.reports[0]?.id).toBe('rep-01');
    });
  });

  describe('Full-Text Search Matching', () => {
    it('matches query in title', () => {
      const res = filterDossier(sampleReports, { searchQuery: 'echocardiogram' });
      expect(res.reports).toHaveLength(1);
      expect(res.reports[0]?.id).toBe('rep-02');
    });

    it('matches query in facility name', () => {
      const res = filterDossier(sampleReports, { searchQuery: 'Aga Khan' });
      expect(res.reports).toHaveLength(1);
      expect(res.reports[0]?.id).toBe('rep-01');
    });

    it('matches query in doctor name', () => {
      const res = filterDossier(sampleReports, { searchQuery: 'Dr. Tariq Siddiqui' });
      expect(res.reports).toHaveLength(3);
      const ids = res.reports.map((r) => r.id);
      expect(ids).toContain('rep-01');
      expect(ids).toContain('rep-02');
      expect(ids).toContain('rep-07');
    });

    it('matches query in conditionNotes or notes', () => {
      const res1 = filterDossier(sampleReports, { searchQuery: 'LV hypertrophy' });
      expect(res1.reports).toHaveLength(1);
      expect(res1.reports[0]?.id).toBe('rep-02');

      const res2 = filterDossier(sampleReports, { searchQuery: 'meniscectomy' });
      expect(res2.reports).toHaveLength(1);
      expect(res2.reports[0]?.id).toBe('rep-08');
    });

    it('matches query inside extracted biomarkers', () => {
      const res1 = filterDossier(sampleReports, { searchQuery: 'HbA1c' });
      expect(res1.reports).toHaveLength(1);
      expect(res1.reports[0]?.id).toBe('rep-03');

      const res2 = filterDossier(sampleReports, { searchQuery: 'Creatinine' });
      expect(res2.reports).toHaveLength(1);
      expect(res2.reports[0]?.id).toBe('rep-04');
    });

    it('matches multi-token query across distinct fields', () => {
      // "Chughtai Glucose" -> Chughtai is facility, Glucose is in title/biomarkers
      const res = filterDossier(sampleReports, { searchQuery: 'Chughtai Glucose' });
      expect(res.reports).toHaveLength(1);
      expect(res.reports[0]?.id).toBe('rep-03');
    });

    it('returns empty when search does not match any report', () => {
      const res = filterDossier(sampleReports, { searchQuery: 'Dermatology Biopsy Nonexistent' });
      expect(res.reports).toHaveLength(0);
      expect(res.totalCount).toBe(0);
    });
  });

  describe('Multi-Faceted Compound Filtering', () => {
    it('combines condition, category, year, and search simultaneously', () => {
      const filter: DossierFilterOptions = {
        condition: 'Cardiology',
        category: 'bloodwork',
        year: 2026,
        searchQuery: 'Lipid',
      };
      const res = filterDossier(sampleReports, filter);
      expect(res.reports).toHaveLength(1);
      expect(res.reports[0]?.id).toBe('rep-01');
    });

    it('correctly provides metadata: availableConditions, availableCategories, and availableYears', () => {
      const res = filterDossier(sampleReports, { condition: 'Cardiology' });
      expect(res.availableConditions).toContain('Cardiology');
      expect(res.availableConditions).toContain('Endocrinology');
      expect(res.availableCategories).toContain('bloodwork');
      expect(res.availableCategories).toContain('imaging');
      expect(res.availableYears).toEqual([2026, 2025, 2024, 2023]);
    });
  });

  describe('Timeline Grouping Engine', () => {
    it('groups reports chronologically by Year and Month in descending order', () => {
      const groups = groupReportsByTimeline(sampleReports);

      // Expected chronological groups:
      // 1. 2026-10 (rep-01)
      // 2. 2026-08 (rep-02, rep-03)
      // 3. 2025-11 (rep-04)
      // 4. 2025-05 (rep-05)
      // 5. 2024-03 (rep-06)
      // 6. 2023-09 (rep-07)
      // 7. 2023-01 (rep-08)
      expect(groups).toHaveLength(7);

      expect(groups[0]?.year).toBe(2026);
      expect(groups[0]?.month).toBe(10);
      expect(groups[0]?.monthName).toBe('October');
      expect(groups[0]?.monthLabel).toBe('October 2026');
      expect(groups[0]?.count).toBe(1);
      expect(groups[0]?.reports[0]?.id).toBe('rep-01');

      // Second group has 2 reports in August 2026
      expect(groups[1]?.year).toBe(2026);
      expect(groups[1]?.month).toBe(8);
      expect(groups[1]?.monthLabel).toBe('August 2026');
      expect(groups[1]?.count).toBe(2);
      expect(groups[1]?.reports.map((r) => r.id)).toEqual(['rep-02', 'rep-03']);

      // Oldest group
      const lastGroup = groups[groups.length - 1];
      expect(lastGroup?.year).toBe(2023);
      expect(lastGroup?.month).toBe(1);
      expect(lastGroup?.monthLabel).toBe('January 2023');
      expect(lastGroup?.reports[0]?.id).toBe('rep-08');
    });

    it('returns empty array when reports list is empty', () => {
      const groups = groupReportsByTimeline([]);
      expect(groups).toEqual([]);
    });

    it('hierarchically groups reports by year via groupReportsByYear', () => {
      const yearGroups = groupReportsByYear(sampleReports);

      expect(yearGroups).toHaveLength(4);
      expect(yearGroups.map((yg) => yg.year)).toEqual([2026, 2025, 2024, 2023]);

      const yg2026 = yearGroups[0]!;
      expect(yg2026.year).toBe(2026);
      expect(yg2026.count).toBe(3);
      expect(yg2026.months).toHaveLength(2); // October and August
      expect(yg2026.months[0]?.monthLabel).toBe('October 2026');
      expect(yg2026.months[1]?.monthLabel).toBe('August 2026');
    });
  });
});
