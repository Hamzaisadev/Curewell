import { useState } from 'react';
import { motion } from 'motion/react';
import { HeartPulseIcon, ActivityIcon, CheckIcon } from '../../../components/ui/icons';

export function VitalsTelemetrySection() {
  const [activeTab, setActiveTab] = useState<'bp' | 'glucose'>('bp');
  const [glucoseUnit, setGlucoseUnit] = useState<'mg' | 'mmol'>('mg');

  return (
    <section id="vitals" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        {/* Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">
            Telemetry
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Vitals tracking.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Automatic clinical staging for blood pressure and glucose readings.
          </p>
        </motion.div>

        {/* Tab Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('bp')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'bp'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blood Pressure
            </button>
            <button
              onClick={() => setActiveTab('glucose')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'glucose'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fasting Glucose
            </button>
          </div>
        </motion.div>

        {/* Telemetry Display Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="p-7 sm:p-9 rounded-3xl bg-white border border-slate-200 max-w-4xl mx-auto shadow-xs"
        >
          {activeTab === 'bp' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-3.5">
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                  <HeartPulseIcon size={15} />
                  <span>AHA Guidelines</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Cardiovascular Telemetry
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Curewell automatically calculates Mean Arterial Pressure (MAP) and pulse pressure to give your doctor a complete hemodynamic picture.
                </p>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckIcon size={14} className="text-teal-700" />
                    <span>Mean Arterial Pressure (MAP): Perfusion index</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckIcon size={14} className="text-teal-700" />
                    <span>Pulse Pressure: Arterial compliance indicator</span>
                  </div>
                </div>
              </div>

              {/* Mock BP Telemetry Card */}
              <div className="md:col-span-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Latest Recording</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                    Optimal Range
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-slate-900">118/78</span>
                  <span className="text-xs text-slate-500">mmHg</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[10px] text-slate-500 uppercase">Mean Pressure (MAP)</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">91.3 mmHg</p>
                    <span className="text-[10px] text-emerald-700">Normal (70–100)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[10px] text-slate-500 uppercase">Pulse Pressure</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">40 mmHg</p>
                    <span className="text-[10px] text-emerald-700">Normal (30–50)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-3.5">
                <div className="flex items-center gap-1.5 text-teal-700 text-xs font-semibold">
                  <ActivityIcon size={15} />
                  <span>ADA Targets</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Glycemic Correlation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Track fasting blood sugar readings with 1-tap unit conversions between standard US (mg/dL) and international (mmol/L) units.
                </p>

                <div className="flex items-center gap-2.5 pt-1">
                  <span className="text-xs font-semibold text-slate-700">Units:</span>
                  <div className="inline-flex rounded-lg bg-slate-100 border border-slate-200 p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => setGlucoseUnit('mg')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        glucoseUnit === 'mg' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      mg/dL
                    </button>
                    <button
                      onClick={() => setGlucoseUnit('mmol')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        glucoseUnit === 'mmol' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      mmol/L
                    </button>
                  </div>
                </div>
              </div>

              {/* Mock Glucose Telemetry Card */}
              <div className="md:col-span-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Fasting Reading</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                    Normal Glycemia
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-slate-900">
                    {glucoseUnit === 'mg' ? '94' : '5.2'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {glucoseUnit === 'mg' ? 'mg/dL' : 'mmol/L'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5 shadow-2xs">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">ADA Fasting Goal:</span>
                    <span className="text-slate-900 font-semibold">{glucoseUnit === 'mg' ? '70–99 mg/dL' : '3.9–5.5 mmol/L'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    On target with current therapy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
