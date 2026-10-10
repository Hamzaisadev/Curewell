import { useState } from 'react';
import { motion } from 'motion/react';
import {
  DoctorIcon,
  HeartPulseIcon,
  LabFlaskIcon,
} from '../../../components/ui/icons';

export function DoctorPerspectiveSection() {
  const [activeDevice, setActiveDevice] = useState<'both' | 'doctor' | 'patient'>('both');

  return (
    <section
      id="doctor-perspective"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200/80 relative overflow-hidden scroll-mt-24"
    >
      {/* Background blueprint coordinate pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3.5 shadow-2xs">
            <DoctorIcon size={14} className="text-teal-700" />
            <span className="font-mono uppercase tracking-wider text-[11px]">The Clinical Handshake</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Make 5-minute doctor visits count.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Doctors have only 5 minutes per patient. Curewell bridges the gap between daily patient logging and high-yield clinical decision making.
          </p>

          {/* Viewport Filter Toggle */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold">
              <button
                onClick={() => setActiveDevice('both')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeDevice === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Split Perspective
              </button>
              <button
                onClick={() => setActiveDevice('patient')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeDevice === 'patient' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Patient Daily View (Mobile)
              </button>
              <button
                onClick={() => setActiveDevice('doctor')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeDevice === 'doctor' ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                Doctor 30-Sec Brief (Tablet/Desktop)
              </button>
            </div>
          </div>
        </div>

        {/* Split Device Presentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ─────────────────────────────────────────────────────────────
              PATIENT VIEW: Mobile Card (4 cols)
             ───────────────────────────────────────────────────────────── */}
          {(activeDevice === 'both' || activeDevice === 'patient') && (
            <motion.div
              layout
              className={`${
                activeDevice === 'both' ? 'lg:col-span-5' : 'lg:col-span-12 max-w-xl mx-auto'
              } rounded-3xl bg-slate-50/90 border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-4`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                    Patient Daily Companion (Mobile)
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ON-TIME
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Today’s Circadian Regimen</span>
                  <span className="text-[11px] font-mono text-slate-400">14 August 2026</span>
                </div>

                {/* Patient dose 1 */}
                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">08:00 AM • Morning Dose</p>
                      <p className="text-[10px] text-slate-500 font-mono">Metformin 500mg • With breakfast</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Logged
                  </span>
                </div>

                {/* Patient dose 2 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">10:00 PM • Bedtime Dose</p>
                      <p className="text-[10px] text-slate-500 font-mono">Rosuvastatin 10mg • Lipid window</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Due in 2h
                  </span>
                </div>
              </div>

              {/* Patient benefit explainer */}
              <div className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
                <strong className="text-slate-900 font-semibold">Zero Mental Math:</strong> Patients simply tap "Logged" after meals. Doses are automatically timestamped and synchronized into the clinical dossier.
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              DOCTOR VIEW: Tablet / Desktop 30-Second Review (7 cols)
             ───────────────────────────────────────────────────────────── */}
          {(activeDevice === 'both' || activeDevice === 'doctor') && (
            <motion.div
              layout
              className={`${
                activeDevice === 'both' ? 'lg:col-span-7' : 'lg:col-span-12'
              } rounded-3xl bg-white border border-teal-200 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-5`}
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-600 to-emerald-500" />

              <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <DoctorIcon size={18} className="text-teal-700" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      Physician Consultation Dossier • 1-Page Clinical Brief
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">
                      Standardized for 30-Second Doctor Orientation
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-mono font-bold">
                  DECISION READY
                </span>
              </div>

              {/* 3 Clinical Columns for Doctor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Block 1: 30-Day Vitals Velocity */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <HeartPulseIcon size={14} className="text-teal-700" />
                      <span>30-Day Vitals Velocity</span>
                    </span>
                    <span className="text-emerald-700">AHA NORMAL</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Average Blood Pressure:</span>
                      <strong className="text-slate-900 font-mono">118 / 76 mmHg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fasting Blood Glucose:</span>
                      <strong className="text-slate-900 font-mono">94 mg/dL (ADA Target)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Adherence Score:</span>
                      <strong className="text-emerald-700 font-mono">98.4% (Verified)</strong>
                    </div>
                  </div>
                </div>

                {/* Block 2: Lab Trajectory Normalization */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <LabFlaskIcon size={14} className="text-emerald-700" />
                      <span>Longitudinal Lab Delta</span>
                    </span>
                    <span className="text-emerald-700">-46.1%</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">ALT (SGPT) Liver:</span>
                      <strong className="text-emerald-700 font-mono">42 U/L (Was 78)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Serum Creatinine:</span>
                      <strong className="text-slate-900 font-mono">0.9 mg/dL (Stable)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">HbA1c Baseline:</span>
                      <strong className="text-slate-900 font-mono">6.1% (Near Target)</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Block 3: Prioritized Consultation Questions */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
                <span className="text-[10px] font-mono font-bold text-teal-900 uppercase tracking-wider block">
                  Prioritized Consultation Questions (Auto-Ranked):
                </span>
                <div className="space-y-1.5 text-xs text-slate-800">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-teal-700 text-white font-mono text-[9px] font-bold mt-0.5">
                      Q1
                    </span>
                    <p className="leading-snug">
                      <strong>Therapeutic Adjustment:</strong> "Liver enzymes normalized (ALT down from 78 to 42 U/L). Should Metformin 500mg dose be maintained at BD or tapered?"
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[9px] font-bold mt-0.5">
                      Q2
                    </span>
                    <p className="leading-snug">
                      <strong>Follow-up Schedule:</strong> "Next recommended LFT & HbA1c repeat cycle: 3 months or 6 months?"
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Quote from Physician */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <span className="italic text-slate-600">
                  "I don't waste 4 minutes reading loose papers; I make the right clinical decision in 30 seconds."
                </span>
                <span className="font-mono text-teal-800 font-bold">
                  Dr. Haris Abbasi, MBBS, FCPS
                </span>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </section>
  );
}
