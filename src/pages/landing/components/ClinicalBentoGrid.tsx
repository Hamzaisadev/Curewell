import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CameraIcon,
  ShieldIcon,
  ClockIcon,
  LabFlaskIcon,
  DoctorIcon,
  ZapIcon,
  AlertTriangleIcon,
  CheckIcon,
} from '../../../components/ui/icons';

export function ClinicalBentoGrid() {
  const [activeSlot, setActiveSlot] = useState<'morning' | 'night'>('morning');

  return (
    <section id="bento-vault" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto">
        {/* Section Header with Motion Animation */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-14 sm:mb-20"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">
            The Health Vault
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Everything in one place.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Your prescriptions, daily schedules, and lab results — intelligently organized and private by design.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* ─────────────────────────────────────────────────────────────
              CARD 1: Optical Prescription Scanner (Spans 2 cols)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="lg:col-span-2 p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            {/* Elegant Document Preview */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-5 sm:p-6 mb-7">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Dr. Tariq Mansoor • General Medicine
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-1">
                  <CheckIcon size={12} className="text-teal-700" />
                  <span>Digitized & Verified</span>
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Metformin 500 mg</p>
                    <p className="text-xs text-slate-500">1 tablet twice daily with meals</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium self-start sm:self-center">
                    Morning & Evening
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Rosuvastatin 10 mg</p>
                    <p className="text-xs text-slate-500">1 tablet once daily at bedtime</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium self-start sm:self-center">
                    Bedtime (10:00 PM)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1.5">
                <CameraIcon size={16} />
                <span>Prescription Capture</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5">
                Instant prescription capture
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Snap any physical doctor slip or clinic receipt. Curewell converts handwritten instructions into clean daily schedules with your 1-click confirmation.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 2: Sentinel Duplicate Overdose Guard (1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 mb-7 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangleIcon size={14} className="text-rose-600" />
                  Duplicate Molecule Guard
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-medium">
                  Safety Warning
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="p-2.5 rounded-lg bg-white border border-rose-200/80 text-xs flex justify-between shadow-2xs">
                  <span className="font-semibold text-slate-900">Panadol 500mg</span>
                  <span className="text-rose-700 font-medium">Paracetamol</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-rose-200/80 text-xs flex justify-between shadow-2xs">
                  <span className="font-semibold text-slate-900">Calpol 250mg</span>
                  <span className="text-rose-700 font-medium">Paracetamol</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Current load: <strong className="text-rose-700 font-bold">2,500 mg</strong></span>
                  <span className="text-slate-400">Max limit: 4,000 mg</span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: '62.5%' }} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold mb-1.5">
                <ShieldIcon size={16} />
                <span>Drug Interaction Guard</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Duplicate medicine guard
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Alerts you when two different brand names contain the exact same active drug, preventing accidental cumulative toxicity.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 3: Longitudinal Biomarker Velocity (1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">ALT (Liver Enzyme)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  -46% Normalized
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-3xl font-bold text-slate-900">42</span>
                  <span className="text-xs text-slate-500 ml-1">U/L</span>
                  <p className="text-xs text-emerald-700 font-medium">Within target range (7–56)</p>
                </div>
              </div>

              {/* Graceful Area Chart */}
              <div className="pt-2">
                <svg className="w-full h-16" viewBox="0 0 260 64" fill="none">
                  <defs>
                    <linearGradient id="curve-fill-light" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 12 C 50 14, 110 38, 170 46 C 210 52, 240 56, 250 58 L 250 64 L 10 64 Z"
                    fill="url(#curve-fill-light)"
                  />
                  <path
                    d="M 10 12 C 50 14, 110 38, 170 46 C 210 52, 240 56, 250 58"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="12" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="250" cy="58" r="4" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                </svg>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Jul 14 (High)</span>
                  <span>Aug 22 (Normal)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-1.5">
                <LabFlaskIcon size={16} />
                <span>Lab Trend Tracking</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Lab trends over time
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                See your blood test progress visually. Curewell plots recovery trajectories instead of leaving you with scattered PDF downloads.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 4: Action Accent Card (1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-7 sm:p-9 rounded-3xl bg-teal-700 text-white flex flex-col justify-between shadow-sm hover:bg-teal-800 transition-colors"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-teal-800 border border-teal-600/40 flex items-center justify-center mb-6">
                <ZapIcon size={22} className="text-white" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-200 mb-1.5">
                Free Patient Access
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug mb-2">
                Start your health vault.
              </h3>
              <p className="text-sm text-teal-100 leading-relaxed font-normal">
                Set up in two minutes. Completely free for individuals, with zero silent commits.
              </p>
            </div>

            <div className="pt-6">
              <a
                href="#/signup"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-900 text-sm font-bold shadow-xs hover:bg-teal-50 transition-colors"
              >
                <span>Create free account</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 5: Chronotherapy Daily Schedule Clock (1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-7 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveSlot('morning')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeSlot === 'morning'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Morning
                  </button>
                  <button
                    onClick={() => setActiveSlot('night')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeSlot === 'night'
                        ? 'bg-teal-100 text-teal-900 border border-teal-300'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Night
                  </button>
                </div>
                <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                  <CheckIcon size={12} /> Scheduled
                </span>
              </div>

              {activeSlot === 'morning' ? (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Metformin 500mg</p>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                      With breakfast
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Scheduled for 8:00 AM daily</p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Rosuvastatin 10mg</p>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                      At bedtime
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Scheduled for 10:00 PM daily</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-1.5">
                <ClockIcon size={16} />
                <span>Meal-Aligned Timing</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Schedules aligned with meals
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Medicines work best when taken with the right meals. Curewell organizes your day so doses are simple to follow.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 6: 1-Page Doctor Brief (Spans 2 cols)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-7 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <DoctorIcon size={16} className="text-teal-700" />
                  <span className="text-xs font-semibold text-slate-800">
                    Consultation Brief • 1-Page Summary
                  </span>
                </div>
                <span className="text-xs text-slate-500">Ready for clinic visit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <p className="text-[11px] font-semibold text-teal-800">Dosage review</p>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    "Liver enzymes normalized (ALT 42 U/L). Should Metformin stay at 500mg twice daily?"
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <p className="text-[11px] font-semibold text-teal-800">Kidney check</p>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    "Routine kidney test (Serum Creatinine 0.9) is stable. When is next blood draw due?"
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1.5">
                <DoctorIcon size={16} />
                <span>Doctor Briefs</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5">
                Make doctor visits count
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Walk into short clinic appointments with a clear summary of your vitals, active medications, and prioritized questions.
              </p>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 7: Emergency Pass (1 col)
             ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-7 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-sm shadow-2xs">
                QR
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">Emergency PIN: 829-411</p>
                <p className="text-xs text-teal-700 font-medium">Blood: B+ • Allergy: Penicillin</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold mb-1.5">
                <ShieldIcon size={16} />
                <span>Emergency Readiness</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                Emergency access
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                First responders can view your blood group, severe allergies, and active medications in seconds without unlocking your phone.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
