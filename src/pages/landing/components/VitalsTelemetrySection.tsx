import { useState } from 'react';
import { HeartPulseIcon, ActivityIcon, CheckIcon } from '../../../components/ui/icons';

export function VitalsTelemetrySection() {
  const [activeTab, setActiveTab] = useState<'bp' | 'glucose'>('bp');
  const [glucoseUnit, setGlucoseUnit] = useState<'mg' | 'mmol'>('mg');

  return (
    <section id="vitals" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-ink-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-teal-800 mb-2">
            TELEMETRY & CLINICAL STAGING
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-ink-950 tracking-tight leading-tight">
            Vitals Tracking with Automatic Medical Staging.
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Record your daily numbers at home. Curewell automatically stages your readings against official medical standards — without you having to guess what your numbers mean.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-ink-100 border border-ink-200">
            <button
              onClick={() => setActiveTab('bp')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'bp'
                  ? 'bg-white text-ink-950 shadow-xs'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
            >
              Blood Pressure (AHA Staging)
            </button>
            <button
              onClick={() => setActiveTab('glucose')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'glucose'
                  ? 'bg-white text-ink-950 shadow-xs'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
            >
              Fasting Glucose (ADA Targets)
            </button>
          </div>
        </div>

        {/* Telemetry Display Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-ink-50/70 border border-ink-200 max-w-4xl mx-auto">
          {activeTab === 'bp' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-600 text-xs font-mono font-bold">
                  <HeartPulseIcon size={16} />
                  <span>AMERICAN HEART ASSOCIATION STANDARDS</span>
                </div>
                <h3 className="text-2xl font-black text-ink-950">
                  Optimal Cardiovascular Telemetry
                </h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  Curewell automatically calculates Mean Arterial Pressure (MAP) and pulse pressure to give your cardiologist a complete hemodynamic snapshot, not just isolated systolic numbers.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-ink-700 font-medium">
                    <CheckIcon size={16} className="text-teal-700" />
                    <span>Mean Arterial Pressure (MAP): Organ perfusion index</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-700 font-medium">
                    <CheckIcon size={16} className="text-teal-700" />
                    <span>Pulse Pressure: Arterial stiffness indicator</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-700 font-medium">
                    <CheckIcon size={16} className="text-teal-700" />
                    <span>Immediate alert triggers for hypertensive spikes (&gt;140/90)</span>
                  </div>
                </div>
              </div>

              {/* Mock BP Telemetry Card */}
              <div className="md:col-span-6 p-6 rounded-2xl bg-white border border-ink-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                  <span className="text-xs font-mono text-ink-500 font-bold">LATEST RECORDING</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
                    STAGE: NORMAL / OPTIMAL
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-ink-950 font-mono">118/78</span>
                  <span className="text-sm font-mono text-ink-500">mmHg</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-ink-50 border border-ink-200">
                    <p className="text-[10px] font-mono text-ink-500 uppercase">Mean Arterial Pressure</p>
                    <p className="text-base font-black text-ink-950 font-mono mt-0.5">91.3 <span className="text-xs font-normal">mmHg</span></p>
                    <span className="text-[10px] text-emerald-700 font-medium">Normal (70–100)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-ink-50 border border-ink-200">
                    <p className="text-[10px] font-mono text-ink-500 uppercase">Pulse Pressure</p>
                    <p className="text-base font-black text-ink-950 font-mono mt-0.5">40 <span className="text-xs font-normal">mmHg</span></p>
                    <span className="text-[10px] text-emerald-700 font-medium">Normal (30–50)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <div className="flex items-center gap-2 text-teal-700 text-xs font-mono font-bold">
                  <ActivityIcon size={16} />
                  <span>AMERICAN DIABETES ASSOCIATION TARGETS</span>
                </div>
                <h3 className="text-2xl font-black text-ink-950">
                  Glycemic Target Correlation
                </h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  Track fasting and post-prandial blood sugar readings with 1-tap unit conversions between conventional US (mg/dL) and international SI (mmol/L) standards.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold text-ink-600">Unit Toggle:</span>
                  <div className="inline-flex rounded-lg bg-white border border-ink-200 p-0.5 text-xs font-mono font-bold">
                    <button
                      onClick={() => setGlucoseUnit('mg')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        glucoseUnit === 'mg' ? 'bg-teal-700 text-white' : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      mg/dL
                    </button>
                    <button
                      onClick={() => setGlucoseUnit('mmol')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        glucoseUnit === 'mmol' ? 'bg-teal-700 text-white' : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      mmol/L
                    </button>
                  </div>
                </div>
              </div>

              {/* Mock Glucose Telemetry Card */}
              <div className="md:col-span-6 p-6 rounded-2xl bg-white border border-ink-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                  <span className="text-xs font-mono text-ink-500 font-bold">FASTING READING</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
                    NORMAL GLYCEMIA
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-ink-950 font-mono">
                    {glucoseUnit === 'mg' ? '94' : '5.2'}
                  </span>
                  <span className="text-sm font-mono text-ink-500">
                    {glucoseUnit === 'mg' ? 'mg/dL' : 'mmol/L'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-ink-50 border border-ink-200 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-ink-600">ADA Fasting Goal:</span>
                    <span className="text-ink-900 font-bold">{glucoseUnit === 'mg' ? '70–99 mg/dL' : '3.9–5.5 mmol/L'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Your reading is right on target with your active Metformin therapy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
