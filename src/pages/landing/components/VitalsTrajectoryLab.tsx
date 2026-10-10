import { useState } from 'react';
import { HeartPulseIcon, ActivityIcon } from '../../../components/ui/icons';

type VitalMode = 'bp' | 'glucose';

export function VitalsTrajectoryLab() {
  const [activeTab, setActiveTab] = useState<VitalMode>('bp');

  // Interactive Blood Pressure State
  const [systolic, setSystolic] = useState<number>(118);
  const [diastolic, setDiastolic] = useState<number>(76);

  // Interactive Glucose State
  const [glucose, setGlucose] = useState<number>(96);
  const [glucoseUnit, setGlucoseUnit] = useState<'mg' | 'mmol'>('mg');

  // Blood Pressure AHA / ACC 2017 staging calculation
  const getBpStage = (sys: number, dia: number) => {
    if (sys >= 180 || dia >= 120) {
      return {
        stage: 'Hypertensive Crisis',
        badgeColor: 'bg-rose-600 text-white shadow-xs',
        border: 'border-rose-300',
        bg: 'bg-rose-50',
        desc: 'Consult your physician or emergency room immediately. Readings at or above 180/120 require urgent clinical evaluation.',
        severity: 'danger',
        ratio: 1.0,
      };
    }
    if (sys >= 140 || dia >= 90) {
      return {
        stage: 'Hypertension Stage 2',
        badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300',
        border: 'border-rose-200',
        bg: 'bg-rose-50/70',
        desc: 'Persistent Stage 2 hypertension typically requires pharmacological therapy and close longitudinal monitoring.',
        severity: 'alert',
        ratio: 0.8,
      };
    }
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return {
        stage: 'Hypertension Stage 1',
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        border: 'border-amber-200',
        bg: 'bg-amber-50/70',
        desc: 'Lifestyle modifications (dietary sodium restriction, aerobic exercise, stress reduction) strongly recommended by ACC/AHA guidelines.',
        severity: 'warning',
        ratio: 0.6,
      };
    }
    if (sys >= 120 && sys <= 129 && dia < 80) {
      return {
        stage: 'Elevated Blood Pressure',
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        border: 'border-amber-200',
        bg: 'bg-amber-50/70',
        desc: 'Blood pressure is slightly elevated above optimal. Monitor 14-day rolling average to prevent progression.',
        severity: 'warning',
        ratio: 0.4,
      };
    }
    return {
      stage: 'Normal (Optimal)',
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/70',
      desc: 'Blood pressure is within ideal cardiovascular parameters (Systolic < 120 and Diastolic < 80 mmHg).',
      severity: 'optimal',
      ratio: 0.2,
    };
  };

  // ADA Fasting Glucose Staging calculation
  const getGlucoseStage = (val: number, unit: 'mg' | 'mmol') => {
    const mgVal = unit === 'mmol' ? val * 18 : val;
    if (mgVal < 70) {
      return {
        stage: 'Hypoglycemia Alert',
        badgeColor: 'bg-rose-600 text-white shadow-xs',
        border: 'border-rose-300',
        bg: 'bg-rose-50',
        desc: 'Fasting blood glucose below 70 mg/dL may cause dizziness or autonomic symptoms. Consume fast-acting carbohydrates if symptomatic.',
        ratio: 0.1,
      };
    }
    if (mgVal <= 99) {
      return {
        stage: 'Normal Fasting Range',
        badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50/70',
        desc: 'ADA fasting baseline target met (70–99 mg/dL). Excellent metabolic glycemic regulation.',
        ratio: 0.35,
      };
    }
    if (mgVal <= 125) {
      return {
        stage: 'Impaired Fasting Glucose (Pre-diabetes)',
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        border: 'border-amber-200',
        bg: 'bg-amber-50/70',
        desc: 'Fasting glucose between 100–125 mg/dL. Review carbohydrate distribution and physical activity with doctor.',
        ratio: 0.65,
      };
    }
    return {
      stage: 'Diabetes Staging Range',
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300',
      border: 'border-rose-200',
      bg: 'bg-rose-50/70',
      desc: 'Fasting glucose >= 126 mg/dL. Correlate with 3-month HbA1c lab trajectory and clinical consultation.',
      ratio: 0.95,
    };
  };

  const bpResult = getBpStage(systolic, diastolic);
  const glucoseResult = getGlucoseStage(glucose, glucoseUnit);

  return (
    <section
      id="vitals-lab"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/80 text-slate-900 border-b border-slate-200/80 relative overflow-hidden scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3.5 shadow-2xs">
            <ActivityIcon size={14} className="text-teal-700" />
            <span className="font-mono uppercase tracking-wider text-[11px]">Deterministic Telemetry Lab</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Instant clinical vitals staging.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed font-normal">
            Move the sliders below to test how Curewell applies AHA/ACC 2017 and ADA guidelines with deterministic, mathematically verified precision.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('bp')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'bp'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blood Pressure (AHA/ACC 2017)
            </button>
            <button
              onClick={() => setActiveTab('glucose')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'glucose'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fasting Blood Glucose (ADA)
            </button>
          </div>
        </div>

        {/* Interactive Lab Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 max-w-4xl mx-auto relative overflow-hidden">
          {/* Top highlight line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent" />

          {activeTab === 'bp' ? (
            <div className="space-y-8">
              {/* Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Clinical Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSystolic(118); setDiastolic(76); }}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    Optimal (118/76)
                  </button>
                  <button
                    onClick={() => { setSystolic(128); setDiastolic(78); }}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    Elevated (128/78)
                  </button>
                  <button
                    onClick={() => { setSystolic(136); setDiastolic(86); }}
                    className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    Stage 1 (136/86)
                  </button>
                  <button
                    onClick={() => { setSystolic(152); setDiastolic(94); }}
                    className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-mono font-semibold transition-colors cursor-pointer"
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
                    <label htmlFor="sys-slider" className="text-sm font-bold text-slate-900">
                      Systolic Pressure (Upper)
                    </label>
                    <span className="font-mono font-black text-2xl text-teal-800">
                      {systolic} <span className="text-xs text-slate-500 font-normal">mmHg</span>
                    </span>
                  </div>
                  <input
                    id="sys-slider"
                    type="range"
                    min={90}
                    max={190}
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>90 mmHg (Low)</span>
                    <span className="text-teal-700 font-bold">120 (Target)</span>
                    <span>190 (Crisis)</span>
                  </div>
                </div>

                {/* Diastolic Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dia-slider" className="text-sm font-bold text-slate-900">
                      Diastolic Pressure (Lower)
                    </label>
                    <span className="font-mono font-black text-2xl text-teal-800">
                      {diastolic} <span className="text-xs text-slate-500 font-normal">mmHg</span>
                    </span>
                  </div>
                  <input
                    id="dia-slider"
                    type="range"
                    min={55}
                    max={130}
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className="w-full accent-teal-700 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>55 mmHg (Low)</span>
                    <span className="text-teal-700 font-bold">80 (Target)</span>
                    <span>130 (Crisis)</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Outcome Box */}
              <div className={`p-6 rounded-2xl border ${bpResult.border} ${bpResult.bg} transition-all duration-300 shadow-2xs`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <HeartPulseIcon className="w-5 h-5 text-teal-700" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                      ACC / AHA 2017 Guideline Staging:
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
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Units & Presets:</span>
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono">
                    <button
                      onClick={() => setGlucoseUnit('mg')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        glucoseUnit === 'mg' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      mg/dL
                    </button>
                    <button
                      onClick={() => setGlucoseUnit('mmol')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        glucoseUnit === 'mmol' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      mmol/L
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setGlucose(92)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold cursor-pointer"
                    >
                      Target (92)
                    </button>
                    <button
                      onClick={() => setGlucose(114)}
                      className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-mono font-semibold cursor-pointer"
                    >
                      Pre-diabetes (114)
                    </button>
                    <button
                      onClick={() => setGlucose(142)}
                      className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-mono font-semibold cursor-pointer"
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
                  <span className="font-mono font-black text-2xl text-teal-800">
                    {glucoseUnit === 'mmol' ? (glucose / 18).toFixed(1) : glucose}{' '}
                    <span className="text-xs text-slate-500 font-normal">
                      {glucoseUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}
                    </span>
                  </span>
                </div>
                <input
                  id="glucose-slider"
                  type="range"
                  min={50}
                  max={240}
                  value={glucose}
                  onChange={(e) => setGlucose(Number(e.target.value))}
                  className="w-full accent-teal-700 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>50 mg/dL (Hypo)</span>
                  <span className="text-teal-700 font-bold">70–99 (Target)</span>
                  <span>100–125 (Impaired)</span>
                  <span>240 (High)</span>
                </div>
              </div>

              {/* Glucose Outcome */}
              <div className={`p-6 rounded-2xl border ${glucoseResult.border} ${glucoseResult.bg} transition-all duration-300 shadow-2xs`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
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

          {/* Bottom Telemetry Verification */}
          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-teal-700 font-medium">AHA/ACC 2017 & ADA 2026 Telemetry Standards</span>
            <span>Deterministic Classification Engine</span>
          </div>
        </div>
      </div>
    </section>
  );
}
