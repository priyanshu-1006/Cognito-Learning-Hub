import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Lenis from "lenis";
import {
  Sparkles,
  Gamepad2,
  MessageCircle,
  Brain,
  Zap,
  Users,
  Award,
  ArrowRight,
  Shield,
  CheckCircle,
  Clock,
  DollarSign,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  ChevronDown,
  Heart,
  Star,
  Globe,
  Lock,
  BookOpen,
  ListChecks,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import FloatingIconsBackground from "./FloatingIconsBackground";
import { staggerContainer, staggerItem, fadeInUp } from "../lib/utils";
import "../animations.css";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const lenisRef = useRef(null);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Lenis smooth scrolling
  useEffect(() => {
    if (!isLoading) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: "vertical",
        gestureDirection: "vertical",
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      lenisRef.current = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    }
  }, [isLoading]);

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Cognito Learning Hub",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser",
    url: "https://cognito-learning-hub.live",
    description:
      "AI-powered quiz creation platform for educators and students with social learning features",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "10000",
    },
    creator: {
      "@type": "Organization",
      name: "OPTIMISTIC MUTANT CODERS",
    },
  };

  // FAQ Data
  const faqData = [
    {
      question: "How does AI quiz generation work?",
      answer:
        "Our AI analyzes your topic or uploaded content using advanced natural language processing to generate relevant, high-quality questions with multiple choice answers, explanations, and difficulty levels.",
    },
    {
      question: "Is Cognito Learning Hub really free?",
      answer:
        "Yes! Our core features including AI quiz generation, taking quizzes, and basic analytics are completely free forever. Premium features like advanced analytics and team management are available in paid plans.",
    },
    {
      question: "What file formats can I upload for quiz generation?",
      answer:
        "You can upload PDF documents, text files, and even paste YouTube video links. Our AI will extract the content and create relevant quizzes automatically.",
    },
    {
      question: "Can I use Cognito Learning Hub for corporate training?",
      answer:
        "Absolutely! Cognito Learning Hub is perfect for HR teams, L&D professionals, and corporate trainers. Create engaging assessments for employee onboarding, compliance training, and skill development.",
    },
    {
      question: "How secure is my data?",
      answer:
        "We take data security seriously. All data is encrypted in transit and at rest, we're GDPR compliant, and we never share your content with third parties.",
    },
  ];

  // Social sharing messages
  const shareMessages = {
    twitter:
      "🚀 Just discovered Cognito Learning Hub - it creates amazing quizzes using AI in seconds! Perfect for teachers and students. Check it out: https://cognito-learning.com #EdTech #AI #Education",
    linkedin:
      "Revolutionizing education with Cognito Learning Hub! 🎓 This AI-powered platform lets you create engaging quizzes from any topic or document in seconds. Perfect for L&D professionals and educators. Try it free: https://cognito-learning.com",
    facebook:
      "🎯 Amazing discovery! Cognito Learning Hub uses AI to create educational quizzes instantly. Whether you're a teacher, student, or training professional, this tool is a game-changer. Check it out: https://cognito-learning.com",
    generic:
      "Transform your teaching with Cognito Learning Hub! Create AI-powered quizzes in seconds, engage students with real-time multiplayer, and track progress with advanced analytics. Made with team OPTIMISTIC MUTANT CODERS: https://cognito-learning.com",
  };

  const handleShare = (platform) => {
    const message = shareMessages[platform];
    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          message
        )}`;
        break;
      case "linkedin":
        shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          "https://cognito-learning.com"
        )}&summary=${encodeURIComponent(message)}`;
        break;
      case "facebook":
        shareUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          "https://cognito-learning.com"
        )}&quote=${encodeURIComponent(message)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareMessages.generic);
        alert("✅ Message copied to clipboard!");
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  // Loading Component
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mx-auto flex items-center justify-center"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity },
          }}
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Cognito Learning Hub is warming up its AI
          </h2>
          <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
            Built by OPTIMISTIC MUTANT CODERS with{" "}
            <Heart className="w-4 h-4 text-red-500 animate-pulse" />
          </p>
        </motion.div>

        {/* Loading animation */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-indigo-600 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      <main
        className="relative overflow-hidden transition-colors duration-300"
        role="main"
      >
        {/* Background */}
        <div className="absolute inset-0 w-full h-full">
          <FloatingIconsBackground />
        </div>

        <div className="relative z-10 space-y-20 md:space-y-32">
          {/* Hero Section - Left Aligned with Optimized Spacing */}
          <motion.section
            className="grid md:grid-cols-[1.2fr_1fr] gap-16 items-center pt-4 pb-16 md:pt-6 md:pb-20"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            aria-labelledby="hero-heading"
          >
            <motion.div className="text-left space-y-8" variants={staggerItem}>
              <motion.div variants={fadeInUp} className="inline-block">
                <Badge
                  variant="gradient"
                  size="lg"
                  className="mb-6 relative overflow-hidden group cursor-default pulse-glow"
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-80"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  />

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Content */}
                  <span className="relative z-10 flex items-center gap-2">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    <motion.span
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      🔥 AI-Powered Learning Platform
                    </motion.span>
                  </span>
                </Badge>
              </motion.div>

              <motion.h1
                id="hero-heading"
                className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6"
                variants={fadeInUp}
              >
                Your All-in-One Platform for{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  AI-Powered Learning
                </span>
              </motion.h1>

              <motion.p
                className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mb-10"
                variants={fadeInUp}
              >
                Turn any PDF into an interactive mock test, get instant
                doubt-solving, and track your progress—all in one place. Join{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  10,000+
                </span>{" "}
                learners already transforming their education with Cognito
                Learning Hub.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-12"
                variants={fadeInUp}
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <Link to="/signup">
                    <span className="flex items-center gap-2">
                      Start Learning for Free
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-10 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Link to="#demo">
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                      Watch Demo
                    </span>
                  </Link>
                </Button>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                className="flex flex-wrap gap-8 pt-8 border-t border-gray-200 dark:border-gray-700"
                variants={fadeInUp}
              >
                <div className="text-left">
                  <motion.div
                    className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    10K+
                  </motion.div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Active Users
                  </div>
                </div>
                <div className="text-left">
                  <motion.div
                    className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mb-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    50K+
                  </motion.div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Quizzes Created
                  </div>
                </div>
                <div className="text-left p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800">
                  <motion.div
                    className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    98%
                  </motion.div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Satisfaction
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="hidden md:block"
              variants={staggerItem}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                {/* Product Mockup Container - Browser-style Frame */}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Browser Chrome */}
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 mx-4 bg-white dark:bg-gray-700 rounded px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                      cognito-learning-hub.com/create-quiz
                    </div>
                  </div>

                  {/* Product Screenshot Placeholder */}
                  <div className="relative aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-8">
                    <div className="space-y-6">
                      {/* Upload Area Mockup */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700">
                        <div className="flex items-center justify-center gap-4">
                          <svg
                            className="w-10 h-10 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              Drop your PDF here
                            </div>
                            <div className="text-sm text-gray-500">
                              or click to browse
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Processing Indicator */}
                      <motion.div
                        className="bg-indigo-100 dark:bg-indigo-900/30 rounded-xl p-4 flex items-center gap-3"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                        <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                          AI is generating your quiz...
                        </span>
                      </motion.div>

                      {/* Generated Question Preview */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            QUESTION 1
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded w-full"></div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge */}
                    <motion.div
                      className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap className="w-3 h-3" />
                      AI-Powered
                    </motion.div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-3xl -z-10"></div>
              </div>
            </motion.div>
          </motion.section>

          {/* Features Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-16"
          >
            <motion.div
              className="text-center space-y-6"
              variants={staggerItem}
            >
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Everything You Need in One Platform
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Powerful tools for both students and educators to create, learn,
                and grow together.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-10"
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem}>
                <Card className="h-full text-center group card-lift border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-10">
                    <motion.div
                      className="flex items-center justify-center h-20 w-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-6 mx-auto text-indigo-600 dark:text-indigo-400"
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles className="h-10 w-10" />
                    </motion.div>
                    <CardTitle className="mb-4 text-xl">
                      AI-Powered Creation
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Generate quizzes from a topic, PDF, or simple text
                      description. Save hours of prep time with intelligent AI
                      assistance.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card className="h-full text-center group card-lift border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-10">
                    <motion.div
                      className="flex items-center justify-center h-20 w-20 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-6 mx-auto text-green-600 dark:text-green-400"
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Gamepad2 className="h-10 w-10" />
                    </motion.div>
                    <CardTitle className="mb-4 text-xl">
                      Interactive Quizzes
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Engage with a modern quiz player that provides instant
                      feedback, tracks progress, and celebrates achievements.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card className="h-full text-center group card-lift border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-10">
                    <motion.div
                      className="flex items-center justify-center h-20 w-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 mb-6 mx-auto text-orange-600 dark:text-orange-400"
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      <MessageCircle className="h-10 w-10" />
                    </motion.div>
                    <CardTitle className="mb-4 text-xl">
                      AI Tutor Support
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Get instant help with any academic question from your
                      personal AI tutor, available 24/7 for all subjects.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Interactive Demo Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-12"
          >
            <motion.div
              className="text-center space-y-4"
              variants={staggerItem}
            >
              <Badge variant="gradient" size="lg" className="mb-4">
                <Zap className="w-4 h-4 mr-2" />
                🎮 Try It Live
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Experience the Magic in Action
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                See how Cognito Learning Hub transforms learning with real-time
                demos and interactive previews.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-2 gap-8"
              variants={staggerContainer}
            >
              {/* AI Quiz Generator Demo */}
              <motion.div variants={staggerItem}>
                <Card className="h-full overflow-hidden group card-lift shadow-large spotlight">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 glass">
                    <CardTitle className="flex items-center gap-3">
                      <motion.div
                        className="p-2 bg-blue-500 rounded-lg text-white"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Brain className="w-5 h-5" />
                      </motion.div>
                      AI Quiz Generator
                    </CardTitle>
                    <CardDescription>
                      Watch AI create a quiz in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Mock AI Generation Process */}
                      <motion.div
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-blue-500 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-sm">
                          Analyzing topic: "Solar System"
                        </span>
                      </motion.div>

                      <motion.div
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-green-500 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.5,
                          }}
                        />
                        <span className="text-sm">
                          Generated 5 questions in 3.2s ⚡
                        </span>
                      </motion.div>

                      <motion.div
                        className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          🪐 Sample Question Generated:
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          "Which planet is known as the Red Planet?"
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Mars ✓", "Venus", "Jupiter", "Saturn"].map(
                            (option, idx) => (
                              <motion.span
                                key={idx}
                                className={`px-2 py-1 text-xs rounded ${
                                  idx === 0
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ delay: 2 + idx * 0.1 }}
                              >
                                {option}
                              </motion.span>
                            )
                          )}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                      >
                        <Button
                          className="w-full group mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          variant="default"
                          glow={true}
                        >
                          <Link
                            to="/quiz-maker"
                            className="flex items-center justify-center gap-2"
                          >
                            <motion.span
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              🚀 Try AI Generator
                            </motion.span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Live Activity Feed */}
              <motion.div variants={staggerItem}>
                <Card className="h-full overflow-hidden group card-lift shadow-large spotlight">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 glass">
                    <CardTitle className="flex items-center gap-3">
                      <motion.div
                        className="p-2 bg-green-500 rounded-lg text-white"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Users className="w-5 h-5" />
                      </motion.div>
                      Live Activity Feed
                    </CardTitle>
                    <CardDescription>
                      Real-time learning happening now
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {[
                        {
                          name: "Sarah M.",
                          action: "completed",
                          quiz: "Math Quiz",
                          score: "95%",
                          time: "2m ago",
                          color: "green",
                        },
                        {
                          name: "Alex K.",
                          action: "created",
                          quiz: "History Test",
                          score: "New",
                          time: "5m ago",
                          color: "blue",
                        },
                        {
                          name: "Maya P.",
                          action: "achieved",
                          quiz: "Perfect Score!",
                          score: "100%",
                          time: "8m ago",
                          color: "yellow",
                        },
                        {
                          name: "John D.",
                          action: "started",
                          quiz: "Science Quiz",
                          score: "In Progress",
                          time: "12m ago",
                          color: "purple",
                        },
                      ].map((activity, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                        >
                          <motion.div
                            className={`w-3 h-3 rounded-full bg-${activity.color}-500`}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: idx * 0.3,
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.name} {activity.action} "{activity.quiz}
                              "
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                              <span>{activity.score}</span>
                              <span>{activity.time}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      <motion.div
                        className="text-center pt-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <Badge variant="success" className="animate-pulse">
                          🔥 Join 50+ active learners right now!
                        </Badge>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Stats Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="animated-gradient rounded-3xl p-12 text-white shadow-2xl reveal-scale"
          >
            <motion.div
              className="grid md:grid-cols-4 gap-8 text-center"
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem}>
                <div className="space-y-2">
                  <motion.div
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    10K+
                  </motion.div>
                  <p className="text-indigo-100 dark:text-indigo-200">
                    Active Users
                  </p>
                </div>
              </motion.div>

              <motion.div variants={staggerItem}>
                <div className="space-y-2">
                  <motion.div
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    50K+
                  </motion.div>
                  <p className="text-indigo-100 dark:text-indigo-200">
                    Quizzes Created
                  </p>
                </div>
              </motion.div>

              <motion.div variants={staggerItem}>
                <div className="space-y-2">
                  <motion.div
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    5K+
                  </motion.div>
                  <p className="text-indigo-100 dark:text-indigo-200">
                    Educators Teaching
                  </p>
                </div>
              </motion.div>

              <motion.div variants={staggerItem}>
                <div className="space-y-2">
                  <motion.div
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    99%
                  </motion.div>
                  <p className="text-indigo-100 dark:text-indigo-200">
                    Satisfaction Rate
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* How It Works Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-12"
          >
            <motion.div
              className="text-center space-y-4 mb-12"
              variants={staggerItem}
            >
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Get Started in 3 Easy Steps
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                From concept to quiz in minutes.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-12"
              variants={staggerContainer}
            >
              <motion.div className="text-center" variants={staggerItem}>
                <motion.div
                  className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6 mx-auto text-2xl font-bold"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  1
                </motion.div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Sign Up
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Create your free account and choose your role: Student or
                  Teacher.
                </p>
              </motion.div>

              <motion.div className="text-center" variants={staggerItem}>
                <motion.div
                  className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-white mb-6 mx-auto text-2xl font-bold"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  2
                </motion.div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Create or Take
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Teachers create quizzes with AI, students browse and take
                  them.
                </p>
              </motion.div>

              <motion.div className="text-center" variants={staggerItem}>
                <motion.div
                  className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white mb-6 mx-auto text-2xl font-bold"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  3
                </motion.div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Learn & Improve
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Track progress, compete on leaderboards, and learn with AI
                  assistance.
                </p>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Why Choose Our AI Tutor - 2x2 Feature Grid */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-16"
          >
            <motion.div
              className="text-center space-y-6"
              variants={staggerItem}
            >
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Why Chat With Our AI?
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Get instant, personalized support whenever you need it
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-2 gap-8"
              variants={staggerContainer}
            >
              {/* Feature 1: Conceptual Clarity */}
              <motion.div variants={staggerItem}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Brain className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          Conceptual Clarity
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          Get deep explanations that help you truly understand
                          concepts, not just memorize answers.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 2: 24/7 Doubt Solving */}
              <motion.div variants={staggerItem}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Clock className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          24/7 Doubt Solving
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          Never wait for help. Get instant answers to your
                          questions any time, day or night.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 3: Multi-Subject Support */}
              <motion.div variants={staggerItem}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          Multi-Subject Support
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          From Math to Science to History—our AI is trained
                          across all major subjects and grade levels.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 4: Step-by-Step Solutions */}
              <motion.div variants={staggerItem}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <ListChecks className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          Step-by-Step Solutions
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          Learn the process, not just the answer. Our AI breaks
                          down complex problems into simple steps.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Testimonials Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-16 reveal-fade-up"
          >
            <motion.div
              className="text-center space-y-6"
              variants={staggerItem}
            >
              <Badge variant="gradient" size="lg" className="mb-4 pulse-ring">
                <Award className="w-4 h-4 mr-2" />
                💝 Success Stories
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Loved by Students and Teachers Worldwide
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Join thousands of learners who are transforming their education
                with Cognito Learning Hub
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-10"
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem}>
                <Card className="h-full group border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-10 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <motion.div
                        className="flex text-yellow-400 text-lg"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5, staggerChildren: 0.1 }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <motion.span
                            key={i}
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          >
                            ⭐
                          </motion.span>
                        ))}
                      </motion.div>
                      <Badge variant="success" size="sm">
                        Teacher
                      </Badge>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-8 relative z-10 text-base leading-relaxed">
                      "🚀 Cognito Learning Hub has completely revolutionized my
                      classroom! I can create engaging quizzes in under 30
                      seconds. My students are more motivated than ever!"
                    </p>

                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="h-14 w-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-lg"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        MS
                      </motion.div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          Rakshita
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          High School Science Teacher • �� India
                        </p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card className="h-full group border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-10 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <motion.div
                        className="flex text-yellow-400 text-lg"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.7, staggerChildren: 0.1 }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <motion.span
                            key={i}
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                          >
                            ⭐
                          </motion.span>
                        ))}
                      </motion.div>
                      <Badge variant="secondary" size="sm">
                        Student
                      </Badge>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-8 relative z-10 text-base leading-relaxed">
                      "🎯 The AI Doubt Solver is like having a genius tutor
                      24/7! My grades improved from C+ to A- in just 2 months.
                      This app is pure magic!"
                    </p>

                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="h-14 w-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-lg"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        AK
                      </motion.div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          Amitesh Vishwakarma
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Computer Science Student • 🇮🇳 India
                        </p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card className="h-full group border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-10 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <motion.div
                        className="flex text-yellow-400 text-lg"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.9, staggerChildren: 0.1 }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <motion.span
                            key={i}
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.9 + i * 0.1 }}
                          >
                            ⭐
                          </motion.span>
                        ))}
                      </motion.div>
                      <Badge variant="warning" size="sm">
                        Principal
                      </Badge>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-8 relative z-10 text-base leading-relaxed">
                      "💼 We deployed Cognito Learning Hub across our entire
                      school district. Student engagement is up 300% and teacher
                      productivity has doubled. Outstanding!"
                    </p>

                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="h-14 w-14 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-semibold text-lg"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        DR
                      </motion.div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          Sarah Johnson
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Government Teacher • India{" "}
                        </p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-8 pt-8"
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  4.9/5
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  App Store Rating
                </div>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  10K+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Happy Teachers
                </div>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  500K+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Students Served
                </div>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  50+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Countries
                </div>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="relative text-center bg-indigo-600 dark:bg-indigo-700 rounded-3xl p-16 shadow-2xl overflow-hidden reveal-scale"
          >
            {/* Animated Background Elements */}
            <motion.div
              className="absolute top-0 left-0 w-full h-full opacity-20"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />

            <motion.div
              className="absolute top-4 right-4 text-6xl opacity-10"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              🚀
            </motion.div>

            <motion.div
              className="absolute bottom-4 left-4 text-4xl opacity-10"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              ⭐
            </motion.div>

            <motion.div
              className="relative z-10 space-y-8"
              variants={staggerItem}
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
              >
                <Badge
                  variant="secondary"
                  size="lg"
                  className="mb-6 bg-white/20 text-white border-white/30"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  🎉 Limited Time: Free Premium Features
                </Badge>
              </motion.div>

              <motion.h2
                className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Ready to Revolutionize Your Learning?
              </motion.h2>

              <motion.p
                className="text-base md:text-lg text-white max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-medium"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
              >
                🌟 Join{" "}
                <span className="font-bold text-yellow-300 drop-shadow-md">
                  10,000+
                </span>{" "}
                students and educators who are already transforming education
                with AI-powered learning. Start your journey today!
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-6 pt-8"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                transition={{ delay: 0.6 }}
              >
                <motion.div variants={staggerItem}>
                  <Button
                    asChild
                    size="xl"
                    className="group bg-white text-indigo-700 hover:bg-gray-50 font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 px-12 py-6 text-lg rounded-2xl"
                  >
                    <Link to="/signup">
                      <span className="relative z-10 flex items-center gap-2 font-extrabold">
                        🚀 Start Learning for FREE
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Link>
                  </Button>
                </motion.div>

                <motion.div variants={staggerItem}>
                  <Button
                    asChild
                    variant="outline"
                    size="xl"
                    className="border-3 border-white text-white hover:bg-white hover:text-indigo-700 font-bold backdrop-blur-md px-12 py-6 text-lg rounded-2xl transition-all duration-300 hover:-translate-y-1 shadow-xl"
                  >
                    <Link to="/quizzes">
                      <span
                        className="relative z-10 flex items-center gap-2 font-extrabold drop-shadow-lg"
                        style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
                      >
                        🎯 Explore Quizzes
                      </span>
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                className="flex flex-wrap justify-center items-center gap-6 pt-8 text-white font-semibold"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
              >
                <div className="flex items-center gap-2 drop-shadow-lg">
                  <motion.span
                    className="text-2xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔥
                  </motion.span>
                  <span className="font-bold">10K+ Active Users</span>
                </div>
                <div className="flex items-center gap-2 drop-shadow-lg">
                  <motion.span
                    className="text-2xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    ⚡
                  </motion.span>
                  <span className="font-bold">50K+ Quizzes Created</span>
                </div>
                <div className="flex items-center gap-2 drop-shadow-lg">
                  <motion.span
                    className="text-2xl"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎖️
                  </motion.span>
                  <span className="font-bold">4.9/5 Rating</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Trust Signals Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl"
            aria-labelledby="trust-heading"
          >
            <motion.div className="text-center mb-8" variants={staggerItem}>
              <h2
                id="trust-heading"
                className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
              >
                Trusted by Educators Worldwide
              </h2>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center items-center gap-8"
              variants={staggerContainer}
            >
              <motion.div
                variants={staggerItem}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-sm"
              >
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  SOC 2 Certified
                </span>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-sm"
              >
                <Lock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  GDPR Compliant
                </span>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-sm"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  SSL Secured
                </span>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-sm"
              >
                <Globe className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  50+ Countries
                </span>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-sm"
              >
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  4.9/5 Rating
                </span>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Feature Comparison Table */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-12"
            aria-labelledby="comparison-heading"
          >
            <motion.div
              className="text-center space-y-4"
              variants={staggerItem}
            >
              <h2
                id="comparison-heading"
                className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white"
              >
                Why Choose{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Cognito Learning Hub
                </span>
                ?
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                See how we compare to traditional quiz creation methods
              </p>
            </motion.div>

            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
              variants={staggerItem}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-semibold">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-center text-lg font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Cognito Learning Hub
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-lg font-semibold">
                        Traditional Methods
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        Quiz Creation Time
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                          <Zap className="w-4 h-4" />
                          <span className="font-bold">30 seconds</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                          <Clock className="w-4 h-4" />
                          <span>2+ hours</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        AI-Powered Generation
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
                          <span className="text-red-500 text-sm">✕</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        Social Learning Features
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
                          <span className="text-red-500 text-sm">✕</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        Real-time Analytics
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                          Limited
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        24/7 AI Tutor Support
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
                          <span className="text-red-500 text-sm">✕</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        Cost
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                          <span className="font-bold">FREE</span>
                          <span className="text-sm">(Premium available)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                          <DollarSign className="w-4 h-4" />
                          <span>$50-200/month</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.section>

          {/* FAQ Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-12 bg-gray-50 dark:bg-gray-800 rounded-3xl p-12"
            aria-labelledby="faq-heading"
          >
            <motion.div
              className="text-center space-y-4"
              variants={staggerItem}
            >
              <h2
                id="faq-heading"
                className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white"
              >
                Frequently Asked Questions
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Everything you need to know about Cognito Learning Hub
              </p>
            </motion.div>

            <motion.div
              className="space-y-4 max-w-3xl mx-auto"
              variants={staggerContainer}
            >
              {faqData.map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-gray-700 rounded-xl shadow-sm overflow-hidden"
                  variants={staggerItem}
                >
                  <button
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    aria-expanded={openFAQ === index}
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openFAQ === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: openFAQ === index ? "auto" : 0,
                      opacity: openFAQ === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-gray-600 dark:text-gray-300">
                      {faq.answer}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* Pricing Preview Section - 3 Column Layout */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-16"
            aria-labelledby="pricing-heading"
          >
            <motion.div
              className="text-center space-y-6"
              variants={staggerItem}
            >
              <h2
                id="pricing-heading"
                className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white"
              >
                Simple, Transparent Pricing
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Get started for free, upgrade when you need more power
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
              variants={staggerContainer}
            >
              {/* Basic (Free) Plan */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                variants={staggerItem}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Basic
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      $0
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Perfect for individual students
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      10 AI-generated quizzes/month
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Access to quiz library
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Basic AI Doubt Solver
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Progress tracking
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Community support
                    </span>
                  </li>
                </ul>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                >
                  <Link to="/signup">Get Started Free</Link>
                </Button>
              </motion.div>

              {/* Student Plan - Highlighted */}
              <motion.div
                className="bg-indigo-600 dark:bg-indigo-700 rounded-2xl shadow-2xl p-8 text-white relative border-2 border-indigo-500 scale-105"
                variants={staggerItem}
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>

                <div className="mb-8 mt-2">
                  <h3 className="text-2xl font-bold mb-2">Student</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-bold">$9</span>
                    <span className="opacity-80">/month</span>
                  </div>
                  <p className="opacity-90">For serious learners</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span>Unlimited AI quizzes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span>Advanced AI Tutor access</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span>Detailed analytics & insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span>Priority doubt resolution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span>Study groups & challenges</span>
                  </li>
                </ul>

                <Button
                  asChild
                  className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Link to="/signup?plan=student">Choose Student</Link>
                </Button>
              </motion.div>

              {/* Pro / Teacher Plan */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                variants={staggerItem}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Pro / Teacher
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      $19
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    For educators & teams
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Everything in Student
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Unlimited students
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Advanced reports & analytics
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Team collaboration tools
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Custom branding
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Priority email support
                    </span>
                  </li>
                </ul>

                <Button
                  asChild
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all"
                >
                  <Link to="/signup?plan=pro">Choose Pro</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Social Sharing Section */}
          <motion.section
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-12"
            aria-labelledby="share-heading"
          >
            <motion.div
              className="text-center space-y-4"
              variants={staggerItem}
            >
              <h2
                id="share-heading"
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                Love Cognito Learning Hub?{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Spread the Word!
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Help fellow educators discover the power of AI-driven learning
              </p>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-4"
              variants={staggerContainer}
            >
              <motion.button
                variants={staggerItem}
                onClick={() => handleShare("twitter")}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Twitter className="w-5 h-5" />
                Share on Twitter
              </motion.button>

              <motion.button
                variants={staggerItem}
                onClick={() => handleShare("linkedin")}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Linkedin className="w-5 h-5" />
                Share on LinkedIn
              </motion.button>

              <motion.button
                variants={staggerItem}
                onClick={() => handleShare("facebook")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Facebook className="w-5 h-5" />
                Share on Facebook
              </motion.button>

              <motion.button
                variants={staggerItem}
                onClick={() => handleShare("copy")}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Copy className="w-5 h-5" />
                Copy Message
              </motion.button>
            </motion.div>

            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl mx-auto"
              variants={staggerItem}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Sample Share Message:
              </h3>
              <p className="text-gray-600 dark:text-gray-300 italic text-sm leading-relaxed">
                "{shareMessages.generic}"
              </p>
            </motion.div>
          </motion.section>
        </div>
      </main>
    </>
  );
}
