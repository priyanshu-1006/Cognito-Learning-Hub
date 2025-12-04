/**
 * Meeting Model - Persistence Layer
 * Active meetings stored in Redis, MongoDB for history
 */

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userPicture: String,
  
  // Connection state
  peerId: String, // WebRTC peer ID
  socketId: String,
  isHost: {
    type: Boolean,
    default: false,
  },
  
  // Media state
  audioEnabled: {
    type: Boolean,
    default: true,
  },
  videoEnabled: {
    type: Boolean,
    default: true,
  },
  screenSharing: {
    type: Boolean,
    default: false,
  },
  
  // Timing
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: Date,
  
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  
  title: {
    type: String,
    required: true,
  },
  
  description: String,
  
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Meeting state
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended'],
    default: 'active',
    index: true,
  },
  
  // Participants
  participants: [participantSchema],
  maxParticipants: {
    type: Number,
    default: 50,
  },
  
  // Settings
  settings: {
    allowRecording: {
      type: Boolean,
      default: false,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    allowScreenShare: {
      type: Boolean,
      default: true,
    },
    allowChat: {
      type: Boolean,
      default: true,
    },
    lockRoom: {
      type: Boolean,
      default: false,
    },
  },
  
  // WebRTC topology
  topology: {
    type: String,
    enum: ['mesh', 'sfu'],
    default: 'mesh',
  },
  
  // Recording info
  recordingId: String,
  recordingUrl: String,
  
  // Timing
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number, // Minutes
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ============================================
// INDEXES
// ============================================

// Index 1: Find active meetings
meetingSchema.index({ status: 1, createdAt: -1 });

// Index 2: Find user's meetings
meetingSchema.index({ hostId: 1, createdAt: -1 });

// Index 3: Scheduled meetings
meetingSchema.index({ scheduledAt: 1, status: 1 });

// Index 4: Cleanup old meetings (30 days TTL)
meetingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// ============================================
// VIRTUALS
// ============================================

meetingSchema.virtual('activeParticipantCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

meetingSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Get meeting summary
 */
meetingSchema.methods.getSummary = function() {
  return {
    id: this._id,
    roomId: this.roomId,
    title: this.title,
    status: this.status,
    participantCount: this.activeParticipantCount,
    maxParticipants: this.maxParticipants,
    topology: this.topology,
    startedAt: this.startedAt,
    createdAt: this.createdAt,
  };
};

/**
 * Get participant list (active only)
 */
meetingSchema.methods.getActiveParticipants = function() {
  return this.participants
    .filter(p => p.isActive)
    .map(p => ({
      userId: p.userId,
      userName: p.userName,
      userPicture: p.userPicture,
      peerId: p.peerId,
      isHost: p.isHost,
      audioEnabled: p.audioEnabled,
      videoEnabled: p.videoEnabled,
      screenSharing: p.screenSharing,
    }));
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find meeting by room ID
 */
meetingSchema.statics.findByRoomId = function(roomId) {
  return this.findOne({ roomId: roomId.toUpperCase() });
};

/**
 * Find active meetings
 */
meetingSchema.statics.findActiveMeetings = function(limit = 20) {
  return this.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('roomId title activeParticipantCount createdAt')
    .lean();
};

/**
 * Cleanup old meetings
 */
meetingSchema.statics.cleanupOldMeetings = async function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await this.deleteMany({
    status: 'ended',
    updatedAt: { $lt: sevenDaysAgo },
  });
  return result.deletedCount;
};

module.exports = mongoose.model('Meeting', meetingSchema);
