import { useState } from 'react';
import { motion } from 'motion/react';
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
    <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-4xl mx-auto">
        {/* Section Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14 sm:mb-18"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Common questions.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Everything you need to know about privacy, accuracy, and emergency access.
          </p>
        </motion.div>

        {/* Accordion List with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3.5"
        >
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-2xs transition-colors hover:border-slate-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold text-slate-900 text-base sm:text-lg transition-colors hover:text-teal-800"
                >
                  <span>{faq.q}</span>
                  <ChevronDownIcon
                    size={20}
                    className={`shrink-0 transition-transform duration-200 text-slate-400 ${
                      isOpen ? 'rotate-180 text-teal-700' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-200/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
