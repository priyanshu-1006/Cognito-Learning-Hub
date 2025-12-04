import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

// Icons
const EditIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const TrashIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const LinkIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const AlertTriangleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const UsersIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BookIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const AwardIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"/></svg>;
const TrendingUpIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const PlusIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SearchIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;


// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }};

// --- Confirmation Modal ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-gray-200 dark:border-gray-700" 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button variant="destructive" onClick={onConfirm}>Confirm Delete</Button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);


export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState({ totalQuizzes: 0, totalTakes: 0, uniqueStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed'

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const token = localStorage.getItem('quizwise-token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/my-quizzes?sortBy=${sortBy}`, {
          headers: { 'x-auth-token': token },
        });
        if (!response.ok) throw new Error('Failed to fetch your data.');
        const data = await response.json();
        setQuizzes(data.quizzes || []);
        setStats(data.stats || { totalQuizzes: 0, totalTakes: 0, uniqueStudents: 0 });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, [sortBy]);

  const handleShare = (quizId) => {
    const link = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredQuizzes = useMemo(() => 
    quizzes.filter(quiz => 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    ), [quizzes, searchTerm]);

  const chartData = quizzes
    .slice()
    .sort((a, b) => b.timesTaken - a.timesTaken)
    .slice(0, 5)
    .map(q => ({ name: q.title.slice(0, 15) + '...', timesTaken: q.timesTaken }));

  // Performance data for pie chart
  const performanceData = quizzes.length > 0 ? [
    { name: 'High Engagement (10+ takes)', value: quizzes.filter(q => q.timesTaken >= 10).length, color: '#10b981' },
    { name: 'Medium Engagement (5-9 takes)', value: quizzes.filter(q => q.timesTaken >= 5 && q.timesTaken < 10).length, color: '#f59e0b' },
    { name: 'Low Engagement (<5 takes)', value: quizzes.filter(q => q.timesTaken < 5).length, color: '#ef4444' }
  ].filter(item => item.value > 0) : [];
    
  const openDeleteModal = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
        const token = localStorage.getItem('quizwise-token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/${quizToDelete._id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token },
        });
        if (!response.ok) throw new Error('Failed to delete quiz.');
        setQuizzes(quizzes.filter(q => q._id !== quizToDelete._id));
    } catch (err) {
        setError(err.message);
    } finally {
        setShowDeleteModal(false);
        setQuizToDelete(null);
    }
  };

  const achievements = [];
  if (stats.totalQuizzes > 0) achievements.push({ icon: AwardIcon, title: "Quiz Creator", description: "You created your first quiz!" });
  if (stats.totalQuizzes >= 5) achievements.push({ icon: AwardIcon, title: "Prolific Author", description: "Created 5+ quizzes." });
  if (stats.totalTakes >= 50) achievements.push({ icon: AwardIcon, title: "Popular Educator", description: "Your quizzes have been taken 50 times." });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <div className="text-center text-red-500">
          <AlertTriangleIcon className="w-12 h-12 mx-auto mb-4" />
          <p>Error: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
        <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteQuiz} title="Delete Quiz?" message={`Are you sure you want to permanently delete "${quizToDelete?.title}"? This action cannot be undone.`}/>
        <div className="space-y-8">
          {/* Header Section */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Teacher Dashboard 👨‍🏫
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and analyze your quiz performance
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant={viewMode === 'overview' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('overview')}
              >
                Overview
              </Button>
              <Button 
                variant={viewMode === 'detailed' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('detailed')}
              >
                Detailed
              </Button>
              <Link to="/quiz-maker">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Quiz
                </Button>
              </Link>
            </div>
          </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-4"><div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full"><BookIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Quizzes</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalQuizzes}</p></div></div></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-4"><div className="bg-green-100 dark:bg-green-900 p-3 rounded-full"><UsersIcon className="w-6 h-6 text-green-600 dark:text-green-400"/></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Takes</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTakes}</p></div></div></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-4"><div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full"><UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400"/></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Unique Students</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.uniqueStudents}</p></div></div></div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div className="lg:col-span-1 space-y-8" variants={itemVariants}>
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Most Popular Quizzes</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}/>
                                    <Bar dataKey="timesTaken" fill="#4f46e5" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">My Achievements</h3>
                        {achievements.length > 0 ? (
                            <div className="space-y-4">
                                {achievements.map((ach, index) => {
                                    const Icon = ach.icon;
                                    return (
                                        <div key={index} className="flex items-center gap-4"><div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full"><Icon className="w-6 h-6 text-yellow-500 dark:text-yellow-400"/></div><div><p className="font-semibold text-gray-800 dark:text-gray-200">{ach.title}</p><p className="text-xs text-gray-500 dark:text-gray-400">{ach.description}</p></div></div>
                                    )
                                })}
                            </div>
                        ) : <p className="text-sm text-gray-500 dark:text-gray-400">Create a quiz to earn your first badge!</p>}
                    </div>
                </motion.div>

                <motion.div className="lg:col-span-2" variants={itemVariants}>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <input type="text" placeholder="Search your quizzes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                            <option value="createdAt">Sort by Newest</option>
                            <option value="timesTaken">Sort by Popular</option>
                        </select>
                    </div>

                    {filteredQuizzes.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Quizzes Found</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Try a different search term or create a new quiz!</p>
                        </div>
                    ) : (
                        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8" variants={containerVariants}>
                            {filteredQuizzes.map((quiz) => (
                                <motion.div key={quiz._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transform hover:-translate-y-2 transition-transform duration-300" variants={itemVariants}>
                                    <div className="p-6 flex-grow">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{quiz.title}</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Created on {new Date(quiz.createdAt).toLocaleDateString()}</p>
                                        <div className="mt-4 flex justify-around text-center text-sm">
                                            <div><p className="font-bold text-indigo-600 dark:text-indigo-400 text-xl">{quiz.questions.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Questions</p></div>
                                            <div><p className="font-bold text-indigo-600 dark:text-indigo-400 text-xl">{quiz.timesTaken}</p><p className="text-xs text-gray-500 dark:text-gray-400">Times Taken</p></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-end gap-4">
                                        <button onClick={() => handleShare(quiz._id)} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"><LinkIcon className="w-4 h-4"/>Share</button>
                                        <Link to={`/quiz/edit/${quiz._id}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"><EditIcon className="w-4 h-4"/>Edit</Link>
                                        <button onClick={() => openDeleteModal(quiz)} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 font-semibold"><TrashIcon className="w-4 h-4"/>Delete</button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
        <AnimatePresence>
            {copied && <motion.div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white rounded-full shadow-lg" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>Link Copied!</motion.div>}
        </AnimatePresence>
    </>
  );
}
