const express = require('express');
const {
  getStats,
  getOccupancyReport,
  getSalesReport,
  getRecentBookings,
  getAuditLogs,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All dashboard endpoints require admin privileges
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/occupancy', getOccupancyReport);
router.get('/sales', getSalesReport);
router.get('/recent-bookings', getRecentBookings);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
