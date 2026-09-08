import { ShieldIcon, LockIcon, CheckIcon } from '../../../components/ui/icons';

export function PrivacyVaultSection() {
  const securityPillars = [
    {
      title: 'Bank-Grade Data Encryption',
      desc: 'All medical records, doctor slips, and lab tests are secured using 256-bit AES encryption at rest and in transit.',
      badge: '256-BIT ENCRYPTED',
    },
    {
      title: 'Zero Third-Party Data Selling',
      desc: 'We never sell, monetize, or broker your personal health information to insurance firms, advertisers, or third parties.',
      badge: 'NEVER MONETIZED',
    },
    {
      title: 'Zero Silent AI Commits',
      desc: 'Shifa AI will never write or alter medical records without your explicit 1-click review and verification.',
      badge: '100% PATIENT CONTROL',
    },
    {
      title: 'Offline Hospital Basement Access',
      desc: 'Emergency allergies, current prescriptions, and doctor dossiers are stored locally on your device for offline access.',
      badge: 'OFFLINE CAPABLE',
    },
  ];

  return (
    <section id="security" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-ink-950 text-white relative overflow-hidden border-b border-ink-800">
      {/* Background blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-950 border border-teal-500/40 text-teal-300 text-xs font-mono uppercase tracking-widest mb-3">
            <LockIcon size={14} className="text-teal-400" />
            PATIENT PRIVACY FIRST
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Medical-Grade Privacy.
            <br />
            <span className="text-teal-400">Your Records Belong Solely to You.</span>
          </h2>
          <p className="text-base sm:text-lg text-ink-300 mt-4 leading-relaxed">
            Personal health records are the most sensitive information you own. Curewell is engineered from the ground up with zero-knowledge architecture.
          </p>
        </div>

        {/* 4 Security Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-7 sm:p-8 rounded-3xl bg-ink-900 border border-ink-800 hover:border-ink-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <ShieldIcon size={20} />
                  </span>
                  <span className="px-2.5 py-1 rounded bg-ink-950 border border-ink-800 text-[10px] font-mono font-bold text-teal-300">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{pillar.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{pillar.desc}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-ink-800/80 flex items-center gap-2 text-xs font-mono text-emerald-400">
                <CheckIcon size={14} />
                <span>ACTIVE CLINICAL SAFEGUARD</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
