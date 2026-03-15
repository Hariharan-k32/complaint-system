const express = require('express');
const router = express.Router();
const {
  submitComplaint, getAllComplaints, getMyComplaints, getComplaint,
  updateComplaintStatus, assignComplaint, deleteComplaint, trackComplaint
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/track/:ticketId', trackComplaint);

// Protected
router.post('/', protect, authorize('citizen'), upload.array('attachments', 5), submitComplaint);
router.get('/my', protect, authorize('citizen'), getMyComplaints);
router.get('/', protect, authorize('admin', 'staff'), getAllComplaints);
router.get('/:id', protect, getComplaint);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateComplaintStatus);
router.patch('/:id/assign', protect, authorize('admin'), assignComplaint);
router.delete('/:id', protect, authorize('admin'), deleteComplaint);

module.exports = router;
