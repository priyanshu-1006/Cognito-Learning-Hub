import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useHaptic } from "../../hooks/useHaptic";

/**
 * Mobile-friendly modal component with:
 * - Bottom sheet style on mobile
 * - Swipe handle for dismissal
 * - Scroll lock
 * - Backdrop overlay
 * - Haptic feedback
 */
export const MobileModal = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = "90vh",
}) => {
  const { light } = useHaptic();

  useEffect(() => {
    if (isOpen) {
      light(); // Haptic feedback on modal open
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      // Account for iOS bounce
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = "0";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [isOpen, light]);

  const handleClose = () => {
    light(); // Haptic feedback on close
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Modal - Bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 left-0 right-0 z-50 overflow-y-auto bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl"
            style={{ maxHeight }}
          >
            {/* Swipe handle - mobile only */}
            <div className="flex justify-center pt-3 pb-2 sm:hidden">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileModal;
