import { motion } from 'motion/react';
import { ShieldIcon, LockIcon, CheckIcon } from '../../../components/ui/icons';

export function PrivacyVaultSection() {
  const securityPillars = [
    {
      title: 'Bank-Grade Data Encryption',
      desc: 'All medical records, doctor slips, and lab tests are secured using 256-bit AES encryption at rest and in transit.',
      badge: 'AES-256 Encrypted',
    },
    {
      title: 'Zero Third-Party Data Selling',
      desc: 'We never sell, monetize, or broker your personal health information to insurance firms, advertisers, or third parties.',
      badge: 'Zero Data Selling',
    },
    {
      title: 'Zero Silent AI Commits',
      desc: 'Shifa AI will never write or alter medical records without your explicit 1-click review and verification.',
      badge: 'Patient Approved',
    },
    {
      title: 'Offline Hospital Access',
      desc: 'Emergency allergies, current prescriptions, and doctor dossiers are stored locally on your device for offline access.',
      badge: 'Offline Capable',
    },
  ];

  return (
    <section id="security" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 relative overflow-hidden border-b border-slate-200">
      {/* Millimeter Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-18"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <LockIcon size={14} className="text-teal-700" />
            <span>Security</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Private by design.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Your medical records are encrypted, never sold, and never changed without your explicit approval.
          </p>
        </motion.div>

        {/* 4 Security Cards with Staggered Motion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                    <ShieldIcon size={20} />
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-teal-800 shadow-2xs">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{pillar.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">{pillar.desc}</p>
              </div>

              <div className="pt-5 mt-6 border-t border-slate-200/80 flex items-center gap-2 text-xs text-teal-800 font-medium">
                <CheckIcon size={14} className="text-teal-600" />
                <span>Active clinical safeguard</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
