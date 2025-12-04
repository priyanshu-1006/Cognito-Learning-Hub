import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useSound } from "../hooks/useSound";
import LoadingSpinner from "../components/LoadingSpinner";
import LiveLeaderboard from "../components/LiveLeaderboard";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  LogIn,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  Volume2,
  VolumeX,
  QrCode,
  Keyboard,
  Camera,
  Upload,
} from "lucide-react";

const LiveSessionJoin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { socket, isConnected, connectionError } = useSocket();
  const { user } = useAuth();
  const { play, toggleMute, isMuted } = useSound();

  // Join form state
  const [sessionCode, setSessionCode] = useState(
    searchParams.get("code") || ""
  );
  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Session state
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizEnded, setQuizEnded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [myAnswers, setMyAnswers] = useState([]); // Track all answers for analysis
  const qrScannerRef = useRef(null);

  // Handle QR code from file upload
  const handleQRImageUpload = async (file) => {
    if (!file) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-file-reader");

      const result = await html5QrCode.scanFile(file, true);
      console.log("🎯 QR Code from image:", result);

      // Extract session code from URL
      try {
        const url = new URL(result);
        const code = url.searchParams.get("code");

        if (code && code.length === 6) {
          setSessionCode(code.toUpperCase());
          setShowQRScanner(false);
          setJoinError("");
        } else {
          setJoinError(
            "Invalid QR code. Please scan the correct code from the teacher's screen."
          );
        }
      } catch (error) {
        setJoinError("Invalid QR code format. Please try again.");
      }
    } catch (error) {
      console.error("QR scan error:", error);
      setJoinError(
        "Could not read QR code from image. Please try again or enter the code manually."
      );
    }
  };

  // Initialize QR Scanner with proper permission handling
  useEffect(() => {
    if (showQRScanner && !hasJoined) {
      let scanner = null;

      const initScanner = async () => {
        const element = document.getElementById("qr-reader");
        if (!element) {
          console.warn("QR reader element not found, retrying...");
          setTimeout(initScanner, 100);
          return;
        }

        try {
          // First, explicitly request camera permissions
          console.log("📷 Requesting camera permissions...");

          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" },
            });

            // Permission granted! Stop the test stream
            console.log("✅ Camera permission granted!");
            stream.getTracks().forEach((track) => track.stop());
          } catch (permError) {
            console.error("❌ Camera permission denied:", permError);
            setJoinError(
              "Camera access denied. Please allow camera access in your browser settings, or use the file upload option below."
            );
            return;
          }

          // Now initialize the scanner with permissions already granted
          scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              rememberLastUsedCamera: true,
              showTorchButtonIfSupported: true,
              formatsToSupport: [0], // QR_CODE only
              videoConstraints: {
                facingMode: "environment", // Prefer back camera on mobile
              },
            },
            /* verbose= */ false
          );

          scanner.render(
            (decodedText) => {
              console.log("🎯 QR Code scanned:", decodedText);

              try {
                const url = new URL(decodedText);
                const code = url.searchParams.get("code");

                if (code && code.length === 6) {
                  setSessionCode(code.toUpperCase());
                  setShowQRScanner(false);
                  setJoinError("");

                  if (scanner) {
                    scanner.clear().catch(console.error);
                  }

                  // Auto-join after scanning
                  setTimeout(() => {
                    const joinButton = document.querySelector(
                      "button:not([disabled])"
                    );
                    if (joinButton && joinButton.textContent.includes("Join")) {
                      joinButton.click();
                    }
                  }, 500);
                } else {
                  setJoinError(
                    "Invalid QR code. Please scan the correct code from the teacher's screen."
                  );
                }
              } catch (error) {
                setJoinError("Invalid QR code format. Please try again.");
              }
            },
            (error) => {
              // Ignore scanning errors - they happen continuously while scanning
            }
          );

          qrScannerRef.current = scanner;
        } catch (error) {
          console.error("Scanner initialization error:", error);
          setJoinError(
            "Could not initialize camera. Please use file upload or enter code manually."
          );
        }
      };

      const timeoutId = setTimeout(initScanner, 100);

      return () => {
        clearTimeout(timeoutId);
        if (qrScannerRef.current) {
          qrScannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [showQRScanner, hasJoined]);

  // Connect socket when component mounts
  useEffect(() => {
    if (socket && !socket.connected) {
      console.log("🔌 Connecting socket for live session...");
      socket.connect();
    }

    return () => {
      // Disconnect when leaving the page
      if (socket && socket.connected) {
        console.log("🔌 Disconnecting socket...");
        socket.disconnect();
      }
    };
  }, [socket]);

  // Join session
  const handleJoinSession = useCallback(async () => {
    // Prevent duplicate joins
    if (hasJoined) {
      console.log("⚠️ Already joined, skipping duplicate join attempt");
      return;
    }

    if (!sessionCode || sessionCode.length !== 6) {
      setJoinError("Please enter a valid 6-character session code");
      return;
    }

    if (!socket || !isConnected) {
      setJoinError("Not connected to server. Please wait...");
      return;
    }

    // Handle both user.id and user._id formats
    const userId = user?._id || user?.id || user?.userId;

    if (!userId) {
      setJoinError("User not authenticated. Please log in.");
      return;
    }

    console.log("🎯 Joining session:", sessionCode);
    console.log("👤 User ID:", userId, "Name:", user.name);
    console.log("🔌 Socket ID:", socket.id, "Connected:", socket.connected);
    setJoinError("");

    socket.emit(
      "join-session",
      {
        sessionCode: sessionCode.toUpperCase(),
        userId: userId,
        userName: user.name || user.username || user.email || "Anonymous",
        userPicture: user.profilePicture || user.picture || null,
      },
      (response) => {
        console.log("📡 Join session response:", response);
        if (response.success) {
          console.log("✅ Joined session successfully");
          setSession(response.session);
          setHasJoined(true);
        } else {
          console.error("❌ Failed to join:", response.error);
          setJoinError(response.error || "Failed to join session");
        }
      }
    );
  }, [socket, isConnected, sessionCode, user, hasJoined]);

  // Auto-join if code in URL
  useEffect(() => {
    if (searchParams.get("code") && !hasJoined && socket && isConnected) {
      handleJoinSession();
    }
  }, [searchParams, hasJoined, socket, isConnected, handleJoinSession]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !hasJoined) return;

    // Quiz started
    socket.on(
      "quiz-started",
      ({ questionIndex, question, totalQuestions: total, timestamp }) => {
        console.log("🚀 Quiz started! Question:", questionIndex + 1);
        setCurrentQuestion(question);
        setCurrentQuestionIndex(questionIndex);
        setTotalQuestions(total);
        setHasAnswered(false);
        setSelectedAnswer("");
        setAnswerResult(null);
        setTimeLeft(30);
      }
    );

    // Next question
    socket.on(
      "question-started",
      ({ questionIndex, question, totalQuestions: total, timestamp }) => {
        console.log("➡️ Next question:", questionIndex + 1);
        setCurrentQuestion(question);
        setCurrentQuestionIndex(questionIndex);
        setTotalQuestions(total);
        setHasAnswered(false);
        setSelectedAnswer("");
        setAnswerResult(null);
        setTimeLeft(30);
      }
    );

    // Leaderboard updated
    socket.on(
      "leaderboard-updated",
      ({ leaderboard: newLeaderboard, questionIndex }) => {
        console.log("🏆 Leaderboard updated");
        setLeaderboard(newLeaderboard);
      }
    );

    // Answer submitted feedback
    socket.on("answer-submitted", ({ isCorrect, points, correctAnswer }) => {
      console.log("✅ Answer feedback received:", {
        isCorrect,
        points,
        correctAnswer,
      });

      setAnswerResult({
        isCorrect,
        pointsEarned: points,
        correctAnswer,
      });

      // Store answer for analysis
      setMyAnswers((prev) => [
        ...prev,
        {
          questionIndex: currentQuestionIndex,
          question: currentQuestion.question,
          yourAnswer: selectedAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect,
          pointsEarned: points,
          timeSpent: 30 - timeLeft,
        },
      ]);

      // Play sound effect based on correctness
      if (isCorrect) {
        play("correct");
      } else {
        play("incorrect");
      }
    });

    // Session ended
    socket.on(
      "session-ended",
      ({
        leaderboard: finalLeaderboard,
        totalParticipants,
        totalQuestions: total,
      }) => {
        console.log("🏁 Quiz ended!");
        setLeaderboard(finalLeaderboard);
        setTotalQuestions(total);
        setQuizEnded(true);

        // Show confetti if user is in top 3
        const userId = user?._id || user?.id || user?.userId;
        const myRank =
          finalLeaderboard.findIndex((entry) => entry.userId === userId) + 1;
        if (myRank > 0 && myRank <= 3) {
          setShowConfetti(true);
          // Stop confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
    );

    // Host disconnected
    socket.on("host-disconnected", ({ message }) => {
      console.warn("⚠️ Host disconnected");
      alert(message);
      navigate("/dashboard");
    });

    return () => {
      socket.off("quiz-started");
      socket.off("question-started");
      socket.off("leaderboard-updated");
      socket.off("answer-submitted");
      socket.off("session-ended");
      socket.off("host-disconnected");
    };
  }, [
    socket,
    hasJoined,
    navigate,
    user,
    currentQuestionIndex,
    currentQuestion,
    selectedAnswer,
    timeLeft,
    play,
  ]);

  // Submit answer - Defined BEFORE timer to avoid hoisting issues
  const handleSubmitAnswer = useCallback(
    (answer) => {
      if (!currentQuestion) return;

      const timeTaken = 30 - timeLeft;
      const userId = user?._id || user?.id || user?.userId;

      console.log("📝 Submitting answer:", answer);
      console.log("👤 User ID for submission:", userId);
      console.log("❓ Question ID:", currentQuestion._id);

      if (!userId) {
        console.error("❌ No user ID available");
        return;
      }

      if (!currentQuestion._id) {
        console.error("❌ No question ID available");
        return;
      }

      socket.emit("submit-answer", {
        sessionCode: sessionCode.toUpperCase(),
        userId: userId,
        questionId: currentQuestion._id,
        selectedAnswer: answer,
        timeSpent: timeTaken,
      });
    },
    [socket, sessionCode, user, currentQuestionIndex, currentQuestion, timeLeft]
  );

  // Timer countdown
  useEffect(() => {
    if (!currentQuestion || hasAnswered || quizEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit empty answer when time runs out
          if (!hasAnswered) {
            setHasAnswered(true);
            setSelectedAnswer("");
            handleSubmitAnswer("");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, hasAnswered, quizEnded, handleSubmitAnswer]);

  // Handle answer selection
  const handleAnswerClick = (option) => {
    if (hasAnswered) return;

    // Immediately mark as answered and set selection for instant visual feedback
    setSelectedAnswer(option);
    setHasAnswered(true);

    // Submit to server
    handleSubmitAnswer(option);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please login to join a live session
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

  // Join Form
  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {showQRScanner ? (
                <QrCode className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Join Live Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {showQRScanner
                ? "Scan the QR code"
                : "Enter the 6-character session code"}
            </p>
          </div>

          {/* Toggle between Manual Entry and QR Scanner */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowQRScanner(false)}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                !showQRScanner
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Keyboard className="w-5 h-5" />
              Enter Code
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                showQRScanner
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Camera className="w-5 h-5" />
              Scan QR
            </button>
          </div>

          {connectionError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {connectionError}
              </p>
            </div>
          )}

          {joinError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {joinError}
              </p>
            </div>
          )}

          {/* Manual Code Entry */}
          {!showQRScanner && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Code
                </label>
                <input
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white uppercase"
                />
              </div>

              <button
                onClick={handleJoinSession}
                disabled={!isConnected || sessionCode.length !== 6}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {!isConnected ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Join Session
                  </>
                )}
              </button>
            </>
          )}

          {/* QR Scanner */}
          {showQRScanner && (
            <div className="mb-6 space-y-4">
              {/* Camera Scanner (Primary) */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700">
                <div className="text-center mb-3">
                  <QrCode className="w-8 h-8 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Scan QR Code
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Point your camera at the teacher's QR code
                  </p>
                </div>

                {/* QR Scanner Container */}
                <div
                  id="qr-reader"
                  className="rounded-lg overflow-hidden"
                ></div>
              </div>

              {/* File Upload Alternative */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or upload QR image
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="text-center mb-3">
                  <Upload className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Screenshot the QR code and upload it
                  </p>
                </div>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleQRImageUpload(file);
                    }}
                    className="block w-full text-sm text-gray-600 dark:text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-gray-600 file:text-white
                      hover:file:bg-gray-700
                      file:cursor-pointer cursor-pointer
                      file:transition"
                  />
                </label>

                <div id="qr-file-reader" className="hidden"></div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Waiting Room
  if (hasJoined && !currentQuestion && !quizEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            You're In!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Waiting for the host to start the quiz...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz Ended
  if (quizEnded) {
    const userId = user?._id || user?.id || user?.userId;
    const myRank =
      leaderboard.findIndex((entry) => entry.userId === userId) + 1;
    const myScore =
      leaderboard.find((entry) => entry.userId === userId)?.score || 0;

    console.log("🏆 Quiz ended - My stats:", {
      userId,
      myRank,
      myScore,
      leaderboard,
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4">
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center mb-6"
          >
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Quiz Complete!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Great job completing the quiz!
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Your Rank
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  #{myRank}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Your Score
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {myScore.toFixed(1)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Accuracy
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {(
                    leaderboard.find((entry) => entry.userId === userId)
                      ?.accuracy || 0
                  ).toFixed(0)}
                  %
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Answers
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {leaderboard.find((entry) => entry.userId === userId)
                    ?.answersCount || 0}
                  /{totalQuestions}
                </p>
              </div>
            </div>

            {/* Quiz Analysis Section */}
            {myAnswers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                  Quiz Analysis
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {myAnswers.map((answer, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 ${
                        answer.isCorrect
                          ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                          : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {answer.isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-800 dark:text-white">
                              Question {answer.questionIndex + 1}
                            </h4>
                            <div className="flex items-center gap-3 text-sm">
                              <span
                                className={`font-bold ${
                                  answer.isCorrect
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                +{answer.pointsEarned?.toFixed(1) || 0} pts
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                ⏱ {answer.timeSpent}s
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            {answer.question}
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-gray-600 dark:text-gray-400">
                                Your answer:
                              </span>
                              <span
                                className={`font-medium ${
                                  answer.isCorrect
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                                }`}
                              >
                                {answer.yourAnswer}
                              </span>
                            </div>
                            {!answer.isCorrect && answer.correctAnswer && (
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-600 dark:text-gray-400">
                                  Correct answer:
                                </span>
                                <span className="font-medium text-green-700 dark:text-green-300">
                                  {answer.correctAnswer}
                                </span>
                              </div>
                            )}
                            {answer.explanation && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="font-semibold text-blue-700 dark:text-blue-300">
                                  Explanation:{" "}
                                </span>
                                <span className="text-blue-600 dark:text-blue-400">
                                  {answer.explanation}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-bold transition shadow-lg hover:shadow-xl"
            >
              Back to Dashboard
            </button>
          </motion.div>

          <LiveLeaderboard leaderboard={leaderboard} />
        </div>
      </div>
    );
  }

  // Active Quiz
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} / {totalQuestions}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title={isMuted() ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted() ? (
                  <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-5 h-5 ${
                    timeLeft <= 10
                      ? "text-red-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-2xl font-bold ${
                    timeLeft <= 10
                      ? "text-red-500 animate-pulse"
                      : "text-gray-800 dark:text-white"
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            {currentQuestion?.question}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = answerResult?.correctAnswer === option;
              // Only show result after we get server response
              const showResult = hasAnswered && answerResult;

              let buttonClass =
                "p-6 rounded-xl border-2 transition-all transform hover:scale-105 cursor-pointer ";

              if (showResult) {
                if (isCorrect) {
                  buttonClass +=
                    "border-green-500 bg-green-50 dark:bg-green-900/20";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-500 bg-red-50 dark:bg-red-900/20";
                } else {
                  buttonClass +=
                    "border-gray-300 dark:border-gray-600 opacity-60";
                }
              } else {
                buttonClass += isSelected
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105"
                  : "border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(option)}
                  disabled={hasAnswered}
                  className={buttonClass}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        showResult && isCorrect
                          ? "bg-green-500 text-white"
                          : showResult && isSelected && !isCorrect
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg font-medium text-gray-800 dark:text-white flex-1 text-left">
                      {option}
                    </span>
                    {showResult && isCorrect && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Answer Result */}
          {answerResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-6 rounded-xl ${
                answerResult.isCorrect
                  ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-500"
                  : "bg-red-50 dark:bg-red-900/20 border-2 border-red-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {answerResult.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <h3
                  className={`text-xl font-bold ${
                    answerResult.isCorrect
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {answerResult.isCorrect ? "Correct!" : "Incorrect"}
                </h3>
                <div className="ml-auto text-right">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">
                    +{(answerResult.pointsEarned || 0).toFixed(1)} pts
                  </div>
                  {answerResult.streakBonus > 0 && (
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1 justify-end">
                      🔥 +{answerResult.streakBonus} streak bonus!
                    </div>
                  )}
                </div>
              </div>
              {answerResult.explanation && (
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Explanation:</strong> {answerResult.explanation}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Mini Leaderboard */}
        {leaderboard.length > 0 && (
          <LiveLeaderboard leaderboard={leaderboard.slice(0, 5)} compact />
        )}
      </div>
    </div>
  );
};

export default LiveSessionJoin;
