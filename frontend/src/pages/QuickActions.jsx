import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Zap,
  Swords,
  ClipboardList,
  TrendingUp,
  Target,
  Video,
  ArrowLeft,
  Sparkles,
  Trophy,
  Flame,
  Gamepad2,
  Star,
  Award,
} from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      id: 1,
      title: "Live Battle Arena",
      description: "Join real-time quiz battles with multiple players",
      icon: "live",
      path: "/live/join",
      gradient: "from-purple-500 via-purple-600 to-pink-600",
      hoverGradient: "from-purple-600 to-pink-700",
      level: "Beginner Friendly",
    },
    {
      id: 2,
      title: "Challenge Mode",
      description: "1v1 quiz duel - prove your skills against rivals",
      icon: Swords,
      path: "/duel",
      gradient: "from-red-500 via-orange-500 to-orange-600",
      hoverGradient: "from-red-600 to-orange-700",
      level: "Competitive",
    },
    {
      id: 3,
      title: "Quest Library",
      description: "Discover and conquer available learning quests",
      icon: ClipboardList,
      path: "/quizzes",
      gradient: "from-indigo-500 via-blue-500 to-purple-600",
      hoverGradient: "from-indigo-600 to-purple-700",
      level: "All Levels",
    },
    {
      id: 4,
      title: "Global Rankings",
      description: "Climb the ranks and dominate the leaderboard",
      icon: TrendingUp,
      path: "/leaderboard",
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      hoverGradient: "from-emerald-600 to-teal-700",
      level: "Competitive",
    },
    {
      id: 5,
      title: "AI Mentor",
      description: "Get instant solutions and personalized guidance",
      icon: Target,
      path: "/doubt-solver",
      gradient: "from-amber-500 via-yellow-500 to-orange-600",
      hoverGradient: "from-amber-600 to-orange-700",
      level: "Pro Feature",
    },
    {
      id: 6,
      title: "Live Sessions",
      description: "Connect with mentors and peers in video rooms",
      icon: Video,
      path: "/meeting/join",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
      hoverGradient: "from-violet-600 to-fuchsia-700",
      level: "Interactive",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden py-8">
      {/* Simplified background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with glassmorphism */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/30 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all mb-8 group shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          <div className="text-center">
            {/* Gamified icon with level badge */}
            <div className="relative inline-block mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 shadow-2xl">
                <Gamepad2 className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>Pro</span>
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl mb-4">
              Learning Hub
            </h1>
            <div className="inline-block px-6 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl mb-6">
              <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Choose Your Adventure
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions Grid with enhanced glassmorphism */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <Link to={action.path} className="block">
                  <div className="relative overflow-hidden rounded-3xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg border border-white/50 dark:border-gray-700/50 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                    {/* Gradient overlay on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    ></div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-12"></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="mb-6 inline-block">
                        {action.icon === "live" ? (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <circle
                                cx="12"
                                cy="12"
                                r="3"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div
                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow`}
                          >
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Level badge */}
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/20 transition-colors">
                          <span className="text-xs font-bold text-white">
                            {action.level}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-white transition-colors mb-3">
                        {action.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-700 dark:text-gray-300 group-hover:text-white/90 text-sm leading-relaxed transition-colors mb-4">
                        {action.description}
                      </p>

                      {/* CTA with arrow */}
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors">
                        <span className="text-sm font-bold">Launch Now</span>
                        <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Corner glow effect */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Gamified Stats Section with glassmorphism */}
        <motion.div
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Power Up Your Journey
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Compete & Dominate
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Win battles, earn XP
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-4 shadow-xl">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Maintain Streaks
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Daily challenges unlock
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 mb-4 shadow-xl">
                <Award className="w-8 h-8 text-white" />
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Collect Achievements
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Unlock rare badges
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickActions;
