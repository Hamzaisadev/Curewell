import { motion } from 'motion/react';

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
    },
    {
      role: 'Elderly Parent Caregiver',
      location: 'Karachi, Pakistan',
      name: 'Ayesha M.',
      initials: 'AM',
      quote:
        'My 72-year-old mother takes 7 different medicines daily. Managing morning vs bedtime pills across different doctor visits was terrifying. The Chronotherapy timetable and 1-page consultation brief makes our quarterly hospital appointments smooth and anxiety-free.',
      tag: 'Family Caregiver',
    },
    {
      role: 'Consultant Endocrinologist',
      location: 'Islamabad, Pakistan',
      name: 'Dr. Haris Abbasi, MBBS, FCPS',
      initials: 'HA',
      quote:
        'Patients usually waste half of a 7-minute consultation trying to remember their last HbA1c or previous dosage changes. When a patient brings a printed Curewell brief with clean 30-day vitals trends, I can make informed therapeutic decisions in 30 seconds.',
      tag: 'Clinical Specialist',
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50/70 text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* Header with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-18"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2">
            Stories
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Trusted by families.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed font-normal">
            Real experiences from patients, caregivers, and clinicians.
          </p>
        </motion.div>

        {/* 3 Testimonial Cards in Light Mode with Motion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
                  {item.tag}
                </span>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mt-5 italic font-sans">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role} • {item.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
