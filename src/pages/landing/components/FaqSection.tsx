import { useState } from 'react';
import { ChevronDownIcon } from '../../../components/ui/icons';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Can Shifa AI diagnose illnesses or alter my prescriptions on its own?',
      a: 'No. Shifa AI is an assistive organizer and safety co-pilot, never a diagnostic replacement for your physician. It synthesizes your records, alerts you to duplicate active molecules, and prepares consultation questions. Every medical decision and prescription adjustment remains strictly between you and your licensed doctor.',
    },
    {
      q: 'How accurately does Curewell decode messy handwritten doctor slips?',
      a: 'Curewell utilizes a high-precision multimodal document engine trained on messy clinical slips. Every extracted medication, dose, and frequency code (BD, TDS, HS, AC, PC) is scored for confidence. Crucially, Curewell has zero silent commits: you always review and verify the extracted text before anything is saved to your vault.',
    },
    {
      q: 'What happens if I lose internet connectivity inside a hospital basement?',
      a: 'Curewell is engineered as an offline-first vault. Your active medication cabinet, emergency allergy lists, and 1-page consultation dossiers are stored locally on your device in an encrypted cache, allowing you to access critical health data even in hospital basements with zero cellular reception.',
    },
    {
      q: 'Is my personal medical data sold to insurance providers or advertisers?',
      a: 'Never. Your medical records are protected with 256-bit AES encryption at rest and isolated by tenant security. We do not sell, broker, or monetize your health data, nor do we use your private records to train commercial marketing algorithms.',
    },
    {
      q: 'How does the Sentinel engine prevent accidental duplicate overdoses?',
      a: 'Many medications share different commercial trade names while containing the identical chemical molecule (for example, Panadol and Calpol both contain Paracetamol). The Sentinel engine deconstructs all brand names into their base chemical molecules and calculates cumulative daily milligram totals to prevent accidental toxicity.',
    },
    {
      q: 'Can I share my medical file with consulting specialists or family?',
      a: 'Yes. You can generate a 1-page printable clinical dossier or create a temporary, self-destructing 6-digit PIN code. This allows consulting physicians or family caregivers to review your records without needing permanent access to your personal vault.',
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-ink-50/60 border-b border-ink-200">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-teal-800 mb-2">
            FREQUENTLY ASKED QUESTIONS
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-ink-950 tracking-tight leading-tight">
            Common Patient Questions.
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Everything you need to know about Curewell's clinical safety boundaries, data privacy, and offline capabilities.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-ink-200 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-ink-900 text-sm sm:text-base hover:text-teal-800 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDownIcon
                    size={18}
                    className={`shrink-0 transition-transform duration-200 text-ink-500 ${
                      isOpen ? 'rotate-180 text-teal-700' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-ink-600 leading-relaxed border-t border-ink-100/70">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
