import { useRef } from 'react';
import { motion, type MotionValue, useTransform } from 'motion/react';
import {
  CapsuleIcon,
  LabFlaskIcon,
  ShieldIcon,
  HeartPulseIcon,
  SparklesIcon,
  TrendingDownIcon,
  CheckIcon,
  ActivityIcon,
} from '../../../../components/ui/icons';
import { useInViewport } from './useInViewport';

interface HeroVisualStageProps {
  springX: MotionValue<number>;
  springY: MotionValue<number>;
}

// Reusable static ECG path string
const ECG_PATH = `
  M 0 60
  L 60 60
  Q 70 54, 80 60
  L 110 60
  L 120 68
  L 135 15
  L 150 102
  L 165 60
  L 190 60
  Q 210 44, 230 60
  L 290 60
  L 300 68
  L 315 15
  L 330 102
  L 345 60
  L 370 60
  Q 390 44, 410 60
  L 470 60
  L 480 68
  L 495 15
  L 510 102
  L 525 60
  L 600 60
`;

export function HeroVisualStage({ springX, springY }: HeroVisualStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  // Viewport detection: only runs continuous animations while visible on screen
  const isInView = useInViewport(stageRef, { threshold: 0.1, once: false });

  // Smooth, subtle 3D Perspective Tilt (GPU friendly)
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  return (
    <div
      ref={stageRef}
      className="relative mt-8 sm:mt-12 mb-14 sm:mb-20 max-w-5xl mx-auto px-2 sm:px-4 [perspective:1200px]"
    >
      {/* Dynamic 3D Floating Console (Triggers entrance strictly when in viewport) */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 140,
          delay: 0.1,
        }}
        className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.1),0_0_25px_1px_rgba(20,184,166,0.06)] overflow-hidden"
      >
        {/* Subtle Static Specular Glare (zero repaint cost) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-teal-50/20 opacity-70 z-30" />

        {/* Top Edge Specular Highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent z-20" />

        {/* Console Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-mono text-slate-500 select-none">
          {/* Status Indicators */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              VAULT-ENCLAVE #CW-8924
            </span>
          </div>

          {/* Real-Time Sync Telemetry */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-medium text-[10px]">
              <span className="w-1 h-1 rounded-full bg-teal-600 animate-ping" />
              SHIFA ENGINE ONLINE
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">12ms LATENCY</span>
          </div>
        </div>

        {/* Console Body: Dual Clinical Command Split */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative">
          {/* Left Column: Real-Time Cardiac Telemetry (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 relative overflow-hidden border border-slate-800">
            {/* Background ECG Oscilloscope Grid */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(20, 184, 166, 0.4) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(20, 184, 166, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: '18px 18px',
              }}
            />

            {/* Header: Vital Status & Live BPM */}
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <ActivityIcon className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-100 tracking-wide uppercase">
                    Cardiac Telemetry Stream
                  </h2>
                  <p className="text-[10px] text-teal-400/80 font-mono">Lead II • Continuous Sinus Rhythm</p>
                </div>
              </div>

              {/* Live BPM Counter Box */}
              <div className="flex items-baseline gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                  72
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">BPM</span>
              </div>
            </div>

            {/* Live Electrocardiogram (ECG) Animated Waveform - Viewport Gated */}
            <div className="relative h-28 sm:h-32 w-full my-2 flex items-center overflow-hidden">
              <svg
                viewBox="0 0 600 120"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Center baseline */}
                <line
                  x1="0"
                  y1="60"
                  x2="600"
                  y2="60"
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.3"
                />

                {/* 1. Underlying Glow Path (Zero CPU blur, pure GPU stroke) */}
                <motion.path
                  d={ECG_PATH}
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="5"
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ willChange: 'transform' }}
                  animate={isInView ? { pathOffset: [0, 1] } : undefined}
                  transition={{
                    duration: 3.6,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* 2. Crisp Core Path */}
                <motion.path
                  d={ECG_PATH}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ willChange: 'transform' }}
                  animate={isInView ? { pathOffset: [0, 1] } : undefined}
                  transition={{
                    duration: 3.6,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Leading Tracer Pulse Point */}
                <motion.circle
                  cx="510"
                  cy="102"
                  r="3.5"
                  fill="#34d399"
                  animate={isInView ? { opacity: [0.7, 1, 0.7] } : undefined}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                  }}
                />
              </svg>
            </div>

            {/* Diagnostic Parameters Footer */}
            <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Hemodynamic Stability: 99.4%</span>
              </span>
              <span className="hidden sm:inline text-slate-500">PR 142ms • QRS 88ms • QTc 412ms</span>
            </div>
          </div>

          {/* Right Column: Tomography Scanner & Instant OCR Ingestion (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-50/90 border border-slate-200 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Optical Scanner Beam Sweep (Viewport Gated) */}
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-500/70 to-transparent pointer-events-none z-20"
              style={{ willChange: 'transform' }}
              animate={
                isInView
                  ? {
                      y: [0, 180, 0],
                      opacity: [0.3, 0.7, 0.3],
                    }
                  : undefined
              }
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <SparklesIcon className="w-3.5 h-3.5 text-teal-600" />
                  <span>Instant OCR Intake</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">
                  99.8% ACCURACY
                </span>
              </div>

              {/* Scanned Medical Document Capsule */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Dr. Sarah Jenkins, MD</p>
                    <p className="text-[10px] text-slate-500">St. Jude Heart & Vascular Clinic</p>
                  </div>
                  <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    RX-99214
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-900">Atorvastatin 20mg</span>
                    <span className="text-[11px] text-slate-500">1x Daily (Night)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-900">Metformin 500mg</span>
                    <span className="text-[11px] text-slate-500">2x Daily (Meals)</span>
                  </div>
                </div>
              </div>

              {/* Automated FHIR Semantic Categorization */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-600">
                <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-800 font-mono">
                  #Cardiology
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">
                  #LipidRegimen
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-mono">
                  #FHIR-Compliant
                </span>
              </div>
            </div>

            {/* Ingestion Micro Status Bar */}
            <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                Auto-added to Medication Schedule
              </span>
              <span className="text-teal-700 font-bold">1.2s</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* 4 SATELLITE CARDS (Viewport Gated Entrance & Levitation)     */}
      {/* ============================================================ */}

      {/* Satellite 1: Active Prescription (Top Left) */}
      <motion.div
        className="hidden lg:flex absolute -top-8 -left-8 z-30 p-3.5 rounded-2xl bg-white border border-teal-200 shadow-md items-center gap-3 w-64 hover:scale-105 transition-transform duration-200 cursor-pointer group"
        style={{ willChange: 'transform' }}
        initial={{ opacity: 0, x: -20 }}
        whileInView={{
          opacity: 1,
          x: 0,
          y: isInView ? [-4, 5, -4] : 0,
        }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{
          y: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.5, delay: 0.2 },
          x: { duration: 0.5, delay: 0.2 },
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
          <CapsuleIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-slate-900 truncate">Amoxicillin 500mg</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-500 truncate">1 cap TID • Auto-Dose Alert</p>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full w-2/3" />
          </div>
        </div>
      </motion.div>

      {/* Satellite 2: Biomarker Velocity (Top Right) */}
      <motion.div
        className="hidden lg:flex absolute -top-10 -right-6 z-30 p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-md items-center gap-3 w-64 hover:scale-105 transition-transform duration-200 cursor-pointer group"
        style={{ willChange: 'transform' }}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{
          opacity: 1,
          x: 0,
          y: isInView ? [5, -4, 5] : 0,
        }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{
          y: { duration: 5.2, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.5, delay: 0.25 },
          x: { duration: 0.5, delay: 0.25 },
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <LabFlaskIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-slate-900 truncate">HbA1c Biomarker</span>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700">
              <TrendingDownIcon className="w-3 h-3" />
              <span>-0.4%</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">5.7% (Optimal Target)</p>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded mt-1 inline-block">
            ADA Goal Met
          </span>
        </div>
      </motion.div>

      {/* Satellite 3: Sentinel Drug Conflict Shield (Bottom Left) */}
      <motion.div
        className="hidden lg:flex absolute -bottom-7 -left-6 z-30 p-3.5 rounded-2xl bg-white border border-teal-200 shadow-md items-center gap-3 w-64 hover:scale-105 transition-transform duration-200 cursor-pointer group"
        style={{ willChange: 'transform' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{
          opacity: 1,
          y: isInView ? [4, -5, 4] : 0,
        }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{
          y: { duration: 4.6, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.5, delay: 0.3 },
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
          <ShieldIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-slate-900 truncate">Sentinel Guard</span>
            <span className="text-[10px] font-bold text-teal-700">0 Alerts</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">0 Drug Interactions Detected</p>
          <p className="text-[10px] text-slate-400 mt-0.5">14,000 Molecules Checked</p>
        </div>
      </motion.div>

      {/* Satellite 4: 10-Sec Paramedic Emergency Token (Bottom Right) */}
      <motion.div
        className="hidden lg:flex absolute -bottom-6 -right-4 z-30 p-3.5 rounded-2xl bg-white border border-rose-200 shadow-md items-center gap-3 w-64 hover:scale-105 transition-transform duration-200 cursor-pointer group"
        style={{ willChange: 'transform' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{
          opacity: 1,
          y: isInView ? [-4, 4, -4] : 0,
        }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{
          y: { duration: 5.4, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.5, delay: 0.35 },
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
          <HeartPulseIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-slate-900 truncate">Emergency Token</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="text-[11px] text-slate-500 truncate">Instant Paramedic QR</p>
          <p className="text-[10px] text-rose-700 font-bold mt-0.5">Blood: O+ • Penicillin Alert</p>
        </div>
      </motion.div>
    </div>
  );
}
