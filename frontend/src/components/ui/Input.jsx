import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ 
  className, 
  type = "text", 
  error = false,
  label,
  icon,
  ...props 
}, ref) => {
  const IconComponent = icon;
  
  const inputStyles = cn(
    "flex h-12 w-full rounded-xl border bg-white dark:bg-gray-800 backdrop-blur-sm px-4 py-3 text-sm transition-all duration-200",
    "text-gray-900 dark:text-white",
    "placeholder:text-gray-500 dark:placeholder:text-gray-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "hover:border-gray-300 dark:hover:border-gray-600",
    error 
      ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500" 
      : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-400",
    IconComponent && "pl-11",
    className
  );

  if (!label && !IconComponent) {
    return (
      <input
        type={type}
        className={inputStyles}
        ref={ref}
        {...props}
      />
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </label>
      )}
      <div className="relative">
        {IconComponent && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <IconComponent className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          className={inputStyles}
          ref={ref}
          {...props}
        />
      </div>
    </div>
  );
});

Input.displayName = "Input";

export { Input };
export default Input;
