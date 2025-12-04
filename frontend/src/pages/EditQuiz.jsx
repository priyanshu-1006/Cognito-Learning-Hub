import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, CheckCircle, ArrowLeft, Plus, AlertTriangle } from 'lucide-react';

// --- Animation Variants ---
const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.1,
      duration: 0.6 
    } 
  } 
};

const itemVariants = { 
  hidden: { y: 20, opacity: 0 }, 
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      duration: 0.5,
      ease: "easeOut" 
    } 
  } 
};

// --- Enhanced Success Modal Component ---
const SuccessModal = ({ isOpen, onClose, message }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
                <motion.div 
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-auto border border-gray-200 dark:border-gray-700" 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="relative mb-6">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500 dark:text-green-400" />
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Success!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <button 
                      onClick={onClose} 
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Continue
                    </button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);


export default function EditQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}`);
        if (!response.ok) throw new Error('Could not fetch quiz data.');
        const data = await response.json();
        setQuizTitle(data.title);
        setQuestions(data.questions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [quizId]);

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correct_answer = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
        alert("A quiz must have at least one question.");
        return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleUpdateQuiz = async () => {
    setError('');
    setIsSaving(true);
    const token = localStorage.getItem('quizwise-token');
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ title: quizTitle, questions })
        });
        if (!response.ok) throw new Error('Failed to update quiz.');
        setShowSuccessModal(true);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border-0"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Loading Quiz Editor</h3>
          <p className="text-gray-600 dark:text-gray-300">Preparing your quiz for editing...</p>
        </motion.div>
      </div>
    );
  }
  
  if (error && !showSuccessModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border-0 max-w-md"
        >
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 dark:text-red-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Error Loading Quiz</h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 py-8">
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => navigate(-1)}
        message="Your quiz has been updated successfully!"
      />
      
      <motion.div 
        className="max-w-6xl mx-auto px-4" 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Edit Quiz
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Refine your questions and options below.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Details & Actions */}
          <motion.div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6" variants={itemVariants}>
            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border-0">
              <label htmlFor="quizTitle" className="block text-lg font-bold text-gray-800 dark:text-white mb-3">
                Quiz Title
              </label>
              <input 
                type="text" 
                id="quizTitle" 
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-lg font-medium" 
                value={quizTitle} 
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title..."
              />
            </div>
            
            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <Save className="w-5 h-5 mr-2" />
                Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={handleUpdateQuiz} 
                  disabled={isSaving} 
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:scale-100"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-all duration-300"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
          </motion.div>

          {/* Right Column: Questions */}
          <motion.div className="lg:col-span-2 space-y-6" variants={containerVariants}>
            <AnimatePresence>
              {questions.map((q, qIndex) => (
                <motion.div 
                  key={qIndex} 
                  className="p-8 border-0 rounded-2xl space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl"
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center">
                    <label className="block text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Question {qIndex + 1}
                    </label>
                    <button 
                      onClick={() => removeQuestion(qIndex)} 
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-all duration-300 transform hover:scale-110" 
                      title="Remove Question"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Text</label>
                    <input 
                      type="text" 
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-lg" 
                      value={q.question} 
                      onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                      placeholder="Enter your question here..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Answer Options</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                            {String.fromCharCode(65 + oIndex)}
                          </span>
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300" 
                            value={opt} 
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correct Answer</label>
                    <select 
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300" 
                      value={q.correct_answer} 
                      onChange={(e) => handleCorrectAnswerChange(qIndex, e.target.value)}
                    >
                      <option value="" disabled>Select the correct option</option>
                      {q.options.map((opt, oIndex) => ( 
                        opt && <option key={oIndex} value={opt}>{String.fromCharCode(65 + oIndex)}: {opt}</option> 
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
