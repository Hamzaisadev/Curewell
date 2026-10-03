import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDownIcon } from '../../../components/ui/icons';

interface FaqItem {
  category: 'safety' | 'accuracy' | 'offline' | 'privacy';
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'safety',
    q: 'Can Shifa AI diagnose illnesses or alter my prescriptions on its own?',
    a: 'No. Shifa AI is an assistive organizer and safety co-pilot, never a diagnostic replacement for your physician. It synthesizes your records, alerts you to duplicate active molecules, and prepares consultation questions. Every medical decision and prescription adjustment remains strictly between you and your licensed doctor with zero silent automated changes.',
  },
  {
    category: 'accuracy',
    q: 'How accurately does Curewell decode messy handwritten doctor slips?',
    a: 'Curewell utilizes a high-precision multimodal document engine specifically trained on complex clinical slips. Every extracted medication, dose, and frequency code (BD, TDS, HS, AC, PC) is scored for confidence. Crucially, Curewell enforces zero silent commits: you always review and verify the extracted text before anything is saved to your permanent vault.',
  },
  {
    category: 'offline',
    q: 'What happens if I lose internet connectivity inside a hospital basement?',
    a: 'Curewell is engineered as an offline-first Progressive Web App (PWA). Your active medication cabinet, emergency allergy lists, and 1-page consultation dossiers are stored locally on your device in an encrypted cache, allowing you to access critical health data even in hospital basements with zero cellular reception.',
  },
  {
    category: 'privacy',
    q: 'Is my personal medical data sold to insurance providers or advertisers?',
    a: 'Never. Your medical records are protected with 256-bit AES encryption at rest and isolated by tenant security. We do not sell, broker, or monetize your health data, nor do we use your private records to train commercial marketing algorithms.',
  },
  {
    category: 'safety',
    q: 'How does the Sentinel engine prevent accidental duplicate overdoses?',
    a: 'Many medications share different commercial trade names while containing the identical chemical molecule (for example, Panadol and Calpol both contain Paracetamol). The Sentinel engine deconstructs all brand names into their base chemical molecules and calculates cumulative daily milligram totals to prevent accidental organ toxicity.',
  },
  {
    category: 'privacy',
    q: 'Can I share my medical file with consulting specialists or family caregivers?',
    a: 'Yes. You can generate a 1-page printable clinical dossier or create a temporary, self-destructing 6-digit PIN code. This allows consulting physicians or family caregivers to review your records without needing permanent access to your personal vault.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'safety' | 'accuracy' | 'offline' | 'privacy'>('all');

  const filteredFaqs = activeFilter === 'all' ? FAQS : FAQS.filter((f) => f.category === activeFilter);

  return (
    <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 border-b border-slate-200 relative overflow-hidden scroll-mt-28">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Clear answers.
            <br />
            <span className="text-teal-700">Zero ambiguity.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Everything you need to know about privacy, accuracy, and emergency offline access.
          </p>
        </motion.div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(['all', 'safety', 'accuracy', 'offline', 'privacy'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setOpenIndex(0);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {filter === 'all' ? 'All Questions' : filter}
            </button>
          ))}
        </div>

        {/* Accordion List with Motion */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:border-teal-300 transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold text-slate-900 text-base sm:text-lg transition-colors hover:text-teal-900 cursor-pointer"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${isOpen ? 'bg-teal-50 text-teal-700 rotate-180' : 'bg-slate-100 text-slate-500'}`}>
                    <ChevronDownIcon size={18} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
