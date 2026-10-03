import { Link } from 'react-router-dom';
import { motion, type Variants } from 'motion/react';
import { ArrowRightIcon, SparklesIcon, CheckCircleIcon, ActivityIcon } from '../../../../components/ui/icons';

// Stagger animation container
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 150,
    },
  },
};

export function HeroHeadline() {
  const scrollToConsole = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('interactive-console') || document.getElementById('bento-vault');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="max-w-4xl mx-auto text-center relative z-10"
    >
      {/* 1. Kinetic Pill Badge with Live Radar Beacon */}
      <motion.div variants={itemVariants} className="inline-block mb-6">
        <div className="group relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-50/90 hover:bg-white border border-teal-200/90 hover:border-teal-400 shadow-xs hover:shadow-md transition-all duration-300 backdrop-blur-md cursor-default">
          {/* Pulsing Beacon Dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
          </span>

          <span className="text-xs font-semibold text-slate-800 tracking-tight">
            Personal Health Vault
          </span>
          <span className="text-slate-300 text-xs">•</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700">
            <SparklesIcon className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Shifa AI Co-Pilot</span>
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-100/70 text-teal-800">
            v4.0
          </span>
        </div>
      </motion.div>

      {/* 2. Hero Headline with Architectural Kinetic Typography */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.06] mb-6 select-none"
      >
        <span className="inline-block">Your Entire Medical Life.</span>
        <br />
        <span className="relative inline-block mt-1 sm:mt-2">
          <span className="bg-gradient-to-r from-teal-800 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Digitized in Seconds.
          </span>
          {/* Animated decorative trajectory underline */}
          <motion.svg
            className="absolute -bottom-2 sm:-bottom-3 left-0 right-0 w-full h-3 text-teal-500/50 pointer-events-none"
            viewBox="0 0 300 12"
            fill="none"
            preserveAspectRatio="none"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.4, delay: 0.35, ease: 'easeOut' }}
          >
            <motion.path
              d="M0 6 Q 75 0, 150 6 T 300 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.svg>
        </span>
      </motion.h1>

      {/* 3. High-Legibility Subtitle */}
      <motion.p
        variants={itemVariants}
        className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-9 leading-relaxed font-normal"
      >
        Stop digging through crumpled paper slips and scattered WhatsApp labs.
        Curewell brings your prescriptions, circadian schedules, and blood tests into one private,
        patient-governed vault with <strong className="text-slate-900 font-semibold">zero silent AI commits</strong>.
      </motion.p>

      {/* 4. Action CTAs with Spring Micro-Interactions */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-7"
      >
        {/* Primary CTA */}
        <Link
          to="/signup"
          className="group relative w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-teal-700 via-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 rounded-xl shadow-[0_4px_20px_rgba(13,148,136,0.3)] hover:shadow-[0_8px_30px_rgba(13,148,136,0.45)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
        >
          {/* Light sweep sheen across button on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <span className="relative z-10">Create Free Vault</span>
          <ArrowRightIcon className="relative z-10 w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
        </Link>

        {/* Secondary CTA: Interactive Console Trigger */}
        <button
          onClick={scrollToConsole}
          className="group w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-300 rounded-xl shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200 text-center flex items-center justify-center gap-2"
        >
          <ActivityIcon className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          <span>Explore Interactive Console</span>
        </button>
      </motion.div>

      {/* 5. Trust Assurances */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium pb-2"
      >
        <span className="inline-flex items-center gap-1.5">
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>No credit card required</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircleIcon className="w-3.5 h-3.5 text-teal-600" />
          <span>Zero-knowledge client encryption</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircleIcon className="w-3.5 h-3.5 text-slate-600" />
          <span>Instant clinical PDF export</span>
        </span>
      </motion.div>
    </motion.div>
  );
}
