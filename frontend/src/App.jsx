import React, { useContext, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastProvider } from "./components/ui/Toast";
import ParticleBackground from "./components/ParticleBackground";
import FloatingShapes from "./components/FloatingShapes";
import LoadingSpinner from "./components/LoadingSpinner";
import Navbar from "./components/Navbar";
import LenisScroll from "./components/LenisScroll";
import { useTheme } from "./hooks/useTheme";
import { useIsMobile } from "./hooks/useReducedMotion";
import NetworkStatusIndicator from "./components/ui/NetworkStatusIndicator";
import PWAInstallPrompt from "./components/ui/PWAInstallPrompt";

// Import route wrapper components (never lazy load these)
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ModeratorRoute from "./components/ModeratorRoute";
import { SocketProvider } from "./context/SocketContext";

// Lazy load pages for better performance (code splitting)
// Critical pages - load immediately
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// Less critical pages - lazy load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const QuickActions = lazy(() => import("./pages/QuickActions"));
const QuizList = lazy(() => import("./pages/QuizList"));
const QuizTaker = lazy(() => import("./pages/QuizTaker"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboardModern"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ModeratorDashboard = lazy(() => import("./pages/ModeratorDashboard"));
const EditQuiz = lazy(() => import("./pages/EditQuiz"));
const QuizMaker = lazy(() => import("./pages/QuizMaker"));
const TopicQuizGenerator = lazy(() => import("./pages/TopicQuizGenerator"));
const ManualQuizCreator = lazy(() => import("./pages/ManualQuizCreator"));
const FileQuizGenerator = lazy(() => import("./pages/FileQuizGenerator"));
const AITutor = lazy(() => import("./pages/AITutorNew"));
const ChatSystem = lazy(() => import("./pages/ChatSystem"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const ReportsDashboard = lazy(() => import("./pages/ReportsDashboard"));
const AchievementDashboard = lazy(() => import("./pages/AchievementDashboard"));
const EnhancedQuizCreator = lazy(() => import("./pages/EnhancedQuizCreator"));
const GamifiedQuizTaker = lazy(() => import("./pages/GamifiedQuizTaker"));
const PDFQuizGenerator = lazy(() => import("./pages/PDFQuizGenerator"));
const SocialDashboard = lazy(() => import("./pages/SocialDashboard"));
const ChallengeCreator = lazy(() => import("./pages/ChallengeCreator"));
const AdminBroadcast = lazy(() => import("./pages/AdminBroadcast"));
const Features = lazy(() => import("./pages/Features"));
const LiveSessionHost = lazy(() => import("./pages/LiveSessionHost"));
const LiveSessionJoin = lazy(() => import("./pages/LiveSessionJoin"));
const LiveSessionAnalytics = lazy(() => import("./pages/LiveSessionAnalytics"));
const LiveSessionHistory = lazy(() => import("./pages/LiveSessionHistory"));
const LiveSessionSelector = lazy(() => import("./pages/LiveSessionSelector"));
const DuelMode = lazy(() => import("./pages/DuelMode"));
const DuelBattle = lazy(() => import("./pages/DuelBattle"));
const TeachingHub = lazy(() => import("./pages/TeachingHub"));

// Video Meeting Routes
const TeacherMeetingStart = lazy(() => import("./pages/TeacherMeetingStart"));
const StudentJoinMeeting = lazy(() => import("./pages/StudentJoinMeeting"));
const MeetingRoom = lazy(() => import("./pages/MeetingRoom"));

function App() {
  const [theme] = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Routes that need full-screen layout without navbar/padding
  const fullScreenRoutes = ["/doubt-solver", "/meeting"];
  const isFullScreen = fullScreenRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <SocketProvider>
      <ToastProvider>
        <LenisScroll>
          <div className="min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200 transition-all duration-300 relative overflow-x-hidden">
            {/* Network Status Indicator */}
            <NetworkStatusIndicator />

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />

            {/* Animated Background Layers - Disabled on mobile for performance */}
            {!isMobile && (
              <>
                <ParticleBackground isDark={theme === "dark"} />
                <FloatingShapes />
              </>
            )}

            {/* Modern Glassmorphism Navbar with Scroll Behavior */}
            {!isFullScreen && <Navbar />}

            {/* Main Content with top padding for fixed navbar */}
            <main
              className={
                isFullScreen
                  ? ""
                  : "container mx-auto px-6 lg:px-8 pt-32 lg:pt-36 relative z-10"
              }
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                  </div>
                }
              >
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quick-actions"
                    element={
                      <ProtectedRoute>
                        <QuickActions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher-dashboard"
                    element={
                      <ProtectedRoute>
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teaching-hub"
                    element={
                      <ProtectedRoute>
                        <TeachingHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quizzes"
                    element={
                      <ProtectedRoute>
                        <QuizList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz/:quizId"
                    element={
                      <ProtectedRoute>
                        <QuizTaker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz/edit/:quizId"
                    element={
                      <ProtectedRoute>
                        <EditQuiz />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz/:quizId/leaderboard"
                    element={
                      <ProtectedRoute>
                        <Leaderboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRoute>
                        <Leaderboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz-maker"
                    element={
                      <ProtectedRoute>
                        <QuizMaker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz-maker/topic"
                    element={
                      <ProtectedRoute>
                        <TopicQuizGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz-maker/manual"
                    element={
                      <ProtectedRoute>
                        <ManualQuizCreator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz-maker/enhanced"
                    element={
                      <ProtectedRoute>
                        <EnhancedQuizCreator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz-maker/file"
                    element={
                      <ProtectedRoute>
                        <FileQuizGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pdf-quiz-generator"
                    element={
                      <ProtectedRoute>
                        <PDFQuizGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/social"
                    element={
                      <ProtectedRoute>
                        <SocialDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/create-challenge"
                    element={
                      <ProtectedRoute>
                        <ChallengeCreator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz/:quizId/gamified"
                    element={
                      <ProtectedRoute>
                        <GamifiedQuizTaker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/achievements"
                    element={
                      <ProtectedRoute>
                        <AchievementDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/doubt-solver"
                    element={
                      <ProtectedRoute>
                        <AITutor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <ChatSystem />
                      </ProtectedRoute>
                    }
                  />

                  {/* Live Session Routes */}
                  <Route
                    path="/live/host/:quizId"
                    element={
                      <ProtectedRoute>
                        <LiveSessionHost />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/live/join"
                    element={
                      <ProtectedRoute>
                        <LiveSessionJoin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/live/analytics/:sessionCode"
                    element={
                      <ProtectedRoute>
                        <LiveSessionAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/live/history"
                    element={
                      <ProtectedRoute>
                        <LiveSessionHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/live/start"
                    element={
                      <ProtectedRoute>
                        <LiveSessionSelector />
                      </ProtectedRoute>
                    }
                  />

                  {/* 1v1 Duel Routes */}
                  <Route
                    path="/duel"
                    element={
                      <ProtectedRoute>
                        <DuelMode />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/duel/:quizId"
                    element={
                      <ProtectedRoute>
                        <DuelBattle />
                      </ProtectedRoute>
                    }
                  />

                  {/* Video Meeting Routes */}
                  <Route
                    path="/meeting/create"
                    element={
                      <ProtectedRoute>
                        <TeacherMeetingStart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/meeting/join"
                    element={
                      <ProtectedRoute>
                        <StudentJoinMeeting />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/meeting/:roomId"
                    element={
                      <ProtectedRoute>
                        <MeetingRoom />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin & Moderator Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin-broadcast"
                    element={
                      <AdminRoute>
                        <AdminBroadcast />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/moderator"
                    element={
                      <ModeratorRoute>
                        <ModeratorDashboard />
                      </ModeratorRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ModeratorRoute>
                        <ReportsDashboard />
                      </ModeratorRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </main>

            {/* Modern Footer with Glassmorphism - Hide on full screen routes */}
            {!isFullScreen && (
              <motion.footer
                className="relative mt-12 py-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-indigo-100/50 dark:border-indigo-900/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
                <div className="container mx-auto px-4 text-center relative z-10">
                  <motion.p
                    className="text-sm text-gray-600 dark:text-gray-400"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    &copy; 2025{" "}
                    <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      Cognito Learning Hub
                    </span>
                    . All Rights Reserved.
                  </motion.p>

                  <motion.p
                    className="mt-2 text-sm text-gray-500 dark:text-gray-500"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Made with{" "}
                    <motion.span
                      className="inline-block text-red-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ❤️
                    </motion.span>{" "}
                    by team{" "}
                    <span className="font-medium bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      OPTIMISTIC MUTANT CODERS
                    </span>
                  </motion.p>

                  {/* Social Links */}
                  <motion.div
                    className="mt-6 flex justify-center space-x-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {/* LinkedIn */}
                    <motion.a
                      href="https://www.linkedin.com/company/optimistic-mutant-coders/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-400 hover:from-indigo-500 hover:to-purple-600 hover:text-white dark:hover:from-indigo-500 dark:hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zm7 0h3.8v2.1h.1c.5-1 1.7-2.1 3.6-2.1 3.9 0 4.6 2.6 4.6 6V24h-4v-7.7c0-1.8 0-4.1-2.5-4.1s-2.9 2-2.9 4V24h-4V8.5z" />
                      </svg>
                    </motion.a>

                    {/* GitHub */}
                    <motion.a
                      href="https://github.com/amitesh-7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-400 hover:from-indigo-500 hover:to-purple-600 hover:text-white dark:hover:from-indigo-500 dark:hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.8-.3.8-.6v-2c-3.34.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.2-.9.1-.9.1-.9 1.3.1 2 1.3 2 1.3 1.2 2 3.2 1.4 4 .9.1-.9.5-1.4.9-1.7-2.7-.3-5.6-1.3-5.6-6 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.7 11.7 0 0 1 6.2 0C18 5.3 19 5.6 19 5.6c.6 1.7.2 3 .1 3.3.8.9 1.2 2 1.2 3.3 0 4.7-2.9 5.6-5.6 6 .5.4 1 .8 1 1.8v2.7c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </motion.a>
                  </motion.div>
                </div>
              </motion.footer>
            )}
          </div>
        </LenisScroll>
      </ToastProvider>
    </SocketProvider>
  );
}

export default App;
