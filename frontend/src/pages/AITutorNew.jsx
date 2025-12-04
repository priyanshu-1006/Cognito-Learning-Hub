import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useSwipe } from "../hooks/useSwipe";
import {
  Send,
  Plus,
  Bot,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Menu,
  X,
  Trash2,
  MessageSquare,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Settings,
  BookOpen,
  ChevronDown,
  Heart,
  ThumbsUp,
  Zap,
  Star,
  Brain,
  Lightbulb,
  Paperclip,
  FileText,
  Image as ImageIcon,
  File,
  XCircle,
  ArrowLeft,
} from "lucide-react";

const AITutor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fontSize, setFontSize] = useState("medium");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [favoriteMessages, setFavoriteMessages] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const speechSynthesis = window.speechSynthesis;

  // Swipe gesture support for sidebar
  const swipeHandlers = useSwipe(
    () => setSidebarOpen(false), // Swipe left to close
    () => setSidebarOpen(true), // Swipe right to open
    50 // Minimum swipe distance
  );

  const examplePrompts = [
    "Explain photosynthesis",
    "Help with quadratic equations",
    "World War II causes",
    "Newton's laws of motion",
  ];

  const quickActions = [
    {
      icon: "🔍",
      text: "Explain this concept",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: "📝",
      text: "Help with homework",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: "🧮",
      text: "Solve this problem",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: "💡",
      text: "Give me examples",
      color: "from-orange-500 to-red-600",
    },
  ];

  const suggestedQuestions = [
    {
      category: "Science",
      icon: "⚛️",
      questions: [
        "Explain photosynthesis in simple terms",
        "What is Newton's First Law of Motion?",
        "How does DNA replication work?",
        "What causes earthquakes?",
      ],
    },
    {
      category: "Mathematics",
      icon: "📐",
      questions: [
        "Solve quadratic equations step by step",
        "Explain calculus derivatives",
        "How to find the area of a circle?",
        "What is the Pythagorean theorem?",
      ],
    },
    {
      category: "History",
      icon: "📚",
      questions: [
        "Summarize the main causes of World War II",
        "Explain the Industrial Revolution",
        "What was the Renaissance period?",
        "Timeline of Ancient Egyptian civilization",
      ],
    },
  ];

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai-tutor-chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0) setCurrentConvId(parsed[0].id);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("ai-tutor-chats", JSON.stringify(conversations));
    }
  }, [conversations]);

  const currentMessages = useMemo(
    () => conversations.find((c) => c.id === currentConvId)?.messages || [],
    [conversations, currentConvId]
  );

  // Auto-scroll only when loading completes (new message received)
  useEffect(() => {
    if (!isLoading && currentMessages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isLoading]); // Only scroll when loading state changes

  const handleSend = useCallback(
    async (e, promptText = null) => {
      e?.preventDefault();
      const text = promptText || input.trim();
      if ((!text && attachedFiles.length === 0) || isLoading) return;

      const userMsg = {
        id: Date.now(),
        role: "user",
        content: text || "Uploaded files for analysis",
        files: attachedFiles.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
        })),
        time: new Date().toISOString(),
      };

      let conversationId = currentConvId;

      // Create new conversation if none exists
      if (!currentConvId) {
        const newConv = {
          id: Date.now(),
          title: text.substring(0, 30) + "..." || "File upload conversation",
          messages: [userMsg],
          createdAt: new Date().toISOString(),
        };
        conversationId = newConv.id;
        setConversations([newConv, ...conversations]);
        setCurrentConvId(newConv.id);
      } else {
        // Add to existing conversation
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConvId
              ? { ...conv, messages: [...conv.messages, userMsg] }
              : conv
          )
        );
      }

      setInput("");
      const filesToSend = [...attachedFiles];
      setAttachedFiles([]);
      setIsLoading(true);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const token =
          localStorage.getItem("quizwise-token") ||
          localStorage.getItem("token");

        console.log("Sending message to:", `${apiUrl}/api/doubt-solver`);

        // Create FormData for file uploads
        const formData = new FormData();
        formData.append("message", text || "Please analyze these files");
        filesToSend.forEach((file) => {
          formData.append("files", file);
        });

        const res = await fetch(`${apiUrl}/api/doubt-solver`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        console.log("Response status:", res.status);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Response data:", data);

        const aiMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.data?.reply || data.reply || "Sorry, I couldn't help with that.",
          time: new Date().toISOString(),
        };

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, aiMsg] }
              : conv
          )
        );

        if (voiceEnabled && "speechSynthesis" in window) {
          setTimeout(() => speakMessage(aiMsg.content), 500);
        }
      } catch (error) {
        console.error("Error details:", error);
        const errorMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, the backend server is not responding. Please make sure the backend is running.",
          time: new Date().toISOString(),
        };
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, errorMsg] }
              : conv
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      input,
      isLoading,
      currentConvId,
      conversations,
      voiceEnabled,
      attachedFiles,
    ]
  );

  const startNewChat = useCallback(() => {
    setCurrentConvId(null);
  }, []);

  const deleteConversation = useCallback(
    (id) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConvId === id) setCurrentConvId(null);
    },
    [currentConvId]
  );

  const copyToClipboard = useCallback((text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Voice Recognition
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    try {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
    }
  };

  // Text-to-Speech
  const speakMessage = useCallback(
    (text) => {
      if (!voiceEnabled) return;

      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Toggle favorite message
  const toggleFavorite = useCallback((messageId) => {
    setFavoriteMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  }, []);

  // File upload handling
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") ||
        file.type === "application/pdf" ||
        file.type === "text/plain";
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
      return isValidType && isValidSize;
    });
    setAttachedFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const removeFile = useCallback((index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (fileType === "application/pdf") return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="h-screen max-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 flex overflow-hidden relative">
      {/* Animated background elements - optimized */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed sm:relative z-40 w-full sm:w-64 md:w-72 h-screen max-h-screen bg-white/40 backdrop-blur-2xl border-r border-white/60 flex flex-col shadow-2xl"
          >
            {/* New Chat Button */}
            <div className="p-4 border-b border-white/60">
              <button
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Chat History - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
              <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recent Chats
              </h3>
              <div className="space-y-2 mt-2">
                {conversations.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-slate-500">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-3 border border-violet-200/50">
                      <MessageSquare className="w-6 h-6 text-violet-400" />
                    </div>
                    <p className="font-medium">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                        currentConvId === conv.id
                          ? "bg-white/60 backdrop-blur-sm shadow-md border border-violet-200/50"
                          : "hover:bg-white/40 backdrop-blur-sm"
                      }`}
                      onClick={() => setCurrentConvId(conv.id)}
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          currentConvId === conv.id
                            ? "bg-violet-600"
                            : "bg-slate-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(conv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100/80 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* User Profile - Fixed at Bottom */}
            <div className="flex-shrink-0 p-4 border-t border-white/60 bg-white/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden relative z-10">
        {/* Header */}
        <div className="flex-shrink-0 bg-white/40 backdrop-blur-2xl border-b border-white/60 shadow-lg z-20">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2.5 hover:bg-white/60 backdrop-blur-sm rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 hover:bg-white/60 backdrop-blur-sm rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-slate-700" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700" />
                )}
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-xl shadow-lg">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 via-violet-700 to-fuchsia-700 bg-clip-text text-transparent">
                    AI Study Assistant
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Your personal learning companion
                  </p>
                </div>
                <div className="block sm:hidden">
                  <h1 className="text-base font-bold bg-gradient-to-r from-slate-800 via-violet-700 to-fuchsia-700 bg-clip-text text-transparent">
                    AI Tutor
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Controls */}
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm ${
                  voiceEnabled
                    ? "bg-emerald-100/80 backdrop-blur-sm text-emerald-600 border border-emerald-200/50"
                    : "hover:bg-white/60 backdrop-blur-sm text-slate-600"
                }`}
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-2.5 rounded-xl bg-red-100/80 backdrop-blur-sm text-red-600 hover:bg-red-200/80 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm border border-red-200/50"
                  title="Stop speaking"
                >
                  <VolumeX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages - Scrollable Area ONLY */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 pb-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl"
              >
                <div className="inline-flex p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl mb-6 shadow-2xl">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-700 bg-clip-text text-transparent mb-4">
                  Hello, {user?.name?.split(" ")[0] || "there"}!
                </h2>
                <p className="text-xl text-slate-600 font-medium mb-12">
                  How can I help you learn today?
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {examplePrompts.map((prompt, i) => (
                    <motion.button
                      key={i}
                      onClick={(e) => handleSend(e, prompt)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 text-left rounded-2xl bg-white/40 backdrop-blur-xl hover:bg-white/60 border border-white/60 hover:border-violet-300 transition-all shadow-lg hover:shadow-xl group"
                    >
                      <p className="text-slate-700 group-hover:text-violet-700 font-semibold transition-colors">
                        {prompt}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8">
              {currentMessages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="mb-8"
                >
                  <div
                    className={`flex gap-4 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-2xl ${
                        msg.role === "user" ? "order-first" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-6 py-4 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl"
                            : "bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl text-slate-800 shadow-xl border border-white/80"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div
                            className={`prose max-w-none prose-slate prose-headings:font-extrabold prose-headings:bg-gradient-to-r prose-headings:from-violet-700 prose-headings:to-fuchsia-700 prose-headings:bg-clip-text prose-headings:text-transparent prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-2 prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-4 prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-3 prose-p:leading-relaxed prose-p:text-slate-700 prose-p:my-3 prose-pre:bg-gradient-to-br prose-pre:from-slate-800 prose-pre:to-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-slate-700 prose-code:text-violet-700 prose-code:bg-violet-50 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold prose-code:border prose-code:border-violet-200 prose-ul:list-disc prose-ul:pl-6 prose-ul:my-3 prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-3 prose-li:my-2 prose-li:text-slate-700 prose-strong:font-bold prose-strong:text-violet-900 prose-strong:bg-violet-50 prose-strong:px-1 prose-strong:rounded prose-em:text-fuchsia-700 prose-blockquote:border-l-4 prose-blockquote:border-violet-500 prose-blockquote:bg-violet-50/50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic prose-a:text-violet-600 prose-a:underline prose-a:font-semibold hover:prose-a:text-fuchsia-600 ${
                              fontSize === "small"
                                ? "prose-sm"
                                : fontSize === "large"
                                ? "prose-lg"
                                : "prose-base"
                            }`}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div>
                            <p
                              className={`leading-relaxed whitespace-pre-wrap ${
                                fontSize === "small"
                                  ? "text-sm"
                                  : fontSize === "large"
                                  ? "text-lg"
                                  : "text-base"
                              }`}
                            >
                              {msg.content}
                            </p>
                            {msg.files && msg.files.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {msg.files.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg border border-white/40"
                                  >
                                    {getFileIcon(file.type)}
                                    <span className="text-xs font-medium truncate max-w-[120px]">
                                      {file.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mt-2 ml-2 flex-wrap">
                          <button
                            onClick={() => toggleFavorite(msg.id)}
                            className={`px-3 py-1.5 hover:bg-white/40 backdrop-blur-sm rounded-xl transition text-xs flex items-center gap-1.5 border ${
                              favoriteMessages.includes(msg.id)
                                ? "text-red-500 border-red-300 bg-red-50/50"
                                : "text-slate-500 border-white/40 bg-white/20 hover:text-red-500 hover:border-red-300"
                            }`}
                            title={
                              favoriteMessages.includes(msg.id)
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                favoriteMessages.includes(msg.id)
                                  ? "fill-red-500"
                                  : ""
                              }`}
                            />
                            {favoriteMessages.includes(msg.id)
                              ? "Saved"
                              : "Save"}
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="px-3 py-1.5 hover:bg-white/40 backdrop-blur-sm rounded-xl transition text-slate-500 hover:text-violet-600 text-xs flex items-center gap-1.5 border border-white/40 bg-white/20"
                            title="Copy"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-500" />{" "}
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </>
                            )}
                          </button>
                          {voiceEnabled && (
                            <button
                              onClick={() => speakMessage(msg.content)}
                              disabled={isSpeaking}
                              className="px-3 py-1.5 hover:bg-white/40 backdrop-blur-sm rounded-xl transition text-slate-500 hover:text-violet-600 text-xs flex items-center gap-1.5 disabled:opacity-50 border border-white/40 bg-white/20"
                              title="Read aloud"
                            >
                              <Volume2
                                className={`w-3.5 h-3.5 ${
                                  isSpeaking ? "animate-pulse" : ""
                                }`}
                              />
                              {isSpeaking ? "Speaking..." : "Speak"}
                            </button>
                          )}
                          <button
                            className="px-3 py-1.5 hover:bg-white/40 backdrop-blur-sm rounded-xl transition text-slate-500 hover:text-violet-600 text-xs flex items-center gap-1.5 border border-white/40 bg-white/20"
                            title="Like this response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            Like
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 mb-8"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl px-6 py-4 shadow-lg">
                    <div className="flex gap-2">
                      <div
                        className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at Bottom of Viewport - OUTSIDE main content */}
      <div className="fixed bottom-0 right-0 left-0 sm:left-64 md:left-72 border-t border-white/30 bg-white/40 backdrop-blur-2xl z-30 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* File Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-200 shadow-sm"
                >
                  {getFileIcon(file.type)}
                  <span className="text-xs text-slate-700 font-medium max-w-[150px] truncate">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-red-100 rounded-lg transition"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="relative">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 rounded-xl transition-colors text-slate-500 hover:text-violet-600 hover:bg-violet-50/50 disabled:opacity-50"
                title="Attach files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={startListening}
                disabled={isListening || isLoading}
                className={`p-2 rounded-xl transition-colors ${
                  isListening
                    ? "text-red-500 animate-pulse bg-red-50"
                    : "text-slate-500 hover:text-violet-600 hover:bg-violet-50/50"
                } disabled:opacity-50`}
                title={isListening ? "Listening..." : "Voice input"}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 bg-transparent px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none text-base font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed rounded-2xl transition-all shadow-lg hover:shadow-xl"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>
          {isListening && (
            <motion.p
              className="text-xs text-center text-red-500 mt-2 flex items-center justify-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Listening...
            </motion.p>
          )}
          <p className="text-xs text-center text-gray-400 mt-3">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
