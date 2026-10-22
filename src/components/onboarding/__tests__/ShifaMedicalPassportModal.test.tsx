import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ShifaMedicalPassportModal,
  validateHeightCmInput,
  validateWeightKgInput,
  validateDateOfBirthInput,
  validatePhoneInput,
} from '../ShifaMedicalPassportModal';
import { ShifaPassportBanner } from '../ShifaPassportBanner';
import { MemoryRouter } from 'react-router-dom';
import { profilesRepo } from '../../../lib/db';

const { mockProfile, mockRefreshProfile } = vi.hoisted(() => ({
  mockProfile: {
    id: 'profile-123',
    user_id: 'user-123',
    full_name: 'Sarah Connor',
    sex: 'female' as const,
    date_of_birth: '1985-05-15',
    blood_group: 'O+' as const,
    height_cm: 165,
    weight_kg: 60,
    allergies: null,
    chronic_conditions: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    is_default: true,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  mockRefreshProfile: vi.fn(),
}));

vi.mock('../../../lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'sarah@example.com' },
    profile: mockProfile,
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock('../../../lib/db', () => ({
  profilesRepo: {
    updateProfile: vi.fn().mockResolvedValue({ ...mockProfile, onboarding_completed: true }),
  },
}));

describe('Shifa Health Profile Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders Shifa welcoming header and Step 1 biological baseline with Health Profile terminology', () => {
    render(
      <MemoryRouter>
        <ShifaMedicalPassportModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Complete Your Health Profile/i })).toBeInTheDocument();
    expect(screen.getByText(/^Health Profile$/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Biological Blueprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Blood Group/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
  });

  it('navigates to Step 2 (Chronic Conditions) on continue', async () => {
    render(
      <MemoryRouter>
        <ShifaMedicalPassportModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(await screen.findByText(/2\. Chronic Health Management/i)).toBeInTheDocument();
    expect(screen.getByText(/I have no chronic medical conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
  });

  it('blocks out-of-range height (e.g. 20 cm) and weight from advancing to Step 2', () => {
    render(
      <MemoryRouter>
        <ShifaMedicalPassportModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const heightInput = screen.getByLabelText(/Height \(cm\)/i);
    fireEvent.change(heightInput, { target: { value: '20' } });

    expect(
      screen.getAllByText(/Height must be between 30 cm and 250 cm/i).length
    ).toBeGreaterThan(0);

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    // Must remain on Step 1
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    expect(screen.queryByText(/2\. Chronic Health Management/i)).not.toBeInTheDocument();
  });

  it('validates height, weight, date of birth, and phone helper functions', () => {
    expect(validateHeightCmInput('-20')).toMatch(/between 30 cm and 250 cm/);
    expect(validateHeightCmInput('0')).toMatch(/between 30 cm and 250 cm/);
    expect(validateHeightCmInput('300')).toMatch(/between 30 cm and 250 cm/);
    expect(validateHeightCmInput('175')).toBeNull();
    expect(validateHeightCmInput('')).toBeNull();

    expect(validateWeightKgInput('-5')).toMatch(/between 1 kg and 350 kg/);
    expect(validateWeightKgInput('500')).toMatch(/between 1 kg and 350 kg/);
    expect(validateWeightKgInput('70')).toBeNull();

    expect(validateDateOfBirthInput('2099-01-01')).toMatch(/cannot be in the future/);
    expect(validateDateOfBirthInput('1850-01-01')).toMatch(/1900 or later/);
    expect(validateDateOfBirthInput('1990-06-15')).toBeNull();

    expect(validatePhoneInput('123')).toMatch(/7–15 digits/);
    expect(validatePhoneInput('+92 300 1234567')).toBeNull();
  });

  it('navigates to Step 3 (Allergies) and Step 4 (Emergency Contact)', async () => {
    render(
      <MemoryRouter>
        <ShifaMedicalPassportModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    // Step 1 -> 2
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    // Step 2 -> 3
    fireEvent.click(await screen.findByRole('button', { name: /Continue/i }));
    expect(await screen.findByText(/3\. Drug & Food Allergies Sentinel/i)).toBeInTheDocument();

    // Step 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(await screen.findByText(/4\. Emergency Lifeline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Health Profile/i })).toBeInTheDocument();
  });

  it('calls profilesRepo.updateProfile with user_id and entered fields when clicking Save Health Profile', async () => {
    const handleCompleted = vi.fn();
    render(
      <MemoryRouter>
        <ShifaMedicalPassportModal isOpen={true} onClose={vi.fn()} onCompleted={handleCompleted} />
      </MemoryRouter>
    );

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Continue/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Continue/i }));

    const saveBtn = await screen.findByRole('button', { name: /Save Health Profile/i });
    expect(saveBtn).toBeInTheDocument();

    fireEvent.click(saveBtn);

    expect(profilesRepo.updateProfile).toHaveBeenCalledWith(
      'profile-123',
      expect.objectContaining({
        user_id: 'user-123',
        full_name: 'Sarah Connor',
        sex: 'female',
        onboarding_completed: true,
      })
    );

    expect(await screen.findByText(/Your Health Profile is Complete!/i)).toBeInTheDocument();
    expect(localStorage.getItem('curewell_onboarding_completed_profile-123')).toBe('true');
  });

  it('handles skip by setting local and session storage without database write', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <ShifaMedicalPassportModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    const skipBtn = screen.getByRole('button', { name: /Skip for now/i });
    fireEvent.click(skipBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(profilesRepo.updateProfile).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('curewell_onboarding_dismissed_profile-123')).toBe('true');
    expect(localStorage.getItem('curewell_onboarding_completed_profile-123')).toBe('dismissed');
  });

  it('renders ShifaPassportBanner with Patient Health Profile and Complete Health Profile when not completed', () => {
    const handleOpen = vi.fn();
    render(<ShifaPassportBanner onOpenPassport={handleOpen} />);

    expect(screen.getByText(/Patient Health Profile/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Complete Health Profile/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('hides ShifaPassportBanner when local completed flag is true in localStorage', () => {
    localStorage.setItem('curewell_onboarding_completed_profile-123', 'true');
    const { container } = render(<ShifaPassportBanner onOpenPassport={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
