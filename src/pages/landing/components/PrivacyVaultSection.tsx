import { useState } from 'react';
import { ShieldIcon, LockIcon, CheckIcon, ActivityIcon } from '../../../components/ui/icons';

export function PrivacyVaultSection() {
  const [offlineSimulated, setOfflineSimulated] = useState(false);
  const [verifiedKey, setVerifiedKey] = useState(false);

  const securityPillars = [
    {
      title: '256-Bit AES-GCM Client Encryption',
      desc: 'All prescription images, extracted dosages, and laboratory PDFs are encrypted client-side using bank-grade AES-256-GCM before transmission.',
      badge: 'AES-256 GCM',
      icon: <LockIcon className="w-5 h-5 text-teal-700" />,
    },
    {
      title: 'Zero Third-Party Data Selling',
      desc: 'We never sell, monetize, or broker your personal health information to insurance firms, pharmaceutical advertisers, or data brokers.',
      badge: 'Zero Monetization',
      icon: <ShieldIcon className="w-5 h-5 text-emerald-700" />,
    },
    {
      title: 'Zero Silent AI Commits',
      desc: 'Shifa AI will never write or modify medical records without your explicit 1-click review and verification. You are the sole governor.',
      badge: '100% Patient Governed',
      icon: <CheckIcon className="w-5 h-5 text-teal-700" />,
    },
    {
      title: 'Offline Hospital Access (PWA)',
      desc: 'Emergency allergies, active prescriptions, and consultation dossiers are stored locally in an encrypted sandbox for offline use in hospital basements.',
      badge: 'Offline Enclave',
      icon: <ActivityIcon className="w-5 h-5 text-teal-700" />,
    },
  ];

  return (
    <section
      id="security"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/80 text-slate-900 relative overflow-hidden border-b border-slate-200/80 scroll-mt-24"
    >
      {/* Millimeter Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3.5 shadow-2xs">
            <LockIcon size={14} className="text-teal-700" />
            <span className="font-mono uppercase tracking-wider text-[11px]">Act VI: The Sovereign Vault</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Private by design.
            <br />
            <span className="text-teal-700">Cryptographically sovereign.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed font-normal">
            Your medical records are encrypted, never sold, and never changed without your explicit approval. Built to function even in hospital basements with zero cellular reception.
          </p>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {pillar.icon}
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-800 transition-colors">
                    {pillar.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-950 transition-colors mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {pillar.desc}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckIcon size={12} />
                  <span>Enforced</span>
                </span>
                <span>ISO/IEC 27001 Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Enclave Verification Sandbox */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-teal-200 p-6 sm:p-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
            <div className="flex items-center gap-2">
              <ShieldIcon size={18} className="text-teal-700" />
              <span className="text-xs font-mono font-bold text-slate-900 uppercase">
                Interactive Enclave Telemetry Simulator
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOfflineSimulated(!offlineSimulated)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  offlineSimulated
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {offlineSimulated ? 'Simulation: Offline Hospital Basement' : 'Network: Online Hospital WiFi'}
              </button>
              <button
                onClick={() => setVerifiedKey(true)}
                className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-teal-700 hover:bg-teal-800 text-white transition-all cursor-pointer"
              >
                {verifiedKey ? 'Key Verified ✓' : 'Verify Client Key'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span>LOCAL-FIRST CACHE:</span>
                <span className={offlineSimulated ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {offlineSimulated ? 'OFFLINE SECURE CACHE ACTIVE' : 'REAL-TIME SYNCHRONIZED'}
                </span>
              </div>
              <p className="text-slate-700 font-sans leading-relaxed text-xs">
                {offlineSimulated
                  ? 'Zero cellular bars detected. Your medications, allergy warnings, and doctor dossiers are served instantly from device encrypted storage with 0ms latency.'
                  : 'Connected to secure endpoint. Encrypted delta changes are synced directly with multi-device cryptographic signatures.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span>CLIENT-SIDE KEY DERIVATION:</span>
                <span className="text-teal-800 font-bold">PBKDF2 / SHA-256</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 truncate">
                Hash: 8f9b2c34a10d8e4f55a1e7b992014cd78a94b51...
              </div>
              <p className="text-slate-500 font-sans text-[11px]">
                Server logs zero private keys. Your health records cannot be decrypted even by Curewell engineers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
