import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, Navigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  Award,
  CheckCircle,
  Target,
  ClipboardList,
  TrendingUp,
  Calendar,
  Flame,
  AlertTriangle,
  BookOpen,
  Clock,
  User,
  Eye,
  EyeOff,
  Video,
  Zap,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "../components/ui/PullToRefreshIndicator";
import { useHaptic } from "../hooks/useHaptic";

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

export default function Dashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [streakCount, setStreakCount] = useState(0);
  const [viewMode, setViewMode] = useState("overview"); // 'overview', 'detailed'
  const { success } = useHaptic();

  // Redirect teachers to teacher dashboard (only after auth is loaded)
  if (!authLoading && user?.role === "Teacher") {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/results/my-results`,
        {
          headers: { "x-auth-token": token },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch your results.");
      const data = await response.json();
      setResults(data);

      // Calculate streak (consecutive days with quiz attempts)
      const sortedResults = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedResults.length; i++) {
        const resultDate = new Date(sortedResults[i].createdAt);
        resultDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (currentDate - resultDate) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === streak) {
          streak++;
          currentDate = new Date(resultDate);
        } else if (daysDiff > streak) {
          break;
        }
      }
      setStreakCount(streak);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    success(); // Haptic feedback on refresh
    setLoading(true);
    await fetchResults();
  };

  const { isPulling, pullDistance, isRefreshing, pullProgress } =
    usePullToRefresh({
      onRefresh: handleRefresh,
      threshold: 80,
      enabled: !loading,
    });

  // --- Calculated Stats ---
  const quizzesCompleted = results.length;
  const averageScore =
    quizzesCompleted > 0
      ? results.reduce(
          (acc, r) => acc + (r.score / r.totalQuestions) * 100,
          0
        ) / quizzesCompleted
      : 0;

  const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
  const totalCorrect = results.reduce((acc, r) => acc + r.score, 0);
  const recentResults = results.slice(0, 5);

  // Performance categories
  const excellent = results.filter(
    (r) => r.score / r.totalQuestions >= 0.9
  ).length;
  const good = results.filter(
    (r) => r.score / r.totalQuestions >= 0.7 && r.score / r.totalQuestions < 0.9
  ).length;
  const needsWork = results.filter(
    (r) => r.score / r.totalQuestions < 0.7
  ).length;

  // --- Chart Data ---
  const chartData = results
    .slice(0, 10)
    .reverse()
    .map((r, index) => ({
      name: `Quiz ${index + 1}`,
      score: parseFloat(((r.score / r.totalQuestions) * 100).toFixed(1)),
      quizTitle: r.quiz?.title || "Deleted Quiz",
    }));

  // Performance distribution for pie chart
  const performanceData = [
    { name: "Excellent (90%+)", value: excellent, color: "#10b981" },
    { name: "Good (70-89%)", value: good, color: "#f59e0b" },
    { name: "Needs Work (<70%)", value: needsWork, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  // --- Achievements Logic ---
  const achievements = [];
  if (quizzesCompleted > 0)
    achievements.push({
      icon: Award,
      title: "First Quiz!",
      description: "You completed your first quiz.",
      color: "yellow",
      progress: 100,
    });
  if (quizzesCompleted >= 5)
    achievements.push({
      icon: Target,
      title: "Quiz Novice",
      description: "Completed 5 quizzes.",
      color: "blue",
      progress: 100,
    });
  if (quizzesCompleted >= 10)
    achievements.push({
      icon: CheckCircle,
      title: "Quiz Expert",
      description: "Completed 10 quizzes.",
      color: "green",
      progress: 100,
    });
  if (results.some((r) => r.score === r.totalQuestions))
    achievements.push({
      icon: Flame,
      title: "Perfectionist",
      description: "Achieved a perfect score!",
      color: "red",
      progress: 100,
    });
  if (streakCount >= 3)
    achievements.push({
      icon: Calendar,
      title: "Consistent Learner",
      description: `${streakCount} day learning streak!`,
      color: "purple",
      progress: 100,
    });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Loading Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Preparing your learning insights...
          </p>
        </motion.div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 max-w-md"
        >
          <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
            >
              Try Again
            </Button>
          </Card>
        </motion.div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 relative overflow-hidden py-8">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Header Section */}
        <motion.div
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div>
            <motion.h1
              className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Welcome back, {user?.name?.split(" ")[0] || "Student"}! 👋
            </motion.h1>
            <motion.p
              className="text-slate-700 dark:text-slate-300 font-semibold mt-3 text-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Here's your{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent font-bold">
                learning progress
              </span>{" "}
              overview ✨
            </motion.p>
          </div>

          <div className="flex gap-3">
            <Button
              variant={viewMode === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("overview")}
              className={
                viewMode === "overview"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  : ""
              }
            >
              <Eye className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={viewMode === "detailed" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("detailed")}
              className={
                viewMode === "detailed"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  : ""
              }
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Detailed
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {viewMode === "overview" ? (
            <motion.div
              key="overview"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Left Column: User Profile & Quick Stats */}
              <motion.div className="space-y-6" variants={itemVariants}>
                {/* Enhanced Profile Card with Level System */}
                <Card className="text-center p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl relative overflow-hidden">
                  {/* Decorative background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>

                  <div className="relative">
                    {/* Avatar with level ring */}
                    <div className="relative inline-block mb-6">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white text-4xl font-bold flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-300 relative z-10">
                        {user?.name?.[0] || "U"}
                      </div>
                      {/* Level ring animation */}
                      <svg
                        className="absolute inset-0 w-full h-full -rotate-90 transform scale-125"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${
                            (Math.min(quizzesCompleted, 20) / 20) * 283
                          } 283`}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Level badge */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                          Lv. {Math.floor(quizzesCompleted / 5) + 1}
                        </div>
                      </div>
                      {streakCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg animate-pulse z-20">
                          <Flame className="w-3 h-3" />
                          {streakCount}
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      {user?.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {user?.email}
                    </p>

                    {/* XP Progress bar */}
                    <div className="mt-4 mb-6">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>
                          Level {Math.floor(quizzesCompleted / 5) + 1}
                        </span>
                        <span>{quizzesCompleted % 5}/5 XP</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((quizzesCompleted % 5) / 5) * 100}%`,
                          }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-6 text-center">
                        <motion.div
                          className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 hover:scale-105 transition-transform duration-300"
                          whileHover={{ y: -5 }}
                        >
                          <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {quizzesCompleted}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Quizzes Taken
                          </p>
                        </motion.div>
                        <motion.div
                          className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 hover:scale-105 transition-transform duration-300"
                          whileHover={{ y: -5 }}
                        >
                          <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {averageScore.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Avg Score
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Learning Toolkit */}
                <Link to="/quick-actions">
                  <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 backdrop-blur-xl border border-yellow-200/50 dark:border-yellow-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-2">
                            Learning Toolkit 🚀
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Access all your learning tools
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <span className="text-xs font-semibold">View All</span>
                        <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </Link>

                {/* Achievements */}
                <Card className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Achievements
                  </h3>
                  {achievements.length > 0 ? (
                    <div className="space-y-3">
                      {achievements.slice(0, 3).map((ach, index) => {
                        const Icon = ach.icon;
                        return (
                          <motion.div
                            key={index}
                            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-700/80 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                          >
                            <div
                              className={`p-3 rounded-xl ${
                                ach.color === "yellow"
                                  ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                  : ach.color === "blue"
                                  ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                                  : ach.color === "green"
                                  ? "bg-gradient-to-br from-green-400 to-emerald-500"
                                  : ach.color === "red"
                                  ? "bg-gradient-to-br from-red-400 to-pink-500"
                                  : "bg-gradient-to-br from-purple-400 to-violet-500"
                              } shadow-lg transform hover:scale-110 hover:rotate-12 transition-transform duration-300`}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {ach.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {ach.description}
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          </motion.div>
                        );
                      })}
                      {achievements.length > 3 && (
                        <motion.div
                          className="text-center py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                            🎉 +{achievements.length - 3} more achievements
                            unlocked!
                          </p>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 animate-pulse" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Complete quizzes to unlock achievements!
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Right Column: Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Enhanced Stat Cards with better glassmorphism */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                  variants={itemVariants}
                >
                  <Card className="relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 blur-xl"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 p-3 rounded-xl shadow-lg">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Completed
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {quizzesCompleted}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 blur-xl"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-3 rounded-xl shadow-lg">
                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Avg Score
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {averageScore.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-20 blur-xl"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 p-3 rounded-xl shadow-lg">
                        <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Total Points
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                          {totalCorrect}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-20 blur-xl"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 p-3 rounded-xl shadow-lg">
                        <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Streak
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          {streakCount} 🔥
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Charts Row with enhanced glassmorphism */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Score Progression Chart */}
                  <motion.div variants={itemVariants}>
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Score Progression
                      </h3>
                      {chartData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 20,
                                left: -10,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(128, 128, 128, 0.2)"
                              />
                              <XAxis
                                dataKey="name"
                                tick={{ fill: "#9ca3af", fontSize: 12 }}
                              />
                              <YAxis
                                tick={{ fill: "#9ca3af", fontSize: 12 }}
                                unit="%"
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1f2937",
                                  border: "1px solid #4b5563",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                }}
                                labelStyle={{ color: "#d1d5db" }}
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#4f46e5"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#4f46e5" }}
                                activeDot={{ r: 6, fill: "#6366f1" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Take quizzes to see your progress!</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>

                  {/* Performance Distribution */}
                  <motion.div variants={itemVariants}>
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Performance Distribution
                      </h3>
                      {performanceData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={performanceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) =>
                                  `${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {performanceData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1f2937",
                                  border: "1px solid #4b5563",
                                  borderRadius: "8px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="mt-4 space-y-2">
                            {performanceData.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {item.name}: {item.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Complete more quizzes to analyze performance!</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </div>

                {/* Recent Results with enhanced design */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Recent Results
                      </h3>
                      <Link to="/quizzes">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:scale-105 transition-transform"
                        >
                          View All
                        </Button>
                      </Link>
                    </div>
                    {results.length === 0 ? (
                      <div className="text-center py-12">
                        <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No quizzes taken yet
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Start your learning journey today!
                        </p>
                        <Link to="/quizzes">
                          <Button>Browse Quizzes</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentResults.map((result, index) => (
                          <motion.div
                            key={result._id}
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-700/80 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg hover:scale-[1.01] backdrop-blur-sm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center shadow-lg">
                                <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {result.quiz?.title || "Deleted Quiz"}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(
                                    result.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white text-lg">
                                  {result.score}/{result.totalQuestions}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                                  {(
                                    (result.score / result.totalQuestions) *
                                    100
                                  ).toFixed(0)}
                                  %
                                </p>
                              </div>
                              <Badge
                                className="shadow-md"
                                variant={
                                  result.score / result.totalQuestions >= 0.9
                                    ? "default"
                                    : result.score / result.totalQuestions >=
                                      0.7
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {result.score / result.totalQuestions >= 0.9
                                  ? "🏆 Excellent"
                                  : result.score / result.totalQuestions >= 0.7
                                  ? "👍 Good"
                                  : "💪 Needs Work"}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detailed"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Detailed Results
                </h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Quiz Title
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Score
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Performance
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Date Taken
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {results.map((result) => (
                          <tr
                            key={result._id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                  <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {result.quiz?.title || "Deleted Quiz"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {result.score} / {result.totalQuestions}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {(
                                  (result.score / result.totalQuestions) *
                                  100
                                ).toFixed(0)}
                                %
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={
                                  result.score / result.totalQuestions >= 0.9
                                    ? "default"
                                    : result.score / result.totalQuestions >=
                                      0.7
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {result.score / result.totalQuestions >= 0.9
                                  ? "Excellent"
                                  : result.score / result.totalQuestions >= 0.7
                                  ? "Good"
                                  : "Needs Work"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(result.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link to={`/quiz/${result.quiz?._id}`}>
                                <Button variant="outline" size="sm">
                                  Play Again
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile scroll indicator */}
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2 sm:hidden">
                    ← Swipe to see more →
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
