import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRightIcon, ShieldIcon } from '../../../components/ui/icons';

export function FinalCtaSection() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-teal-800 text-white p-8 sm:p-16 relative overflow-hidden border border-teal-700 shadow-xl text-center"
        >
          {/* Blueprint Millimeter Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-900/80 border border-teal-600/40 text-teal-200 text-xs font-semibold">
              <ShieldIcon size={14} className="text-teal-300" />
              <span>Get Started</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Take control of your health.
            </h2>

            <p className="text-base sm:text-lg text-teal-100 leading-relaxed font-normal">
              Create your secure, patient-owned health vault today. Organize prescriptions, track lab trends, and prepare doctor consultations with zero silent commits.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-teal-950 bg-white hover:bg-teal-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Create Free Vault</span>
                <ArrowRightIcon size={18} />
              </Link>
            </div>

            <p className="text-xs text-teal-200/80 pt-2">
              Free forever for individual patients • No credit card required • Zero silent commits
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
