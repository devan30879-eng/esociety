const express = require('express');
const router = express.Router();
const {
  createVisitor, getVisitors, approveVisitor, markEntry,
  markExit, preApproveVisitor, verifyByQR, getVisitorStats,
} = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All visitor routes require auth

// Stats for admin dashboard
router.get('/stats', authorize('admin'), getVisitorStats);

// Verify visitor by QR token
router.get('/verify/:qrToken', authorize('admin', 'security'), verifyByQR);

// Resident pre-approves a visitor
router.post('/preapprove', authorize('resident'), preApproveVisitor);

// Get all visitors (filtered per role in controller)
router.get('/', getVisitors);

// Security logs a new visitor
router.post('/', authorize('admin', 'security'), createVisitor);

// Resident approves/denies their visitor
router.put('/:id/approve', authorize('resident', 'admin'), approveVisitor);

// Security marks entry
router.put('/:id/entry', authorize('admin', 'security'), markEntry);

// Security marks exit
router.put('/:id/exit', authorize('admin', 'security'), markExit);

module.exports = router;
