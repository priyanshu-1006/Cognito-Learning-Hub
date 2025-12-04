/**
 * User Model - Minimal schema for populate() in social service
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  profilePicture: String,
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline',
  },
  lastSeen: Date,
  lastActivity: Date,
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
