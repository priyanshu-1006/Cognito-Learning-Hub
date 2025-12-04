import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Radio,
  Search,
  Calendar,
  Users,
  PlayCircle,
  ArrowLeft,
} from "lucide-react";

const LiveSessionSelector = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token =
        localStorage.getItem("quizwise-token") || localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

      // Fetch ALL quizzes without pagination limit
      const response = await fetch(
        `${apiUrl}/api/quizzes/my-quizzes?limit=1000`,
        {
          headers: {
            "x-auth-token": token,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch quizzes");

      const result = await response.json();
      console.log("📊 Live Session - API Response:", result);
      console.log(
        "📦 Total quizzes available:",
        result.data?.pagination?.total || result.pagination?.total
      );

      // Handle wrapped API response: { success: true, data: { quizzes: [...], total, page } }
      const data = result.data || result;
      const quizArray = data.quizzes || data;
      setQuizzes(Array.isArray(quizArray) ? quizArray : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
      setLoading(false);
    }
  };

  const handleStartLiveSession = (quizId) => {
    navigate(`/live/host/${quizId}`);
  };

  const filteredQuizzes = Array.isArray(quizzes)
    ? quizzes.filter((quiz) =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
                Start Live Session
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Select a quiz to host a live session
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
          </div>
        </motion.div>

        {/* Quiz Grid */}
        {filteredQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Radio className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {searchTerm ? "No quizzes found" : "No quizzes available"}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              {searchTerm
                ? "Try a different search term"
                : "Create a quiz first to start a live session"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/quiz-maker")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Create Quiz
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
              >
                {/* Quiz Title */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 line-clamp-2">
                  {quiz.title}
                </h3>

                {/* Quiz Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{quiz.timesTaken || 0} attempts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Category Badge */}
                {quiz.category && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                      {quiz.category}
                    </span>
                  </div>
                )}

                {/* Start Button */}
                <button
                  onClick={() => handleStartLiveSession(quiz._id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>Start Live Session</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white"
        >
          <h3 className="text-xl font-bold mb-2">How Live Sessions Work</h3>
          <ul className="space-y-2 text-purple-100">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span>Select a quiz from the list above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>
                You'll get a unique session code to share with students
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>Students join using the code and compete in real-time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <span>
                Track live results and see the leaderboard as they play
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveSessionSelector;
