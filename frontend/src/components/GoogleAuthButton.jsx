import React, { useState } from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { Chrome, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const GoogleAuthButton = ({
  onSuccess,
  onError,
  text = "Continue with Google",
  variant = "default",
  className = "",
  disabled = false,
}) => {
  const handleSuccess = (credentialResponse) => {
    console.log("Google OAuth successful");
    // Just pass the credential to parent component
    onSuccess(credentialResponse);
  };

  const handleError = () => {
    console.error(
      "Google OAuth error: User cancelled or authentication failed"
    );
    if (onError) {
      onError();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Use GoogleLogin component from @react-oauth/google */}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        type="standard"
        theme={variant === "outline" ? "outline" : "filled_blue"}
        size="large"
        text={text === "Continue with Google" ? "continue_with" : "signin_with"}
        shape="rectangular"
        logo_alignment="left"
        width="100%"
      />
    </div>
  );
};

// Alternative component for direct Google Login button (uses custom flow to avoid COOP)
export const GoogleLoginButton = ({ onSuccess, onError, className = "" }) => {
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );
        const userInfo = await userInfoResponse.json();

        onSuccess({ credential: tokenResponse.access_token, userInfo });
      } catch (error) {
        console.error("Google OAuth error:", error);
        onError(error);
      }
    },
    onError: () => {
      console.error("Google OAuth failed");
      onError();
    },
    flow: "implicit",
  });

  return (
    <motion.button
      onClick={() => loginWithGoogle()}
      className={`inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Chrome className="w-5 h-5" />
      <span className="font-medium">Continue with Google</span>
    </motion.button>
  );
};

export default GoogleAuthButton;
