import { motion } from 'motion/react';
import { CheckIcon } from '../../../components/ui/icons';

export function TestimonialsSection() {
  const testimonials = [
    {
      role: 'Type 2 Diabetes & HTN Patient',
      location: 'Lahore, Pakistan',
      name: 'Zeeshan K.',
      initials: 'ZK',
      quote:
        'I had three different plastic folders full of faded prescription receipts. Curewell’s Sentinel engine caught that two different clinic visits had given me the same active pain medication under two completely different trade names. That alone saved my liver from severe strain.',
      tag: 'Chronic Care Patient',
      verifiedDate: 'Verified Patient • 8 Mos on Curewell',
    },
    {
      role: 'Elderly Parent Caregiver',
      location: 'Karachi, Pakistan',
      name: 'Ayesha M.',
      initials: 'AM',
      quote:
        'My 72-year-old mother takes 7 different medicines daily. Managing morning vs bedtime pills across different doctor visits was terrifying. The Chronotherapy timetable and 1-page consultation brief makes our quarterly hospital appointments smooth and anxiety-free.',
      tag: 'Family Caregiver',
      verifiedDate: 'Polypharmacy Caregiver',
    },
    {
      role: 'Consultant Endocrinologist',
      location: 'Islamabad, Pakistan',
      name: 'Dr. Haris Abbasi, MBBS, FCPS',
      initials: 'HA',
      quote:
        'Patients usually waste half of a 7-minute consultation trying to remember their last HbA1c or previous dosage changes. When a patient brings a printed Curewell brief with clean 30-day vitals trends, I can make informed therapeutic decisions in 30 seconds.',
      tag: 'Clinical Specialist',
      verifiedDate: 'Independent Clinical Review',
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-18"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <span>Verified Patient & Clinical Outcomes</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Trusted by patients.
            <br />
            <span className="text-teal-700">Respected by doctors.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Real experiences from chronic care patients, family caregivers, and specialist clinicians.
          </p>
        </motion.div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-7 sm:p-8 rounded-3xl bg-slate-50/80 border border-slate-200/90 hover:border-teal-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                  <span className="text-xs font-mono font-bold text-teal-800 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/70">
                    {item.tag}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">{item.location}</span>
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic mb-6 font-normal">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">{item.role}</p>
                  </div>
                </div>
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckIcon size={12} strokeWidth={2.5} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
