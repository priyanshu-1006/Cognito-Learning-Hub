const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  actionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModerationAction',
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: String,
  reviewNotes: String,
  reviewedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

appealSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Appeal', appealSchema);
