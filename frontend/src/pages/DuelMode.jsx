import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { motion } from "framer-motion";
import { Swords, Trophy, Zap, Clock, Target, ArrowLeft } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

const DuelMode = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Use the same token key as AuthContext
        const token = localStorage.getItem("quizwise-token") || localStorage.getItem("token");
        
        if (!token) {
          setError("Please login to view quizzes");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/quizzes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch quizzes");
        const result = await response.json();
        
        // Handle wrapped response format
        const quizzes = result.data?.quizzes || result.quizzes || result.data || result;
        const quizArray = Array.isArray(quizzes) ? quizzes : [];
        
        // Filter quizzes that have questions
        const validQuizzes = quizArray.filter((q) => q.questions && q.questions.length > 0);
        setQuizzes(validQuizzes);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const startDuel = (quizId) => {
    navigate(`/duel/${quizId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please login to play 1v1 duels
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-purple-900 dark:to-red-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Swords className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              1v1 Duel Mode
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Challenge another student to a real-time quiz battle!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-4">
                <Target className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 dark:text-white">
                  Most Correct Wins
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get more answers right than your opponent
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl p-4">
                <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 dark:text-white">
                  Speed Matters
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In case of a tie, fastest time wins
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl p-4">
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 dark:text-white">
                  Live Matchmaking
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Auto-matched with available players
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Choose Your Quiz
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2">
                    {quiz.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.questions.length}Q</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {quiz.description || "No description available"}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold">
                    {quiz.category}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">
                    {quiz.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => startDuel(quiz._id)}
                  disabled={!isConnected}
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  <Swords className="w-5 h-5" />
                  {isConnected ? "Find Opponent" : "Connecting..."}
                </button>
              </motion.div>
            ))}
          </div>

          {quizzes.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No quizzes available for duels
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuelMode;
