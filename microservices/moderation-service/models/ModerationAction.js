const mongoose = require('mongoose');

const moderationActionSchema = new mongoose.Schema({
  moderatorId: {
    type: String,
    required: true,
    index: true
  },
  targetUserId: {
    type: String,
    required: true,
    index: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'warning',
      'mute',
      'suspend',
      'ban',
      'unban',
      'content_removal',
      'account_restriction',
      'privilege_revoke'
    ]
  },
  reason: {
    type: String,
    required: true
  },
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months', 'permanent']
    }
  },
  expiresAt: Date,
  relatedReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'severe', 'critical'],
    default: 'moderate'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  revokedBy: String,
  revokedAt: Date,
  revokedReason: String,
  metadata: {
    contentRemoved: [String],
    privilegesRevoked: [String],
    appealAllowed: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

moderationActionSchema.index({ targetUserId: 1, isActive: 1 });
moderationActionSchema.index({ expiresAt: 1, isActive: 1 });

module.exports = mongoose.model('ModerationAction', moderationActionSchema);
