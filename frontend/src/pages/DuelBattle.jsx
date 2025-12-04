import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Trophy,
  Zap,
  Clock,
  Target,
  User,
  X,
  Check,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import Confetti from "react-confetti";

const DuelBattle = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // DEBUG: Log user object on component mount
  useEffect(() => {
    console.log("🔍 DuelBattle mounted - User object:", user);
    console.log("🔍 User properties:", {
      hasUser: !!user,
      id: user?.id,
      _id: user?._id,
      name: user?.name,
      role: user?.role,
      allKeys: user ? Object.keys(user) : [],
    });

    // Check localStorage token
    const token = localStorage.getItem("quizwise-token");
    if (token) {
      console.log("🔍 Token exists in localStorage");
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        console.log("🔍 Decoded token payload:", decoded);
      } catch (e) {
        console.error("❌ Failed to decode token:", e);
      }
    } else {
      console.error("❌ No token in localStorage!");
    }
  }, []);

  const [matchState, setMatchState] = useState("searching"); // searching, waiting, ready, active, ended
  const [matchId, setMatchId] = useState(null);
  const [role, setRole] = useState(null); // player1 or player2
  const [opponent, setOpponent] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const [myScore, setMyScore] = useState({ score: 0, correct: 0, time: 0 });
  const [opponentScore, setOpponentScore] = useState({
    score: 0,
    correct: 0,
    time: 0,
  });

  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  const questionStartTime = useRef(null);
  const timerInterval = useRef(null);

  // Socket event listeners - SETUP FIRST before emitting any events
  useEffect(() => {
    if (!socket) return;

    console.log("🔌 Setting up duel socket event listeners");

    // Handle disconnect - clear match state
    const handleDisconnect = () => {
      console.log("🔌 Socket disconnected - clearing duel match state");
      setMatchState("searching");
      setMatchId(null);
      setRole(null);
      setOpponent(null);
    };
    socket.on("disconnect", handleDisconnect);

    socket.on("match-found", (data) => {
      console.log("🎮 Match found event received:", {
        matchId: data.matchId,
        hasQuiz: !!data.quiz,
        hasOpponent: !!data.opponent,
        currentMatchId: matchId,
        currentState: matchState,
      });

      // CRITICAL: Update matchId from the event data
      setMatchId(data.matchId);
      setQuiz(data.quiz);

      const userId = user?._id || user?.id || user?.userId;

      // Determine role and opponent based on userId
      if (
        data.opponent.player1.userId === userId ||
        data.opponent.player1.userId.toString() === userId.toString()
      ) {
        setRole("player1");
        setOpponent(data.opponent.player2);
        console.log("✅ I am Player 1, opponent is Player 2");
      } else {
        setRole("player2");
        setOpponent(data.opponent.player1);
        console.log("✅ I am Player 2, opponent is Player 1");
      }

      setMatchState("ready");
      console.log("✅ Match synchronized - Ready to battle!", {
        matchId: data.matchId,
        myRole: data.opponent.player1.userId === userId ? "player1" : "player2",
        opponentName:
          data.opponent.player1.userId === userId
            ? data.opponent.player2.username
            : data.opponent.player1.username,
      });
    });

    socket.on("player-ready", (data) => {
      const userId = user?._id || user?.id || user?.userId;
      console.log("✅ Player ready event received:", {
        readyUserId: data.userId,
        myUserId: userId,
        isMe:
          data.userId === userId ||
          data.userId.toString() === userId.toString(),
      });
    });

    socket.on("duel-started", (data) => {
      console.log("🎯 Duel started! Question data:", data.currentQuestion);
      setCurrentQuestion(data.currentQuestion);
      setQuestionIndex(data.currentQuestion.index);
      setTimeLeft(data.currentQuestion.timeLimit);
      setMatchState("active");
      questionStartTime.current = Date.now();
      setHasAnswered(false);
      setSelectedAnswer(null);
    });

    socket.on("next-question", (data) => {
      console.log("➡️ Next question");
      setCurrentQuestion(data.currentQuestion);
      setQuestionIndex(data.currentQuestion.index);
      setTimeLeft(data.currentQuestion.timeLimit);
      questionStartTime.current = Date.now();
      setHasAnswered(false);
      setSelectedAnswer(null);
      setWaitingForOpponent(false); // Reset waiting state
    });

    socket.on("player-completed", (data) => {
      console.log("✅ You finished! Waiting for opponent...");
      setWaitingForOpponent(true);
    });

    socket.on("duel-score-update", (data) => {
      console.log("📊 Live score update:", data);
      const userId = user?._id || user?.id || user?.userId;

      // Update both players' scores - convert ObjectIds to strings for comparison
      const myData =
        data.player1.userId.toString() === userId.toString()
          ? data.player1
          : data.player2;
      const oppData =
        data.player1.userId.toString() === userId.toString()
          ? data.player2
          : data.player1;

      console.log(
        "📊 My score:",
        myData.score,
        "Opponent score:",
        oppData.score
      );

      setMyScore((prev) => ({
        score: myData.score,
        correct: myData.correctAnswers,
        time: prev.time, // Keep accumulated time
      }));

      setOpponentScore({
        score: oppData.score,
        correct: oppData.correctAnswers,
        time: 0, // Don't show opponent's time during battle
      });
    });

    socket.on("duel-ended", (data) => {
      console.log("🏁 Duel ended:", data);
      const userId = user?._id || user?.id || user?.userId;
      const myData =
        data.finalScores.player1.userId === userId
          ? data.finalScores.player1
          : data.finalScores.player2;
      const oppData =
        data.finalScores.player1.userId === userId
          ? data.finalScores.player2
          : data.finalScores.player1;

      // Map backend fields to frontend state
      setMyScore({
        score: myData.score,
        correct: myData.correctAnswers,
        time: myData.totalTime || 0,
      });
      setOpponentScore({
        score: oppData.score,
        correct: oppData.correctAnswers,
        time: oppData.totalTime || 0,
      });
      setWinner(data.winner);
      setMatchState("ended");

      console.log(
        "📊 Final scores - Me:",
        {
          score: myData.score,
          correct: myData.correctAnswers,
          time: myData.totalTime,
        },
        "Opponent:",
        {
          score: oppData.score,
          correct: oppData.correctAnswers,
          time: oppData.totalTime,
        }
      );

      if (data.winner === userId) {
        setShowConfetti(true);
      }
    });

    socket.on("opponent-disconnected", (data) => {
      console.log("🚪 Opponent disconnected");
      setWinner(data.winner);
      setMatchState("ended");

      const userId = user?._id || user?.id || user?.userId;
      if (data.winner === userId) {
        setShowConfetti(true);
      }
    });

    return () => {
      console.log("🧹 Cleaning up duel socket listeners");
      socket.off("disconnect", handleDisconnect);
      socket.off("match-found");
      socket.off("player-ready");
      socket.off("duel-started");
      socket.off("next-question");
      socket.off("player-completed");
      socket.off("duel-score-update");
      socket.off("duel-ended");
      socket.off("opponent-disconnected");
    };
  }, [socket, user, navigate]);

  // Find match - EMIT AFTER listeners are set up (ONLY ONCE)
  // Use ref to track if we've already requested a match
  const matchRequestedRef = useRef(false);

  useEffect(() => {
    if (!socket || !isConnected || !user || !quizId) return;

    // Prevent duplicate match requests (React Strict Mode causes double mount)
    if (matchRequestedRef.current || matchId) {
      console.log(
        "⚠️ Match already requested or in progress:",
        matchId || "(pending)",
        "- skipping duplicate request"
      );
      return;
    }

    console.log("🔍 Searching for duel opponent...");
    console.log("🔍 DEBUG - User object before find-match:", user);

    const userId = user?._id || user?.id || user?.userId;
    if (!userId) {
      console.error("❌ Cannot start duel - User ID not found!");
      alert("Please log in to play duels");
      navigate("/login");
      return;
    }

    // Mark as requested to prevent duplicates
    matchRequestedRef.current = true;

    socket.emit(
      "find-duel-match",
      {
        quizId,
        userId,
        username: user.name,
        avatar: user.profilePicture,
      },
      (response) => {
        if (response.success) {
          setMatchId(response.matchId);
          setRole(response.role);

          if (response.waiting) {
            setMatchState("waiting");
            console.log("⏳ Waiting for opponent... (no opponent yet)");
          } else {
            // Only set to matched if we got opponent info
            setMatchState("matched");
            console.log("✅ Opponent found! Moving to ready state");
          }
        } else {
          console.error("❌ Failed to find match:", response.error);
          alert("Failed to find match: " + response.error);
          matchRequestedRef.current = false; // Reset on error
          navigate("/duel");
        }
      }
    );
  }, [socket, isConnected, user, quizId, navigate, matchId]);

  // Cleanup on unmount - cancel pending matches
  // Use ref to capture current values to avoid stale closures
  const matchStateRef = useRef(matchState);
  const matchIdRef = useRef(matchId);

  useEffect(() => {
    matchStateRef.current = matchState;
    matchIdRef.current = matchId;
  }, [matchState, matchId]);

  useEffect(() => {
    return () => {
      // Only cancel if we're truly unmounting (not React Strict Mode remount)
      // Check after a small delay to distinguish unmount from remount
      setTimeout(() => {
        const currentMatchId = matchIdRef.current;
        const currentState = matchStateRef.current;

        if (
          currentMatchId &&
          (currentState === "waiting" || currentState === "searching")
        ) {
          console.log(
            "🧹 Component unmounting - canceling match:",
            currentMatchId
          );
          socket?.emit("cancel-duel", { matchId: currentMatchId });
        }
      }, 100);
    };
  }, [socket]);

  // Timer
  useEffect(() => {
    if (matchState === "active" && !hasAnswered) {
      timerInterval.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            // Auto-submit empty answer
            handleSubmitAnswer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerInterval.current);
    }
  }, [matchState, hasAnswered]);

  const handleReady = () => {
    console.log("🔍 DEBUG - Full user object:", user);
    console.log("🔍 DEBUG - user._id:", user?._id);
    console.log("🔍 DEBUG - user.id:", user?.id);

    const userId = user?._id || user?.id || user?.userId;

    if (!userId) {
      console.error("❌ ERROR: userId is undefined! User object:", user);
      alert("Error: User ID not found. Please log in again.");
      return;
    }

    console.log("🎯 Sending duel-ready:", { matchId, userId });

    socket.emit(
      "duel-ready",
      {
        matchId,
        userId,
      },
      (response) => {
        console.log("📥 duel-ready response:", response);
        if (response.success) {
          console.log("✅ Marked as ready - waiting for opponent");
        } else {
          console.error("❌ Failed to mark ready:", response.error);
          alert("Failed to mark ready: " + response.error);
        }
      }
    );
  };

  const handleSubmitAnswer = (answer) => {
    if (hasAnswered) return;

    const userId = user?._id || user?.id || user?.userId;
    if (!userId) {
      console.error("❌ Cannot submit answer - User ID not found!");
      return;
    }

    const timeSpent = Math.floor(
      (Date.now() - questionStartTime.current) / 1000
    );
    setHasAnswered(true);
    setSelectedAnswer(answer);
    clearInterval(timerInterval.current);

    socket.emit(
      "duel-answer",
      {
        matchId,
        userId,
        questionIndex,
        answer,
        timeSpent,
      },
      (response) => {
        if (response.success) {
          console.log(`${response.isCorrect ? "✅" : "❌"} Answer submitted`);
          // Score will be updated via "duel-score-update" event
          // Just update time spent
          setMyScore((prev) => ({
            ...prev,
            time: prev.time + timeSpent,
          }));
        }
      }
    );
  };

  const cancelMatch = () => {
    if (matchId) {
      socket.emit("cancel-duel", { matchId });
    }
    navigate("/duel");
  };

  // Searching state
  if (matchState === "searching" || !matchId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-red-50 dark:from-gray-900 dark:to-red-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Searching for Opponent...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Finding a worthy challenger...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Waiting state
  if (matchState === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-red-50 dark:from-gray-900 dark:to-red-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Waiting for Opponent...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Match ID: <span className="font-mono font-bold">{matchId}</span>
          </p>
          <button
            onClick={cancelMatch}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold transition"
          >
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  // Ready state
  if (matchState === "ready" || matchState === "matched") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-red-50 dark:from-gray-900 dark:to-red-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl"
        >
          <div className="text-center mb-6">
            <Swords className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Opponent Found!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{quiz?.title}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 text-center">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="font-bold text-gray-800 dark:text-white">
                {user.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-red-500">VS</div>
            </div>

            <div className="bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl p-4 text-center">
              <User className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
              <p className="font-bold text-gray-800 dark:text-white">
                {opponent?.username || "Opponent"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Opponent
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              Battle Rules:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Most correct answers wins
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Fastest total time breaks ties
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                30 seconds per question
              </li>
            </ul>
          </div>

          <button
            onClick={handleReady}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
          >
            <Check className="w-6 h-6" />
            I'm Ready!
          </button>
        </motion.div>
      </div>
    );
  }

  // Active state
  if (matchState === "active" && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-purple-900 dark:to-red-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Score Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-500 text-white rounded-xl p-4 text-center">
              <p className="text-sm mb-1">You</p>
              <p className="text-2xl font-bold">{myScore.score}</p>
              <p className="text-xs opacity-80">{myScore.correct} correct</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-center">
              <div className="text-center">
                <Clock className="w-8 h-8 text-red-500 mx-auto mb-1" />
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {timeLeft}s
                </p>
              </div>
            </div>

            <div className="bg-red-500 text-white rounded-xl p-4 text-center">
              <p className="text-sm mb-1">Opponent</p>
              <p className="text-2xl font-bold">{opponentScore.score}</p>
              <p className="text-xs opacity-80">
                {opponentScore.correct} correct
              </p>
            </div>
          </div>

          {/* Question */}
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6"
          >
            <div className="mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Question {questionIndex + 1} / {quiz?.totalQuestions}
              </p>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmitAnswer(option)}
                  disabled={hasAnswered}
                  className={`p-6 rounded-xl text-left font-semibold transition shadow-lg hover:shadow-xl ${
                    hasAnswered
                      ? selectedAnswer === option
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-800 dark:text-white"
                  } disabled:cursor-not-allowed`}
                >
                  {option}
                </button>
              ))}
            </div>

            {waitingForOpponent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-center"
              >
                <p className="text-yellow-800 dark:text-yellow-300 font-semibold">
                  🎉 You've completed all questions!
                </p>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                  Waiting for opponent to finish...
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Ended state
  if (matchState === "ended") {
    const userId = user?._id || user?.id || user?.userId;
    const isWinner = winner === userId;
    const isTie = !winner;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-purple-900 dark:to-red-900 py-8 px-4">
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
          >
            <Trophy
              className={`w-20 h-20 mx-auto mb-4 ${
                isWinner
                  ? "text-yellow-500"
                  : isTie
                  ? "text-gray-400"
                  : "text-gray-300"
              }`}
            />

            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              {isWinner
                ? "🎉 Victory!"
                : isTie
                ? "🤝 Draw!"
                : "💪 Better Luck Next Time"}
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {isWinner
                ? "You won the duel!"
                : isTie
                ? "It's a tie!"
                : "Your opponent won this round"}
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div
                className={`p-6 rounded-xl ${
                  isWinner
                    ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-500"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  You
                </p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                  {myScore.score}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {myScore.correct} correct
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {myScore.time}s total
                </p>
              </div>

              <div
                className={`p-6 rounded-xl ${
                  !isWinner && !isTie
                    ? "bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 border-2 border-red-500"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Opponent
                </p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                  {opponentScore.score}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {opponentScore.correct} correct
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {opponentScore.time}s total
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/duel")}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-bold transition"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold transition"
              >
                Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return <LoadingSpinner />;
};

export default DuelBattle;
