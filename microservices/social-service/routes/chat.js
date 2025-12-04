/**
 * Chat Routes - Monolith Schema
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const createLogger = require('../../shared/utils/logger');
const { authenticateToken } = require('../../shared/middleware/auth');

const logger = createLogger('chat-routes');

// Import models
const Friendship = require('../models/Friendship');
const User = require('../models/User');

// Message Model - monolith schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'quiz-challenge', 'quiz-result', 'system'], 
    default: 'text' 
  },
  metadata: {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' }
  },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  timestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// ChatRoom Model - monolith schema
const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['direct', 'teacher-community', 'study-group', 'broadcast'], 
    required: true 
  },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  settings: {
    isPublic: { type: Boolean, default: false },
    allowStudents: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    canStudentsPost: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
const ChatRoom = mongoose.models.ChatRoom || mongoose.model('ChatRoom', chatRoomSchema);

// ============================================
// SEND MESSAGE
// ============================================
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.userId;

    if (!recipientId || !content || !content.trim()) {
      return res.status(400).json({ message: 'Recipient and message content are required' });
    }

    // Check if users are friends
    const friendship = await Friendship.findOne({
      $or: [
        { requester: senderId, recipient: recipientId, status: 'accepted' },
        { requester: recipientId, recipient: senderId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return res.status(403).json({ message: 'You can only message friends' });
    }

    // Find or create chat room
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [senderId, recipientId] },
      type: 'direct',
    });

    if (!chatRoom) {
      const recipient = await User.findById(recipientId).select('name');
      const sender = await User.findById(senderId).select('name');

      chatRoom = new ChatRoom({
        name: `${sender.name} & ${recipient.name}`,
        type: 'direct',
        participants: [senderId, recipientId],
        creator: senderId,
        settings: {
          isPublic: false,
          allowStudents: true,
          requireApproval: false,
          canStudentsPost: true,
        },
      });
      await chatRoom.save();
    }

    // Create message
    const message = new Message({
      chatRoom: chatRoom._id,
      sender: senderId,
      content: content.trim(),
      timestamp: new Date(),
    });

    await message.save();

    // Update chat room's last message
    chatRoom.lastMessage = message._id;
    chatRoom.lastActivity = new Date();
    await chatRoom.save();

    // Populate sender info for response
    await message.populate('sender', 'name email role');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// ============================================
// GET MESSAGES
// ============================================
router.get('/messages/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Check if users are friends
    const friendship = await Friendship.findOne({
      $or: [
        { requester: userId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: userId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return res.status(403).json({ message: 'You can only view messages with friends' });
    }

    // Find chat room
    const chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, friendId] },
      type: 'direct',
    });

    if (!chatRoom) {
      return res.json({ messages: [] });
    }

    // Get messages
    const messages = await Message.find({ chatRoom: chatRoom._id })
      .populate('sender', 'name email role')
      .sort({ timestamp: 1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// ============================================
// GET CHAT ROOMS
// ============================================
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const chatRooms = await ChatRoom.find({
      participants: userId,
    })
      .populate('participants', 'name email role')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    res.json({ chatRooms });
  } catch (error) {
    logger.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Failed to fetch chat rooms' });
  }
});

// ============================================
// MARK MESSAGES AS READ
// ============================================
router.put('/read/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    // Find chat room
    const chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, friendId] },
      type: 'direct',
    });

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        chatRoom: chatRoom._id,
        sender: { $ne: userId },
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

module.exports = router;
