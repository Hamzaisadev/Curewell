import { motion, type MotionValue } from 'motion/react';

interface HeroBackgroundProps {
  smoothPixelX: MotionValue<number>;
  smoothPixelY: MotionValue<number>;
}

export function HeroBackground({ smoothPixelX, smoothPixelY }: HeroBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Base Millimeter Blueprint Grid */}
      <div
        className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* 2. Micro Crosshair Registration Markers at Key Coordinates */}
      <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]">
        {[
          { top: '15%', left: '12%' },
          { top: '22%', right: '14%' },
          { top: '48%', left: '8%' },
          { top: '55%', right: '10%' },
          { top: '78%', left: '18%' },
          { top: '82%', right: '16%' },
        ].map((pos, idx) => (
          <div
            key={idx}
            className="absolute text-slate-400/60 font-mono text-[10px] select-none pointer-events-none"
            style={pos}
          >
            +
          </div>
        ))}
      </div>

      {/* 3. GPU Hardware-Accelerated Smooth Cursor Spotlight (Transform translate3d, ZERO repaints) */}
      <motion.div
        className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full pointer-events-none hidden sm:block -translate-x-1/2 -translate-y-1/2"
        style={{
          x: smoothPixelX,
          y: smoothPixelY,
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 70%)',
          willChange: 'transform',
        }}
      />

      {/* 4. Ambient Static Radial Glow for Mobile / Fixed Fallback */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-teal-100/35 via-emerald-50/15 to-transparent rounded-full blur-3xl opacity-70 pointer-events-none" />

      {/* 5. Precision Tomography Scanline Sweeper */}
      <motion.div
        aria-hidden="true"
        initial={{ y: '-10%', opacity: 0 }}
        animate={{
          y: ['0%', '110%'],
          opacity: [0, 0.35, 0.5, 0.35, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 3,
        }}
        className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent pointer-events-none"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
