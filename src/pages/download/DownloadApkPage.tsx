import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { verifyCompanionPairingToken } from '../../lib/security/companionPairing';
import { requestNotificationPermission, sendLocalNotification } from '../../lib/notifications';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import {
  DownloadIcon,
  CheckIcon,
  AndroidIcon,
  ClockIcon,
  ShieldIcon,
} from '../../components/ui/icons';

export function DownloadApkPage() {
  const { switchProfile } = useAuth();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [notifState, setNotifState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [pairedName, setPairedName] = useState<string | null>(null);

  // 1. Process pairing token from QR if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairToken = params.get('pair');
    if (pairToken) {
      verifyCompanionPairingToken(pairToken).then((res) => {
        if (res.valid && res.payload) {
          if (res.payload.profileId) {
            switchProfile(res.payload.profileId).catch(console.warn);
          }
          setPairedName(res.payload.profileName || null);
        }
      });
    }
  }, [switchProfile]);

  // 2. Automatically trigger APK download on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const link = document.createElement('a');
      link.href = '/downloads/Curewell.apk';
      link.download = 'Curewell.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadStarted(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleTestNotification = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      setNotifState('granted');
      await sendLocalNotification('Curewell Medication Reminder', {
        body: 'Notifications are active! Your morning, afternoon, and bedtime dose alerts will appear here.',
        icon: '/favicon.svg',
      });
    } else {
      setNotifState('denied');
    }
  };

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

          {pairedName ? (
            <p className="text-xs text-emerald-400 font-semibold">
              Paired with profile: {pairedName}
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Personal health vault, dose tracker, and emergency SOS card.
            </p>
          )}
        </div>

        {/* Download Action Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-teal-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>
              {downloadStarted ? 'Download initiated automatically!' : 'Starting download...'}
            </span>
          </div>

          <a
            href="/downloads/Curewell.apk"
            download="Curewell.apk"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-600/30 transition-all active:scale-[0.98]"
          >
            <DownloadIcon size={18} />
            <span>Download Curewell.apk</span>
          </a>

          <p className="text-2xs text-slate-400">
            Tap button above if your browser did not start the download automatically.
          </p>
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
                <strong className="text-white block font-semibold">Tap Install &amp; Launch</strong>
                <span className="text-slate-400 text-2xs leading-relaxed">
                  Tap <strong className="text-slate-200">Install</strong>. The Curewell app icon will appear directly on your phone home screen!
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
                <CheckIcon size={14} className="mr-1.5 text-emerald-400" /> Notifications Enabled &amp; Tested!
              </>
            ) : notifState === 'denied' ? (
              'Notifications blocked in browser settings'
            ) : (
              'Test Push Notification Permission'
            )}
          </Button>
        </div>

        {/* Fallback Option */}
        <div className="pt-2 text-center border-t border-slate-800">
          <Link
            to="/companion"
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <ShieldIcon size={14} />
            <span>Or open instant Mobile Web Companion</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
