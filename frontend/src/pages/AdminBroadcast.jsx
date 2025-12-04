import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Radio, 
  Send, 
  Users, 
  Calendar, 
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

const AdminBroadcast = () => {
  const { user } = useContext(AuthContext);
  const [broadcasts, setBroadcasts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'medium',
    targetAudience: { roles: ['Student', 'Teacher'] },
    scheduledFor: '',
    expiresAt: ''
  });

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchBroadcasts();
    }
  }, [user]);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('quizwise-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/broadcasts`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (response.ok) {
        setBroadcasts(data.broadcasts || []);
      }
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBroadcast = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('quizwise-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/broadcasts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Broadcast created successfully! 📢');
        setShowCreateForm(false);
        setFormData({
          title: '',
          content: '',
          type: 'announcement',
          priority: 'medium',
          targetAudience: { roles: ['Student', 'Teacher'] },
          scheduledFor: '',
          expiresAt: ''
        });
        fetchBroadcasts();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create broadcast');
      }
    } catch (error) {
      console.error('Error creating broadcast:', error);
      alert('Failed to create broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTargetAudienceChange = (role) => {
    const currentRoles = formData.targetAudience.roles || [];
    const updatedRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setFormData(prev => ({
      ...prev,
      targetAudience: { ...prev.targetAudience, roles: updatedRoles }
    }));
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Info className="w-4 h-4 text-blue-600" />;
      case 'low': return <Info className="w-4 h-4 text-gray-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement': return <Radio className="w-4 h-4" />;
      case 'maintenance': return <AlertTriangle className="w-4 h-4" />;
      case 'feature-update': return <CheckCircle className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <Radio className="w-4 h-4" />;
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access the broadcast panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <Radio className="w-8 h-8 text-red-600 dark:text-red-400" />
                Admin Broadcast Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Send announcements and updates to all users</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Broadcast
            </button>
          </div>

          {/* Create Broadcast Form */}
          {showCreateForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Create New Broadcast</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                      placeholder="Enter broadcast title..."
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                      placeholder="Enter your message content..."
                      rows={6}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      maxLength={500}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {formData.content.length}/500 characters
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="announcement">📢 Announcement</option>
                      <option value="maintenance">🔧 Maintenance</option>
                      <option value="feature-update">✨ Feature Update</option>
                      <option value="event">📅 Event</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="low">🔵 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <div className="space-y-2">
                      {['Student', 'Teacher', 'Admin', 'Moderator'].map(role => (
                        <label key={role} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.targetAudience.roles?.includes(role) || false}
                            onChange={() => handleTargetAudienceChange(role)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700">{role}s</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule For (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData(prev => ({...prev, scheduledFor: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires At (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({...prev, expiresAt: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createBroadcast}
                  disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Broadcasts List */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Recent Broadcasts</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading broadcasts...</p>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="p-8 text-center">
                <Radio className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600">No broadcasts created yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {broadcasts.map((broadcast) => (
                  <div key={broadcast._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full ${
                            broadcast.type === 'announcement' ? 'bg-blue-100 text-blue-600' :
                            broadcast.type === 'maintenance' ? 'bg-orange-100 text-orange-600' :
                            broadcast.type === 'feature-update' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {getTypeIcon(broadcast.type)}
                          </div>
                          <h3 className="font-bold text-gray-800">{broadcast.title}</h3>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(broadcast.priority)}
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              broadcast.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              broadcast.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              broadcast.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {broadcast.priority}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{broadcast.content}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {broadcast.targetAudience?.roles?.join(', ') || 'All users'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(broadcast.createdAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {broadcast.readBy?.length || 0} read
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcast;
