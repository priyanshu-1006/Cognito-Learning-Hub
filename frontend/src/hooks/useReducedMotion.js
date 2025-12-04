import { useEffect, useState } from "react";

/**
 * Hook to detect if animations should be reduced
 * Returns true if:
 * 1. User prefers reduced motion (accessibility setting)
 * 2. User is on a mobile device
 */
export const useReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    // Check system preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    // Check if user is on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      setShouldReduceMotion(true);
    }

    // Listen for changes in preference
    const handler = () => setShouldReduceMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return shouldReduceMotion;
};

/**
 * Hook to detect if user is on a mobile device
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const smallScreen = window.innerWidth < 768;
      setIsMobile(mobile || smallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};
