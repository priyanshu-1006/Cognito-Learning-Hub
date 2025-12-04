import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Clock,
  Zap,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Medal,
  Crown,
  Flame,
  Sparkles,
  TrendingUp,
  BarChart,
  Timer,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Flag,
} from "lucide-react";
import Confetti from "react-confetti";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Progress from "../components/ui/Progress";
import Badge from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import TextToSpeech from "../components/TextToSpeech";

const QuestionCard = ({
  question,
  onAnswer,
  selectedAnswer,
  isAnswered,
  timeLeft,
  totalTime,
  onNext,
  onPrevious,
  questionNumber,
  totalQuestions,
  showExplanation,
}) => {
  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge
              variant={
                question.difficulty === "Easy"
                  ? "success"
                  : question.difficulty === "Medium"
                  ? "warning"
                  : "destructive"
              }
            >
              {question.difficulty}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {question.points} pts
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span
                className={`font-bold ${
                  timeLeft <= 10
                    ? "text-red-500 animate-pulse"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <div className="w-20">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex-1">
            {question.question}
          </CardTitle>
          {/* Text-to-Speech Button */}
          <TextToSpeech
            text={question.question}
            autoPlay={false}
            className="flex-shrink-0"
          />
        </div>
      </CardHeader>

      <CardContent>
        {question.type === "multiple-choice" && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => !isAnswered && onAnswer(option)}
                disabled={isAnswered}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === option
                    ? isAnswered
                      ? option === question.correct_answer
                        ? "border-green-500 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : "border-red-500 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300"
                      : "border-indigo-500 bg-indigo-50 dark:bg-indigo-900"
                    : isAnswered && option === question.correct_answer
                    ? "border-green-500 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                }`}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {isAnswered &&
                    selectedAnswer === option &&
                    (option === question.correct_answer ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ))}
                  {isAnswered &&
                    selectedAnswer !== option &&
                    option === question.correct_answer && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {question.type === "true-false" && (
          <div className="grid grid-cols-2 gap-4">
            {["True", "False"].map((option) => (
              <motion.button
                key={option}
                onClick={() => !isAnswered && onAnswer(option)}
                disabled={isAnswered}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === option
                    ? isAnswered
                      ? option === question.correct_answer
                        ? "border-green-500 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : "border-red-500 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300"
                      : "border-indigo-500 bg-indigo-50 dark:bg-indigo-900"
                    : isAnswered && option === question.correct_answer
                    ? "border-green-500 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                }`}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{option}</div>
                  {isAnswered &&
                    selectedAnswer === option &&
                    (option === question.correct_answer ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                    ))}
                  {isAnswered &&
                    selectedAnswer !== option &&
                    option === question.correct_answer && (
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {question.type === "descriptive" && (
          <div>
            <textarea
              onChange={(e) => onAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer here..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
            />
          </div>
        )}

        {showExplanation && question.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Explanation
                </h4>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  {question.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <Button
              onClick={onPrevious}
              variant="outline"
              disabled={questionNumber === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button onClick={onNext}>
              {questionNumber === totalQuestions
                ? "Finish Quiz"
                : "Next Question"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

const GameStatsPanel = ({ stats, currentStreak }) => (
  <Card className="w-full max-w-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Game Stats
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Current Streak
        </span>
        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-orange-500">{currentStreak}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Total Score
        </span>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-bold text-yellow-500">{stats.score}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Bonus Points
        </span>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-blue-500">{stats.bonusPoints}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Accuracy
        </span>
        <span className="font-bold text-green-500">
          {stats.totalAnswered > 0
            ? Math.round((stats.correct / stats.totalAnswered) * 100)
            : 0}
          %
        </span>
      </div>
    </CardContent>
  </Card>
);

const AchievementNotification = ({ achievement, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -50, scale: 0.9 }}
    className="fixed top-4 right-4 z-50 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-lg max-w-sm"
  >
    <div className="flex items-center gap-3">
      <Award className="w-8 h-8" />
      <div className="flex-1">
        <h3 className="font-bold">Achievement Unlocked!</h3>
        <p className="text-sm opacity-90">{achievement.name}</p>
      </div>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  </motion.div>
);

export default function GamifiedQuizTaker() {
  const { quizId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Game stats
  const [gameStats, setGameStats] = useState({
    score: 0,
    correct: 0,
    wrong: 0,
    totalAnswered: 0,
    bonusPoints: 0,
    totalTime: 0,
    averageTime: 0,
  });

  const [currentStreak, setCurrentStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestionIndex] !== undefined;

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (currentQuestion && !isAnswered && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer(""); // Auto-submit empty answer when time runs out
    }
  }, [timeLeft, isAnswered, currentQuestion]);

  useEffect(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 30);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, currentQuestion]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch quiz");

      const data = await response.json();
      setQuiz(data);
      setTimeLeft(data.questions[0]?.timeLimit || 30);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      showError("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    if (isAnswered) return;

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect = answer === currentQuestion.correct_answer;

    // Calculate points
    let pointsEarned = 0;
    let bonusPoints = 0;

    if (isCorrect) {
      pointsEarned = currentQuestion.points || 1;

      // Time bonus (extra points for quick answers)
      const timeBonus = Math.max(
        0,
        Math.floor(
          (timeLeft / (currentQuestion.timeLimit || 30)) *
            (currentQuestion.points || 1)
        )
      );
      bonusPoints += timeBonus;

      // Streak bonus
      const newStreak = currentStreak + 1;
      if (newStreak >= 3) {
        bonusPoints += Math.floor(newStreak / 3);
      }
      setCurrentStreak(newStreak);
    } else {
      setCurrentStreak(0);
    }

    // Update answers
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        answer,
        isCorrect,
        timeTaken,
        pointsEarned,
        bonusPoints,
      },
    }));

    // Update game stats
    setGameStats((prev) => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      wrong: isCorrect ? prev.wrong : prev.wrong + 1,
      score: prev.score + pointsEarned,
      bonusPoints: prev.bonusPoints + bonusPoints,
      totalTime: prev.totalTime + timeTaken,
    }));

    // Check for achievements
    checkAchievements(isCorrect, timeTaken, pointsEarned + bonusPoints);

    // Play sound effect
    if (isCorrect) {
      const audio = new Audio("/sounds/correct.mp3");
      audio.play().catch(() => {}); // Ignore errors
    } else {
      const audio = new Audio("/sounds/incorrect.mp3");
      audio.play().catch(() => {});
    }
  };

  const checkAchievements = (isCorrect, timeTaken, totalPoints) => {
    const newAchievements = [];

    // Speed achievements
    if (isCorrect && timeTaken <= 5) {
      newAchievements.push({ name: "Lightning Fast!", icon: "⚡" });
    }

    // Streak achievements
    if (currentStreak + 1 === 5) {
      newAchievements.push({ name: "On Fire!", icon: "🔥" });
    } else if (currentStreak + 1 === 10) {
      newAchievements.push({ name: "Unstoppable!", icon: "👑" });
    }

    // Point achievements
    if (gameStats.score + totalPoints >= 100) {
      newAchievements.push({ name: "Century Club!", icon: "💯" });
    }

    if (newAchievements.length > 0) {
      setShowAchievement(newAchievements[0]);
      setTimeout(() => setShowAchievement(null), 4000);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);

    try {
      const token = localStorage.getItem("quizwise-token");

      // Calculate final results
      const finalScore = Object.values(answers).reduce(
        (sum, answer) =>
          sum + (answer?.pointsEarned || 0) + (answer?.bonusPoints || 0),
        0
      );

      const percentage = Math.round(
        (gameStats.correct / quiz.questions.length) * 100
      );

      const resultData = {
        score: gameStats.correct,
        totalQuestions: quiz.questions.length,
        pointsEarned: gameStats.score,
        bonusPoints: gameStats.bonusPoints,
        totalTimeTaken: gameStats.totalTime,
        percentage,
        passed: percentage >= (quiz.passingScore || 60),
        questionResults: Object.entries(answers).map(([index, answer]) => ({
          questionId: quiz.questions[index]._id,
          userAnswer: answer.answer,
          correctAnswer: quiz.questions[index].correct_answer,
          isCorrect: answer.isCorrect,
          timeTaken: answer.timeTaken,
          pointsEarned: answer.pointsEarned,
          bonusPoints: answer.bonusPoints,
        })),
        streakAtCompletion: currentStreak,
        experienceGained: finalScore,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify(resultData),
        }
      );

      if (!response.ok) throw new Error("Failed to submit quiz");

      // Show confetti for good performance
      if (percentage >= 80) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      setShowResults(true);
      success("Quiz completed successfully!");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      showError("Failed to submit quiz results");
    }
  };

  if (loading) return <LoadingSpinner />;

  if (showResults) {
    const percentage = Math.round(
      (gameStats.correct / quiz.questions.length) * 100
    );
    const passed = percentage >= (quiz.passingScore || 60);

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 p-6">
        {showConfetti && (
          <Confetti width={window.innerWidth} height={window.innerHeight} />
        )}

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                passed
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-orange-100 dark:bg-orange-900"
              }`}
            >
              {passed ? (
                <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <Target className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {passed ? "Congratulations!" : "Good Effort!"}
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400">
              You scored {gameStats.correct} out of {quiz.questions.length} (
              {percentage}%)
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gameStats.score + gameStats.bonusPoints}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Points
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Timer className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(gameStats.totalTime / 60)}m{" "}
                  {gameStats.totalTime % 60}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentStreak}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Final Streak
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/dashboard")}>
              <BarChart className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
            <Button onClick={() => navigate("/quiz-list")} variant="outline">
              Take Another Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 p-6">
      {/* Achievement Notification */}
      <AnimatePresence>
        {showAchievement && (
          <AchievementNotification
            achievement={showAchievement}
            onClose={() => setShowAchievement(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {quiz.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>

          <Button onClick={() => navigate("/quiz-list")} variant="outline">
            Exit Quiz
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress
            value={((currentQuestionIndex + 1) / quiz.questions.length) * 100}
            className="h-3"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              selectedAnswer={answers[currentQuestionIndex]?.answer}
              isAnswered={isAnswered}
              timeLeft={timeLeft}
              totalTime={currentQuestion?.timeLimit || 30}
              onNext={nextQuestion}
              onPrevious={previousQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={quiz.questions.length}
              showExplanation={isAnswered}
            />
          </div>

          {/* Game Stats Sidebar */}
          <div className="lg:col-span-1">
            <GameStatsPanel stats={gameStats} currentStreak={currentStreak} />
          </div>
        </div>
      </div>
    </div>
  );
}
