const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String,
    required: true,
    index: true
  },
  reportedUserId: {
    type: String,
    index: true
  },
  reportedContentId: {
    type: String,
    index: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['post', 'comment', 'user', 'quiz', 'message', 'other']
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'misinformation',
      'inappropriate_content',
      'copyright',
      'impersonation',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  moderatorId: {
    type: String
  },
  moderatorNotes: {
    type: String,
    maxlength: 2000
  },
  action: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed']
  },
  evidence: [{
    type: {
      type: String,
      enum: ['screenshot', 'link', 'text']
    },
    data: String
  }],
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
