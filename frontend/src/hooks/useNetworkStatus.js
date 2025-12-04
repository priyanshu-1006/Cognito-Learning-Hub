import { useState, useEffect } from "react";

/**
 * Hook to monitor network status and connection quality
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState("unknown");
  const [effectiveType, setEffectiveType] = useState("4g");
  const [downlink, setDownlink] = useState(null);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionInfo = () => {
      if (
        "connection" in navigator ||
        "mozConnection" in navigator ||
        "webkitConnection" in navigator
      ) {
        const connection =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;

        setConnectionType(connection.type || "unknown");
        setEffectiveType(connection.effectiveType || "4g");
        setDownlink(connection.downlink || null);
        setSaveData(connection.saveData || false);
      }
    };

    // Initial status
    updateOnlineStatus();
    updateConnectionInfo();

    // Event listeners
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Connection change listener
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", updateConnectionInfo);
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);

      if ("connection" in navigator) {
        navigator.connection.removeEventListener(
          "change",
          updateConnectionInfo
        );
      }
    };
  }, []);

  // Helper to determine if connection is slow
  const isSlowConnection = () => {
    return (
      effectiveType === "slow-2g" ||
      effectiveType === "2g" ||
      (downlink && downlink < 1)
    );
  };

  // Helper to determine if should reduce data usage
  const shouldReduceData = () => {
    return saveData || isSlowConnection();
  };

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    effectiveType,
    downlink,
    saveData,
    isSlowConnection: isSlowConnection(),
    shouldReduceData: shouldReduceData(),
  };
};

export default useNetworkStatus;
