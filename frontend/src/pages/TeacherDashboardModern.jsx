import React, { useState, useEffect, useContext, useMemo, memo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  BookOpen,
  Users,
  Edit3,
  Trash2,
  Plus,
  Search,
  Radio,
  Share2,
  BarChart3,
  TrendingUp,
  Flame,
  Zap,
  ChevronRight,
  Check,
  Atom,
  Beaker,
  Calculator,
  Globe,
  Sparkles,
  AlertTriangle,
  Trophy,
  Star,
  Award,
  Target,
  Rocket,
  Crown,
  Medal,
  TrendingDown,
  Lock,
  Eye,
  Edit2,
  FileText,
} from "lucide-react";
import { useToast } from "../components/ui/Toast";

const CHART_DATA = [
  { name: "Mon", value: 45 },
  { name: "Tue", value: 52 },
  { name: "Wed", value: 48 },
  { name: "Thu", value: 61 },
  { name: "Fri", value: 55 },
  { name: "Sat", value: 38 },
  { name: "Sun", value: 42 },
];

// Stat Card - Ultra Modern Gamified Design with 3D Effects
const StatCard = ({ title, value, icon: Icon, trend, color = "violet" }) => {
  const colorClasses = {
    violet: {
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      bg: "from-violet-500/20 to-fuchsia-500/20",
      border: "border-violet-300/60",
      iconBg: "from-violet-600 to-fuchsia-600",
      text: "text-violet-600",
    },
    blue: {
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bg: "from-blue-500/20 to-teal-500/20",
      border: "border-blue-300/60",
      iconBg: "from-blue-600 to-teal-600",
      text: "text-blue-600",
    },
    emerald: {
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      bg: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-300/60",
      iconBg: "from-emerald-600 to-teal-600",
      text: "text-emerald-600",
    },
    orange: {
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      bg: "from-orange-500/20 to-yellow-500/20",
      border: "border-orange-300/60",
      iconBg: "from-orange-600 to-yellow-600",
      text: "text-orange-600",
    },
  };

  const colors = colorClasses[color] || colorClasses.violet;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="relative group bg-white/50 backdrop-blur-2xl rounded-3xl border-2 border-white/80 p-6 shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.4)] transition-all duration-500 overflow-hidden cursor-pointer"
    >
      {/* Animated background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.6 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center shadow-xl border-2 border-white/50`}
          >
            <Icon className="w-8 h-8 text-white drop-shadow-lg" />
          </motion.div>
          {trend && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 shadow-lg ${
                trend > 0
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-red-700 bg-red-50 border-red-200"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(trend)}%
            </motion.span>
          )}
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
          {title}
        </p>
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`text-3xl font-black bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent drop-shadow-sm`}
        >
          {value}
        </motion.p>
      </div>

      {/* Floating particles */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-violet-400 rounded-full opacity-60 animate-ping" />
      <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-fuchsia-400 rounded-full opacity-60 animate-pulse" />
    </motion.div>
  );
};

// Create Action Card with Ultra Vibrant Design and Animations
const CreateCard = () => (
  <Link to="/quiz-maker">
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="relative group h-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-2xl hover:shadow-[0_25px_70px_-15px_rgba(168,85,247,0.6)] transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-pointer border-2 border-white/20"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Sparkle effects */}
      <div className="absolute top-4 right-4 w-3 h-3 bg-white/60 rounded-full animate-ping" />
      <div className="absolute bottom-6 left-6 w-2 h-2 bg-white/50 rounded-full animate-pulse" />
      <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-bounce" />

      <div className="relative z-10">
        <motion.div
          whileHover={{ rotate: 180, scale: 1.2 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-6 border-2 border-white/40 shadow-xl"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </motion.div>
        <h3 className="text-2xl font-black mb-2 drop-shadow-lg">
          Create New Quiz
        </h3>
        <p className="text-sm text-white/90 font-semibold">
          Start building instantly ✨
        </p>
      </div>

      <motion.div
        className="flex items-center gap-2 text-sm font-bold self-end"
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span>Let's Go</span>
        <ChevronRight className="w-5 h-5" />
      </motion.div>

      {/* Glowing orb */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
    </motion.div>
  </Link>
);

// Quiz List Item - Modern Glassmorphism
const QuizItem = memo(({ quiz, onOpen, onDelete }) => {
  const Icon = quiz.icon;
  return (
    <motion.div
      onClick={onOpen}
      whileHover={{ scale: 1.01, x: 4 }}
      className="group relative flex items-center gap-3 p-4 bg-gradient-to-br from-white/80 to-violet-50/30 backdrop-blur-xl rounded-2xl cursor-pointer border-2 border-white/60 hover:border-violet-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Icon - Removed rotation animation */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-violet-500/50 relative z-10">
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Quiz Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-violet-700 transition-colors mb-1">
          {quiz.title}
        </h4>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <FileText className="w-3.5 h-3.5" />
            {quiz.questions} Q's
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Users className="w-3.5 h-3.5" />
            {quiz.timesTaken} Attempts
          </span>
        </div>
      </div>

      {/* XP Badge - Simplified animation */}
      <div className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg flex items-center gap-1.5 relative z-10">
        <Star className="w-3.5 h-3.5 text-white fill-white" />
        <span className="text-xs font-black text-white">
          +{quiz.questions * 10}
        </span>
      </div>

      {/* Action Buttons - Show on hover */}
      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
        <Link to={`/quiz/edit/${quiz.id}`} onClick={(e) => e.stopPropagation()}>
          <button className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-110">
            <Edit3 className="w-4 h-4" />
          </button>
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(quiz);
          }}
          className="p-2 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl shadow-lg hover:shadow-red-500/50 transition-all hover:scale-110"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
});

// Modern Glassmorphism Confirmation Modal
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          className="relative bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-8 max-w-md w-full"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm font-medium text-slate-600 mb-8">
                {message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white/60 backdrop-blur-sm rounded-xl transition-all duration-200 border border-slate-200/50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Component
export default function TeacherDashboardModern() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalTakes: 0,
    uniqueStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  // Gamification state
  const [teacherProfile, setTeacherProfile] = useState({
    level: 12,
    xp: 2340,
    xpToNextLevel: 3000,
    streak: 7,
  });

  // Redirect non-teachers
  if (!authLoading && user && user.role !== "Teacher") {
    return <Navigate to="/student-dashboard" replace />;
  }

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.role || user.role !== "Teacher") {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("quizwise-token");

        // Fetch quizzes
        const quizzesResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/quizzes/my-quizzes`,
          {
            headers: { "x-auth-token": token },
          }
        );

        if (!quizzesResponse.ok) throw new Error("Failed to fetch quizzes");
        const quizzesData = await quizzesResponse.json();

        console.log("📊 Teacher Dashboard Quizzes Response:", quizzesData);

        // Fetch REAL stats from analytics service
        const statsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/analytics/teacher/stats`,
          {
            headers: { "x-auth-token": token },
          }
        );

        let realStats = { totalAttempts: 0, uniqueStudents: 0 };
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log("📈 Real Stats from Analytics:", statsData);
          realStats = statsData.data?.stats || statsData.stats || realStats;
        } else {
          console.warn("Failed to fetch analytics stats, using defaults");
        }

        // Map real data to include icons based on subject
        // Handle new API format: { success: true, data: { quizzes: [...], pagination: {...} } }
        const quizArray =
          quizzesData.data?.quizzes || quizzesData.quizzes || [];
        const quizzesWithIcons = quizArray.map((quiz) => ({
          ...quiz,
          id: quiz._id,
          icon: getIconForSubject(quiz.subject || quiz.title),
          questions: Array.isArray(quiz.questions)
            ? quiz.questions.length
            : quiz.questions || 0,
          subject: quiz.subject || "General",
          timesTaken: quiz.timesTaken || 0,
        }));

        setQuizzes(quizzesWithIcons);

        // Use pagination total for accurate quiz count
        const totalQuizCount =
          quizzesData.data?.pagination?.total ||
          quizzesData.pagination?.total ||
          quizzesWithIcons.length;

        setStats({
          totalQuizzes: totalQuizCount,
          totalTakes: realStats.totalAttempts || 0,
          uniqueStudents: realStats.uniqueStudents || 0,
        });

        console.log("✅ Final Stats Set:", {
          totalQuizzes: totalQuizCount,
          totalTakes: realStats.totalAttempts,
          uniqueStudents: realStats.uniqueStudents,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        showError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const getIconForSubject = (subject) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes("physics") || subjectLower.includes("quantum"))
      return Atom;
    if (subjectLower.includes("chemistry") || subjectLower.includes("organic"))
      return Beaker;
    if (subjectLower.includes("math") || subjectLower.includes("calculus"))
      return Calculator;
    if (subjectLower.includes("geography") || subjectLower.includes("world"))
      return Globe;
    if (subjectLower.includes("ai") || subjectLower.includes("computer"))
      return Sparkles;
    return BookOpen;
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quizzes, searchTerm]);

  const handleDelete = async () => {
    if (!quizToDelete) return;

    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/quizzes/${quizToDelete.id}`,
        {
          method: "DELETE",
          headers: { "x-auth-token": token },
        }
      );

      if (!response.ok) throw new Error("Failed to delete quiz");

      setQuizzes(quizzes.filter((q) => q.id !== quizToDelete.id));
      success("Quiz deleted successfully");
    } catch (error) {
      showError("Failed to delete quiz");
    } finally {
      setShowDeleteModal(false);
      setQuizToDelete(null);
    }
  };

  const handleShare = (quizId) => {
    const link = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    success("Quiz link copied to clipboard!");
  };

  const handleOpenQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 flex items-center justify-center">
        <div className="text-center bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 px-8 py-6 shadow-xl">
          <div className="w-14 h-14 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-700">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const xpPercentage = (teacherProfile.xp / teacherProfile.xpToNextLevel) * 100;

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Main Content Area - Scrollable Grid */}
      <div className="flex-1 p-6 grid grid-cols-12 auto-rows-min gap-6 relative z-10">
        {/* Row 1: Header + Gamification */}
        <div className="col-span-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg">
              Teacher Hub
            </h1>
            <p className="text-lg font-bold text-slate-700 mt-3 tracking-wide">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {user?.name}
              </span>{" "}
              ✨
            </p>
          </div>
          {/* Gamification Section - Ultra Modern Design */}
          <div className="flex items-center gap-4">
            {/* Streak - Fire Animation */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-orange-50 to-red-50 backdrop-blur-2xl rounded-2xl border-2 border-orange-200/60 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg"
                >
                  <Flame className="w-6 h-6 text-white" />
                </motion.div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-xs font-black text-orange-600 uppercase tracking-wider">
                  Fire Streak
                </p>
                <p className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {teacherProfile.streak} <span className="text-sm">days</span>
                </p>
              </div>
            </motion.div>

            {/* Level Badge - Crown Effect */}
            <motion.div
              whileHover={{ scale: 1.08, y: -3 }}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl shadow-2xl hover:shadow-[0_15px_40px_-10px_rgba(168,85,247,0.6)] transition-all duration-300 border-2 border-white/30 relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                animate={{ x: [-100, 200] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 w-20 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/40 shadow-lg">
                  <Crown className="w-6 h-6 text-yellow-300" />
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-white/90 uppercase tracking-wider">
                  Level
                </p>
                <p className="text-2xl font-black text-white drop-shadow-lg">
                  {teacherProfile.level}
                </p>
              </div>
            </motion.div>

            {/* XP Progress Bar - Enhanced */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-6 py-4 bg-white/60 backdrop-blur-2xl rounded-2xl border-2 border-white/80 shadow-xl min-w-[260px] hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-violet-600 fill-violet-600" />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Experience
                  </p>
                </div>
                <p className="text-xs font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {teacherProfile.xp} / {teacherProfile.xpToNextLevel} XP
                </p>
              </div>
              <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-full shadow-lg relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: [-20, 100] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </motion.div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1.5 text-center">
                {Math.round(xpPercentage)}% to next level
              </p>
            </motion.div>

            {/* Achievements Badge */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: [0, 5, -5, 0] }}
              className="flex items-center gap-2 px-5 py-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <Trophy className="w-8 h-8 text-amber-600 fill-amber-500" />
              <div>
                <p className="text-xs font-black text-amber-700 uppercase">
                  Achievements
                </p>
                <p className="text-xl font-black text-amber-600">24/50</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Row 2: Stats & Create Action - Grid of 4 */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          <StatCard
            title="Total Quizzes"
            value={stats.totalQuizzes}
            icon={BookOpen}
            trend={12}
            color="violet"
          />
          <StatCard
            title="Unique Students"
            value={stats.uniqueStudents}
            icon={Users}
            trend={8}
            color="blue"
          />
          <StatCard
            title="Total Attempts"
            value={stats.totalTakes.toLocaleString()}
            icon={BarChart3}
            trend={23}
            color="emerald"
          />
          <CreateCard />
        </div>

        {/* Row 2.5: Achievement Badges Showcase - Compact */}
        <div className="col-span-12 bg-gradient-to-br from-white/60 to-violet-50/40 backdrop-blur-2xl rounded-2xl p-4 border-2 border-white/80 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg"
              >
                <Trophy className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Recent Achievements
                </h3>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-violet-500/50 transition-all"
            >
              View All
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {/* Achievement Badge 1 - Unlocked */}
            <motion.div
              whileHover={{ scale: 1.08, y: -3 }}
              className="group relative p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-300 shadow-md hover:shadow-lg cursor-pointer transition-all"
            >
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-md mb-2">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-black text-amber-700 text-center uppercase">
                First Launch
              </p>
            </motion.div>

            {/* Achievement Badge 2 - Unlocked */}
            <motion.div
              whileHover={{ scale: 1.08, y: -3 }}
              className="group relative p-3 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl border-2 border-violet-300 shadow-md hover:shadow-lg cursor-pointer transition-all"
            >
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md mb-2">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <p className="text-[10px] font-black text-violet-700 text-center uppercase">
                Rising Star
              </p>
            </motion.div>

            {/* Achievement Badge 3 - Unlocked */}
            <motion.div
              whileHover={{ scale: 1.08, y: -3 }}
              className="group relative p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300 shadow-md hover:shadow-lg cursor-pointer transition-all"
            >
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md mb-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-black text-blue-700 text-center uppercase">
                Crowd Pleaser
              </p>
            </motion.div>
          </div>
        </div>

        {/* Row 3: Content Split - Chart (Left) & Quizzes (Right) */}
        <div className="col-span-12 grid grid-cols-12 gap-6 min-h-[500px]">
          {/* Left Panel: Weekly Activity Chart - Enhanced */}
          <div className="col-span-8 bg-white/60 backdrop-blur-2xl rounded-2xl border-2 border-white/80 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg"
                >
                  <BarChart3 className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="text-xl font-black text-slate-800">
                  Weekly Performance
                </h3>
              </div>
              {/* Mini stats */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200/60 shadow-md">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                    Peak Day
                  </p>
                  <p className="text-sm font-black text-emerald-600">Friday</p>
                </div>
                <div className="px-4 py-2 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl border-2 border-violet-200/60 shadow-md">
                  <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">
                    Avg Daily
                  </p>
                  <p className="text-sm font-black text-violet-600">127</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    strokeWidth={0}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    strokeWidth={0}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Panel: Recent Quizzes - Scrollable List */}
          <div className="col-span-4 bg-white/60 backdrop-blur-2xl rounded-2xl border-2 border-white/80 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col max-h-[500px]">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg"
                >
                  <FileText className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="text-xl font-black text-slate-800">
                  Recent Quizzes
                </h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm bg-white/80 backdrop-blur-sm border-2 border-violet-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all w-36 placeholder:text-slate-400 font-medium shadow-sm"
                />
              </div>
            </div>
            {/* Scrollable Quiz List */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-2.5 scrollbar-thin scrollbar-thumb-violet-300 scrollbar-track-violet-50">
              {filteredQuizzes.length > 0 ? (
                filteredQuizzes.map((quiz) => (
                  <QuizItem
                    key={quiz.id}
                    quiz={quiz}
                    onOpen={() => navigate(`/quiz/${quiz.id}`)}
                    onDelete={(q) => {
                      setQuizToDelete(q);
                      setShowDeleteModal(true);
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-violet-200/50">
                    <BookOpen className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    {searchTerm
                      ? "No quizzes found"
                      : "Create your first quiz to get started"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuizToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message={`Are you sure you want to delete "${quizToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
