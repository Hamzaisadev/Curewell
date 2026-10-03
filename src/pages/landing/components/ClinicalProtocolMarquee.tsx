import { motion } from 'motion/react';

const PROTOCOLS = [
  'HL7 / FHIR R4 STRUCTURED HEALTH DATA',
  '256-BIT AES-GCM ENCRYPTED ENCLAVES',
  'ZERO SILENT COMMITS — PATIENT APPROVED',
  'CHRONOTHERAPY CIRCADIAN PROTOCOL',
  'AHA / ACC DETERMINISTIC BP STAGING',
  'ADA GLYCEMIC TARGET VALIDATION',
  'ZERO THIRD-PARTY DATA BROKERAGE',
  '10-SECOND LOCK SCREEN EMERGENCY QR',
  'OFFLINE-FIRST ENCRYPTED CACHE',
];

export function ClinicalProtocolMarquee() {
  return (
    <div className="py-4 bg-slate-950 text-white border-y border-slate-800 overflow-hidden relative select-none">
      {/* Subtle edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* Infinite horizontal marquee */}
      <div className="flex w-max">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex items-center gap-8 shrink-0 font-mono text-xs tracking-wider"
        >
          {PROTOCOLS.concat(PROTOCOLS).map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-slate-300 font-semibold">{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
