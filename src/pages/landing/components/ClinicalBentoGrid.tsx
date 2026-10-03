import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CameraIcon,
  ShieldIcon,
  ClockIcon,
  LabFlaskIcon,
  DoctorIcon,
  AlertTriangleIcon,
  CheckIcon,
  HeartPulseIcon,
  LockIcon,
} from '../../../components/ui/icons';

export function ClinicalBentoGrid() {
  const [activeSlot, setActiveSlot] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [activeBiomarker, setActiveBiomarker] = useState<'alt' | 'glucose'>('alt');
  const [showCollisionAlert, setShowCollisionAlert] = useState(true);
  const [qrRevealed, setQrRevealed] = useState(false);

  return (
    <section
      id="bento-vault"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 border-b border-slate-200/80 relative overflow-hidden scroll-mt-28"
    >
      {/* Precision Blueprint Coordinate Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.2] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[11px]">The Health Vault Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.08]">
            Everything in one place.
            <br />
            <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Engineered for clinical reality.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Your handwritten prescriptions, circadian schedules, and longitudinal blood markers—intelligently organized, private by design, and completely patient-governed.
          </p>
        </motion.div>

        {/* 7-Tile Balanced Bento Grid (3-column desktop layout, zero empty holes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* ─────────────────────────────────────────────────────────────
              ROW 1, TILE 1: Multimodal Optical Prescription Scanner (Spans 2 cols)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="lg:col-span-2 p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-400/90 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Top decorative gradient sheen */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-50/60 to-transparent rounded-bl-full pointer-events-none -mr-10 -mt-10" />

            <div className="rounded-2xl bg-slate-50/90 border border-slate-200/90 p-5 sm:p-6 mb-7 relative overflow-hidden shadow-inner">
              {/* Animated laser scanning line */}
              <motion.div
                aria-hidden="true"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_12px_rgba(20,184,166,0.8)] pointer-events-none z-20"
              />

              {/* Clinic Header Stamp */}
              <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-200/80 mb-4 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-mono font-bold text-xs flex items-center justify-center">
                    Rx
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Dr. Tariq Mansoor, MBBS, FCPS • General Medicine
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">Reg #PMC-84921 • Lahore General Hospital</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1.5">
                  <CheckIcon size={12} className="text-teal-700" />
                  <span>Digitized & Verified (99.8%)</span>
                </span>
              </div>

              {/* Extracted Regimen Items */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-teal-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">Metformin HCl 500 mg</p>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        Oral Tablet
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">1 tablet twice daily with meals (BD)</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold self-start sm:self-center">
                    Morning & Evening
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-teal-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">Rosuvastatin Calcium 10 mg</p>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Lipid Regimen
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">1 tablet once daily at bedtime (HS)</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold self-start sm:self-center">
                    Bedtime (10:00 PM)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">
                <CameraIcon size={16} />
                <span>Multimodal Optical Engine</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Instant prescription capture
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                Snap any physical doctor slip or clinic receipt. Curewell converts messy handwriting into clean, structured daily schedules with <strong className="text-slate-900 font-semibold">zero silent commits</strong>—you review and confirm every dose before saving.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              ROW 1, TILE 2: Sentinel Duplicate Overdose Guard (Spans 1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-rose-400/90 transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/90 mb-7 space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangleIcon size={15} className="text-rose-600" />
                  Sentinel Molecule Collision
                </span>
                <button
                  onClick={() => setShowCollisionAlert(!showCollisionAlert)}
                  className="px-2 py-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                >
                  {showCollisionAlert ? 'Active Collision' : 'Test Mode'}
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="p-2.5 rounded-lg bg-white border border-rose-200/80 text-xs flex justify-between shadow-2xs">
                  <span className="font-bold text-slate-900">Panadol 500mg</span>
                  <span className="text-rose-700 font-mono font-bold">Paracetamol</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-rose-200/80 text-xs flex justify-between shadow-2xs">
                  <span className="font-bold text-slate-900">Calpol 250mg</span>
                  <span className="text-rose-700 font-mono font-bold">Paracetamol</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1 font-mono">
                  <span>Cumulative load: <strong className="text-rose-700 font-bold">2,500 mg</strong></span>
                  <span className="text-slate-400">Ceiling: 4,000 mg</span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-rose-600 h-full rounded-full transition-all duration-500"
                    style={{ width: showCollisionAlert ? '62.5%' : '25%' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">
                <ShieldIcon size={16} />
                <span>Drug Interaction Guard</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Duplicate medicine guard
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Alerts you when two different commercial brand names share the identical active chemical molecule, preventing accidental liver toxicity across clinics.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              ROW 2, TILE 3: Circadian Chronotherapy Dial (Spans 1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-400/90 transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 mb-7 space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-slate-200/70 w-full text-center">
                  {(['morning', 'afternoon', 'evening', 'night'] as const).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setActiveSlot(slot)}
                      className={`py-1 rounded text-[11px] font-mono font-bold capitalize transition-all cursor-pointer ${
                        activeSlot === slot
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {slot === 'morning' ? '08:00' : slot === 'afternoon' ? '14:00' : slot === 'evening' ? '19:30' : '22:00'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Details */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                {activeSlot === 'morning' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Metformin HCl 500mg</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                        With breakfast
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">Slot: 08:00 AM • Logged on time</p>
                  </div>
                )}
                {activeSlot === 'afternoon' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Vitamin D3 2000 IU</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold font-mono">
                        Post-lunch
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">Slot: 02:00 PM • Take with water</p>
                  </div>
                )}
                {activeSlot === 'evening' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Metformin HCl 500mg</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                        With dinner
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">Slot: 07:30 PM • 2nd daily dose</p>
                  </div>
                )}
                {activeSlot === 'night' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Rosuvastatin 10mg</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold font-mono">
                        At bedtime
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">Slot: 10:00 PM • Lipid window</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">
                <ClockIcon size={16} />
                <span>Circadian Chronotherapy</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Meal-aligned daily timetable
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Medicines work best when aligned with biological rhythms. Curewell automatically organizes your regimen by circadian daypart with meal rules.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              ROW 2, TILE 4: Longitudinal Biomarker Velocity (Spans 1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-400/90 transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 mb-7 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveBiomarker('alt')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeBiomarker === 'alt'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    ALT Liver
                  </button>
                  <button
                    onClick={() => setActiveBiomarker('glucose')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeBiomarker === 'glucose'
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    HbA1c
                  </button>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold font-mono">
                  {activeBiomarker === 'alt' ? '-46% Normalized' : '6.1% ADA Target'}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {activeBiomarker === 'alt' ? '42' : '6.1'}
                  </span>
                  <span className="text-xs text-slate-500 ml-1 font-mono">
                    {activeBiomarker === 'alt' ? 'U/L' : '%'}
                  </span>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {activeBiomarker === 'alt' ? 'Target Range (7–56 U/L)' : 'Optimal Glycemic Control'}
                  </p>
                </div>
              </div>

              {/* Rich SVG Area Chart */}
              <div className="pt-2">
                <svg className="w-full h-18" viewBox="0 0 260 70" fill="none">
                  <defs>
                    <linearGradient id="curve-fill-alt-rich" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Target green safe zone band */}
                  <rect x="0" y="38" width="260" height="32" fill="#ecfdf5" opacity="0.6" />
                  <line x1="0" y1="38" x2="260" y2="38" stroke="#a7f3d0" strokeDasharray="3 3" strokeWidth="1" />
                  
                  <path
                    d="M 10 16 C 60 18, 120 42, 180 50 C 215 54, 240 58, 250 60 L 250 70 L 10 70 Z"
                    fill="url(#curve-fill-alt-rich)"
                  />
                  <path
                    d="M 10 16 C 60 18, 120 42, 180 50 C 215 54, 240 58, 250 60"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="16" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="180" cy="50" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="250" cy="60" r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                </svg>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>90 Days Ago (High)</span>
                  <span className="text-emerald-700 font-semibold">Normalized Baseline</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">
                <LabFlaskIcon size={16} />
                <span>Biomarker Velocity</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Lab trends over time
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                See your blood test progress visually. Curewell extracts values across labs and plots rate-of-change curves instead of leaving you with lost PDFs.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              ROW 2, TILE 5: 10-Second Emergency Paramedic QR Pass (Spans 1 col — Fills row 2 completely!)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-400/90 transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 mb-7 space-y-3.5 shadow-inner text-center">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-mono font-bold text-rose-700 flex items-center gap-1.5">
                  <HeartPulseIcon size={14} className="text-rose-600 animate-pulse" />
                  EMERGENCY PARAMEDIC PASS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  LOCKSCREEN
                </span>
              </div>

              {/* QR Mockup & Details */}
              <div className="flex items-center justify-center gap-4 py-1">
                <button
                  type="button"
                  onClick={() => setQrRevealed(!qrRevealed)}
                  className="w-18 h-18 rounded-2xl bg-teal-900 text-white flex flex-col items-center justify-center font-mono text-[10px] font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
                >
                  <span className="text-xs">QR PASS</span>
                  <span className="text-[9px] text-teal-300">#829-411</span>
                </button>
                <div className="text-left space-y-1">
                  <p className="text-xs font-bold text-slate-900">Blood Group: <strong className="text-teal-800">B+ (Rh+)</strong></p>
                  <p className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Allergy: Penicillin
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">ICE: +92 300 4819284</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">
                <ShieldIcon size={16} />
                <span>Emergency Readiness</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                10-Second paramedic pass
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                First responders can view your blood group, severe allergies, and active medications in seconds directly from your lock screen without needing your passcode.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              ROW 3, TILE 6: 1-Page Physician Consultation Brief (Spans 2 cols)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-400/90 transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 mb-7 space-y-3 shadow-inner">
              <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-200/80 gap-2">
                <div className="flex items-center gap-2">
                  <DoctorIcon size={16} className="text-teal-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Clinical Consultation Brief • 1-Page Summary
                  </span>
                </div>
                <span className="text-[11px] font-mono text-teal-800 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  READY FOR 5-MIN VISIT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs hover:border-teal-200 transition-colors">
                  <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider font-mono">Therapeutic Review</p>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    "Liver enzymes normalized (ALT 42 U/L, -46%). Should Metformin stay at 500mg BD or taper?"
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs hover:border-teal-200 transition-colors">
                  <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider font-mono">Biomarker Schedule</p>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    "Serum Creatinine 0.9 mg/dL stable. Fasting blood glucose 30-day baseline down 14 mg/dL."
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">
                <DoctorIcon size={16} />
                <span>Physician Dossiers</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5">
                Make 5-minute doctor visits count
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                Walk into busy clinic appointments with a concise 1-page summary of your vitals trends, active medications, and prioritized questions—no frantic memory searches.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              ROW 3, TILE 7: Zero-Knowledge Client Enclave (Spans 1 col — Fills row 3 completely!)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-400/90 transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/90 mb-7 space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                <span className="text-xs font-mono font-bold text-teal-900 flex items-center gap-1.5">
                  <LockIcon size={14} className="text-teal-700" />
                  CLIENT-SIDE ENCLAVE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-700 text-white font-bold">
                  AES-256
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-white border border-teal-200 flex items-center justify-between shadow-2xs">
                  <span className="text-slate-600">Client Key Hash:</span>
                  <span className="text-teal-800 font-bold">SHA-256 Verified</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-teal-200 flex items-center justify-between shadow-2xs">
                  <span className="text-slate-600">Silent AI Commits:</span>
                  <span className="text-emerald-700 font-bold">0 Enforced</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1.5 font-mono">
                <ShieldIcon size={16} />
                <span>Zero-Knowledge Guarantee</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Zero data selling
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Your medical data is encrypted with keys only you possess. We never sell records to advertisers, pharmaceutical brokers, or insurance companies.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
