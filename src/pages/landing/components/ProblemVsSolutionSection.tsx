import { motion } from 'motion/react';
import { XIcon, CheckIcon } from '../../../components/ui/icons';

export function ProblemVsSolutionSection() {
  const problems = [
    {
      title: 'Lost in Drawers & Shoeboxes',
      desc: 'Paper prescriptions fade, tear, and get left behind when visiting new doctors or travelling.',
    },
    {
      title: 'Accidental Duplicate Toxicity',
      desc: 'Taking two different brand names that share the identical chemical molecule leads to organ strain.',
    },
    {
      title: 'Scattered WhatsApp Lab PDFs',
      desc: 'Blood tests trapped in family chats make it impossible to know if markers are actually improving.',
    },
    {
      title: 'Forgotten Questions in 5-Minute Visits',
      desc: 'Patients feel rushed during short doctor consultations, forgetting critical symptom changes.',
    },
    {
      title: 'Blind Emergency Room Trips',
      desc: 'In an unexpected medical crisis, emergency doctors have no access to your active allergy list.',
    },
  ];

  const solutions = [
    {
      title: 'Zero-Friction Digital Vault',
      desc: 'Snap any paper slip. Curewell digitizes and stores your complete medical history forever.',
    },
    {
      title: 'Duplicate Molecule Radar',
      desc: 'Computes daily milligram loads across brand names to catch accidental overdoses before they happen.',
    },
    {
      title: 'Biomarker Velocity Curves',
      desc: 'Extracts lab results across clinics, graphing the real rate-of-change so trends are immediately obvious.',
    },
    {
      title: '1-Page Consultation Briefs',
      desc: 'Generate a structured summary with your vitals and questions ready for your doctor in 30 seconds.',
    },
    {
      title: '10-Second Emergency QR Pass',
      desc: 'First responders can view life-saving allergies and current medications securely from your lock screen.',
    },
  ];

  return (
    <section id="problem-solution" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header with Motion Animation */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-18"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">
            The Reality
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Paper records fail.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Why managing medical history on paper slips breaks down — and how Curewell fixes it.
          </p>
        </motion.div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* The Problem Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-7 sm:p-9 rounded-3xl bg-rose-50/40 border border-rose-200 space-y-6 shadow-xs"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-rose-200/80">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
                <XIcon size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-950">The Paper Reality</h3>
                <p className="text-xs text-rose-800">Scattered receipts, lost files, forgotten history</p>
              </div>
            </div>

            <div className="space-y-4">
              {problems.map((prob, idx) => (
                <div key={idx} className="flex gap-3.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✕
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{prob.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">{prob.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* The Curewell Solution Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-7 sm:p-9 rounded-3xl bg-teal-50/40 border border-teal-200 space-y-6 shadow-xs"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-teal-200/80">
              <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs">
                <CheckIcon size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-teal-950">The Curewell Standard</h3>
                <p className="text-xs text-teal-800">Private, structured, always accessible</p>
              </div>
            </div>

            <div className="space-y-4">
              {solutions.map((sol, idx) => (
                <div key={idx} className="flex gap-3.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-teal-200 text-teal-900 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{sol.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">{sol.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
