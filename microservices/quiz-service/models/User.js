/**
 * User Model - Minimal Schema for Quiz Service
 * Used only for population in quiz queries
 * Full user management handled by auth-service
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
    },
    role: {
      type: String,
      enum: ['Student', 'Teacher', 'Moderator', 'Admin'],
      required: true,
    },
  },
  { timestamps: true }
);

// Export model - this registers it with mongoose
module.exports = mongoose.model('User', UserSchema);
