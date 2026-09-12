import { Link } from 'react-router-dom';
import { motion, type Variants } from 'motion/react';
import { ArrowRightIcon, SparklesIcon, CheckCircleIcon } from '../../../../components/ui/icons';

// Stagger animation container
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 160,
    },
  },
};

export function HeroHeadline() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="max-w-4xl mx-auto text-center relative z-10"
    >
      {/* 1. Pill Badge with Live Radar Beacon */}
      <motion.div variants={itemVariants} className="inline-block mb-6">
        <div className="group relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-50 border border-teal-200/80 hover:border-teal-400/80 shadow-xs hover:shadow-sm transition-all duration-200">
          {/* Pulsing Beacon Dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
          </span>

          <span className="text-xs font-semibold text-slate-700 tracking-tight">
            Personal Health Vault
          </span>
          <span className="text-slate-300 text-xs">•</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
            <SparklesIcon className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Shifa AI Co-Pilot</span>
          </span>
        </div>
      </motion.div>

      {/* 2. Hero Headline with Staggered Kinetic Typography */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6"
      >
        <span className="inline-block">Your Entire Medical Life.</span>
        <br />
        <span className="relative inline-block mt-1">
          <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Digitized in Seconds.
          </span>
          {/* Subtle animated underline wave */}
          <motion.svg
            className="absolute -bottom-2 left-0 right-0 w-full h-3 text-teal-500/40 pointer-events-none"
            viewBox="0 0 300 12"
            fill="none"
            preserveAspectRatio="none"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
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
        Stop digging through crumpled paper doctor slips and scattered WhatsApp labs.
        Curewell brings your prescriptions, schedules, and blood tests into one private,
        patient-governed vault.
      </motion.p>

      {/* 4. Action CTAs with Spring Micro-Interactions */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6"
      >
        {/* Primary CTA */}
        <Link
          to="/signup"
          className="group relative w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 rounded-xl shadow-[0_4px_16px_rgba(13,148,136,0.28)] hover:shadow-[0_8px_26px_rgba(13,148,136,0.38)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
        >
          {/* Light sweep sheen across button on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <span className="relative z-10">Create Free Vault</span>
          <ArrowRightIcon className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>

        {/* Secondary CTA */}
        <a
          href="#bento-vault"
          className="w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-200 text-center"
        >
          Explore Health Vault
        </a>
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
