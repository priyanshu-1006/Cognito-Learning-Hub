import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Eye,
  Trash2,
  Download,
  Trophy,
  X,
  Medal,
  Award,
} from "lucide-react";

const LiveSessionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, completed, active
  const [selectedQuiz, setSelectedQuiz] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Use the same token key as AuthContext
        const token =
          localStorage.getItem("quizwise-token") ||
          localStorage.getItem("token");

        console.log("🔍 Debug Info:", {
          hasToken: !!token,
          tokenLength: token?.length,
          hasUser: !!user,
          userRole: user?.role,
          userName: user?.name,
        });

        if (!token) {
          console.warn("⚠️ No token found in localStorage");
          setError("Please login to view session history");
          setLoading(false);
          return;
        }

        console.log("📡 Fetching sessions from backend...");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const fullUrl = `${apiUrl}/api/live-sessions/teacher/history`;
        console.log("🌐 Request URL:", fullUrl);

        const response = await fetch(fullUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log(
          "📥 Response status:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ Fetch failed:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          throw new Error(
            errorData.message || `Failed to fetch sessions (${response.status})`
          );
        }

        const data = await response.json();
        console.log("✅ Sessions fetched successfully:", data);

        const sessionsList = data.data?.sessions || data.sessions || data || [];
        console.log("📊 Total sessions:", sessionsList.length);

        setSessions(sessionsList);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching sessions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    console.log("🚀 useEffect triggered, user:", user);

    if (user) {
      fetchSessions();
    } else {
      console.warn("⚠️ No user object, skipping fetch");
      setLoading(false);
    }
  }, [user]);

  const uniqueQuizzes = [
    ...new Map(
      sessions.map((s) => [s.quizId, { id: s.quizId, title: s.quizTitle }])
    ).values(),
  ];

  const filteredSessions = sessions
    .filter((session) => {
      if (filter === "all") return true;
      return session.status === filter;
    })
    .filter((s) => selectedQuiz === "all" || s.quizId === selectedQuiz)
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.endedAt) - new Date(a.endedAt);
      if (sortBy === "participants")
        return b.participantCount - a.participantCount;
      if (sortBy === "score") return b.averageScore - a.averageScore;
      return 0;
    });

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const fetchLeaderboard = async (sessionCode) => {
    try {
      const token =
        localStorage.getItem("quizwise-token") || localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

      const response = await fetch(
        `${apiUrl}/api/live-sessions/${sessionCode}/leaderboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      return data.data?.leaderboard || data.leaderboard || [];
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      return [];
    }
  };

  const handleViewLeaderboard = async (session) => {
    setSelectedSession(session);
    setShowLeaderboard(true);
    const leaderboard = await fetchLeaderboard(session.sessionCode);
    setLeaderboardData(leaderboard);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  const getStatusBadge = (status) => {
    const styles = {
      waiting:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      active:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      completed:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || styles.waiting
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4">
      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLeaderboard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      Session Leaderboard
                    </h2>
                    <p className="text-purple-100">
                      {selectedSession?.quizTitle}
                    </p>
                    <p className="text-sm text-purple-200">
                      Code: {selectedSession?.sessionCode}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Leaderboard Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {leaderboardData.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No participants in this session
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboardData.map((participant, index) => (
                      <motion.div
                        key={participant.userId || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-xl ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-400"
                            : index === 1
                            ? "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-2 border-gray-400"
                            : index === 2
                            ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-600"
                            : "bg-gray-50 dark:bg-gray-700/50"
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 dark:text-white">
                            {participant.username}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {participant.correctAnswers || 0} correct answers
                          </p>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {participant.score}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            points
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Live Session History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and analyze your past live quiz sessions
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {["all", "completed", "active", "waiting"].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                    filter === filterOption
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900"
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Quiz
            </label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Quizzes</option>
              {uniqueQuizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="participants">Most Participants</option>
              <option value="score">Highest Avg. Score</option>
            </select>
          </div>
        </div>

        {/* Sessions List */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {filteredSessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              No sessions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === "all"
                ? "You haven't hosted any live sessions yet."
                : `No ${filter} sessions found.`}
            </p>
            <button
              onClick={() => navigate("/teacher-dashboard")}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              Host a Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session._id || session.sessionCode || `session-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {session.quizTitle || "Untitled Quiz"}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">
                            {session.participantCount} participants
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm">
                            {formatDuration(session.duration)}
                          </span>
                        </div>
                        {session.averageScore !== undefined && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-sm">
                              Avg: {session.averageScore} | Top:{" "}
                              {session.topScore || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewLeaderboard(session)}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
                      >
                        <Trophy className="w-4 h-4" />
                        Leaderboard
                      </button>
                      <Link to={`/live-session-analytics/${session.sessionId}`}>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </Link>
                      <button
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                        title="Export session data"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessionHistory;
