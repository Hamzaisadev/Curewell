import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SparklesIcon,
  ShieldIcon,
  BarChartIcon,
  AlertTriangleIcon,
  LabFlaskIcon,
  DoctorIcon,
  CheckIcon,
} from '../../../components/ui/icons';

interface TerminalScenario {
  id: string;
  label: string;
  icon: ReactNode;
  badge: string;
  userPrompt: string;
  aiResponse: string;
  highlightTitle: string;
  highlightDesc: string;
  highlightType: 'ok' | 'alert' | 'info' | 'trajectory';
  sources: Array<{ name: string; tag: string; color: string }>;
  suggestedActions: string[];
}

const TERMINAL_SCENARIOS: TerminalScenario[] = [
  {
    id: 'glucose-regimen',
    label: 'Glucose & Medication Trend',
    icon: <BarChartIcon size={14} />,
    badge: 'Clinical Telemetry',
    userPrompt: 'What is my fasting glucose trend and how does it correlate with my Metformin schedule?',
    aiResponse:
      'Your latest fasting blood glucose was 108 mg/dL (6.0 mmol/L) on Aug 28, falling within the Near Target range (ADA fasting goal: 70–99 mg/dL).',
    highlightTitle: 'Regimen Correlation & Glycemic Velocity',
    highlightDesc:
      'Coupled with your active Metformin 500mg BD and recent HbA1c of 6.1%, your 30-day fasting baseline improved by 14 mg/dL with zero reported hypoglycemic dips.',
    highlightType: 'ok',
    sources: [
      { name: 'Vitals: Fasting Glucose (108 mg/dL)', tag: 'Aug 28', color: 'text-teal-300' },
      { name: 'Prescription: Metformin 500mg BD', tag: 'Active', color: 'text-emerald-300' },
      { name: 'Lab: HbA1c 6.1%', tag: 'Aug 20', color: 'text-cyan-300' },
    ],
    suggestedActions: [
      'Show 30-day glucose scatter chart',
      'Generate physician review note',
      'Remind morning dose with breakfast',
    ],
  },
  {
    id: 'sentinel-safety',
    label: 'Sentinel Overdose Guard',
    icon: <AlertTriangleIcon size={14} />,
    badge: 'Safety Engine',
    userPrompt: 'Is it safe to take Panadol 500mg along with my prescribed Calpol syrup and Disprin?',
    aiResponse:
      'Safety Alert: Panadol and Calpol both contain the identical active chemical molecule Paracetamol (Acetaminophen). Taking both simultaneously creates an accidental cumulative overdose risk.',
    highlightTitle: 'Cumulative Daily Load: 2,500mg / 4,000mg Max Safe Limit',
    highlightDesc:
      'Calculated Paracetamol load: Panadol (2x 500mg = 1000mg) + Calpol (1500mg). Do not take overlapping brand names. Aspirin (Disprin) also increases gastric irritation if taken together.',
    highlightType: 'alert',
    sources: [
      { name: 'Sentinel: Generic Molecule Registry', tag: 'Pharmacopeia Verified', color: 'text-rose-300' },
      { name: 'Active Molecule: Paracetamol', tag: 'Duplicate Brand Detected', color: 'text-amber-300' },
    ],
    suggestedActions: [
      'Stop duplicate brand intake immediately',
      'Ask doctor for a safe alternative for headache',
      'Set Paracetamol daily limit safeguard',
    ],
  },
  {
    id: 'biomarker-trajectory',
    label: 'Lab Biomarker Velocity',
    icon: <LabFlaskIcon size={14} />,
    badge: 'Biomarker Velocity',
    userPrompt: 'How are my liver enzymes (ALT/SGPT) and kidney markers trending over the past 3 months?',
    aiResponse:
      'Your ALT (SGPT) decreased from 78 U/L (High) down to 42 U/L (Normal) following lifestyle adjustments and medication adherence (-46.1% improvement).',
    highlightTitle: 'Biomarker Velocity: Normalization Trend',
    highlightDesc:
      'Serum Creatinine remains optimal at 0.9 mg/dL (eGFR > 90 mL/min/1.73m²), showing stable kidney function alongside your current prescription regimen.',
    highlightType: 'trajectory',
    sources: [
      { name: 'Lab: Diagnostic Center Report', tag: 'July 14 vs Aug 22', color: 'text-teal-300' },
      { name: 'Biomarker: ALT / SGPT delta -46%', tag: 'Normalized', color: 'text-emerald-300' },
      { name: 'Biomarker: Serum Creatinine 0.9', tag: 'Optimal', color: 'text-cyan-300' },
    ],
    suggestedActions: [
      'Export liver biomarker trend graph',
      'Share report with Gastroenterologist',
      'Set 3-month follow-up lab reminder',
    ],
  },
  {
    id: 'doctor-prep',
    label: 'Doctor Prep Brief',
    icon: <DoctorIcon size={14} />,
    badge: '1-Click Dossier',
    userPrompt: 'Prepare a 1-page consultation brief with high-priority questions for my doctor appointment tomorrow.',
    aiResponse:
      'Consultation dossier generated with 4 active medications, 14-day vitals history (Avg BP 122/78, Fasting Glucose 106 mg/dL), and 3 high-yield questions.',
    highlightTitle: 'High-Priority Consultation Checklist Ready',
    highlightDesc:
      '1. [HIGH] Review ALT normalization and confirm whether Metformin 500mg dose should remain at BD. 2. [MEDIUM] Inquire about Vitamin D3 maintenance dose.',
    highlightType: 'info',
    sources: [
      { name: 'Patient Vault: Complete Record History', tag: 'Verified Only', color: 'text-teal-300' },
      { name: 'Operating Mode: Patient-Grounded', tag: 'Zero Guesswork', color: 'text-emerald-300' },
    ],
    suggestedActions: [
      'Print 1-Page Doctor PDF',
      'Generate 6-Digit Secure PIN Pass',
      'Add consultation notes to timeline',
    ],
  },
];

export function ShifaAiClinicalTerminal() {
  const [selectedScenario, setSelectedScenario] = useState<TerminalScenario>(
    TERMINAL_SCENARIOS[0] as TerminalScenario
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleActionClick = (action: string) => {
    setActionNotice(`Simulated Action: "${action}" triggered`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <section id="shifa-ai" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 scroll-mt-28">
      {/* Millimeter Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(20, 184, 166, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20, 184, 166, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient glowing radial blur */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Explainer & Interactive Scenario Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-semibold">
              <SparklesIcon size={14} className="text-teal-400 animate-pulse" />
              <span>Grounded Clinical Intelligence</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
              Meet Shifa AI.
              <br />
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Zero Hallucinations.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              An intelligent clinical layer grounded strictly in your verified records. It cross-checks blood pressure, glucose logs, lab trajectories, and medication schedules without guessing or making silent commits.
            </p>

            {/* Scenario Selector */}
            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                Interactive Clinical Scenarios:
              </p>
              {TERMINAL_SCENARIOS.map((scenario) => {
                const isActive = selectedScenario.id === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-slate-800/90 border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {scenario.icon}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {scenario.label}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{scenario.userPrompt}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                        isActive ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {scenario.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldIcon size={14} className="text-teal-400" />
              <span>100% Patient Approval • Deterministic Grounding</span>
            </div>
          </motion.div>

          {/* Right Column: High-Contrast Obsidian Terminal Workstation */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden text-white relative">
              {/* Top Specular Line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

              {/* Terminal Title Bar */}
              <div className="px-5 py-3.5 border-b border-slate-800/90 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
                  <span className="ml-2 text-xs font-mono font-bold text-slate-300">
                    shifa-clinical-engine // v4.0.0
                  </span>
                </div>
                
                {/* Audio Wave Visualizer Simulation */}
                <div className="flex items-center gap-1">
                  {[4, 12, 8, 16, 10, 6, 14, 8].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [h, Math.max(3, (h * 1.6) % 18), h],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-1 bg-teal-400 rounded-full"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                  <span className="text-[10px] font-mono font-bold text-emerald-400 ml-2">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Chat Simulation Area */}
              <div className="p-5 sm:p-7 space-y-4 bg-slate-950/95 min-h-[460px] flex flex-col justify-between">
                <div className="space-y-4">
                  {/* User Query Message */}
                  <div className="flex justify-end">
                    <div className="bg-teal-700 text-white rounded-2xl rounded-br-xs px-4 py-3 max-w-[420px] text-xs sm:text-sm leading-relaxed font-medium shadow-md">
                      {selectedScenario.userPrompt}
                    </div>
                  </div>

                  {/* AI Grounded Response */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedScenario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-bl-xs p-4 sm:p-5 max-w-[540px] space-y-3.5 shadow-xl">
                        <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold">
                          <SparklesIcon size={14} className="text-teal-300" />
                          <span>SHIFA CLINICAL SYNTHESIS:</span>
                        </div>

                        <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                          {selectedScenario.aiResponse}
                        </p>

                        {/* Highlight Card */}
                        <div
                          className={`p-3.5 rounded-xl border ${
                            selectedScenario.highlightType === 'alert'
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                              : 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                          }`}
                        >
                          <p className="text-xs font-bold mb-1 flex items-center gap-1.5 font-mono">
                            {selectedScenario.highlightType === 'alert' ? (
                              <AlertTriangleIcon size={14} className="text-rose-400" />
                            ) : (
                              <CheckIcon size={14} className="text-teal-400" />
                            )}
                            <span>{selectedScenario.highlightTitle}</span>
                          </p>
                          <p className="text-xs leading-relaxed text-slate-300 font-sans">
                            {selectedScenario.highlightDesc}
                          </p>
                        </div>

                        {/* Grounded Sources */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                            Grounded Verified Records (Zero Hallucinations):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedScenario.sources.map((source, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-teal-500/50 transition-colors"
                              >
                                <span className={source.color}>{source.name}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">{source.tag}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Suggested Action Chips */}
                        <div className="pt-2">
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                            Suggested Next Actions:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedScenario.suggestedActions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleActionClick(action)}
                                className="px-2.5 py-1 rounded-lg bg-teal-950/70 hover:bg-teal-900 border border-teal-700/50 text-teal-300 text-xs font-medium transition-all hover:scale-[1.02] cursor-pointer"
                              >
                                {action} &rarr;
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Action notice feedback */}
                {actionNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2 rounded bg-teal-900/80 border border-teal-500 text-teal-200 text-xs font-mono text-center"
                  >
                    {actionNotice}
                  </motion.div>
                )}

                {/* Terminal Command Line */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="text-teal-400">&gt;</span>
                    <span className="text-slate-400">RAG_PIPELINE --grounding=100% --zero-silent-commits</span>
                  </span>
                  <span className="text-emerald-400">READY</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
