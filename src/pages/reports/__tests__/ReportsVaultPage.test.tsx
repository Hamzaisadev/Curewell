import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReportsVaultPage } from '../ReportsVaultPage';
import { SAMPLE_VAULT_REPORTS } from '../vaultData';

// Mock Auth
vi.mock('../../../lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'patient-01' },
    profile: { id: 'patient-01', user_id: 'patient-01', full_name: 'Sara Khan' },
  }),
}));

// Mock DB
vi.mock('../../../lib/db', () => ({
  reportsRepo: {
    listReports: vi.fn().mockResolvedValue([]),
    listResultsForReport: vi.fn().mockResolvedValue([]),
  },
}));

describe('ReportsVaultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <ReportsVaultPage initialReports={SAMPLE_VAULT_REPORTS} {...props} />
      </MemoryRouter>
    );
  };

  it('renders header, quick actions, condition chips, and category tabs', () => {
    renderComponent();

    // 1. Header & Quick Actions
    expect(screen.getByText('Clinical Dossier & Diagnostic Archive')).toBeInTheDocument();
    expect(
      screen.getByText('Longitudinal health records spanning all conditions, diagnostics, and years.')
    ).toBeInTheDocument();
    expect(screen.getByText('Upload New Report')).toBeInTheDocument();
    expect(screen.getByText('Share Scoped Dossier with Doctor')).toBeInTheDocument();

    // 2. Condition Chips
    const conditionRegion = screen.getByRole('region', { name: /filter by clinical condition/i });
    expect(within(conditionRegion).getByText('All')).toBeInTheDocument();
    expect(within(conditionRegion).getByText('Cardiology')).toBeInTheDocument();
    expect(within(conditionRegion).getByText('Oncology')).toBeInTheDocument();
    expect(within(conditionRegion).getByText('Endocrinology')).toBeInTheDocument();
    expect(within(conditionRegion).getByText('Nephrology')).toBeInTheDocument();
    expect(within(conditionRegion).getByText('Autoimmune')).toBeInTheDocument();
    expect(within(conditionRegion).getByText('General Health')).toBeInTheDocument();

    // 3. Category Tabs
    const tabList = screen.getByRole('tablist', { name: /diagnostic categories/i });
    expect(within(tabList).getByText('All')).toBeInTheDocument();
    expect(within(tabList).getByText('Bloodwork')).toBeInTheDocument();
    expect(within(tabList).getByText('Imaging')).toBeInTheDocument();
    expect(within(tabList).getByText('Pathology')).toBeInTheDocument();
    expect(within(tabList).getByText('Surgical/Notes')).toBeInTheDocument();

    // 4. Timeline selector and search input
    expect(screen.getByLabelText(/filter by timeline/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search reports, tests, facilities, or notes/i)).toBeInTheDocument();
  });

  it('renders timeline grouping displaying correct Year/Month sections', () => {
    renderComponent();

    // Check chronological month headers
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(screen.getByText('August 2026')).toBeInTheDocument();
    expect(screen.getByText('November 2025')).toBeInTheDocument();
    expect(screen.getByText('May 2025')).toBeInTheDocument();
    expect(screen.getByText('March 2024')).toBeInTheDocument();

    // Report cards under August 2026
    expect(screen.getByText('Echocardiogram 2D Color Doppler')).toBeInTheDocument();
    expect(screen.getByText('HbA1c & Fasting Plasma Glucose')).toBeInTheDocument();

    // Report cards show multi-page indicators
    expect(screen.getAllByText(/3 pages · PDF/i).length).toBeGreaterThan(0);
  });

  it('filters reports accurately by condition chips', () => {
    renderComponent();

    // Initially all reports shown
    expect(screen.getByText('Comprehensive Lipid Profile & Liver Panel')).toBeInTheDocument();
    expect(screen.getByText('Contrast-Enhanced Chest CT Scan')).toBeInTheDocument();

    // Click "Cardiology" condition chip
    const conditionRegion = screen.getByRole('region', { name: /filter by clinical condition/i });
    fireEvent.click(within(conditionRegion).getByText('Cardiology'));

    // Cardiology reports should be present
    expect(screen.getByText('Comprehensive Lipid Profile & Liver Panel')).toBeInTheDocument();
    expect(screen.getByText('Echocardiogram 2D Color Doppler')).toBeInTheDocument();
    expect(screen.getByText('Coronary Angiography Procedure Notes')).toBeInTheDocument();

    // Non-cardiology reports should NOT be present
    expect(screen.queryByText('HbA1c & Fasting Plasma Glucose')).not.toBeInTheDocument();
    expect(screen.queryByText('Contrast-Enhanced Chest CT Scan')).not.toBeInTheDocument();

    // Click "All" to reset condition
    fireEvent.click(within(conditionRegion).getByText('All'));
    expect(screen.getByText('HbA1c & Fasting Plasma Glucose')).toBeInTheDocument();
  });

  it('filters reports accurately by diagnostic category tabs', () => {
    renderComponent();

    const tabList = screen.getByRole('tablist', { name: /diagnostic categories/i });

    // Click "Imaging" tab
    fireEvent.click(within(tabList).getByText('Imaging'));

    // Imaging reports should be visible
    expect(screen.getByText('Echocardiogram 2D Color Doppler')).toBeInTheDocument();
    expect(screen.getByText('Contrast-Enhanced Chest CT Scan')).toBeInTheDocument();

    // Bloodwork reports should NOT be visible
    expect(screen.queryByText('Comprehensive Lipid Profile & Liver Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('HbA1c & Fasting Plasma Glucose')).not.toBeInTheDocument();

    // Click "Surgical/Notes" tab
    fireEvent.click(within(tabList).getByText('Surgical/Notes'));
    expect(screen.getByText('Coronary Angiography Procedure Notes')).toBeInTheDocument();
    expect(screen.getByText('Discharge Summary & Clinical Post-Op Instructions')).toBeInTheDocument();
    expect(screen.queryByText('Echocardiogram 2D Color Doppler')).not.toBeInTheDocument();
  });

  it('filters reports accurately by timeline selector', () => {
    renderComponent();

    const timelineSelect = screen.getByLabelText(/filter by timeline/i);

    // Select "2025"
    fireEvent.change(timelineSelect, { target: { value: '2025' } });

    // 2025 reports should be shown
    expect(screen.getByText('Renal Function Panel & Serum Creatinine')).toBeInTheDocument();
    expect(screen.getByText('Contrast-Enhanced Chest CT Scan')).toBeInTheDocument();

    // 2026 reports should NOT be shown
    expect(screen.queryByText('Comprehensive Lipid Profile & Liver Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('HbA1c & Fasting Plasma Glucose')).not.toBeInTheDocument();

    // Switch back to "All Time"
    fireEvent.change(timelineSelect, { target: { value: 'All Time' } });
    expect(screen.getByText('Comprehensive Lipid Profile & Liver Panel')).toBeInTheDocument();
  });

  it('filters reports live by search input and clears via quick clear button', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/search reports, tests, facilities, or notes/i);

    // Search by test keyword
    fireEvent.change(searchInput, { target: { value: 'Lipid' } });
    expect(screen.getByText('Comprehensive Lipid Profile & Liver Panel')).toBeInTheDocument();
    expect(screen.queryByText('Echocardiogram 2D Color Doppler')).not.toBeInTheDocument();
    expect(screen.queryByText('HbA1c & Fasting Plasma Glucose')).not.toBeInTheDocument();

    // Quick clear button
    const clearButton = screen.getByLabelText(/clear search/i);
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);

    // All reports should be restored
    expect(screen.getByText('Comprehensive Lipid Profile & Liver Panel')).toBeInTheDocument();
    expect(screen.getByText('Echocardiogram 2D Color Doppler')).toBeInTheDocument();

    // Search by hospital facility name
    fireEvent.change(searchInput, { target: { value: 'Shaukat Khanum' } });
    expect(screen.getByText('Contrast-Enhanced Chest CT Scan')).toBeInTheDocument();
    expect(screen.queryByText('Comprehensive Lipid Profile & Liver Panel')).not.toBeInTheDocument();
  });

  it('opens inline document preview modal with zoom and pagination controls', () => {
    renderComponent();

    // Find "View Report" button on "Comprehensive Lipid Profile & Liver Panel"
    const viewButtons = screen.getAllByRole('button', { name: /view report/i });
    expect(viewButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewButtons[0]!);

    // Modal should be open
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getAllByText('Comprehensive Lipid Profile & Liver Panel')[0]).toBeInTheDocument();
    expect(within(modal).getAllByText(/AGA KHAN UNIVERSITY HOSPITAL/i).length).toBeGreaterThan(0);

    // Multi-page pagination
    expect(within(modal).getAllByText('Page 1 of 3').length).toBeGreaterThan(0);
    const nextPageBtn = within(modal).getByLabelText(/next page/i);
    fireEvent.click(nextPageBtn);
    expect(within(modal).getAllByText('Page 2 of 3').length).toBeGreaterThan(0);

    const prevPageBtn = within(modal).getByLabelText(/previous page/i);
    fireEvent.click(prevPageBtn);
    expect(within(modal).getAllByText('Page 1 of 3').length).toBeGreaterThan(0);

    // Zoom controls
    expect(within(modal).getByText('100%')).toBeInTheDocument();
    const zoomInBtn = within(modal).getByLabelText(/zoom in/i);
    fireEvent.click(zoomInBtn);
    expect(within(modal).getByText('125%')).toBeInTheDocument();

    const zoomOutBtn = within(modal).getByLabelText(/zoom out/i);
    fireEvent.click(zoomOutBtn);
    expect(within(modal).getByText('100%')).toBeInTheDocument();

    // Dual-Fidelity tab: switch to Structured Biomarkers
    const biomarkersTab = within(modal).getByRole('button', { name: /structured biomarkers/i });
    fireEvent.click(biomarkersTab);
    expect(within(modal).getByText('Total Cholesterol')).toBeInTheDocument();
    expect(within(modal).getByText('HDL Cholesterol')).toBeInTheDocument();

    // Close modal
    const closeBtn = within(modal).getByLabelText(/close/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
