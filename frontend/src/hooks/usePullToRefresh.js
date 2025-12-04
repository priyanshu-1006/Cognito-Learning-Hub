import { useEffect, useRef, useState } from "react";

/**
 * Hook to implement pull-to-refresh functionality
 * @param {Function} onRefresh - Callback function to execute on refresh
 * @param {number} threshold - Distance to pull before triggering (default: 80px)
 */
export const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    let scrollableElement = null;

    const handleTouchStart = (e) => {
      // Only trigger if at top of page
      const element = e.target.closest("[data-pull-to-refresh]") || window;
      const scrollTop = element === window ? window.scrollY : element.scrollTop;

      if (scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      if (distance > 0) {
        // Prevent default scroll behavior when pulling
        e.preventDefault();
        // Apply resistance to pull distance (diminishing returns)
        const resistanceFactor = 0.5;
        setPullDistance(distance * resistanceFactor);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;

      setIsPulling(false);

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold); // Lock at threshold during refresh

        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          // Smooth reset animation
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, onRefresh, isRefreshing]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min((pullDistance / threshold) * 100, 100),
  };
};

export default usePullToRefresh;
