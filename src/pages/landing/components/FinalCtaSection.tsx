import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRightIcon, CheckIcon } from '../../../components/ui/icons';

export function FinalCtaSection() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 text-white p-8 sm:p-16 lg:p-20 relative overflow-hidden border border-teal-700/60 shadow-[0_25px_60px_-15px_rgba(13,148,136,0.3)] text-center"
        >
          {/* Blueprint Millimeter Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Central Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-900/80 border border-teal-500/50 text-teal-200 text-xs font-semibold backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              <span>Join Thousands of Chronic Care Patients</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Take absolute control of your medical history.
            </h2>

            <p className="text-base sm:text-xl text-teal-100/90 leading-relaxed font-normal max-w-2xl mx-auto">
              Create your private, patient-governed health vault in under two minutes. Digitize paper prescriptions, visualize lab velocity, and eliminate duplicate drug toxicity.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="group relative w-full sm:w-auto px-9 py-4 text-base font-bold text-teal-950 bg-white hover:bg-teal-50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-teal-200/40 to-transparent pointer-events-none" />
                <span className="relative z-10">Create Free Vault</span>
                <ArrowRightIcon className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-teal-200 hover:text-white bg-teal-900/60 hover:bg-teal-900 border border-teal-700/60 rounded-2xl transition-all text-center"
              >
                Sign In to Vault
              </Link>
            </div>

            {/* Micro Guarantees */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-teal-200/80">
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} className="text-emerald-400" />
                <span>Free Forever for Individuals</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} className="text-teal-400" />
                <span>Zero Silent AI Commits</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} className="text-teal-400" />
                <span>Bank-Grade AES-256</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
