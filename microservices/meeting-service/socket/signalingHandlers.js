/**
 * WebRTC Signaling Handlers
 * Handles all WebRTC signaling between peers (offers, answers, ICE candidates)
 * NOTE: Backend only relays signaling - media goes directly peer-to-peer
 */

const meetingManager = require("../services/meetingManager");
const Meeting = require("../models/Meeting");
const createLogger = require("../../shared/utils/logger");

const logger = createLogger("signaling-handlers");

// ICE server configuration (STUN/TURN)
const getIceServers = () => {
  const iceServers = [];

  // Add STUN servers (with fallback to Google's public STUN server)
  const stunServersString =
    process.env.STUN_SERVERS || "stun.l.google.com:19302";
  const stunServers = stunServersString.split(",");
  stunServers.forEach((server) => {
    iceServers.push({ urls: `stun:${server.trim()}` });
  });

  // Add TURN servers (if configured)
  if (process.env.TURN_SERVER && process.env.TURN_USERNAME) {
    iceServers.push({
      urls: `turn:${process.env.TURN_SERVER}`,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD,
    });
  }

  return iceServers;
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    let currentRoomId = null;
    let currentUserId = null;

    // ============================================
    // JOIN MEETING
    // ============================================
    socket.on("join-meeting", async (data, callback) => {
      try {
        const {
          roomId,
          userId,
          userName,
          userPicture,
          isVideoEnabled,
          isAudioEnabled,
        } = data;

        logger.info(`User ${userId} joining meeting ${roomId}`);

        // Get meeting from Redis
        let meeting = await meetingManager.getMeeting(roomId);

        if (!meeting) {
          // Fallback to database
          const dbMeeting = await Meeting.findOne({
            roomId,
            status: { $in: ["waiting", "active"] },
          });

          if (!dbMeeting) {
            socket.emit("meeting-error", { error: "Meeting not found" });
            return;
          }

          // Cache meeting in Redis
          meeting = await meetingManager.createMeeting({
            roomId: dbMeeting.roomId,
            title: dbMeeting.title,
            hostId: dbMeeting.hostId,
            maxParticipants: dbMeeting.settings.maxParticipants,
            settings: dbMeeting.settings,
          });
        }

        // Check participant limit
        const participantCount = await meetingManager.getParticipantCount(
          roomId
        );
        if (participantCount >= meeting.maxParticipants) {
          socket.emit("meeting-error", { error: "Meeting is full" });
          return;
        }

        // Join socket room
        socket.join(roomId);
        currentRoomId = roomId;
        currentUserId = userId;

        // Add participant to Redis
        const participant = await meetingManager.addParticipant(roomId, {
          userId,
          userName,
          userPicture,
          socketId: socket.id,
          peerId: socket.id,
          isVideoEnabled,
          isAudioEnabled,
        });

        // Update meeting status to active
        if (meeting.status === "waiting") {
          await meetingManager.updateMeeting(roomId, {
            status: "active",
            startedAt: new Date().toISOString(),
          });

          // Update database
          await Meeting.findOneAndUpdate(
            { roomId },
            { status: "active", startedAt: new Date() }
          );
        }

        // Get all existing participants
        const allParticipants = await meetingManager.getAllParticipants(roomId);
        const otherParticipants = allParticipants.filter(
          (p) => p.userId !== userId
        );

        // Send ICE servers to new participant
        socket.emit("ice-servers", { iceServers: getIceServers() });

        // Send existing participants to new participant
        socket.emit("existing-participants", {
          participants: otherParticipants.map((p) => ({
            userId: p.userId,
            userName: p.userName,
            name: p.userName, // Alias for frontend compatibility
            userPicture: p.userPicture,
            peerId: p.peerId,
            socketId: p.socketId || p.peerId, // Include socketId for WebRTC
            isAudioEnabled: p.isAudioEnabled,
            isVideoEnabled: p.isVideoEnabled,
            isScreenSharing: p.isScreenSharing,
            isHost: p.userId === meeting.hostId?.toString(), // Mark if participant is host
          })),
          hostId: meeting.hostId, // Send hostId separately for easy access
        });

        // Notify others about new participant
        socket.to(roomId).emit("participant-joined", {
          userId: participant.userId,
          userName: participant.userName,
          name: participant.userName, // Alias for frontend compatibility
          userPicture: participant.userPicture,
          peerId: participant.peerId,
          socketId: socket.id, // Include socketId for WebRTC
          isAudioEnabled: participant.isAudioEnabled,
          isVideoEnabled: participant.isVideoEnabled,
          isHost: participant.userId === meeting.hostId?.toString(), // Mark if new participant is host
        });

        // Confirm join to participant with meeting info
        socket.emit("joined-meeting", {
          roomId,
          userId,
          userName,
          peerId: socket.id,
          meeting: {
            title: meeting.title,
            hostId: meeting.hostId,
            settings: meeting.settings,
          },
        });

        // Call acknowledgment callback if provided
        if (typeof callback === "function") {
          callback({
            success: true,
            meeting: {
              roomId,
              title: meeting.title,
              participants: otherParticipants,
            },
          });
        }

        // Extend meeting TTL
        await meetingManager.extendMeetingTTL(roomId);

        logger.info(
          `User ${userId} joined meeting ${roomId} (${otherParticipants.length} existing participants)`
        );
      } catch (error) {
        logger.error("Error joining meeting:", error);
        socket.emit("meeting-error", { error: "Failed to join meeting" });
        if (typeof callback === "function") {
          callback({ success: false, error: "Failed to join meeting" });
        }
      }
    });

    // ============================================
    // WebRTC SIGNALING
    // ============================================

    /**
     * OFFER
     * Peer A creates offer and sends to Peer B
     * Frontend sends: { targetSocketId, offer, from }
     */
    socket.on("webrtc-offer", async (data) => {
      try {
        const { targetSocketId, offer, from } = data;

        logger.info(
          `WebRTC offer from ${socket.id} (${from}) to ${targetSocketId}`
        );

        // Relay offer to target peer using socket ID directly
        io.to(targetSocketId).emit("webrtc-offer", {
          offer,
          from: from || currentUserId,
          socketId: socket.id,
        });
        logger.info(`WebRTC offer relayed to ${targetSocketId}`);
      } catch (error) {
        logger.error("Error handling WebRTC offer:", error);
        socket.emit("peer-connection-error", { error: "Failed to send offer" });
      }
    });

    /**
     * ANSWER
     * Peer B creates answer and sends back to Peer A
     * Frontend sends: { targetSocketId, answer }
     */
    socket.on("webrtc-answer", async (data) => {
      try {
        const { targetSocketId, answer, from } = data;

        logger.info(
          `WebRTC answer from ${socket.id} (${from}) to ${targetSocketId}`
        );

        // Relay answer to target peer using socket ID directly
        io.to(targetSocketId).emit("webrtc-answer", {
          answer,
          from: from || currentUserId,
          socketId: socket.id,
        });
        logger.info(`WebRTC answer relayed to ${targetSocketId}`);
      } catch (error) {
        logger.error("Error handling WebRTC answer:", error);
        socket.emit("peer-connection-error", {
          error: "Failed to send answer",
        });
      }
    });

    /**
     * ICE CANDIDATE
     * Exchange ICE candidates for NAT traversal
     * Frontend sends: { targetSocketId, candidate }
     */
    socket.on("ice-candidate", async (data) => {
      try {
        const { targetSocketId, candidate } = data;

        logger.debug(`ICE candidate from ${socket.id} to ${targetSocketId}`);

        // Relay ICE candidate to target peer using socket ID directly
        io.to(targetSocketId).emit("ice-candidate", {
          candidate,
          from: currentUserId,
          socketId: socket.id,
        });
      } catch (error) {
        logger.error("Error handling ICE candidate:", error);
      }
    });

    // ============================================
    // MEDIA CONTROLS
    // ============================================

    /**
     * Toggle audio
     */
    socket.on("toggle-audio", async (data) => {
      try {
        const { roomId, isEnabled } = data;

        await meetingManager.updateParticipant(roomId, currentUserId, {
          isAudioEnabled: isEnabled,
        });

        // Notify others
        socket.to(roomId).emit("participant-audio-changed", {
          userId: currentUserId,
          isAudioEnabled: isEnabled,
        });

        logger.debug(
          `User ${currentUserId} audio ${isEnabled ? "enabled" : "disabled"}`
        );
      } catch (error) {
        logger.error("Error toggling audio:", error);
      }
    });

    /**
     * Toggle video
     */
    socket.on("toggle-video", async (data) => {
      try {
        const { roomId, isEnabled } = data;

        await meetingManager.updateParticipant(roomId, currentUserId, {
          isVideoEnabled: isEnabled,
        });

        // Notify others
        socket.to(roomId).emit("participant-video-changed", {
          userId: currentUserId,
          isVideoEnabled: isEnabled,
        });

        logger.debug(
          `User ${currentUserId} video ${isEnabled ? "enabled" : "disabled"}`
        );
      } catch (error) {
        logger.error("Error toggling video:", error);
      }
    });

    /**
     * Toggle screen share
     */
    socket.on("toggle-screen-share", async (data) => {
      try {
        const { roomId, isSharing } = data;

        await meetingManager.updateParticipant(roomId, currentUserId, {
          isScreenSharing: isSharing,
        });

        // Notify others
        socket.to(roomId).emit("participant-screen-share-changed", {
          userId: currentUserId,
          isScreenSharing: isSharing,
        });

        logger.info(
          `User ${currentUserId} screen sharing ${
            isSharing ? "started" : "stopped"
          }`
        );
      } catch (error) {
        logger.error("Error toggling screen share:", error);
      }
    });

    /**
     * Change video quality (for adaptive bitrate)
     */
    socket.on("change-video-quality", async (data) => {
      try {
        const { roomId, quality } = data;

        await meetingManager.updateParticipant(roomId, currentUserId, {
          videoQuality: quality,
        });

        logger.debug(
          `User ${currentUserId} changed video quality to ${quality}`
        );
      } catch (error) {
        logger.error("Error changing video quality:", error);
      }
    });

    // ============================================
    // CHAT
    // ============================================

    socket.on("meeting-chat-message", async (data) => {
      try {
        const { roomId, message } = data;

        const participant = await meetingManager.getParticipant(
          roomId,
          currentUserId
        );

        // Broadcast message to all participants
        io.to(roomId).emit("meeting-chat-message", {
          userId: currentUserId,
          userName: participant?.userName,
          message,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error("Error sending chat message:", error);
      }
    });

    // ============================================
    // LEAVE MEETING
    // ============================================

    socket.on("leave-meeting", async (data) => {
      try {
        const { roomId } = data || {};
        const roomToLeave = roomId || currentRoomId;
        const userToRemove = currentUserId;

        if (!roomToLeave || !userToRemove) return;

        logger.info(`User ${userToRemove} leaving meeting ${roomToLeave}`);

        // Remove participant from Redis
        await meetingManager.removeParticipant(roomToLeave, userToRemove);

        // Leave socket room
        socket.leave(roomToLeave);

        // Notify others
        socket.to(roomToLeave).emit("participant-left", {
          userId: userToRemove,
          socketId: socket.id,
        });

        // Check if meeting is empty
        const participantCount = await meetingManager.getParticipantCount(
          roomToLeave
        );

        if (participantCount === 0) {
          // End meeting in database
          await Meeting.findOneAndUpdate(
            { roomId: roomToLeave },
            {
              status: "completed",
              endedAt: new Date(),
            }
          );

          // Delete meeting from Redis
          await meetingManager.deleteMeeting(roomToLeave);

          logger.info(`Meeting ${roomToLeave} ended (no participants)`);
        }

        currentRoomId = null;
        currentUserId = null;
      } catch (error) {
        logger.error("Error leaving meeting:", error);
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================

    socket.on("disconnect", async () => {
      try {
        logger.debug(`Socket disconnected: ${socket.id}`);

        // Get room from socket mapping
        const mapping = await meetingManager.getRoomFromSocket(socket.id);

        if (mapping && mapping.roomId) {
          const { roomId, userId } = mapping;

          logger.info(`User ${userId} disconnected from meeting ${roomId}`);

          // Remove participant
          await meetingManager.removeParticipant(roomId, userId);

          // Notify others
          socket
            .to(roomId)
            .emit("participant-left", { userId, socketId: socket.id });

          // Check if meeting is empty
          const participantCount = await meetingManager.getParticipantCount(
            roomId
          );

          if (participantCount === 0) {
            await Meeting.findOneAndUpdate(
              { roomId },
              {
                status: "completed",
                endedAt: new Date(),
              }
            );

            await meetingManager.deleteMeeting(roomId);
            logger.info(
              `Meeting ${roomId} ended (no participants after disconnect)`
            );
          }
        }
      } catch (error) {
        logger.error("Error handling disconnect:", error);
      }
    });
  });
};
