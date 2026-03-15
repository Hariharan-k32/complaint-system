const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback, getComplaintFeedback } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('citizen'), submitFeedback);
router.get('/', protect, authorize('admin', 'staff'), getFeedback);
router.get('/complaint/:complaintId', protect, getComplaintFeedback);

module.exports = router;
