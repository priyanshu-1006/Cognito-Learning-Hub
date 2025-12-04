import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ReportsDashboard from './ReportsDashboard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

// Icons
const UsersIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BookIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const AlertTriangleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ShieldIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const ActivityIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const TrendingUpIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const SearchIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;


// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }};
const tabContentVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeInOut' } }, exit: { opacity: 0, x: 20, transition: { duration: 0.4, ease: 'easeInOut' } }};

// --- Components ---
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
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-2 mt-6">
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPageChange(currentPage - 1)} 
                disabled={currentPage === 1}
            >
                Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                Page {currentPage} of {totalPages}
            </span>
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPageChange(currentPage + 1)} 
                disabled={currentPage >= totalPages}
            >
                Next
            </Button>
        </div>
    );
};


export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({ userSignups: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [quizPage, setQuizPage] = useState(1);
  const [quizTotalPages, setQuizTotalPages] = useState(1);
  const [quizSearch, setQuizSearch] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('quizwise-token');
    try {
      const [usersRes, quizzesRes, reportsRes, analyticsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?page=${userPage}&search=${userSearch}`, { headers: { 'x-auth-token': token } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/quizzes?page=${quizPage}&search=${quizSearch}`, { headers: { 'x-auth-token': token } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/reports`, { headers: { 'x-auth-token': token } }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, { headers: { 'x-auth-token': token } })
      ]);
      const usersData = await usersRes.json();
      const quizzesData = await quizzesRes.json();
      const reportsData = await reportsRes.json();
      const analyticsData = await analyticsRes.json();

      setUsers(usersData.users || []);
      setUserTotalPages(usersData.totalPages || 1);
      setQuizzes(quizzesData.quizzes || []);
      setQuizTotalPages(quizzesData.totalPages || 1);
      setReports(reportsData || []);
      setAnalytics(analyticsData || { userSignups: [] });
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
    }
  }, [userPage, userSearch, quizPage, quizSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('quizwise-token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ role: newRole })
    });
    fetchData();
  };

  const openDeleteModal = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    const token = localStorage.getItem('quizwise-token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/quizzes/${quizToDelete._id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
    });
    setShowDeleteModal(false);
    setQuizToDelete(null);
    fetchData();
  };

  const totalTeachers = users.filter(u => u.role === 'Teacher').length;
  const totalStudents = users.filter(u => u.role === 'Student').length;
  const totalModerators = users.filter(u => u.role === 'Moderator').length;
  const totalAdmins = users.filter(u => u.role === 'Admin').length;
  
  const chartData = analytics.userSignups.map(item => ({ 
    name: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
    signups: item.count 
  }));

  const roleData = [
    { name: 'Students', value: totalStudents, color: '#3b82f6' },
    { name: 'Teachers', value: totalTeachers, color: '#10b981' },
    { name: 'Moderators', value: totalModerators, color: '#f59e0b' },
    { name: 'Admins', value: totalAdmins, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <>
      <ConfirmationModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDeleteQuiz} 
        title="Delete Quiz?" 
        message={`Are you sure you want to permanently delete "${quizToDelete?.title}"? This action cannot be undone.`}
      />
      
      <div className="space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage users, quizzes, and platform settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <ActivityIcon className="w-4 h-4 mr-2" />
                System Health
              </Button>
              <Button>
                <TrendingUpIcon className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-10"></div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
                  <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">+{analytics.userSignups?.reduce((acc, item) => acc + item.count, 0) || 0} this week</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full opacity-10"></div>
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl">
                  <BookIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Quizzes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{quizzes.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Across all subjects</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-10"></div>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-xl">
                  <UsersIcon className="w-6 h-6 text-green-600 dark:text-green-400"/>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTeachers}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active educators</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-10"></div>
              <div className="flex items-center gap-4">
                <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-xl">
                  <AlertTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400"/>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Reports</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requires attention</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                User Registrations (Last 7 Days)
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)"/>
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }}/>
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }}/>
                    <Tooltip contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #4b5563',
                      borderRadius: '8px'
                    }}/>
                    <Bar dataKey="signups" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                User Role Distribution
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #4b5563',
                      borderRadius: '8px'
                    }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'users', label: 'User Management', icon: UsersIcon },
                  { id: 'quizzes', label: 'Quiz Management', icon: BookIcon },
                  { id: 'reports', label: 'Reports', icon: AlertTriangleIcon }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id 
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'users' && (
                <motion.div 
                  key="users" 
                  variants={tabContentVariants} 
                  initial="hidden" 
                  animate="visible" 
                  exit="exit"
                  className="p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
                    <div className="flex gap-3">
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Search users by name..."
                          value={userSearch}
                          onChange={(e) => { 
                            setUserSearch(e.target.value); 
                            setUserPage(1); 
                          }}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800/">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select 
                                value={user.role} 
                                onChange={(e) => handleRoleChange(user._id, e.target.value)} 
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option>Student</option>
                                <option>Teacher</option>
                                <option>Moderator</option>
                                <option>Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination currentPage={userPage} totalPages={userTotalPages} onPageChange={setUserPage} />
                </motion.div>
              )}

              {activeTab === 'quizzes' && (
                <motion.div 
                  key="quizzes" 
                  variants={tabContentVariants} 
                  initial="hidden" 
                  animate="visible" 
                  exit="exit"
                  className="p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Management</h3>
                    <div className="flex gap-3">
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Search quizzes by title..."
                          value={quizSearch}
                          onChange={(e) => { 
                            setQuizSearch(e.target.value); 
                            setQuizPage(1); 
                          }}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quiz</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created By</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Questions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {quizzes.map(quiz => (
                          <tr key={quiz._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                  <BookIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{quiz.title}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {quiz.createdBy?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="secondary">
                                {quiz.questions?.length || 0} questions
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <Link to={`/quiz/edit/${quiz._id}`}>
                                  <Button variant="outline" size="sm">Edit</Button>
                                </Link>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => openDeleteModal(quiz)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination currentPage={quizPage} totalPages={quizTotalPages} onPageChange={setQuizPage} />
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div 
                  key="reports" 
                  variants={tabContentVariants} 
                  initial="hidden" 
                  animate="visible" 
                  exit="exit"
                >
                  <ReportsDashboard />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
