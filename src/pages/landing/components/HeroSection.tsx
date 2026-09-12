import { useHeroMouseTracker } from './hero/useHeroMouseTracker';
import { HeroBackground } from './hero/HeroBackground';
import { HeroHeadline } from './hero/HeroHeadline';
import { HeroVisualStage } from './hero/HeroVisualStage';
import { HeroMetricsStrip } from './hero/HeroMetricsStrip';

export function HeroSection() {
  const { containerRef, springX, springY, smoothPixelX, smoothPixelY } = useHeroMouseTracker({
    stiffness: 100,
    damping: 18,
  });

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement | null>}
      className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white text-slate-900 border-b border-slate-200/80"
    >
      {/* 1. Ambient Blueprint Grid & Reactive Spotlight Glow */}
      <HeroBackground smoothPixelX={smoothPixelX} smoothPixelY={smoothPixelY} />

      {/* 2. Main Content Conductor */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Kinetic Staggered Typography & CTAs */}
        <HeroHeadline />

        {/* 3. Interactive 3D Perspective Vault Stage & Telemetry Centerpiece */}
        <HeroVisualStage springX={springX} springY={springY} />

        {/* 4. Glassmorphic Proof Metrics Strip with Rolling Counters */}
        <HeroMetricsStrip />
      </div>
    </section>
  );
}
