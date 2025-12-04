import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { getSocketUrl, getMeetingWsUrl } from "../lib/apiConfig";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  MessageSquare,
  PhoneOff,
  Settings,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/Button";

const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [peers, setPeers] = useState(new Map()); // socketId -> {stream, name, userId, role, isHost}
  const [participants, setParticipants] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);
  const [hostId, setHostId] = useState(null); // Track the meeting host
  const [myUserName, setMyUserName] = useState(""); // Store my display name
  const [chatMessages, setChatMessages] = useState([]);
  const calledPeersRef = useRef(new Set()); // Track peers we've already called
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null); // Ref to always access current localStream
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const myUserNameRef = useRef(""); // Ref to store user name for closures
  const callPeerRef = useRef(null); // Ref to store callPeer function for use in socket handlers
  const socketRef = useRef(null); // Ref to store socket for use in functions
  const createPeerConnectionRef = useRef(null); // Ref to store createPeerConnection
  const pendingOffersRef = useRef([]); // Queue offers received before local stream is ready
  const [iceServers, setIceServers] = useState([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ]);
  const iceServersRef = useRef(iceServers); // Ref for use in callbacks
  
  // Keep ref in sync with state
  useEffect(() => {
    iceServersRef.current = iceServers;
  }, [iceServers]);
  
  const configuration = {
    iceServers: iceServers,
    iceCandidatePoolSize: 10,
  };

  // Initialize socket connection to meeting service
  useEffect(() => {
    // Get meeting WebSocket URL from config (direct connection for WebRTC signaling)
    const meetingWsUrl = getMeetingWsUrl();
    const meetingUrl = meetingWsUrl
      .replace("ws://", "http://")
      .replace("wss://", "https://");
    const meetSocket = io(meetingUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    meetSocket.on("connect", () => {
      console.log("[Meeting] Connected:", meetSocket.id);
      setMySocketId(meetSocket.id);
      const displayName = user?.name || user?.username || "Guest";
      setMyUserName(displayName);
      myUserNameRef.current = displayName; // Store in ref for closures
      // Join the meeting room
      meetSocket.emit(
        "join-meeting",
        {
          roomId,
          userId: user?.id || user?._id || null,
          userName: displayName,
          userPicture: user?.picture || user?.profilePicture || null,
          isVideoEnabled: true,
          isAudioEnabled: true,
        },
        (response) => {
          if (response?.success) {
            console.log("[Meeting] Joined room:", roomId);
            setParticipants(response.meeting?.participants || []);
          } else {
            console.error("[Meeting] Failed to join:", response?.error);
            alert(response?.error || "Failed to join meeting");
            navigate("/");
          }
        }
      );
    });

    // Receive ICE servers from backend
    meetSocket.on("ice-servers", ({ iceServers: serverIceServers }) => {
      console.log("[Meeting] Received ICE servers from backend:", serverIceServers);
      if (serverIceServers && serverIceServers.length > 0) {
        setIceServers(serverIceServers);
      }
    });

    // Helper function to process an offer
    const processOffer = async (offer, from, fromSocket, sock) => {
      try {
        const pc = createPeerConnectionRef.current
          ? createPeerConnectionRef.current(fromSocket)
          : null;
        if (!pc) {
          console.error("[Meeting] createPeerConnection not available");
          return;
        }
        console.log(
          "[Meeting] Peer connection created, setting remote description"
        );
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("[Meeting] Remote description set, creating answer");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[Meeting] Sending answer to", fromSocket);
        sock.emit("webrtc-answer", {
          targetSocketId: fromSocket,
          answer,
          from:
            myUserNameRef.current || user?.name || user?.username || "Guest",
        });
      } catch (err) {
        console.error("[Meeting] Error handling offer:", err);
      }
    };

    // Incoming media offer from peer
    meetSocket.on(
      "webrtc-offer",
      async ({ offer, from, socketId: fromSocket }) => {
        console.log("[Meeting] Received offer from", fromSocket, "from:", from);
        console.log(
          "[Meeting] Local stream available:",
          !!localStreamRef.current
        );

        // Store the name of the peer
        setPeers((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(fromSocket) || {};
          updated.set(fromSocket, { ...existing, name: from });
          return updated;
        });

        // If local stream isn't ready yet, queue the offer
        if (!localStreamRef.current) {
          console.log(
            "[Meeting] Queuing offer from",
            fromSocket,
            "- waiting for local stream"
          );
          pendingOffersRef.current.push({
            offer,
            from,
            fromSocket,
            socket: meetSocket,
          });
          return;
        }

        await processOffer(offer, from, fromSocket, meetSocket);
      }
    );

    // Incoming answer
    meetSocket.on(
      "webrtc-answer",
      async ({ answer, from, socketId: fromSocket }) => {
        console.log(
          "[Meeting] Received answer from",
          fromSocket,
          "from:",
          from
        );
        // Store the name of the peer
        setPeers((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(fromSocket) || {};
          updated.set(fromSocket, { ...existing, name: from });
          return updated;
        });
        const pc = peerConnectionsRef.current.get(fromSocket);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("[Meeting] Answer set successfully for", fromSocket);
          } catch (err) {
            console.error("[Meeting] Error setting answer:", err);
          }
        } else {
          console.warn("[Meeting] No peer connection found for", fromSocket);
        }
      }
    );

    // Incoming ICE candidate
    meetSocket.on(
      "ice-candidate",
      async ({ candidate, from, socketId: fromSocket }) => {
        const pc = peerConnectionsRef.current.get(fromSocket);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    );

    // Receive meeting info including hostId
    meetSocket.on(
      "joined-meeting",
      ({ roomId: joinedRoom, userId: myId, peerId, meeting }) => {
        console.log("[Meeting] Joined meeting:", meeting);
        if (meeting?.hostId) {
          setHostId(meeting.hostId);
        }
      }
    );

    // New participant joined - initiate call to them
    meetSocket.on("participant-joined", (participant) => {
      console.log("[Meeting] New participant joined:", participant);
      const { socketId, userName, name, userId } = participant;
      const displayName = userName || name || "Participant";

      // Add to participants list
      setParticipants((prev) => {
        // Check if already exists
        if (prev.some((p) => p.socketId === socketId)) return prev;
        return [...prev, { ...participant, name: displayName }];
      });

      // Store peer info with host flag
      setPeers((prev) => {
        const updated = new Map(prev);
        updated.set(socketId, {
          name: displayName,
          userId,
          isHost: userId?.toString() === hostId?.toString(),
        });
        return updated;
      });

      // Immediately initiate call to the new participant if we have a local stream
      // This ensures bidirectional connection establishment
      if (localStreamRef.current && !calledPeersRef.current.has(socketId)) {
        console.log(
          "[Meeting] Initiating call to new participant:",
          socketId,
          displayName
        );
        calledPeersRef.current.add(socketId);
        // Small delay to allow state updates to complete
        setTimeout(() => {
          if (callPeerRef.current) {
            callPeerRef.current(socketId, displayName);
          }
        }, 200);
      }
    });

    // Participant left
    meetSocket.on("participant-left", ({ userId, socketId: leftSocketId }) => {
      console.log("[Meeting] Participant left:", userId, leftSocketId);

      // Find and remove participant
      setParticipants((prev) =>
        prev.filter((p) => p.userId !== userId && p.socketId !== leftSocketId)
      );

      // Clean up peer connection
      const socketToRemove =
        leftSocketId ||
        Array.from(peerConnectionsRef.current.keys()).find((sid) => {
          const peer = peerConnectionsRef.current.get(sid);
          return peer?.userId === userId;
        });

      if (socketToRemove) {
        const pc = peerConnectionsRef.current.get(socketToRemove);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(socketToRemove);
        }
        calledPeersRef.current.delete(socketToRemove);
        setPeers((prev) => {
          const updated = new Map(prev);
          updated.delete(socketToRemove);
          return updated;
        });
      }
    });

    // Participant list updates (on initial join)
    meetSocket.on(
      "existing-participants",
      ({ participants: newParticipants, hostId: meetingHostId }) => {
        console.log("[Meeting] Participants updated", newParticipants);
        console.log("[Meeting] Host ID:", meetingHostId);
        console.log("[Meeting] My socket ID:", meetSocket.id);
        setParticipants(newParticipants);

        // Set hostId if provided
        if (meetingHostId) {
          setHostId(meetingHostId);
        }

        // Clean up peers that are no longer in the participants list
        setPeers((prev) => {
          const updated = new Map(prev);
          const participantSocketIds = new Set(
            newParticipants.map((p) => p.socketId)
          );

          // Remove peers that left
          for (const [socketId] of updated) {
            if (!participantSocketIds.has(socketId)) {
              console.log(
                `[Meeting] Removing peer ${socketId} - no longer in participants`
              );
              // Close peer connection
              const pc = peerConnectionsRef.current.get(socketId);
              if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(socketId);
              }
              calledPeersRef.current.delete(socketId);
              updated.delete(socketId);
            }
          }

          // Sync participant names to peers Map
          newParticipants.forEach((p) => {
            if (p.socketId && p.socketId !== meetSocket.id) {
              const existing = updated.get(p.socketId) || {};
              const peerName = p.userName || p.name || "Participant";
              console.log(
                `[Meeting] Syncing peer ${p.socketId} with name ${peerName}`
              );
              updated.set(p.socketId, {
                ...existing,
                name: peerName,
                role: p.role,
                userId: p.userId,
                isHost: p.isHost || p.userId === meetingHostId,
              });
            }
          });
          console.log(
            "[Meeting] Updated peers Map:",
            Array.from(updated.entries())
          );
          return updated;
        });
      }
    );

    // Chat messages
    meetSocket.on("meeting-chat-message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Screen share events
    meetSocket.on("screen:started", ({ socketId: sharerSocket }) => {
      console.log("[Meeting] Screen share started by", sharerSocket);
    });

    meetSocket.on("screen:stopped", ({ socketId: sharerSocket }) => {
      console.log("[Meeting] Screen share stopped by", sharerSocket);
      // Remove screen track for that peer if exists
    });

    // Meeting ended by host
    meetSocket.on("meeting:ended", ({ by }) => {
      alert("Meeting has been ended by host");
      navigate("/");
    });

    // Control events (host can mute/remove participant)
    meetSocket.on("control:mute", ({ by }) => {
      alert("You have been muted by the host");
      setMicOn(false);
      if (localStream) {
        localStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }
    });

    meetSocket.on("control:removed", ({ by }) => {
      alert("You have been removed from the meeting by the host");
      navigate("/");
    });

    setSocket(meetSocket);
    socketRef.current = meetSocket; // Store socket in ref for use in callbacks

    return () => {
      meetSocket.disconnect();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      localStream?.getTracks().forEach((t) => t.stop());
      screenStream?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, user, navigate]);

  // Start local media
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream; // Keep ref in sync
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        console.log("[Meeting] Local stream started");

        // Process any pending offers that were queued before stream was ready
        if (pendingOffersRef.current.length > 0) {
          console.log(
            "[Meeting] Processing",
            pendingOffersRef.current.length,
            "pending offers"
          );
          const pending = [...pendingOffersRef.current];
          pendingOffersRef.current = [];

          for (const { offer, from, fromSocket, socket: sock } of pending) {
            console.log("[Meeting] Processing pending offer from", fromSocket);
            try {
              const pc = createPeerConnectionRef.current
                ? createPeerConnectionRef.current(fromSocket)
                : null;
              if (!pc) {
                console.error(
                  "[Meeting] createPeerConnection not available for pending offer"
                );
                continue;
              }
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sock.emit("webrtc-answer", {
                targetSocketId: fromSocket,
                answer,
                from: myUserNameRef.current || "Guest",
              });
              console.log("[Meeting] Processed pending offer from", fromSocket);
            } catch (err) {
              console.error("[Meeting] Error processing pending offer:", err);
            }
          }
        }
      } catch (err) {
        console.error("[Meeting] getUserMedia error", err);
        alert("Failed to access camera/microphone");
      }
    })();
  }, []);

  // Create peer connection for a remote socket
  const createPeerConnection = (remoteSocketId) => {
    // Reuse existing peer connection if present
    if (peerConnectionsRef.current.has(remoteSocketId)) {
      return peerConnectionsRef.current.get(remoteSocketId);
    }

    console.log(`[Meeting] Creating new peer connection for ${remoteSocketId}`);
    
    // Use ref to get latest ICE servers
    const config = {
      iceServers: iceServersRef.current || iceServers,
      iceCandidatePoolSize: 10,
    };
    console.log(`[Meeting] Using ICE servers:`, config.iceServers);
    
    const pc = new RTCPeerConnection(config);

    // Add local tracks to peer connection - Use ref to get current stream
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        console.log(
          `[Meeting] Adding ${track.kind} track to peer ${remoteSocketId}`
        );
        pc.addTrack(track, currentStream);
      });
    } else {
      console.warn(
        `[Meeting] No localStream available when creating peer connection for ${remoteSocketId}`
      );
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log(
        "[Meeting] Remote track received from",
        remoteSocketId,
        event.track.kind,
        "readyState:",
        event.track.readyState
      );
      const remoteStream = event.streams[0];
      
      // Log stream details for debugging
      console.log("[Meeting] Remote stream ID:", remoteStream?.id);
      console.log("[Meeting] Remote stream tracks:", remoteStream?.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
      // Force React to see this as a new stream by creating a reference update
      setPeers((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(remoteSocketId) || {};
        // Create a new object reference to trigger re-render
        updated.set(remoteSocketId, { 
          ...existing, 
          stream: remoteStream,
          streamId: remoteStream?.id, // Track stream ID for debugging
          lastTrackUpdate: Date.now() // Force new reference
        });
        console.log(`[Meeting] Updated peer ${remoteSocketId} with stream, tracks:`, remoteStream?.getTracks().length);
        return updated;
      });
      
      // Listen for track ended events
      event.track.onended = () => {
        console.log(`[Meeting] Track ended for peer ${remoteSocketId}:`, event.track.kind);
      };
      
      event.track.onmute = () => {
        console.log(`[Meeting] Track muted for peer ${remoteSocketId}:`, event.track.kind);
      };
      
      event.track.onunmute = () => {
        console.log(`[Meeting] Track unmuted for peer ${remoteSocketId}:`, event.track.kind);
      };
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          targetSocketId: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log(
        `[Meeting] Peer ${remoteSocketId} connection state: ${pc.connectionState}`
      );
    };

    pc.oniceconnectionstatechange = () => {
      console.log(
        `[Meeting] Peer ${remoteSocketId} ICE connection state: ${pc.iceConnectionState}`
      );
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        console.warn(
          `[Meeting] ICE state ${pc.iceConnectionState} for ${remoteSocketId}`
        );
      }
    };

    peerConnectionsRef.current.set(remoteSocketId, pc);
    return pc;
  };

  // Store createPeerConnection in ref so socket handlers can access it
  useEffect(() => {
    createPeerConnectionRef.current = createPeerConnection;
    console.log("[Meeting] createPeerConnection ref updated");
  }, [socket]);

  // Ensure all peer connections have local tracks once stream is ready
  useEffect(() => {
    if (!localStream || !socket) return;
    localStreamRef.current = localStream;

    console.log("[Meeting] Local stream ready, updating all peer connections");

    peerConnectionsRef.current.forEach(async (pc, socketId) => {
      const senders = pc.getSenders();
      console.log(`[Meeting] Peer ${socketId} has ${senders.length} senders`);

      let needsRenegotiation = false;

      for (const track of localStream.getTracks()) {
        const existingSender = senders.find(
          (sender) => sender.track && sender.track.kind === track.kind
        );

        if (existingSender) {
          console.log(
            `[Meeting] Replacing ${track.kind} track for peer ${socketId}`
          );
          existingSender.replaceTrack(track);
        } else {
          console.log(
            `[Meeting] Adding ${track.kind} track to peer ${socketId}`
          );
          pc.addTrack(track, localStream);
          needsRenegotiation = true;
        }
      }

      // After adding tracks, create new offer to renegotiate
      if (needsRenegotiation) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", {
            targetSocketId: socketId,
            offer,
          });
          console.log(`[Meeting] Sent renegotiation offer to ${socketId}`);
        } catch (err) {
          console.error(`[Meeting] Error renegotiating with ${socketId}:`, err);
        }
      }
    });
  }, [localStream, socket, user]);

  // Call a peer: create offer
  const callPeer = async (remoteSocketId, peerName) => {
    try {
      console.log(
        `[Meeting] Creating offer for ${remoteSocketId} (${peerName})`
      );
      const pc = createPeerConnectionRef.current
        ? createPeerConnectionRef.current(remoteSocketId)
        : createPeerConnection(remoteSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(`[Meeting] Offer created and set for ${remoteSocketId}`);

      // Store peer name immediately
      if (peerName) {
        setPeers((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(remoteSocketId) || {};
          updated.set(remoteSocketId, { ...existing, name: peerName });
          return updated;
        });
      }

      // Use socketRef to ensure we have the current socket
      const currentSocket = socketRef.current || socket;
      currentSocket?.emit("webrtc-offer", {
        targetSocketId: remoteSocketId,
        offer,
        from: myUserNameRef.current || user?.name || user?.username || "Guest",
      });
      console.log(`[Meeting] Offer sent to ${remoteSocketId}`);
    } catch (err) {
      console.error(`[Meeting] Error calling peer ${remoteSocketId}:`, err);
    }
  };

  // Store callPeer in ref so socket handlers can access it
  useEffect(() => {
    callPeerRef.current = callPeer;
    console.log("[Meeting] callPeer ref updated");
  }, [socket, user]);

  // Call all participants when local stream is ready
  useEffect(() => {
    if (localStream && socket && participants.length > 0 && mySocketId) {
      console.log(
        "[Meeting] === CALLING EFFECT TRIGGERED === Participants:",
        participants.length
      );
      console.log(
        "[Meeting] Participants to check:",
        participants.map((p) => ({ id: p.socketId, name: p.name }))
      );
      console.log(
        "[Meeting] Already called:",
        Array.from(calledPeersRef.current)
      );
      console.log(
        "[Meeting] Peer connections:",
        Array.from(peerConnectionsRef.current.keys())
      );
      console.log("[Meeting] My socket ID:", mySocketId);

      // Call all participants (both peers can send offers - backend handles negotiation)
      participants.forEach((p) => {
        // Skip self and already called peers
        if (
          p.socketId &&
          p.socketId !== mySocketId &&
          !calledPeersRef.current.has(p.socketId)
        ) {
          console.log("[Meeting] ✅ Calling peer", p.socketId, p.name);
          calledPeersRef.current.add(p.socketId);
          // Add small delay to avoid simultaneous calls
          setTimeout(() => {
            callPeer(p.socketId, p.name);
          }, 100);
        } else if (p.socketId === mySocketId) {
          console.log(`[Meeting] ⊗ Skipping self: ${p.socketId}`);
        } else if (calledPeersRef.current.has(p.socketId)) {
          console.log(`[Meeting] ✓ Already called: ${p.socketId} (${p.name})`);
        }
      });
      console.log("[Meeting] === CALLING EFFECT COMPLETE ===");
    }
  }, [localStream, socket, participants, mySocketId]);

  // Toggle microphone
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMicOn(!micOn);
    }
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    });
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setCameraOn(!cameraOn);
    }
  };

  // Screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Replace video track in all peer connections
        const videoTrack = stream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });

        socket?.emit("screen:start", { roomId, socketId: socket.id });

        stream.getVideoTracks()[0].onended = () => {
          // Screen share stopped by user clicking stop in browser
          toggleScreenShare();
        };
      } catch (err) {
        console.error("[Meeting] Screen share error", err);
      }
    } else {
      // Stop screen share, revert to camera
      screenStream?.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      // Revert to original camera video track
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });
      }

      socket?.emit("screen:stop", { roomId, socketId: socket.id });
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (chatInput.trim() && socket) {
      socket.emit(
        "meeting-chat-message",
        {
          roomId,
          message: chatInput,
          userId: user?.id || user?._id || null,
          name: user?.name || user?.username || "Guest",
        },
        (response) => {
          if (response?.success) {
            setChatInput("");
          }
        }
      );
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    socket?.emit("meeting:leave", { roomId });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-lg font-semibold flex items-center gap-2">
            <Video className="w-5 h-5" />
            Meeting Room: {roomId}
          </h1>
          <button
            onClick={copyRoomId}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
            title="Copy Room ID"
          >
            {copiedRoomId ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white group-hover:text-blue-400" />
            )}
            {copiedRoomId && (
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-white hover:bg-white/10"
          >
            <Users className="w-5 h-5 mr-1" />
            {participants.length + 1} {/* +1 for self */}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-white/10"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main video grid */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 overflow-y-auto">
          {/* Local video */}
          <div className="bg-gray-800 rounded-xl relative aspect-video overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              {myUserName || user?.name || "You"}
              {(user?.id?.toString() || user?._id?.toString()) ===
                hostId?.toString() && (
                <span className="bg-yellow-500 text-black px-1 rounded text-[10px] font-bold">
                  HOST
                </span>
              )}
              {!micOn && " 🔇"} {!cameraOn && " 📷"}
            </div>
          </div>

          {/* Remote peers */}
          {Array.from(peers.entries()).map(([socketId, peer]) => {
            // Find participant name from participants array as fallback
            const participant = participants.find(
              (p) => p.socketId === socketId
            );
            const displayName =
              peer.name ||
              participant?.userName ||
              participant?.name ||
              "Participant";
            const isHost =
              peer.userId?.toString() === hostId?.toString() ||
              participant?.userId?.toString() === hostId?.toString();
            console.log(
              `[Meeting Render] Peer ${socketId}:`,
              peer,
              `| Participant:`,
              participant,
              `| Display: ${displayName}`,
              `| isHost: ${isHost}`
            );
            return (
              <RemoteVideo
                key={socketId}
                stream={peer.stream}
                name={displayName}
                isHost={isHost}
              />
            );
          })}
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 bg-black/50 backdrop-blur-md border-l border-white/10 flex flex-col">
            <div className="p-3 border-b border-white/10 text-white font-semibold">
              Chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2 text-white">
                  <div className="text-xs text-gray-400">{msg.name}</div>
                  <div className="text-sm">{msg.message}</div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-white/10 text-white px-3 py-2 rounded-lg outline-none"
                placeholder="Type a message..."
              />
              <Button onClick={sendMessage} size="sm">
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Participants panel */}
        {showParticipants && (
          <div className="w-60 bg-black/50 backdrop-blur-md border-l border-white/10 flex flex-col">
            <div className="p-3 border-b border-white/10 text-white font-semibold">
              Participants ({participants.length})
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.map((p, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-lg p-2 text-white text-sm flex items-center justify-between"
                >
                  <div>
                    <div>{p.name}</div>
                    <div className="text-xs text-gray-400">{p.role}</div>
                  </div>
                  {p.muted && <MicOff className="w-4 h-4 text-red-400" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/40 backdrop-blur-md border-t border-white/10 px-4 py-4 flex items-center justify-center gap-3">
        <Button
          variant={micOn ? "default" : "destructive"}
          size="lg"
          onClick={toggleMic}
          className="rounded-full w-14 h-14 flex items-center justify-center"
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        <Button
          variant={cameraOn ? "default" : "destructive"}
          size="lg"
          onClick={toggleCamera}
          className="rounded-full w-14 h-14 flex items-center justify-center"
        >
          {cameraOn ? (
            <Video className="w-6 h-6" />
          ) : (
            <VideoOff className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant={isScreenSharing ? "destructive" : "default"}
          size="lg"
          onClick={toggleScreenShare}
          className="rounded-full w-14 h-14 flex items-center justify-center"
        >
          {isScreenSharing ? (
            <MonitorOff className="w-6 h-6" />
          ) : (
            <Monitor className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={leaveMeeting}
          className="rounded-full w-14 h-14 flex items-center justify-center bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

const RemoteVideo = ({ stream, name, isHost }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      console.log("[RemoteVideo] Setting stream for", name, stream);
      console.log("[RemoteVideo] Stream tracks:", stream.getTracks().map(t => `${t.kind}: ${t.enabled}, readyState: ${t.readyState}`));
      
      videoElement.srcObject = stream;
      
      // Force play with retry mechanism
      const playVideo = async () => {
        try {
          await videoElement.play();
          console.log("[RemoteVideo] Video playing for", name);
        } catch (err) {
          console.warn("[RemoteVideo] Autoplay failed for", name, "- will retry on user interaction:", err.message);
          // Add click handler to play on user interaction
          const handleClick = async () => {
            try {
              await videoElement.play();
              document.removeEventListener('click', handleClick);
            } catch (e) {
              console.error("[RemoteVideo] Play on click failed:", e);
            }
          };
          document.addEventListener('click', handleClick, { once: true });
        }
      };
      
      // Wait for loadedmetadata before playing
      videoElement.onloadedmetadata = () => {
        console.log("[RemoteVideo] Metadata loaded for", name);
        playVideo();
      };
      
      // If metadata already loaded, play immediately
      if (videoElement.readyState >= 1) {
        playVideo();
      }
    }
    
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, name]);

  return (
    <div className="bg-gray-800 rounded-xl relative aspect-video overflow-hidden">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
          <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
        {name}
        {isHost && (
          <span className="bg-yellow-500 text-black px-1 rounded text-[10px] font-bold">
            HOST
          </span>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
