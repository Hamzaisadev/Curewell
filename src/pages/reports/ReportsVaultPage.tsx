import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input, controlStyles } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Disclaimer } from '../../components/ui/Disclaimer';
import {
  LabFlaskIcon,
  SearchIcon,
  XIcon,
  CalendarIcon,
  EyeIcon,
  DownloadIcon,
  UploadIcon,
  ShareIcon,
  FileTextIcon,
  ImageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  StethoscopeIcon,
  ActivityIcon,
} from '../../components/ui/icons';
import { reportsRepo } from '../../lib/db';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  filterDossier,
  type DiagnosticReportItem,
  type DiagnosticCategory,
  type ClinicalCondition,
  type DossierFilterOptions,
} from '../../domain/dossierFilter';
import { SAMPLE_VAULT_REPORTS, mapDbReportToDiagnosticItem } from './vaultData';
import { REPORT_OUT_OF_RANGE_NOTE } from '../../lib/disclaimer';
import { clsx } from 'clsx';

export interface ReportsVaultPageProps {
  initialReports?: DiagnosticReportItem[];
}

export function ReportsVaultPage({ initialReports }: ReportsVaultPageProps = {}) {
  const { user, profile } = useAuth();
  const effectiveUserId = user?.id || profile?.user_id || '';
  const effectiveProfileId = profile?.id || effectiveUserId;

  const [rawReports, setRawReports] = useState<DiagnosticReportItem[]>(initialReports || []);
  const [isLoading, setIsLoading] = useState(!initialReports);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter States
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('All Time');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Document Viewer Modal State
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<DiagnosticReportItem | null>(null);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(100); // 100%
  const [modalActiveTab, setModalActiveTab] = useState<'document' | 'biomarkers'>('document');
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  // Load Reports from DB if initialReports not provided
  const loadReports = useCallback(async () => {
    if (initialReports) {
      setRawReports(initialReports);
      setIsLoading(false);
      return;
    }

    if (!effectiveProfileId) {
      setRawReports(SAMPLE_VAULT_REPORTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const dbReports = await reportsRepo.listReports(effectiveProfileId);
      if (dbReports.length === 0) {
        // Fallback to rich sample clinical dossier
        setRawReports(SAMPLE_VAULT_REPORTS);
      } else {
        const loadedItems = await Promise.all(
          dbReports.map(async (rep) => {
            const results = await reportsRepo.listResultsForReport(rep.id);
            return mapDbReportToDiagnosticItem(rep, results);
          })
        );
        setRawReports(loadedItems);
      }
    } catch (err) {
      console.warn('Failed to load reports from database, falling back to sample dossier:', err);
      setRawReports(SAMPLE_VAULT_REPORTS);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveProfileId, initialReports]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Faceted Filtering
  const filterOptions = useMemo<DossierFilterOptions>(() => {
    let categoryParam: DiagnosticCategory | undefined = undefined;
    let categoriesParam: DiagnosticCategory[] | undefined = undefined;

    if (selectedCategory === 'surgical_notes') {
      categoriesParam = ['surgical', 'notes'];
    } else if (selectedCategory !== 'All') {
      categoryParam = selectedCategory as DiagnosticCategory;
    }

    return {
      condition: selectedCondition === 'All' ? undefined : (selectedCondition as ClinicalCondition),
      category: categoryParam,
      categories: categoriesParam,
      timelinePreset: selectedTimeline === 'All Time' ? undefined : selectedTimeline,
      searchQuery: searchQuery.trim() || undefined,
    };
  }, [selectedCondition, selectedCategory, selectedTimeline, searchQuery]);

  const filterResult = useMemo(() => {
    return filterDossier(rawReports, filterOptions);
  }, [rawReports, filterOptions]);

  // Horizontal Condition Chips
  const conditionChipOptions = useMemo(() => {
    const list = [
      'All',
      'Cardiology',
      'Oncology',
      'Endocrinology',
      'Nephrology',
      'Autoimmune',
      'Orthopedics',
      'General Health',
    ];
    for (const cond of filterResult.availableConditions) {
      if (!list.includes(cond)) {
        list.push(cond);
      }
    }
    return list;
  }, [filterResult.availableConditions]);

  // Diagnostic Category Tabs
  const categoryTabOptions = useMemo(
    () => [
      { id: 'All', label: 'All', icon: <FileTextIcon size={14} /> },
      { id: 'bloodwork', label: 'Bloodwork', icon: <LabFlaskIcon size={14} /> },
      { id: 'imaging', label: 'Imaging', icon: <ImageIcon size={14} /> },
      { id: 'pathology', label: 'Pathology', icon: <ActivityIcon size={14} /> },
      { id: 'surgical_notes', label: 'Surgical/Notes', icon: <StethoscopeIcon size={14} /> },
    ],
    []
  );

  // Timeline Dropdown Options
  const timelineDropdownOptions = useMemo(() => {
    const defaultPresets = [
      { value: 'All Time', label: 'All Time' },
      { value: 'Past 12 Months', label: 'Past 12 Months' },
      { value: '2026', label: '2026' },
      { value: '2025', label: '2025' },
      { value: '2024', label: '2024' },
      { value: '2023', label: '2023' },
      { value: '2022', label: '2022' },
    ];
    // Include any additional years from data
    const existingValues = new Set(defaultPresets.map((p) => p.value));
    for (const yr of filterResult.availableYears) {
      const yrStr = String(yr);
      if (!existingValues.has(yrStr)) {
        defaultPresets.push({ value: yrStr, label: yrStr });
        existingValues.add(yrStr);
      }
    }
    return defaultPresets;
  }, [filterResult.availableYears]);

  const handleOpenPreview = (report: DiagnosticReportItem) => {
    setSelectedReportForPreview(report);
    setPreviewPage(1);
    setZoomScale(100);
    setModalActiveTab('document');
  };

  const handleClosePreview = () => {
    setSelectedReportForPreview(null);
  };

  const handleDownload = (report: DiagnosticReportItem) => {
    const filename = `${report.title.replace(/\s+/g, '_')}_${report.testDate}.${report.fileType}`;
    setDownloadNotification(`Downloading official record: ${filename}`);
    setTimeout(() => {
      setDownloadNotification(null);
    }, 3500);
  };

  const handleResetFilters = () => {
    setSelectedCondition('All');
    setSelectedCategory('All');
    setSelectedTimeline('All Time');
    setSearchQuery('');
  };

  return (
    <AppShell>
      {/* Header with Title, Subtitle, and Quick Actions */}
      <PageHeader
        title="Clinical Dossier & Diagnostic Archive"
        description="Longitudinal health records spanning all conditions, diagnostics, and years."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/share">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ShareIcon size={15} />}
                className="whitespace-nowrap"
              >
                Share Scoped Dossier with Doctor
              </Button>
            </Link>
            <Link to="/reports/new">
              <Button
                size="sm"
                leftIcon={<UploadIcon size={15} />}
                className="whitespace-nowrap"
              >
                Upload New Report
              </Button>
            </Link>
          </div>
        }
      />

      {/* Cross-Link Banner to Biomarker Trend Chart */}
      <div className="mb-6 p-3.5 rounded-xl bg-surface-sunken border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-content-muted">
          <LabFlaskIcon size={16} className="text-accent shrink-0" />
          <span>
            Looking for longitudinal trend analysis of blood glucose, cholesterol, and renal markers?
          </span>
        </div>
        <Link to="/reports" className="font-bold text-accent hover:text-accent-hover shrink-0 underline">
          Switch to Biomarker Trend Visualizer →
        </Link>
      </div>

      {downloadNotification && (
        <div
          role="status"
          className="mb-4 p-3 rounded-xl bg-ok-bg border border-ok-border text-ok-text text-xs font-semibold flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircleIcon size={16} />
          <span>{downloadNotification}</span>
        </div>
      )}

      {loadError ? (
        <ErrorState
          title="Could not load diagnostic vault"
          message={loadError}
          onRetry={loadReports}
        />
      ) : (
        <div className="space-y-6">
          {/* Faceted Filter Toolbar */}
          <Card className="p-4 sm:p-5 space-y-4 shadow-card">
            {/* 1. Horizontal Scrollable Condition Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-content-subtle uppercase tracking-wider">
                <span>Clinical Specialty / Health Area</span>
                <span className="text-2xs font-normal normal-case text-content-muted">
                  Scroll for all specialties
                </span>
              </div>
              <div
                className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none"
                role="region"
                aria-label="Filter by clinical condition"
              >
                {conditionChipOptions.map((cond) => {
                  const isSelected = selectedCondition === cond;
                  return (
                    <button
                      key={cond}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedCondition(cond)}
                      className={clsx(
                        'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border cursor-pointer select-none',
                        isSelected
                          ? 'bg-accent text-accent-contrast border-accent shadow-sm'
                          : 'bg-surface border-line text-content-muted hover:text-content hover:bg-surface-hover hover:border-line-strong'
                      )}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Category Tabs & Timeline Dropdown & Search Bar Grid */}
            <div className="pt-2 border-t border-line space-y-4">
              {/* Category Segmented Tabs */}
              <div>
                <span className="block text-xs font-bold text-content-subtle uppercase tracking-wider mb-2">
                  Diagnostic Category
                </span>
                <div
                  role="tablist"
                  aria-label="Diagnostic categories"
                  className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-sunken border border-line"
                >
                  {categoryTabOptions.map((tab) => {
                    const isSelected = selectedCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedCategory(tab.id)}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
                          isSelected
                            ? 'bg-surface-raised border border-line-strong text-content shadow-xs'
                            : 'text-content-muted hover:text-content hover:bg-surface-hover/50'
                        )}
                      >
                        <span className={isSelected ? 'text-accent' : 'text-content-subtle'}>
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timeline Dropdown & Live Full-Text Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Timeline Selector Dropdown */}
                <div className="w-full sm:w-56 shrink-0">
                  <label htmlFor="timeline-selector" className="sr-only">
                    Filter by timeline
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-content-subtle pointer-events-none">
                      <CalendarIcon size={16} />
                    </span>
                    <select
                      id="timeline-selector"
                      aria-label="Filter by timeline"
                      value={selectedTimeline}
                      onChange={(e) => setSelectedTimeline(e.target.value)}
                      className={clsx(
                        controlStyles,
                        'h-11 text-xs sm:text-sm pl-9 pr-8 appearance-none cursor-pointer bg-surface font-medium'
                      )}
                    >
                      {timelineDropdownOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 text-content-subtle pointer-events-none">
                      <ChevronDownIcon size={16} />
                    </span>
                  </div>
                </div>

                {/* Live Full-Text Search with Quick Clear */}
                <div className="relative flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports, tests, facilities, or notes..."
                    aria-label="Search reports or tests"
                    leftIcon={<SearchIcon size={16} />}
                    rightIcon={
                      searchQuery ? (
                        <button
                          type="button"
                          aria-label="Clear search"
                          onClick={() => setSearchQuery('')}
                          className="p-1 text-content-subtle hover:text-content cursor-pointer transition-colors"
                        >
                          <XIcon size={16} />
                        </button>
                      ) : null
                    }
                  />
                </div>
              </div>
            </div>

            {/* Active Filters Summary & Reset */}
            {(selectedCondition !== 'All' ||
              selectedCategory !== 'All' ||
              selectedTimeline !== 'All Time' ||
              searchQuery.trim().length > 0) && (
              <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
                <span className="text-content-muted">
                  Showing <strong className="text-content">{filterResult.totalCount}</strong> matching
                  report{filterResult.totalCount === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-bold text-accent hover:text-accent-hover cursor-pointer underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </Card>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filterResult.timelineGroups.length === 0 ? (
            /* Empty State */
            <EmptyState
              heading={
                searchQuery.trim() || selectedCondition !== 'All' || selectedCategory !== 'All'
                  ? 'No matching reports found'
                  : 'Diagnostic dossier is empty'
              }
              description={
                searchQuery.trim() || selectedCondition !== 'All' || selectedCategory !== 'All'
                  ? 'Try broadening your search query, switching condition chips, or resetting timeline presets.'
                  : 'Upload your hospital discharge notes, lab results, MRI scans, or biopsy records to build your longitudinal clinical archive.'
              }
              action={
                <Button size="sm" onClick={handleResetFilters}>
                  Reset All Filters
                </Button>
              }
            />
          ) : (
            /* 3. Timeline Grouped View: Chronological by Year & Month */
            <div className="space-y-8">
              {filterResult.timelineGroups.map((group) => (
                <section
                  key={group.monthLabel}
                  aria-labelledby={`group-${group.monthLabel.replace(/\s+/g, '-')}`}
                  className="space-y-3"
                >
                  {/* Timeline Month Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-sunken border border-line text-accent">
                        <CalendarIcon size={15} />
                      </span>
                      <h2
                        id={`group-${group.monthLabel.replace(/\s+/g, '-')}`}
                        className="text-base font-bold text-content tracking-tight"
                      >
                        {group.monthLabel}
                      </h2>
                    </div>
                    <Badge tone="neutral" size="sm">
                      {group.count} report{group.count > 1 ? 's' : ''}
                    </Badge>
                    <div className="h-px flex-1 bg-line" />
                  </div>

                  {/* Report Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {group.reports.map((report) => {
                      const biomarkers = report.biomarkers || [];
                      const outOfRangeCount = biomarkers.filter(
                        (b) => b.rangeStatus === 'above' || b.rangeStatus === 'below'
                      ).length;

                      return (
                        <Card
                          key={report.id}
                          className="p-4 sm:p-5 flex flex-col justify-between hover:border-line-strong transition-all shadow-card"
                        >
                          <div className="space-y-3">
                            {/* Card Top Row: Category badge, Condition badge, and Date */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge tone="info" size="sm" className="capitalize">
                                  {report.category}
                                </Badge>
                                <Badge tone="neutral" size="sm">
                                  {report.condition}
                                </Badge>
                              </div>
                              <span className="text-xs text-content-subtle font-medium">
                                {report.testDate}
                              </span>
                            </div>

                            {/* Card Title & Facility */}
                            <div>
                              <h3 className="text-base font-bold text-content leading-snug">
                                {report.title}
                              </h3>
                              <p className="text-xs text-content-muted mt-0.5">
                                {report.facilityName || report.labName || 'Diagnostic Facility'}
                                {report.doctorName ? ` • ${report.doctorName}` : ''}
                              </p>
                            </div>

                            {/* Format & Multi-Page Indicator */}
                            <div className="flex items-center gap-2 text-2xs text-content-subtle">
                              <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-surface-sunken border border-line">
                                {report.fileType === 'pdf' ? (
                                  <FileTextIcon size={12} className="text-accent" />
                                ) : (
                                  <ImageIcon size={12} className="text-accent" />
                                )}
                                {report.pageCount} page{report.pageCount > 1 ? 's' : ''} ·{' '}
                                {report.fileType.toUpperCase()}
                              </span>

                              {outOfRangeCount > 0 && (
                                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-warn-bg text-warn-text border border-warn-border">
                                  <AlertTriangleIcon size={12} />
                                  {outOfRangeCount} out of range
                                </span>
                              )}
                            </div>

                            {/* Biomarker Pill Previews */}
                            {biomarkers.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-line">
                                {biomarkers.slice(0, 3).map((b, idx) => {
                                  const isOut = b.rangeStatus === 'above' || b.rangeStatus === 'below';
                                  return (
                                    <span
                                      key={idx}
                                      className={clsx(
                                        'text-2xs px-2 py-0.5 rounded border font-medium',
                                        isOut
                                          ? 'bg-warn-bg text-warn-text border-warn-border font-semibold'
                                          : 'bg-surface text-content-muted border-line'
                                      )}
                                    >
                                      {b.name}: <strong className="text-content">{b.valueText}</strong>{' '}
                                      {b.unit || ''}
                                    </span>
                                  );
                                })}
                                {biomarkers.length > 3 && (
                                  <span className="text-2xs text-content-subtle self-center">
                                    +{biomarkers.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Clinical Notes snippet if present */}
                            {(report.conditionNotes || report.notes) && (
                              <p className="text-xs text-content-muted italic line-clamp-2 pt-1 border-t border-line">
                                &ldquo;{report.conditionNotes || report.notes}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Card Actions: View Report & Download */}
                          <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-line">
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={<EyeIcon size={14} />}
                              onClick={() => handleOpenPreview(report)}
                            >
                              View Report
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<DownloadIcon size={14} />}
                              onClick={() => handleDownload(report)}
                            >
                              Download
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Out of Range Medical Disclaimer */}
      <div className="mt-8">
        <Disclaimer text={REPORT_OUT_OF_RANGE_NOTE} />
      </div>

      {/* 4. Inline Document Preview Modal */}
      {selectedReportForPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-surface-raised border border-line-strong rounded-2xl shadow-over overflow-hidden focus:outline-none">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 sm:p-5 border-b border-line bg-surface">
              <div className="space-y-1 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="preview-modal-title" className="text-lg font-bold text-content tracking-tight">
                    {selectedReportForPreview.title}
                  </h2>
                  <Badge tone="info" size="sm" className="capitalize">
                    {selectedReportForPreview.category}
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    {selectedReportForPreview.condition}
                  </Badge>
                </div>
                <p className="text-xs text-content-muted">
                  {selectedReportForPreview.facilityName || selectedReportForPreview.labName} • Test Date:{' '}
                  {selectedReportForPreview.testDate}
                  {selectedReportForPreview.doctorName ? ` • Ref: ${selectedReportForPreview.doctorName}` : ''}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={handleClosePreview}
                className="shrink-0 p-2 rounded-lg text-content-subtle hover:text-content hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Dual Fidelity Mode Switcher (ADR 0003) & Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-surface-sunken border-b border-line">
              {/* Dual Fidelity Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-line">
                <button
                  type="button"
                  onClick={() => setModalActiveTab('document')}
                  className={clsx(
                    'px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all',
                    modalActiveTab === 'document'
                      ? 'bg-accent text-accent-contrast shadow-2xs'
                      : 'text-content-muted hover:text-content'
                  )}
                >
                  Original Document
                </button>
                {selectedReportForPreview.biomarkers && selectedReportForPreview.biomarkers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('biomarkers')}
                    className={clsx(
                      'px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all',
                      modalActiveTab === 'biomarkers'
                        ? 'bg-accent text-accent-contrast shadow-2xs'
                        : 'text-content-muted hover:text-content'
                    )}
                  >
                    Structured Biomarkers ({selectedReportForPreview.biomarkers.length})
                  </button>
                )}
              </div>

              {/* Document Canvas Zoom & Pagination Controls */}
              {modalActiveTab === 'document' && (
                <div className="flex items-center gap-3">
                  {/* Multi-Page Pagination Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-md border border-line bg-surface text-content hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeftIcon size={14} />
                    </button>
                    <span className="text-xs font-semibold px-2 text-content select-none">
                      Page {previewPage} of {selectedReportForPreview.pageCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={previewPage >= selectedReportForPreview.pageCount}
                      onClick={() =>
                        setPreviewPage((p) => Math.min(selectedReportForPreview.pageCount, p + 1))
                      }
                      className="p-1.5 rounded-md border border-line bg-surface text-content hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-line" />

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Zoom out"
                      onClick={() => setZoomScale((z) => Math.max(50, z - 25))}
                      className="p-1.5 rounded-md border border-line bg-surface text-content hover:bg-surface-hover cursor-pointer"
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span className="text-xs font-mono px-1.5 text-content-muted min-w-[48px] text-center select-none">
                      {zoomScale}%
                    </span>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      onClick={() => setZoomScale((z) => Math.min(200, z + 25))}
                      className="p-1.5 rounded-md border border-line bg-surface text-content hover:bg-surface-hover cursor-pointer"
                    >
                      <PlusIcon size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Reset zoom"
                      onClick={() => setZoomScale(100)}
                      className="p-1.5 rounded-md border border-line bg-surface text-content hover:bg-surface-hover cursor-pointer ml-1"
                      title="Reset to 100%"
                    >
                      <RefreshIcon size={14} />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-line" />

                  {/* Download Button in Toolbar */}
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<DownloadIcon size={14} />}
                    onClick={() => handleDownload(selectedReportForPreview)}
                  >
                    Download
                  </Button>
                </div>
              )}
            </div>

            {/* Document Canvas Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 bg-surface-sunken flex justify-center items-start min-h-[420px]">
              {modalActiveTab === 'document' ? (
                /* Authentic Document Sheet View (Simulated Clinical Letterhead & Specimen) */
                <div
                  style={{
                    transform: `scale(${zoomScale / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="w-full max-w-2xl bg-white text-ink-950 p-6 sm:p-10 rounded-lg shadow-over border border-neutral-300 font-sans space-y-6"
                >
                  {/* Official Letterhead */}
                  <div className="border-b-2 border-neutral-900 pb-4 flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-neutral-900">
                        {selectedReportForPreview.facilityName.toUpperCase()}
                      </h1>
                      <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Department of Clinical Diagnostic Medicine & Pathology
                      </p>
                      <p className="text-2xs text-neutral-500">
                        Accredited Healthcare Diagnostic Reference Services
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 text-2xs font-bold uppercase rounded bg-neutral-100 text-neutral-800 border border-neutral-300">
                        Official Clinical Record
                      </span>
                      <p className="text-2xs text-neutral-500 mt-1">
                        Report ID: {selectedReportForPreview.id}
                      </p>
                      <p className="text-2xs font-semibold text-neutral-700">
                        Page {previewPage} of {selectedReportForPreview.pageCount}
                      </p>
                    </div>
                  </div>

                  {/* Patient & Specimen Info Table */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded text-xs">
                    <div>
                      <span className="text-2xs text-neutral-500 uppercase block font-semibold">
                        Patient / Profile ID
                      </span>
                      <strong className="text-neutral-900">{selectedReportForPreview.profileId}</strong>
                    </div>
                    <div>
                      <span className="text-2xs text-neutral-500 uppercase block font-semibold">
                        Date of Examination
                      </span>
                      <strong className="text-neutral-900">{selectedReportForPreview.testDate}</strong>
                    </div>
                    <div>
                      <span className="text-2xs text-neutral-500 uppercase block font-semibold">
                        Consultant Doctor
                      </span>
                      <strong className="text-neutral-900">
                        {selectedReportForPreview.doctorName || 'Attending Specialist'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-2xs text-neutral-500 uppercase block font-semibold">
                        Clinical Area
                      </span>
                      <strong className="text-neutral-900">{selectedReportForPreview.condition}</strong>
                    </div>
                  </div>

                  {/* Content for Current Page */}
                  <div className="space-y-4">
                    <div className="border-b border-neutral-300 pb-2 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
                        {selectedReportForPreview.title}
                      </h4>
                      <span className="text-2xs font-medium text-neutral-500">
                        Format: {selectedReportForPreview.fileType.toUpperCase()}
                      </span>
                    </div>

                    {/* Bloodwork / Labs Table */}
                    {selectedReportForPreview.category === 'bloodwork' &&
                    selectedReportForPreview.biomarkers &&
                    selectedReportForPreview.biomarkers.length > 0 ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-300 text-neutral-600 font-bold uppercase text-2xs">
                            <th className="pb-2">Test Parameter</th>
                            <th className="pb-2">Observed Result</th>
                            <th className="pb-2">Unit</th>
                            <th className="pb-2">Reference Range</th>
                            <th className="pb-2 text-right">Evaluation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {selectedReportForPreview.biomarkers.map((bm, idx) => {
                            const isOut = bm.rangeStatus === 'above' || bm.rangeStatus === 'below';
                            return (
                              <tr key={idx} className="hover:bg-neutral-50">
                                <td className="py-2 font-medium text-neutral-900">{bm.name}</td>
                                <td
                                  className={clsx(
                                    'py-2 font-bold',
                                    isOut ? 'text-amber-700' : 'text-neutral-900'
                                  )}
                                >
                                  {bm.valueText}
                                </td>
                                <td className="py-2 text-neutral-600">{bm.unit || '—'}</td>
                                <td className="py-2 text-neutral-500">{bm.referenceRange || '—'}</td>
                                <td className="py-2 text-right">
                                  <span
                                    className={clsx(
                                      'text-2xs px-2 py-0.5 rounded font-semibold',
                                      isOut
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    )}
                                  >
                                    {isOut ? 'Flagged' : 'Within Range'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : selectedReportForPreview.category === 'imaging' ? (
                      /* Imaging Scan View Simulation */
                      <div className="space-y-4">
                        <div className="bg-neutral-900 text-neutral-100 p-6 rounded-lg text-center space-y-2">
                          <ImageIcon size={48} className="mx-auto text-neutral-400" />
                          <p className="text-xs font-mono text-neutral-300">
                            [DICOM HIGH-FIDELITY MEDICAL SCAN VIEW]
                          </p>
                          <p className="text-2xs text-neutral-400">
                            Slice Series #{previewPage} of {selectedReportForPreview.pageCount} • 512x512
                            Matrix • Window/Level: Preserved
                          </p>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs space-y-1">
                          <strong className="text-neutral-900 block font-semibold">
                            Radiologist Findings & Impressions:
                          </strong>
                          <p className="text-neutral-700">
                            {selectedReportForPreview.conditionNotes ||
                              'Examination performed using standard diagnostic protocol. No acute radiologic abnormality or significant pathological deviation noted.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Pathology / Surgical / Clinical Notes Narrative View */
                      <div className="space-y-3 p-4 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800">
                        <strong className="text-neutral-900 block font-semibold text-sm">
                          Clinical Findings & Narrative Summary
                        </strong>
                        <p className="leading-relaxed">
                          {selectedReportForPreview.conditionNotes ||
                            selectedReportForPreview.notes ||
                            'Clinical examination and procedural notes documented in accordance with institutional healthcare protocol.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Document Footer with Legal Watermark and Doctor Signature */}
                  <div className="pt-6 border-t border-neutral-300 flex flex-col sm:flex-row justify-between items-end gap-4 text-2xs text-neutral-500">
                    <div>
                      <p className="font-semibold text-neutral-700">
                        Curewell Dual-Fidelity Diagnostic Archive (ADR 0003)
                      </p>
                      <p>Electronically verified and signed by consulting diagnostic staff.</p>
                    </div>
                    <div className="text-right border-t border-neutral-400 pt-1 min-w-[140px]">
                      <span className="font-serif italic text-neutral-800 text-xs block">
                        {selectedReportForPreview.doctorName || 'Authorized Signatory'}
                      </span>
                      <span className="text-neutral-500 block">Consultant Pathologist / Radiologist</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Structured Biomarkers Tab */
                <div className="w-full max-w-2xl space-y-3">
                  <div className="p-4 rounded-xl bg-surface border border-line text-xs space-y-1">
                    <p className="font-bold text-content">
                      Extracted Longitudinal Biomarkers ({selectedReportForPreview.biomarkers?.length || 0})
                    </p>
                    <p className="text-content-muted">
                      Values extracted and normalized into Curewell&apos;s longitudinal time-series database.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedReportForPreview.biomarkers?.map((bm, idx) => {
                      const isOut = bm.rangeStatus === 'above' || bm.rangeStatus === 'below';
                      return (
                        <Card key={idx} className="p-3.5 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-content">{bm.name}</span>
                            <Badge tone={isOut ? 'warn' : 'ok'} size="sm">
                              {isOut ? 'Out of range' : 'Within range'}
                            </Badge>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-content">{bm.valueText}</span>
                            <span className="text-xs text-content-muted">{bm.unit}</span>
                          </div>
                          {bm.referenceRange && (
                            <p className="text-2xs text-content-subtle">
                              Standard Range: {bm.referenceRange} {bm.unit || ''}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-3 p-3 sm:p-4 bg-surface border-t border-line">
              <Button size="sm" variant="secondary" onClick={handleClosePreview}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default ReportsVaultPage;
