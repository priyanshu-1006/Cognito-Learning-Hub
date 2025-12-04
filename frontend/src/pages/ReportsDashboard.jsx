import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { 
  Flag, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  Archive,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/Loading';

const AlertOctagonIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const ReportCard = ({ report, onAction }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action) => {
    setActionLoading(true);
    await onAction(report._id, action);
    setActionLoading(false);
  };

  const getReasonColor = (reason) => {
    const colors = {
      'inappropriate': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'incorrect': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'spam': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'offensive': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'copyright': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[reason] || colors['other'];
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'dismissed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors['pending'];
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {report.quiz?.title || 'Unknown Quiz'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getReasonColor(report.reason)}>
                {report.reason}
              </Badge>
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reporter Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
        <User className="w-4 h-4" />
        <span>Reported by: {report.reportedBy?.name || 'Anonymous'}</span>
        <Clock className="w-4 h-4 ml-4" />
        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Question Preview */}
      {report.questionText && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              "{report.questionText}"
            </p>
          </div>
        </div>
      )}

      {/* Details Section */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4"
          >
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Report Details</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reason: {report.reason}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Quiz ID:</h4>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {report.quiz?._id}
                </code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        {report.quiz?._id && (
          <Link 
            to={`/quiz/edit/${report.quiz._id}`}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Quiz
          </Link>
        )}
        
        {report.status === 'pending' && (
          <>
            <Button
              size="sm"
              onClick={() => handleAction('resolve')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Resolve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('dismiss')}
              disabled={actionLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('delete-quiz')}
              disabled={actionLoading}
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900"
            >
              <Ban className="w-4 h-4 mr-1" />
              Delete Quiz
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, color = 'blue', trend }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function ReportsDashboard() {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    dismissed: 0
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, reasonFilter]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('quizwise-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      setReports(data);
      
      // Calculate stats
      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        resolved: data.filter(r => r.status === 'resolved').length,
        dismissed: data.filter(r => r.status === 'dismissed').length
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Reason filter
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(report => report.reason === reasonFilter);
    }

    setFilteredReports(filtered);
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const token = localStorage.getItem('quizwise-token');
      
      let endpoint;
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'resolve':
          endpoint = `/api/reports/${reportId}/resolve`;
          body = { status: 'resolved' };
          break;
        case 'dismiss':
          endpoint = `/api/reports/${reportId}/dismiss`;
          body = { status: 'dismissed' };
          break;
        case 'delete-quiz':
          const report = reports.find(r => r._id === reportId);
          if (report?.quiz?._id) {
            endpoint = `/api/moderator/quizzes/${report.quiz._id}`;
            method = 'DELETE';
          }
          break;
        default:
          return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });

      if (!response.ok) throw new Error(`Failed to ${action} report`);

      // Update the specific report in the state
      if (action === 'resolve' || action === 'dismiss') {
        setReports(reports.map(r => 
          r._id === reportId 
            ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' }
            : r
        ));
      } else if (action === 'delete-quiz') {
        // Refresh reports after quiz deletion
        await fetchReports();
      }
      
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} report. Please try again.`);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl text-white">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Reports Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage quiz reports and maintain platform quality
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Flag className="w-6 h-6 text-red-600" />}
            label="Total Reports"
            value={stats.total}
            color="red"
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
            label="Pending"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            label="Resolved"
            value={stats.resolved}
            color="green"
          />
          <StatCard
            icon={<XCircle className="w-6 h-6 text-gray-600" />}
            label="Dismissed"
            value={stats.dismissed}
            color="gray"
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports, quizzes, or reporters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Reasons</option>
                  <option value="inappropriate">Inappropriate</option>
                  <option value="incorrect">Incorrect</option>
                  <option value="spam">Spam</option>
                  <option value="offensive">Offensive</option>
                  <option value="copyright">Copyright</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No reports found
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  {searchTerm || statusFilter !== 'all' || reasonFilter !== 'all' 
                    ? 'Try adjusting your filters to see more reports.'
                    : 'No reports have been submitted yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredReports.map(report => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onAction={handleReportAction}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
