import { useRef, useState } from 'react';
import { motion, type MotionValue, useTransform, AnimatePresence } from 'motion/react';
import {
  CapsuleIcon,
  ShieldIcon,
  HeartPulseIcon,
  SparklesIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  CameraIcon,
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
  const isInView = useInViewport(stageRef, { threshold: 0.1, once: false });
  const [activeConsoleMode, setActiveConsoleMode] = useState<'scanner' | 'sentinel' | 'schedule'>('scanner');

  // Smooth, subtle 3D Perspective Tilt (GPU friendly)
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  return (
    <div
      id="interactive-console"
      ref={stageRef}
      className="relative mt-8 sm:mt-12 mb-14 sm:mb-20 max-w-5xl mx-auto px-2 sm:px-4 [perspective:1200px]"
    >
      {/* Dynamic 3D Floating Console */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 140,
          delay: 0.1,
        }}
        className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),0_0_30px_1px_rgba(20,184,166,0.08)] overflow-hidden"
      >
        {/* Subtle Specular Glare */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-teal-50/20 opacity-70 z-30" />

        {/* Top Edge Specular Highlight */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent z-20" />

        {/* Console Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 select-none">
          {/* Status Indicators */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              VAULT-ENCLAVE #CW-8924
            </span>
          </div>

          {/* Interactive Mode Tabs inside the header */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setActiveConsoleMode('scanner')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-all flex items-center gap-1 ${
                activeConsoleMode === 'scanner'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CameraIcon className="w-3 h-3" />
              <span>Optical OCR</span>
            </button>
            <button
              onClick={() => setActiveConsoleMode('sentinel')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-all flex items-center gap-1 ${
                activeConsoleMode === 'sentinel'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangleIcon className="w-3 h-3" />
              <span>Sentinel Radar</span>
            </button>
            <button
              onClick={() => setActiveConsoleMode('schedule')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-all flex items-center gap-1 ${
                activeConsoleMode === 'schedule'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClockIcon className="w-3 h-3" />
              <span>Dose Timeline</span>
            </button>
          </div>

          {/* Real-Time Sync Telemetry */}
          <div className="hidden md:flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-medium text-[10px]">
              <span className="w-1 h-1 rounded-full bg-teal-600 animate-ping" />
              SHIFA ENGINE ONLINE
            </span>
            <span className="text-[10px] text-slate-400">8ms LATENCY</span>
          </div>
        </div>

        {/* Console Body: Dual Clinical Command Split */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative bg-white">
          {/* Left Column: Real-Time Cardiac & Vitals Telemetry (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-950 text-white p-4 sm:p-5 relative overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between">
            {/* Background ECG Oscilloscope Grid */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(20, 184, 166, 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(20, 184, 166, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />

            <div>
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <HeartPulseIcon className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
                    CONTINUOUS BIOMETRICS
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                  SINUS RHYTHM
                </span>
              </div>

              {/* Real-Time SVG ECG Oscilloscope Animation */}
              <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center mb-4">
                <svg
                  viewBox="0 0 600 120"
                  className="w-full h-full stroke-teal-400 fill-none"
                  preserveAspectRatio="none"
                >
                  {/* Static Baseline Guide */}
                  <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                  
                  {/* Dynamic Glowing ECG Wave */}
                  <motion.path
                    d={ECG_PATH}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathOffset: 0 }}
                    animate={isInView ? { pathOffset: [0, 1] } : {}}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(20, 184, 166, 0.8))',
                    }}
                  />
                </svg>

                {/* Oscilloscope Scanning Cursor Bar */}
                <motion.div
                  className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-teal-300 to-transparent pointer-events-none"
                  animate={isInView ? { left: ['0%', '100%'] } : {}}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Live Floating Heart Rate Tag */}
                <div className="absolute top-2.5 right-3 px-2 py-1 rounded bg-slate-950/80 border border-slate-700/80 backdrop-blur-xs font-mono text-right">
                  <div className="text-sm font-black text-white flex items-baseline justify-end gap-1">
                    <span>72</span>
                    <span className="text-[10px] text-teal-400 font-normal">BPM</span>
                  </div>
                </div>
              </div>

              {/* 3 Live Telemetry Vitals Readouts */}
              <div className="grid grid-cols-3 gap-2.5 relative z-10">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Blood Pressure</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">118 / 76</p>
                  <span className="text-[9px] font-medium text-emerald-400">Normal (AHA)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Oxygen (SpO2)</p>
                  <p className="text-sm font-mono font-bold text-teal-300 mt-0.5">98 %</p>
                  <span className="text-[9px] font-medium text-teal-400">Optimal Range</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Fasting Glucose</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">94 mg/dL</p>
                  <span className="text-[9px] font-medium text-emerald-400">Near Target</span>
                </div>
              </div>
            </div>

            {/* Bottom Enclave Safeguard Verification */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 relative z-10">
              <span className="flex items-center gap-1.5">
                <ShieldIcon className="w-3.5 h-3.5 text-teal-400" />
                <span>AES-256 GCM ENCRYPTED</span>
              </span>
              <span className="text-emerald-400 font-semibold">● SYNCHRONIZED</span>
            </div>
          </div>

          {/* Right Column: Interactive Clinical Deck (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl bg-slate-50/90 border border-slate-200/90 p-4 sm:p-5 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* MODE 1: OPTICAL SCANNER SIMULATION */}
              {activeConsoleMode === 'scanner' && (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                        Multimodal Optical Extraction
                      </p>
                      <h4 className="text-sm font-bold text-slate-900">
                        Dr. Tariq Mansoor • General Medicine
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono text-[10px] font-bold">
                      99.4% CONFIDENCE
                    </span>
                  </div>

                  {/* Simulated Paper Slip with Active Laser Scan Line */}
                  <div className="relative rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs overflow-hidden">
                    {/* Glowing Turquoise Laser Beam Passing Across Document */}
                    <motion.div
                      aria-hidden="true"
                      animate={{
                        top: ['0%', '100%', '0%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_12px_rgba(20,184,166,0.9)] z-20 pointer-events-none"
                    />

                    {/* Extracted Item 1 */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                          <CapsuleIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Metformin HCl 500mg</p>
                          <p className="text-[10px] text-slate-500 font-mono">1 tab BD • After breakfast & dinner</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                        <CheckIcon className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    </div>

                    {/* Extracted Item 2 */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center">
                          <CapsuleIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Rosuvastatin Calcium 10mg</p>
                          <p className="text-[10px] text-slate-500 font-mono">1 tab HS • Bedtime intake</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                        <CheckIcon className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong className="text-slate-700">Zero Silent Commits:</strong> OCR parses handwritten clinic abbreviations with full confidence scoring. You confirm every dose with 1 click before committing to your vault.
                  </p>
                </motion.div>
              )}

              {/* MODE 2: SENTINEL OVERDOSE GUARD */}
              {activeConsoleMode === 'sentinel' && (
                <motion.div
                  key="sentinel"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
                        Sentinel Overdose Guard
                      </p>
                      <h4 className="text-sm font-bold text-slate-900">
                        Duplicate Chemical Molecule Detected
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono text-[10px] font-bold">
                      SAFETY COLLISION
                    </span>
                  </div>

                  {/* Collision Visual Box */}
                  <div className="p-3.5 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">Panadol 500mg + Calpol Syrup</span>
                      <span className="text-rose-600 font-bold font-mono">Molecule: Paracetamol</span>
                    </div>

                    {/* Progress Bar of Daily Load */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-600">Calculated Load: 2,500mg</span>
                        <span className="text-rose-700 font-bold">4,000mg Safe Limit</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 w-[62.5%]" />
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-900 font-medium">
                      ⚠️ Both prescribed under different trade names by separate clinics. Cumulative dose approaching hepatic ceiling.
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Curewell deconstructs trade names into pharmacological molecules to protect your liver and kidneys from overlapping prescriptions.
                  </p>
                </motion.div>
              )}

              {/* MODE 3: CIRCADIAN SCHEDULE */}
              {activeConsoleMode === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                        Chronotherapy Schedule
                      </p>
                      <h4 className="text-sm font-bold text-slate-900">
                        Today’s 24-Hour Regimen
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono text-[10px] font-bold">
                      2 of 3 TAKEN
                    </span>
                  </div>

                  {/* Schedule Cards */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">08:00 AM • Morning Dose</p>
                          <p className="text-[10px] text-slate-500">Metformin 500mg • With breakfast</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Logged 08:14
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-teal-300 ring-1 ring-teal-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">10:00 PM • Bedtime Dose</p>
                          <p className="text-[10px] text-slate-500">Rosuvastatin 10mg • Empty stomach</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        Upcoming (2h)
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Chronotherapy slots meds into precise metabolic dayparts to maximize therapeutic efficiency and eliminate missed doses.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Quick-Switch Tabs Hint */}
            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <SparklesIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Click tabs above to test features</span>
              </span>
              <span className="font-mono text-slate-400">100% Client-Side</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
