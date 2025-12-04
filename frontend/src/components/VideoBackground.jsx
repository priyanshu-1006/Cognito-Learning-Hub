import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import ParticleEffect from './ParticleEffect';

const VideoBackground = ({ 
  src, 
  poster, 
  className = "", 
  overlay = true, 
  controls = false,
  autoPlay = true,
  loop = true,
  muted = true,
  particles = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      if (autoPlay) {
        video.play().catch(console.error);
      }
    };

    const handleError = () => {
      setHasError(true);
      setIsLoaded(true);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Loading State */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Element */}
      {!hasError ? (
        <motion.video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover video-fade-in"
          poster={poster}
          loop={loop}
          muted={isMuted}
          playsInline
          preload="metadata"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <source src={src} type="video/mp4" />
          <p className="text-white">Your browser does not support the video tag.</p>
        </motion.video>
      ) : (
        // Fallback Image
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={poster}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Particle Effect */}
      {particles && isLoaded && (
        <ParticleEffect particleCount={15} className="opacity-30" />
      )}

      {/* Overlay */}
      {overlay && (
        <motion.div 
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-[0.5px] video-overlay-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        />
      )}

      {/* Video Controls */}
      {controls && isLoaded && !hasError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 flex gap-2"
        >
          <button
            onClick={togglePlay}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </motion.div>
      )}

      {/* Accessibility: Reduced Motion Support */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          video {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoBackground;
