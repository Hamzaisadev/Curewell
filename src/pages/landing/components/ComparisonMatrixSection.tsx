import { motion } from 'motion/react';
import { CheckIcon, XIcon, ShieldIcon } from '../../../components/ui/icons';

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
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-18"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold mb-3">
            <ShieldIcon size={14} className="text-teal-700" />
            <span>Safety Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Deterministic precision vs Generative guessing.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Why healthcare demands clinical grounding instead of generic chatbot answers.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl bg-white border border-slate-200/90 shadow-lg overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200 bg-slate-50/90 p-4 sm:p-5 font-bold text-xs sm:text-sm">
            <div className="md:col-span-4 text-slate-500 uppercase tracking-wider text-xs font-mono">
              Clinical Criterion
            </div>
            <div className="md:col-span-4 text-slate-500 uppercase tracking-wider text-xs font-mono mt-2 md:mt-0">
              Generic Public AI Chatbots
            </div>
            <div className="md:col-span-4 text-teal-800 uppercase tracking-wider text-xs font-mono mt-2 md:mt-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span>Curewell + Shifa AI</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 text-xs sm:text-sm gap-4 items-center hover:bg-teal-50/20 transition-all duration-200 group"
              >
                <div className="md:col-span-4 font-bold text-slate-900 group-hover:text-teal-950 transition-colors">
                  {row.criterion}
                </div>
                <div className="md:col-span-4 text-slate-600 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                    <XIcon size={12} strokeWidth={2.5} />
                  </span>
                  <p className="leading-relaxed">{row.generic}</p>
                </div>
                <div className="md:col-span-4 text-slate-900 font-medium flex items-start gap-2.5 bg-teal-50/40 p-3 rounded-xl border border-teal-100">
                  <span className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <CheckIcon size={12} strokeWidth={2.5} />
                  </span>
                  <p className="leading-relaxed font-semibold text-teal-950">{row.curewell}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
