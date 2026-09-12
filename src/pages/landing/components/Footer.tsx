import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800 pt-20 pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-14 border-b border-slate-800">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black text-base">
                C
              </div>
              <span className="text-2xl font-black tracking-tight text-white">Curewell</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The privacy-first personal health vault and prescription intelligence platform. Digitizing medical lives with zero silent commits.
            </p>

            {/* Social Media Placeholders */}
            <div className="pt-2">
              <p className="text-[11px] font-mono text-slate-500 uppercase mb-2">Connect & Updates</p>
              <div className="flex items-center gap-2">
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
                  href="#social-youtube"
                  aria-label="YouTube Placeholder"
                  onClick={(e) => e.preventDefault()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  YouTube
                </a>
                <a
                  href="#social-instagram"
                  aria-label="Instagram Placeholder"
                  onClick={(e) => e.preventDefault()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Column: Platform */}
          <div className="space-y-3.5">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Health Vault</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">Prescription OCR</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">Sentinel Overdose Guard</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">Chronotherapy Schedule</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">Lab Biomarker Velocity</a>
              </li>
              <li>
                <a href="#bento-vault" className="hover:text-white transition-colors">1-Page Doctor Brief</a>
              </li>
            </ul>
          </div>

          {/* Column: Intelligence */}
          <div className="space-y-3.5">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Clinical Intelligence</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#shifa-ai" className="hover:text-white transition-colors">Shifa AI Co-Pilot</a>
              </li>
              <li>
                <a href="#vitals" className="hover:text-white transition-colors">ADA Glycemic Staging</a>
              </li>
              <li>
                <a href="#vitals" className="hover:text-white transition-colors">AHA Blood Pressure MAP</a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">Zero Silent Commits</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">Safety Boundaries</a>
              </li>
            </ul>
          </div>

          {/* Column: Access */}
          <div className="space-y-3.5">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Patient Access</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Sign In to Vault</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">Create Free Account</Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">Offline Vault Guide</a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">Privacy Guarantee</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Clinical Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-slate-400">
          <p className="max-w-2xl leading-relaxed">
            <strong className="text-slate-300">Clinical Disclaimer:</strong> Curewell and Shifa AI are assistive health management tools designed to organize records and prepare consultations. They do not provide diagnostic assessments or replace professional clinical care from qualified physicians.
          </p>
          <div className="text-left md:text-right shrink-0">
            <p className="font-mono text-slate-300">© 2026 Curewell Health OS.</p>
            <p className="text-[11px] text-slate-500">Built with clinical precision.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
