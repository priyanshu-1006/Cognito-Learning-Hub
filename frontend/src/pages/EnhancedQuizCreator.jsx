import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Settings,
  Download,
  FileText,
  CheckCircle,
  X,
  Clock,
  Star,
  BookOpen,
  Target,
  Zap,
  Award,
  Copy,
  Palette,
  Edit,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { exportQuizToPDF, printQuiz } from '../lib/pdfExporter';

const QuestionTypeCard = ({ type, isSelected, onClick, icon, title, description }) => (
  <motion.div
    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' 
        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
    }`}
    onClick={() => onClick(type)}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${
        isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  </motion.div>
);

const QuestionEditor = ({ question, index, onUpdate, onDelete }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const questionTypes = [
    {
      type: 'multiple-choice',
      icon: <CheckCircle className="w-4 h-4" />,
      title: 'Multiple Choice',
      description: 'Traditional 4-option questions'
    },
    {
      type: 'true-false',
      icon: <Target className="w-4 h-4" />,
      title: 'True/False',
      description: 'Simple true or false questions'
    },
    {
      type: 'descriptive',
      icon: <FileText className="w-4 h-4" />,
      title: 'Descriptive',
      description: 'Open-ended text answers'
    },
    {
      type: 'fill-in-blank',
      icon: <Edit className="w-4 h-4" />,
      title: 'Fill in the Blank',
      description: 'Complete the sentence'
    }
  ];

  const updateQuestion = (field, value) => {
    onUpdate(index, { ...question, [field]: value });
  };

  const updateOption = (optionIndex, value) => {
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    updateQuestion('options', newOptions);
  };

  const removeOption = (optionIndex) => {
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion('options', newOptions);
  };

  return (
    <motion.div
      className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <div className="p-6 space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Question {index + 1}
            </Badge>
            <Badge variant={question.type === 'multiple-choice' ? 'default' : 'secondary'}>
              {questionTypes.find(t => t.type === question.type)?.title || 'Multiple Choice'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4" />
              Advanced
            </Button>
            <Button
              onClick={() => onDelete(index)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Question Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Question Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questionTypes.map(type => (
              <QuestionTypeCard
                key={type.type}
                type={type.type}
                isSelected={question.type === type.type}
                onClick={(selectedType) => updateQuestion('type', selectedType)}
                icon={type.icon}
                title={type.title}
                description={type.description}
              />
            ))}
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Question Text
          </label>
          <textarea
            value={question.question || ''}
            onChange={(e) => updateQuestion('question', e.target.value)}
            placeholder="Enter your question here..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
        </div>

        {/* Options Section - Conditional based on question type */}
        {question.type === 'multiple-choice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Answer Options
            </label>
            <div className="space-y-3">
              {(question.options || ['', '', '', '']).map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-3">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => updateQuestion('correct_answer', option)}
                    variant={question.correct_answer === option ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0"
                  >
                    {question.correct_answer === option ? 'Correct' : 'Set Correct'}
                  </Button>
                  {(question.options || []).length > 2 && (
                    <Button
                      onClick={() => removeOption(optionIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {(question.options || []).length < 6 && (
                <Button onClick={addOption} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </div>
        )}

        {question.type === 'true-false' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Correct Answer
            </label>
            <div className="flex gap-3">
              <Button
                onClick={() => updateQuestion('correct_answer', 'True')}
                variant={question.correct_answer === 'True' ? 'default' : 'outline'}
                className="flex-1"
              >
                True
              </Button>
              <Button
                onClick={() => updateQuestion('correct_answer', 'False')}
                variant={question.correct_answer === 'False' ? 'default' : 'outline'}
                className="flex-1"
              >
                False
              </Button>
            </div>
          </div>
        )}

        {(question.type === 'descriptive' || question.type === 'fill-in-blank') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected Answer/Keywords
            </label>
            <textarea
              value={question.correct_answer || ''}
              onChange={(e) => updateQuestion('correct_answer', e.target.value)}
              placeholder="Enter the expected answer or key points for evaluation..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
          </div>
        )}

        {/* Advanced Settings */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Points
                  </label>
                  <Input
                    type="number"
                    value={question.points || 1}
                    onChange={(e) => updateQuestion('points', parseInt(e.target.value) || 1)}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Limit (seconds)
                  </label>
                  <Input
                    type="number"
                    value={question.timeLimit || 30}
                    onChange={(e) => updateQuestion('timeLimit', parseInt(e.target.value) || 30)}
                    min={10}
                    max={300}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={question.difficulty || 'Medium'}
                    onChange={(e) => updateQuestion('difficulty', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion('explanation', e.target.value)}
                  placeholder="Provide an explanation that will be shown after the question is answered..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function EnhancedQuizCreator() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    difficulty: 'Medium',
    isPublic: true,
    timeLimit: 30,
    passingScore: 60,
    gameSettings: {
      enableHints: false,
      enableTimeBonuses: true,
      enableStreakBonuses: true,
      showLeaderboard: true
    }
  });
  
  const [questions, setQuestions] = useState([
    {
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 1,
      timeLimit: 30,
      difficulty: 'Medium'
    }
  ]);

  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateQuestion = (index, updatedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        points: 1,
        timeLimit: 30,
        difficulty: 'Medium'
      }
    ]);
  };

  const deleteQuestion = (index) => {
    if (questions.length <= 1) {
      showError('A quiz must have at least one question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validation
    if (!quizData.title.trim()) {
      showError('Please enter a quiz title.');
      return;
    }

    const invalidQuestions = questions.some(q => 
      !q.question.trim() || 
      !q.correct_answer.trim() ||
      (q.type === 'multiple-choice' && q.options.some(opt => !opt.trim()))
    );

    if (invalidQuestions) {
      showError('Please complete all questions and options.');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('quizwise-token');
      const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
      
      const quizPayload = {
        ...quizData,
        questions,
        totalPoints
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(quizPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz');
      }

      const result = await response.json();
      success('Quiz saved successfully!');
      navigate('/teacher-dashboard');
    } catch (error) {
      console.error('Error saving quiz:', error);
      showError('Failed to save quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async (format = 'teacher') => {
    try {
      if (!quizData.title.trim()) {
        showError('Please enter a quiz title before generating PDF.');
        return;
      }

      if (questions.some(q => !q.question.trim())) {
        showError('Please complete all questions before generating PDF.');
        return;
      }

      await exportQuizToPDF(quizData, questions, format);
      success(`${format.charAt(0).toUpperCase() + format.slice(1)} PDF downloaded successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrintPreview = async () => {
    try {
      const token = localStorage.getItem('quizwise-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          quizData,
          questions,
          format: 'teacher'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate print preview');
      }

      const data = await response.json();
      await printQuiz(data.html);
      success('Print preview opened successfully!');
    } catch (error) {
      console.error('Error generating print preview:', error);
      showError('Failed to generate print preview. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Enhanced Quiz Creator
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create engaging quizzes with multiple question types and gamification features
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowSettings(true)} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => setShowPreview(true)} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <div className="relative group">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => generatePDF('teacher')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Teacher Copy (with answers)
                    </button>
                    <button
                      onClick={() => generatePDF('student')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Student Copy (no answers)
                    </button>
                    <button
                      onClick={() => generatePDF('answer-key')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      Answer Key Only
                    </button>
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={handlePrintPreview}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Print Preview
                    </button>
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Quiz'}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Questions</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{questions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Est. Time</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {Math.ceil(questions.reduce((sum, q) => sum + (q.timeLimit || 30), 0) / 60)}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Difficulty</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{quizData.difficulty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quiz Basic Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiz Title
                </label>
                <Input
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  placeholder="Enter quiz title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Input
                  value={quizData.category}
                  onChange={(e) => setQuizData({ ...quizData, category: e.target.value })}
                  placeholder="e.g., Mathematics, Science, History..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={quizData.description}
                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                placeholder="Brief description of the quiz..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Questions</h2>
            <Button onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          <AnimatePresence>
            {questions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                index={index}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
