import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../../../components/ui/icons';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-ink-200 shadow-xs'
          : 'bg-white/70 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="Curewell Home">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-800 transition-colors">
              <span className="text-base font-black tracking-tighter">C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-ink-900 leading-tight">
                Curewell
              </span>
              <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase">
                Clinical Health Vault
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-ink-600">
            <a href="#bento-vault" className="hover:text-teal-800 transition-colors">
              Health Vault
            </a>
            <a href="#problem-solution" className="hover:text-teal-800 transition-colors">
              The Reality
            </a>
            <a href="#shifa-ai" className="hover:text-teal-800 transition-colors flex items-center gap-1.5 font-bold text-teal-700">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              Shifa AI Co-Pilot
            </a>
            <a href="#vitals" className="hover:text-teal-800 transition-colors">
              Vitals Radar
            </a>
            <a href="#security" className="hover:text-teal-800 transition-colors">
              Privacy Vault
            </a>
            <a href="#faq" className="hover:text-teal-800 transition-colors">
              FAQ
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-bold text-ink-700 hover:text-teal-900 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-ink-700 hover:bg-ink-100 transition-colors focus:outline-hidden"
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
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-ink-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <a
            href="#bento-vault"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-ink-800 hover:bg-ink-50 hover:text-teal-800"
          >
            Health Vault
          </a>
          <a
            href="#problem-solution"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-ink-800 hover:bg-ink-50 hover:text-teal-800"
          >
            The Reality
          </a>
          <a
            href="#shifa-ai"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-teal-800 font-bold hover:bg-teal-50"
          >
            Shifa AI Co-Pilot
          </a>
          <a
            href="#vitals"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-ink-800 hover:bg-ink-50 hover:text-teal-800"
          >
            Vitals Radar
          </a>
          <a
            href="#security"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-ink-800 hover:bg-ink-50 hover:text-teal-800"
          >
            Privacy Vault
          </a>
          <a
            href="#faq"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-ink-800 hover:bg-ink-50 hover:text-teal-800"
          >
            FAQ
          </a>
          <div className="pt-3 border-t border-ink-100 flex flex-col gap-2">
            <Link
              to="/login"
              className="text-center w-full py-2.5 text-sm font-bold text-ink-800 rounded-xl border border-ink-200"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-center w-full py-2.5 text-sm font-bold text-white bg-teal-700 rounded-xl"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
