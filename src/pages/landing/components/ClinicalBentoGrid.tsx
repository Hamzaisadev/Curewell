import { useState } from 'react';
import {
  CameraIcon,
  AlertTriangleIcon,
  ClockIcon,
  LabFlaskIcon,
  DoctorIcon,
  ShieldIcon,
  CheckIcon,
} from '../../../components/ui/icons';

export function ClinicalBentoGrid() {
  const [selectedDayPart, setSelectedDayPart] = useState<'morning' | 'night'>('morning');

  return (
    <section id="bento-vault" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-ink-950 text-white relative overflow-hidden">
      {/* Background Blueprint Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-mono uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            CORE HEALTH VAULT ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Engineered for Patient Safety.
            <br />
            <span className="text-teal-400">Crafted with Clinical Precision.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-300 leading-relaxed">
            Every feature is built around the authentic friction of real patient care — decoding messy doctor handwriting, catching accidental duplicate doses, and giving you total control.
          </p>
        </div>

        {/* The Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* ──────────────────────────────────────────────────────────
              CARD 1: Optical Prescription Scanner (Spans 2 cols on LG)
             ────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-ink-900 border border-ink-800 flex flex-col justify-between relative overflow-hidden group hover:border-ink-700 transition-all">
            {/* Inner Blueprint Canvas */}
            <div className="relative rounded-2xl bg-ink-950 border border-ink-800/80 p-5 sm:p-6 mb-6 overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(20, 184, 166, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(20, 184, 166, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between pb-4 border-b border-ink-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="ml-2 text-xs font-mono text-ink-400">RX_SCAN_ENGINE_V4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-teal-950 border border-teal-500/40 text-teal-300 text-[11px] font-mono font-bold">
                      CONFIDENCE: 99.4%
                    </span>
                  </div>
                </div>

                {/* Simulated Prescription OCR Canvas with Bounding Boxes */}
                <div className="space-y-3">
                  {/* Bounding Box 1 */}
                  <div className="p-3.5 rounded-xl border border-teal-500/50 bg-teal-950/20 relative">
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-teal-500 text-ink-950 text-[10px] font-bold uppercase tracking-wider font-mono">
                      EXTRACTED • METFORMIN
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white font-mono">Tab. Metformin HCl 500mg</p>
                        <p className="text-xs text-ink-400 font-mono">Sig: 1 Tab BD (Twice daily after meals)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-ink-900 border border-ink-800 text-[11px] font-mono text-teal-300">
                          Morning: 1 Tab (08:00 AM)
                        </span>
                        <span className="px-2 py-1 rounded bg-ink-900 border border-ink-800 text-[11px] font-mono text-teal-300">
                          Night: 1 Tab (08:00 PM)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bounding Box 2 */}
                  <div className="p-3.5 rounded-xl border border-ink-700 bg-ink-900/40 relative">
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-ink-800 text-ink-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                      EXTRACTED • LIPID REGIMEN
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white font-mono">Tab. Rosuvastatin 10mg</p>
                        <p className="text-xs text-ink-400 font-mono">Sig: 1 Tab HS (At bedtime) • Daily</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-ink-900 border border-ink-800 text-[11px] font-mono text-ink-300">
                        Night: 1 Tab (10:00 PM)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold mb-2">
                <CameraIcon size={16} />
                <span>MULTIMODAL PRESCRIPTION OCR</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Handwritten Doctor Slips Decoded in Seconds
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed max-w-2xl">
                Just snap a photo of any clinic slip. Curewell extracts medicine names, dosages, frequencies, and meal relations into structured schedules — requiring your 1-click verification before anything is saved.
              </p>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              CARD 2: Sentinel Duplicate Overdose Guard (1 col)
             ────────────────────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-ink-900 border border-rose-900/40 flex flex-col justify-between relative overflow-hidden group hover:border-rose-700/60 transition-all">
            {/* Warning Widget Visual */}
            <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 mb-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-900/50">
                <span className="text-[11px] font-mono font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangleIcon size={14} className="text-rose-400" />
                  DUPLICATE MOLECULE ALERT
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-200 text-[10px] font-mono font-black">
                  HIGH TOXICITY
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-bold">Panadol 500mg</span>
                  <span className="text-rose-300">+ Calpol Syrup</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-snug">
                  Both contain <strong>Paracetamol</strong>. Current daily load:
                </p>
              </div>

              {/* Meter bar */}
              <div>
                <div className="w-full bg-rose-950 rounded-full h-2.5 border border-rose-800/80 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: '65%' }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-rose-300 mt-1.5">
                  <span>Current: 2,500mg/day</span>
                  <span className="text-rose-400 font-bold">Max: 4,000mg</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold mb-2">
                <ShieldIcon size={16} />
                <span>SENTINEL OVERDOSE RADAR</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Stop Accidental Double-Dosing
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                In many households, families take Panadol alongside Calpol or Disprol without knowing they share the exact same active drug. Curewell calculates cumulative daily load to protect your liver.
              </p>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              CARD 3: Chronotherapy Day-Part Matrix (1 col)
             ────────────────────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-ink-900 border border-ink-800 flex flex-col justify-between relative overflow-hidden group hover:border-ink-700 transition-all">
            {/* Day Part Visual */}
            <div className="p-4 rounded-2xl bg-ink-950 border border-ink-800 mb-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-ink-800">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSelectedDayPart('morning')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      selectedDayPart === 'morning'
                        ? 'bg-amber-500 text-ink-950'
                        : 'bg-ink-900 text-ink-400 hover:text-white'
                    }`}
                  >
                    Morning (08:00)
                  </button>
                  <button
                    onClick={() => setSelectedDayPart('night')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      selectedDayPart === 'night'
                        ? 'bg-teal-500 text-ink-950'
                        : 'bg-ink-900 text-ink-400 hover:text-white'
                    }`}
                  >
                    Night (22:00)
                  </button>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckIcon size={12} /> ON TRACK
                </span>
              </div>

              {selectedDayPart === 'morning' ? (
                <div className="p-3 rounded-xl bg-ink-900 border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">Metformin 500mg</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      AFTER FOOD
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-400">Take with full breakfast to avoid gastric distress</p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-ink-900 border border-teal-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">Rosuvastatin 10mg</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      AT BEDTIME
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-400">Optimal hepatic cholesterol synthesis window</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold mb-2">
                <ClockIcon size={16} />
                <span>CHRONOTHERAPY SCHEDULER</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Doses Aligned with Biology
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                Medicines act differently depending on the time of day and meal relation. Curewell transforms cryptic prescription codes (OD, BD, AC, PC, HS) into a crystal-clear daily timetable.
              </p>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              CARD 4: Biomarker Trajectory & Delta % (1 col)
             ────────────────────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-ink-900 border border-ink-800 flex flex-col justify-between relative overflow-hidden group hover:border-ink-700 transition-all">
            {/* Sparkline & Delta Visual */}
            <div className="p-4 rounded-2xl bg-ink-950 border border-ink-800 mb-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-ink-800">
                <span className="text-xs font-mono font-bold text-ink-300">ALT / SGPT (LIVER ENZYME)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                  -46.1% VELOCITY
                </span>
              </div>

              <div className="flex items-end justify-between pt-2">
                <div>
                  <p className="text-2xl font-black text-white font-mono">42 <span className="text-xs font-normal text-ink-400">U/L</span></p>
                  <p className="text-[11px] text-emerald-400 font-bold">Normalized Range (7–56 U/L)</p>
                </div>
                {/* SVG Curve showing descent from high to normal */}
                <svg className="w-28 h-12 text-emerald-500" viewBox="0 0 120 48" fill="none">
                  <path
                    d="M 5 10 Q 40 12 70 30 T 115 42"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="5" cy="10" r="4" fill="#f43f5e" />
                  <circle cx="115" cy="42" r="4" fill="#10b981" />
                </svg>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-ink-500 pt-1 border-t border-ink-900">
                <span>Jul 14: 78 U/L (High)</span>
                <span>Aug 22: 42 U/L (Normal)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold mb-2">
                <LabFlaskIcon size={16} />
                <span>LONGITUDINAL LAB VELOCITY</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Trends Over Time, Not Just PDFs
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                Lab reports in WhatsApp chats disappear when you need them. Curewell graphs blood markers over time so you and your physician see whether treatment is actually working.
              </p>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              CARD 5: 1-Page Doctor Consultation Brief (2 cols on LG)
             ────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-ink-900 border border-ink-800 flex flex-col justify-between relative overflow-hidden group hover:border-ink-700 transition-all">
            {/* Visual Consultation Checklist */}
            <div className="p-5 rounded-2xl bg-ink-950 border border-ink-800 mb-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-ink-800">
                <div className="flex items-center gap-2">
                  <DoctorIcon size={16} className="text-teal-400" />
                  <span className="text-xs font-mono font-bold text-white">DOCTOR CONSULTATION PREP BRIEF</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 text-[10px] font-mono font-bold">
                  PRINTABLE 1-PAGE SUMMARY
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-ink-900 border border-rose-800/40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-rose-900 text-rose-200 text-[9px] font-mono font-bold">
                      HIGH PRIORITY
                    </span>
                    <span className="text-[10px] text-ink-400">Lab Inquiries</span>
                  </div>
                  <p className="text-xs font-medium text-white leading-relaxed">
                    "My liver enzyme (ALT) normalized to 42 U/L. Should Metformin 500mg remain at BD?"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-ink-900 border border-amber-800/40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-amber-900 text-amber-200 text-[9px] font-mono font-bold">
                      MEDIUM PRIORITY
                    </span>
                    <span className="text-[10px] text-ink-400">Long-term Regimen</span>
                  </div>
                  <p className="text-xs font-medium text-white leading-relaxed">
                    "Are routine kidney function tests (Serum Creatinine) recommended before next refill?"
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold mb-2">
                <DoctorIcon size={16} />
                <span>CONSULTATION DOSSIER CO-PILOT</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Make Every 5-Minute Doctor Visit Count
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed max-w-2xl">
                Patients often freeze or forget questions during rushed clinic appointments. Curewell produces a concise, prioritized 1-page brief containing your vitals history, active medicines, and high-yield questions for your doctor.
              </p>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              CARD 6: Emergency 10-Second QR Vault (1 col)
             ────────────────────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-ink-900 border border-ink-800 flex flex-col justify-between relative overflow-hidden group hover:border-ink-700 transition-all">
            {/* Visual Emergency Pass */}
            <div className="p-5 rounded-2xl bg-ink-950 border border-ink-800 mb-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-20 h-20 bg-white rounded-xl p-2 flex items-center justify-center shadow-xs">
                {/* SVG QR Code Simulation */}
                <div className="w-full h-full border-4 border-ink-950 grid grid-cols-3 gap-1 p-1">
                  <div className="bg-ink-950 rounded-xs" />
                  <div className="bg-ink-950 rounded-xs" />
                  <div className="bg-ink-950 rounded-xs" />
                  <div className="bg-ink-950 rounded-xs" />
                  <div className="border border-ink-950" />
                  <div className="bg-ink-950 rounded-xs" />
                  <div className="bg-ink-950 rounded-xs" />
                  <div className="bg-ink-950 rounded-xs" />
                  <div className="bg-ink-950 rounded-xs" />
                </div>
              </div>
              <div>
                <p className="text-xs font-mono text-ink-300 font-bold">EMERGENCY PIN: 829-411</p>
                <p className="text-[10px] text-emerald-400 font-mono">Paramedic Direct Access</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold mb-2">
                <ShieldIcon size={16} />
                <span>EMERGENCY READINESS PASS</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Immediate Access When It Matters Most
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                If an emergency strikes, doctors and first responders can scan your medical card to see your blood group, severe allergies, and active medicines without waiting for passwords.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
