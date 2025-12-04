import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Badge = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default",
  animate = true,
  children,
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center rounded-full font-medium transition-all duration-200";
  
  const variants = {
    default: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-400",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400",
    outline: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
    gradient: "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/50 hover:shadow-2xl hover:shadow-purple-500/50 border border-white/20"
  };

  const sizes = {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-xs",
    lg: "px-4 py-2 text-sm font-semibold"
  };

  const BadgeComponent = (
    <span
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );

  if (animate) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {BadgeComponent}
      </motion.span>
    );
  }

  return BadgeComponent;
});

Badge.displayName = "Badge";

export { Badge };
export default Badge;
