import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Gamepad2,
  MessageCircle,
  Mail,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
  Star,
  Zap,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { LoadingSpinner } from "../components/ui/Loading";
import GoogleAuthButton from "../components/GoogleAuthButton";
import RoleSelectionModal from "../components/ui/RoleSelectionModal";
import { staggerContainer, staggerItem, fadeInUp } from "../lib/utils";

const carouselItems = [
  {
    icon: Sparkles,
    title: "AI-Powered Quiz Creation",
    description:
      "Generate engaging quizzes from any topic or document in seconds with advanced AI.",
    stats: "50K+ Quizzes Created",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Gamepad2,
    title: "Interactive & Fun Learning",
    description:
      "Experience a modern, gamified quiz player that makes learning enjoyable and addictive.",
    stats: "98% Student Satisfaction",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: MessageCircle,
    title: "24/7 AI Tutor Support",
    description:
      "Get clear, instant explanations from your personal AI tutor, available anytime.",
    stats: "10K+ Questions Answered",
    color: "from-purple-500 to-pink-600",
  },
];

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-white/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

const SuccessModal = ({ title, message, onClose }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 bg-black backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 border border-gray-200 dark:border-gray-700"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
        >
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <Button onClick={onClose} className="w-full" variant="success">
          Continue ✨
        </Button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useContext(AuthContext);

  // Google OAuth handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");
      console.log("Google OAuth initiated");

      // Send credential to backend for verification
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        "https://quizwise-ai-server.onrender.com";
      console.log("Using API URL:", apiUrl);

      const response = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (response.ok) {
        // Extract user and token from response
        const user = data.data?.user || data.user;
        const token = data.data?.accessToken || data.accessToken;

        if (!token) {
          console.error("No token in response:", data);
          setError("Authentication failed - no token received");
          return;
        }

        console.log("User data:", user);
        console.log("Token received:", token ? "Yes" : "No");

        // Check if this is a new user with default role
        if (user.role === "Student" && data.isNewUser) {
          // Show role selection for new users
          setPendingGoogleUser({
            token,
            user,
            userInfo: {
              name: user.name,
              email: user.email,
              picture: user.picture,
            },
          });
          setShowRoleSelection(true);
        } else {
          // Existing user or user with specific role - proceed with login
          login(token);
          console.log("Login successful, redirecting to:", user.role);

          // Redirect based on user role
          setTimeout(() => {
            if (user.role === "admin") {
              navigate("/admin");
            } else if (user.role === "Teacher") {
              navigate("/teacher-dashboard");
            } else {
              navigate("/dashboard"); // Student dashboard
            }
          }, 1000);
        }
      } else {
        console.error("Backend error:", data);
        setError(data.message || "Failed to login with Google");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError("Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Google OAuth error");
    setError("Google login failed. Please try again.");
  };

  // Handle role selection for new Google OAuth users
  const handleRoleSelect = async (selectedRole) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        "https://quizwise-ai-server.onrender.com";
      const response = await fetch(`${apiUrl}/api/auth/google/update-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pendingGoogleUser.token}`,
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.token || data.data?.accessToken;
        login(token);
        setShowRoleSelection(false);
        setPendingGoogleUser(null);

        // Redirect based on selected role
        setTimeout(() => {
          if (selectedRole === "Teacher") {
            navigate("/teacher-dashboard");
          } else {
            navigate("/dashboard"); // Student dashboard
          }
        }, 1000);
      } else {
        setError(data.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Role selection error:", error);
      setError("Failed to update role");
    }
  };

  const handleRoleModalClose = () => {
    setShowRoleSelection(false);
    setPendingGoogleUser(null);
    setError("");
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User already logged in, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    console.log("Login attempt:", { email: formData.email }); // Debug log

    try {
      const API_URL = `${import.meta.env.VITE_API_URL}/api/auth/login`;
      console.log("API URL:", API_URL); // Debug log

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status); // Debug log

      const data = await response.json();
      console.log("Response data:", data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      // Login the user first - handle both old and new response format
      const token =
        data.token || data.data?.accessToken || data.message?.accessToken;
      if (!token) {
        console.error("Full response data:", data);
        throw new Error("No authentication token received");
      }
      login(token);

      // Small delay to ensure auth state is updated
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 100);
    } catch (err) {
      console.error("Login error:", err); // Debug log
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4 pt-20">
      {showSuccessModal && (
        <SuccessModal
          title="🎉 Welcome Back!"
          message="Login successful! Get ready to supercharge your learning journey."
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/dashboard", { replace: true });
          }}
        />
      )}

      {/* Role Selection Modal for Google OAuth */}
      <RoleSelectionModal
        isOpen={showRoleSelection}
        userInfo={pendingGoogleUser?.userInfo}
        onRoleSelect={handleRoleSelect}
        onClose={handleRoleModalClose}
      />

      <motion.div
        className="relative flex w-full max-w-6xl min-h-[700px] bg-white/80 dark:bg-gray-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white dark:border-gray-700"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Left Side: Enhanced Carousel */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            <FloatingParticles />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge
                variant="secondary"
                className="mb-4 bg-white/20 text-white border-white/30"
              >
                <Star className="w-4 h-4 mr-2" />⭐ 4.9/5 Rating
              </Badge>
              <h2 className="text-4xl font-bold mb-2">Cognito Learning Hub</h2>
              <p className="text-indigo-100">The Future of Learning is Here</p>
            </motion.div>

            {/* Dynamic Carousel Content */}
            <div className="relative h-80 flex items-center">
              <AnimatePresence mode="wait">
                {carouselItems.map((item, index) => {
                  if (index !== activeIndex) return null;
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      className="text-center w-full"
                      initial={{ opacity: 0, x: 100, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -100, scale: 0.8 }}
                      transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      <motion.div
                        className={`flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-r ${item.color} mb-6 mx-auto shadow-2xl`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        animate={{
                          boxShadow: [
                            "0 10px 30px rgba(0,0,0,0.3)",
                            "0 15px 40px rgba(0,0,0,0.4)",
                            "0 10px 30px rgba(0,0,0,0.3)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Icon className="h-10 w-10 text-white" />
                      </motion.div>
                      <h3 className="text-3xl font-bold mb-4">{item.title}</h3>
                      <p className="text-lg text-indigo-100 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                      <Badge
                        variant="success"
                        className="bg-white/20 text-white border-white/30"
                      >
                        {item.stats}
                      </Badge>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Enhanced Carousel Indicators */}
            <div className="flex justify-center gap-3">
              {carouselItems.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? "bg-white w-12"
                      : "bg-white/50 hover:bg-white/70 w-3"
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Enhanced Login Form */}
        <motion.div
          className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div className="text-center mb-8" variants={staggerItem}>
            <motion.h1
              className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Welcome Back! 👋
            </motion.h1>
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                Sign up now →
              </Link>
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            variants={staggerItem}
          >
            {error && (
              <motion.div
                className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  icon={Mail}
                  className="pl-12"
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  icon={Lock}
                  className="pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold"
                variant="hero"
                glow={true}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner className="mr-2" />
                    Logging in...
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    🚀 Login to Cognito Learning Hub
                    <Zap className="w-5 h-5 ml-2" />
                  </span>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Social Login Divider */}
          <motion.div className="flex items-center my-6" variants={staggerItem}>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <div className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
              Or continue with
            </div>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </motion.div>

          {/* Google OAuth Button */}
          <motion.div variants={staggerItem}>
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="Sign in with Google"
              variant="outline"
              className="w-full"
            />
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400"
            variants={staggerItem}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>10K+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
