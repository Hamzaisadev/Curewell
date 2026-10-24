import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { GoogleIcon } from '../../components/ui/GoogleIcon';
import {
  ShieldCheck,
  FileText,
  Activity,
  CheckCircle2,
  Mail,
  QrCode,
  Camera,
  ClipboardPaste,
  KeyRound,
} from 'lucide-react';

type SignInMethod = 'credentials' | 'qr';

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signInWithEmail,
    signInWithGoogle,
    signInWithSmartQr,
    needsEmailVerification,
    pendingVerificationEmail,
    resendVerificationEmail,
    clearVerificationState,
  } = useAuth();

  const locationState = location.state as { from?: { pathname: string; search?: string }; email?: string } | null;
  const initialEmail = locationState?.email || '';
  const redirectTarget = locationState?.from
    ? `${locationState.from.pathname}${locationState.from.search || ''}`
    : '/';

  const navigateToDestination = useCallback(() => {
    navigate(redirectTarget, { replace: true });
  }, [navigate, redirectTarget]);

  const [signInMethod, setSignInMethod] = useState<SignInMethod>('credentials');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestSignUp, setSuggestSignUp] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Smart QR Scanner & Token Input State
  const [qrInput, setQrInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  // 1. Automatically sign in if opened with `?pair=<smart_qr_token>`
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairToken = params.get('pair');
    if (pairToken) {
      setIsLoading(true);
      signInWithSmartQr(pairToken).then((res) => {
        setIsLoading(false);
        if (!res.error) {
          navigateToDestination();
        } else {
          setSignInMethod('qr');
          setErrorMessage(res.error);
        }
      });
    }
  }, [signInWithSmartQr, navigateToDestination]);

  // 2. Cleanup camera stream when unmounting or switching tabs
  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleStartCameraScan = async () => {
    setCameraError(null);
    setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Camera access is not available in this browser context. Paste your Smart QR link or 6-digit pairing code below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      // Use native BarcodeDetector API (supported on Android Chrome / WebView)
      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
        }
      ).BarcodeDetector;

      if (BarcodeDetectorCtor) {
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue;
            if (raw) {
              stopCamera();
              setQrInput(raw);
              setIsLoading(true);
              const res = await signInWithSmartQr(raw);
              setIsLoading(false);
              if (!res.error) {
                navigate('/');
              } else {
                setErrorMessage(res.error);
              }
            }
          } catch {
            // Frame scan error — continue scanning next frame
          }
        }, 350);
      }
    } catch {
      setCameraError(
        'Could not access camera. You can also scan with your Android camera app or paste the Smart QR code below.'
      );
    }
  };

  const handleSmartQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setErrorMessage('Please scan a Smart QR code or enter your pairing code / link.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithSmartQr(qrInput.trim());
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      stopCamera();
      navigateToDestination();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQrInput(text.trim());
        setErrorMessage(null);
        setIsLoading(true);
        const { error } = await signInWithSmartQr(text.trim());
        setIsLoading(false);
        if (!error) {
          stopCamera();
          navigateToDestination();
        } else {
          setErrorMessage(error);
        }
      }
    } catch {
      setErrorMessage('Clipboard access denied. Please long-press the input box and tap Paste.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuggestSignUp(false);
    setResendSuccess(false);

    const { error } = await signInWithEmail(trimmedEmail, password);

    if (error) {
      setErrorMessage(error);
      setIsLoading(false);
      if (
        error.toLowerCase().includes('incorrect') ||
        error.toLowerCase().includes('invalid') ||
        error.toLowerCase().includes('not found')
      ) {
        setSuggestSignUp(true);
      }
    } else {
      navigateToDestination();
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = pendingVerificationEmail || email.trim();
    if (!targetEmail) return;

    setResendLoading(true);
    setResendSuccess(false);

    const { error } = await resendVerificationEmail(targetEmail);

    setResendLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    }
  };

  const handleGoToSignUp = () => {
    navigate('/signup', { state: { email: email.trim() } });
  };

  return (
    <AppShell>
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 pb-8 sm:pb-12">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Professional Medical OS Deck (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-4 pr-2">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle border border-accent/20 text-xs font-semibold text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Clinical Health OS
              </div>
              <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-content leading-tight">
                Your medical history, <span className="gradient-text-teal">structured and actionable.</span>
              </h2>
              <p className="text-xs text-content-muted leading-relaxed">
                Digitize handwritten prescriptions, track laboratory biomarkers over time, and securely share verified health summaries.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-line-strong">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-content">Multilingual Prescription OCR</p>
                  <p className="text-content-subtle text-[11px]">Instant extraction of medications, dosages, and schedules</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-line-strong">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Activity size={16} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-content">ADA / AHA Biomarker Tracking</p>
                  <p className="text-content-subtle text-[11px]">Automatic range analysis for HbA1c, Lipids, and Blood Pressure</p>
                </div>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-content-subtle flex items-center gap-2">
              <ShieldCheck size={14} className="text-teal-600 shrink-0" />
              <span>Offline-first architecture with encrypted local storage</span>
            </div>
          </div>

          {/* Right Column: Dual-Mode Sign In Form (Email/Password OR Smart QR Code) */}
          <div className="lg:col-span-7 w-full max-w-md mx-auto">
            <div className="text-center space-y-1 mb-3">
              <h1 className="text-2xl font-black text-content tracking-tight">Sign In to Curewell</h1>
              <p className="text-xs text-content-muted">
                Sign in with your Email &amp; Password or scan the Smart QR Code
              </p>
            </div>

            <Card className="p-5 sm:p-6 shadow-sm glass-card border border-line rounded-2xl space-y-4">
              {/* Two-Way Sign-In Method Switcher (Sleek Apple/Linear style segmented pill) */}
              <div
                role="tablist"
                aria-label="Sign-in method"
                className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={signInMethod === 'credentials'}
                  onClick={() => {
                    stopCamera();
                    setSignInMethod('credentials');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                    signInMethod === 'credentials'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-slate-700/60'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                  }`}
                >
                  <KeyRound
                    size={14}
                    className={
                      signInMethod === 'credentials'
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-400'
                    }
                  />
                  <span>Email &amp; Password</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={signInMethod === 'qr'}
                  onClick={() => {
                    setSignInMethod('qr');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                    signInMethod === 'qr'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-slate-700/60'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                  }`}
                >
                  <QrCode
                    size={14}
                    className={
                      signInMethod === 'qr'
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-400'
                    }
                  />
                  <span>Scan Smart QR</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-risk-bg border border-risk-border text-xs text-risk-text font-medium space-y-2">
                  <p>{errorMessage}</p>
                  <div className="pt-1.5 border-t border-risk-border/50">
                    <Link
                      to="/forgot-password"
                      state={{ email: email.trim() }}
                      className="font-bold text-accent hover:underline inline-flex items-center gap-1"
                    >
                      Forgot your password? Reset it &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* METHOD 1: EMAIL & PASSWORD SIGN IN */}
              {signInMethod === 'credentials' ? (
                <div className="space-y-3.5">
                  {/* Google OAuth One-Click Sign In */}
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    size="md"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isGoogleLoading}
                    loading={isGoogleLoading}
                    loadingText="Connecting to Google..."
                    leftIcon={!isGoogleLoading && <GoogleIcon className="w-4 h-4 shrink-0" />}
                    className="rounded-xl text-xs sm:text-sm font-semibold shadow-2xs"
                  >
                    Continue with Google
                  </Button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                    <span className="bg-surface px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                      or sign in with email
                    </span>
                    <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                  {needsEmailVerification && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-content space-y-2">
                      <p className="font-semibold text-amber-500 flex items-center gap-1.5">
                        <Mail size={14} />
                        <span>Email verification required</span>
                      </p>
                      <p className="text-content-muted text-[11px] leading-relaxed">
                        Your email{' '}
                        {pendingVerificationEmail && (
                          <span className="font-semibold text-content">{pendingVerificationEmail}</span>
                        )}{' '}
                        has not been verified yet. Check your inbox for the confirmation link.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs h-8 px-3"
                          loading={resendLoading}
                          onClick={handleResendVerification}
                        >
                          Resend Email
                        </Button>
                        {resendSuccess && (
                          <span className="text-accent text-[11px] font-medium">Link sent</span>
                        )}
                      </div>
                    </div>
                  )}

                  {resendSuccess && !needsEmailVerification && (
                    <div className="p-3 rounded-xl bg-accent-subtle border border-accent text-xs text-accent-onsubtle font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Verification email resent. Please check your inbox.</span>
                    </div>
                  )}

                  <Field id="login-email" label="Email Address" required>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                        if (needsEmailVerification) clearVerificationState();
                        if (suggestSignUp) setSuggestSignUp(false);
                      }}
                      placeholder="name@example.com"
                      autoComplete="email"
                      required
                      disabled={isLoading}
                    />
                  </Field>

                  <Field id="login-password" label="Password" required>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-content-subtle hover:text-content text-xs font-semibold select-none focus-visible:outline-2 focus-visible:outline-accent rounded-md"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </Field>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-content-subtle">Forgot credentials?</span>
                    <Link
                      to="/forgot-password"
                      state={{ email: email.trim() }}
                      className="text-accent hover:text-accent-hover font-bold"
                    >
                      Reset password
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-11 text-sm font-bold tap-spring"
                    loading={isLoading}
                  >
                    Sign In
                  </Button>
                </form>
              </div>
            ) : (
                /* METHOD 2: SMART QR CODE AUTO-SIGN-IN */
                <div className="space-y-4">
                  {cameraActive ? (
                    <div className="p-4 rounded-2xl bg-surface border border-line text-center space-y-3">
                      <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-teal-500 shadow-md">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                        />
                        <div className="absolute inset-4 border-2 border-teal-400/70 rounded-xl pointer-events-none animate-pulse" />
                      </div>
                      <p className="text-xs text-content-muted">
                        Point camera at the <strong>Smart QR Code</strong> on your computer screen (&ldquo;Phone App / APK&rdquo; in the top bar).
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={stopCamera}
                        className="w-full h-10 text-xs font-semibold"
                      >
                        Close Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Guidance Card with Full-Width Single-Line Camera Action */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-center space-y-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-2xs">
                          <QrCode size={26} className="stroke-[2.2]" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm sm:text-base font-bold text-content">
                            Instant Sign-In via Smart QR
                          </h3>
                          <p className="text-xs text-content-muted leading-relaxed max-w-sm mx-auto">
                            Scan the QR code displayed on your computer, or enter your 6-digit pairing code below.
                          </p>
                        </div>

                        {/* Full-width single-line button: never wraps, perfectly centered */}
                        <Button
                          type="button"
                          variant="primary"
                          fullWidth
                          size="md"
                          onClick={handleStartCameraScan}
                          leftIcon={<Camera size={16} />}
                          className="rounded-xl font-bold text-xs sm:text-sm shadow-xs"
                        >
                          Scan QR Code with Camera
                        </Button>

                        {cameraError && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">{cameraError}</p>
                        )}
                      </div>

                      {/* Clean Divider */}
                      <div className="relative flex items-center justify-center py-0.5">
                        <div className="border-t border-line w-full" />
                        <span className="bg-surface px-3 text-[11px] font-semibold text-content-subtle uppercase tracking-wider shrink-0">
                          or enter code / link
                        </span>
                        <div className="border-t border-line w-full" />
                      </div>

                      {/* Manual Smart QR Token / Pairing Code Form with Integrated Paste Button */}
                      <form onSubmit={handleSmartQrSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                          <label htmlFor="smart-qr-token" className="block text-xs font-semibold text-content">
                            6-Digit Pairing Code or Smart QR Link
                          </label>
                          <div className="relative flex items-center">
                            <input
                              id="smart-qr-token"
                              type="text"
                              value={qrInput}
                              onChange={(e) => {
                                setQrInput(e.target.value);
                                if (errorMessage) setErrorMessage(null);
                              }}
                              placeholder="e.g. 482-910 or paste Smart QR link"
                              className="w-full h-11 pl-3.5 pr-20 rounded-xl border border-line bg-surface text-content text-xs sm:text-sm font-mono placeholder:text-content-subtle placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                              autoComplete="off"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={handlePasteFromClipboard}
                              className="absolute right-1.5 px-2.5 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-hover border border-line text-content text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                              title="Paste from clipboard"
                            >
                              <ClipboardPaste size={13} className="text-teal-600 dark:text-teal-400" />
                              <span>Paste</span>
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          fullWidth
                          size="md"
                          disabled={isLoading || !qrInput.trim()}
                          loading={isLoading}
                          loadingText="Verifying code..."
                          leftIcon={<CheckCircle2 size={16} />}
                          className="rounded-xl font-bold text-xs sm:text-sm shadow-xs"
                        >
                          Verify &amp; Sign In
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Sign Up Link */}
              <div className="mt-4 pt-3.5 border-t border-line text-center text-xs text-content-muted">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleGoToSignUp}
                  className="text-accent font-bold hover:underline inline-block"
                >
                  Create an account
                </button>
              </div>
            </Card>

            <div className="text-center text-[11px] text-content-subtle mt-3">
              Protected by patient data privacy standards &amp; encrypted storage.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
