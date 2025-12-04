import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
const PlusCircleIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>);
const SaveIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>);
const TrashIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const CheckCircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;


// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }};

// --- Success Modal Component ---
const SuccessModal = ({ isOpen, onClose, message }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-auto border border-gray-200 dark:border-gray-700" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                    <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Success!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <button onClick={onClose} className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Continue</button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);


export default function ManualQuizCreator() {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correct_answer: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

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

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct_answer: '' }]);
  };
  
  const removeQuestion = (index) => {
    if (questions.length <= 1) {
        alert("A quiz must have at least one question.");
        return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveQuiz = async () => {
    setError('');
    if (!quizTitle.trim()) {
      setError('Please enter a quiz title.');
      return;
    }
    const isInvalid = questions.some(q => !q.question.trim() || q.options.some(opt => !opt.trim()) || !q.correct_answer.trim());
    if (isInvalid) {
        setError('Please fill out all fields for every question.');
        return;
    }

    const token = localStorage.getItem('quizwise-token');
    if (!token) {
      setError("You must be logged in to save a quiz.");
      return;
    }
    setIsSaving(true);
    const quizData = { title: quizTitle, questions };

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/save-manual-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify(quizData),
        });
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        setShowSuccessModal(true);
    } catch (error) {
        setError("Failed to save quiz. Please check the console and try again.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => navigate('/teacher-dashboard')}
        message="Your quiz has been saved successfully!"
      />
      <motion.div className="max-w-6xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="text-center mb-12" variants={itemVariants}>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Manual Quiz Creator</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Build your quiz from scratch for complete control.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Details & Actions */}
            <motion.div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6" variants={itemVariants}>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <label htmlFor="quizTitle" className="block text-lg font-bold text-gray-800 dark:text-white mb-2">Quiz Title</label>
                    <input type="text" id="quizTitle" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="e.g., 'World Capitals Challenge'" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Actions</h3>
                    <div className="space-y-4">
                        <button onClick={addQuestion} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                            <PlusCircleIcon className="h-5 w-5" /> Add Question
                        </button>
                        <button onClick={handleSaveQuiz} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
                            <SaveIcon className="h-5 w-5" /> {isSaving ? 'Saving...' : 'Save Quiz'}
                        </button>
                    </div>
                </div>
                {error && <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>}
            </motion.div>

            {/* Right Column: Questions */}
            <motion.div className="lg:col-span-2 space-y-6" variants={containerVariants}>
                <AnimatePresence>
                    {questions.map((q, qIndex) => (
                    <motion.div 
                        key={qIndex} 
                        className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-4 bg-white dark:bg-gray-800 shadow-lg"
                        variants={itemVariants}
                        layout
                    >
                        <div className="flex justify-between items-center">
                            <label className="block text-md font-bold text-gray-700 dark:text-white">Question {qIndex + 1}</label>
                            <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700" title="Remove Question">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <input type="text" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" placeholder="Enter your question here" value={q.question} onChange={(e) => handleQuestionChange(qIndex, e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIndex) => ( <input key={oIndex} type="text" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" placeholder={`Option ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} /> ))}
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correct Answer</label>
                        <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" value={q.correct_answer} onChange={(e) => handleCorrectAnswerChange(qIndex, e.target.value)}>
                            <option value="" disabled>Select the correct option</option>
                            {q.options.map((opt, oIndex) => ( opt && <option key={oIndex} value={opt}>{opt}</option> ))}
                        </select>
                        </div>
                    </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
      </motion.div>
    </>
  );
}
