import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import ReportModal from "../components/ReportModal";

// Icons
const BookOpenIcon = (props) => (
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
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const HelpCircleIcon = (props) => (
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
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
const UserIcon = (props) => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const SearchIcon = (props) => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const ClockIcon = (props) => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);
const TrendingUpIcon = (props) => (
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
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const StarIcon = (props) => (
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
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);
const ActivityIcon = (props) => (
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
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const PlayIcon = (props) => (
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
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const FlagIcon = (props) => (
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
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const activityVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/quizzes`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch quizzes.");
        }
        const data = await response.json();
        console.log("📚 QuizList API Response:", data);

        // Handle new API response format: { success: true, data: { quizzes: [...], pagination: {...} } }
        const quizArray = data.data?.quizzes || data.quizzes || data;
        const total =
          data.data?.pagination?.total ||
          data.pagination?.total ||
          quizArray.length;

        setQuizzes(quizArray);
        setTotalQuizzes(total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Filter and sort quizzes
  const filteredQuizzes = quizzes
    .filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "popular":
          return (b.timesTaken || 0) - (a.timesTaken || 0);
        case "questions":
          return b.questions.length - a.questions.length;
        default:
          return 0;
      }
    });

  // Generate activity feed data
  const recentActivity = quizzes.slice(0, 5).map((quiz, index) => ({
    id: quiz._id,
    type: "quiz_created",
    title: quiz.title,
    user: quiz.createdBy?.name || "Unknown",
    time: new Date(quiz.createdAt).toLocaleDateString(),
    questions: quiz.questions.length,
    difficulty: quiz.difficulty || "Medium",
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 flex items-center justify-center">
        <div className="text-center bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 px-8 py-6 shadow-xl">
          <div className="w-14 h-14 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-700">
            Loading quizzes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-red-200/50">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Error Loading Quizzes
          </h3>
          <p className="text-slate-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header Section - Gamified */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg">
              Explore Quizzes
            </h1>
            <p className="text-lg font-bold text-slate-700 mt-3 tracking-wide">
              Discover engaging quizzes and challenge yourself 🚀
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              className="px-5 py-3 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl shadow-xl border-2 border-white/30 relative overflow-hidden"
            >
              <motion.div
                animate={{ x: [-100, 200] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 w-20 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
              <div className="text-3xl font-black text-white relative z-10">
                {totalQuizzes || quizzes.length}
              </div>
              <div className="text-xs font-black text-white/90 uppercase tracking-wide relative z-10">
                Total Quizzes
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              className="px-5 py-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-xl border-2 border-emerald-200/60"
            >
              <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0)}
              </div>
              <div className="text-xs font-black text-emerald-700 uppercase tracking-wide">
                Questions
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Search and Filter - Enhanced Glassmorphism */}
        <motion.div
          className="bg-white/60 backdrop-blur-2xl rounded-2xl border-2 border-white/80 p-6 shadow-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-violet-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search quizzes or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-violet-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all placeholder:text-slate-400 font-medium text-slate-800 shadow-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-5 py-3.5 border-2 border-violet-200/50 rounded-xl bg-white/80 backdrop-blur-sm text-slate-800 font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none shadow-sm"
            >
              <option value="newest">⭐ Newest First</option>
              <option value="popular">🔥 Most Popular</option>
              <option value="questions">📚 Most Questions</option>
            </select>
          </div>
        </motion.div>

        {/* Featured Quiz or Empty State */}
        {filteredQuizzes.length === 0 ? (
          <motion.div
            className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 p-16 shadow-xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-violet-200/50">
              <BookOpenIcon className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              {searchTerm ? "No quizzes found" : "No quizzes available"}
            </h3>
            <p className="text-slate-600 font-medium">
              {searchTerm
                ? "Try searching for something else"
                : "Ask a teacher to create the first quiz"}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Featured Quiz Highlight - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 shadow-2xl text-white group"
            >
              {/* Animated Background Orbs */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-fuchsia-300/10 rounded-full blur-3xl"
              />

              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/40 shadow-lg"
                    >
                      <StarIcon className="w-7 h-7 text-yellow-300 fill-yellow-300" />
                    </motion.div>
                    <div>
                      <span className="text-sm font-black text-white/80 uppercase tracking-wider">
                        Featured Quiz
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold border border-white/30">
                          ⚡ Trending
                        </span>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-2xl font-black mb-4 drop-shadow-lg">
                    {filteredQuizzes[0].title}
                  </h4>
                  <p className="text-white/90 mb-6 text-lg font-semibold flex items-center gap-3">
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      {filteredQuizzes[0].createdBy?.name || "Unknown"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      <HelpCircleIcon className="w-5 h-5" />
                      {filteredQuizzes[0].questions.length} questions
                    </span>
                  </p>
                  <Link to={`/quiz/${filteredQuizzes[0]._id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white text-violet-600 hover:bg-white/95 rounded-xl font-black shadow-2xl hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)] transition-all duration-200 flex items-center gap-3 group/btn"
                    >
                      <PlayIcon className="w-6 h-6" />
                      Start Quiz Now
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Quiz Grid - Gamified Cards */}
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredQuizzes.slice(1).map((quiz, index) => (
                <motion.div
                  key={quiz._id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group h-full"
                >
                  <div className="relative h-full bg-gradient-to-br from-white/80 to-violet-50/40 backdrop-blur-2xl rounded-2xl border-2 border-white/80 hover:border-violet-300 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden">
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg group-hover:shadow-violet-500/50"
                        >
                          <BookOpenIcon className="h-7 w-7 text-white" />
                        </motion.div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 border-2 border-violet-300/50 shadow-md">
                            {quiz.difficulty || "Medium"}
                          </span>
                          {quiz.timesTaken > 10 && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-2 border-orange-300/50 shadow-md flex items-center gap-1">
                              🔥 Popular
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-violet-700 transition-colors line-clamp-2 min-h-[3.5rem]">
                        {quiz.title}
                      </h3>

                      <div className="space-y-2.5 mb-6 flex-grow">
                        <div className="flex items-center text-sm font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mr-3">
                            <HelpCircleIcon className="w-4 h-4 text-violet-600" />
                          </div>
                          <span className="text-slate-700">
                            {quiz.questions.length} Questions
                          </span>
                        </div>
                        <div className="flex items-center text-sm font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-slate-700 truncate">
                            {quiz.createdBy?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center text-sm font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                            <ClockIcon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-slate-700">
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* XP Badge */}
                      <div className="mb-4 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl shadow-lg flex items-center justify-center gap-2">
                        <StarIcon className="w-4 h-4 text-white fill-white" />
                        <span className="text-sm font-black text-white">
                          +{quiz.questions.length * 10} XP
                        </span>
                      </div>

                      <div className="flex gap-2 pt-4 border-t-2 border-white/80">
                        <Link
                          to={`/quiz/${quiz._id}/leaderboard`}
                          className="flex-1"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full px-3 py-2.5 text-sm font-black text-slate-700 hover:bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 border-2 border-slate-200 hover:border-violet-300 flex items-center justify-center gap-2 shadow-md"
                          >
                            <TrendingUpIcon className="w-4 h-4" />
                            Leaderboard
                          </motion.button>
                        </Link>
                        <Link to={`/quiz/${quiz._id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05, x: 3 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full px-3 py-2.5 text-sm font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-violet-500/50 flex items-center justify-center gap-2"
                          >
                            <PlayIcon className="w-4 h-4" />
                            Play
                          </motion.button>
                        </Link>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedQuiz(quiz);
                            setShowReportModal(true);
                          }}
                          className="px-3 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border-2 border-slate-200 hover:border-red-300 shadow-md"
                        >
                          <FlagIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* Report Modal */}
      {selectedQuiz && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedQuiz(null);
          }}
          quiz={selectedQuiz}
          questionText=""
        />
      )}
    </div>
  );
}
