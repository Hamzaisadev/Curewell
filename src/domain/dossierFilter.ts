/**
 * Longitudinal Diagnostic Dossier Filtering & Taxonomy Engine.
 *
 * Provides pure domain models, multi-faceted filtering, and timeline grouping
 * for universal multi-year clinical diagnostic records across all medical conditions.
 */

export const DIAGNOSTIC_CATEGORIES = [
  'bloodwork',
  'imaging',
  'pathology',
  'surgical',
  'notes',
] as const;

export type DiagnosticCategory = (typeof DIAGNOSTIC_CATEGORIES)[number];

export const STANDARD_CLINICAL_CONDITIONS = [
  'Cardiology',
  'Endocrinology',
  'Nephrology',
  'Oncology',
  'Autoimmune',
  'Orthopedics',
  'General Health',
] as const;

export type StandardClinicalCondition = (typeof STANDARD_CLINICAL_CONDITIONS)[number];

/** Flexible condition tag supporting standard specialties or arbitrary clinical condition tags */
export type ClinicalCondition = StandardClinicalCondition | (string & {});

export interface BiomarkerItem {
  id?: string;
  name: string;
  testName?: string;
  canonicalName?: string | null;
  valueText: string;
  valueNumeric?: number | null;
  unit?: string | null;
  referenceRange?: string | null;
  rangeStatus?: 'within' | 'below' | 'above' | 'unknown' | string | null;
}

export interface DiagnosticReportItem {
  id: string;
  profileId: string;
  title: string;
  condition: ClinicalCondition;
  category: DiagnosticCategory;
  testDate: string; // 'YYYY-MM-DD'
  facilityName: string;
  fileUrl: string;
  fileType: 'pdf' | 'image';
  pageCount: number;
  doctorName?: string | null;
  conditionNotes?: string | null;
  notes?: string | null;
  labName?: string | null;
  reportCost?: number | null;
  currency?: string;
  biomarkers?: BiomarkerItem[];
}

export type TimelinePreset =
  | 'All Time'
  | 'Past 12 Months'
  | 'Past 6 Months'
  | 'Past 3 Months'
  | 'Past 30 Days'
  | string;

export interface DossierFilterOptions {
  condition?: ClinicalCondition | ClinicalCondition[] | 'All' | null;
  conditions?: ClinicalCondition[];
  category?: DiagnosticCategory | DiagnosticCategory[] | 'All' | null;
  categories?: DiagnosticCategory[];
  timelinePreset?: TimelinePreset | null;
  preset?: TimelinePreset | null;
  year?: number | string | null;
  years?: (number | string)[];
  startYear?: number | null;
  endYear?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  searchQuery?: string | null;
  search?: string | null;
  query?: string | null;
  referenceDate?: string | Date;
}

export interface TimelineMonthGroup {
  year: number;
  month: number; // 1-12
  monthName: string; // e.g. "October"
  monthLabel: string; // e.g. "October 2026"
  label: string; // e.g. "October 2026"
  reports: DiagnosticReportItem[];
  count: number;
}

export interface TimelineYearGroup {
  year: number;
  yearLabel: string;
  label: string;
  reports: DiagnosticReportItem[];
  count: number;
  months: TimelineMonthGroup[];
}

export interface TimelineGroup {
  year: number;
  yearLabel: string;
  month: number;
  monthName: string;
  monthLabel: string;
  label: string;
  reports: DiagnosticReportItem[];
  count: number;
  months?: TimelineMonthGroup[];
}

export interface FilteredDossierResult {
  reports: DiagnosticReportItem[];
  totalCount: number;
  timelineGroups: TimelineGroup[];
  groups: TimelineGroup[]; // alias for timelineGroups
  yearGroups: TimelineYearGroup[];
  availableConditions: ClinicalCondition[];
  availableCategories: DiagnosticCategory[];
  availableYears: number[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Parses a 'YYYY-MM-DD' date string into a Date anchored at UTC midnight.
 */
function parseDateUtc(dateStr: string): Date | null {
  const parts = dateStr.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) {
    return null;
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/**
 * Formats a Date object to 'YYYY-MM-DD'.
 */
function formatDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Resolves reference date to Date object and 'YYYY-MM-DD' string.
 */
function resolveReferenceDate(ref?: string | Date): { refDate: Date; refDateStr: string } {
  if (ref instanceof Date) {
    return { refDate: ref, refDateStr: formatDateUtc(ref) };
  }
  if (typeof ref === 'string' && ref.trim()) {
    const parsed = parseDateUtc(ref.trim());
    if (parsed) {
      return { refDate: parsed, refDateStr: formatDateUtc(parsed) };
    }
  }
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { refDate: todayUtc, refDateStr: formatDateUtc(todayUtc) };
}

/**
 * Multi-faceted pure filtering function for clinical diagnostic reports.
 * Filters by condition, category, date/year presets, and full-text search.
 */
export function filterDossier(
  reports: DiagnosticReportItem[],
  filter: DossierFilterOptions
): FilteredDossierResult {
  // 1. Normalize Condition Filters
  const conditionList: string[] = [];
  if (filter.condition) {
    if (Array.isArray(filter.condition)) {
      conditionList.push(...filter.condition);
    } else {
      conditionList.push(filter.condition);
    }
  }
  if (filter.conditions && Array.isArray(filter.conditions)) {
    conditionList.push(...filter.conditions);
  }

  const isConditionAll =
    conditionList.length === 0 ||
    conditionList.some((c) => c.trim().toLowerCase() === 'all');
  const activeConditions = isConditionAll
    ? []
    : conditionList.map((c) => c.trim().toLowerCase()).filter(Boolean);

  // 2. Normalize Category Filters
  const categoryList: string[] = [];
  if (filter.category) {
    if (Array.isArray(filter.category)) {
      categoryList.push(...filter.category);
    } else {
      categoryList.push(filter.category);
    }
  }
  if (filter.categories && Array.isArray(filter.categories)) {
    categoryList.push(...filter.categories);
  }

  const isCategoryAll =
    categoryList.length === 0 ||
    categoryList.some((c) => c.trim().toLowerCase() === 'all');
  const activeCategories = isCategoryAll
    ? []
    : categoryList.map((c) => c.trim().toLowerCase()).filter(Boolean);

  // 3. Normalize Date / Timeline Preset Filters
  const presetRaw = (filter.timelinePreset || filter.preset || '').trim();
  const presetLower = presetRaw.toLowerCase();
  const { refDate, refDateStr } = resolveReferenceDate(filter.referenceDate);

  let presetDateFrom: string | null = null;
  let presetDateTo: string | null = null;
  let presetYear: number | null = null;

  if (presetLower && presetLower !== 'all time' && presetLower !== 'all') {
    if (/^\d{4}$/.test(presetRaw)) {
      presetYear = parseInt(presetRaw, 10);
    } else if (presetLower === 'past 12 months' || presetLower === 'past_12_months' || presetLower === 'past year') {
      const past = new Date(refDate.getTime());
      past.setUTCFullYear(past.getUTCFullYear() - 1);
      presetDateFrom = formatDateUtc(past);
      presetDateTo = refDateStr;
    } else if (presetLower === 'past 6 months' || presetLower === 'past_6_months') {
      const past = new Date(refDate.getTime());
      past.setUTCMonth(past.getUTCMonth() - 6);
      presetDateFrom = formatDateUtc(past);
      presetDateTo = refDateStr;
    } else if (presetLower === 'past 3 months' || presetLower === 'past_3_months') {
      const past = new Date(refDate.getTime());
      past.setUTCMonth(past.getUTCMonth() - 3);
      presetDateFrom = formatDateUtc(past);
      presetDateTo = refDateStr;
    } else if (presetLower === 'past 30 days' || presetLower === 'past_30_days' || presetLower === 'past month') {
      const past = new Date(refDate.getTime());
      past.setUTCDate(past.getUTCDate() - 30);
      presetDateFrom = formatDateUtc(past);
      presetDateTo = refDateStr;
    }
  }

  const targetYear = filter.year !== undefined && filter.year !== null ? parseInt(String(filter.year), 10) : presetYear;
  const targetYears = filter.years && filter.years.length > 0 ? filter.years.map((y) => parseInt(String(y), 10)) : null;
  const targetStartYear = filter.startYear !== undefined && filter.startYear !== null ? filter.startYear : null;
  const targetEndYear = filter.endYear !== undefined && filter.endYear !== null ? filter.endYear : null;

  const targetDateFrom = filter.dateFrom || filter.startDate || presetDateFrom;
  const targetDateTo = filter.dateTo || filter.endDate || presetDateTo;

  // 4. Normalize Search Query
  const searchQuery = (filter.searchQuery || filter.search || filter.query || '').trim().toLowerCase();
  const searchTokens = searchQuery ? searchQuery.split(/\s+/).filter(Boolean) : [];

  // Filter loop
  const filtered = reports.filter((report) => {
    // Condition filter
    if (activeConditions.length > 0) {
      const reportCondition = report.condition.trim().toLowerCase();
      const matchesCondition = activeConditions.some((c) => c === reportCondition);
      if (!matchesCondition) return false;
    }

    // Category filter
    if (activeCategories.length > 0) {
      const reportCategory = report.category.trim().toLowerCase();
      const matchesCategory = activeCategories.some((c) => c === reportCategory);
      if (!matchesCategory) return false;
    }

    // Date / Year filters
    const reportDateStr = report.testDate;
    const reportYear = parseInt(reportDateStr.slice(0, 4), 10);

    if (targetYear !== null && !isNaN(targetYear) && reportYear !== targetYear) {
      return false;
    }

    if (targetYears !== null && !targetYears.includes(reportYear)) {
      return false;
    }

    if (targetStartYear !== null && reportYear < targetStartYear) {
      return false;
    }

    if (targetEndYear !== null && reportYear > targetEndYear) {
      return false;
    }

    if (targetDateFrom && reportDateStr < targetDateFrom) {
      return false;
    }

    if (targetDateTo && reportDateStr > targetDateTo) {
      return false;
    }

    // Search query filter
    if (searchQuery && searchTokens.length > 0) {
      const biomarkerTokens = report.biomarkers
        ? report.biomarkers.flatMap((b) => [b.name, b.testName, b.canonicalName, b.valueText])
        : [];

      const searchHaystack: string[] = [
        report.title,
        report.facilityName,
        report.doctorName ?? '',
        report.conditionNotes ?? '',
        report.notes ?? '',
        report.condition,
        report.category,
        report.labName ?? '',
        ...biomarkerTokens.filter((t): t is string => typeof t === 'string'),
      ]
        .map((s) => s.toLowerCase())
        .filter(Boolean);

      const matchesEntire = searchHaystack.some((field) => field.includes(searchQuery));
      const matchesAllTokens = searchTokens.every((token) =>
        searchHaystack.some((field) => field.includes(token))
      );

      if (!matchesEntire && !matchesAllTokens) {
        return false;
      }
    }

    return true;
  });

  // Sort descending by testDate, then by id
  filtered.sort((a, b) => b.testDate.localeCompare(a.testDate) || b.id.localeCompare(a.id));

  // Timeline grouping
  const timelineGroups = groupReportsByTimeline(filtered);
  const yearGroups = groupReportsByYear(filtered);

  // Available metadata for quick faceted navigation
  const availableConditions = Array.from(new Set(reports.map((r) => r.condition))).sort();
  const availableCategories = Array.from(new Set(reports.map((r) => r.category))).sort();
  const availableYears = Array.from(
    new Set(
      reports
        .map((r) => parseInt(r.testDate.slice(0, 4), 10))
        .filter((y) => !isNaN(y) && y > 0)
    )
  ).sort((a, b) => b - a);

  return {
    reports: filtered,
    totalCount: filtered.length,
    timelineGroups,
    groups: timelineGroups,
    yearGroups,
    availableConditions,
    availableCategories,
    availableYears,
  };
}

/**
 * Groups diagnostic reports chronologically by Year and Month (descending)
 * for longitudinal browsing.
 */
export function groupReportsByTimeline(reports: DiagnosticReportItem[]): TimelineGroup[] {
  const groupsMap = new Map<string, { year: number; month: number; reports: DiagnosticReportItem[] }>();

  // Ensure deterministic descending chronological sort
  const sortedReports = [...reports].sort(
    (a, b) => b.testDate.localeCompare(a.testDate) || b.id.localeCompare(a.id)
  );

  for (const report of sortedReports) {
    const parts = report.testDate.split('-');
    const year = parseInt(parts[0] || '0', 10);
    const month = parseInt(parts[1] || '1', 10);
    const key = `${year}-${String(month).padStart(2, '0')}`;

    const existing = groupsMap.get(key);
    if (existing) {
      existing.reports.push(report);
    } else {
      groupsMap.set(key, { year, month, reports: [report] });
    }
  }

  // Sorted keys descending: '2026-10', '2026-08', '2025-12', etc.
  const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => {
    const group = groupsMap.get(key)!;
    const monthName = MONTH_NAMES[group.month - 1] ?? 'Unknown';
    const monthLabel = `${monthName} ${group.year}`;
    return {
      year: group.year,
      yearLabel: String(group.year),
      month: group.month,
      monthName,
      monthLabel,
      label: monthLabel,
      reports: group.reports,
      count: group.reports.length,
    };
  });
}

/**
 * Groups diagnostic reports into hierarchical multi-year and month buckets.
 */
export function groupReportsByYear(reports: DiagnosticReportItem[]): TimelineYearGroup[] {
  const monthGroups = groupReportsByTimeline(reports);
  const yearMap = new Map<
    number,
    { year: number; reports: DiagnosticReportItem[]; months: TimelineMonthGroup[] }
  >();

  for (const mg of monthGroups) {
    const existing = yearMap.get(mg.year);
    if (existing) {
      existing.reports.push(...mg.reports);
      existing.months.push(mg);
    } else {
      yearMap.set(mg.year, {
        year: mg.year,
        reports: [...mg.reports],
        months: [mg],
      });
    }
  }

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

  return sortedYears.map((year) => {
    const yg = yearMap.get(year)!;
    return {
      year: yg.year,
      yearLabel: String(yg.year),
      label: String(yg.year),
      reports: yg.reports,
      count: yg.reports.length,
      months: yg.months,
    };
  });
}
