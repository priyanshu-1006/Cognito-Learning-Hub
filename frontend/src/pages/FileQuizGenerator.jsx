import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import QuizDisplay from "../components/QuizDisplay";

// Icons
const FileUpIcon = (props) => (
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
    <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-3-4.1-5.6-4.1-1.6 0-3.1.8-4.1 2.1-1.5-1-3.4-.6-4.5 1.1-.9 1.4-1 3.3.3 4.9" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);
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
const FileIcon = (props) => (
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
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const BrainIcon = (props) => (
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
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7h0A2.5 2.5 0 0 1 7 4.5v0A2.5 2.5 0 0 1 9.5 2m0 13.5A2.5 2.5 0 0 1 12 18v0a2.5 2.5 0 0 1-2.5 2.5h0A2.5 2.5 0 0 1 7 18v0a2.5 2.5 0 0 1 2.5-2.5m5-11A2.5 2.5 0 0 1 17 4.5v0a2.5 2.5 0 0 1-2.5 2.5h0A2.5 2.5 0 0 1 12 4.5v0a2.5 2.5 0 0 1 2.5-2.5m0 13.5a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h0a2.5 2.5 0 0 1-2.5-2.5v0a2.5 2.5 0 0 1 2.5-2.5" />
    <path d="M12 7V4.5m0 18V18m-5-5.5a2.5 2.5 0 0 1 0-5m10 5a2.5 2.5 0 0 0 0-5" />
    <path d="M7 12h10" />
  </svg>
);
const FileTextIcon = (props) => (
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
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
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

export default function FileQuizGenerator() {
  const [file, setFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [useAdaptive, setUseAdaptive] = useState(false);
  const [adaptiveInfo, setAdaptiveInfo] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setGeneratedQuiz(null);
    setError("");

    const token = localStorage.getItem("quizwise-token");
    if (!token) {
      setError("You must be logged in to generate a quiz.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("quizFile", file);
    formData.append("numQuestions", numQuestions);
    formData.append("difficulty", difficulty);
    formData.append("useAdaptive", useAdaptive);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/generate-quiz-file`,
        {
          method: "POST",
          headers: { "x-auth-token": token },
          body: formData,
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Server responded with ${response.status}`
        );
      }

      // Direct synchronous response
      if (data.quiz?.questions) {
        setGeneratedQuiz(data.quiz.questions);
        if (data.adaptiveInfo) {
          setAdaptiveInfo(data.adaptiveInfo);
        }
        setIsLoading(false);
        setFile(null);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Failed to generate quiz from file:", err);
      setError(err.message);
      setGeneratedQuiz([]);
      setIsLoading(false);
      setFile(null);
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
    setFile(null);
    setError("");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
          Generate Quiz from File
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Let AI do the hard work. Upload a document, and get a quiz in seconds.
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
            {!file ? (
              <div>
                <label
                  htmlFor="file-upload"
                  className={`relative block w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ${
                    isDragOver
                      ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 scale-105"
                      : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileUpIcon className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="mb-2 text-md font-semibold text-gray-700 dark:text-gray-300">
                      <span className="text-indigo-600 dark:text-indigo-400">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supports PDF & TXT
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.txt"
                  />
                </label>
              </div>
            ) : (
              <div className="p-4 border border-green-300 bg-green-50 dark:bg-green-900 dark:border-green-700 rounded-lg flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-4">
                  <FileIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-sm font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}

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
                disabled={!file || isLoading}
              >
                <SparklesIcon className="h-5 w-5" />
                {isLoading ? "Processing..." : "Generate Quiz from File"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Information Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-start gap-4">
            <div className="bg-indigo-100 dark:bg-gray-700 p-3 rounded-full">
              <BrainIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                How It Works
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our AI analyzes the key information in your document to create
                relevant questions and answers, saving you hours of manual work.
              </p>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-start gap-4">
            <div className="bg-indigo-100 dark:bg-gray-700 p-3 rounded-full">
              <FileTextIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Supported Files
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For the best results, we currently support PDF (.pdf) and Plain
                Text (.txt) files. Image support is coming soon!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
