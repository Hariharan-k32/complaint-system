const express = require('express');
const router = express.Router();
const {
  getNotifications, markAsRead, markAllAsRead, getUnreadCount,
  submitFeedback, getFeedback, getComplaintFeedback
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);

module.exports = router;
