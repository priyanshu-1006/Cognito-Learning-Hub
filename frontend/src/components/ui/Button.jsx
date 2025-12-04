import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useHaptic } from "../../hooks/useHaptic";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      children,
      loading = false,
      disabled = false,
      ripple = true,
      glow = false,
      gradient = false,
      haptic = true, // Enable haptic feedback by default
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState([]);
    const { haptic: hapticFeedback } = useHaptic();

    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group";

    const variants = {
      default:
        "bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 text-white hover:from-indigo-700 hover:to-indigo-800 dark:hover:from-indigo-600 dark:hover:to-indigo-700 focus:ring-indigo-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      destructive:
        "bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white hover:from-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      outline:
        "border-2 border-indigo-300 dark:border-indigo-500 bg-white/90 dark:bg-gray-800/90 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-500 dark:hover:border-indigo-400 focus:ring-indigo-500 backdrop-blur-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
      secondary:
        "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-gray-100 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 focus:ring-gray-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
      ghost:
        "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-gray-100 focus:ring-gray-500 backdrop-blur-sm transition-all duration-300",
      link: "text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline focus:ring-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-300",
      success:
        "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 focus:ring-green-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      warning:
        "bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400 text-white dark:text-gray-900 hover:from-yellow-600 hover:to-orange-600 dark:hover:from-yellow-500 dark:hover:to-orange-500 focus:ring-yellow-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      gradient:
        "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-500 dark:via-pink-500 dark:to-indigo-500 text-white hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-indigo-600 focus:ring-purple-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 animate-gradient bg-[length:300%_300%] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      hero: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 focus:ring-purple-500 shadow-2xl hover:shadow-[0_20px_40px_rgba(168,85,247,0.4)] dark:hover:shadow-[0_20px_40px_rgba(168,85,247,0.6)] transform hover:-translate-y-2 active:translate-y-0 animate-gradient bg-[length:400%_400%] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/40 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-500 after:delay-200",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-8 text-base font-semibold",
      xl: "h-14 px-10 text-lg font-bold",
      icon: "h-10 w-10",
    };

    const glowStyles = glow
      ? "shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
      : "";

    const createRipple = (e) => {
      if (!ripple || variant === "link" || variant === "ghost") return;

      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const newRipple = {
        x,
        y,
        size,
        id: Date.now(),
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) =>
          prev.filter((ripple) => ripple.id !== newRipple.id)
        );
      }, 600);
    };

    const LoadingSpinner = () => (
      <motion.div
        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    );

    const buttonVariants = {
      hover: {
        scale: variant !== "link" && variant !== "ghost" ? 1.03 : 1,
        y: variant !== "link" && variant !== "ghost" ? -2 : 0,
      },
      tap: {
        scale: variant !== "link" && variant !== "ghost" ? 0.97 : 1,
        y: 0,
      },
    };

    const handleClick = (e) => {
      createRipple(e);

      // Trigger haptic feedback on click
      if (haptic && !disabled && !loading && hapticFeedback) {
        if (variant === "destructive") {
          hapticFeedback.medium();
        } else {
          hapticFeedback.light();
        }
      }

      // Call original onClick
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glowStyles,
          className
        )}
        disabled={disabled || loading}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple Effects */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Content */}
        <span className="relative z-10 flex items-center">
          {loading && <LoadingSpinner />}
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export default Button;
