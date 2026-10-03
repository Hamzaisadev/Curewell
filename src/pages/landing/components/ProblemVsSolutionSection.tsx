import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  XIcon,
  CheckIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from '../../../components/ui/icons';

interface ComparisonItem {
  id: string;
  category: string;
  problemTitle: string;
  problemDesc: string;
  problemVisual: string;
  solutionTitle: string;
  solutionDesc: string;
  solutionVisual: string;
  solutionMetric: string;
}

const COMPARISONS: ComparisonItem[] = [
  {
    id: 'paper-fading',
    category: 'Prescription Records',
    problemTitle: 'Lost in Drawers & Shoeboxes',
    problemDesc:
      'Paper prescriptions fade under thermal printer ink, tear in wallets, and get left behind when visiting new doctors or travelling abroad.',
    problemVisual: 'Faded paper slip • Ink degraded • Zero searchability',
    solutionTitle: 'Zero-Friction Structured Vault',
    solutionDesc:
      'Snap any paper slip in 5 seconds. Curewell digitizes chemical dosage, frequency, and prescriber credentials into a permanent, searchable vault.',
    solutionVisual: 'Encrypted FHIR-R4 Enclave • 100% OCR Confidence • Searchable',
    solutionMetric: '100% Preserved Forever',
  },
  {
    id: 'duplicate-toxicity',
    category: 'Medication Safety',
    problemTitle: 'Accidental Duplicate Overdose',
    problemDesc:
      'Visiting different clinics yields different trade names (e.g. Panadol vs Calpol) sharing the identical chemical molecule, causing silent liver stress.',
    problemVisual: '2 Brand Names • Overlapping Paracetamol • 2,500mg/day',
    solutionTitle: 'Pharmacological Collision Radar',
    solutionDesc:
      'Sentinel decomposes every trade name into its base active chemical molecules, alerting you immediately if cumulative daily limits are breached.',
    solutionVisual: 'Molecule-Level Decomposition • Real-Time Daily mg Ceiling',
    solutionMetric: 'Zero Toxic Overlap',
  },
  {
    id: 'lab-velocity',
    category: 'Diagnostic Biomarkers',
    problemTitle: 'Scattered WhatsApp Lab PDFs',
    problemDesc:
      'Routine blood tests get buried in family chat threads. Comparing HbA1c or ALT across 6 months requires opening 10 separate PDF attachments.',
    problemVisual: '12 Loose PDF attachments • No velocity curves • Blind trends',
    solutionTitle: 'Longitudinal Trajectory Curves',
    solutionDesc:
      'Automatic biomarker extraction normalizes units across labs (Chughtai, Shaukat Khanum, Aga Khan, Quest) and graphs your actual rate-of-change.',
    solutionVisual: 'Cross-Lab Normalization • Dynamic ADA / ACC Reference Zones',
    solutionMetric: '30-Day Trend Velocity',
  },
  {
    id: 'doctor-brief',
    category: 'Consultation Efficiency',
    problemTitle: 'Forgotten Details in 5-Min Visits',
    problemDesc:
      'Rushed hospital consultations lead patients to forget recent dose adjustments, side effects, and critical questions when sitting before the physician.',
    problemVisual: 'Memory blanks • Scattered receipts • 5-min wasted appointment',
    solutionTitle: '1-Page Clinical Consultation Dossier',
    solutionDesc:
      'Generates a standardized clinical brief summarizing active medications, 30-day vitals trends, and prioritized questions ready for your doctor.',
    solutionVisual: 'Printable / PDF Dossier • Top 3 Priority Review Questions',
    solutionMetric: '30-Sec Doctor Review',
  },
  {
    id: 'emergency-pass',
    category: 'Critical Paramedic Care',
    problemTitle: 'Blind Emergency Care Trips',
    problemDesc:
      'In an unexpected road accident or diabetic fainting episode, emergency room medics have zero access to your severe allergies or medication history.',
    problemVisual: 'Unconscious patient • Unknown allergies • High treatment risk',
    solutionTitle: '10-Second Emergency QR Pass',
    solutionDesc:
      'First responders scan a secure, tamper-proof QR code directly from your lock screen to immediately view blood group, severe allergies, and cardiac history.',
    solutionVisual: 'Lock-Screen Access • Blood Group B+ • Penicillin Anaphylaxis',
    solutionMetric: 'Instant Paramedic Access',
  },
];

export function ProblemVsSolutionSection() {
  const [activeTab, setActiveTab] = useState<string>('paper-fading');
  const activeItem: ComparisonItem = COMPARISONS.find((c) => c.id === activeTab) ?? COMPARISONS[0]!;

  return (
    <section id="problem-solution" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200 relative overflow-hidden scroll-mt-28">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-18"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold mb-3">
            <span>The Reality Check</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Paper records fail when it matters most.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed font-normal">
            Why managing chronic healthcare on physical slips and WhatsApp chats breaks down—and how the Curewell Health OS eliminates the danger.
          </p>
        </motion.div>

        {/* Category Pill Switcher */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {COMPARISONS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-900/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {item.category}
            </button>
          ))}
        </div>

        {/* Interactive Side-by-Side Transformation Stage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
          >
            {/* The Broken Reality Card */}
            <div className="p-7 sm:p-9 rounded-3xl bg-slate-50 border border-slate-200/90 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-mono text-xs font-bold flex items-center gap-1.5">
                    <XIcon size={14} className="text-rose-700" />
                    <span>THE BROKEN REALITY</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">STATUS QUO</span>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {activeItem.problemTitle}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed mb-6 font-normal">
                  {activeItem.problemDesc}
                </p>
              </div>

              {/* Visual Mock of the problem */}
              <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-2xs">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold mb-1">
                  <AlertTriangleIcon size={14} />
                  <span>Clinical Risk Factor:</span>
                </div>
                <p className="text-xs font-mono text-slate-700">{activeItem.problemVisual}</p>
              </div>
            </div>

            {/* The Curewell Standard Card */}
            <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white border border-teal-700/60 shadow-xl relative overflow-hidden flex flex-col justify-between">
              {/* Subtle Ambient Blueprint Glow */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between pb-4 border-b border-teal-700/60 mb-6">
                  <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 font-mono text-xs font-bold flex items-center gap-1.5">
                    <CheckIcon size={14} className="text-teal-300" />
                    <span>THE CUREWELL STANDARD</span>
                  </span>
                  <span className="text-xs font-mono text-teal-300 font-bold">{activeItem.solutionMetric}</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  {activeItem.solutionTitle}
                </h3>
                <p className="text-base text-teal-100 leading-relaxed mb-6 font-normal">
                  {activeItem.solutionDesc}
                </p>
              </div>

              {/* Verified Visual Mock */}
              <div className="relative z-10 p-4 rounded-2xl bg-teal-950/80 border border-teal-600/40 shadow-inner">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-bold mb-1">
                  <ShieldIcon size={14} className="text-teal-400" />
                  <span>Curewell Enclave Output:</span>
                </div>
                <p className="text-xs font-mono text-teal-100">{activeItem.solutionVisual}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
