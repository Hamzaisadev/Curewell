export function TestimonialsSection() {
  const testimonials = [
    {
      role: 'Type 2 Diabetes & HTN Patient',
      location: 'Lahore, Pakistan',
      name: 'Zeeshan K.',
      initials: 'ZK',
      quote:
        'I had three different plastic folders full of faded prescription receipts. Curewell’s Sentinel engine caught that two different clinic visits had given me the same active pain medication under two completely different trade names. That alone saved my liver from severe strain.',
      tag: 'CHRONIC CARE PATIENT',
    },
    {
      role: 'Elderly Parent Caregiver',
      location: 'Karachi, Pakistan',
      name: 'Ayesha M.',
      initials: 'AM',
      quote:
        'My 72-year-old mother takes 7 different medicines daily. Managing morning vs bedtime pills across different doctor visits was terrifying. The Chronotherapy timetable and 1-page consultation brief makes our quarterly hospital appointments smooth and anxiety-free.',
      tag: 'FAMILY CAREGIVER',
    },
    {
      role: 'Consultant Endocrinologist',
      location: 'Islamabad, Pakistan',
      name: 'Dr. Haris Abbasi, MBBS, FCPS',
      initials: 'HA',
      quote:
        'Patients usually waste half of a 7-minute consultation trying to remember their last HbA1c or previous dosage changes. When a patient brings a printed Curewell brief with clean 30-day vitals trends, I can make informed therapeutic decisions in 30 seconds.',
      tag: 'CLINICAL SPECIALIST',
    },
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-ink-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-teal-800 mb-2">
            CLINICAL & PATIENT IMPACT
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-ink-950 tracking-tight leading-tight">
            Trusted by Patients. Validated by Clinicians.
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Real stories from people managing complex regimens, elderly parents, and outpatient clinic consultations.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="p-7 sm:p-8 rounded-3xl bg-ink-50/60 border border-ink-200 flex flex-col justify-between hover:border-ink-300 transition-colors shadow-xs"
            >
              <div>
                <span className="px-2.5 py-1 rounded-md bg-teal-100 text-teal-900 text-[10px] font-mono font-bold uppercase">
                  {item.tag}
                </span>
                <p className="text-sm sm:text-base text-ink-800 leading-relaxed mt-4 italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-ink-200/80">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-950">{item.name}</p>
                  <p className="text-xs text-ink-500">{item.role} • {item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
