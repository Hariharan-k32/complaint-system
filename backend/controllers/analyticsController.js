const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { Feedback } = require('../models/index');

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (admin/staff)
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalComplaints,
    thisMonthComplaints,
    lastMonthComplaints,
    statusBreakdown,
    categoryBreakdown,
    priorityBreakdown,
    recentComplaints,
    avgResolutionTime,
    totalUsers,
    satisfactionData
  ] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Complaint.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Complaint.find().sort({ createdAt: -1 }).limit(5)
      .populate('citizen', 'name').populate('assignedTo', 'name').select('ticketId title status priority category createdAt citizen'),
    Complaint.aggregate([
      { $match: { resolvedAt: { $exists: true } } },
      { $project: { resolutionHours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] } } },
      { $group: { _id: null, avg: { $avg: '$resolutionHours' } } }
    ]),
    User.countDocuments({ role: 'citizen' }),
    Feedback.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }])
  ]);

  // Monthly trend (last 6 months)
  const monthlyTrend = await Complaint.aggregate([
    { $match: { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 6)) } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        submitted: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const resolved = statusBreakdown.find(s => s._id === 'Resolved')?.count || 0;
  const resolutionRate = totalComplaints > 0 ? ((resolved / totalComplaints) * 100).toFixed(1) : 0;
  const growthRate = lastMonthComplaints > 0
    ? (((thisMonthComplaints - lastMonthComplaints) / lastMonthComplaints) * 100).toFixed(1)
    : 100;

  res.json({
    success: true,
    data: {
      overview: {
        total: totalComplaints,
        thisMonth: thisMonthComplaints,
        growthRate: parseFloat(growthRate),
        totalUsers,
        resolutionRate: parseFloat(resolutionRate),
        avgResolutionHours: avgResolutionTime[0]?.avg ? Math.round(avgResolutionTime[0].avg) : 0,
        avgRating: satisfactionData[0]?.avgRating ? parseFloat(satisfactionData[0].avgRating.toFixed(1)) : 0,
        totalFeedback: satisfactionData[0]?.total || 0
      },
      statusBreakdown: statusBreakdown.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      categoryBreakdown,
      priorityBreakdown: priorityBreakdown.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
      monthlyTrend,
      recentComplaints
    }
  });
});

// @desc    Get complaints trend data
// @route   GET /api/v1/analytics/trends
// @access  Private (admin)
exports.getTrends = asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dailyData = await Complaint.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({ success: true, data: dailyData });
});
