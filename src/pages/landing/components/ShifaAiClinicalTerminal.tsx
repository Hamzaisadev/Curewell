import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  SparklesIcon,
  ShieldIcon,
  ActivityIcon,
  BarChartIcon,
  AlertTriangleIcon,
  LabFlaskIcon,
  DoctorIcon,
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
      { name: 'Lab: HbA1c 6.1%', tag: 'Aug 20', color: 'text-blue-300' },
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
      { name: 'Patient Vault: Complete Record History', tag: 'Verified Only', color: 'text-purple-300' },
      { name: 'Operating Mode: Patient-Grounded', tag: 'Zero Guesswork', color: 'text-teal-300' },
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

  return (
    <section id="shifa-ai" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 relative overflow-hidden border-b border-slate-200">
      {/* Millimeter Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Explainer & Scenario Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-5"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <SparklesIcon size={14} className="text-teal-700" />
              <span>Clinical Co-Pilot</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Meet Shifa AI.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              An intelligent clinical layer grounded strictly in your verified records. It cross-checks blood pressure, glucose logs, lab trajectories, and medication schedules without guessing.
            </p>

            {/* Scenario Selector */}
            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Interactive Scenarios:
              </p>
              {TERMINAL_SCENARIOS.map((scenario) => {
                const isActive = selectedScenario.id === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-2xs ${
                      isActive
                        ? 'bg-teal-50/80 border-teal-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {scenario.icon}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isActive ? 'text-teal-950' : 'text-slate-800'}`}>
                          {scenario.label}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{scenario.userPrompt}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded shrink-0 ${
                        isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {scenario.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
              <ShieldIcon size={14} className="text-teal-700" />
              <span>Deterministic record retrieval • Zero silent commits</span>
            </div>
          </motion.div>

          {/* Right Column: High-Contrast Terminal Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-white">
              {/* Terminal Title Bar */}
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono font-medium text-slate-300">
                    shifa-clinical-terminal
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
                  Connected
                </span>
              </div>

              {/* Chat Simulation Area */}
              <div className="p-5 sm:p-7 space-y-4 bg-slate-950 min-h-[440px]">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-teal-700 text-white rounded-2xl rounded-br-xs px-4 py-3 max-w-[400px] text-xs leading-relaxed font-medium">
                    {selectedScenario.userPrompt}
                  </div>
                </div>

                {/* AI Grounded Response */}
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-bl-xs p-4 sm:p-5 max-w-[500px] space-y-3 shadow-md">
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                      {selectedScenario.aiResponse}
                    </p>

                    {/* Integrated Clinical Callout Box */}
                    <div
                      className={`p-3.5 rounded-xl border space-y-1 ${
                        selectedScenario.highlightType === 'alert'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          : selectedScenario.highlightType === 'trajectory'
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                          : selectedScenario.highlightType === 'info'
                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                          : 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <ActivityIcon size={14} />
                        <span>{selectedScenario.highlightTitle}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedScenario.highlightDesc}
                      </p>
                    </div>

                    {/* Verified Record Citations */}
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Verified Sources in Vault:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedScenario.sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-black/50 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1"
                          >
                            <span className={src.color}>{src.name}</span>
                            <span className="text-slate-500">[{src.tag}]</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Follow-up Action Suggestions */}
                <div className="pt-2 space-y-1.5">
                  <p className="text-[10px] uppercase font-semibold text-slate-500">
                    Suggested Actions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.suggestedActions.map((action, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <SparklesIcon size={11} className="text-teal-400" />
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
