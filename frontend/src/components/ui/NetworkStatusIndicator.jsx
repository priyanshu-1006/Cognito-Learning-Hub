import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium } from "lucide-react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

/**
 * Network status indicator component
 * Shows online/offline status and connection quality
 */
export const NetworkStatusIndicator = ({ className = "" }) => {
  const { isOnline, isOffline, effectiveType, isSlowConnection } =
    useNetworkStatus();
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [justWentOnline, setJustWentOnline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowOfflineNotice(true);
      setJustWentOnline(false);
    } else if (showOfflineNotice) {
      // Was offline, now online
      setJustWentOnline(true);
      setShowOfflineNotice(false);

      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setJustWentOnline(false);
      }, 3000);
    }
  }, [isOnline, isOffline, showOfflineNotice]);

  const getConnectionIcon = () => {
    if (isOffline) return <WifiOff className="w-4 h-4" />;
    if (isSlowConnection) return <SignalLow className="w-4 h-4" />;
    if (effectiveType === "3g") return <SignalMedium className="w-4 h-4" />;
    return <Signal className="w-4 h-4" />;
  };

  const getConnectionColor = () => {
    if (isOffline) return "bg-red-500";
    if (isSlowConnection) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getMessage = () => {
    if (isOffline) return "No internet connection";
    if (justWentOnline) return "Back online";
    if (isSlowConnection) return "Slow connection";
    return null;
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 ${className}`}
        >
          <div
            className={`${getConnectionColor()} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
          >
            {getConnectionIcon()}
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Persistent connection quality badge (optional, for debugging)
 */
export const ConnectionQualityBadge = () => {
  const { effectiveType, downlink, isOnline } = useNetworkStatus();

  if (!isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/90 text-white text-xs px-3 py-1.5 rounded-full z-50 flex items-center gap-2">
      <Signal className="w-3 h-3" />
      <span>{effectiveType}</span>
      {downlink && <span>({downlink.toFixed(1)} Mbps)</span>}
    </div>
  );
};

export default NetworkStatusIndicator;
