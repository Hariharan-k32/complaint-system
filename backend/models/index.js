const mongoose = require('mongoose');

// Department Schema
const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a department name'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: String,
  categories: [{
    type: String,
    enum: ['Roads & Infrastructure', 'Water Supply', 'Electricity', 'Sanitation', 'Public Safety', 'Healthcare', 'Education', 'Transportation', 'Environment', 'Other']
  }],
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactEmail: String,
  contactPhone: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['complaint_submitted', 'status_updated', 'complaint_assigned', 'complaint_resolved', 'feedback_requested', 'new_complaint', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// Feedback Schema
const FeedbackSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    unique: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  categories: {
    responseTime: { type: Number, min: 1, max: 5 },
    staffBehavior: { type: Number, min: 1, max: 5 },
    resolutionQuality: { type: Number, min: 1, max: 5 }
  },
  wouldRecommend: {
    type: Boolean
  }
}, { timestamps: true });

module.exports = {
  Department: mongoose.model('Department', DepartmentSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  Feedback: mongoose.model('Feedback', FeedbackSchema)
};
