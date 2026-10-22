import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
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

  const initialEmail = (location.state as { email?: string })?.email || '';
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
          navigate('/');
        } else {
          setSignInMethod('qr');
          setErrorMessage(res.error);
        }
      });
    }
  }, [signInWithSmartQr, navigate]);

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
      navigate('/');
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
          navigate('/');
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
      navigate('/');
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
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Professional Medical OS Deck (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6 pr-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-subtle border border-accent/20 text-xs font-semibold text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Clinical Health OS
              </div>
              <h2 className="text-3xl font-black tracking-tight text-content leading-tight">
                Your medical history, <span className="gradient-text-teal">structured and actionable.</span>
              </h2>
              <p className="text-xs text-content-muted leading-relaxed">
                Digitize handwritten prescriptions, track laboratory biomarkers over time, and securely share verified health summaries.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-raised border border-line-strong">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-content">Multilingual Prescription OCR</p>
                  <p className="text-content-subtle text-[11px]">Instant extraction of medications, dosages, and schedules</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-raised border border-line-strong">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Activity size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-content">ADA / AHA Biomarker Tracking</p>
                  <p className="text-content-subtle text-[11px]">Automatic range analysis for HbA1c, Lipids, and Blood Pressure</p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-content-subtle flex items-center gap-2">
              <ShieldCheck size={14} className="text-teal-600 shrink-0" />
              <span>Offline-first architecture with encrypted local storage</span>
            </div>
          </div>

          {/* Right Column: Dual-Mode Sign In Form (Email/Password OR Smart QR Code) */}
          <div className="lg:col-span-7 w-full max-w-md mx-auto">
            <div className="text-center space-y-2 mb-5">
              <div className="flex justify-center mb-2">
                <Logo size="lg" />
              </div>
              <h1 className="text-2xl font-black text-content tracking-tight">Sign In to Curewell</h1>
              <p className="text-xs text-content-muted">
                Sign in with your Email &amp; Password or scan the Smart QR Code from your web browser
              </p>
            </div>

            <Card className="p-6 sm:p-8 shadow-sm glass-card border border-line rounded-2xl space-y-5">
              {/* Two-Way Sign-In Method Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface border border-line">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setSignInMethod('credentials');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    signInMethod === 'credentials'
                      ? 'bg-accent text-content-onaccent shadow-xs'
                      : 'text-content-muted hover:text-content'
                  }`}
                >
                  <KeyRound size={14} />
                  <span>Email &amp; Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSignInMethod('qr');
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    signInMethod === 'qr'
                      ? 'bg-accent text-content-onaccent shadow-xs'
                      : 'text-content-muted hover:text-content'
                  }`}
                >
                  <QrCode size={14} />
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
                <div className="space-y-4">
                  {/* Google OAuth One-Click Sign In */}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isGoogleLoading}
                    loading={isGoogleLoading}
                    className="w-full h-11 text-xs font-bold border border-line bg-surface hover:bg-surface-raised flex items-center justify-center gap-2.5 transition-all shadow-2xs"
                  >
                    {!isGoogleLoading && <GoogleIcon className="w-4 h-4 shrink-0" />}
                    <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </Button>

                  <div className="relative flex items-center justify-center py-0.5">
                    <div className="border-t border-line w-full" />
                    <span className="bg-surface px-3 text-[11px] font-semibold text-content-subtle uppercase tracking-wider shrink-0">
                      or sign in with email
                    </span>
                    <div className="border-t border-line w-full" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content text-xs font-semibold select-none"
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
                    className="w-full h-12 text-sm font-bold tap-spring"
                    loading={isLoading}
                  >
                    Sign In
                  </Button>
                </form>
              </div>
            ) : (
                /* METHOD 2: SMART QR CODE AUTO-SIGN-IN */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface border border-line text-center space-y-3">
                    {cameraActive ? (
                      <div className="space-y-3">
                        <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-teal-500">
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                          />
                          <div className="absolute inset-4 border-2 border-teal-400/70 rounded-xl pointer-events-none" />
                        </div>
                        <p className="text-2xs text-content-muted">
                          Point camera at the <strong>Smart QR Code</strong> on your web browser (&ldquo;Phone App / APK&rdquo; button).
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={stopCamera}
                          className="w-full text-xs"
                        >
                          Close Camera
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                          <QrCode size={26} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-content">
                            Instant Sign-In via Smart QR
                          </h3>
                          <p className="text-2xs text-content-muted leading-relaxed">
                            Open Curewell on your computer, click <strong>Phone App / APK</strong> in the top bar, and scan the custom QR code.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={handleStartCameraScan}
                            className="text-xs h-10 font-bold"
                          >
                            <Camera size={15} className="mr-1.5" />
                            Scan QR with Camera
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handlePasteFromClipboard}
                            className="text-xs h-10 font-bold"
                          >
                            <ClipboardPaste size={15} className="mr-1.5" />
                            Paste Smart Link
                          </Button>
                        </div>
                      </>
                    )}

                    {cameraError && (
                      <p className="text-2xs text-amber-500 font-medium pt-1">{cameraError}</p>
                    )}
                  </div>

                  {/* Manual Smart QR Token / Pairing Code Form */}
                  <form onSubmit={handleSmartQrSubmit} className="space-y-3">
                    <Field
                      id="smart-qr-input"
                      label="Or Enter Smart QR Link / 6-Digit Pairing Code"
                    >
                      <Input
                        type="text"
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        placeholder="e.g. 482-910 or paste Smart QR link"
                        disabled={isLoading}
                      />
                    </Field>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-11 text-xs font-bold"
                      loading={isLoading}
                    >
                      Verify Smart QR &amp; Sign In Automatically
                    </Button>
                  </form>
                </div>
              )}

              {/* Desktop-Only Sign Up Link (Phone/Mobile is Sign-In Only) */}
              <div className="hidden md:block mt-6 pt-5 border-t border-line text-center text-xs text-content-muted">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleGoToSignUp}
                  className="text-accent font-bold hover:underline inline-block"
                >
                  Create an account on Web
                </button>
              </div>
            </Card>

            <div className="text-center text-[11px] text-content-subtle mt-4">
              Protected by patient data privacy standards &amp; encrypted storage.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
