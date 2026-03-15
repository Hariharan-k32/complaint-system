const asyncHandler = require('express-async-handler');
const path = require('path');
const Complaint = require('../models/Complaint');
const { Notification } = require('../models/index');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Submit complaint
// @route   POST /api/v1/complaints
// @access  Private (citizen)
exports.submitComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, priority, location } = req.body;

  const attachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/complaints/${file.filename}`
  })) : [];

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority: priority || 'Medium',
    location: typeof location === 'string' ? JSON.parse(location) : location,
    citizen: req.user.id,
    attachments
  });

  await complaint.populate('citizen', 'name email');

  // Notify citizen
  await Notification.create({
    recipient: req.user.id,
    type: 'complaint_submitted',
    title: 'Complaint Submitted Successfully',
    message: `Your complaint "${title}" has been submitted. Ticket ID: ${complaint.ticketId}`,
    complaint: complaint._id
  });

  // Notify all admins
  const admins = await User.find({ role: { $in: ['admin', 'staff'] } }).select('_id');
  await Promise.all(admins.map(admin =>
    Notification.create({
      recipient: admin._id,
      type: 'new_complaint',
      title: 'New Complaint Received',
      message: `New complaint: "${title}" in category ${category}. Ticket: ${complaint.ticketId}`,
      complaint: complaint._id
    })
  ));

  // Real-time socket emit
  const io = req.app.get('io');
  io.to('admin_room').emit('new_complaint', { complaint });
  io.to(`user_${req.user.id}`).emit('complaint_submitted', { complaint });

  res.status(201).json({ success: true, data: complaint });
});

// @desc    Get all complaints (admin/staff)
// @route   GET /api/v1/complaints
// @access  Private (admin/staff)
exports.getAllComplaints = asyncHandler(async (req, res) => {
  const {
    status, category, priority, assignedTo,
    startDate, endDate, search, page = 1, limit = 10,
    sortBy = 'createdAt', order = 'desc'
  } = req.query;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ticketId: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Complaint.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: complaints,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get citizen's own complaints
// @route   GET /api/v1/complaints/my
// @access  Private (citizen)
exports.getMyComplaints = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { citizen: req.user.id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Complaint.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: complaints,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  });
});

// @desc    Get single complaint
// @route   GET /api/v1/complaints/:id
// @access  Private
exports.getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('citizen', 'name email phone address')
    .populate('assignedTo', 'name email phone')
    .populate('department', 'name code')
    .populate('statusHistory.updatedBy', 'name role');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Citizens can only view their own complaints
  if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  complaint.viewCount += 1;
  await complaint.save({ validateBeforeSave: false });

  res.json({ success: true, data: complaint });
});

// @desc    Update complaint status (admin/staff)
// @route   PATCH /api/v1/complaints/:id/status
// @access  Private (admin/staff)
exports.updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, comment, resolutionNote } = req.body;

  const complaint = await Complaint.findById(req.params.id).populate('citizen', 'name email');
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const oldStatus = complaint.status;
  complaint.status = status;

  if (comment || status) {
    complaint.statusHistory.push({
      status,
      updatedBy: req.user.id,
      comment: comment || `Status updated to ${status}`,
      timestamp: new Date()
    });
  }

  if (status === 'Resolved') {
    complaint.resolvedAt = new Date();
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
  }

  if (status === 'Closed') {
    complaint.closedAt = new Date();
  }

  await complaint.save();
  await complaint.populate(['assignedTo', 'department']);

  // Notify citizen
  await Notification.create({
    recipient: complaint.citizen._id,
    type: 'status_updated',
    title: `Complaint Status Updated`,
    message: `Your complaint "${complaint.title}" (${complaint.ticketId}) status changed from ${oldStatus} to ${status}.`,
    complaint: complaint._id
  });

  // Real-time updates
  const io = req.app.get('io');
  io.to(`user_${complaint.citizen._id}`).emit('status_updated', { complaintId: complaint._id, status, ticketId: complaint.ticketId });
  io.to('admin_room').emit('complaint_updated', { complaint });

  res.json({ success: true, data: complaint });
});

// @desc    Assign complaint to staff
// @route   PATCH /api/v1/complaints/:id/assign
// @access  Private (admin)
exports.assignComplaint = asyncHandler(async (req, res) => {
  const { staffId, departmentId } = req.body;

  const complaint = await Complaint.findById(req.params.id).populate('citizen', 'name email');
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  complaint.assignedTo = staffId || null;
  complaint.department = departmentId || null;

  if (complaint.status === 'Submitted') {
    complaint.status = 'Under Review';
    complaint.statusHistory.push({
      status: 'Under Review',
      updatedBy: req.user.id,
      comment: 'Complaint assigned for review',
      timestamp: new Date()
    });
  }

  await complaint.save();
  await complaint.populate(['assignedTo', 'department']);

  // Notify staff
  if (staffId) {
    await Notification.create({
      recipient: staffId,
      type: 'complaint_assigned',
      title: 'New Complaint Assigned',
      message: `Complaint "${complaint.title}" (${complaint.ticketId}) has been assigned to you.`,
      complaint: complaint._id
    });
  }

  // Notify citizen
  await Notification.create({
    recipient: complaint.citizen._id,
    type: 'complaint_assigned',
    title: 'Complaint Assigned',
    message: `Your complaint "${complaint.title}" has been assigned to a staff member for review.`,
    complaint: complaint._id
  });

  const io = req.app.get('io');
  io.to(`user_${complaint.citizen._id}`).emit('status_updated', { complaintId: complaint._id, status: complaint.status });
  if (staffId) io.to(`user_${staffId}`).emit('complaint_assigned', { complaint });

  res.json({ success: true, data: complaint });
});

// @desc    Delete complaint
// @route   DELETE /api/v1/complaints/:id
// @access  Private (admin)
exports.deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  await complaint.deleteOne();
  res.json({ success: true, message: 'Complaint deleted' });
});

// @desc    Get complaints by ticket ID (public search)
// @route   GET /api/v1/complaints/track/:ticketId
// @access  Public
exports.trackComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({ ticketId: req.params.ticketId })
    .select('ticketId title status category location createdAt statusHistory resolvedAt')
    .populate('statusHistory.updatedBy', 'name role');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found with this ticket ID');
  }

  res.json({ success: true, data: complaint });
});
