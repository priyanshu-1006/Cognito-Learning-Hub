import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "./Button";
import { useShare } from "../../hooks/useShare";
import { useHaptic } from "../../hooks/useHaptic";
import { motion } from "framer-motion";

/**
 * ShareButton component for sharing quiz results, achievements, etc.
 */
export const ShareButton = ({
  type = "quiz",
  data,
  variant = "outline",
  size = "default",
  className = "",
}) => {
  const { shareQuizResult, shareAchievement, shareLeaderboard, canShare } =
    useShare();
  const { light } = useHaptic();

  const handleShare = async () => {
    light();

    try {
      let success = false;

      switch (type) {
        case "quiz":
          success = await shareQuizResult(
            data.title,
            data.score,
            data.totalQuestions,
            data.percentage
          );
          break;

        case "achievement":
          success = await shareAchievement(data.title, data.description);
          break;

        case "leaderboard":
          success = await shareLeaderboard(
            data.rank,
            data.score,
            data.totalParticipants
          );
          break;

        default:
          console.warn("Unknown share type:", type);
      }

      if (!success) {
        console.log("Share was cancelled or failed");
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  if (!canShare) return null; // Don't show button if Web Share API is not supported

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={className}
      aria-label="Share"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share
    </Button>
  );
};

/**
 * Floating share button for mobile (bottom-right FAB)
 */
export const FloatingShareButton = ({ type, data }) => {
  const { shareQuizResult, shareAchievement, shareLeaderboard } = useShare();
  const { light } = useHaptic();

  const handleShare = async () => {
    light();

    switch (type) {
      case "quiz":
        await shareQuizResult(
          data.title,
          data.score,
          data.totalQuestions,
          data.percentage
        );
        break;
      case "achievement":
        await shareAchievement(data.title, data.description);
        break;
      case "leaderboard":
        await shareLeaderboard(data.rank, data.score, data.totalParticipants);
        break;
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      aria-label="Share"
    >
      <Share2 className="w-6 h-6" />
    </motion.button>
  );
};

export default ShareButton;
