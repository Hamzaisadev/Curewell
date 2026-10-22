import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { requestNotificationPermission, sendLocalNotification } from '../../lib/notifications';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import {
  DownloadIcon,
  CheckIcon,
  AndroidIcon,
  ClockIcon,
  ShieldIcon,
  CopyIcon,
} from '../../components/ui/icons';

export function DownloadApkPage() {
  const { user, activeProfile, signInWithSmartQr } = useAuth();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [notifState, setNotifState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [pairedName, setPairedName] = useState<string | null>(null);
  const [pairedEmail, setPairedEmail] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [rawPairToken, setRawPairToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // 1. Process Smart QR pairing token from URL and sign in automatically
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairToken = params.get('pair');
    if (pairToken) {
      setRawPairToken(pairToken);
      signInWithSmartQr(pairToken).then((res) => {
        if (!res.error && res.payload) {
          setPairedName(res.payload.profileName || null);
          setPairedEmail(res.payload.userEmail || null);
          setPairingCode(res.payload.pairingCode || null);
        }
      });
    }
  }, [signInWithSmartQr]);

  const handleTestNotification = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      setNotifState('granted');
      await sendLocalNotification('Curewell Medication Reminder', {
        body: 'Notifications are on. Dose reminders will appear here.',
        icon: '/favicon.svg',
      });
    } else {
      setNotifState('denied');
    }
  };

  const handleCopySmartToken = async () => {
    if (!rawPairToken) return;
    try {
      await navigator.clipboard.writeText(rawPairToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    } catch {
      // ignore
    }
  };

  const displayName = pairedName || activeProfile?.full_name || null;
  const displayEmail = pairedEmail || user?.email || null;
  const deepLinkUrl = rawPairToken
    ? `curewell://pair?pair=${encodeURIComponent(rawPairToken)}`
    : 'curewell://open';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand & Status */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <AndroidIcon size={14} />
            <span>Android APK Package • v4.0.0</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white">
            Installing Curewell on Your Phone
          </h1>

          {displayName ? (
            <div className="inline-flex flex-col items-center gap-1 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckIcon size={14} />
                <span>Smart QR Verified: {displayName}</span>
              </p>
              {displayEmail && (
                <p className="text-[11px] text-slate-300">{displayEmail}</p>
              )}
              {pairingCode && (
                <p className="text-[11px] text-teal-300 font-mono">
                  Pairing Code: <strong>{pairingCode.slice(0, 3)}-{pairingCode.slice(3)}</strong>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Medical records, blood pressure and glucose logging, dose tracking, and dose reminders.
            </p>
          )}
        </div>

        {/* Download Action Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-teal-400 font-medium">
            <span className={`w-2 h-2 rounded-full bg-teal-400 ${downloadStarted ? '' : 'animate-pulse'}`} />
            <span>
              {downloadStarted ? 'Download started. Check your notifications or downloads folder.' : 'Ready to download package.'}
            </span>
          </div>

          <a
            href="/downloads/Curewell.apk"
            download="Curewell.apk"
            onClick={() => setDownloadStarted(true)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-600/30 transition-all active:scale-[0.98]"
          >
            <DownloadIcon size={18} />
            <span>Download Curewell.apk</span>
          </a>

          <p className="text-2xs text-slate-400">
            Tap the button above to begin downloading the Android package directly to your device.
          </p>
        </div>

        {/* Instant Auto-Sign-In Handoff Box (For Installed APK) */}
        <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                Sign in without a password
              </span>
              <h2 className="text-xs font-bold text-white mt-0.5">
                Already Installed the APK?
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Auto-Login
            </span>
          </div>

          <p className="text-2xs text-slate-300 leading-relaxed">
            Once you install <strong>Curewell.apk</strong>, tap the button below to launch the app and sign into{' '}
            <strong>{displayName || 'your account'}</strong> automatically. You can also scan the same QR code inside the app.
          </p>

          <div className="flex flex-col gap-2">
            <a
              href={deepLinkUrl}
              onClick={handleCopySmartToken}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all active:scale-[0.98]"
            >
              <CheckIcon size={15} />
              <span>Open App and Sign In</span>
            </a>

            {rawPairToken && (
              <button
                type="button"
                onClick={handleCopySmartToken}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-2xs font-semibold transition-colors"
              >
                {copiedToken ? (
                  <>
                    <CheckIcon size={13} className="text-emerald-400" />
                    <span>Sign-in token copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={13} />
                    <span>Copy sign-in token</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3 Step Installation Visual Guide */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            3 Steps to Complete Installation
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-2xs">
                1
              </span>
              <div>
                <strong className="text-white block font-semibold">Open Download Notification</strong>
                <span className="text-slate-400 text-2xs leading-relaxed">
                  Pull down your notification bar and tap <strong className="text-slate-200">Curewell.apk</strong> when complete.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-2xs">
                2
              </span>
              <div>
                <strong className="text-white block font-semibold">Allow &apos;Install from this source&apos;</strong>
                <span className="text-slate-400 text-2xs leading-relaxed">
                  If Android shows a security prompt, tap <strong className="text-slate-200">Settings</strong> and turn ON &apos;Allow from this source&apos;.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-2xs">
                3
              </span>
              <div>
                <strong className="text-white block font-semibold">Tap Install</strong>
                <span className="text-slate-400 text-2xs leading-relaxed">
                  Tap <strong className="text-slate-200">Install</strong>, then tap <strong className="text-emerald-400">Open App and Sign In</strong> above (or scan the same QR code inside the app).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Check Card */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <ClockIcon size={16} className="text-teal-400 shrink-0" />
            <div>
              <strong className="text-xs text-white block">Scheduled Dose Notifications</strong>
              <span className="text-2xs text-slate-400">
                Receive lock-screen alerts for scheduled morning, afternoon, and bedtime doses.
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestNotification}
            className="w-full text-xs"
          >
            {notifState === 'granted' ? (
              <>
                <CheckIcon size={14} className="mr-1.5 text-emerald-400" /> Notifications enabled
              </>
            ) : notifState === 'denied' ? (
              'Notifications blocked in browser settings'
            ) : (
              'Send test notification'
            )}
          </Button>
        </div>

        {/* Instant Access Options (Signed In Automatically) */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
          <Link
            to={rawPairToken ? `/companion?pair=${encodeURIComponent(rawPairToken)}` : '/companion'}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-teal-400 font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShieldIcon size={14} />
            <span>Open Quick Companion</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open Full Curewell App</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
