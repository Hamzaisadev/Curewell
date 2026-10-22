import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRightIcon, CheckIcon, ShieldIcon } from '../../../components/ui/icons';

export function FinalCtaSection() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 relative overflow-hidden border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/70 text-slate-900 p-8 sm:p-16 lg:p-20 relative overflow-hidden border border-teal-200/90 shadow-[0_20px_60px_-15px_rgba(15,118,110,0.12)] text-center"
        >
          {/* Blueprint Millimeter Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.25]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(20, 184, 166, 0.25) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(20, 184, 166, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Central Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-teal-300 text-teal-800 text-xs font-semibold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
              <span>Personal Health Records Vault</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
              Take absolute control of your medical history.
            </h2>

            <p className="text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Create your private, patient-governed health vault in under two minutes. Digitize paper prescriptions, visualize lab velocity, and eliminate duplicate drug toxicity.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="group relative w-full sm:w-auto px-9 py-4 text-base font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-2xl shadow-[0_6px_24px_rgba(15,118,110,0.3)] hover:shadow-[0_8px_30px_rgba(15,118,110,0.4)] transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                <span className="relative z-10">Create Free Vault</span>
                <ArrowRightIcon className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl transition-all shadow-xs text-center"
              >
                Sign In to Vault
              </Link>
            </div>

            {/* Micro Guarantees */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} className="text-emerald-600" />
                <span>Free Forever for Individuals</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldIcon size={14} className="text-teal-600" />
                <span>Zero Silent AI Commits</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} className="text-teal-600" />
                <span>Bank-Grade AES-256</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
