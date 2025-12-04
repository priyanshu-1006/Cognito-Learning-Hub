import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import LiveLeaderboard from "../components/LiveLeaderboard";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Copy,
  Play,
  SkipForward,
  Square,
  Users,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import QRCode from "qrcode";

const LiveSessionHost = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user, isAuthenticated } = useAuth();

  // Session state
  const [quiz, setQuiz] = useState(null);
  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionStatus, setSessionStatus] = useState("creating"); // creating, waiting, active, ended
  const [participants, setParticipants] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  useEffect(() => {
    console.log("🔍 Auth Check:", {
      isAuthenticated,
      user,
      hasId: !!user?.id,
      hasUnderscore: !!user?._id,
    });

    if (!isAuthenticated || !user) {
      console.error("❌ User not authenticated, redirecting to login");
      setError("You must be logged in to host a live session");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      // Check both user.id and user._id (different JWT formats)
      const userId = user._id || user.id;
      console.log("✅ User authenticated:", user.name, "ID:", userId);
      console.log("👤 Full user object:", JSON.stringify(user, null, 2));
    }
  }, [isAuthenticated, user, navigate]);

  // Connect socket when component mounts
  useEffect(() => {
    if (socket && !socket.connected) {
      console.log("🔌 Connecting socket for live session...");
      socket.connect();
    }

    // Listen for disconnect to clear session
    const handleDisconnect = () => {
      console.log("🔌 Socket disconnected - clearing session state");
      setSessionCode("");
      setSessionId("");
      setParticipants([]);
      setSessionStatus("creating");
    };

    if (socket) {
      socket.on("disconnect", handleDisconnect);
    }

    return () => {
      // Clean up disconnect listener
      if (socket) {
        socket.off("disconnect", handleDisconnect);
      }

      // Disconnect when leaving the page
      if (socket && socket.connected) {
        console.log("🔌 Disconnecting socket...");
        socket.disconnect();
      }
    };
  }, [socket]);

  // Fetch quiz details
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/quizzes/${quizId}`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("quizwise-token"),
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch quiz");
        const result = await response.json();
        // Handle wrapped API response
        const data = result.data || result;
        setQuiz(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Socket event handlers - Set up BEFORE session creation
  useEffect(() => {
    if (!socket) {
      console.log("⏸️ No socket for event listeners");
      return;
    }

    console.log("🎧 Setting up socket event listeners...", {
      socketId: socket.id,
      isConnected: socket.connected,
    });

    // Listen to ALL events for debugging
    const originalOnevent = socket.onevent;
    socket.onevent = function (packet) {
      const args = packet.data || [];
      console.log("🔔 Socket event received:", args[0], args.slice(1));
      originalOnevent.call(this, packet);
    };

    // Participant joined
    const handleParticipantJoined = ({ participant, participantCount }) => {
      console.log("🎉🎉🎉 PARTICIPANT JOINED EVENT RECEIVED! 🎉🎉🎉");
      console.log("👤 Participant data:", participant);
      console.log("📊 Participant count:", participantCount);
      console.log("📋 Current participants before update:", participants);

      if (!participant || !participant.userId) {
        console.error("❌ Invalid participant data received:", participant);
        return;
      }

      // Also log to alert to make it very visible
      console.warn(
        "PARTICIPANT JOINED:",
        participant.userName || participant.username
      );

      setParticipants((prev) => {
        // Check if participant already exists
        const alreadyExists = prev.some((p) => p.userId === participant.userId);

        if (alreadyExists) {
          console.log("⚠️ Participant already in list, skipping duplicate");
          return prev;
        }

        const updated = [
          ...prev,
          {
            userId: participant.userId,
            userName: participant.userName || participant.username,
            userPicture: participant.userPicture || participant.avatar,
          },
        ];
        console.log("📋 Updated participants:", updated);
        console.log("✅ Participants state should update now!");
        return updated;
      });
    };

    // Participant left
    const handleParticipantLeft = ({ userId, username, participantCount }) => {
      console.log("👋 Participant left:", username);
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    };

    // Leaderboard updated
    const handleLeaderboardUpdate = ({
      leaderboard: newLeaderboard,
      questionIndex,
    }) => {
      console.log("🏆 Leaderboard updated for question", questionIndex);
      setLeaderboard(newLeaderboard);
    };

    // Session started
    const handleSessionStarted = () => {
      console.log("✅ Session started - updating UI");
      setSessionStatus("active");
      setCurrentQuestionIndex(0);
    };

    // Question started
    const handleQuestionStarted = ({ questionIndex, question }) => {
      console.log(`❓ Question ${questionIndex + 1} started:`, question?.text);
      setCurrentQuestionIndex(questionIndex);
    };

    // Question ended
    const handleQuestionEnded = ({ questionIndex, correctAnswer }) => {
      console.log(
        `✅ Question ${questionIndex + 1} ended. Correct: ${correctAnswer}`
      );
    };

    // Session ended
    const handleSessionEnded = ({ leaderboard: finalLeaderboard }) => {
      console.log("🏁 Session ended!");
      if (finalLeaderboard) {
        setLeaderboard(finalLeaderboard);
      }
      setSessionStatus("ended");
    };

    socket.on("participant-joined", handleParticipantJoined);
    socket.on("participant-left", handleParticipantLeft);
    socket.on("leaderboard-updated", handleLeaderboardUpdate);
    socket.on("session-started", handleSessionStarted);
    socket.on("question-started", handleQuestionStarted);
    socket.on("question-ended", handleQuestionEnded);
    socket.on("session-ended", handleSessionEnded);

    console.log("✅ Socket event listeners registered");

    return () => {
      console.log("🧹 Cleaning up socket event listeners");
      socket.off("participant-joined", handleParticipantJoined);
      socket.off("participant-left", handleParticipantLeft);
      socket.off("leaderboard-updated", handleLeaderboardUpdate);
      socket.off("session-started", handleSessionStarted);
      socket.off("question-started", handleQuestionStarted);
      socket.off("question-ended", handleQuestionEnded);
      socket.off("session-ended", handleSessionEnded);
    };
  }, [socket]);

  // Create session when connected
  useEffect(() => {
    // Handle both user.id and user._id formats
    const userId = user?._id || user?.id || user?.userId;

    console.log("📊 Session creation check:", {
      hasSocket: !!socket,
      isConnected,
      hasQuiz: !!quiz,
      quizTitle: quiz?.title,
      hasSessionCode: !!sessionCode,
      hasUserId: !!userId,
      userId: userId,
      userObject: user,
    });

    if (!socket || !isConnected || !quiz || sessionCode || !userId) {
      if (!socket) console.log("⏸️ Waiting for socket...");
      if (!isConnected) console.log("⏸️ Waiting for socket connection...");
      if (!quiz) console.log("⏸️ Waiting for quiz data...");
      if (sessionCode) console.log("⏸️ Session already created");
      if (!userId) console.log("⏸️ Waiting for user ID... user object:", user);
      return;
    }

    console.log("🎯 Creating live session for quiz:", quiz.title);
    console.log("🎯 Host ID:", userId);
    console.log("🎯 User object:", user);

    socket.emit(
      "create-session",
      {
        quizId: quiz._id,
        hostId: userId,
        settings: {
          timePerQuestion: 30,
          showLeaderboardAfterEach: true,
          allowLateJoin: false,
        },
      },
      (response) => {
        if (response.success) {
          console.log("✅ Session created:", response.sessionCode);
          console.log("🚪 Host is in room:", response.sessionCode);
          console.log("📡 Socket ID:", socket.id);

          setSessionCode(response.sessionCode);
          setSessionId(response.sessionId);
          setSessionStatus("waiting");

          // Generate QR code for easy joining
          const joinUrl = `${window.location.origin}/live/join?code=${response.sessionCode}`;
          QRCode.toDataURL(joinUrl, { width: 256 })
            .then((url) => setQrCodeUrl(url))
            .catch((err) => console.error("QR Code generation failed:", err));
        } else {
          console.error("❌ Session creation failed:", response.error);
          setError(response.error || "Failed to create session");
        }
      }
    );
  }, [socket, isConnected, quiz, user, sessionCode]);

  // Start quiz
  const handleStartQuiz = useCallback(() => {
    if (!socket || participants.length === 0) {
      alert("Wait for at least one participant to join!");
      return;
    }

    console.log("🚀 Starting quiz...");
    const userId = user?._id || user?.id || user?.userId;
    socket.emit("start-session", { sessionCode, userId }, (response) => {
      if (response.success) {
        setSessionStatus("active");
        setCurrentQuestionIndex(0);
      } else {
        alert(response.error || "Failed to start quiz");
      }
    });
  }, [socket, sessionCode, participants]);

  // End session - Defined BEFORE handleNextQuestion to avoid hoisting issues
  const handleEndSession = useCallback(() => {
    if (!confirm("Are you sure you want to end this session?")) return;

    console.log("🛑 Ending session...");
    const userId = user?._id || user?.id || user?.userId;
    console.log("User data:", { user, userId, sessionCode });

    socket.emit("end-session", { sessionCode, userId }, (response) => {
      console.log("📨 Received end-session response:", response);

      if (response && response.success) {
        console.log("✅ Session ended successfully");
        setSessionStatus("ended");
      } else {
        console.error("❌ Failed to end session:", response);
        alert(response?.error || "Failed to end session");
      }
    });
  }, [socket, sessionCode, user]);

  // Next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex >= quiz.questions.length - 1) {
      handleEndSession();
      return;
    }

    console.log("➡️ Moving to next question...");
    const userId = user?._id || user?.id || user?.userId;
    socket.emit("next-question", { sessionCode, userId }, (response) => {
      if (response && response.success) {
        setCurrentQuestionIndex(response.questionIndex);
      }
    });
  }, [socket, sessionCode, currentQuestionIndex, quiz, user, handleEndSession]);

  // Copy session code
  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode);
    alert("Session code copied to clipboard!");
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={() => navigate("/teacher-dashboard")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {quiz?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Live Session Host Control Panel
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Users className="w-4 h-4" />
                  <span>Participants</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {participants.length}
                </div>
              </div>
              {sessionStatus === "active" && (
                <div className="text-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Trophy className="w-4 h-4" />
                    <span>Question</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currentQuestionIndex + 1} / {quiz.questions.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Creating Session */}
            {sessionStatus === "creating" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12"
              >
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {isConnected
                      ? "Creating Live Session..."
                      : "Connecting to server..."}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {isConnected
                      ? "Setting up your quiz session, please wait..."
                      : "Establishing connection to enable real-time features..."}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected
                          ? "bg-green-500 animate-pulse"
                          : "bg-yellow-500 animate-pulse"
                      }`}
                    ></div>
                    <span>{isConnected ? "Connected" : "Connecting..."}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Waiting Room */}
            {sessionStatus === "waiting" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
              >
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Waiting for Participants...
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Share the session code or QR code with students
                  </p>

                  {/* Session Code Display */}
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-8 mb-6">
                    <p className="text-white text-sm font-medium mb-2">
                      Session Code
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-6xl font-black text-white tracking-widest font-mono">
                        {sessionCode}
                      </div>
                      <button
                        onClick={copySessionCode}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition"
                      >
                        <Copy className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="mb-6">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="mx-auto rounded-lg shadow-lg"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Scan to join
                      </p>
                    </div>
                  )}

                  {/* Start Button */}
                  <button
                    onClick={handleStartQuiz}
                    disabled={participants.length === 0 || !isConnected}
                    className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    <Play className="w-6 h-6" />
                    Start Quiz
                  </button>
                </div>
              </motion.div>
            )}

            {/* Active Quiz */}
            {sessionStatus === "active" && currentQuestion && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
              >
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Question {currentQuestionIndex + 1} of{" "}
                      {quiz.questions.length}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">30s per question</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    {currentQuestion.question}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 ${
                          option === currentQuestion.correctAnswer
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              option === currentQuestion.correctAnswer
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-gray-800 dark:text-white font-medium">
                            {option}
                          </span>
                          {option === currentQuestion.correctAnswer && (
                            <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {currentQuestion.explanation && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        <strong>Explanation:</strong>{" "}
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
                  >
                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                      <>
                        <SkipForward className="w-5 h-5" />
                        Next Question
                      </>
                    ) : (
                      <>
                        <Trophy className="w-5 h-5" />
                        Finish Quiz
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-lg hover:shadow-xl"
                  >
                    <Square className="w-5 h-5" />
                    End
                  </button>
                </div>
              </motion.div>
            )}

            {/* Session Ended */}
            {sessionStatus === "ended" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
              >
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
                  Quiz Completed!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  {participants.length} participants completed the quiz
                </p>

                {/* Quiz Statistics */}
                {leaderboard.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Avg Score
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {(
                          leaderboard.reduce((sum, p) => sum + p.score, 0) /
                          leaderboard.length
                        ).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Avg Accuracy
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {(
                          leaderboard.reduce(
                            (sum, p) => sum + (p.accuracy || 0),
                            0
                          ) / leaderboard.length
                        ).toFixed(0)}
                        %
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Avg Time
                      </p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {(
                          leaderboard.reduce(
                            (sum, p) => sum + (p.avgTimePerQuestion || 0),
                            0
                          ) / leaderboard.length
                        ).toFixed(1)}
                        s
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Top Score
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.max(...leaderboard.map((p) => p.score)).toFixed(
                          1
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate("/teacher-dashboard")}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition"
                  >
                    Host Another Session
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Leaderboard */}
            <LiveLeaderboard leaderboard={leaderboard} />

            {/* Participants List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({participants.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {participants.map((participant) => (
                    <motion.div
                      key={participant.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                        {(participant.userName || participant.username || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {participant.userName ||
                            participant.username ||
                            "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Online
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {participants.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No participants yet...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSessionHost;
