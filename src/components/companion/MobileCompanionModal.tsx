import { useState, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { useAuth } from '../../lib/auth/AuthContext';
import { generateQrSvgUrl } from '../../lib/qr/qrGenerator';
import { createSmartQrPairingToken } from '../../lib/security/companionPairing';
import { Button } from '../ui/Button';
import {
  XIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  AndroidIcon,
  ClockIcon,
  ShieldIcon,
} from '../ui/icons';

interface MobileCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCompanionModal({ isOpen, onClose }: MobileCompanionModalProps) {
  const { user, session, activeProfile } = useAuth();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Build Smart QR Code (APK Download + Instant Account Auto-Sign-In) with Curewell Logo
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function buildQr() {
      const baseUrl = `${window.location.origin}/download/apk`;

      if (user && activeProfile) {
        try {
          const { token, pairingCode: code } = await createSmartQrPairingToken({
            userId: user.id,
            profileId: activeProfile.id,
            profileName: activeProfile.full_name,
            userEmail: user.email,
            refreshToken: session?.refresh_token,
          });
          if (!isMounted) return;
          const fullUrl = `${baseUrl}?pair=${encodeURIComponent(token)}`;
          setDownloadLink(fullUrl);
          setPairingCode(code);
          setQrUrl(generateQrSvgUrl(fullUrl, 220, { withLogo: true }));
        } catch {
          setDownloadLink(baseUrl);
          setQrUrl(generateQrSvgUrl(baseUrl, 220, { withLogo: true }));
        }
      } else {
        setDownloadLink(baseUrl);
        setQrUrl(generateQrSvgUrl(baseUrl, 220, { withLogo: true }));
      }
    }

    buildQr();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, session?.refresh_token, activeProfile]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  const formattedCode = pairingCode
    ? `${pairingCode.slice(0, 3)}-${pairingCode.slice(3)}`
    : '';

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <RadixDialog.Portal>
        {/* Full Viewport Backdrop */}
        <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        {/* Perfectly Centered Content */}
        <RadixDialog.Content
          aria-describedby="mobile-companion-desc"
          className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-surface-raised border border-line p-5 sm:p-6 shadow-2xl space-y-4 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <AndroidIcon size={20} />
              </span>
              <div>
                <RadixDialog.Title className="text-base font-bold text-content tracking-tight">
                  Install &amp; Auto-Sign In on Phone
                </RadixDialog.Title>
                <p id="mobile-companion-desc" className="text-xs text-content-muted mt-0.5">
                  One Smart QR code to install the Android APK and sign in automatically.
                </p>
              </div>
            </div>

            <RadixDialog.Close asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-hover transition-colors focus-visible:outline-2 focus-visible:outline-accent"
                aria-label="Close modal"
              >
                <XIcon size={18} />
              </button>
            </RadixDialog.Close>
          </div>

          {/* Branded Smart QR Code Hero Stage */}
          <div className="flex flex-col items-center bg-surface border border-line rounded-2xl p-4 text-center space-y-3">
            <div className="relative bg-white p-3 rounded-2xl shadow-md border-2 border-teal-500/30 inline-block">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Curewell Smart QR Code with Logo"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-sm text-slate-400">
                  Generating Smart QR...
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Smart QR: Installs APK + Auto-Signs In
              </span>

              {activeProfile && (
                <p className="text-xs font-semibold text-content">
                  Linked to: <span className="text-teal-600 dark:text-teal-400">{activeProfile.full_name}</span>
                  {user?.email ? ` (${user.email})` : ''}
                </p>
              )}

              <p className="text-2xs text-content-muted max-w-xs mx-auto leading-relaxed">
                Scan with your phone camera to download the APK, or scan inside the Curewell app to sign in automatically without typing your password.
              </p>
            </div>

            {/* 6-Digit Smart Pairing Code Pill */}
            {formattedCode && (
              <div className="w-full pt-2 border-t border-line flex items-center justify-between gap-2 px-2">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-content-subtle block">
                    Quick Pairing Code
                  </span>
                  <span className="text-sm font-mono font-black tracking-widest text-teal-600 dark:text-teal-400">
                    {formattedCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-hover border border-line text-2xs font-semibold text-content inline-flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <CheckIcon size={12} className="text-emerald-500" /> Copied Code
                    </>
                  ) : (
                    <>
                      <CopyIcon size={12} /> Copy Code
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 3 Step Visual Guide */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-surface border border-line text-center space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                1
              </span>
              <strong className="text-xs font-semibold text-content block">Scan Smart QR</strong>
              <span className="text-2xs text-content-muted block leading-tight">
                Opens download page
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-line text-center space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                2
              </span>
              <strong className="text-xs font-semibold text-content block">Install APK</strong>
              <span className="text-2xs text-content-muted block leading-tight">
                Tap Curewell.apk
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-line text-center space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                3
              </span>
              <strong className="text-xs font-semibold text-content block">Auto-Sign In</strong>
              <span className="text-2xs text-content-muted block leading-tight">
                1-tap or scan QR!
              </span>
            </div>
          </div>

          {/* Full Features + Notifications Callout */}
          <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-start gap-2.5">
            <ClockIcon size={16} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <strong className="font-semibold text-content block flex items-center gap-1.5">
                <span>Dose Notifications, Quick BP/Sugar &amp; Full App</span>
                <ShieldIcon size={13} className="text-teal-500" />
              </strong>
              <p className="text-2xs text-content-muted leading-relaxed">
                Includes lock-screen dose alarms, 10-second BP &amp; blood sugar logging, plus every full Curewell feature synced live.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 border-t border-line">
            <a
              href="/downloads/Curewell.apk"
              download="Curewell.apk"
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
            >
              <DownloadIcon size={15} />
              <span>Download APK Directly</span>
            </a>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="w-full sm:w-auto text-xs"
            >
              {copiedLink ? (
                <>
                  <CheckIcon size={14} className="mr-1.5 text-emerald-600" /> Copied Smart Link
                </>
              ) : (
                <>
                  <CopyIcon size={14} className="mr-1.5" /> Copy Smart Link
                </>
              )}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
