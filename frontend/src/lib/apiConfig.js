/**
 * API Configuration for Microservices Architecture
 * All requests go through API Gateway (http://localhost:3000)
 * 
 * ⚠️ NEVER call microservices directly from frontend!
 * Always use the API Gateway URL.
 */

/**
 * Get the API Gateway URL from environment variables
 * Ensures no trailing slash for consistent URL construction
 */
export const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  // Remove trailing slash if present
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
};

/**
 * Get the Socket.IO server URL from environment variables
 * Socket connections also go through API Gateway which proxies to Live Service
 */
export const getSocketUrl = () => {
  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000";
  // Remove trailing slash if present
  return socketUrl.endsWith("/") ? socketUrl.slice(0, -1) : socketUrl;
};

/**
 * Get WebSocket URL for Live Quiz Sessions (direct to Live Service)
 * Only for Socket.IO WebSocket connections
 */
export const getWsUrl = () => {
  const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3004";
  return wsUrl.endsWith("/") ? wsUrl.slice(0, -1) : wsUrl;
};

/**
 * Get WebSocket URL for Meeting Service (WebRTC signaling)
 * Only for Socket.IO WebSocket connections
 */
export const getMeetingWsUrl = () => {
  const meetingWsUrl = import.meta.env.VITE_MEETING_WS_URL || "ws://localhost:3009";
  return meetingWsUrl.endsWith("/") ? meetingWsUrl.slice(0, -1) : meetingWsUrl;
};

/**
 * Construct an API endpoint URL
 * @param {string} endpoint - The API endpoint (should start with /)
 * @returns {string} The complete API URL through Gateway
 */
export const apiUrl = (endpoint) => {
  const baseUrl = getApiUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
};

/**
 * Get Google OAuth Client ID
 */
export const getGoogleClientId = () => {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
};

/**
 * Check if debug mode is enabled
 */
export const isDebugEnabled = () => {
  return import.meta.env.VITE_ENABLE_DEBUG === 'true';
};

/**
 * Get log level
 */
export const getLogLevel = () => {
  return import.meta.env.VITE_LOG_LEVEL || 'info';
};

/**
 * Feature flags
 */
export const features = {
  liveQuiz: import.meta.env.VITE_ENABLE_LIVE_QUIZ === 'true',
  meetings: import.meta.env.VITE_ENABLE_MEETINGS === 'true',
  social: import.meta.env.VITE_ENABLE_SOCIAL === 'true',
  gamification: import.meta.env.VITE_ENABLE_GAMIFICATION === 'true',
  moderation: import.meta.env.VITE_ENABLE_MODERATION === 'true',
};

/**
 * Log API configuration in development
 */
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    apiUrl: getApiUrl(),
    socketUrl: getSocketUrl(),
    wsUrl: getWsUrl(),
    meetingWsUrl: getMeetingWsUrl(),
    googleClientId: getGoogleClientId() ? '✓ Configured' : '✗ Missing',
    features,
  });
}

export default {
  getApiUrl,
  getSocketUrl,
  getWsUrl,
  getMeetingWsUrl,
  apiUrl,
  getGoogleClientId,
  isDebugEnabled,
  getLogLevel,
  features,
};
