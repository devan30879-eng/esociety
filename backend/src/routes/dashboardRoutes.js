const express = require('express');
const router = express.Router();
const { getAdminDashboard, getResidentDashboard, getSecurityDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/resident', authorize('resident'), getResidentDashboard);
router.get('/security', authorize('security', 'admin'), getSecurityDashboard);

module.exports = router;
