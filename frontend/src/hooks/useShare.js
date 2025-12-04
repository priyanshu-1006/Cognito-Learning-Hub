import { useState } from "react";

/**
 * Hook for Web Share API with fallback
 */
export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const isSupported = typeof navigator !== "undefined" && "share" in navigator;

  const share = async ({ title, text, url, files }) => {
    if (!isSupported) {
      // Fallback: copy to clipboard
      try {
        const shareText = `${title}\n${text}\n${url}`;
        await navigator.clipboard.writeText(shareText);
        return { success: true, method: "clipboard" };
      } catch (error) {
        console.error("Share failed:", error);
        return { success: false, error };
      }
    }

    setIsSharing(true);

    try {
      const shareData = {
        title,
        text,
        url,
      };

      // Only include files if supported
      if (files && navigator.canShare && navigator.canShare({ files })) {
        shareData.files = files;
      }

      await navigator.share(shareData);
      setIsSharing(false);
      return { success: true, method: "native" };
    } catch (error) {
      setIsSharing(false);

      // User cancelled share - not an error
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }

      console.error("Share failed:", error);
      return { success: false, error };
    }
  };

  // Helper methods for common share scenarios
  const shareQuizResult = async (quizTitle, score, totalQuestions) => {
    const percentage = Math.round((score / totalQuestions) * 100);
    return share({
      title: `Quiz Result: ${quizTitle}`,
      text: `I scored ${score}/${totalQuestions} (${percentage}%) on "${quizTitle}" at Cognito Learning Hub! 🎯`,
      url: window.location.origin,
    });
  };

  const shareAchievement = async (achievementName, description) => {
    return share({
      title: `New Achievement Unlocked! 🏆`,
      text: `I just earned "${achievementName}" on Cognito Learning Hub!\n${description}`,
      url: window.location.origin,
    });
  };

  const shareLeaderboard = async (quizTitle, rank, totalParticipants) => {
    return share({
      title: `Leaderboard - ${quizTitle}`,
      text: `I ranked #${rank} out of ${totalParticipants} participants in "${quizTitle}"! 🏆`,
      url: window.location.href,
    });
  };

  return {
    share,
    shareQuizResult,
    shareAchievement,
    shareLeaderboard,
    isSharing,
    isSupported,
  };
};

export default useShare;
