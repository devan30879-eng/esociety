const express = require('express');
const router = express.Router();
const {
  createComplaint, getComplaints, getComplaintById,
  updateComplaintStatus, rateComplaint, getComplaintStats,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin'), getComplaintStats);
router.get('/', getComplaints);
router.post('/', authorize('resident', 'admin'), createComplaint);
router.get('/:id', getComplaintById);
router.put('/:id/status', authorize('admin'), updateComplaintStatus);
router.put('/:id/rate', authorize('resident'), rateComplaint);

module.exports = router;
