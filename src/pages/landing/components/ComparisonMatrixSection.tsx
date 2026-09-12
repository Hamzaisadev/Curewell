import { motion } from 'motion/react';
import { CheckIcon, XIcon } from '../../../components/ui/icons';

export function ComparisonMatrixSection() {
  const comparisons = [
    {
      criterion: 'Medical Record Grounding',
      generic: 'Guesses based on general internet text; prone to plausible-sounding hallucinations.',
      curewell: '100% grounded in your actual uploaded prescriptions, vitals, and lab reports.',
    },
    {
      criterion: 'Duplicate Molecule Safety',
      generic: 'Treats brand names as independent items; misses cumulative daily overdoses.',
      curewell: 'Deconstructs brands into active chemical molecules and tracks daily mg ceilings.',
    },
    {
      criterion: 'Data Verification & Commits',
      generic: 'Silent automated changes with no patient verification step.',
      curewell: 'Zero silent commits. Every single medication and lab requires your 1-click approval.',
    },
    {
      criterion: 'Doctor Consultation Readiness',
      generic: 'Unstructured long essays that a busy doctor has no time to read in a 5-minute visit.',
      curewell: 'A concise 1-page clinical dossier with categorized high-priority questions.',
    },
    {
      criterion: 'Privacy & Data Protection',
      generic: 'Prompts are often logged and used to train future commercial AI models.',
      curewell: 'Isolated bank-grade encryption. Your personal health records are never sold or trained on.',
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-18"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">
            Safety Matrix
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Built for safety.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Why healthcare requires deterministic precision instead of generative guessing.
          </p>
        </motion.div>

        {/* Comparison Table in Light Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200 bg-slate-50 p-4 sm:p-5 font-bold text-xs sm:text-sm">
            <div className="md:col-span-4 text-slate-500 uppercase tracking-wider text-xs">
              Clinical Criterion
            </div>
            <div className="md:col-span-4 text-rose-700 uppercase tracking-wider text-xs mt-2 md:mt-0">
              Generic Public AI Chatbots
            </div>
            <div className="md:col-span-4 text-teal-800 uppercase tracking-wider text-xs mt-2 md:mt-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              Curewell + Shifa AI Co-Pilot
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 text-xs sm:text-sm gap-4 items-center hover:bg-slate-50/50 transition-colors"
              >
                <div className="md:col-span-4 font-semibold text-slate-900">
                  {row.criterion}
                </div>
                <div className="md:col-span-4 text-slate-600 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <XIcon size={12} strokeWidth={2.5} />
                  </span>
                  <p className="leading-relaxed">{row.generic}</p>
                </div>
                <div className="md:col-span-4 text-slate-900 font-medium flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon size={12} strokeWidth={2.5} />
                  </span>
                  <p className="leading-relaxed">{row.curewell}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
