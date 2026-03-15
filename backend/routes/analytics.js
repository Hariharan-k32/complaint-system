const express = require('express');
const router = express.Router();
const { getDashboardStats, getTrends } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('admin', 'staff'), getDashboardStats);
router.get('/trends', protect, authorize('admin', 'staff'), getTrends);

module.exports = router;
