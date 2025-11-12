const express = require('express'); // Express framework
const router = express.Router();
const {
  getAnalytics,
  getDashboardAnalytics,
  getRoomUtilization,
  getTimeSlotPopularity,
  getUserStats,
  getAllAnalytics
} = require('../controllers/analyticsController');
const { streamAnalytics } = require('../controllers/analyticsSSEController');
const { protect, authorize } = require('../middleware/auth');

// All analytics routes are admin-only
router.use(protect, authorize('admin'));

// Routes
router.get('/', getAnalytics);
router.get('/stream', streamAnalytics); // SSE endpoint for real-time updates
router.get('/dashboard', getDashboardAnalytics);
router.get('/utilization', getRoomUtilization);
router.get('/time-slots', getTimeSlotPopularity);
router.get('/user-stats', getUserStats);

module.exports = router;
