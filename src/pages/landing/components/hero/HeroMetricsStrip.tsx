import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { ShieldIcon, SparklesIcon, LockIcon } from '../../../../components/ui/icons';
import { useInViewport } from './useInViewport';

const stripVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 22,
      stiffness: 140,
    },
  },
};

interface DirectCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  delay?: number;
  active: boolean;
}

// Zero-React-rerender high performance counter that ONLY starts when scrolled into viewport
function DirectCounter({ target, duration = 900, suffix = '', delay = 0, active }: DirectCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!active || hasStartedRef.current) return;
    const el = ref.current;
    if (!el) return;

    hasStartedRef.current = true;
    let animId: number;
    let startTimestamp: number | null = null;

    const timeout = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * ease);
        el.textContent = `${current}${suffix}`;

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        }
      };

      animId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animId);
    };
  }, [target, duration, suffix, delay, active]);

  return (
    <span ref={ref} data-numeric>
      0{suffix}
    </span>
  );
}

export function HeroMetricsStrip() {
  const stripRef = useRef<HTMLDivElement>(null);
  // Viewport trigger using native IntersectionObserver
  const isInView = useInViewport(stripRef, { threshold: 0.2, once: true });

  return (
    <motion.div
      ref={stripRef}
      variants={stripVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 max-w-5xl mx-auto relative z-10"
    >
      {/* Metric 1: 100% Patient Controlled */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -3, transition: { duration: 0.15 } }}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 shadow-xs hover:shadow-sm transition-all duration-200 text-left group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline">
            <DirectCounter target={100} suffix="%" duration={1100} delay={150} active={isInView} />
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
            <ShieldIcon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
          Patient-Controlled
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
          Every AI extraction requires your manual review and approval
        </p>
      </motion.div>

      {/* Metric 2: 0 Silent AI Commits */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -3, transition: { duration: 0.15 } }}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 shadow-xs hover:shadow-sm transition-all duration-200 text-left group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl sm:text-3xl font-black text-teal-700 font-mono tracking-tight">
            0
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:rotate-12 transition-transform">
            <SparklesIcon className="w-4 h-4 text-teal-600" />
          </div>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
          Silent AI Commits
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
          Zero hallucinated entries; strictly grounded in uploaded records
        </p>
      </motion.div>

      {/* Metric 3: 10-Sec Emergency Access */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -3, transition: { duration: 0.15 } }}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 shadow-xs hover:shadow-sm transition-all duration-200 text-left group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline">
            <DirectCounter target={10} suffix="-Sec" duration={900} delay={250} active={isInView} />
          </span>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600" />
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
          Emergency Access
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
          Instant tamper-proof QR telemetry access for paramedics
        </p>
      </motion.div>

      {/* Metric 4: 256-Bit Encrypted Privacy */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -3, transition: { duration: 0.15 } }}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 shadow-xs hover:shadow-sm transition-all duration-200 text-left group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline">
            <DirectCounter target={256} suffix="-Bit" duration={1200} delay={350} active={isInView} />
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
            <LockIcon className="w-4 h-4 text-teal-700" />
          </div>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
          Encrypted Privacy
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
          AES-256 vault standard. Health data is never sold or used for ads
        </p>
      </motion.div>
    </motion.div>
  );
}
