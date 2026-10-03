import { useState } from 'react';
import { motion } from 'motion/react';
import { HeartPulseIcon, ActivityIcon } from '../../../components/ui/icons';

type VitalMode = 'bp' | 'glucose';

export function VitalsTelemetrySection() {
  const [activeTab, setActiveTab] = useState<VitalMode>('bp');
  
  // Interactive Blood Pressure State
  const [systolic, setSystolic] = useState<number>(118);
  const [diastolic, setDiastolic] = useState<number>(76);

  // Interactive Glucose State
  const [glucose, setGlucose] = useState<number>(98);
  const [glucoseUnit, setGlucoseUnit] = useState<'mg' | 'mmol'>('mg');

  // Blood Pressure AHA / ACC 2017 staging calculation
  const getBpStage = (sys: number, dia: number) => {
    if (sys >= 180 || dia >= 120) {
      return {
        stage: 'Hypertensive Crisis',
        badgeColor: 'bg-rose-600 text-white',
        border: 'border-rose-300',
        bg: 'bg-rose-50',
        desc: 'Consult your physician immediately. Readings at or above 180/120 require urgent medical attention.',
        severity: 'danger',
      };
    }
    if (sys >= 140 || dia >= 90) {
      return {
        stage: 'Hypertension Stage 2',
        badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300',
        border: 'border-rose-200',
        bg: 'bg-rose-50/60',
        desc: 'Persistent Stage 2 hypertension typically requires medication and close clinical monitoring.',
        severity: 'alert',
      };
    }
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return {
        stage: 'Hypertension Stage 1',
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        border: 'border-amber-200',
        bg: 'bg-amber-50/60',
        desc: 'Lifestyle modifications (dietary sodium restriction, aerobic exercise) strongly recommended.',
        severity: 'warning',
      };
    }
    if (sys >= 120 && sys <= 129 && dia < 80) {
      return {
        stage: 'Elevated Blood Pressure',
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        border: 'border-amber-200',
        bg: 'bg-amber-50/60',
        desc: 'Blood pressure is slightly elevated above optimal. Monitor 14-day rolling average.',
        severity: 'warning',
      };
    }
    return {
      stage: 'Normal (Optimal)',
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/60',
      desc: 'Blood pressure is within ideal cardiovascular parameters (Systolic < 120 and Diastolic < 80).',
      severity: 'optimal',
    };
  };

  // ADA Fasting Glucose Staging calculation
  const getGlucoseStage = (val: number, unit: 'mg' | 'mmol') => {
    const mgVal = unit === 'mmol' ? val * 18 : val;
    if (mgVal < 70) {
      return {
        stage: 'Hypoglycemia Alert',
        badgeColor: 'bg-rose-600 text-white',
        border: 'border-rose-300',
        bg: 'bg-rose-50',
        desc: 'Fasting glucose below 70 mg/dL may cause dizziness. Consume fast-acting glucose if symptomatic.',
      };
    }
    if (mgVal <= 99) {
      return {
        stage: 'Normal Fasting Range',
        badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50/60',
        desc: 'ADA fasting baseline target met (70–99 mg/dL). Excellent metabolic regulation.',
      };
    }
    if (mgVal <= 125) {
      return {
        stage: 'Impaired Fasting Glucose (Pre-diabetes)',
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        border: 'border-amber-200',
        bg: 'bg-amber-50/60',
        desc: 'Fasting glucose between 100–125 mg/dL. Review carbohydrate distribution with doctor.',
      };
    }
    return {
      stage: 'Diabetes Staging Range',
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300',
      border: 'border-rose-200',
      bg: 'bg-rose-50/60',
      desc: 'Fasting glucose >= 126 mg/dL. Correlate with 3-month HbA1c lab trajectory.',
    };
  };

  const bpResult = getBpStage(systolic, diastolic);
  const glucoseResult = getGlucoseStage(glucose, glucoseUnit);

  return (
    <section id="vitals" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 border-b border-slate-200 relative overflow-hidden scroll-mt-28">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold mb-3">
            <ActivityIcon size={14} className="text-teal-700" />
            <span>Interactive Telemetry Lab</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Deterministic vitals staging.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Move the sliders below to test how Curewell applies clinical guidelines (AHA 2017 & ADA) in real time.
          </p>
        </motion.div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('bp')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'bp'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blood Pressure (AHA/ACC)
            </button>
            <button
              onClick={() => setActiveTab('glucose')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'glucose'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fasting Glucose (ADA)
            </button>
          </div>
        </div>

        {/* Interactive Lab Stage */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-10 max-w-4xl mx-auto">
          {activeTab === 'bp' ? (
            <div className="space-y-8">
              {/* Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSystolic(118); setDiastolic(76); }}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Optimal (118/76)
                  </button>
                  <button
                    onClick={() => { setSystolic(128); setDiastolic(78); }}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Elevated (128/78)
                  </button>
                  <button
                    onClick={() => { setSystolic(136); setDiastolic(86); }}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Stage 1 (136/86)
                  </button>
                  <button
                    onClick={() => { setSystolic(152); setDiastolic(94); }}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Stage 2 (152/94)
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Systolic Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="systolic-slider" className="text-sm font-bold text-slate-900">
                      Systolic Pressure (Upper)
                    </label>
                    <span className="font-mono font-black text-xl text-teal-800">
                      {systolic} <span className="text-xs text-slate-500 font-normal">mmHg</span>
                    </span>
                  </div>
                  <input
                    id="systolic-slider"
                    type="range"
                    min={90}
                    max={190}
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>90 mmHg (Low)</span>
                    <span>120 (Target)</span>
                    <span>190 (Crisis)</span>
                  </div>
                </div>

                {/* Diastolic Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="diastolic-slider" className="text-sm font-bold text-slate-900">
                      Diastolic Pressure (Lower)
                    </label>
                    <span className="font-mono font-black text-xl text-teal-800">
                      {diastolic} <span className="text-xs text-slate-500 font-normal">mmHg</span>
                    </span>
                  </div>
                  <input
                    id="diastolic-slider"
                    type="range"
                    min={55}
                    max={130}
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>55 mmHg (Low)</span>
                    <span>80 (Target)</span>
                    <span>130 (Crisis)</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Clinical Classification Outcome */}
              <div className={`p-5 rounded-2xl border ${bpResult.border} ${bpResult.bg} transition-all duration-300`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <HeartPulseIcon className="w-5 h-5 text-teal-700" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                      AHA / ACC 2017 Clinical Classification:
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${bpResult.badgeColor}`}>
                    {bpResult.stage}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {bpResult.desc}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Glucose Unit Toggle & Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Unit & Presets:</span>
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono">
                    <button
                      onClick={() => setGlucoseUnit('mg')}
                      className={`px-2 py-0.5 rounded font-bold ${glucoseUnit === 'mg' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                    >
                      mg/dL
                    </button>
                    <button
                      onClick={() => setGlucoseUnit('mmol')}
                      className={`px-2 py-0.5 rounded font-bold ${glucoseUnit === 'mmol' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                    >
                      mmol/L
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setGlucose(92)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Target (92)
                    </button>
                    <button
                      onClick={() => setGlucose(114)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Pre-diabetes (114)
                    </button>
                    <button
                      onClick={() => setGlucose(142)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Elevated (142)
                    </button>
                  </div>
                </div>
              </div>

              {/* Glucose Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="glucose-slider" className="text-sm font-bold text-slate-900">
                    Fasting Blood Glucose
                  </label>
                  <span className="font-mono font-black text-xl text-teal-800">
                    {glucoseUnit === 'mmol' ? (glucose / 18).toFixed(1) : glucose}{' '}
                    <span className="text-xs text-slate-500 font-normal">{glucoseUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}</span>
                  </span>
                </div>
                <input
                  id="glucose-slider"
                  type="range"
                  min={50}
                  max={240}
                  value={glucose}
                  onChange={(e) => setGlucose(Number(e.target.value))}
                  className="w-full accent-teal-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>50 mg/dL (Hypo)</span>
                  <span>70–99 (Target)</span>
                  <span>100–125 (Impaired)</span>
                  <span>240 (High)</span>
                </div>
              </div>

              {/* Glucose Staging Outcome */}
              <div className={`p-5 rounded-2xl border ${glucoseResult.border} ${glucoseResult.bg} transition-all duration-300`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <ActivityIcon className="w-5 h-5 text-teal-700" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                      ADA Fasting Glycemic Staging:
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${glucoseResult.badgeColor}`}>
                    {glucoseResult.stage}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {glucoseResult.desc}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
