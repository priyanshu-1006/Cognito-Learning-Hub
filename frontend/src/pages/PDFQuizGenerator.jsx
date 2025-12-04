import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Settings,
  Eye,
  CheckSquare,
  Circle,
  FileEdit,
  Save,
  Printer,
  BookOpen,
  Clock,
  Users,
  Star,
  Layout,
  Brain,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { AuthContext } from "../context/AuthContext";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const questionTypes = [
  {
    id: "mcq",
    name: "Multiple Choice",
    icon: CheckSquare,
    color: "blue",
    description: "Questions with 4 options",
  },
  {
    id: "truefalse",
    name: "True/False",
    icon: Circle,
    color: "green",
    description: "Simple true or false questions",
  },
  {
    id: "descriptive",
    name: "Descriptive",
    icon: FileEdit,
    color: "purple",
    description: "Long answer questions",
  },
];

export default function PDFQuizGenerator() {
  const { user } = useContext(AuthContext);
  const [quiz, setQuiz] = useState({
    title: "",
    subject: "",
    duration: 60,
    totalMarks: 0,
    instructions: "",
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    type: "mcq",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 1,
    explanation: "",
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Generation States
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiQuestionTypes, setAiQuestionTypes] = useState(["mcq"]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Helper function to render markdown text component for PDF preview
  const MarkdownText = ({ children }) => (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      className="prose prose-sm max-w-none dark:prose-invert"
    >
      {children}
    </ReactMarkdown>
  );

  // Helper to clean markdown for PDF text (preserves math formulas)
  const cleanMarkdownForPDF = (text) => {
    if (!text) return "";
    // Remove markdown formatting but keep math formulas
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // bold
      .replace(/\*(.*?)\*/g, "$1") // italic
      .replace(/`(.*?)`/g, "$1") // code
      .replace(/#{1,6}\s/g, "") // headings
      .replace(/\[(.*?)\]\(.*?\)/g, "$1"); // links
  };

  // Generate AI Questions
  const generateAIQuestions = async () => {
    if (!aiTopic.trim()) {
      alert("Please enter a topic for AI question generation");
      return;
    }

    if (aiQuestionTypes.length === 0) {
      alert("Please select at least one question type");
      return;
    }

    setIsGeneratingAI(true);

    try {
      const token = localStorage.getItem("quizwise-token");

      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/api/generate-pdf-questions`;
      console.log("Making request to:", apiUrl);
      console.log("Request body:", {
        topic: aiTopic,
        numQuestions: aiQuestionCount,
        difficulty: aiDifficulty,
        questionTypes: aiQuestionTypes,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          topic: aiTopic,
          numQuestions: aiQuestionCount,
          difficulty: aiDifficulty,
          questionTypes: aiQuestionTypes,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const responseText = await response.text();
        console.error("Response text:", responseText);
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          throw new Error(
            `HTTP ${response.status}: ${responseText.substring(0, 200)}`
          );
        }
        throw new Error(errorData.message || "Failed to generate AI questions");
      }

      const data = await response.json();
      const aiQuestions = data.questions;

      if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
        throw new Error("No questions were generated");
      }

      // Add AI generated questions to the quiz
      const formattedQuestions = aiQuestions.map((q, index) => ({
        id: Date.now() + index,
        number: quiz.questions.length + index + 1,
        type: q.type || "mcq",
        question: q.question || `AI Generated Question ${index + 1}`,
        options: q.options || [],
        correctAnswer: q.correctAnswer || "",
        marks: parseInt(q.marks) || 2,
        explanation: q.explanation || "",
      }));

      setQuiz((prev) => ({
        ...prev,
        questions: [...prev.questions, ...formattedQuestions],
        totalMarks:
          prev.totalMarks +
          formattedQuestions.reduce((sum, q) => sum + parseInt(q.marks), 0),
      }));

      alert(
        `Successfully generated ${formattedQuestions.length} AI questions!`
      );
      setShowAIPanel(false);

      // Reset AI form
      setAiTopic("");
      setAiQuestionCount(5);
      setAiDifficulty("medium");
    } catch (error) {
      console.error("Error generating AI questions:", error);
      alert(`Failed to generate AI questions: ${error.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Parse AI response when JSON parsing fails
  const parseAIResponse = (text) => {
    const questions = [];
    const lines = text.split("\n");
    let currentQuestion = null;

    lines.forEach((line) => {
      line = line.trim();
      if (line.toLowerCase().includes("question") && line.includes(":")) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: line.split(":").slice(1).join(":").trim(),
          type: "mcq",
          options: [],
          marks: 2,
        };
      } else if (
        currentQuestion &&
        (line.match(/^[A-D]\)/i) || line.match(/^[a-d]\./))
      ) {
        currentQuestion.options.push(line.substring(2).trim());
      } else if (currentQuestion && line.toLowerCase().includes("answer:")) {
        currentQuestion.correctAnswer = line.split(":")[1].trim();
      } else if (
        currentQuestion &&
        line.toLowerCase().includes("explanation:")
      ) {
        currentQuestion.explanation = line.split(":")[1].trim();
      }
    });

    if (currentQuestion) questions.push(currentQuestion);
    return questions;
  };

  // Add question to quiz
  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert("Please enter a question");
      return;
    }

    if (
      currentQuestion.type === "mcq" &&
      currentQuestion.options.some((opt) => !opt.trim())
    ) {
      alert("Please fill all options for MCQ");
      return;
    }

    if (currentQuestion.type === "mcq" && !currentQuestion.correctAnswer) {
      alert("Please select the correct answer");
      return;
    }

    if (
      currentQuestion.type === "truefalse" &&
      !currentQuestion.correctAnswer
    ) {
      alert("Please select True or False");
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now(),
      number: quiz.questions.length + 1,
    };

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      totalMarks: prev.totalMarks + parseInt(currentQuestion.marks),
    }));

    // Reset current question
    setCurrentQuestion({
      type: "mcq",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 1,
      explanation: "",
    });
  };

  // Remove question
  const removeQuestion = (questionId) => {
    const questionToRemove = quiz.questions.find((q) => q.id === questionId);
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
      totalMarks: prev.totalMarks - parseInt(questionToRemove.marks),
    }));
  };

  // Update question option
  const updateOption = (index, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  // Generate PDF
  const generatePDF = () => {
    if (quiz.questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(quiz.title || "Quiz Paper", pageWidth / 2, yPosition, {
        align: "center",
      });

      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      // Quiz details
      const details = [
        `Subject: ${quiz.subject || "General"}`,
        `Duration: ${quiz.duration} minutes`,
        `Total Marks: ${quiz.totalMarks}`,
        `Total Questions: ${quiz.questions.length}`,
        `Date: ${new Date().toLocaleDateString()}`,
        `Teacher: ${user?.name || "Teacher"}`,
      ];

      details.forEach((detail) => {
        pdf.text(detail, 20, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Instructions
      if (quiz.instructions) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Instructions:", 20, yPosition);
        yPosition += 8;
        pdf.setFont("helvetica", "normal");

        const instructionLines = pdf.splitTextToSize(
          quiz.instructions,
          pageWidth - 40
        );
        instructionLines.forEach((line) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Default instructions
      pdf.setFont("helvetica", "bold");
      pdf.text("General Instructions:", 20, yPosition);
      yPosition += 8;
      pdf.setFont("helvetica", "normal");

      const defaultInstructions = [
        "1. Read all questions carefully before answering.",
        "2. Answer all questions in the space provided.",
        "3. For MCQ, circle the correct option.",
        "4. For True/False, circle T or F.",
        "5. Write clearly and legibly.",
        "6. Manage your time wisely.",
      ];

      defaultInstructions.forEach((instruction) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(instruction, 20, yPosition);
        yPosition += 6;
      });

      yPosition += 15;

      // Questions
      quiz.questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }

        // Question number and marks
        pdf.setFont("helvetica", "bold");
        pdf.text(`Q${question.number}.`, 20, yPosition);
        pdf.text(
          `[${question.marks} mark${question.marks > 1 ? "s" : ""}]`,
          pageWidth - 50,
          yPosition
        );

        yPosition += 8;

        // Question text with markdown cleaning
        pdf.setFont("helvetica", "normal");
        const cleanedQuestion = cleanMarkdownForPDF(question.question);
        const questionLines = pdf.splitTextToSize(
          cleanedQuestion,
          pageWidth - 40
        );
        questionLines.forEach((line) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });

        yPosition += 5;

        // Options based on question type
        if (question.type === "mcq") {
          question.options.forEach((option, optIndex) => {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }
            const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
            const cleanedOption = cleanMarkdownForPDF(option);
            pdf.text(`${optionLetter}) ${cleanedOption}`, 30, yPosition);
            yPosition += 8;
          });
        } else if (question.type === "truefalse") {
          pdf.text("Circle the correct answer:", 30, yPosition);
          yPosition += 10;
          pdf.text("T     /     F", 30, yPosition);
          yPosition += 8;
        } else if (question.type === "descriptive") {
          // Add lines for descriptive answers
          const lineCount = Math.max(3, Math.ceil(question.marks / 2));
          for (let i = 0; i < lineCount; i++) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.line(30, yPosition + 3, pageWidth - 30, yPosition + 3);
            yPosition += 15;
          }
        }

        yPosition += 10;
      });

      // Answer Key (separate page)
      pdf.addPage();
      yPosition = 20;

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("ANSWER KEY", pageWidth / 2, yPosition, { align: "center" });
      pdf.text("(For Teacher Use Only)", pageWidth / 2, yPosition + 10, {
        align: "center",
      });

      yPosition += 30;
      pdf.setFontSize(12);

      quiz.questions.forEach((question) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text(`Q${question.number}.`, 20, yPosition);

        pdf.setFont("helvetica", "normal");
        let answerText = "";
        if (question.type === "mcq") {
          const correctIndex = question.options.findIndex(
            (opt) => opt === question.correctAnswer
          );
          const correctLetter = String.fromCharCode(65 + correctIndex);
          const cleanedAnswer = cleanMarkdownForPDF(question.correctAnswer);
          answerText = `${correctLetter}) ${cleanedAnswer}`;
        } else if (question.type === "truefalse") {
          answerText = question.correctAnswer;
        } else {
          answerText =
            cleanMarkdownForPDF(question.explanation) ||
            "Sample answer not provided";
        }

        pdf.text(answerText, 50, yPosition);
        yPosition += 8;

        if (question.explanation && question.type !== "descriptive") {
          pdf.setFont("helvetica", "italic");
          const cleanedExplanation = cleanMarkdownForPDF(question.explanation);
          pdf.text(`Explanation: ${cleanedExplanation}`, 50, yPosition);
          yPosition += 8;
          pdf.setFont("helvetica", "normal");
        }

        yPosition += 5;
      });

      // Save PDF
      const fileName = `${quiz.title || "Quiz"}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        className="text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                AI-Powered PDF Quiz Generator
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Create printable quiz papers with AI assistance or manual
                control
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quiz Settings */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quiz Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(e) =>
                      setQuiz((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter quiz title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={quiz.subject}
                    onChange={(e) =>
                      setQuiz((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={quiz.duration}
                    onChange={(e) =>
                      setQuiz((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 60,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={quiz.totalMarks}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instructions (Optional)
                </label>
                <textarea
                  value={quiz.instructions}
                  onChange={(e) =>
                    setQuiz((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Enter special instructions for the quiz"
                />
              </div>
            </CardContent>
          </Card>

          {/* Question Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Question Creation</span>
                <Button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  variant={showAIPanel ? "default" : "outline"}
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {showAIPanel ? "Manual Mode" : "AI Generate"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAIPanel ? (
                /* AI Generation Panel */
                <div className="space-y-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        AI Question Generator
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Let AI create questions for your topic
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic/Subject *
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Photosynthesis in Plants, World War 2, Python Programming"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Number of Questions
                      </label>
                      <select
                        value={aiQuestionCount}
                        onChange={(e) =>
                          setAiQuestionCount(parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {[3, 5, 8, 10, 15, 20].map((num) => (
                          <option key={num} value={num}>
                            {num} questions
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question Types
                      </label>
                      <div className="space-y-1">
                        {["mcq", "truefalse", "descriptive"].map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={aiQuestionTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAiQuestionTypes([
                                    ...aiQuestionTypes,
                                    type,
                                  ]);
                                } else {
                                  setAiQuestionTypes(
                                    aiQuestionTypes.filter((t) => t !== type)
                                  );
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm capitalize">
                              {type === "mcq"
                                ? "Multiple Choice"
                                : type === "truefalse"
                                ? "True/False"
                                : "Descriptive"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={generateAIQuestions}
                    disabled={
                      isGeneratingAI ||
                      !aiTopic.trim() ||
                      aiQuestionTypes.length === 0
                    }
                    className="w-full"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating AI Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate {aiQuestionCount} Questions with AI
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* Manual Question Types */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {questionTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            type: type.id,
                            options: type.id === "mcq" ? ["", "", "", ""] : [],
                            correctAnswer: "",
                          }))
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          currentQuestion.type === type.id
                            ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900`
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <Icon
                          className={`w-8 h-8 mx-auto mb-2 ${
                            currentQuestion.type === type.id
                              ? `text-${type.color}-600 dark:text-${type.color}-400`
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {type.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {type.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Question Builder */}
          {!showAIPanel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question *
                  </label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) =>
                      setCurrentQuestion((prev) => ({
                        ...prev,
                        question: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows="3"
                    placeholder="Enter your question here"
                  />
                </div>

                {/* MCQ Options */}
                {currentQuestion.type === "mcq" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Options *
                    </label>
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500 w-6">
                            {String.fromCharCode(65 + index)})
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOption(index, e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder={`Option ${String.fromCharCode(
                              65 + index
                            )}`}
                          />
                          <button
                            onClick={() =>
                              setCurrentQuestion((prev) => ({
                                ...prev,
                                correctAnswer: option,
                              }))
                            }
                            className={`px-3 py-2 rounded-lg text-sm ${
                              currentQuestion.correctAnswer === option
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {currentQuestion.correctAnswer === option
                              ? "Correct"
                              : "Mark Correct"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True/False Options */}
                {currentQuestion.type === "truefalse" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correct Answer *
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            correctAnswer: "True",
                          }))
                        }
                        className={`px-4 py-2 rounded-lg ${
                          currentQuestion.correctAnswer === "True"
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        True
                      </button>
                      <button
                        onClick={() =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            correctAnswer: "False",
                          }))
                        }
                        className={`px-4 py-2 rounded-lg ${
                          currentQuestion.correctAnswer === "False"
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        False
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Marks *
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.marks}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          marks: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Explanation (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.explanation}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          explanation: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Brief explanation"
                    />
                  </div>
                </div>

                <Button onClick={addQuestion} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Quiz Summary & Actions */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Quiz Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {quiz.questions.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Questions
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                  <Star className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {quiz.totalMarks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Marks
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {quiz.duration}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Minutes
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <Layout className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    PDF
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Format
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={generatePDF}
                  disabled={quiz.questions.length === 0 || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isPreviewMode ? "Hide Preview" : "Preview Quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question List */}
          {quiz.questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Questions ({quiz.questions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {quiz.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              question.type === "mcq"
                                ? "default"
                                : question.type === "truefalse"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {question.type.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {question.marks} mark{question.marks > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {question.question.length > 60
                            ? question.question.substring(0, 60) + "..."
                            : question.question}
                        </p>
                      </div>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quiz Preview
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewMode(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h1 className="text-xl font-bold">
                    {quiz.title || "Quiz Title"}
                  </h1>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <p>
                      <strong>Subject:</strong> {quiz.subject || "General"}
                    </p>
                    <p>
                      <strong>Duration:</strong> {quiz.duration} min
                    </p>
                    <p>
                      <strong>Total Marks:</strong> {quiz.totalMarks}
                    </p>
                    <p>
                      <strong>Questions:</strong> {quiz.questions.length}
                    </p>
                  </div>
                </div>

                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">Q{index + 1}.</h3>
                        <div className="text-gray-700 dark:text-gray-300">
                          <MarkdownText>{question.question}</MarkdownText>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {question.marks} mark{question.marks > 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {question.type === "mcq" && (
                      <div className="space-y-1 ml-4">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`${
                              option === question.correctAnswer
                                ? "text-green-600 font-medium"
                                : ""
                            }`}
                          >
                            <span className="font-medium">
                              {String.fromCharCode(65 + optIndex)}){" "}
                            </span>
                            <MarkdownText>{option}</MarkdownText>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "truefalse" && (
                      <div className="ml-4">
                        <p>True / False</p>
                        <p className="text-green-600 font-medium text-sm">
                          Answer: {question.correctAnswer}
                        </p>
                      </div>
                    )}

                    {question.type === "descriptive" && (
                      <div className="ml-4 space-y-2">
                        {Array.from({
                          length: Math.max(3, Math.ceil(question.marks / 2)),
                        }).map((_, i) => (
                          <div
                            key={i}
                            className="border-b border-gray-300 h-6"
                          ></div>
                        ))}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="ml-4 mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                        <span className="font-medium">Explanation: </span>
                        <MarkdownText>{question.explanation}</MarkdownText>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
