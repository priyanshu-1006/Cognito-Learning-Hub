import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Animation variants for consistent animations across the app
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Utility functions
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatScore = (score, total) => {
  const percentage = Math.round((score / total) * 100);
  return { percentage, score, total };
};

export const getScoreColor = (percentage) => {
  if (percentage >= 90) return 'text-green-600 dark:text-green-400';
  if (percentage >= 70) return 'text-blue-600 dark:text-blue-400';
  if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export const getScoreBadgeColor = (percentage) => {
  if (percentage >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
  if (percentage >= 70) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
  if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
};
