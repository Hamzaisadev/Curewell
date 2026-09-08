import { Link } from 'react-router-dom';
import { ArrowRightIcon, ShieldIcon } from '../../../components/ui/icons';

export function FinalCtaSection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-teal-900 text-white p-8 sm:p-16 relative overflow-hidden border border-teal-800 shadow-xl text-center">
          {/* Subtle Blueprint Grid Pattern */}
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

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-800/80 border border-teal-600/40 text-teal-200 text-xs font-mono uppercase tracking-wider">
              <ShieldIcon size={14} className="text-teal-300" />
              <span>PRIVATE CLINICAL VAULT</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Your Health Story Deserves Better Than a Shoebox of Papers.
            </h2>

            <p className="text-sm sm:text-lg text-teal-100/90 leading-relaxed font-normal">
              Take complete control of your family's prescriptions, lab biomarker trajectories, and doctor consultations today. Completely private, secure, and always patient-verified.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-teal-950 bg-white hover:bg-teal-50 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <span>Create Your Free Medical Vault</span>
                <ArrowRightIcon size={18} />
              </Link>
            </div>

            <p className="text-xs text-teal-200/80 font-mono pt-2">
              Free forever for individual patients • No credit card required • Zero silent AI commits
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
