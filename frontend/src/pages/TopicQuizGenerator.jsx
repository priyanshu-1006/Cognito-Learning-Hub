import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import QuizDisplay from "../components/QuizDisplay";

// Icons
const SparklesIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 21l1.9-4.8 4.8-1.9-4.8-1.9L12 3z" />
    <path d="M5 8h2" />
    <path d="M17 8h2" />
    <path d="M8 5v2" />
    <path d="M8 17v2" />
  </svg>
);
const LightbulbIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15.09 16.09a7 7 0 0 1-8.18-8.18C7.41 3.73 11.05 2 12 2a7.02 7.02 0 0 1 7 7c0 .95-.73 4.68-4.91 7.09z" />
    <path d="M12 20v-2" />
    <path d="M6.34 17.66l-1.41-1.41" />
    <path d="M17.66 6.34L19.07 4.93" />
  </svg>
);
const ClipboardCheckIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function TopicQuizGenerator() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [useAdaptive, setUseAdaptive] = useState(false);
  const [adaptiveInfo, setAdaptiveInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [error, setError] = useState("");

  // Fetch adaptive difficulty recommendation
  const fetchAdaptiveRecommendation = async () => {
    try {
      const token = localStorage.getItem("quizwise-token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/adaptive-difficulty`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAdaptiveInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch adaptive recommendation:", err);
    }
  };

  // Fetch recommendation when adaptive mode is enabled
  useEffect(() => {
    if (useAdaptive) {
      fetchAdaptiveRecommendation();
    }
  }, [useAdaptive]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedQuiz(null);
    setError("");

    try {
      const token = localStorage.getItem("quizwise-token");
      if (!token) throw new Error("You must be logged in to generate a quiz.");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/generate-quiz-topic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            topic,
            numQuestions,
            difficulty,
            useAdaptive,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || data.error || `HTTP error! status: ${response.status}`
        );

      // Direct synchronous response
      if (data.quiz?.questions) {
        setGeneratedQuiz(data.quiz.questions);
        if (data.adaptiveInfo) {
          setAdaptiveInfo(data.adaptiveInfo);
        }
        setIsLoading(false);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Failed to fetch quiz:", err);
      setError(err.message);
      setGeneratedQuiz([]);
      setIsLoading(false);
    }
  };

  const pollJobStatus = async (jobId, token) => {
    const maxAttempts = 60; // 2 minutes max (60 * 2 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/generate/status/${jobId}`,
          {
            headers: { "x-auth-token": token },
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to check job status");
        }

        const jobData = data.data || data;
        
        console.log('Job status response:', jobData);

        if (jobData.status === 'completed' && jobData.result) {
          // Job completed successfully
          console.log('Job result:', jobData.result);
          
          // Extract questions from result (worker returns { quiz: { questions: [...] } })
          let questions = null;
          if (jobData.result.quiz && jobData.result.quiz.questions) {
            questions = jobData.result.quiz.questions;
          } else if (jobData.result.questions) {
            // Legacy format
            questions = jobData.result.questions;
          }
          
          console.log('Extracted questions:', questions);
          
          if (questions && Array.isArray(questions) && questions.length > 0) {
            setGeneratedQuiz(questions);
            setIsLoading(false);
            return;
          } else {
            console.error('No valid questions found in result:', jobData.result);
            throw new Error("Quiz generated but no questions found. Please try again.");
          }
        } else if (jobData.status === 'failed') {
          throw new Error(jobData.error || "Quiz generation failed");
        } else if (attempts >= maxAttempts) {
          throw new Error("Quiz generation timed out. Please try again.");
        }

        // Still processing, poll again
        attempts++;
        setTimeout(poll, 2000); // Poll every 2 seconds
      } catch (err) {
        console.error("Job polling error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    poll();
  };

  const handleRetry = () => {
    setGeneratedQuiz(null);
    setError("");
    setTopic("");
  };

  if (isLoading) return <LoadingSpinner />;
  if (generatedQuiz)
    return <QuizDisplay quizData={generatedQuiz} onRetry={handleRetry} />;

  return (
    <motion.div
      className="max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-center mb-12" variants={itemVariants}>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Generate Quiz from Topic
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          The fastest way to create. Just provide a topic, and let our AI do the
          rest.
        </p>
      </motion.div>

      <motion.div
        className="grid lg:grid-cols-5 gap-12 items-start"
        variants={itemVariants}
      >
        {/* Left Column: Form */}
        <div className="lg:col-span-3 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Topic or Description
              </label>
              <textarea
                id="topic"
                name="topic"
                rows="5"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 'The basics of photosynthesis', 'Key events of World War II', or paste a few paragraphs of text..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Adaptive Mode Toggle */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full">
                    <svg
                      className="w-5 h-5 text-purple-600 dark:text-purple-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      Adaptive AI Difficulty
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      AI adjusts difficulty based on your performance
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseAdaptive(!useAdaptive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useAdaptive
                      ? "bg-purple-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useAdaptive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Show adaptive recommendation when enabled */}
              {useAdaptive && adaptiveInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Recommended:{" "}
                        <span className="text-purple-600 dark:text-purple-400">
                          {adaptiveInfo.suggestedDifficulty}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {adaptiveInfo.reason}
                      </p>
                      <div className="mt-2 flex gap-4 text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Avg Score:{" "}
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {adaptiveInfo.avgScore?.toFixed(1)}%
                          </span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Trend:{" "}
                          <span
                            className={`font-semibold ${
                              adaptiveInfo.trend === "improving"
                                ? "text-green-600 dark:text-green-400"
                                : adaptiveInfo.trend === "declining"
                                ? "text-red-600 dark:text-red-400"
                                : "text-yellow-600 dark:text-yellow-400"
                            }`}
                          >
                            {adaptiveInfo.trend}
                          </span>
                        </span>
                      </div>
                      {adaptiveInfo.weakAreas &&
                        adaptiveInfo.weakAreas.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Focus areas:{" "}
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {adaptiveInfo.weakAreas.slice(0, 3).join(", ")}
                              </span>
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="numQuestions"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Number of Questions
                </label>
                <input
                  type="number"
                  id="numQuestions"
                  name="numQuestions"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  min="1"
                  max="20"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Difficulty{" "}
                  {useAdaptive && (
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      (AI Override Enabled)
                    </span>
                  )}
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    useAdaptive ? "opacity-50" : ""
                  }`}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={useAdaptive}
                  required
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>Expert</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 p-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 disabled:bg-indigo-300 disabled:cursor-not-allowed transform hover:scale-105"
                disabled={!topic.trim() || isLoading}
              >
                <SparklesIcon className="h-5 w-5" />
                {isLoading ? "Generating..." : "Generate Quiz"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Information Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-start gap-4">
            <div className="bg-indigo-100 dark:bg-gray-700 p-3 rounded-full">
              <LightbulbIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Tips for Best Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Be specific! Instead of "History," try "The American Revolution
                from 1775 to 1783."
              </p>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-start gap-4">
            <div className="bg-indigo-100 dark:bg-gray-700 p-3 rounded-full">
              <ClipboardCheckIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Paste Content Directly
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can also paste up to 1,000 words of text directly into the
                description box for the AI to analyze.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
