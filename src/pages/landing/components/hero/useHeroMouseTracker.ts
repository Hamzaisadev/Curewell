import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'motion/react';

interface UseHeroMouseTrackerOptions {
  stiffness?: number;
  damping?: number;
}

export function useHeroMouseTracker(options: UseHeroMouseTrackerOptions = {}) {
  const { stiffness = 160, damping = 22 } = options;
  const containerRef = useRef<HTMLElement | null>(null);

  // Normalized coordinates from -0.5 to 0.5 (center is 0, 0)
  const normX = useMotionValue(0);
  const normY = useMotionValue(0);

  // Pixel coordinates for spotlight GPU translate
  const pixelX = useMotionValue(-1000);
  const pixelY = useMotionValue(-1000);

  // Responsive spring with low mass for instantaneous tracking
  const springX = useSpring(normX, { stiffness, damping, mass: 0.4 });
  const springY = useSpring(normY, { stiffness, damping, mass: 0.4 });
  const smoothPixelX = useSpring(pixelX, { stiffness: 120, damping: 22, mass: 0.4 });
  const smoothPixelY = useSpring(pixelY, { stiffness: 120, damping: 22, mass: 0.4 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Respect reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let rafId: number | null = null;
    let pendingX = 0;
    let pendingY = 0;
    let hasMove = false;

    // Cache rect to avoid repeated getBoundingClientRect layout thrashing on every mousemove
    let cachedRect = el.getBoundingClientRect();

    const updateRect = () => {
      if (el) cachedRect = el.getBoundingClientRect();
    };

    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      pendingX = e.clientX - cachedRect.left;
      pendingY = e.clientY - cachedRect.top;
      hasMove = true;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (hasMove && cachedRect.width > 0 && cachedRect.height > 0) {
            pixelX.set(pendingX);
            pixelY.set(pendingY);

            const nx = Math.max(-0.5, Math.min(0.5, (pendingX / cachedRect.width) - 0.5));
            const ny = Math.max(-0.5, Math.min(0.5, (pendingY / cachedRect.height) - 0.5));

            normX.set(nx);
            normY.set(ny);
            hasMove = false;
          }
          rafId = null;
        });
      }
    };

    const handleMouseLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      normX.set(0);
      normY.set(0);
      pixelX.set(-1000);
      pixelY.set(-1000);
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [normX, normY, pixelX, pixelY]);

  return {
    containerRef,
    springX,
    springY,
    smoothPixelX,
    smoothPixelY,
  };
}
