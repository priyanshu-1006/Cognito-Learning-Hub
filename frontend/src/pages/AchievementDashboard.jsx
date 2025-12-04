import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import {
  Trophy,
  Star,
  Award,
  Target,
  Flame,
  Crown,
  Medal,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  BookOpen,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Progress from "../components/ui/Progress";
import LoadingSpinner from "../components/LoadingSpinner";

const AchievementCard = ({ achievement, isUnlocked = false, progress = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02, y: -4 }}
    transition={{ duration: 0.3 }}
    className="group relative"
  >
    <div
      className={`absolute inset-0 rounded-2xl blur-lg transition-all duration-500 ${
        isUnlocked
          ? "bg-gradient-to-br from-yellow-400/30 to-orange-500/30 group-hover:blur-xl"
          : "bg-gradient-to-br from-violet-500/10 to-purple-500/10 group-hover:blur-md"
      }`}
    />
    <div
      className={`relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-300 backdrop-blur-2xl shadow-lg hover:shadow-2xl ${
        isUnlocked
          ? "border-yellow-400/60 bg-gradient-to-br from-yellow-50/80 via-orange-50/80 to-red-50/80 hover:shadow-yellow-500/30"
          : "border-white/60 bg-white/60 hover:border-violet-300/60 hover:shadow-violet-500/20"
      }`}
    >
      {/* Sparkle effect for unlocked achievements */}
      {isUnlocked && (
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div
          className={`relative p-3 rounded-2xl transition-all duration-300 ${
            isUnlocked
              ? "bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-600 dark:text-yellow-400 shadow-lg"
              : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
          }`}
        >
          {isUnlocked && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <span className="text-3xl relative z-10">{achievement.icon}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-bold text-lg ${
                isUnlocked
                  ? "text-yellow-800 dark:text-yellow-200"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {achievement.name}
            </h3>
            {isUnlocked && <Crown className="w-5 h-5 text-yellow-500" />}
          </div>
          <p
            className={`text-sm leading-relaxed ${
              isUnlocked
                ? "text-yellow-700 dark:text-yellow-300"
                : "text-gray-500 dark:text-gray-500"
            }`}
          >
            {achievement.description}
          </p>
        </div>
        {isUnlocked && (
          <motion.div
            className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
              +{achievement.points} XP
            </span>
          </motion.div>
        )}
      </div>

      {!isUnlocked && progress > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Progress
            </span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative">
            <Progress
              value={progress}
              className="h-3 bg-gray-200 dark:bg-gray-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Badge
          variant={
            achievement.rarity === "legendary"
              ? "destructive"
              : achievement.rarity === "epic"
              ? "default"
              : achievement.rarity === "rare"
              ? "secondary"
              : "outline"
          }
          className="font-semibold"
        >
          ✨ {achievement.rarity}
        </Badge>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {achievement.type}
        </span>
      </div>
    </div>
  </motion.div>
);

const StatCard = ({ icon, label, value, change, color = "blue" }) => {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-500 to-cyan-600",
      text: "text-blue-600",
    },
    yellow: {
      bg: "bg-gradient-to-br from-yellow-400 to-orange-500",
      text: "text-yellow-600",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-500 to-red-600",
      text: "text-orange-600",
    },
    green: {
      bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      text: "text-emerald-600",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
      <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                colorClasses[color]?.bg || colorClasses.blue.bg
              } shadow-lg`}
            >
              {React.cloneElement(icon, {
                className: "w-6 h-6 text-white",
              })}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">{label}</p>
              <p className="text-3xl font-black bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
                {value}
              </p>
            </div>
          </div>
          {change && (
            <motion.div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md ${
                change > 0
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  : "bg-gradient-to-r from-red-500 to-orange-600 text-white"
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-bold">
                {change > 0 ? "+" : ""}
                {change}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function AchievementDashboard() {
  const { user } = useContext(AuthContext);
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/stats`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setUserStats(data.stats);
      setRecentAchievements(data.recentAchievements);

      // Mock achievements data (in production, fetch from API)
      setAchievements([
        {
          id: 1,
          name: "First Steps",
          description: "Complete your first quiz",
          icon: "🎯",
          type: "quiz_completion",
          rarity: "common",
          points: 10,
          isUnlocked: data.stats.totalQuizzesTaken >= 1,
        },
        {
          id: 2,
          name: "Quiz Enthusiast",
          description: "Complete 10 quizzes",
          icon: "📚",
          type: "quiz_completion",
          rarity: "rare",
          points: 25,
          isUnlocked: data.stats.totalQuizzesTaken >= 10,
          progress: Math.min((data.stats.totalQuizzesTaken / 10) * 100, 100),
        },
        {
          id: 3,
          name: "Perfect Score",
          description: "Get 100% on any quiz",
          icon: "🏆",
          type: "score_achievement",
          rarity: "epic",
          points: 50,
          isUnlocked: false, // Would check from results
        },
        {
          id: 4,
          name: "Speed Demon",
          description: "Answer 5 questions in under 10 seconds each",
          icon: "⚡",
          type: "speed",
          rarity: "rare",
          points: 30,
          isUnlocked: false,
        },
        {
          id: 5,
          name: "Streak Master",
          description: "Maintain a 7-day learning streak",
          icon: "🔥",
          type: "streak",
          rarity: "epic",
          points: 40,
          isUnlocked: data.stats.longestStreak >= 7,
          progress: Math.min((data.stats.currentStreak / 7) * 100, 100),
        },
        {
          id: 6,
          name: "Knowledge Seeker",
          description: "Earn 1000 total points",
          icon: "⭐",
          type: "special",
          rarity: "legendary",
          points: 100,
          isUnlocked: data.stats.totalPoints >= 1000,
          progress: Math.min((data.stats.totalPoints / 1000) * 100, 100),
        },
      ]);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 relative overflow-hidden py-8 px-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl text-white shadow-lg"
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Trophy className="w-12 h-12" />
            </motion.div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg mb-4">
            Achievements & Stats
          </h1>
          <p className="text-xl font-bold text-slate-700 tracking-wide">
            Track your{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              learning journey
            </span>{" "}
            and unlock rewards ✨
          </p>
        </motion.div>

        {/* Level Progress */}
        <motion.div
          className="mb-8 group relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-500 overflow-hidden">
            {/* Animated orb */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-violet-400/30 to-purple-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Level {userStats?.level || 1}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {userStats?.experience || 0} XP
                    </p>
                  </div>
                </div>
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {unlockedAchievements.length} / {achievements.length}{" "}
                  Achievements
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress to Level {(userStats?.level || 1) + 1}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {(userStats?.experience || 0) % 100} / 100 XP
                  </span>
                </div>
                <Progress
                  value={(userStats?.experience || 0) % 100}
                  className="h-3"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<BookOpen className="w-6 h-6 text-blue-600" />}
            label="Quizzes Completed"
            value={userStats?.totalQuizzesTaken || 0}
            color="blue"
          />
          <StatCard
            icon={<Star className="w-6 h-6 text-yellow-600" />}
            label="Total Points"
            value={userStats?.totalPoints || 0}
            color="yellow"
          />
          <StatCard
            icon={<Flame className="w-6 h-6 text-orange-600" />}
            label="Current Streak"
            value={userStats?.currentStreak || 0}
            color="orange"
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6 text-green-600" />}
            label="Average Score"
            value={`${userStats?.averageScore || 0}%`}
            color="green"
          />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl p-2 shadow-lg">
            <nav className="flex gap-2">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: <BarChart3 className="w-5 h-5" />,
                },
                {
                  id: "unlocked",
                  label: "Unlocked",
                  icon: <Trophy className="w-5 h-5" />,
                },
                {
                  id: "locked",
                  label: "Locked",
                  icon: <Target className="w-5 h-5" />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg scale-105"
                      : "text-slate-700 hover:bg-white/60 hover:scale-105"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === "unlocked" && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-white/80 text-violet-700 font-bold"
                    >
                      {unlockedAchievements.length}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Recent Achievements */}
              {recentAchievements.length > 0 ? (
                <motion.div
                  className="group relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
                  <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-500">
                    <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                      <Award className="w-6 h-6 text-yellow-500" />
                      Recent Achievements
                    </h3>
                    <div className="space-y-3">
                      {recentAchievements.map((achievement) => (
                        <div
                          key={achievement._id}
                          className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 backdrop-blur-md rounded-xl border-2 border-yellow-200/50 shadow-md"
                        >
                          <span className="text-3xl">🏆</span>
                          <div className="flex-1">
                            <h4 className="font-black text-slate-900">
                              {achievement.achievement.name}
                            </h4>
                            <p className="text-sm font-semibold text-slate-600">
                              Unlocked{" "}
                              {new Date(
                                achievement.unlockedAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-black">
                            +{achievement.achievement.points} XP
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="group relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl blur-lg" />
                  <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl p-8 shadow-lg text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-violet-200/50">
                      <Trophy className="w-10 h-10 text-violet-400" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">
                      No Achievements Yet
                    </h4>
                    <p className="text-slate-600 font-semibold">
                      Complete quizzes to unlock your first achievement! 🎯
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  className="group relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
                  <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500">
                    <h3 className="text-xl font-black text-slate-900 mb-6">
                      Progress Overview
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-slate-600">
                            Achievement Progress
                          </span>
                          <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            {Math.round(
                              (unlockedAchievements.length /
                                achievements.length) *
                                100
                            ) || 0}
                            %
                          </span>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                (unlockedAchievements.length /
                                  achievements.length) *
                                  100 || 0
                              }%`,
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-xl border-2 border-orange-200/50">
                        <span className="text-sm font-bold text-slate-700">
                          Learning Streak
                        </span>
                        <div className="flex items-center gap-2">
                          <Flame className="w-5 h-5 text-orange-500" />
                          <span className="text-xl font-black text-orange-600">
                            {userStats?.currentStreak || 0} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="group relative"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />
                  <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
                    <h3 className="text-xl font-black text-slate-900 mb-6">
                      Time Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 rounded-xl border-2 border-blue-200/50">
                        <span className="text-sm font-bold text-slate-700">
                          Time Spent Learning
                        </span>
                        <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {userStats?.totalTimeSpent || 0}m
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl border-2 border-emerald-200/50">
                        <span className="text-sm font-bold text-slate-700">
                          Last Quiz
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          {userStats?.lastQuizDate
                            ? new Date(
                                userStats.lastQuizDate
                              ).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "unlocked" && (
            <motion.div
              key="unlocked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlockedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={true}
                  />
                ))}
              </div>
              {unlockedAchievements.length === 0 && (
                <motion.div
                  className="group relative col-span-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl blur-lg" />
                  <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl p-12 shadow-lg text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-violet-200/50">
                      <Trophy className="w-12 h-12 text-violet-400" />
                    </div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-violet-700 bg-clip-text text-transparent mb-3">
                      No achievements unlocked yet
                    </h3>
                    <p className="text-slate-600 font-semibold text-lg">
                      Start taking quizzes to unlock your first achievement! 🚀
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={false}
                    progress={achievement.progress}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
