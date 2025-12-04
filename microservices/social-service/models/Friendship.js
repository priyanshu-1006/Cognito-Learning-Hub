/**
 * Friendship Model (For backwards compatibility with monolith)
 * This model reads existing friendships from the monolith's database
 */

const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Index for faster queries
friendshipSchema.index({ requester: 1, recipient: 1 });
friendshipSchema.index({ status: 1 });

const Friendship = mongoose.model('Friendship', friendshipSchema, 'friendships');

module.exports = Friendship;
