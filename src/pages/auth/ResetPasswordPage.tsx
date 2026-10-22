import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { CheckIcon, AlertTriangleIcon, ShieldIcon } from '../../components/ui/icons';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkRecoverySession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setHasValidSession(true);
        } else {
          // Check if code or access token is in URL hash or query params
          const url = new URL(window.location.href);
          const hasCode = url.searchParams.get('code');
          if (hasCode) {
            const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(hasCode);
            if (!exchangeErr) {
              setHasValidSession(true);
            }
          }
        }
      } catch (err) {
        console.warn('Session check on reset password page:', err);
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Your password has been changed successfully!');
        setTimeout(() => {
          navigate('/settings', { replace: true });
        }, 2000);
      }
    } catch {
      setErrorMessage('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-black text-content tracking-tight">Create New Password</h1>
            <p className="text-xs text-content-muted">
              Choose a secure, strong password for your Curewell patient account.
            </p>
          </div>

          <Card className="p-6 sm:p-8 shadow-sm glass-card border border-line">
            {isCheckingSession ? (
              <div className="py-8 text-center text-sm text-content-muted">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Verifying your secure reset token...
              </div>
            ) : !hasValidSession && !successMessage ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertTriangleIcon size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-content">Link Expired or Invalid</h2>
                  <p className="text-xs text-content-muted mt-1 leading-relaxed">
                    This password reset link has either expired or has already been used. Please request a new link from the forgot password page.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Link to="/forgot-password">
                    <Button variant="primary" className="w-full">
                      Request New Reset Link
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="ghost" className="w-full text-xs">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-risk-bg border border-risk-border text-xs text-risk-text font-medium flex items-center gap-2">
                    <AlertTriangleIcon size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 font-semibold flex items-center gap-2">
                    <CheckIcon size={16} className="shrink-0" />
                    <span>{successMessage} Redirecting to settings...</span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-accent-subtle/50 border border-accent/20 text-xs text-content-muted flex items-start gap-2.5">
                  <ShieldIcon size={16} className="text-accent shrink-0 mt-0.5" />
                  <span>
                    Your connection to Curewell is end-to-end encrypted. Passwords are never stored in plain text.
                  </span>
                </div>

                <Field id="new-password" label="New Password" required hint="Must be at least 6 characters">
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      required
                      disabled={isLoading || Boolean(successMessage)}
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-content-subtle hover:text-content text-xs font-semibold select-none focus-visible:outline-2 focus-visible:outline-accent rounded-md"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </Field>

                <Field id="confirm-password" label="Confirm New Password" required>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      required
                      disabled={isLoading || Boolean(successMessage)}
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-content-subtle hover:text-content text-xs font-semibold select-none focus-visible:outline-2 focus-visible:outline-accent rounded-md"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </Field>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-12 text-sm font-bold"
                  loading={isLoading}
                  disabled={Boolean(successMessage)}
                >
                  Update Password
                </Button>

                <div className="text-center pt-2">
                  <Link to="/settings" className="text-xs text-content-muted hover:text-content transition-colors">
                    Cancel and return to Settings
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
