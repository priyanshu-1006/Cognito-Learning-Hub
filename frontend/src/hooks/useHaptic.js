/**
 * Hook for haptic feedback (vibration) on mobile devices
 */
export const useHaptic = () => {
  const isSupported =
    typeof navigator !== "undefined" && "vibrate" in navigator;

  const haptic = {
    // Light tap (button press)
    light: () => {
      if (isSupported) {
        navigator.vibrate(10);
      }
    },

    // Medium impact (toggle, select)
    medium: () => {
      if (isSupported) {
        navigator.vibrate(20);
      }
    },

    // Heavy impact (important action)
    heavy: () => {
      if (isSupported) {
        navigator.vibrate(40);
      }
    },

    // Success pattern
    success: () => {
      if (isSupported) {
        navigator.vibrate([10, 50, 10]);
      }
    },

    // Error pattern
    error: () => {
      if (isSupported) {
        navigator.vibrate([20, 100, 20, 100, 20]);
      }
    },

    // Warning pattern
    warning: () => {
      if (isSupported) {
        navigator.vibrate([30, 100, 30]);
      }
    },

    // Notification pattern
    notification: () => {
      if (isSupported) {
        navigator.vibrate([10, 100, 10, 100, 10]);
      }
    },

    // Selection changed
    selection: () => {
      if (isSupported) {
        navigator.vibrate(5);
      }
    },
  };

  return { haptic, isSupported };
};

export default useHaptic;
