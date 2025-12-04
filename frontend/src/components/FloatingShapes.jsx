import React from "react";
import { motion } from "framer-motion";

const FloatingShapes = () => {
  const shapes = [
    {
      id: 1,
      type: "circle",
      size: "w-32 h-32",
      color: "bg-indigo-400/10 dark:bg-indigo-600/10",
      position: "top-20 left-10",
      duration: 20,
      delay: 0,
    },
    {
      id: 2,
      type: "square",
      size: "w-24 h-24",
      color: "bg-purple-400/10 dark:bg-purple-600/10",
      position: "top-40 right-20",
      duration: 25,
      delay: 2,
    },
    {
      id: 3,
      type: "circle",
      size: "w-40 h-40",
      color: "bg-pink-400/10 dark:bg-pink-600/10",
      position: "bottom-32 left-1/4",
      duration: 30,
      delay: 4,
    },
    {
      id: 4,
      type: "triangle",
      size: "w-28 h-28",
      color: "border-indigo-400/20 dark:border-indigo-600/20",
      position: "bottom-20 right-1/3",
      duration: 22,
      delay: 1,
    },
    {
      id: 5,
      type: "square",
      size: "w-20 h-20",
      color: "bg-purple-400/10 dark:bg-purple-600/10",
      position: "top-1/2 left-20",
      duration: 18,
      delay: 3,
    },
  ];

  const renderShape = (shape) => {
    const baseClasses = `absolute ${shape.position} ${shape.size} ${shape.color}`;
    const animationProps = {
      animate: {
        y: [0, -30, 0],
        x: [0, 15, 0],
        rotate: [0, 180, 360],
        opacity: [0.3, 0.6, 0.3],
      },
      transition: {
        duration: shape.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: shape.delay,
      },
    };

    switch (shape.type) {
      case "circle":
        return (
          <motion.div
            key={shape.id}
            className={`${baseClasses} rounded-full blur-xl`}
            {...animationProps}
          />
        );

      case "square":
        return (
          <motion.div
            key={shape.id}
            className={`${baseClasses} rounded-2xl blur-xl`}
            {...animationProps}
          />
        );

      case "triangle":
        return (
          <motion.div
            key={shape.id}
            className={`${baseClasses} border-4 rotate-45 blur-xl`}
            style={{ borderRadius: "20%" }}
            {...animationProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {shapes.map(renderShape)}
    </div>
  );
};

export default FloatingShapes;
