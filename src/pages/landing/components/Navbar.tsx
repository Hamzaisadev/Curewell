import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../../../components/ui/icons';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolledRatio = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolledRatio);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 sm:top-3 inset-x-0 z-50 transition-all duration-300 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pointer-events-none">
      <nav
        className={`pointer-events-auto transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md sm:rounded-2xl px-4 sm:px-6'
            : 'bg-white/90 backdrop-blur-lg border border-slate-200/70 shadow-xs sm:rounded-2xl px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
          {/* Brand Logo - Guaranteed shrink-0 and ample right margin */}
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none mr-2 lg:mr-4 xl:mr-8"
            aria-label="Curewell Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0">
              <span className="text-base font-black tracking-tighter">C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-tight flex items-center gap-1.5 whitespace-nowrap">
                <span>Curewell</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200/60 hidden sm:inline-block">
                  OS
                </span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-teal-700 tracking-widest uppercase whitespace-nowrap">
                CLINICAL HEALTH VAULT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links - Single line, whitespace-nowrap, zero stacking */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs xl:text-sm font-semibold text-slate-600 shrink-0">
            <a
              href="#interactive-console"
              className="hover:text-teal-800 transition-colors py-1 whitespace-nowrap"
            >
              Console
            </a>
            <a
              href="#bento-vault"
              className="hover:text-teal-800 transition-colors py-1 whitespace-nowrap"
            >
              Health Vault
            </a>
            <a
              href="#problem-solution"
              className="hover:text-teal-800 transition-colors py-1 whitespace-nowrap"
            >
              The Reality
            </a>
            <a
              href="#shifa-ai"
              className="hover:text-teal-800 transition-colors flex items-center gap-1.5 font-bold text-teal-700 py-1 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              <span>Shifa AI</span>
            </a>
            <a
              href="#vitals"
              className="hover:text-teal-800 transition-colors py-1 whitespace-nowrap"
            >
              Vitals Lab
            </a>
            <a
              href="#security"
              className="hover:text-teal-800 transition-colors py-1 whitespace-nowrap"
            >
              Privacy
            </a>
            <a
              href="#faq"
              className="hover:text-teal-800 transition-colors py-1 whitespace-nowrap"
            >
              FAQ
            </a>
          </div>

          {/* Action CTAs - Guaranteed shrink-0 and whitespace-nowrap */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-teal-900 px-3 py-2 transition-colors rounded-lg hover:bg-slate-100/60 whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="group relative px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-1.5 sm:gap-2 active:scale-[0.98] overflow-hidden whitespace-nowrap shrink-0"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="relative z-10">Get Started Free</span>
              <ArrowRightIcon className="relative z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Scroll Progress Indicator Bar at bottom of navbar */}
        <div className="h-[2px] w-full bg-slate-100/50 rounded-b-xl overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Mobile Drawer Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 px-2 space-y-3 bg-white/95 backdrop-blur-md rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <a
              href="#interactive-console"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors"
            >
              Interactive Console
            </a>
            <a
              href="#bento-vault"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors"
            >
              Health Vault
            </a>
            <a
              href="#problem-solution"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors"
            >
              The Reality
            </a>
            <a
              href="#shifa-ai"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Shifa AI Co-Pilot</span>
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            </a>
            <a
              href="#vitals"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors"
            >
              Vitals Lab
            </a>
            <a
              href="#security"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors"
            >
              Privacy Enclave
            </a>
            <a
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors"
            >
              FAQ
            </a>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-teal-700 rounded-xl shadow-xs"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
