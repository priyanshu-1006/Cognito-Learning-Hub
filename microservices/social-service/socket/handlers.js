/**
 * Socket.IO Handlers
 * Real-time feed updates and notifications
 */

const feedManager = require('../services/feedManager');
const notificationManager = require('../services/notificationManager');
const createLogger = require('../../shared/utils/logger');

const logger = createLogger('socket-handlers');

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);
    
    let currentUserId = null;

    // ============================================
    // JOIN USER CHANNEL
    // ============================================
    socket.on('join-user-channel', async (data) => {
      try {
        const { userId } = data;
        
        if (!userId) {
          socket.emit('error', { message: 'userId is required' });
          return;
        }
        
        currentUserId = userId;
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Subscribe to feed updates
        feedManager.subscribeToFeed(userId, (update) => {
          socket.emit('feed-update', update);
        });
        
        // Send current unread count
        const unreadCount = await notificationManager.getUnreadCount(userId);
        socket.emit('unread-count', { count: unreadCount });
        
        logger.debug(`User ${userId} joined their channel`);
        
        socket.emit('joined-channel', { userId });
        
      } catch (error) {
        logger.error('Error joining user channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // ============================================
    // LEAVE USER CHANNEL
    // ============================================
    socket.on('leave-user-channel', () => {
      try {
        if (currentUserId) {
          socket.leave(`user:${currentUserId}`);
          feedManager.unsubscribeFromFeed(currentUserId);
          
          logger.debug(`User ${currentUserId} left their channel`);
          
          currentUserId = null;
        }
      } catch (error) {
        logger.error('Error leaving user channel:', error);
      }
    });

    // ============================================
    // POST CREATED (broadcast to followers)
    // ============================================
    socket.on('post-created', async (data) => {
      try {
        const { postData } = data;
        
        // Get followers
        const followers = await feedManager.getFollowers(postData.authorId);
        
        // Broadcast to each follower's socket
        followers.forEach(followerId => {
          io.to(`user:${followerId}`).emit('new-post', {
            post: postData,
          });
        });
        
        logger.debug(`Post ${postData.postId} broadcast to ${followers.length} followers`);
        
      } catch (error) {
        logger.error('Error broadcasting post:', error);
      }
    });

    // ============================================
    // NOTIFICATION RECEIVED
    // ============================================
    socket.on('send-notification', async (data) => {
      try {
        const { userId, notification } = data;
        
        // Send to user's socket
        io.to(`user:${userId}`).emit('notification', notification);
        
        // Update unread count
        const unreadCount = await notificationManager.getUnreadCount(userId);
        io.to(`user:${userId}`).emit('unread-count', { count: unreadCount });
        
      } catch (error) {
        logger.error('Error sending notification:', error);
      }
    });

    // ============================================
    // POST LIKED (notify author)
    // ============================================
    socket.on('post-liked', (data) => {
      try {
        const { postAuthorId, likerName, postId } = data;
        
        // Notify post author
        io.to(`user:${postAuthorId}`).emit('post-liked-notification', {
          message: `${likerName} liked your post`,
          postId,
        });
        
      } catch (error) {
        logger.error('Error sending like notification:', error);
      }
    });

    // ============================================
    // POST COMMENTED (notify author)
    // ============================================
    socket.on('post-commented', (data) => {
      try {
        const { postAuthorId, commenterName, postId, commentId } = data;
        
        // Notify post author
        io.to(`user:${postAuthorId}`).emit('post-commented-notification', {
          message: `${commenterName} commented on your post`,
          postId,
          commentId,
        });
        
      } catch (error) {
        logger.error('Error sending comment notification:', error);
      }
    });

    // ============================================
    // USER FOLLOWED (notify followed user)
    // ============================================
    socket.on('user-followed', (data) => {
      try {
        const { followedUserId, followerName, followerId } = data;
        
        // Notify followed user
        io.to(`user:${followedUserId}`).emit('new-follower-notification', {
          message: `${followerName} started following you`,
          followerId,
        });
        
      } catch (error) {
        logger.error('Error sending follow notification:', error);
      }
    });

    // ============================================
    // TYPING INDICATOR (for comments)
    // ============================================
    socket.on('typing-start', (data) => {
      try {
        const { postId, userName } = data;
        
        // Broadcast to others viewing the post
        socket.to(`post:${postId}`).emit('user-typing', {
          userName,
          postId,
        });
        
      } catch (error) {
        logger.error('Error sending typing indicator:', error);
      }
    });

    socket.on('typing-stop', (data) => {
      try {
        const { postId, userName } = data;
        
        socket.to(`post:${postId}`).emit('user-stopped-typing', {
          userName,
          postId,
        });
        
      } catch (error) {
        logger.error('Error sending typing stop:', error);
      }
    });

    // ============================================
    // JOIN POST ROOM (for real-time updates)
    // ============================================
    socket.on('join-post', (data) => {
      try {
        const { postId } = data;
        
        socket.join(`post:${postId}`);
        logger.debug(`Socket ${socket.id} joined post ${postId}`);
        
      } catch (error) {
        logger.error('Error joining post room:', error);
      }
    });

    socket.on('leave-post', (data) => {
      try {
        const { postId } = data;
        
        socket.leave(`post:${postId}`);
        logger.debug(`Socket ${socket.id} left post ${postId}`);
        
      } catch (error) {
        logger.error('Error leaving post room:', error);
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', () => {
      try {
        logger.debug(`Socket disconnected: ${socket.id}`);
        
        if (currentUserId) {
          feedManager.unsubscribeFromFeed(currentUserId);
        }
        
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });
  });
};
