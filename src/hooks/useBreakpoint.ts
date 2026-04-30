import { useState, useEffect } from 'react';

function getWidth() {
  return typeof window !== 'undefined' ? window.innerWidth : 1280;
}

export function useBreakpoint() {
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    let raf: number;
    const handler = () => {
      raf = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', handler, { passive: true });
    return () => {
      window.removeEventListener('resize', handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}
