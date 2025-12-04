import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Users,
  MessageCircle,
  Trophy,
  Bell,
  UserPlus,
  Search,
  Gamepad2,
  Radio,
  Heart,
  Award,
  Clock,
  CheckCircle,
  X,
  UserCheck,
  UserX,
  Loader,
} from "lucide-react";

const SocialDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchFriends(),
        fetchChallenges(),
        fetchNotifications(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/friends`,
        {
          headers: { "x-auth-token": token },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/challenges`,
        {
          headers: { "x-auth-token": token },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setChallenges(data.challenges || []);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications`,
        {
          headers: { "x-auth-token": token },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/users/search?query=${encodeURIComponent(searchQuery)}`,
        { headers: { "x-auth-token": token } }
      );
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (recipientId) => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/friends/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ recipientId }),
        }
      );

      if (response.ok) {
        alert("Friend request sent successfully!");
        searchUsers(); // Refresh search results
      } else {
        const error = await response.json();
        alert(error.message || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request");
    }
  };

  const respondToFriendRequest = async (friendshipId, action) => {
    try {
      const token = localStorage.getItem("quizwise-token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/friends/respond/${friendshipId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ action }),
        }
      );

      if (response.ok) {
        alert(`Friend request ${action}ed successfully!`);
        fetchNotifications(); // Refresh notifications
        fetchFriends(); // Refresh friends list
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} friend request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      alert(`Failed to ${action} friend request`);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("quizwise-token");
      await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { "x-auth-token": token },
        }
      );
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const renderFriendsTab = () => (
    <div className="space-y-6">
      {/* Search Users */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Find Friends
        </h3>
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchUsers()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <button
            onClick={searchUsers}
            disabled={loading || searchQuery.trim().length < 2}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
            Search
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Search Results:
            </h4>
            {searchResults.map((searchUser) => (
              <div
                key={searchUser._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {searchUser.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {searchUser.email} • {searchUser.role}
                  </p>
                </div>
                <div>
                  {searchUser.friendshipStatus === "none" && (
                    <button
                      onClick={() => sendFriendRequest(searchUser._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add Friend
                    </button>
                  )}
                  {searchUser.friendshipStatus === "pending" && (
                    <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  {searchUser.friendshipStatus === "accepted" && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Friends
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
          My Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No friends yet. Start by searching for users above!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {friends.map((friendship) => (
              <div
                key={friendship.friendshipId}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {friendship.friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {friendship.friend.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {friendship.friend.role} • Friends since{" "}
                      {new Date(friendship.since).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => (window.location.href = "/chat")}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </button>
                  <button
                    onClick={() => (window.location.href = "/create-challenge")}
                    className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderChallengesTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          Quiz Challenges
        </h3>
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No challenges yet. Challenge your friends to start competing!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div
                key={challenge._id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-gray-800 dark:text-white">
                      {challenge.quiz.title}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      challenge.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                        : challenge.status === "accepted"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        : challenge.status === "completed"
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {challenge.status.charAt(0).toUpperCase() +
                      challenge.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <p>
                    <strong>Challenger:</strong> {challenge.challenger.name} •
                    <strong> Challenged:</strong> {challenge.challenged.name}
                  </p>
                  <p className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(challenge.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {challenge.status === "completed" && challenge.winner && (
                  <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <Award className="w-5 h-5" />
                      <span className="font-medium">
                        Winner:{" "}
                        {challenge.winner === user.id
                          ? "You!"
                          : challenge.challenger._id === challenge.winner
                          ? challenge.challenger.name
                          : challenge.challenged.name}
                      </span>
                    </div>
                    {challenge.challengerResult &&
                      challenge.challengedResult && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>
                            {challenge.challenger.name}:{" "}
                            {challenge.challengerResult.percentage}%
                          </p>
                          <p>
                            {challenge.challenged.name}:{" "}
                            {challenge.challengedResult.percentage}%
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  notification.isRead
                    ? "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    : "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900"
                }`}
                onClick={() =>
                  !notification.isRead &&
                  markNotificationAsRead(notification._id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        notification.type === "friend-request"
                          ? "bg-blue-100 dark:bg-blue-900"
                          : notification.type === "challenge-won"
                          ? "bg-green-100 dark:bg-green-900"
                          : notification.type === "quiz-challenge"
                          ? "bg-purple-100 dark:bg-purple-900"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      {notification.type === "friend-request" && (
                        <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                      {notification.type === "friend-accepted" && (
                        <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                      {notification.type === "quiz-challenge" && (
                        <Gamepad2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                      {notification.type === "challenge-won" && (
                        <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                      {notification.type === "broadcast" && (
                        <Radio className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>

                {/* Friend Request Actions */}
                {notification.type === "friend-request" &&
                  !notification.isRead && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          respondToFriendRequest(
                            notification.metadata.friendshipId,
                            "accept"
                          );
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          respondToFriendRequest(
                            notification.metadata.friendshipId,
                            "decline"
                          );
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 flex items-center gap-1"
                      >
                        <UserX className="w-3 h-3" />
                        Decline
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (
    loading &&
    !friends.length &&
    !challenges.length &&
    !notifications.length
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading social features...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 relative overflow-hidden py-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg mb-4">
            Social Hub
          </h1>
          <p className="text-xl font-bold text-slate-700 tracking-wide">
            Connect with{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              friends
            </span>
            , compete in challenges, and stay updated! 🎮
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-2xl shadow-xl p-2 flex gap-2">
            <button
              onClick={() => setActiveTab("friends")}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === "friends"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105"
                  : "text-slate-700 hover:bg-white/60 hover:scale-105"
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Friends
            </button>
            <button
              onClick={() => setActiveTab("challenges")}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === "challenges"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105"
                  : "text-slate-700 hover:bg-white/60 hover:scale-105"
              }`}
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              Challenges
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-8 py-3 rounded-xl font-bold transition-all relative ${
                activeTab === "notifications"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105"
                  : "text-slate-700 hover:bg-white/60 hover:scale-105"
              }`}
            >
              <Bell className="w-5 h-5 inline mr-2" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-black shadow-lg animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "friends" && renderFriendsTab()}
          {activeTab === "challenges" && renderChallengesTab()}
          {activeTab === "notifications" && renderNotificationsTab()}
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;
