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

        {/* Centered Compact Content */}
        <RadixDialog.Content
          aria-describedby="mobile-companion-desc"
          onOpenAutoFocus={(e) => {
            // Prevent Radix from auto-focusing elements further down, which causes vertical scroll jump
            e.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg sm:max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto scrollbar-none rounded-3xl bg-surface-raised border border-line shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {/* Sticky Header - Always visible with backdrop blur */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 bg-surface-raised/95 backdrop-blur-md border-b border-line">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                <AndroidIcon size={20} />
              </span>
              <div className="min-w-0">
                <RadixDialog.Title className="text-base font-bold text-content tracking-tight truncate">
                  Install &amp; Auto-Sign In on Phone
                </RadixDialog.Title>
                <p id="mobile-companion-desc" className="text-xs text-content-muted truncate">
                  Scan Smart QR with camera to download APK and sign in automatically.
                </p>
              </div>
            </div>

            <RadixDialog.Close asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-hover transition-colors focus-visible:outline-2 focus-visible:outline-accent shrink-0 ml-2"
                aria-label="Close modal"
              >
                <XIcon size={18} />
              </button>
            </RadixDialog.Close>
          </div>

          {/* Modal Body: 2-column layout on sm+ screens, compact vertical stack on mobile */}
          <div className="p-4 sm:p-5 sm:grid sm:grid-cols-2 sm:gap-5 flex flex-col gap-3.5">
            {/* Left Column: QR Code & Pairing Code */}
            <div className="flex flex-col items-center bg-surface border border-line rounded-2xl p-3.5 text-center justify-between gap-2.5">
              <div className="relative bg-white p-2.5 rounded-2xl shadow-sm border-2 border-teal-500/30 inline-block shrink-0">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Curewell Smart QR Code with Logo"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-xs text-content-subtle">
                    Generating Smart QR...
                  </div>
                )}
              </div>

              <div className="space-y-1 w-full">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Smart QR: Installs APK + Auto-Signs In
                </span>

                {activeProfile && (
                  <p className="text-xs font-semibold text-content truncate max-w-[220px] mx-auto">
                    Linked to: <span className="text-teal-600 dark:text-teal-400">{activeProfile.full_name}</span>
                    {user?.email ? ` (${user.email})` : ''}
                  </p>
                )}
              </div>

              {/* 6-Digit Smart Pairing Code Pill */}
              {formattedCode && (
                <div className="w-full pt-2 border-t border-line flex items-center justify-between gap-2 px-1">
                  <div className="text-left min-w-0">
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
                    className="px-2 py-1 rounded-lg bg-surface-raised hover:bg-surface-hover border border-line text-2xs font-semibold text-content inline-flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <CheckIcon size={12} className="text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Instructions, Sync Info & Action Buttons */}
            <div className="flex flex-col justify-between gap-3">
              {/* 3 Step Visual Guide */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <div className="p-2 rounded-xl bg-surface border border-line text-center space-y-0.5">
                  <span className="w-4 h-4 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <strong className="text-2xs font-semibold text-content block">Scan QR</strong>
                  <span className="text-[10px] text-content-muted block leading-tight">
                    Camera / App
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-surface border border-line text-center space-y-0.5">
                  <span className="w-4 h-4 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <strong className="text-2xs font-semibold text-content block">Install APK</strong>
                  <span className="text-[10px] text-content-muted block leading-tight">
                    Curewell.apk
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-surface border border-line text-center space-y-0.5">
                  <span className="w-4 h-4 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <strong className="text-2xs font-semibold text-content block">Auto-Sign In</strong>
                  <span className="text-[10px] text-content-muted block leading-tight">
                    1-tap synced
                  </span>
                </div>
              </div>

              {/* Full Features + Notifications Callout */}
              <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-start gap-2">
                <ClockIcon size={15} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 min-w-0">
                  <strong className="font-semibold text-content flex items-center gap-1 text-2xs">
                    <span>Dose Alarms, Quick Vitals &amp; Full App</span>
                    <ShieldIcon size={12} className="text-teal-500 shrink-0" />
                  </strong>
                  <p className="text-[11px] text-content-muted leading-relaxed">
                    Lock-screen dose alerts, 10-second BP/glucose log, and full instant cloud synchronization.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex flex-col gap-2 border-t border-line">
                <a
                  href="/downloads/Curewell.apk"
                  download="Curewell.apk"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.01]"
                >
                  <DownloadIcon size={14} />
                  <span>Download APK Directly</span>
                </a>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLink}
                  className="w-full text-xs py-2"
                >
                  {copiedLink ? (
                    <>
                      <CheckIcon size={13} className="mr-1.5 text-emerald-600" /> Copied Smart Link
                    </>
                  ) : (
                    <>
                      <CopyIcon size={13} className="mr-1.5" /> Copy Smart Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
