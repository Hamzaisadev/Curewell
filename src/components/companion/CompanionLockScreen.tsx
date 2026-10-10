import { useState, useEffect } from 'react';
import {
  verifyCompanionPin,
  setCompanionPin,
  hasCompanionPin,
  isBiometricsAvailable,
  isBiometricsEnabled,
  authenticateWithBiometrics,
} from '../../lib/security/companionPairing';
import { Logo } from '../ui/Logo';
import { LockIcon, UnlockIcon } from '../ui/icons';

interface CompanionLockScreenProps {
  onUnlocked: () => void;
  onSignOutFallback: () => void;
  initialMode?: 'unlock' | 'setup';
  profileName?: string;
}

export function CompanionLockScreen({
  onUnlocked,
  onSignOutFallback,
  initialMode,
  profileName = 'Caregiver',
}: CompanionLockScreenProps) {
  const [mode] = useState<'unlock' | 'setup'>(() => {
    if (initialMode) return initialMode;
    return hasCompanionPin() ? 'unlock' : 'setup';
  });

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [biometricsReady, setBiometricsReady] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const triggerHaptic = (ms: number | number[] = 15) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignore unsupported
      }
    }
  };

  useEffect(() => {
    isBiometricsAvailable().then((avail) => {
      setBiometricsReady(avail && isBiometricsEnabled());
    });
  }, []);

  const handleBiometricAuth = async () => {
    setError(null);
    const success = await authenticateWithBiometrics();
    if (success) {
      triggerHaptic(30);
      onUnlocked();
    }
  };

  // Attempt biometrics on initial mount if available and in unlock mode
  useEffect(() => {
    if (mode === 'unlock' && biometricsReady) {
      handleBiometricAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricsReady, mode]);

  const handleKeyPress = (num: string) => {
    triggerHaptic(12);
    setError(null);

    if (mode === 'unlock') {
      if (pin.length < 4) {
        const next = pin + num;
        setPin(next);
        if (next.length === 4) {
          submitUnlockPin(next);
        }
      }
    } else {
      // Setup mode
      if (setupStep === 'enter') {
        if (pin.length < 4) {
          const next = pin + num;
          setPin(next);
          if (next.length === 4) {
            setSetupStep('confirm');
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const next = confirmPin + num;
          setConfirmPin(next);
          if (next.length === 4) {
            submitSetupPin(pin, next);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    triggerHaptic(15);
    setError(null);

    if (mode === 'unlock') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (setupStep === 'enter') {
        setPin((prev) => prev.slice(0, -1));
      } else {
        if (confirmPin.length === 0) {
          setSetupStep('enter');
        } else {
          setConfirmPin((prev) => prev.slice(0, -1));
        }
      }
    }
  };

  const submitUnlockPin = async (inputPin: string) => {
    setIsVerifying(true);
    try {
      const res = await verifyCompanionPin(inputPin);
      if (res.success) {
        triggerHaptic(40);
        onUnlocked();
      } else {
        triggerHaptic([40, 60, 40]);
        setError(res.error || 'Incorrect PIN');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPin('');
      }
    } catch {
      setError('An error occurred during verification.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const submitSetupPin = async (firstPin: string, secondPin: string) => {
    if (firstPin !== secondPin) {
      triggerHaptic([40, 60, 40]);
      setError('PINs do not match. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
      setConfirmPin('');
      setSetupStep('enter');
      return;
    }

    try {
      await setCompanionPin(firstPin);
      triggerHaptic(40);
      onUnlocked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save PIN.');
      setPin('');
      setConfirmPin('');
      setSetupStep('enter');
    }
  };

  const activeDigitsCount =
    mode === 'unlock'
      ? pin.length
      : setupStep === 'enter'
      ? pin.length
      : confirmPin.length;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 select-none max-w-md mx-auto">
      {/* Top Branding */}
      <div className="pt-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-2">
          {mode === 'unlock' ? <LockIcon size={24} /> : <UnlockIcon size={24} />}
        </div>
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          {mode === 'unlock'
            ? `Welcome back, ${profileName}`
            : setupStep === 'enter'
            ? 'Set a 4-Digit Quick PIN'
            : 'Confirm Your 4-Digit PIN'}
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          {mode === 'unlock'
            ? 'Enter your PIN to securely access today’s medicines, vitals, and emergency card.'
            : setupStep === 'enter'
            ? 'Quickly unlock the companion app without typing your full account password.'
            : 'Re-enter your 4-digit PIN to confirm.'}
        </p>
      </div>

      {/* PIN Dots Indicator */}
      <div className="py-6 flex flex-col items-center space-y-3">
        <div
          className={`flex items-center justify-center gap-5 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < activeDigitsCount;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-teal-400 scale-125 shadow-lg shadow-teal-500/50'
                    : 'bg-slate-700 border border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-400 text-center animate-in fade-in-0 duration-150 px-4">
            {error}
          </p>
        )}
      </div>

      {/* Tactile Keypad */}
      <div className="pb-8 space-y-4">
        <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isVerifying}
              onClick={() => handleKeyPress(digit)}
              className="h-16 w-full rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-teal-600/30 text-2xl font-semibold text-white border border-slate-700/60 shadow-xs flex items-center justify-center transition-all active:scale-95 touch-manipulation"
            >
              {digit}
            </button>
          ))}

          {/* Left Action: Biometrics or Blank */}
          {mode === 'unlock' && biometricsReady ? (
            <button
              type="button"
              onClick={handleBiometricAuth}
              className="h-16 w-full rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 active:bg-teal-500/30 text-teal-400 border border-teal-500/30 flex items-center justify-center transition-all active:scale-95 touch-manipulation"
              aria-label="Unlock with biometrics"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.006.99-4.128.99-6.132a8 8 0 00-16 0c0 .77.062 1.527.18 2.268"
                />
              </svg>
            </button>
          ) : (
            <div className="h-16" />
          )}

          {/* Zero */}
          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleKeyPress('0')}
            className="h-16 w-full rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-teal-600/30 text-2xl font-semibold text-white border border-slate-700/60 shadow-xs flex items-center justify-center transition-all active:scale-95 touch-manipulation"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-16 w-full rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-slate-300 border border-slate-700/60 shadow-xs flex items-center justify-center transition-all active:scale-95 touch-manipulation"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0110.828 5H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.172a2 2 0 01-1.414-.586L3 12z"
              />
            </svg>
          </button>
        </div>

        {/* Fallback & Reset Links */}
        <div className="pt-2 text-center space-y-2">
          <button
            type="button"
            onClick={onSignOutFallback}
            className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
          >
            Forgot PIN? Sign in with Account Password
          </button>
        </div>
      </div>
    </div>
  );
}
