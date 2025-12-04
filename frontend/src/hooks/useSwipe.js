import { useEffect, useRef, useCallback } from "react";

/**
 * Hook to add swipe gesture support to an element
 * @param {Function} onSwipeLeft - Callback when swiped left
 * @param {Function} onSwipeRight - Callback when swiped right
 * @param {number} minSwipeDistance - Minimum distance for swipe (default: 50px)
 */
export const useSwipe = (onSwipeLeft, onSwipeRight, minSwipeDistance = 50) => {
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }

    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

/**
 * Hook to detect keyboard input for mobile
 * Adjusts layout when virtual keyboard appears
 */
export const useKeyboardDetection = () => {
  const { useEffect, useState } = require("react");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (!window.visualViewport) return;

      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - viewportHeight;

      setKeyboardHeight(diff);
      setIsKeyboardVisible(diff > 0);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
};

export default useSwipe;
