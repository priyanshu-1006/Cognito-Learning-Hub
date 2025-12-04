import { useEffect } from "react";

/**
 * Performance Monitor Hook
 * Tracks Core Web Vitals for mobile optimization
 */
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Only in production
    if (import.meta.env.DEV) return;

    // Check if Performance Observer is supported
    if (!("PerformanceObserver" in window)) return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      // Silently fail if not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log("FID:", entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      // Silently fail if not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
            console.log("CLS:", clsScore);
          }
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      // Silently fail if not supported
    }

    // Network Information API for adaptive loading
    if ("connection" in navigator) {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      console.log("Network type:", connection?.effectiveType);
      console.log("Downlink:", connection?.downlink);
      console.log("RTT:", connection?.rtt);
      console.log("Save data:", connection?.saveData);
    }
  }, []);
};

/**
 * Detect if user is on a slow connection
 */
export const useSlowConnection = () => {
  if (!("connection" in navigator)) return false;

  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  // Consider slow if:
  // - Save data mode is enabled
  // - Effective type is slow-2g or 2g
  // - Downlink is less than 1 Mbps
  return (
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    (connection?.downlink && connection.downlink < 1)
  );
};

/**
 * Prefetch resources for better performance
 */
export const prefetchResource = (url, type = "fetch") => {
  if (!url) return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  link.as = type;
  document.head.appendChild(link);
};

/**
 * Preconnect to external domains
 */
export const preconnectDomain = (domain) => {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = domain;
  document.head.appendChild(link);
};
