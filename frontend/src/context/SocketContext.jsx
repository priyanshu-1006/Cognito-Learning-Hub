import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { getSocketUrl } from "../lib/apiConfig";

const SocketContext = createContext(null);

// Hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const socketRef = useRef(null);

  useEffect(() => {
    // Get backend URL from environment (with trailing slash removed)
    const SOCKET_URL = getSocketUrl();

    console.log("🔌 Initializing Socket.IO connection to:", SOCKET_URL);
    console.log("📍 Environment:", import.meta.env.MODE);
    console.log("🌐 VITE_API_URL:", import.meta.env.VITE_API_URL);
    console.log("🔌 VITE_SOCKET_URL:", import.meta.env.VITE_SOCKET_URL);

    // Create socket connection with optimized settings
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 10000,
      autoConnect: true, // Auto-connect enabled
      withCredentials: true, // Send cookies with requests
      forceNew: false, // Reuse existing connection
      upgrade: true, // Allow transport upgrades
      rememberUpgrade: true, // Remember successful upgrade
    });

    socketRef.current = socketInstance;

    // Connection established
    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connected! ID:", socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    });

    // Connection error
    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error.message);
      setIsConnected(false);
      reconnectAttempts.current += 1;

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionError(
          "Unable to connect to server. Please check your internet connection."
        );
      } else {
        setConnectionError(
          `Connection issue. Retrying... (${reconnectAttempts.current}/${maxReconnectAttempts})`
        );
      }
    });

    // Disconnection
    socketInstance.on("disconnect", (reason) => {
      console.warn("⚠️ Socket.IO disconnected. Reason:", reason);
      setIsConnected(false);

      // Only auto-reconnect if it was an unexpected disconnect
      if (reason === "io server disconnect") {
        // Server disconnected, manually reconnect
        socketInstance.connect();
      }
      // Don't reconnect on "io client disconnect" (manual disconnect)
    });

    // Reconnection attempt
    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    // Reconnected successfully
    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    });

    // Reconnection failed
    socketInstance.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed after maximum attempts");
      setConnectionError("Connection lost. Please refresh the page.");
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log("🔌 Disconnecting Socket.IO...");
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
