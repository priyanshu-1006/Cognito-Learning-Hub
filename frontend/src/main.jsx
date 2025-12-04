import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext"; // Import the provider
import App from "./App.jsx";
import "./index.css";
import "./enhanced-animations.css"; // Modern animations and effects
import "./glassmorphism.css"; // Glassmorphism utilities
import "./styles/mobile-optimizations.css"; // Mobile performance optimizations
import {
  registerServiceWorker,
  unregisterServiceWorker,
} from "./utils/serviceWorkerRegistration";

// Register service worker only in production (prevents Vite HMR issues in dev)
if (import.meta.env.PROD) {
  registerServiceWorker();
} else {
  // Unregister any existing service worker in development
  unregisterServiceWorker();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
      onScriptLoadError={() =>
        console.error("Google OAuth script failed to load")
      }
      onScriptLoadSuccess={() =>
        console.log("Google OAuth script loaded successfully")
      }
      auto_select={false}
      cancel_on_tap_outside={false}
      use_fedcm_for_prompt={false}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
