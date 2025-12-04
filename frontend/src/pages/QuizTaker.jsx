import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Star,
  FileText,
  Copy,
  Download,
  BarChart,
  Home,
  RotateCcw,
  Share2,
} from "lucide-react";
import Confetti from "react-confetti";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Progress from "../components/ui/Progress";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { LoadingSpinner } from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import { cn, fadeInUp, staggerContainer, staggerItem } from "../lib/utils";
import ReportModal from "../components/ReportModal";
import TextToSpeech from "../components/TextToSpeech";

export default function QuizTaker() {
  const { quizId } = useParams();
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);

  // Sound effects
  const correctSound = new Audio("/sounds/correct.mp3");
  const incorrectSound = new Audio("/sounds/incorrect.mp3");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("quizwise-token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}`,
          {
            headers: { "x-auth-token": token },
          }
        );
        if (!response.ok) throw new Error("Quiz not found.");
        const data = await response.json();
        setQuiz(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (isFinished && quiz) {
      const submitScore = async () => {
        try {
          const token = localStorage.getItem("quizwise-token");
          const resultData = {
            quizId: quiz._id,
            score: score,
            totalQuestions: quiz.questions.length,
          };
          await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
            body: JSON.stringify(resultData),
          });
        } catch (err) {
          console.error("Failed to submit score:", err);
        }
      };
      submitScore();
    }
  }, [isFinished, quiz, score]);

  // Timer logic
  useEffect(() => {
    if (!selectedAnswer && !isFinished && quiz) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAnswerSelect(null); // Timeout counts as wrong answer
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentQuestionIndex, selectedAnswer, isFinished, quiz]);

  const handleAnswerSelect = (option) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option || "timeout"); // Mark as timeout if no option
    if (option === quiz.questions[currentQuestionIndex].correct_answer) {
      setScore((prev) => prev + 1);
      correctSound.play();
    } else {
      incorrectSound.play();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(30); // Reset timer
    } else {
      setIsFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsFinished(false);
    setTimeLeft(30);
  };

  // Enhanced loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <div className="relative">
              <LoadingSpinner
                size="lg"
                className="mx-auto mb-6 text-indigo-600 dark:text-indigo-400"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Preparing Your Quiz
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we load your questions...
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 text-center max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <div className="relative mb-6">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 dark:text-red-400" />
              <div className="absolute inset-0 bg-red-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Enhanced results screen
  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const isExcellent = percentage >= 90;
    const isGood = percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 relative overflow-hidden">
        <Confetti
          recycle={false}
          numberOfPieces={isExcellent ? 300 : isGood ? 150 : 50}
        />

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <Card className="p-12 shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
              <CardContent className="space-y-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <Trophy className="w-24 h-24 mx-auto text-yellow-400 filter drop-shadow-lg" />
                  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                </motion.div>

                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Quiz Complete!
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                    Congratulations on finishing "{quiz.title}"!
                  </p>
                </div>

                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-center">
                    <div className="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {score} / {quiz.questions.length}
                    </div>
                    <div className="text-3xl font-semibold text-gray-500 dark:text-gray-400">
                      {percentage}%
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Badge
                      variant={
                        isExcellent
                          ? "success"
                          : isGood
                          ? "warning"
                          : "destructive"
                      }
                      size="lg"
                      className="px-6 py-2 text-lg font-semibold shadow-lg"
                    >
                      {isExcellent
                        ? "🎉 Excellent!"
                        : isGood
                        ? "👍 Good Job!"
                        : "📚 Keep Learning!"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {score}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Correct
                      </div>
                    </div>
                    <div className="text-center">
                      <XCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {quiz.questions.length - score}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Incorrect
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={restartQuiz}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to="/quizzes" className="flex items-center">
                      <Home className="w-4 h-4 mr-2" />
                      Back to Quizzes
                    </Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercentage =
    ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const timePercentage = (timeLeft / 30) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto space-y-6 px-4">
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          quiz={quiz}
          questionText={quiz?.questions[currentQuestionIndex]?.question}
        />

        {/* Header Card with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {quiz.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-lg">
                    Question {currentQuestionIndex + 1} of{" "}
                    {quiz.questions.length} • Score:
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 ml-1">
                      {score}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-bold shadow-lg transition-all duration-300",
                      timeLeft <= 10
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse"
                        : timeLeft <= 20
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                        : "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                    )}
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-lg">{timeLeft}s</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowReportModal(true)}
                    title="Report this question"
                    className="hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Flag className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>Progress</span>
                  <span className="font-bold">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-4 bg-gray-200 dark:bg-gray-700"
                />

                <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>Time Remaining</span>
                  <span className="font-bold">{timeLeft}s</span>
                </div>
                <Progress
                  value={timePercentage}
                  variant={
                    timeLeft <= 10
                      ? "destructive"
                      : timeLeft <= 20
                      ? "warning"
                      : "success"
                  }
                  className="h-3 bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Question Card with enhanced styling */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="overflow-hidden shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 py-8">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-2xl leading-relaxed font-bold text-gray-800 dark:text-white flex-1">
                    {currentQuestion.question}
                  </CardTitle>
                  {/* Text-to-Speech Button */}
                  <TextToSpeech
                    text={currentQuestion.question}
                    autoPlay={false}
                    className="flex-shrink-0"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <motion.div
                  className="grid gap-4"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = option === currentQuestion.correct_answer;
                    const isSelected = option === selectedAnswer;
                    const showResult = !!selectedAnswer;

                    let buttonClass =
                      "h-auto p-6 text-left justify-start text-lg font-medium transition-all duration-300 transform hover:scale-105";

                    if (showResult) {
                      if (isCorrect) {
                        buttonClass +=
                          " border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 text-green-800 dark:text-green-200 shadow-lg";
                      } else if (isSelected) {
                        buttonClass +=
                          " border-red-500 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900 dark:to-pink-900 text-red-800 dark:text-red-200 shadow-lg";
                      } else {
                        buttonClass +=
                          " opacity-60 bg-gray-50 dark:bg-gray-700";
                      }
                    } else {
                      buttonClass +=
                        " border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900 hover:shadow-lg";
                    }

                    return (
                      <motion.div key={index} variants={staggerItem}>
                        <Button
                          variant="outline"
                          onClick={() => handleAnswerSelect(option)}
                          disabled={!!selectedAnswer}
                          className={cn(buttonClass, "relative group")}
                          size="lg"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-bold">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="text-base">{option}</span>
                            </div>
                            {showResult && isCorrect && (
                              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            )}
                            {showResult && !isCorrect && isSelected && (
                              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {selectedAnswer && (
                  <motion.div
                    className="flex justify-center mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={handleNextQuestion}
                      size="lg"
                      className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg group"
                    >
                      {currentQuestionIndex < quiz.questions.length - 1 ? (
                        <>
                          Next Question
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          Finish Quiz
                          <Trophy className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
