import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'motion/react';
import { ArrowRightIcon } from '../../../components/ui/icons';
import { Logo } from '../../../components/ui/Logo';

interface NavAnchor {
  href: string;
  label: string;
  hideOnLg?: boolean;
}

const NAV_ANCHORS: NavAnchor[] = [
  { href: '#story-scroller', label: 'Clinical Journey' },
  { href: '#collision-radar', label: 'Collision Radar' },
  { href: '#vitals-lab', label: 'Vitals Lab' },
  { href: '#doctor-perspective', label: 'Doctor Dossier', hideOnLg: true },
  { href: '#security', label: 'Privacy Enclave' },
  { href: '#faq', label: 'FAQ', hideOnLg: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<string>('');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 24,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      // Determine active section for nav pill highlight
      const sections = NAV_ANCHORS.map((a) => a.href.slice(1));
      let currentSection = '';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            currentSection = `#${id}`;
            break;
          }
        }
      }
      setActiveAnchor(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 sm:top-3 inset-x-0 z-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300 w-full">
      <nav
        aria-label="Primary Navigation"
        className={`pointer-events-auto transition-all duration-300 relative rounded-2xl w-full max-w-full ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.08)]'
            : 'bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)]'
        }`}
      >
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4 lg:gap-3 xl:gap-5 px-4 sm:px-6 xl:px-7">
          {/* Brand Logo & Clinical Badge */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 group shrink-0 select-none mr-1 xl:mr-3"
            aria-label="Curewell Clinical Health OS"
          >
            <Logo variant="mark" size="md" className="group-hover:scale-105 transition-transform duration-200 shrink-0" />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg xl:text-xl font-black tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                <span>Curewell</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-teal-700 tracking-widest uppercase whitespace-nowrap">
                CLINICAL HEALTH VAULT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs xl:text-sm font-semibold text-slate-600 shrink-0">
            {NAV_ANCHORS.map((anchor) => {
              const isActive = activeAnchor === anchor.href;
              return (
                <a
                  key={anchor.href}
                  href={anchor.href}
                  className={`relative px-2 xl:px-3 py-1 xl:py-1.5 rounded-lg xl:rounded-xl transition-all duration-200 whitespace-nowrap items-center gap-1 xl:gap-1.5 ${
                    anchor.hideOnLg ? 'hidden xl:flex' : 'flex'
                  } ${
                    isActive
                      ? 'text-teal-900 font-bold bg-teal-50/80 border border-teal-200/60 shadow-2xs'
                      : 'hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <span>{anchor.label}</span>
                </a>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-1.5 xl:gap-3 shrink-0 ml-auto">
            <Link
              to="/login"
              className="text-xs xl:text-sm font-bold text-slate-700 hover:text-teal-900 px-2.5 xl:px-3 py-1.5 xl:py-2 transition-colors rounded-lg xl:rounded-xl hover:bg-slate-100/60 whitespace-nowrap"
            >
              Sign In
            </Link>

            <Link
              to="/signup"
              className="group relative px-3.5 xl:px-5 py-2 xl:py-2.5 text-xs xl:text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-[0_4px_16px_rgba(15,118,110,0.25)] hover:shadow-[0_6px_20px_rgba(15,118,110,0.35)] transition-all duration-200 flex items-center gap-1.5 sm:gap-2 active:scale-[0.98] overflow-hidden whitespace-nowrap shrink-0"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="relative z-10">Get Started Free</span>
              <ArrowRightIcon className="relative z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden shrink-0"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileOpen}
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

        {/* Dynamic Continuous Scroll Progress Indicator Bar */}
        <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-slate-100/60 rounded-b-2xl overflow-hidden pointer-events-none">
          <motion.div
            style={{ scaleX, transformOrigin: '0%' }}
            className="h-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500"
          />
        </div>

        {/* Mobile Drawer Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200/80 py-4 px-4 space-y-2 bg-white/95 backdrop-blur-xl rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {NAV_ANCHORS.map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition-colors"
              >
                <span>{anchor.label}</span>
              </a>
            ))}

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
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
