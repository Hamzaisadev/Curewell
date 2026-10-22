import { useRef, useState } from 'react';
import { motion, type MotionValue, useTransform } from 'motion/react';
import {
  CapsuleIcon,
  ShieldIcon,
  CheckIcon,
  FileTextIcon,
  AlertTriangleIcon,
} from '../../../../components/ui/icons';

interface HeroVisualStageProps {
  springX: MotionValue<number>;
  springY: MotionValue<number>;
}

export function HeroVisualStage({ springX, springY }: HeroVisualStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'split' | 'paper' | 'vault'>('split');

  // Subtle 3D Perspective Tilt on Mouse Movement
  const rotateX = useTransform(springY, [-0.5, 0.5], [3.5, -3.5]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  return (
    <div
      id="hero-artifact"
      ref={stageRef}
      className="relative mt-8 sm:mt-12 mb-14 sm:mb-20 max-w-5xl mx-auto px-2 sm:px-4 [perspective:1200px]"
    >
      {/* 3D Floating Artifact Stage */}
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
        className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.1),0_0_30px_1px_rgba(20,184,166,0.06)] overflow-hidden"
      >
        {/* Top Edge Specular Highlight */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent z-30" />

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
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              ACT I: FROM CHAOS TO CLINICAL COHERENCE
            </span>
          </div>

          {/* Interactive Mode Pills */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Dual Split View</span>
            </button>
            <button
              onClick={() => setViewMode('paper')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'paper'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Raw Clinic Slip</span>
            </button>
            <button
              onClick={() => setViewMode('vault')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'vault'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileTextIcon className="w-3 h-3" />
              <span>Extracted Vault</span>
            </button>
          </div>

          {/* Telemetry Indicator */}
          <div className="hidden md:flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-medium text-[10px]">
              <span className="w-1 h-1 rounded-full bg-teal-600 animate-ping" />
              OPTICAL DE-SKEW ONLINE
            </span>
            <span className="text-[10px] text-slate-400">99.8% ACCURACY</span>
          </div>
        </div>

        {/* Dual-State Artifact Centerpiece */}
        <div className="p-4 sm:p-6 bg-slate-100/50 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative items-stretch">
            
            {/* ─────────────────────────────────────────────────────────────
                LEFT ARTIFACT: Authentic Tactile Paper Prescription Slip
               ───────────────────────────────────────────────────────────── */}
            {(viewMode === 'split' || viewMode === 'paper') && (
              <motion.div
                layout
                className={`${
                  viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
                } rounded-2xl bg-[#fffdfa] border border-[#e8decb] p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between`}
                style={{
                  backgroundImage: `
                    radial-gradient(#ebdcc4 0.6px, transparent 0.6px),
                    linear-gradient(to bottom, rgba(245, 235, 220, 0.25) 1px, transparent 1px)
                  `,
                  backgroundSize: '16px 16px, 100% 28px',
                }}
              >
                {/* Paper Fold Creases Simulation */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-[#d8c8ab]/40 to-transparent pointer-events-none" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#d8c8ab]/40 to-transparent pointer-events-none" />

                {/* Simulated Paper Clip or Clinic Stamp at Top */}
                <div>
                  <div className="flex items-start justify-between pb-3.5 border-b border-[#e2d5bd] mb-4">
                    <div>
                      <h4 className="text-xs font-black tracking-tight text-slate-900 uppercase font-sans">
                        Dr. Tariq Mansoor, <span className="text-[10px] font-bold text-slate-600">MBBS, FCPS (Med)</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Reg. PMC #84921-P • Consultant Physician
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        Lahore General Hospital • Outpatient Clinic
                      </p>
                    </div>

                    {/* Official Blue Rubber Stamp Replica */}
                    <div className="px-2.5 py-1 rounded-md border-2 border-dashed border-blue-600/70 text-blue-700/90 font-mono text-[9px] font-black rotate-[-4deg] uppercase tracking-wider select-none shadow-2xs">
                      VERIFIED CLINIC
                      <br />
                      <span className="text-[8px] font-normal">OPD 14-AUG-2026</span>
                    </div>
                  </div>

                  {/* Patient Info Row */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 pb-2 mb-3 border-b border-[#ece2cb]/80">
                    <span>Patient: <strong>Zeeshan Khan (48y / M)</strong></span>
                    <span>BP: 138/88 mmHg</span>
                    <span>Date: 14/08</span>
                  </div>

                  {/* Authentic Handwritten Prescription Notation */}
                  <div className="space-y-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-serif font-black text-teal-900/90 italic">Rx</span>
                    </div>

                    {/* Handwriting simulated note 1 */}
                    <div className="pl-4 border-l-2 border-teal-700/30 space-y-1">
                      <p className="font-serif italic text-base text-slate-800 leading-snug tracking-wide">
                        Tab. Metformin 500mg — 1 tab BD (pc)
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        [Take with morning & evening meals • do not skip]
                      </p>
                    </div>

                    {/* Handwriting simulated note 2 */}
                    <div className="pl-4 border-l-2 border-teal-700/30 space-y-1">
                      <p className="font-serif italic text-base text-slate-800 leading-snug tracking-wide">
                        Tab. Rosuvastatin 10mg — 1 tab HS
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        [Night intake at bedtime • Lipid management]
                      </p>
                    </div>

                    {/* Handwritten Doctor Follow-up Advice */}
                    <div className="pl-4 border-l-2 border-amber-600/40 space-y-0.5 pt-1">
                      <p className="font-serif italic text-sm text-slate-700">
                        Check ALT / LFTs & Fasting Glucose after 4 wks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Tag */}
                <div className="pt-4 mt-4 border-t border-[#e2d5bd] flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-amber-800 font-medium">
                    <AlertTriangleIcon size={12} className="text-amber-600" />
                    <span>Thermal ink fades within 60 days</span>
                  </span>
                  <span>PHYSICAL VOUCHER #9021</span>
                </div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                RIGHT ARTIFACT: Structured Enclave Extract with Laser Sweep
               ───────────────────────────────────────────────────────────── */}
            {(viewMode === 'split' || viewMode === 'vault') && (
              <motion.div
                layout
                className={`${
                  viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
                } rounded-2xl bg-white border border-teal-200/90 p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between`}
              >
                {/* Turquoise Laser Sweep Animation */}
                <motion.div
                  aria-hidden="true"
                  animate={{
                    top: ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_14px_rgba(20,184,166,0.95)] z-20 pointer-events-none"
                />

                <div>
                  {/* Extracted Card Header */}
                  <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-100 mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-xs">
                        <CheckIcon size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          FHIR R4 Structured Clinical Vault
                        </h4>
                        <p className="text-[10px] font-mono text-teal-700">
                          Deconstructed into Chemical Entities
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold font-mono">
                      CONFIDENCE: 99.8%
                    </span>
                  </div>

                  {/* Extracted Item 1 */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-teal-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
                          <CapsuleIcon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">Metformin Hydrochloride</p>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                              500 mg
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Schedule: Twice Daily (BD) • Meal: Breakfast & Dinner
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md self-start sm:self-center">
                        Verified Safe
                      </span>
                    </div>

                    {/* Extracted Item 2 */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-teal-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
                          <CapsuleIcon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">Rosuvastatin Calcium</p>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                              10 mg
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Schedule: Bedtime (HS) • Window: 10:00 PM
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md self-start sm:self-center">
                        Circadian Logged
                      </span>
                    </div>

                    {/* Real-time Sentinel Collision Audit */}
                    <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 text-[11px] text-teal-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldIcon size={14} className="text-teal-700 shrink-0" />
                        <span>Sentinel Overdose Audit: <strong>0 active collisions</strong></span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold">100% CLEAR</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Verification Note */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1 text-teal-700 font-semibold">
                    <CheckIcon size={12} className="text-teal-600" />
                    <span>Zero Silent AI Commits: Awaiting 1-Click Patient Signoff</span>
                  </span>
                  <span>AES-256 ENCRYPTED</span>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* Bottom Interactive Navigation Ribbon */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">
              Interactive Clinical Transformation Simulator
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400 hidden sm:inline">Try toggling pills above</span>
            <span className="text-teal-700 font-bold">● LIVE CLIENT ENGINE</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
