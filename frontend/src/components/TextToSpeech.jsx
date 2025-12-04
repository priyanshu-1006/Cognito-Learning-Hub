import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Loader2, AlertCircle } from "lucide-react";

/**
 * TextToSpeech Component
 * Provides text-to-speech functionality using Web Speech API
 *
 * @param {string} text - Text to be spoken
 * @param {boolean} autoPlay - Auto-play on component mount
 * @param {string} lang - Language code (default: 'en-US')
 * @param {number} rate - Speech rate 0.1-10 (default: 0.9)
 * @param {number} pitch - Speech pitch 0-2 (default: 1)
 * @param {string} voice - Preferred voice name (optional)
 */
export default function TextToSpeech({
  text,
  autoPlay = false,
  lang = "en-US",
  rate = 0.9,
  pitch = 1,
  voice = null,
  className = "",
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const utteranceRef = useRef(null);

  // Check browser support and load voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setIsSupported(false);
      console.warn("Text-to-Speech not supported in this browser");
      return;
    }

    // Load available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && text && isSupported) {
      speak();
    }
  }, [text, autoPlay, isSupported]);

  const speak = () => {
    if (!text || !isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Set voice if specified
    if (voice && availableVoices.length > 0) {
      const selectedVoice = availableVoices.find((v) => v.name === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Use first English voice available
      const englishVoice = availableVoices.find((v) => v.lang.startsWith("en"));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed ${className}`}
        title="Text-to-Speech not supported in this browser"
      >
        <AlertCircle className="w-4 h-4" />
        <span className="hidden sm:inline">TTS Not Supported</span>
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {!isSpeaking ? (
        <button
          onClick={speak}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-all duration-200 border border-indigo-200 dark:border-indigo-800"
          title="Read question aloud"
        >
          <Volume2 className="w-4 h-4" />
          <span className="hidden sm:inline">Listen</span>
        </button>
      ) : (
        <div className="inline-flex items-center gap-2">
          <button
            onClick={stop}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all duration-200 border border-red-200 dark:border-red-800"
            title="Stop speaking"
          >
            <VolumeX className="w-4 h-4" />
            <span className="hidden sm:inline">Stop</span>
          </button>

          {/* Animated speaking indicator */}
          <div className="flex items-center gap-1">
            <div
              className="w-1 h-3 bg-indigo-500 animate-pulse rounded-full"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-1 h-4 bg-indigo-500 animate-pulse rounded-full"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-1 h-5 bg-indigo-500 animate-pulse rounded-full"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function SpeakerIcon({ text, size = "sm", className = "" }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = () => {
    if (!text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={isSpeaking ? stop : speak}
      className={`inline-flex items-center justify-center p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={isSpeaking ? "Stop speaking" : "Read aloud"}
    >
      {isSpeaking ? (
        <VolumeX
          className={`${sizeClasses[size]} text-red-500 animate-pulse`}
        />
      ) : (
        <Volume2
          className={`${sizeClasses[size]} text-gray-500 dark:text-gray-400`}
        />
      )}
    </button>
  );
}
