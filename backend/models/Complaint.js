const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ComplaintSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    default: () => `TKT-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0,4).toUpperCase()}`
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Roads & Infrastructure', 'Water Supply', 'Electricity', 'Sanitation', 'Public Safety', 'Healthcare', 'Education', 'Transportation', 'Environment', 'Other']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    default: 'Submitted'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide a location']
    },
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  attachments: [{
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected']
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }],
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  resolutionNote: {
    type: String,
    maxlength: [1000, 'Resolution note cannot exceed 1000 characters']
  },
  resolvedAt: Date,
  closedAt: Date,
  dueDate: Date,
  viewCount: { type: Number, default: 0 },
  isEscalated: { type: Boolean, default: false },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: resolution time in hours
ComplaintSchema.virtual('resolutionTime').get(function() {
  if (this.resolvedAt && this.createdAt) {
    return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60 * 60));
  }
  return null;
});

// Virtual: is overdue
ComplaintSchema.virtual('isOverdue').get(function() {
  if (this.dueDate && !['Resolved', 'Closed'].includes(this.status)) {
    return new Date() > this.dueDate;
  }
  return false;
});

// Pre-save: add initial status history
ComplaintSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: 'Submitted',
      comment: 'Complaint submitted successfully',
      timestamp: new Date()
    });
  }
  next();
});

// Index for performance
ComplaintSchema.index({ citizen: 1, status: 1 });
ComplaintSchema.index({ status: 1, category: 1 });
ComplaintSchema.index({ ticketId: 1 });
ComplaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
