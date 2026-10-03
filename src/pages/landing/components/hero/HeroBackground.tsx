import { motion, type MotionValue } from 'motion/react';

interface HeroBackgroundProps {
  smoothPixelX: MotionValue<number>;
  smoothPixelY: MotionValue<number>;
}

export function HeroBackground({ smoothPixelX, smoothPixelY }: HeroBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Base Precision Blueprint Grid */}
      <div
        className="absolute inset-0 opacity-[0.22] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_92%)]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* 2. Micro Crosshair Registration Markers at Key Architectural Coordinates */}
      <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]">
        {[
          { top: '12%', left: '8%', label: 'SEC.01 // ALPHA' },
          { top: '18%', right: '10%', label: 'VAULT.ENCLAVE' },
          { top: '45%', left: '6%', label: 'LAT 31.5204° N' },
          { top: '52%', right: '8%', label: 'FHIR-R4 // HL7' },
          { top: '78%', left: '12%', label: 'AES-256 GCM' },
          { top: '84%', right: '14%', label: 'OFFLINE CACHE' },
        ].map((marker, idx) => (
          <div
            key={idx}
            className="absolute flex items-center gap-1.5 text-slate-400 font-mono text-[9px] tracking-wider select-none pointer-events-none"
            style={{ top: marker.top, left: marker.left, right: marker.right }}
          >
            <span className="text-teal-600 font-bold">+</span>
            <span className="hidden md:inline text-slate-400/80">{marker.label}</span>
          </div>
        ))}
      </div>

      {/* 3. GPU Hardware-Accelerated Smooth Cursor Spotlight (translate3d, ZERO repaints) */}
      <motion.div
        className="absolute top-0 left-0 w-[620px] h-[620px] rounded-full pointer-events-none hidden sm:block -translate-x-1/2 -translate-y-1/2"
        style={{
          x: smoothPixelX,
          y: smoothPixelY,
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.14) 0%, rgba(16, 185, 129, 0.05) 40%, transparent 70%)',
          willChange: 'transform',
        }}
      />

      {/* 4. Ambient Static Radial Glow for Depth */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[520px] bg-gradient-to-b from-teal-100/40 via-emerald-50/20 to-transparent rounded-full blur-3xl opacity-80 pointer-events-none" />

      {/* 5. Subtle Floating Ambient Aura Orbs */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-teal-200/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-emerald-200/15 blur-3xl pointer-events-none" />

      {/* 6. Precision Tomography Scanline Sweeper */}
      <motion.div
        aria-hidden="true"
        initial={{ y: '-10%', opacity: 0 }}
        animate={{
          y: ['0%', '115%'],
          opacity: [0, 0.35, 0.6, 0.35, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 3.5,
        }}
        className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent pointer-events-none"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
