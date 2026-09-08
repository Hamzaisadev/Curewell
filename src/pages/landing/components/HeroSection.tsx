import { Link } from 'react-router-dom';
import { ArrowRightIcon, ShieldIcon, SparklesIcon } from '../../../components/ui/icons';

export function HeroSection() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-ink-50/50 border-b border-ink-200/80">
      {/* Subtle Millimeter Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(203, 213, 225, 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(203, 213, 225, 0.35) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Clinical Assurance Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-teal-600/30 text-teal-800 shadow-xs mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Clinical Health Vault • Zero Data Commits Without Approval
          </span>
        </div>

        {/* Primary High-Impact Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-ink-950 tracking-tight leading-[1.08] mb-6">
          Your Entire Medical Life.
          <br />
          <span className="text-teal-700">Digitized in Seconds.</span> Protected Forever.
        </h1>

        {/* Grounded Patient-Centric Subhead */}
        <p className="text-base sm:text-xl text-ink-600 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
          Stop digging through crumpled paper doctor slips, disorganized WhatsApp lab reports, and guessing medication schedules.
          Curewell unifies your prescriptions, daily dose timing, and longitudinal blood tests into a private, doctor-ready vault — co-piloted by <strong>Shifa AI</strong>.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-14 sm:mb-16">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
          >
            <span>Create Free Medical Vault</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <a
            href="#bento-vault"
            className="w-full sm:w-auto px-8 py-4 text-base font-bold text-ink-800 bg-white hover:bg-ink-100/80 border border-ink-300 rounded-2xl shadow-xs transition-all text-center"
          >
            Explore Live Health Bento
          </a>
        </div>

        {/* Proof Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <div className="p-5 rounded-2xl bg-white border border-ink-200/80 text-left shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl sm:text-3xl font-black text-ink-950 font-mono">100%</span>
              <ShieldIcon className="w-5 h-5 text-teal-700" />
            </div>
            <p className="text-xs font-bold text-ink-900">Patient-Controlled</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Every AI extraction requires your manual 1-click confirmation</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-ink-200/80 text-left shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl sm:text-3xl font-black text-teal-700 font-mono">0</span>
              <SparklesIcon className="w-5 h-5 text-teal-700" />
            </div>
            <p className="text-xs font-bold text-ink-900">Silent AI Commits</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Zero hallucinations; answers are grounded strictly in your records</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-ink-200/80 text-left shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl sm:text-3xl font-black text-ink-950 font-mono">10-Sec</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs font-bold text-ink-900">Emergency Ready</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Instant tamper-proof QR and PIN access for ER doctors & paramedics</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-ink-200/80 text-left shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl sm:text-3xl font-black text-ink-950 font-mono">256-Bit</span>
              <span className="text-[11px] font-black uppercase text-teal-700">AES</span>
            </div>
            <p className="text-xs font-bold text-ink-900">Bank-Grade Privacy</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Isolated tenant storage; your health data is never sold or shared</p>
          </div>
        </div>
      </div>
    </section>
  );
}
