import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShifaMedicalPassportModal } from '../ShifaMedicalPassportModal';
import { ShifaPassportBanner } from '../ShifaPassportBanner';
import { MemoryRouter } from 'react-router-dom';

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

describe('Shifa Medical Passport Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Shifa welcoming header and Step 1 biological baseline', () => {
    render(
      <MemoryRouter>
        <ShifaMedicalPassportModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Shifa Wants to Know You/i)).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: /Save & Activate Passport/i })).toBeInTheDocument();
  });

  it('renders ShifaPassportBanner when profile onboarding is not completed', () => {
    const handleOpen = vi.fn();
    render(<ShifaPassportBanner onOpenPassport={handleOpen} />);

    expect(screen.getByText(/Shifa Health Passport/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Complete with Shifa/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });
});
