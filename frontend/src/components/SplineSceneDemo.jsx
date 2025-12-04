import React from 'react';
import { SplineScene } from "./ui/SplineScene";
import { Card } from "./ui/Card";
import { Spotlight } from "./ui/Spotlight";
import { motion } from 'framer-motion';
 
export function SplineSceneDemo() {
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-indigo-500/20">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 p-8 relative z-10 flex flex-col justify-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Interactive 3D Experience
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg">
            Bring your learning to life with beautiful 3D scenes. Create immersive experiences 
            that capture attention and enhance your quiz platform.
          </p>
          <div className="mt-6 flex gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white font-semibold cursor-pointer"
            >
              Explore More
            </motion.div>
          </div>
        </motion.div>

        {/* Right content - 3D Scene */}
        <div className="flex-1 relative min-h-[300px] md:min-h-0">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  );
}
