import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { apiUrl, getApiUrl } from "../lib/apiConfig";
import {
  Sparkles,
  Gamepad2,
  MessageCircle,
  User,
  Mail,
  Lock,
  CheckCircle,
  UserPlus,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

const carouselItems = [
  {
    icon: Sparkles,
    title: "AI-Powered Quiz Creation",
    description:
      "Generate engaging quizzes from any topic or document in seconds.",
    badge: "Smart AI",
  },
  {
    icon: Gamepad2,
    title: "Interactive & Fun Learning",
    description:
      "Experience a modern, gamified quiz experience that makes learning enjoyable.",
    badge: "Gamified",
  },
  {
    icon: MessageCircle,
    title: "24/7 AI Tutor Support",
    description:
      "Get instant, personalized explanations from your AI tutor anytime.",
    badge: "Always Available",
  },
];

// Floating particles component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x: Math.random() * 400,
            y: Math.random() * 600,
            opacity: 0,
          }}
          animate={{
            y: [null, -20, -40],
            opacity: [0, 1, 0],
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
};

const TechyBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
    <FloatingParticles />

    {/* Animated grid pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    </div>
  </div>
);

const SuccessModal = ({ title, message, onClose }) => (
  <motion.div
    className="fixed inset-0 bg-black backdrop-blur-sm flex items-center justify-center z-50 p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="bg-white/95 dark:bg-gray-900 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center max-w-md mx-auto border border-white/20 dark:border-gray-700"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        {message}
      </p>
      <Button onClick={onClose} variant="hero" className="w-full">
        Proceed to Login
      </Button>
    </motion.div>
  </motion.div>
);

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      type: "spring",
      stiffness: 100,
    },
  },
};

const formVariants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      type: "spring",
      stiffness: 100,
    },
  },
};

const carouselVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Google OAuth handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setMessage("");

      // Send credential to backend for verification
      console.log("Using API URL:", getApiUrl());

      const response = await fetch(apiUrl("/api/auth/google"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.token || data.data?.accessToken;
        login(token);
        setMessage("Account created successfully!");

        // Redirect based on user role
        setTimeout(() => {
          if (data.user.role === "admin") {
            navigate("/admin");
          } else if (data.user.role === "teacher") {
            navigate("/teacher-dashboard");
          } else {
            navigate("/dashboard"); // Student dashboard
          }
        }, 1000);
      } else {
        setMessage(data.error || "Failed to sign up with Google");
      }
    } catch (error) {
      console.error("Google signup error:", error);
      setMessage("Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage("Google signup failed. Please try again.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    console.log("📤 Submitting registration:", {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      hasPassword: !!formData.password,
    });

    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      console.log("📥 Registration response:", data);

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err) => err.msg).join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(data.message || "Something went wrong");
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showSuccessModal && (
        <SuccessModal
          title="Registration Successful!"
          message="Your account has been created. Please proceed to log in to continue."
          onClose={() => navigate("/login")}
        />
      )}

      {/* Main Container */}
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <motion.div
          className="relative flex w-full max-w-6xl h-[700px] bg-white/80 dark:bg-gray-900 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          {/* Left Side: Enhanced Carousel */}
          <motion.div
            className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 text-white flex-col justify-center relative overflow-hidden"
            variants={carouselVariants}
            initial="hidden"
            animate="visible"
          >
            <TechyBackground />

            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="w-8 h-8" />
                  <h2 className="text-3xl font-bold">Join QuizWise AI</h2>
                </div>
                <p className="text-blue-100 text-lg">
                  Start your intelligent learning journey today
                </p>
              </motion.div>

              {/* Enhanced Carousel */}
              <div className="relative h-80">
                {carouselItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      className={`absolute inset-0 flex flex-col items-center text-center transition-all duration-700 ease-in-out ${
                        index === activeIndex
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-8"
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: index === activeIndex ? 1 : 0,
                        scale: index === activeIndex ? 1 : 0.8,
                        y: index === activeIndex ? 0 : 20,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="relative">
                        <motion.div
                          className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 mx-auto border border-white/30"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Icon className="h-10 w-10 text-white" />
                        </motion.div>

                        <Badge
                          variant="secondary"
                          className="mb-4 bg-white/20 text-white border-white/30"
                        >
                          {item.badge}
                        </Badge>
                      </div>

                      <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                      <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
                        {item.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Enhanced Carousel Indicators */}
              <div className="flex justify-center gap-3 mt-8">
                {carouselItems.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`h-3 w-3 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? "bg-white w-10"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>

              {/* Trust Indicators */}
              <motion.div
                className="flex items-center justify-center gap-6 mt-8 text-blue-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm">Fast Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Smart Learning</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side: Enhanced Sign Up Form */}
          <motion.div
            className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative"
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile Header for small screens */}
            <motion.div
              className="lg:hidden text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Join QuizWise AI
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Start your intelligent learning journey
              </p>
            </motion.div>

            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Header */}
              <motion.div
                className="hidden lg:block text-center"
                variants={itemVariants}
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create Account
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="p-4 bg-red-50 dark:bg-red-900 border border-red-200
                   dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-sm backdrop-blur-sm"
                  variants={itemVariants}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <strong>Error:</strong> {error}
                </motion.div>
              )}

              {/* Success Message */}
              {message && (
                <motion.div
                  className="p-4 bg-green-50 dark:bg-green-900 border border-green-200
                   dark:border-green-800 text-green-800 dark:text-green-200 rounded-xl text-sm backdrop-blur-sm"
                  variants={itemVariants}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <strong>Success:</strong> {message}
                </motion.div>
              )}

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <motion.div variants={itemVariants}>
                  <Input
                    icon={User}
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Input
                    icon={Mail}
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Input
                    icon={Lock}
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                  >
                    I am a:
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 backdrop-blur-sm text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-200"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                  </select>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Create Account
                      </div>
                    )}
                  </Button>
                </motion.div>

                {/* Divider */}
                <motion.div className="relative" variants={itemVariants}>
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </motion.div>

                {/* Google Auth Button */}
                <motion.div variants={itemVariants}>
                  <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signup_with"
                  />
                </motion.div>

                {/* Mobile Login Link */}
                <motion.div
                  className="lg:hidden text-center"
                  variants={itemVariants}
                >
                  <p className="text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
