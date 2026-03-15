const asyncHandler = require('express-async-handler');
const { Notification, Feedback } = require('../models/index');
const Complaint = require('../models/Complaint');

// ===== NOTIFICATION CONTROLLER =====

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user.id })
      .populate('complaint', 'ticketId title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notification.countDocuments({ recipient: req.user.id }),
    Notification.countDocuments({ recipient: req.user.id, isRead: false })
  ]);

  res.json({ success: true, data: notifications, unreadCount, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'Notification marked as read' });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  res.json({ success: true, count });
});

// ===== FEEDBACK CONTROLLER =====

exports.submitFeedback = asyncHandler(async (req, res) => {
  const { complaintId, rating, comment, categories, wouldRecommend } = req.body;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.citizen.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to submit feedback for this complaint');
  }

  if (!['Resolved', 'Closed'].includes(complaint.status)) {
    res.status(400);
    throw new Error('Can only submit feedback for resolved or closed complaints');
  }

  const existingFeedback = await Feedback.findOne({ complaint: complaintId });
  if (existingFeedback) {
    res.status(400);
    throw new Error('Feedback already submitted for this complaint');
  }

  const feedback = await Feedback.create({
    complaint: complaintId,
    citizen: req.user.id,
    rating,
    comment,
    categories,
    wouldRecommend
  });

  // Update complaint status to Closed after feedback
  if (complaint.status === 'Resolved') {
    complaint.status = 'Closed';
    complaint.closedAt = new Date();
    await complaint.save();
  }

  res.status(201).json({ success: true, data: feedback });
});

exports.getFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [feedback, total] = await Promise.all([
    Feedback.find()
      .populate('citizen', 'name email')
      .populate('complaint', 'ticketId title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Feedback.countDocuments()
  ]);

  res.json({ success: true, data: feedback, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
});

exports.getComplaintFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({ complaint: req.params.complaintId })
    .populate('citizen', 'name');
  res.json({ success: true, data: feedback });
});
