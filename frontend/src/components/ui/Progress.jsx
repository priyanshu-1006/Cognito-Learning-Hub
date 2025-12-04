import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ 
  className, 
  value = 0, 
  max = 100,
  size = "default",
  variant = "default",
  showValue = false,
  animated = true,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeStyles = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3",
    xl: "h-4"
  };

  const variantStyles = {
    default: "bg-indigo-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    destructive: "bg-red-600",
    gradient: "bg-gradient-to-r from-indigo-500 to-purple-600"
  };

  return (
    <div className={cn("w-full", className)} ref={ref} {...props}>
      {showValue && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn(
        "w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
        sizeStyles[size]
      )}>
        <motion.div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            variantStyles[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.6, ease: "easeOut" } : { duration: 0 }}
        />
      </div>
    </div>
  );
});

Progress.displayName = "Progress";

export default Progress;
