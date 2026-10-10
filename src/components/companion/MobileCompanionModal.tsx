import { useState, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { useAuth } from '../../lib/auth/AuthContext';
import { generateQrSvgUrl } from '../../lib/qr/qrGenerator';
import { createCompanionPairingToken } from '../../lib/security/companionPairing';
import { Button } from '../ui/Button';
import {
  XIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  AndroidIcon,
  ClockIcon,
} from '../ui/icons';

interface MobileCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCompanionModal({ isOpen, onClose }: MobileCompanionModalProps) {
  const { user, activeProfile } = useAuth();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Build direct APK download URL & QR Code
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function buildQr() {
      const baseUrl = `${window.location.origin}/download/apk`;

      if (user && activeProfile) {
        try {
          const token = await createCompanionPairingToken(
            user.id,
            activeProfile.id,
            activeProfile.full_name,
            user.email
          );
          if (!isMounted) return;
          const fullUrl = `${baseUrl}?pair=${encodeURIComponent(token)}`;
          setDownloadLink(fullUrl);
          setQrUrl(generateQrSvgUrl(fullUrl, 200));
        } catch {
          setDownloadLink(baseUrl);
          setQrUrl(generateQrSvgUrl(baseUrl, 200));
        }
      } else {
        setDownloadLink(baseUrl);
        setQrUrl(generateQrSvgUrl(baseUrl, 200));
      }
    }

    buildQr();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, activeProfile]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

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
                  Install Curewell on Android
                </RadixDialog.Title>
                <p id="mobile-companion-desc" className="text-xs text-content-muted mt-0.5">
                  Scan QR code with your phone to download the app.
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

          {/* QR Code Hero Stage */}
          <div className="flex flex-col items-center bg-surface border border-line rounded-2xl p-4 text-center space-y-3">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 inline-block">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Curewell Android APK Download QR Code"
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-sm text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Scan to Download Curewell.apk
              </span>
              <p className="text-2xs text-content-muted max-w-xs mx-auto">
                Point your Android camera or Google Lens at this code to start download immediately on your phone.
              </p>
            </div>
          </div>

          {/* 3 Step Visual Guide */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-surface border border-line text-center space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                1
              </span>
              <strong className="text-xs font-semibold text-content block">Scan QR</strong>
              <span className="text-2xs text-content-muted block leading-tight">
                Downloads to phone
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-line text-center space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                2
              </span>
              <strong className="text-xs font-semibold text-content block">Open File</strong>
              <span className="text-2xs text-content-muted block leading-tight">
                Tap notification
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-line text-center space-y-1">
              <span className="w-5 h-5 mx-auto rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-2xs font-bold flex items-center justify-center">
                3
              </span>
              <strong className="text-xs font-semibold text-content block">Tap Install</strong>
              <span className="text-2xs text-content-muted block leading-tight">
                Ready on phone!
              </span>
            </div>
          </div>

          {/* Notification Callout */}
          <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-start gap-2.5">
            <ClockIcon size={16} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <strong className="font-semibold text-content block">
                Includes Scheduled Dose Notifications
              </strong>
              <p className="text-2xs text-content-muted leading-relaxed">
                App sends lock-screen notifications for scheduled Morning, Afternoon, and Bedtime doses.
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
                  <CheckIcon size={14} className="mr-1.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <CopyIcon size={14} className="mr-1.5" /> Copy Link
                </>
              )}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
