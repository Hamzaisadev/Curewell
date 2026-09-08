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
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-ink-50/50 border-b border-ink-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-teal-800 mb-2">
            SAFETY & ETHICS MATRIX
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-ink-950 tracking-tight leading-tight">
            Why Generic AI Fails in Healthcare.
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Healthcare requires deterministic safety, not creative guessing. See how Curewell’s clinical architecture differs from general-purpose chatbots.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-3xl bg-white border border-ink-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-ink-200 bg-ink-100/60 p-4 sm:p-6 font-bold text-xs sm:text-sm">
            <div className="md:col-span-4 text-ink-500 uppercase tracking-wider font-mono">
              Clinical Criterion
            </div>
            <div className="md:col-span-4 text-rose-800 uppercase tracking-wider font-mono mt-2 md:mt-0">
              Generic Public AI Chatbots
            </div>
            <div className="md:col-span-4 text-teal-800 uppercase tracking-wider font-mono mt-2 md:mt-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              Curewell + Shifa AI Co-Pilot
            </div>
          </div>

          <div className="divide-y divide-ink-100">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 text-xs sm:text-sm gap-4 items-center hover:bg-ink-50/50 transition-colors"
              >
                <div className="md:col-span-4 font-bold text-ink-950">
                  {row.criterion}
                </div>
                <div className="md:col-span-4 text-ink-600 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <XIcon size={14} strokeWidth={2.5} />
                  </span>
                  <p className="leading-relaxed">{row.generic}</p>
                </div>
                <div className="md:col-span-4 text-ink-900 font-medium flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon size={14} strokeWidth={2.5} />
                  </span>
                  <p className="leading-relaxed">{row.curewell}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
