import { useEffect, useState, type RefObject } from 'react';

interface UseInViewportOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * High-performance viewport observer using native IntersectionObserver.
 * Triggers animations only when elements enter the visible screen viewport.
 */
export function useInViewport(
  ref: RefObject<HTMLElement | null>,
  options: UseInViewportOptions = {}
): boolean {
  const { threshold = 0.2, rootMargin = '0px', once = true } = options;
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin, once]);

  return isInView;
}
