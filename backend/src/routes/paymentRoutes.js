const express = require('express');
const router = express.Router();
const {
  createPayment, getPayments, markAsPaid,
  getFinancialSummary, generateBulkPayments,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', authorize('admin'), getFinancialSummary);
router.post('/bulk', authorize('admin'), generateBulkPayments);
router.get('/', getPayments);
router.post('/', authorize('admin'), createPayment);
router.put('/:id/pay', authorize('admin'), markAsPaid);

module.exports = router;
