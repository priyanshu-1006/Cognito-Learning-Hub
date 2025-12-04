import React from "react";

/**
 * Responsive table wrapper for mobile devices
 * Adds horizontal scroll with visual indicators
 */
export const ResponsiveTable = ({ children, className = "" }) => {
  return (
    <div className="relative">
      <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            {children}
          </div>
        </div>
      </div>
      {/* Scroll indicator for mobile */}
      <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2 sm:hidden">
        ← Swipe to see more →
      </div>
    </div>
  );
};

export default ResponsiveTable;
