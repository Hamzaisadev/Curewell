import { XIcon, CheckIcon } from '../../../components/ui/icons';

export function ProblemVsSolutionSection() {
  const problems = [
    {
      title: 'Lost in Drawers & Shoeboxes',
      desc: 'Paper prescriptions fade, tear, and get left behind when visiting new specialists or travelling.',
    },
    {
      title: 'Accidental Duplicate Toxicity',
      desc: 'Taking two different brand names that share the identical chemical molecule (like Panadol and Calpol) leads to organ strain.',
    },
    {
      title: 'Scattered WhatsApp Lab PDFs',
      desc: 'Blood tests trapped in family WhatsApp groups make it impossible to know if your cholesterol or HbA1c is actually improving.',
    },
    {
      title: 'Forgotten Questions in 5-Minute Visits',
      desc: 'Patients feel rushed during short doctor consultations, forgetting critical questions and symptom changes.',
    },
    {
      title: 'Blind Emergency Room Trips',
      desc: 'In an unexpected medical crisis, emergency doctors have no access to your active blood thinners, allergies, or past surgeries.',
    },
  ];

  const solutions = [
    {
      title: 'Permanent Zero-Friction Vault',
      desc: 'Snap any paper doctor slip. Curewell digitizes and stores your complete medical history forever with zero physical clutter.',
    },
    {
      title: 'Sentinel Generic Molecule Radar',
      desc: 'Breaks every medicine down to its active chemical entity, computing daily milligram loads to catch accidental overdoses.',
    },
    {
      title: 'Longitudinal Biomarker Velocity',
      desc: 'Extracts lab results across multiple clinics, graphing the real rate-of-change (delta %) so trends are instantly clear.',
    },
    {
      title: '1-Page Doctor Consultation Brief',
      desc: 'Generate a structured brief with prioritized [HIGH], [MEDIUM], and [ROUTINE] questions ready for your doctor in 30 seconds.',
    },
    {
      title: '10-Second Emergency QR Pass',
      desc: 'First responders can view life-saving allergy lists and current medications securely from your lock screen or wallet card.',
    },
  ];

  return (
    <section id="problem-solution" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-ink-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-teal-800 mb-2">
            THE CLINICAL DISCONNECT
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-ink-950 tracking-tight leading-tight">
            The Danger of Fragmented Care.
            <br />
            <span className="text-teal-700">vs. The Curewell Standard.</span>
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Healthcare breaks down when records are scattered across paper slips, clinic files, and chat apps. Here is how Curewell changes the standard.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* The Problem Column */}
          <div className="p-6 sm:p-10 rounded-3xl bg-rose-50/40 border border-rose-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-rose-200">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white">
                <XIcon size={20} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-950">The Broken Paper Reality</h3>
                <p className="text-xs text-rose-800 font-medium">How families manage health records today</p>
              </div>
            </div>

            <div className="space-y-5">
              {problems.map((prob, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ×
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-ink-900">{prob.title}</h4>
                    <p className="text-xs sm:text-sm text-ink-600 leading-relaxed mt-0.5">{prob.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The Curewell Solution Column */}
          <div className="p-6 sm:p-10 rounded-3xl bg-teal-50/40 border border-teal-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-teal-200">
              <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white">
                <CheckIcon size={20} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-lg font-black text-teal-950">The Curewell Architecture</h3>
                <p className="text-xs text-teal-800 font-medium">Clinically grounded, patient-controlled</p>
              </div>
            </div>

            <div className="space-y-5">
              {solutions.map((sol, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="w-5 h-5 rounded-full bg-teal-200/80 text-teal-900 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-ink-900">{sol.title}</h4>
                    <p className="text-xs sm:text-sm text-ink-600 leading-relaxed mt-0.5">{sol.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
