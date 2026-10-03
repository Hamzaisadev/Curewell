import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80 pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Precision Blueprint Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(20, 184, 166, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20, 184, 166, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-14 border-b border-slate-800/80">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
                C
              </div>
              <span className="text-2xl font-black tracking-tight text-white">Curewell</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-normal">
              The privacy-first personal health vault and prescription intelligence platform. Digitizing chronic care with zero silent commits.
            </p>

            {/* Live Enclave Telemetry Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ALL ENCLAVES OPERATIONAL • 8ms</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-2">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Connect & Updates</p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="#social-x"
                  aria-label="X (Twitter) Placeholder"
                  onClick={(e) => e.preventDefault()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  𝕏 / Twitter
                </a>
                <a
                  href="#social-linkedin"
                  aria-label="LinkedIn Placeholder"
                  onClick={(e) => e.preventDefault()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href="#social-github"
                  aria-label="GitHub Placeholder"
                  onClick={(e) => e.preventDefault()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          {/* Column: Health Vault */}
          <div className="space-y-3.5">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Health Vault</p>
            <ul className="space-y-2.5 text-sm text-slate-400 font-normal">
              <li>
                <a href="#interactive-console" className="hover:text-white transition-colors">Optical OCR Scanner</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">Sentinel Overdose Guard</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">Circadian Chronotherapy</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">Biomarker Velocity Curves</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">1-Page Consultation Brief</a>
              </li>
            </ul>
          </div>

          {/* Column: Clinical Intelligence */}
          <div className="space-y-3.5">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Intelligence</p>
            <ul className="space-y-2.5 text-sm text-slate-400 font-normal">
              <li>
                <a href="#shifa-ai" className="hover:text-white transition-colors">Shifa AI Co-Pilot</a>
              </li>
              <li>
                <a href="#vitals" className="hover:text-white transition-colors">Interactive Vitals Lab</a>
              </li>
              <li>
                <a href="#problem-solution" className="hover:text-white transition-colors">Transformation Matrix</a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">Zero Silent Commits</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">Safety Boundaries</a>
              </li>
            </ul>
          </div>

          {/* Column: Access & Security */}
          <div className="space-y-3.5">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Access & Security</p>
            <ul className="space-y-2.5 text-sm text-slate-400 font-normal">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Sign In to Vault</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">Create Free Vault</Link>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">256-Bit AES Encryption</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">Offline PWA Protocol</a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">Zero Data Selling Guarantee</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Clinical Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-slate-400">
          <p className="max-w-2xl leading-relaxed font-normal">
            <strong className="text-slate-300">Clinical Disclaimer:</strong> Curewell and Shifa AI are assistive health organizing and telemetry tools. They do not diagnose conditions or prescribe medications. All therapeutic adjustments must be verified with licensed medical practitioners.
          </p>
          <div className="text-left md:text-right shrink-0">
            <p className="font-mono text-slate-300">© 2026 Curewell Health OS.</p>
            <p className="text-[11px] text-teal-400 font-mono">Engineered with clinical precision.</p>
          </div>
        </div>

        {/* Monolithic Watermark */}
        <div className="mt-12 pt-6 border-t border-slate-900 text-center select-none pointer-events-none opacity-10">
          <span className="font-black text-6xl sm:text-8xl lg:text-9xl tracking-tighter text-slate-700">
            CUREWELL
          </span>
        </div>
      </div>
    </footer>
  );
}
