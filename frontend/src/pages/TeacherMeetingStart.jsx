import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Video, Copy, Star, Sparkles, Users, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { getApiUrl } from "../lib/apiConfig";

const TeacherMeetingStart = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");

  const createMeeting = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem("quizwise-token");

      if (!token) {
        alert("Session expired. Please login again.");
        setIsCreating(false);
        return;
      }

      const apiUrl = getApiUrl(); // Use API Gateway for REST calls

      const response = await fetch(`${apiUrl}/api/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token, // Use x-auth-token header (preferred by backend)
        },
        body: JSON.stringify({
          title: title || "My Meeting",
          description: "",
          hostId: user?.id || user?._id,
          hostName: user?.name || user?.username || "Teacher",
        }),
      });

      const data = await response.json();

      if (data.success && data.meeting) {
        const generatedRoomId = data.meeting.roomId;
        setCreatedRoomId(generatedRoomId);
        console.log("[Teacher] Meeting created:", generatedRoomId);

        // Navigate to meeting room
        setTimeout(() => {
          navigate(`/meeting/${generatedRoomId}`);
        }, 1000);
      } else {
        alert(data.error || "Failed to create meeting");
      }
    } catch (err) {
      console.error("[Teacher] Error creating meeting:", err);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyRoomId = () => {
    if (createdRoomId) {
      navigator.clipboard.writeText(createdRoomId);
      alert("Room ID copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 relative overflow-hidden py-8 px-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section - Gamified */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg mb-4">
            Start Live Meeting
          </h1>
          <p className="text-xl font-bold text-slate-700 tracking-wide">
            Connect with your students in{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              real-time
            </span>{" "}
            🎥
          </p>
        </motion.div>

        {/* Main Meeting Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />

          <div className="relative bg-white/70 backdrop-blur-2xl border-2 border-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-500 overflow-hidden">
            {/* Animated orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-violet-400/30 to-purple-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-fuchsia-400/30 to-pink-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10">
              {!createdRoomId ? (
                <>
                  {/* Header Icon */}
                  <motion.div
                    className="flex items-center justify-center gap-3 mb-8"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">
                      New Meeting
                    </h2>
                  </motion.div>

                  <div className="space-y-6">
                    {/* Title Input */}
                    <div>
                      <label className="text-slate-900 text-sm font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                        Meeting Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border-2 border-violet-200 rounded-xl text-slate-900 font-semibold placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all"
                        placeholder="e.g., Physics Class Session"
                      />
                    </div>

                    {/* Room ID Input */}
                    <div>
                      <label className="text-slate-900 text-sm font-bold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-fuchsia-600" />
                        Custom Room ID{" "}
                        <span className="text-slate-500 font-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border-2 border-fuchsia-200 rounded-xl text-slate-900 font-semibold placeholder-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-400 transition-all"
                        placeholder="Leave blank for auto-generated ID"
                      />
                    </div>

                    {/* Create Button */}
                    <motion.button
                      onClick={createMeeting}
                      disabled={isCreating}
                      className="group/btn relative w-full overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 rounded-xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl" />

                      <div className="relative px-6 py-4 flex items-center justify-center gap-3 text-white font-black text-lg">
                        {isCreating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creating Meeting...</span>
                          </>
                        ) : (
                          <>
                            <Rocket className="w-6 h-6" />
                            <span>Create & Start Meeting</span>
                            <Star className="w-5 h-5 fill-white" />
                          </>
                        )}
                      </div>

                      {/* Shine effect */}
                      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                      </div>
                    </motion.button>

                    {/* Info Badge */}
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 backdrop-blur-md border border-violet-300/50 rounded-xl">
                      <Star className="w-4 h-4 text-violet-600 fill-violet-600" />
                      <span className="text-sm font-bold text-slate-700">
                        Share the room ID with students to join
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Success Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg"
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.6 }}
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Meeting Created! 🎉
                    </h3>
                  </div>

                  {/* Room ID Display */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-md border-2 border-emerald-300/50 rounded-2xl p-6">
                    <p className="text-emerald-700 font-bold text-sm mb-3 text-center">
                      Your Meeting Room ID
                    </p>
                    <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-xl px-4 py-3 shadow-inner">
                      <span className="text-slate-900 font-black font-mono text-2xl tracking-wider">
                        {createdRoomId}
                      </span>
                      <motion.button
                        onClick={copyRoomId}
                        className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Copy className="w-5 h-5 text-white" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Redirecting Message */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 backdrop-blur-md border border-violet-300/50 rounded-full">
                      <div className="w-4 h-4 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
                      <span className="text-sm font-bold text-slate-700">
                        Redirecting to meeting room...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherMeetingStart;
