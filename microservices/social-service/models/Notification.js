/**
 * Notification Model - Monolith Schema
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  type: {
    type: String,
    required: true,
    index: true,
  },
  
  title: {
    type: String,
    required: true,
  },
  
  message: {
    type: String,
    required: true,
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  }
});

// Indexes for common queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
