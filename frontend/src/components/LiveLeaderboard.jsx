import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

const LiveLeaderboard = ({ leaderboard = [], compact = false }) => {
  if (leaderboard.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Live Leaderboard
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No scores yet...
        </p>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-yellow-600";
      case 2:
        return "from-gray-300 to-gray-500";
      case 3:
        return "from-orange-400 to-orange-600";
      default:
        return "from-purple-400 to-blue-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {compact ? "Top Players" : "Live Leaderboard"}
        </h3>
        {!compact && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Live Updates</span>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {leaderboard.map((entry, index) => {
            const rank = entry.rank || index + 1;
            const isTopThree = rank <= 3;

            return (
              <motion.div
                key={entry.userId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`relative overflow-hidden rounded-xl ${
                  isTopThree
                    ? "bg-gradient-to-r " + getRankColor(rank) + " p-[2px]"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    isTopThree ? "bg-white dark:bg-gray-800" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                    {getRankIcon(rank) || (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          {rank}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(
                      rank
                    )} flex items-center justify-center flex-shrink-0`}
                  >
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {entry.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-bold truncate ${
                        isTopThree
                          ? "text-gray-800 dark:text-white text-lg"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {entry.username}
                    </p>
                    {!compact && (
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {entry.correctAnswers !== undefined && (
                          <span>✓ {entry.correctAnswers} correct</span>
                        )}
                        {entry.avgTimePerQuestion !== undefined && (
                          <span>
                            ⏱ {entry.avgTimePerQuestion.toFixed(1)}s avg
                          </span>
                        )}
                        {entry.accuracy !== undefined && (
                          <span
                            className={`font-semibold ${
                              entry.accuracy >= 80
                                ? "text-green-600 dark:text-green-400"
                                : entry.accuracy >= 60
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {entry.accuracy.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-2xl font-black ${
                        isTopThree
                          ? "bg-gradient-to-r " +
                            getRankColor(rank) +
                            " bg-clip-text text-transparent"
                          : "text-gray-800 dark:text-white"
                      }`}
                    >
                      {entry.score?.toFixed(1) || "0.0"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      points
                    </div>
                  </div>
                </div>

                {/* Rank badge for top 3 */}
                {isTopThree && (
                  <div className="absolute -top-1 -right-1">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(
                        rank
                      )} flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900`}
                    >
                      <span className="text-white text-sm font-bold">
                        #{rank}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {compact && leaderboard.length > 5 && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            + {leaderboard.length - 5} more players
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveLeaderboard;
