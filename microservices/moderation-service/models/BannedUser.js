const mongoose = require('mongoose');

const bannedUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  bannedBy: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  banType: {
    type: String,
    enum: ['temporary', 'permanent'],
    default: 'permanent'
  },
  expiresAt: Date,
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  violationHistory: [{
    date: Date,
    violation: String,
    action: String
  }],
  appealStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  appealDate: Date,
  appealReason: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

bannedUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BannedUser', bannedUserSchema);
