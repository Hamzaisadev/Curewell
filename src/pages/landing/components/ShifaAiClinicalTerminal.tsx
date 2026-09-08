import { useState } from 'react';
import type { ReactNode } from 'react';
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
    <section id="shifa-ai" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-ink-950 text-white relative overflow-hidden border-b border-ink-800">
      {/* Blueprint Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Explainer & Scenario Switcher */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-950 border border-teal-500/40 text-teal-300 text-xs font-mono uppercase tracking-widest">
              <SparklesIcon size={14} className="text-teal-400" />
              INTELLIGENT CLINICAL CO-PILOT
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Meet <span className="text-teal-400">Shifa AI</span>.
              <br />
              Zero Hallucinations.
              <br />
              100% Record-Grounded.
            </h2>

            <p className="text-sm sm:text-base text-ink-300 leading-relaxed">
              Unlike generic public chatbots that guess medical facts, <strong>Shifa AI</strong> is the clinical intelligence layer embedded directly inside your Curewell vault. It reads only your verified records — connecting glucose logs, blood pressure, lab reports, and medication timings without making things up.
            </p>

            {/* Scenario Selector */}
            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-ink-400">
                Select a live scenario to test:
              </p>
              {TERMINAL_SCENARIOS.map((scenario) => {
                const isActive = selectedScenario.id === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-teal-950 border-teal-500 shadow-md'
                        : 'bg-ink-900 border-ink-800 hover:border-ink-700 hover:bg-ink-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-teal-500 text-ink-950' : 'bg-ink-800 text-ink-300'
                        }`}
                      >
                        {scenario.icon}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-ink-200'}`}>
                          {scenario.label}
                        </p>
                        <p className="text-[11px] text-ink-400 line-clamp-1">{scenario.userPrompt}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                        isActive ? 'bg-teal-400 text-teal-950' : 'bg-ink-800 text-ink-400'
                      }`}
                    >
                      {scenario.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs text-ink-400 font-mono">
              <ShieldIcon size={16} className="text-teal-400" />
              <span>Deterministic Retrieval • No Random Guesses</span>
            </div>
          </div>

          {/* Right Column: Interactive Terminal Box */}
          <div className="lg:col-span-7">
            <div className="bg-ink-900 rounded-3xl border border-ink-800 shadow-2xl overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="px-5 py-4 border-b border-ink-800 bg-ink-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono font-bold text-ink-300">
                    SHIFA_CLINICAL_TERMINAL
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  RECORD_CONNECTED
                </span>
              </div>

              {/* Chat Simulation Area */}
              <div className="p-5 sm:p-7 space-y-4 bg-ink-950/80 min-h-[440px]">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-teal-700 text-white rounded-2xl rounded-br-xs px-4 py-3 max-w-[400px] text-xs sm:text-sm font-medium shadow-xs">
                    {selectedScenario.userPrompt}
                  </div>
                </div>

                {/* AI Grounded Response */}
                <div className="flex justify-start">
                  <div className="bg-ink-900 border border-ink-800 text-ink-100 rounded-2xl rounded-bl-xs p-5 max-w-[500px] space-y-3.5 shadow-md">
                    <p className="text-xs sm:text-sm leading-relaxed text-ink-200">
                      {selectedScenario.aiResponse}
                    </p>

                    {/* Integrated Clinical Callout Box */}
                    <div
                      className={`p-3.5 rounded-xl border space-y-1 ${
                        selectedScenario.highlightType === 'alert'
                          ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                          : selectedScenario.highlightType === 'trajectory'
                          ? 'bg-cyan-950/40 border-cyan-600/50 text-cyan-200'
                          : selectedScenario.highlightType === 'info'
                          ? 'bg-purple-950/40 border-purple-600/50 text-purple-200'
                          : 'bg-teal-950/40 border-teal-600/50 text-teal-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                        <ActivityIcon size={14} />
                        <span>{selectedScenario.highlightTitle}</span>
                      </div>
                      <p className="text-[11px] text-ink-300 leading-relaxed font-sans">
                        {selectedScenario.highlightDesc}
                      </p>
                    </div>

                    {/* Verified Record Citations */}
                    <div className="pt-2 border-t border-ink-800 space-y-1.5">
                      <p className="text-[9px] font-mono font-black uppercase tracking-wider text-ink-400">
                        Verified Sources in Your Vault:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedScenario.sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-ink-950 border border-ink-800 text-[10px] font-mono text-ink-300 flex items-center gap-1"
                          >
                            <span className={src.color}>{src.name}</span>
                            <span className="text-ink-500">[{src.tag}]</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Follow-up Action Suggestions */}
                <div className="pt-2 space-y-1.5">
                  <p className="text-[10px] font-mono uppercase text-ink-500">
                    Clinical Action Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.suggestedActions.map((action, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-ink-900 border border-ink-800 text-xs font-medium text-ink-300 hover:text-teal-300 hover:border-teal-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <SparklesIcon size={12} className="text-teal-400" />
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
