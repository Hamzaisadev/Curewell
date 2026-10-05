import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DoctorPortalPage } from '../DoctorPortalPage';
import { resolveDoctorShareToken } from '../../../lib/security/doctorShare';

vi.mock('../../../lib/security/doctorShare', () => ({
  resolveDoctorShareToken: vi.fn(),
}));

vi.mock('../../../lib/db', () => ({
  reportsRepo: {
    listReports: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../lib/export/pdfExport', () => ({
  exportElementToPdf: vi.fn().mockResolvedValue(undefined),
}));

describe('DoctorPortalPage (Clinician Ephemeral Portal)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithToken = (token = 'test-token-123') => {
    return render(
      <MemoryRouter initialEntries={[`/view/${token}`]}>
        <Routes>
          <Route path="/view/:token" element={<DoctorPortalPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially then displays scoped dossier when token is valid', async () => {
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    vi.mocked(resolveDoctorShareToken).mockResolvedValue({
      success: true,
      valid: true,
      status: 'valid',
      profileId: 'profile-patient-1',
      expiresAt,
      profile: {
        id: 'profile-patient-1',
        full_name: 'Sara Khan',
        sex: 'female',
        blood_group: 'B+',
        date_of_birth: '1985-04-12',
        allergies: 'Penicillin',
        chronic_conditions: 'Cardiology, Hypertension',
      },
      scope: {
        conditions: ['Cardiology'],
      },
    });

    renderWithToken('valid-token-123');

    // 1. Header and Verified badge
    expect(await screen.findByText('Curewell Clinician Dossier')).toBeInTheDocument();
    expect(screen.getByText('Verified Link')).toBeInTheDocument();
    expect(screen.getAllByText(/Patient Initials: S\.K\./i).length).toBeGreaterThan(0);

    // 2. Security banner with expiration
    expect(screen.getByText(/Access valid for/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient-controlled ephemeral link/i)).toBeInTheDocument();

    // 3. Scoped Condition Filter (Cardiology button rendered after reports finish loading)
    expect(await screen.findByRole('button', { name: 'Cardiology' })).toBeInTheDocument();

    // 4. Download Scoped Dossier button
    expect(screen.getByText('Download Scoped Dossier (PDF)')).toBeInTheDocument();
  });

  it('renders PIN protection gate when token requires PIN', async () => {
    vi.mocked(resolveDoctorShareToken).mockResolvedValue({
      success: false,
      valid: false,
      status: 'pin_required',
      error: 'A 4-digit PIN is required to view this clinical dossier.',
    });

    renderWithToken('pin-token-456');

    expect(await screen.findByText('Clinician Verification PIN')).toBeInTheDocument();
    expect(
      screen.getByText(/The patient has protected this clinical dossier with a 4-digit security PIN/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/4-digit pin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify & unlock dossier/i })).toBeInTheDocument();
  });

  it('rejects incorrect PIN with accessible error feedback and unlocks upon correct PIN', async () => {
    // 1. Initially requires PIN
    vi.mocked(resolveDoctorShareToken).mockResolvedValueOnce({
      success: false,
      valid: false,
      status: 'pin_required',
    });

    renderWithToken('pin-token-456');

    const pinInput = await screen.findByLabelText(/4-digit pin/i);
    const form = pinInput.closest('form')!;

    // Enter wrong PIN
    vi.mocked(resolveDoctorShareToken).mockResolvedValueOnce({
      success: false,
      valid: false,
      status: 'invalid_pin',
      error: 'Incorrect PIN. Access denied.',
    });

    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect PIN. Access denied.');

    // Enter correct PIN
    const expiresAt = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
    vi.mocked(resolveDoctorShareToken).mockResolvedValueOnce({
      success: true,
      valid: true,
      status: 'valid',
      profileId: 'profile-patient-1',
      expiresAt,
      profile: {
        id: 'profile-patient-1',
        full_name: 'Tariq Siddiqui',
      },
      scope: {
        conditions: ['Cardiology', 'Oncology'],
      },
    });

    const currentInput = screen.getByLabelText(/4-digit pin/i);
    fireEvent.change(currentInput, { target: { value: '1234' } });
    fireEvent.submit(currentInput.closest('form')!);

    expect(await screen.findByText('Curewell Clinician Dossier')).toBeInTheDocument();
    expect(screen.getAllByText(/Patient Initials: T\.S\./i).length).toBeGreaterThan(0);
  });

  it('displays dignified status card when token is expired', async () => {
    vi.mocked(resolveDoctorShareToken).mockResolvedValue({
      success: false,
      valid: false,
      status: 'expired',
      error: 'This clinical sharing link has expired.',
    });

    renderWithToken('expired-token-789');

    expect(await screen.findByText('Clinical Access Expired')).toBeInTheDocument();
    expect(
      screen.getByText(/This clinical access link has expired or was revoked by the patient/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Clinical Privacy Protocol \(ADR 0002\)/i)).toBeInTheDocument();
  });

  it('displays revoked status card when token is revoked by the patient', async () => {
    vi.mocked(resolveDoctorShareToken).mockResolvedValue({
      success: false,
      valid: false,
      status: 'revoked',
      isRevoked: true,
      error: 'This clinical sharing link was revoked by the patient.',
    });

    renderWithToken('revoked-token-000');

    expect(await screen.findByText('Access Revoked by Patient')).toBeInTheDocument();
    expect(
      screen.getByText(/This clinical access link has expired or was revoked by the patient/i)
    ).toBeInTheDocument();
  });

  it('opens inline document preview modal with zoom and page controls', async () => {
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    vi.mocked(resolveDoctorShareToken).mockResolvedValue({
      success: true,
      valid: true,
      status: 'valid',
      profileId: 'profile-patient-1',
      expiresAt,
      profile: {
        id: 'profile-patient-1',
        full_name: 'Sara Khan',
      },
      scope: {},
    });

    renderWithToken('valid-token-modal');

    // Wait for reports to render
    const viewButtons = await screen.findAllByRole('button', { name: /view report/i });
    expect(viewButtons.length).toBeGreaterThan(0);

    // Open preview
    fireEvent.click(viewButtons[0]!);

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getAllByText(/Department of Clinical Pathology/i).length).toBeGreaterThan(0);

    // Zoom controls inside modal
    expect(within(modal).getByText('100%')).toBeInTheDocument();
    const zoomInBtn = within(modal).getByLabelText(/zoom in/i);
    fireEvent.click(zoomInBtn);
    expect(within(modal).getByText('125%')).toBeInTheDocument();

    // Close preview
    const closeBtn = within(modal).getByLabelText(/close document preview/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
