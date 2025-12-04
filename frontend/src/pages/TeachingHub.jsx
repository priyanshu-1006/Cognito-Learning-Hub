import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  Radio,
  Users,
  Swords,
  GraduationCap,
  TrendingUp,
  Calendar,
  BookOpen,
  FileText,
  Award,
  Settings,
} from "lucide-react";

const TeachingHub = () => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    activeStudents: 0,
    liveSessions: 0,
    avgPerformance: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("quizwise-token");

        // Fetch quiz count
        const quizzesResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/quizzes/my-quizzes?limit=1`,
          {
            headers: { "x-auth-token": token },
          }
        );

        if (!quizzesResponse.ok) throw new Error("Failed to fetch quizzes");
        const quizzesData = await quizzesResponse.json();

        // Fetch real analytics stats
        const analyticsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/analytics/teacher/stats`,
          {
            headers: { "x-auth-token": token },
          }
        );

        let realStats = { totalAttempts: 0, uniqueStudents: 0 };
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          realStats =
            analyticsData.data?.stats || analyticsData.stats || realStats;
        }

        const totalQuizCount =
          quizzesData.data?.pagination?.total ||
          quizzesData.pagination?.total ||
          0;

        setStats({
          totalQuizzes: totalQuizCount,
          activeStudents: realStats.uniqueStudents || 0,
          liveSessions: 0, // TODO: Add live sessions endpoint
          avgPerformance: 0, // TODO: Add performance calculation
        });
      } catch (error) {
        console.error("Error fetching teaching hub stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      title: "My Dashboard",
      description:
        "View and manage all your quizzes, track student performance",
      icon: LayoutDashboard,
      link: "/teacher-dashboard",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Quiz Generator",
      description: "Create AI-powered quizzes with topic or file upload",
      icon: Sparkles,
      link: "/quiz-maker",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      title: "Session History",
      description: "View all past live quiz sessions and analytics",
      icon: Radio,
      link: "/live/history",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/10 to-red-500/10",
    },
    {
      title: "Video Meeting",
      description: "Start video conferences with your students",
      icon: Users,
      link: "/meeting/create",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
    },
    {
      title: "Duel Battles",
      description: "Create competitive 1v1 quiz battles for students",
      icon: Swords,
      link: "/duel",
      gradient: "from-red-500 to-rose-500",
      bgGradient: "from-red-500/10 to-rose-500/10",
    },
    {
      title: "Start Live Quiz",
      description: "Host real-time quiz sessions - select a quiz to begin",
      icon: Calendar,
      link: "/live/start",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-500/10 to-blue-500/10",
    },
  ];

  const statsDisplay = [
    {
      label: "Total Quizzes",
      value: loading ? "..." : stats.totalQuizzes.toString(),
      icon: BookOpen,
    },
    {
      label: "Active Students",
      value: loading ? "..." : stats.activeStudents.toString(),
      icon: Users,
    },
    {
      label: "Live Sessions",
      value: loading ? "..." : stats.liveSessions.toString(),
      icon: Radio,
    },
    {
      label: "Avg Performance",
      value: loading
        ? "..."
        : stats.avgPerformance
        ? `${stats.avgPerformance}%`
        : "N/A",
      icon: TrendingUp,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-900 dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-4">
            Teaching Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your complete teaching toolkit - Create quizzes, host live sessions,
            and track student progress
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {statsDisplay.map((stat, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-2xl p-6 border border-white/40 dark:border-gray-700/40 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Link to={feature.link}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/40 dark:border-gray-700/40 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden h-full"
                >
                  {/* Background gradient on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`inline-flex p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Arrow indicator */}
                    <div className="mt-4 flex items-center gap-2 text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text font-semibold group-hover:gap-3 transition-all duration-300">
                      <span>Get Started</span>
                      <svg
                        className="w-5 h-5 text-indigo-600 dark:text-indigo-400 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl -z-0" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl -z-0" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to create?</h3>
              <p className="text-indigo-100">
                Start with AI-powered quiz generation or host a live session
              </p>
            </div>
            <div className="flex gap-4">
              <Link to="/quiz-maker">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200 shadow-lg"
                >
                  Create Quiz
                </motion.button>
              </Link>
              <Link to="/teacher-dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-800 transition-colors duration-200 shadow-lg border border-white/20"
                >
                  Go to Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeachingHub;
