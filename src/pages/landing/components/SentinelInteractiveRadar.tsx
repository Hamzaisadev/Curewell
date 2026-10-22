import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldIcon,
  AlertTriangleIcon,
  CheckIcon,
  CapsuleIcon,
  
} from '../../../components/ui/icons';

interface AvailableDrug {
  id: string;
  brandName: string;
  doctorOrigin: string;
  activeMolecule: string;
  dosageMg: number;
  frequency: string;
  dailyTotalMg: number;
  category: 'analgesic' | 'antidiabetic' | 'lipid' | 'nsaid';
}

const DRUG_CATALOG: AvailableDrug[] = [
  {
    id: 'panadol',
    brandName: 'Panadol Extra 500mg',
    doctorOrigin: 'Clinic A (Headache OPD)',
    activeMolecule: 'Paracetamol',
    dosageMg: 500,
    frequency: '2 tabs TID',
    dailyTotalMg: 3000,
    category: 'analgesic',
  },
  {
    id: 'calpol',
    brandName: 'Calpol 250mg Syrup',
    doctorOrigin: 'Clinic B (Fever Telehealth)',
    activeMolecule: 'Paracetamol',
    dosageMg: 250,
    frequency: '2 tsp QID',
    dailyTotalMg: 1500,
    category: 'analgesic',
  },
  {
    id: 'cocodamol',
    brandName: 'Co-Codamol 500/30',
    doctorOrigin: 'Dental Surgery Clinic',
    activeMolecule: 'Paracetamol',
    dosageMg: 500,
    frequency: '1 tab QDS',
    dailyTotalMg: 2000,
    category: 'analgesic',
  },
  {
    id: 'disprin',
    brandName: 'Disprin 300mg Soluble',
    doctorOrigin: 'Over The Counter',
    activeMolecule: 'Aspirin (NSAID)',
    dosageMg: 300,
    frequency: '1 tab PRN',
    dailyTotalMg: 600,
    category: 'nsaid',
  },
  {
    id: 'metformin',
    brandName: 'Glucophage 500mg',
    doctorOrigin: 'Endocrinology Clinic',
    activeMolecule: 'Metformin HCl',
    dosageMg: 500,
    frequency: '1 tab BD',
    dailyTotalMg: 1000,
    category: 'antidiabetic',
  },
  {
    id: 'janumet',
    brandName: 'Janumet 50/500mg',
    doctorOrigin: 'Family Medicine Visit',
    activeMolecule: 'Metformin HCl',
    dosageMg: 500,
    frequency: '1 tab BD',
    dailyTotalMg: 1000,
    category: 'antidiabetic',
  },
];

export function SentinelInteractiveRadar() {
  // Currently selected drugs
  const [selectedDrugIds, setSelectedDrugIds] = useState<string[]>(['panadol', 'calpol']);

  const toggleDrug = (id: string) => {
    setSelectedDrugIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectedDrugs = useMemo(() => {
    return DRUG_CATALOG.filter((d) => selectedDrugIds.includes(d.id));
  }, [selectedDrugIds]);

  // Calculate cumulative load by active molecule
  const moleculeTotals = useMemo(() => {
    const totals: Record<string, { totalMg: number; drugs: string[] }> = {};
    for (const drug of selectedDrugs) {
      if (!totals[drug.activeMolecule]) {
        totals[drug.activeMolecule] = { totalMg: 0, drugs: [] };
      }
      totals[drug.activeMolecule]!.totalMg += drug.dailyTotalMg;
      totals[drug.activeMolecule]!.drugs.push(drug.brandName);
    }
    return totals;
  }, [selectedDrugs]);

  // Paracetamol calculation
  const paracetamolData = moleculeTotals['Paracetamol'] || { totalMg: 0, drugs: [] };
  const paracetamolLoad = paracetamolData.totalMg;
  const paracetamolCeiling = 4000;
  const paracetamolRatio = Math.min(paracetamolLoad / paracetamolCeiling, 1.25);

  // Metformin duplicate check
  const metforminData = moleculeTotals['Metformin HCl'];
  const hasMetforminDuplicate = metforminData && metforminData.drugs.length > 1;

  // Collision state
  const isParacetamolCollision = paracetamolLoad > paracetamolCeiling;
  const isParacetamolWarning = paracetamolLoad >= 2500 && paracetamolLoad <= paracetamolCeiling;
  const hasAnyCollision = isParacetamolCollision || hasMetforminDuplicate;

  return (
    <section
      id="collision-radar"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-b border-slate-200/80 relative overflow-hidden scroll-mt-24"
    >
      {/* Background blueprint subtle circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-slate-100 rounded-full pointer-events-none opacity-60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-slate-100 rounded-full pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-3.5 shadow-2xs">
            <ShieldIcon size={14} className="text-rose-600" />
            <span className="font-mono uppercase tracking-wider text-[11px]">Pharmacological Safety Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Sentinel collision radar.
            <br />
            <span className="text-rose-600">Catch accidental double-dosing.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Doctors prescribe commercial trade names. Your body processes chemical molecules. Test real-world prescription overlap scenarios in the interactive sandbox below.
          </p>

          {/* Preset Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-1">PRESET SCENARIOS:</span>
            <button
              onClick={() => setSelectedDrugIds(['panadol', 'calpol'])}
              className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              The Flu Overdose Trap (Panadol + Calpol)
            </button>
            <button
              onClick={() => setSelectedDrugIds(['panadol', 'cocodamol'])}
              className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
            >
              Severe Dental Trap (Panadol + Co-Codamol)
            </button>
            <button
              onClick={() => setSelectedDrugIds(['metformin', 'janumet'])}
              className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
            >
              Metformin Duplicate Stacking
            </button>
            <button
              onClick={() => setSelectedDrugIds(['metformin', 'disprin'])}
              className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer"
            >
              Clean Regimen (No Overlap)
            </button>
          </div>
        </div>

        {/* Interactive Sandbox Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Drug Selector Cabinet (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-50/90 border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                Active Medicine Cabinet
              </span>
              <span className="text-xs font-mono text-teal-700 font-bold">
                {selectedDrugIds.length} SELECTED
              </span>
            </div>

            <p className="text-xs text-slate-500 font-sans">
              Click medications below to add or remove them from the patient's active daily regimen:
            </p>

            <div className="space-y-2.5">
              {DRUG_CATALOG.map((drug) => {
                const isSelected = selectedDrugIds.includes(drug.id);
                return (
                  <button
                    key={drug.id}
                    onClick={() => toggleDrug(drug.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white border-teal-500 shadow-xs ring-1 ring-teal-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <CapsuleIcon size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{drug.brandName}</p>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {drug.frequency}
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-800 font-mono font-medium">
                          Active: {drug.activeMolecule} ({drug.dailyTotalMg} mg/day)
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Source: {drug.doctorOrigin}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckIcon size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sentinel Live Collision Radar Display (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
            {/* Top Radar Coordinate Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Radar Status Bar */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-2">
                <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                  </span>
                  <span>SENTINEL TELEMETRY RADAR v4.0</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                      isParacetamolCollision
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isParacetamolWarning
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isParacetamolCollision
                      ? '● CRITICAL COLLISION'
                      : isParacetamolWarning
                      ? '▲ ELEVATED HEPATIC LOAD'
                      : '✓ SAFE PHYSIOLOGICAL CLEARANCE'}
                  </span>
                </div>
              </div>

              {/* Main Paracetamol Cumulative Gauge */}
              <div className="space-y-4 mb-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Cumulative Paracetamol (Acetaminophen) Load:
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl sm:text-5xl font-mono font-black text-white">
                        {paracetamolLoad}
                      </span>
                      <span className="text-sm font-mono text-slate-400">mg / 24 hours</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-400">Hepatic Ceiling</span>
                    <p className="text-sm font-mono font-bold text-rose-400">4,000 mg Max</p>
                  </div>
                </div>

                {/* Multi-Segment Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-4 p-0.5 overflow-hidden border border-slate-700 relative">
                  <motion.div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isParacetamolCollision
                        ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                        : isParacetamolWarning
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                        : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.min(paracetamolRatio * 100, 100)}%` }}
                  />
                  {/* Ceiling marker indicator */}
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-rose-400/80 z-10" />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>0 mg (Baseline)</span>
                  <span className="text-amber-300">2,500 mg (Elevated)</span>
                  <span className="text-rose-400 font-bold">4,000 mg (Liver Toxicity Risk)</span>
                </div>
              </div>

              {/* Alert Notification Display */}
              <AnimatePresence mode="wait">
                {isParacetamolCollision && (
                  <motion.div
                    key="paracetamol-collision"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 text-xs leading-relaxed space-y-2 mb-4 shadow-lg"
                  >
                    <div className="flex items-center gap-2 font-bold text-rose-300 font-mono">
                      <AlertTriangleIcon size={16} className="text-rose-400 shrink-0" />
                      <span>HEPATIC OVERDOSE THRESHOLD EXCEEDED ({paracetamolLoad} mg)</span>
                    </div>
                    <p className="font-sans">
                      Prescriptions from multiple clinics combine different trade names (
                      {paracetamolData.drugs.join(' + ')}) sharing the identical active molecule Paracetamol. Exceeds the 4,000 mg/day safe limit. Risk of acute liver toxicity.
                    </p>
                  </motion.div>
                )}

                {hasMetforminDuplicate && (
                  <motion.div
                    key="metformin-duplicate"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 text-amber-100 text-xs leading-relaxed space-y-1 mb-4 shadow-lg"
                  >
                    <div className="flex items-center gap-2 font-bold text-amber-300 font-mono">
                      <AlertTriangleIcon size={16} className="text-amber-400 shrink-0" />
                      <span>DUPLICATE METFORMIN REGIMEN DETECTED</span>
                    </div>
                    <p className="font-sans">
                      Both <strong>Glucophage</strong> and <strong>Janumet</strong> contain Metformin HCl. Taking both simultaneously without doctor awareness increases risk of lactic acidosis and gastrointestinal distress.
                    </p>
                  </motion.div>
                )}

                {!hasAnyCollision && (
                  <motion.div
                    key="clear-status"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs leading-relaxed flex items-center gap-3 mb-4"
                  >
                    <CheckIcon size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold font-mono">NO PHARMACOLOGICAL COLLISIONS DETECTED</p>
                      <p className="text-[11px] text-emerald-300/90 font-sans mt-0.5">
                        All selected medications operate on distinct chemical pathways within safe therapeutic corridors.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chemical Molecule Breakdown Table */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Deconstructed Chemical Entities:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(moleculeTotals).map(([mol, info]) => (
                    <div
                      key={mol}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex justify-between items-center"
                    >
                      <span className="text-slate-300">{mol}:</span>
                      <span className="text-teal-300 font-bold">{info.totalMg} mg/day</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Enclave Disclaimer */}
            <div className="pt-4 mt-6 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldIcon size={12} className="text-teal-400" />
                <span>Deterministic Pharmacopeia Engine</span>
              </span>
              <span>100% Client-Side Evaluation</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
