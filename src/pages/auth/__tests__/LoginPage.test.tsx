import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { SignUpPage } from '../SignUpPage';
import { ForgotPasswordPage } from '../ForgotPasswordPage';

const mockSignInWithEmail = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignInWithSmartQr = vi.fn();
const mockSignUpWithEmail = vi.fn();
const mockResendVerificationEmail = vi.fn();
const mockClearVerificationState = vi.fn();
const mockSignOut = vi.fn();

let mockAuthValues = {
  user: null,
  profile: null,
  isGuest: false,
  signOut: mockSignOut,
  signInWithEmail: mockSignInWithEmail,
  signInWithGoogle: mockSignInWithGoogle,
  signInWithSmartQr: mockSignInWithSmartQr,
  signUpWithEmail: mockSignUpWithEmail,
  needsEmailVerification: false,
  pendingVerificationEmail: null as string | null,
  resendVerificationEmail: mockResendVerificationEmail,
  clearVerificationState: mockClearVerificationState,
};

vi.mock('../../../lib/auth/AuthContext', () => ({
  useAuth: () => mockAuthValues,
}));

function renderWithRouter(initialEntry = '/login', initialEmailState?: string) {
  const initialEntries = [
    initialEmailState
      ? { pathname: initialEntry, state: { email: initialEmailState } }
      : initialEntry,
  ];

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<div data-testid="dashboard-page">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LoginPage & Auth Error Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValues = {
      user: null,
      profile: null,
      isGuest: false,
      signOut: mockSignOut,
      signInWithEmail: mockSignInWithEmail,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithSmartQr: mockSignInWithSmartQr,
      signUpWithEmail: mockSignUpWithEmail,
      needsEmailVerification: false,
      pendingVerificationEmail: null,
      resendVerificationEmail: mockResendVerificationEmail,
      clearVerificationState: mockClearVerificationState,
    };
  });

  describe('Task 1: Remove False "No Account Found" Prompt on Wrong Password', () => {
    it('displays "Incorrect email or password. Please try again." and NEVER displays "No account found"', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({
        error: 'Incorrect email or password. Please try again.',
      });

      renderWithRouter('/login');

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'patient@curewell.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      expect(
        await screen.findByText('Incorrect email or password. Please try again.')
      ).toBeInTheDocument();

      // Ensure "No account found" and suggestion to create an account are completely removed
      expect(screen.queryByText(/no account found/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/create an account for/i)).not.toBeInTheDocument();

      // Ensure helpful inline recovery link is displayed
      const resetLink = screen.getByRole('link', {
        name: /forgot your password\? reset it/i,
      });
      expect(resetLink).toBeInTheDocument();
    });

    it('displays error and inline recovery link for generic invalid credentials without suggesting account creation', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({
        error: 'Invalid login credentials',
      });

      renderWithRouter('/login');

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'patient@curewell.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

      expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
      expect(screen.queryByText(/no account found/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /forgot your password\? reset it/i })
      ).toBeInTheDocument();
    });
  });

  describe('Task 2: Clear Stale Error & Verification State When Typing', () => {
    it('clears error banner when typing in the password field', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({
        error: 'Incorrect email or password. Please try again.',
      });

      renderWithRouter('/login');

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'patient@curewell.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      expect(
        await screen.findByText('Incorrect email or password. Please try again.')
      ).toBeInTheDocument();

      // Typing in password field must immediately clear the error
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword2' } });

      expect(
        screen.queryByText('Incorrect email or password. Please try again.')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /forgot your password\? reset it/i })
      ).not.toBeInTheDocument();
    });

    it('clears error banner and verification state when typing in the email field', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({
        error: 'Incorrect email or password. Please try again.',
      });

      renderWithRouter('/login');

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      fireEvent.change(emailInput, { target: { value: 'patient@curewell.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      expect(
        await screen.findByText('Incorrect email or password. Please try again.')
      ).toBeInTheDocument();

      // Typing in email field must immediately clear the error
      fireEvent.change(emailInput, { target: { value: 'corrected@curewell.com' } });

      expect(
        screen.queryByText('Incorrect email or password. Please try again.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Task 3: Pre-fill Email in ForgotPasswordPage from Login State', () => {
    it('passes typed email in route state when clicking "Reset password" and pre-fills ForgotPasswordPage', async () => {
      renderWithRouter('/login');

      const emailInput = screen.getByPlaceholderText('name@example.com');
      fireEvent.change(emailInput, { target: { value: 'caregiver@curewell.org' } });

      const resetPasswordLink = screen.getByRole('link', { name: /^reset password$/i });
      fireEvent.click(resetPasswordLink);

      // Verify ForgotPasswordPage is rendered and email input is prefilled
      expect(
        await screen.findByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument();
      const forgotEmailInput = screen.getByPlaceholderText('name@example.com') as HTMLInputElement;
      expect(forgotEmailInput.value).toBe('caregiver@curewell.org');
    });

    it('passes typed email in route state when clicking inline "Forgot your password? Reset it →"', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({
        error: 'Incorrect email or password. Please try again.',
      });

      renderWithRouter('/login');

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'recovering.patient@curewell.org' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'badpass' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

      const inlineRecoveryLink = await screen.findByRole('link', {
        name: /forgot your password\? reset it/i,
      });
      fireEvent.click(inlineRecoveryLink);

      expect(
        await screen.findByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument();
      const forgotEmailInput = screen.getByPlaceholderText('name@example.com') as HTMLInputElement;
      expect(forgotEmailInput.value).toBe('recovering.patient@curewell.org');
    });
  });

  describe('Task 4: Add Direct Sign-In Action When Sign-Up Detects an Existing Account', () => {
    it('renders "Sign in to your existing account →" link when registration indicates existing account and passes email to login', async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({
        error: 'An account with this email already exists. Try signing in instead.',
        needsVerification: false,
      });

      renderWithRouter('/signup');

      fireEvent.change(screen.getByPlaceholderText('e.g. Ahmed Khan'), {
        target: { value: 'Dr. Fatima Noor' },
      });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'fatima.noor@curewell.org' },
      });
      fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
        target: { value: 'SecurePass123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        await screen.findByText(/an account with this email already exists/i)
      ).toBeInTheDocument();

      const signInLink = screen.getByRole('link', {
        name: /sign in to your existing account/i,
      });
      expect(signInLink).toBeInTheDocument();

      // Clicking link should navigate to /login and prefill the email
      fireEvent.click(signInLink);

      expect(
        await screen.findByRole('heading', { name: /sign in to curewell/i })
      ).toBeInTheDocument();
      const loginEmailInput = screen.getByPlaceholderText('name@example.com') as HTMLInputElement;
      expect(loginEmailInput.value).toBe('fatima.noor@curewell.org');
    });

    it('renders direct sign in link when error mentions "already registered"', async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({
        error: 'User already registered',
        needsVerification: false,
      });

      renderWithRouter('/signup');

      fireEvent.change(screen.getByPlaceholderText('e.g. Ahmed Khan'), {
        target: { value: 'Zayn Malik' },
      });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'zayn@curewell.org' },
      });
      fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
        target: { value: 'Secret987!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        await screen.findByText(/user already registered/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', { name: /sign in to your existing account/i })
      ).toBeInTheDocument();
    });
  });

  describe('Task 5: Email Verification Required Flow', () => {
    it('unverified email state displays "Email verification required" banner and triggers resendVerificationEmail when clicked', async () => {
      mockAuthValues.needsEmailVerification = true;
      mockAuthValues.pendingVerificationEmail = 'unverified.patient@curewell.org';
      mockResendVerificationEmail.mockResolvedValueOnce({ error: null });

      renderWithRouter('/login');

      expect(screen.getByText('Email verification required')).toBeInTheDocument();
      expect(screen.getByText('unverified.patient@curewell.org')).toBeInTheDocument();

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      expect(resendButton).toBeInTheDocument();

      fireEvent.click(resendButton);

      expect(mockResendVerificationEmail).toHaveBeenCalledWith(
        'unverified.patient@curewell.org'
      );

      expect(await screen.findByText('Link sent')).toBeInTheDocument();
    });
  });
});
