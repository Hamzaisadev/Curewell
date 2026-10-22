import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CameraIcon,
  CheckIcon,
  AlertTriangleIcon,
  HeartPulseIcon,
  ArrowRightIcon,
  ActivityIcon,
  TrendingDownIcon,
  FileTextIcon,
  QrCodeIcon,
  DownloadIcon,
  ShieldCheckIcon,
} from '../../../components/ui/icons';

interface StoryChapter {
  id: string;
  act: string;
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  quote: string;
  metric: string;
  metricLabel: string;
}

const CHAPTERS: StoryChapter[] = [
  {
    id: 'optical-intake',
    act: 'ACT II',
    title: 'The Optical Intake',
    subtitle: 'Multimodal Prescription Engine',
    problem:
      'Patients shouldn’t have to decipher messy doctor handwriting or manually type 20 complicated pharmaceutical brand names into tiny mobile keyboards.',
    solution:
      'Snap any clinic slip or folded hospital discharge summary. Curewell auto-focuses, de-skews perspective angles, and breaks trade names into active molecules with confidence scores.',
    quote: 'From crumpled paper slip to structured FHIR-ready prescription in 3 seconds.',
    metric: '99.8%',
    metricLabel: 'OCR Entity Extraction Accuracy',
  },
  {
    id: 'sentinel-radar',
    act: 'ACT III',
    title: 'The Silent Guardian',
    subtitle: 'Sentinel Pharmacological Collision Radar',
    problem:
      'The silent killer in modern fragmented healthcare: accidental duplicate toxicity. Taking "Panadol" from one clinic and "Calpol" or "Co-Codamol" from another without realizing they share Paracetamol (Acetaminophen).',
    solution:
      'Sentinel operates beneath commercial trade names. It tracks cumulative daily active milligram ceilings across all prescribed medicines, preventing accidental hepatic and renal strain.',
    quote: 'Zero accidental double-dosing across different doctors and hospitals.',
    metric: '4,000mg',
    metricLabel: 'Hard Hepatic Ceiling Enforced',
  },
  {
    id: 'living-trajectory',
    act: 'ACT IV',
    title: 'The Living Trajectory',
    subtitle: 'Biomarker Velocity vs Static PDFs',
    problem:
      'A static lab PDF on WhatsApp tells you nothing about where your health is heading. Are your liver enzymes or HbA1c spiking, stabilizing, or declining over 12 months?',
    solution:
      'Curewell automatically extracts lab biomarkers across diagnostic centers (Chughtai, Shaukat Khanum, Aga Khan, Quest), normalizes disparate units, and plots velocity curves within ADA/ACC reference corridors.',
    quote: 'Understand your rate of healing, not just isolated snapshot numbers.',
    metric: '-46.1%',
    metricLabel: 'Quarterly ALT Liver Enzyme Normalization',
  },
  {
    id: 'clinical-handshake',
    act: 'ACT V',
    title: 'The Clinical Handshake',
    subtitle: 'The 1-Page Consultation Dossier & Emergency QR',
    problem:
      'Doctors only have 5 to 7 minutes per consultation. Patients forget their questions, and doctors miss recent dosage changes buried in plastic folders.',
    solution:
      'Walk in with a standardized 1-page clinical summary featuring prioritized review questions and 30-day vitals trends. Includes an emergency lock-screen QR pass for paramedics.',
    quote: 'Transform 5-minute visits into decisive, high-impact clinical decisions.',
    metric: '30-Sec',
    metricLabel: 'Doctor Review Time to Decisive Diagnosis',
  },
];

type BiomarkerKey = 'alt' | 'hba1c' | 'creatinine';

export function InteractiveStoryScroller() {
  const [activeStage, setActiveStage] = useState<number>(0);

  // Micro-interaction states for each stage
  const [ocrTab, setOcrTab] = useState<'raw' | 'boxes' | 'structured'>('structured');
  const [hasCollision, setHasCollision] = useState<boolean>(true);
  const [biomarkerMode, setBiomarkerMode] = useState<BiomarkerKey>('alt');
  const [timeHorizon, setTimeHorizon] = useState<'12m' | '90d'>('12m');
  const [dossierMode, setDossierMode] = useState<'brief' | 'emergency-qr'>('brief');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Refs for scroll-spy observation
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isManualScrollingRef = useRef<boolean>(false);
  const manualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize activeStage with scroll position using IntersectionObserver + focal check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrollingRef.current) return;

        // Filter currently intersecting chapters
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;

        // Choose the chapter closest to the focal line (~38% of viewport height)
        const targetY = window.innerHeight * 0.38;
        let bestIndex = -1;
        let smallestDistance = Infinity;

        visible.forEach((entry) => {
          const rect = entry.target.getBoundingClientRect();
          const midY = rect.top + rect.height * 0.5;
          const dist = Math.abs(midY - targetY);
          if (dist < smallestDistance) {
            smallestDistance = dist;
            const idx = entry.target.getAttribute('data-chapter-index');
            if (idx !== null) {
              bestIndex = parseInt(idx, 10);
            }
          }
        });

        if (bestIndex >= 0 && bestIndex !== activeStage) {
          setActiveStage(bestIndex);
        }
      },
      {
        rootMargin: '-12% 0px -28% 0px',
        threshold: [0.15, 0.4, 0.7],
      }
    );

    chapterRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (manualScrollTimerRef.current) {
        clearTimeout(manualScrollTimerRef.current);
      }
    };
  }, [activeStage]);

  // Stage selection with optional smooth scroll
  const handleSelectStage = (index: number, shouldScroll = false) => {
    setActiveStage(index);

    if (shouldScroll && chapterRefs.current[index]) {
      isManualScrollingRef.current = true;
      chapterRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      if (manualScrollTimerRef.current) {
        clearTimeout(manualScrollTimerRef.current);
      }
      manualScrollTimerRef.current = setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 750);
    }
  };

  const handleExportBrief = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
    }, 1200);
  };

  const currentChapter = CHAPTERS[activeStage]!;

  return (
    <section
      id="story-scroller"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/80 text-slate-900 border-b border-slate-200/80 relative overflow-hidden scroll-mt-24"
    >
      {/* Millimeter Blueprint Coordinates Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
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
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[11px]">The Clinical Storyboard</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.08]">
            An episodic medical story.
            <br />
            <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Built for real human care.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Follow the journey from chaotic paper slips to an infallible, patient-governed clinical vault. Scroll down or click each act to explore working engine simulations in real time.
          </p>
        </div>

        {/* 2-Column Split: Left = Narrative Chapter Track (Scrollable), Right = Sticky Working Interactive Prototype */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN: 4 Story Chapters with Scroll Observation
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            {CHAPTERS.map((chapter, index) => {
              const isActive = activeStage === index;
              return (
                <div
                  key={chapter.id}
                  data-chapter-index={index}
                  ref={(el) => {
                    chapterRefs.current[index] = el;
                  }}
                  className="transition-all duration-300"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectStage(index, true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectStage(index, true);
                      }
                    }}
                    className={`w-full text-left p-6 sm:p-7 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative overflow-hidden cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                      isActive
                        ? 'bg-white border-teal-500 shadow-[0_16px_36px_rgba(15,118,110,0.12)] ring-1 ring-teal-500/30'
                        : 'bg-white/80 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Left Active Accent Bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeChapterBar"
                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-600 to-emerald-600"
                      />
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md transition-colors ${
                            isActive
                              ? 'bg-teal-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {chapter.act}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Episode 0{index + 2}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {chapter.metric}
                      </span>
                    </div>

                    <h3
                      className={`text-xl sm:text-2xl font-bold tracking-tight mb-1 transition-colors ${
                        isActive ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {chapter.title}
                    </h3>

                    <p className="text-xs font-semibold text-teal-700 mb-3 font-mono">
                      {chapter.subtitle}
                    </p>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {isActive ? chapter.solution : chapter.problem}
                    </p>

                    {/* Expanded Clinical Proof Details */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-900 font-semibold"
                      >
                        <span className="italic pr-2">"{chapter.quote}"</span>
                        <span className="inline-flex items-center gap-1 text-teal-700 font-mono shrink-0">
                          <span>Live in Sandbox</span>
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN: Sticky Working Interactive Prototype
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 sticky top-28 self-start">
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.12)] p-6 sm:p-8 overflow-hidden relative">
              {/* Top Specular Sheen */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent" />

              {/* Working Prototype Stage Header with Direct Act Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
                {/* Act Jump Stepper Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto scrollbar-none">
                  {CHAPTERS.map((ch, idx) => {
                    const isTabActive = activeStage === idx;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleSelectStage(idx, true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isTabActive
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                        aria-label={`Jump to ${ch.act}: ${ch.title}`}
                      >
                        {ch.act}
                      </button>
                    );
                  })}
                </div>

                {/* Right Telemetry Badge */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-teal-700 font-bold">{currentChapter.metric}</span>
                  <span className="text-slate-400">• {currentChapter.metricLabel}</span>
                </div>
              </div>

              {/* Dynamic Prototype Canvas */}
              <AnimatePresence mode="wait">

                {/* ─────────────────────────────────────────────────────────
                    STAGE 1 (ACT II): Optical Intake & Chemical Deconstruction
                   ───────────────────────────────────────────────────────── */}
                {activeStage === 0 && (
                  <motion.div
                    key="stage-optical"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Mode Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold">
                      <button
                        type="button"
                        onClick={() => setOcrTab('raw')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          ocrTab === 'raw' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        1. Raw Photo Capture
                      </button>
                      <button
                        type="button"
                        onClick={() => setOcrTab('boxes')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          ocrTab === 'boxes' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        2. OCR Bounding Boxes
                      </button>
                      <button
                        type="button"
                        onClick={() => setOcrTab('structured')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          ocrTab === 'structured' ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        3. Structured FHIR Card
                      </button>
                    </div>

                    {/* Stage 1 Visualization */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden min-h-[300px] flex flex-col justify-between">
                      {ocrTab === 'raw' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <CameraIcon size={14} className="text-teal-700" />
                              <span>Camera Autofocus & Perspective Correction</span>
                            </span>
                            <span className="text-emerald-700 font-bold">DE-SKEWED 12°</span>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-dashed border-slate-300 text-slate-700 font-serif italic text-sm space-y-1">
                            <p className="font-sans font-bold not-italic text-xs text-slate-400">RAW IMAGE SOURCE:</p>
                            <p className="text-slate-800">"Dr. Tariq Mansoor — Metformin HCl 500mg 1 tab BD pc with food"</p>
                            <p className="text-slate-800">"Rosuvastatin 10mg 1 tab HS bedtime"</p>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans">
                            Auto-enhances contrast and straightens slanted phone snapshots under low clinical lighting.
                          </p>
                        </div>
                      )}

                      {ocrTab === 'boxes' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                            <span>Detected Entity Bounding Boxes</span>
                            <span className="text-teal-700 font-bold">3 CHEMICAL NODES</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-lg bg-teal-50 border-2 border-teal-500 flex justify-between items-center text-xs font-mono">
                              <span className="text-teal-900 font-bold">[METFORMIN] [500MG]</span>
                              <span className="text-teal-700 text-[10px]">Confidence: 99.8%</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-50 border-2 border-emerald-500 flex justify-between items-center text-xs font-mono">
                              <span className="text-emerald-900 font-bold">[ROSUVASTATIN] [10MG]</span>
                              <span className="text-emerald-700 text-[10px]">Confidence: 99.4%</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-amber-50 border-2 border-amber-500 flex justify-between items-center text-xs font-mono">
                              <span className="text-amber-900 font-bold">[FREQUENCY: BD] [TIMING: MEALS]</span>
                              <span className="text-amber-700 text-[10px]">Latin Medical Parse</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {ocrTab === 'structured' && (
                        <div className="space-y-2.5">
                          <div className="p-3.5 rounded-xl bg-white border border-teal-200 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                                Rx
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Metformin HCl 500mg</p>
                                <p className="text-[10px] text-slate-500 font-mono">Oral Tablet • Twice Daily (BD) with meals</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                              <CheckIcon size={12} className="text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white border border-teal-200 shadow-2xs flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                                Rx
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Rosuvastatin Calcium 10mg</p>
                                <p className="text-[10px] text-slate-500 font-mono">Lipid Regimen • Bedtime (HS) at 10:00 PM</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 flex items-center gap-1">
                              <CheckIcon size={12} className="text-teal-600" />
                              <span>Verified</span>
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Zero Silent Commits</span>
                        <span className="text-emerald-700 font-bold">100% Patient Review Required</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─────────────────────────────────────────────────────────
                    STAGE 2 (ACT III): Sentinel Collision Radar
                   ───────────────────────────────────────────────────────── */}
                {activeStage === 1 && (
                  <motion.div
                    key="stage-sentinel"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-rose-700 uppercase">
                        Interactive Collision Simulator
                      </span>
                      <button
                        type="button"
                        onClick={() => setHasCollision(!hasCollision)}
                        className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors cursor-pointer"
                      >
                        {hasCollision ? 'Simulating Collision (Active)' : 'Clear State (Test Safe)'}
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-inner space-y-4">
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs flex justify-between items-center shadow-2xs">
                          <div>
                            <span className="font-bold text-slate-900">Clinic A: Panadol Extra 500mg</span>
                            <p className="text-[10px] text-slate-500 font-mono">2 tablets TID = 3,000 mg Paracetamol</p>
                          </div>
                          <span className="text-rose-700 font-mono font-bold">Paracetamol</span>
                        </div>

                        {hasCollision && (
                          <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs flex justify-between items-center shadow-2xs">
                            <div>
                              <span className="font-bold text-slate-900">Clinic B: Calpol 250mg Suspension</span>
                              <p className="text-[10px] text-slate-500 font-mono">500 mg Paracetamol per dose</p>
                            </div>
                            <span className="text-rose-700 font-mono font-bold">Paracetamol</span>
                          </div>
                        )}
                      </div>

                      {/* Cumulative Milligram Gauge */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-700">
                            Cumulative Daily Load: <strong className="text-rose-700 font-bold">{hasCollision ? '3,500 mg' : '1,000 mg'}</strong>
                          </span>
                          <span className="text-slate-400">Max Safe Ceiling: 4,000 mg</span>
                        </div>
                        <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: '25%' }}
                            animate={{ width: hasCollision ? '87.5%' : '25%' }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${
                              hasCollision
                                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        hasCollision
                          ? 'bg-rose-100/70 border-rose-300 text-rose-900 font-medium'
                          : 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-medium'
                      }`}>
                        {hasCollision ? (
                          <div className="flex items-start gap-2">
                            <AlertTriangleIcon size={16} className="text-rose-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Hepatic Overdose Alert:</strong> Distinct commercial trade names share the identical active chemical Paracetamol. Approaching liver toxicity threshold.
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <CheckIcon size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Safe Regimen:</strong> No duplicate active molecules detected across clinics.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─────────────────────────────────────────────────────────
                    STAGE 3 (ACT IV): Biomarker Velocity vs Static PDFs
                   ───────────────────────────────────────────────────────── */}
                {activeStage === 2 && (
                  <motion.div
                    key="stage-velocity"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Biomarker Switcher */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setBiomarkerMode('alt')}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                            biomarkerMode === 'alt'
                              ? 'bg-white text-emerald-800 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          ALT Liver Enzyme
                        </button>
                        <button
                          type="button"
                          onClick={() => setBiomarkerMode('hba1c')}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                            biomarkerMode === 'hba1c'
                              ? 'bg-white text-teal-800 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          HbA1c Glycemic
                        </button>
                        <button
                          type="button"
                          onClick={() => setBiomarkerMode('creatinine')}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                            biomarkerMode === 'creatinine'
                              ? 'bg-white text-sky-800 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Creatinine Renal
                        </button>
                      </div>

                      {/* Time Horizon Filter */}
                      <div className="flex gap-1 text-[11px] font-mono">
                        <button
                          type="button"
                          onClick={() => setTimeHorizon('12m')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            timeHorizon === '12m' ? 'bg-teal-100 text-teal-800 font-bold' : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          12M Trend
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimeHorizon('90d')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            timeHorizon === '90d' ? 'bg-teal-100 text-teal-800 font-bold' : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          90D Delta
                        </button>
                      </div>
                    </div>

                    {/* Biomarker Canvas */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-slate-900 font-mono">
                              {biomarkerMode === 'alt' ? '42' : biomarkerMode === 'hba1c' ? '6.1' : '0.9'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {biomarkerMode === 'alt'
                                ? 'U/L (Normal 7–56)'
                                : biomarkerMode === 'hba1c'
                                ? '% (ADA Target <7.0%)'
                                : 'mg/dL (Normal 0.7–1.2)'}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                            <TrendingDownIcon size={14} className="text-emerald-600" />
                            <span>
                              {biomarkerMode === 'alt'
                                ? 'Velocity: -46.1% normalization over 9 months'
                                : biomarkerMode === 'hba1c'
                                ? 'Velocity: -0.9% glycemic drop (stable controlled corridor)'
                                : 'Velocity: Optimal filtration rate sustained'}
                            </span>
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-bold shrink-0">
                          {biomarkerMode === 'alt' ? '-46.1%' : biomarkerMode === 'hba1c' ? '-0.9%' : '0.9 mg/dL'}
                        </span>
                      </div>

                      {/* Dynamic SVG Trend Curve */}
                      <div className="pt-2">
                        <svg className="w-full h-28" viewBox="0 0 320 100" fill="none">
                          <defs>
                            <linearGradient id="area-fill-trajectory" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Reference Corridor Band */}
                          <rect x="0" y="50" width="320" height="40" fill="#f0fdf4" opacity="0.8" />
                          <line x1="0" y1="50" x2="320" y2="50" stroke="#86efac" strokeDasharray="3 3" strokeWidth="1" />
                          <text x="6" y="62" fill="#15803d" fontSize="9" fontFamily="monospace">Optimal Clinical Corridor</text>

                          {biomarkerMode === 'alt' && (
                            <>
                              <path
                                d="M 20 22 C 80 25, 140 60, 220 72 C 270 78, 300 80, 305 82 L 305 98 L 20 98 Z"
                                fill="url(#area-fill-trajectory)"
                              />
                              <path
                                d="M 20 22 C 80 25, 140 60, 220 72 C 270 78, 300 80, 305 82"
                                stroke="#0f766e"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <circle cx="20" cy="22" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                              <circle cx="220" cy="72" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                              <circle cx="305" cy="82" r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                            </>
                          )}

                          {biomarkerMode === 'hba1c' && (
                            <>
                              <path
                                d="M 20 28 C 90 32, 170 58, 240 70 C 280 76, 300 78, 305 80 L 305 98 L 20 98 Z"
                                fill="url(#area-fill-trajectory)"
                              />
                              <path
                                d="M 20 28 C 90 32, 170 58, 240 70 C 280 76, 300 78, 305 80"
                                stroke="#0d9488"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <circle cx="20" cy="28" r="5" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                              <circle cx="240" cy="70" r="4.5" fill="#14b8a6" stroke="#ffffff" strokeWidth="2" />
                              <circle cx="305" cy="80" r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                            </>
                          )}

                          {biomarkerMode === 'creatinine' && (
                            <>
                              <path
                                d="M 20 40 C 90 42, 160 55, 230 68 C 270 72, 295 73, 305 74 L 305 98 L 20 98 Z"
                                fill="url(#area-fill-trajectory)"
                              />
                              <path
                                d="M 20 40 C 90 42, 160 55, 230 68 C 270 72, 295 73, 305 74"
                                stroke="#0284c7"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <circle cx="20" cy="40" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                              <circle cx="230" cy="68" r="4.5" fill="#0369a1" stroke="#ffffff" strokeWidth="2" />
                              <circle cx="305" cy="74" r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                            </>
                          )}
                        </svg>

                        <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-200/80">
                          <span>
                            {biomarkerMode === 'alt'
                              ? '12 Mo Ago (Elevated 78 U/L)'
                              : biomarkerMode === 'hba1c'
                              ? '12 Mo Ago (8.4% Uncontrolled)'
                              : '12 Mo Ago (1.4 mg/dL)'}
                          </span>
                          <span className="text-teal-800 font-bold">
                            {biomarkerMode === 'alt'
                              ? 'Today: 42 U/L (Normalized)'
                              : biomarkerMode === 'hba1c'
                              ? 'Today: 6.1% (In Target)'
                              : 'Today: 0.9 mg/dL (Clear)'}
                          </span>
                        </div>
                      </div>

                      {/* Clinical Grounding Note */}
                      <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-900 leading-relaxed font-sans">
                        <strong>Deterministic Normalization:</strong> Raw lab reports from different diagnostic chains with disparate reference units are converted into longitudinal velocity curves.
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─────────────────────────────────────────────────────────
                    STAGE 4 (ACT V): Clinical Handshake & Emergency QR
                   ───────────────────────────────────────────────────────── */}
                {activeStage === 3 && (
                  <motion.div
                    key="stage-handshake"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Dossier Mode Switcher */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setDossierMode('brief')}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            dossierMode === 'brief'
                              ? 'bg-white text-teal-800 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <FileTextIcon size={14} className="text-teal-600" />
                          <span>1-Page Consultation Dossier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDossierMode('emergency-qr')}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            dossierMode === 'emergency-qr'
                              ? 'bg-white text-rose-800 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <QrCodeIcon size={14} className="text-rose-600" />
                          <span>Emergency Lockscreen QR</span>
                        </button>
                      </div>
                      <span className="text-xs font-mono text-teal-700 font-bold hidden sm:inline">
                        {dossierMode === 'brief' ? 'PDF READY' : 'LOCKSCREEN SAFE'}
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                      {dossierMode === 'brief' ? (
                        <div className="space-y-3">
                          {/* Brief Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div>
                              <p className="text-xs font-bold text-slate-900">Dr. Tariq Mansoor • Clinical OPD Brief</p>
                              <p className="text-[10px] text-slate-500 font-mono">Patient: Tariq • ID: CW-4092-PK • 30-Sec Intake Dossier</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold shrink-0">
                              PRINTABLE A4
                            </span>
                          </div>

                          {/* Prioritized Review Questions */}
                          <div className="p-3 rounded-xl bg-white border border-teal-200 shadow-2xs space-y-1 text-xs">
                            <p className="font-bold text-teal-800 font-mono uppercase text-[10px] flex items-center gap-1">
                              <ShieldCheckIcon size={12} className="text-teal-600" />
                              <span>Prioritized Clinician Query:</span>
                            </p>
                            <p className="text-slate-800 font-medium">
                              "Liver enzyme ALT normalized from 78 to 42 U/L over 9 months. Should Metformin 500mg remain twice daily or taper to QD?"
                            </p>
                          </div>

                          {/* 30-Day Vitals Strip */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-white border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-mono block">Avg Blood Pressure</span>
                              <strong className="text-xs font-mono font-bold text-slate-900">120/78 mmHg</strong>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-mono block">Fasting Glucose</span>
                              <strong className="text-xs font-mono font-bold text-emerald-700">96 mg/dL</strong>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-mono block">Adherence Rate</span>
                              <strong className="text-xs font-mono font-bold text-teal-700">98.4% Streak</strong>
                            </div>
                          </div>

                          {/* Export Button */}
                          <button
                            type="button"
                            onClick={handleExportBrief}
                            disabled={isExporting}
                            className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                          >
                            <DownloadIcon size={14} />
                            <span>{isExporting ? 'Generating Standardized PDF...' : 'Download 1-Page Clinical Brief'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div>
                              <p className="text-xs font-bold text-slate-900">Paramedic Emergency QR Badge</p>
                              <p className="text-[10px] text-slate-500 font-mono">Offline cryptographic token • Lock-screen accessible</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold shrink-0">
                              FIRST-RESPONDER READY
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white border border-rose-200 shadow-2xs">
                            <div className="w-24 h-24 rounded-2xl bg-slate-950 text-white flex flex-col items-center justify-center font-mono text-[10px] font-bold shadow-md shrink-0 border-2 border-rose-500">
                              <HeartPulseIcon size={24} className="text-rose-400 mb-1 animate-pulse" />
                              <span className="tracking-wider">SCAN PASS</span>
                              <span className="text-[9px] text-teal-300">NO PIN NEEDED</span>
                            </div>

                            <div className="space-y-1.5 text-xs w-full">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">
                                  Blood Group: <strong className="text-teal-800 font-mono">B+ (Rh Positive)</strong>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">Verified Donor</span>
                              </div>
                              <div className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-xs">
                                CRITICAL: Severe Anaphylaxis to Penicillin
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono">
                                In Case of Emergency (ICE): Dr. Tariq (0300-8451290) • Next of Kin: Aisha
                              </p>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 font-mono text-center">
                            First responders scan from mobile lock screen in under 10 seconds without passcode access.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Bottom Interactive Notice */}
              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                  <ActivityIcon size={13} className="text-teal-600" />
                  <span>Interactive Live Sandbox</span>
                </span>
                <span>Deterministic Clinical Rules Engine</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
