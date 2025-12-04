import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowLeft, Users, Clock, Trophy, Target, TrendingUp, CheckCircle, XCircle, Award } from 'lucide-react';

const LiveSessionAnalytics = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/live-sessions/${sessionCode}/analytics`,
          {
            headers: {
              'x-auth-token': localStorage.getItem('token'),
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sessionCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-300">{error || 'Analytics not found'}</p>
          <button
            onClick={() => navigate('/teacher-dashboard')}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate derived metrics
  const totalParticipants = analytics.totalParticipants || 0;
  const completionRate = totalParticipants > 0
    ? ((analytics.completedParticipants / totalParticipants) * 100).toFixed(1)
    : 0;
  
  const avgScore = analytics.averageScore || 0;
  const avgTime = analytics.averageTimePerQuestion || 0;

  // Prepare chart data
  const questionPerformance = analytics.questionStats?.map((q, index) => ({
    question: `Q${index + 1}`,
    correctRate: ((q.correctAnswers / q.totalAnswers) * 100).toFixed(1),
    avgTime: q.averageTime.toFixed(1),
  })) || [];

  const scoreDistribution = [
    { range: '0-25%', count: analytics.scoreRanges?.low || 0 },
    { range: '26-50%', count: analytics.scoreRanges?.mediumLow || 0 },
    { range: '51-75%', count: analytics.scoreRanges?.mediumHigh || 0 },
    { range: '76-100%', count: analytics.scoreRanges?.high || 0 },
  ];

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/teacher-dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Session Analytics
            </h1>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <span className="font-mono text-lg">{sessionCode}</span>
              <span>•</span>
              <span>{analytics.quizTitle}</span>
              <span>•</span>
              <span>{new Date(analytics.createdAt).toLocaleDateString()}</span>
            </div>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 text-blue-500" />
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{totalParticipants}</span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Total Participants</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{completionRate}%</span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Completion Rate</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-10 h-10 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{avgScore.toFixed(1)}</span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Average Score</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-10 h-10 text-purple-500" />
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{avgTime.toFixed(1)}s</span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Avg Time/Question</h3>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Question Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-500" />
              Question Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={questionPerformance}>
                <XAxis dataKey="question" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="correctRate" fill="#3b82f6" name="Correct %" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Score Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              Score Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Top Performers */}
        {analytics.topPerformers && analytics.topPerformers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Top Performers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.topPerformers.slice(0, 3).map((performer, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    index === 0
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : index === 1
                      ? 'border-gray-400 bg-gray-50 dark:bg-gray-700/20'
                      : 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-2xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">{performer.username}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {performer.score.toFixed(1)} points
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {performer.correctAnswers}/{analytics.totalQuestions} correct
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LiveSessionAnalytics;
