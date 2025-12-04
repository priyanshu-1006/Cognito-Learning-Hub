import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Star, FileText } from "lucide-react";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function QuizMaker() {
  // --- NEW: State to hold the fetched animation data ---
  const [aiSparklesAnimation, setAiSparklesAnimation] = useState(null);
  const [fileUploadAnimation, setFileUploadAnimation] = useState(null);
  const [manualEditAnimation, setManualEditAnimation] = useState(null);

  // --- NEW: useEffect to fetch animations from the public folder ---
  useEffect(() => {
    const fetchAnimation = async (url, setter) => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setter(data);
      } catch (error) {
        console.error(`Failed to fetch animation from ${url}:`, error);
      }
    };

    fetchAnimation("/animations/ai-sparkles.json", setAiSparklesAnimation);
    fetchAnimation("/animations/file-upload.json", setFileUploadAnimation);
    fetchAnimation("/animations/manual-edit.json", setManualEditAnimation);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 relative overflow-hidden py-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <motion.div
        className="max-w-6xl mx-auto px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section - Gamified */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg mb-4">
            Quiz Studio
          </h1>
          <p className="text-xl font-bold text-slate-700 tracking-wide">
            Your creative hub for building{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              engaging
            </span>{" "}
            learning experiences ✨
          </p>
        </motion.div>

        {/* Video Section - Enhanced */}
        <motion.div className="mb-12 group" variants={itemVariants}>
          <div className="relative overflow-hidden rounded-3xl border-4 border-white/80 shadow-2xl hover:shadow-violet-500/30 transition-all duration-500">
            <video
              src="/studio-video.mp4"
              alt="An animated graphic showing a teacher creating a quiz with AI"
              className="rounded-2xl w-full"
              loop
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-transparent pointer-events-none" />
          </div>
        </motion.div>

        {/* Quiz Creation Options - Gamified Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={itemVariants}
        >
          {/* AI Topic Card */}
          <Link to="/quiz-maker/topic">
            <motion.div
              className="group relative cursor-pointer"
              whileHover={{ scale: 1.02, y: -8 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-500 overflow-hidden">
                {/* Animated orb */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-violet-400/30 to-purple-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                {/* Icon with rotation */}
                <motion.div
                  className="w-20 h-20 mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-24 h-24 relative">
                    {aiSparklesAnimation && (
                      <Lottie animationData={aiSparklesAnimation} loop={true} />
                    )}
                  </div>
                </motion.div>

                <h3 className="text-3xl font-black text-slate-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  AI Topic Quiz 🧠
                </h3>
                <p className="text-slate-600 font-semibold text-lg mb-4">
                  Let AI generate questions on any topic instantly
                </p>

                {/* XP Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-md border border-violet-300/50 rounded-full">
                  <Star className="w-4 h-4 text-violet-600 fill-violet-600" />
                  <span className="text-sm font-bold text-violet-700">
                    +50 XP per quiz
                  </span>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* AI File Upload Card */}
          <Link to="/quiz-maker/file">
            <motion.div
              className="group relative cursor-pointer"
              whileHover={{ scale: 1.02, y: -8 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 overflow-hidden">
                {/* Animated orb */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-cyan-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                {/* Icon with rotation */}
                <motion.div
                  className="w-20 h-20 mb-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-24 h-24 relative">
                    {fileUploadAnimation && (
                      <Lottie animationData={fileUploadAnimation} loop={true} />
                    )}
                  </div>
                </motion.div>

                <h3 className="text-3xl font-black text-slate-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  AI File Upload 📄
                </h3>
                <p className="text-slate-600 font-semibold text-lg mb-4">
                  Upload documents and AI creates the quiz
                </p>

                {/* XP Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-md border border-blue-300/50 rounded-full">
                  <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                  <span className="text-sm font-bold text-blue-700">
                    +75 XP per quiz
                  </span>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Manual Creation Card */}
          <Link to="/quiz-maker/manual">
            <motion.div
              className="group relative cursor-pointer"
              whileHover={{ scale: 1.02, y: -8 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-500 overflow-hidden">
                {/* Animated orb */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                {/* Icon with rotation */}
                <motion.div
                  className="w-20 h-20 mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-24 h-24 relative">
                    {manualEditAnimation && (
                      <Lottie animationData={manualEditAnimation} loop={true} />
                    )}
                  </div>
                </motion.div>

                <h3 className="text-3xl font-black text-slate-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  Manual Creation ✍️
                </h3>
                <p className="text-slate-600 font-semibold text-lg mb-4">
                  Craft each question with your expert touch
                </p>

                {/* XP Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-md border border-emerald-300/50 rounded-full">
                  <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">
                    +100 XP per quiz
                  </span>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* PDF Generator Card */}
          <Link to="/pdf-quiz-generator">
            <motion.div
              className="group relative cursor-pointer"
              whileHover={{ scale: 1.02, y: -8 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-500 overflow-hidden">
                {/* Animated orb */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                {/* Icon with rotation */}
                <motion.div
                  className="w-20 h-20 mb-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <FileText className="w-12 h-12 text-white" />
                </motion.div>

                <h3 className="text-3xl font-black text-slate-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  PDF Generator 📋
                </h3>
                <p className="text-slate-600 font-semibold text-lg mb-4">
                  Export your quizzes as printable PDFs
                </p>

                {/* XP Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-300/50 rounded-full">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span className="text-sm font-bold text-amber-700">
                    +25 XP per export
                  </span>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
