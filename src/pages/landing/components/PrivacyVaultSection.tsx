import { motion } from 'motion/react';
import { ShieldIcon, LockIcon, CheckIcon, ActivityIcon } from '../../../components/ui/icons';

export function PrivacyVaultSection() {
  const securityPillars = [
    {
      title: '256-Bit AES Client Encryption',
      desc: 'All medical records, doctor slips, and lab tests are secured using bank-grade AES-256 encryption at rest and in transit.',
      badge: 'AES-256 GCM',
      icon: <LockIcon className="w-5 h-5 text-teal-700" />,
    },
    {
      title: 'Zero Third-Party Data Selling',
      desc: 'We never sell, monetize, or broker your personal health information to insurance firms, pharmaceutical advertisers, or brokers.',
      badge: 'Zero Monetization',
      icon: <ShieldIcon className="w-5 h-5 text-emerald-700" />,
    },
    {
      title: 'Zero Silent AI Commits',
      desc: 'Shifa AI will never write or modify medical records without your explicit 1-click review and verification.',
      badge: '100% Patient Governed',
      icon: <CheckIcon className="w-5 h-5 text-teal-700" />,
    },
    {
      title: 'Offline Hospital Access (PWA)',
      desc: 'Emergency allergies, current prescriptions, and doctor dossiers are stored locally in secure cache for offline access in basements.',
      badge: 'Offline Enclave',
      icon: <ActivityIcon className="w-5 h-5 text-teal-700" />,
    },
  ];

  return (
    <section id="security" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 relative overflow-hidden border-b border-slate-200 scroll-mt-28">
      {/* Millimeter Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-18"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <LockIcon size={14} className="text-teal-700" />
            <span>Zero-Knowledge Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Private by design.
            <br />
            <span className="text-teal-700">Governed by you.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Your medical records are encrypted, never sold, and never changed without your explicit approval.
          </p>
        </motion.div>

        {/* 4 Pillars Grid with Interactive Hover Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityPillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
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

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-950 transition-colors mb-2">
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
                <span>ISO/IEC 27001</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
