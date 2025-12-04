import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  ArrowLeft,
  Users,
  TrendingUp,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function Leaderboard() {
  const { quizId } = useParams();
  const { user } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("quizwise-token");

        // If no quizId, fetch global leaderboard (all users ranked by total score)
        if (!quizId) {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/leaderboard`,
            {
              headers: { "x-auth-token": token },
            }
          );

          if (!response.ok)
            throw new Error("Could not fetch global leaderboard.");

          const data = await response.json();
          setLeaderboard(data);
          setQuizTitle("Global Rankings");
        } else {
          // Fetch quiz-specific leaderboard
          const [leaderboardRes, quizRes] = await Promise.all([
            fetch(
              `${
                import.meta.env.VITE_API_URL
              }/api/quizzes/${quizId}/leaderboard`,
              { headers: { "x-auth-token": token } }
            ),
            fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}`, {
              headers: { "x-auth-token": token },
            }),
          ]);

          if (!leaderboardRes.ok || !quizRes.ok)
            throw new Error("Could not fetch leaderboard data.");

          const leaderboardData = await leaderboardRes.json();
          const quizData = await quizRes.json();

          setLeaderboard(leaderboardData);
          setQuizTitle(quizData.title);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [quizId]);

  const topThree = leaderboard.slice(0, 3);
  const restOfBoard = leaderboard.slice(3); // Show remaining students (up to 5 total)
  const rankColors = ["text-yellow-400", "text-gray-400", "text-yellow-600"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-yellow-200 dark:border-yellow-800 rounded-full animate-spin border-t-yellow-600 dark:border-t-yellow-400"></div>
            <Trophy className="absolute inset-0 w-20 h-20 text-yellow-500 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Loading Leaderboard
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Calculating rankings...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Could not load leaderboard
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Link to="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>

            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
              🏆 Leaderboard
            </h1>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {quizTitle}
              </p>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {leaderboard.length} {quizId ? "participants" : "students"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{quizId ? "Quiz rankings" : "Overall rankings"}</span>
              </div>
            </div>
          </motion.div>

          {leaderboard.length === 0 ? (
            <motion.div
              className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
              variants={itemVariants}
            >
              <p className="text-gray-500 dark:text-gray-400">
                {quizId
                  ? "No one has taken this quiz yet. Be the first!"
                  : "No students found."}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Podium for Top 3 */}
              <motion.div
                className="flex justify-center items-end gap-4 mb-12"
                variants={itemVariants}
              >
                {topThree[1] && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-400 dark:bg-gray-600 text-white text-3xl font-bold mx-auto flex items-center justify-center mb-2 border-4 border-gray-300 dark:border-gray-500">
                      {topThree[1].userName[0]}
                    </div>
                    <p className="font-bold text-gray-800 dark:text-white">
                      {topThree[1].userName}
                    </p>
                    <p className="font-bold text-lg text-gray-500 dark:text-gray-400">
                      {quizId
                        ? `${topThree[1].score} / ${topThree[1].totalQuestions}`
                        : `${topThree[1].score} pts`}
                    </p>
                    <div className="h-20 w-24 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-400">
                      2
                    </div>
                  </div>
                )}
                {topThree[0] && (
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-yellow-400 dark:bg-yellow-500 text-white text-4xl font-bold mx-auto flex items-center justify-center mb-2 border-4 border-yellow-300 dark:border-yellow-400">
                      {topThree[0].userName[0]}
                    </div>
                    <p className="font-bold text-gray-800 dark:text-white text-lg">
                      {topThree[0].userName}
                    </p>
                    <p className="font-bold text-xl text-yellow-500 dark:text-yellow-400">
                      {quizId
                        ? `${topThree[0].score} / ${topThree[0].totalQuestions}`
                        : `${topThree[0].score} pts`}
                    </p>
                    <div className="h-32 w-32 bg-yellow-300 dark:bg-yellow-600 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-4xl font-bold text-yellow-600 dark:text-yellow-300">
                      1
                    </div>
                  </div>
                )}
                {topThree[2] && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-yellow-600 dark:bg-yellow-800 text-white text-3xl font-bold mx-auto flex items-center justify-center mb-2 border-4 border-yellow-700 dark:border-yellow-900">
                      {topThree[2].userName[0]}
                    </div>
                    <p className="font-bold text-gray-800 dark:text-white">
                      {topThree[2].userName}
                    </p>
                    <p className="font-bold text-lg text-yellow-700 dark:text-yellow-500">
                      {quizId
                        ? `${topThree[2].score} / ${topThree[2].totalQuestions}`
                        : `${topThree[2].score} pts`}
                    </p>
                    <div className="h-16 w-24 bg-yellow-700 dark:bg-yellow-900 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-3xl font-bold text-yellow-800 dark:text-yellow-600">
                      3
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Rest of the Leaderboard */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                variants={itemVariants}
              >
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {restOfBoard.map((entry, index) => (
                    <li
                      key={index}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-8 text-center">
                          {index + 4}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center">
                          {entry.userName[0]}
                        </div>
                        <div className="text-md font-semibold text-gray-800 dark:text-white">
                          {entry.userName}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {quizId
                          ? `${entry.score} / ${entry.totalQuestions}`
                          : `${entry.score} pts`}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </>
          )}
          <motion.div className="text-center mt-8" variants={itemVariants}>
            <Link to="/quizzes">
              <Button className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3">
                Back to Quizzes
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
