// routes/notification.js - Notification routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controller/notificationController');

// GET /api/notifications - Get all notifications for current user
router.get('/', auth, getUserNotifications);

// GET /api/notifications/unread-count - Get unread notifications count
router.get('/unread-count', auth, getUnreadCount);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', auth, markAllAsRead);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', auth, markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', auth, deleteNotification);

module.exports = router;
