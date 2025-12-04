import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing sound effects
 * Handles audio playback with volume control and preloading
 */
export const useSound = () => {
  const soundsRef = useRef({});
  const isMutedRef = useRef(false);
  const volumeRef = useRef(0.5); // Default 50% volume

  // Initialize sound files
  useEffect(() => {
    soundsRef.current = {
      correct: new Audio('/sounds/correct.mp3'),
      incorrect: new Audio('/sounds/incorrect.mp3'),
    };

    // Preload sounds
    Object.values(soundsRef.current).forEach(audio => {
      audio.load();
      audio.volume = volumeRef.current;
    });

    // Cleanup
    return () => {
      Object.values(soundsRef.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const play = useCallback((soundName) => {
    if (isMutedRef.current) return;
    
    const sound = soundsRef.current[soundName];
    if (sound) {
      // Reset to start if already playing
      sound.currentTime = 0;
      sound.volume = volumeRef.current;
      
      sound.play().catch(error => {
        console.warn(`Failed to play sound: ${soundName}`, error);
      });
    }
  }, []);

  const setVolume = useCallback((volume) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    volumeRef.current = newVolume;
    
    Object.values(soundsRef.current).forEach(audio => {
      audio.volume = newVolume;
    });
  }, []);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    return isMutedRef.current;
  }, []);

  const setMuted = useCallback((muted) => {
    isMutedRef.current = muted;
  }, []);

  return {
    play,
    setVolume,
    toggleMute,
    setMuted,
    isMuted: () => isMutedRef.current,
  };
};

export default useSound;
