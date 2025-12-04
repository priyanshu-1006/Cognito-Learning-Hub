import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Loader2 } from "lucide-react";

/**
 * Pull-to-refresh indicator component
 */
export const PullToRefreshIndicator = ({
  pullDistance,
  pullProgress,
  isRefreshing,
}) => {
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 30 },
          }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pt-4"
          style={{
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
            transition: isRefreshing ? "transform 0.3s ease-out" : "none",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg px-6 py-3 flex items-center gap-3">
            {isRefreshing ? (
              <>
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Refreshing...
                </span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: pullProgress * 3.6 }}
                  transition={{ duration: 0 }}
                >
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                </motion.div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {pullProgress >= 100
                    ? "Release to refresh"
                    : "Pull to refresh"}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PullToRefreshIndicator;
