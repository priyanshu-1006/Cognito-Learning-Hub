import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Video, LogIn } from "lucide-react";

const StudentJoinMeeting = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState(user?.name || "");

  const joinMeeting = () => {
    if (!roomId.trim()) {
      alert("Please enter a room ID");
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Navigate to meeting room
    navigate(`/meeting/${roomId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Join a Meeting</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room ID"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>

          <Button
            onClick={joinMeeting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Join Meeting
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Make sure you have the correct room ID from your teacher.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentJoinMeeting;
