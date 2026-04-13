const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  deleteNotification,
  markAllAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get current user's notifications
// @access  Private
router.get('/', authenticate, getMyNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authenticate, getUnreadCount);

// @route   PUT /api/notifications/:id/read
// @desc    Mark one notification as read
// @access  Private
router.put('/:id/read', authenticate, markOneAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete one notification
// @access  Private
router.delete('/:id', authenticate, deleteNotification);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticate, markAllAsRead);

module.exports = router;
