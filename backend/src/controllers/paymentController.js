const Payment = require('../models/Payment');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route  POST /api/payments
 * @desc   Create a payment record (admin generates invoice)
 * @access Private/Admin
 */
const createPayment = asyncHandler(async (req, res) => {
  const { residentId, type, amount, penalty, dueDate, billingPeriod, description } = req.body;

  const resident = await User.findById(residentId);
  if (!resident) {
    return res.status(404).json({ success: false, message: 'Resident not found' });
  }

  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(penalty) || 0);

  const payment = await Payment.create({
    resident: residentId,
    type,
    amount: parseFloat(amount),
    penalty: parseFloat(penalty) || 0,
    totalAmount,
    dueDate: new Date(dueDate),
    billingPeriod,
    description,
    flatNumber: resident.flatNumber,
    recordedBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Payment record created', payment });
});

/**
 * @route  GET /api/payments
 * @desc   Get payments (residents see own, admin sees all)
 * @access Private
 */
const getPayments = asyncHandler(async (req, res) => {
  const { status, type, residentId, month } = req.query;
  const filter = {};

  // Residents can only see their own payments
  if (req.user.role === 'resident') {
    filter.resident = req.user._id;
  } else if (residentId) {
    filter.resident = residentId;
  }

  if (status) filter.status = status;
  if (type) filter.type = type;

  // Filter by billing month (format: "2024-01")
  if (month) filter.billingPeriod = month;

  const payments = await Payment.find(filter)
    .populate('resident', 'name flatNumber block')
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: payments.length, payments });
});

/**
 * @route  PUT /api/payments/:id/pay
 * @desc   Mark a payment as paid
 * @access Private/Admin
 */
const markAsPaid = asyncHandler(async (req, res) => {
  const { paymentMethod } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (payment.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Payment already marked as paid' });
  }

  payment.status = 'paid';
  payment.paidAt = new Date();
  payment.paymentMethod = paymentMethod;
  payment.recordedBy = req.user._id;
  await payment.save();

  res.json({ success: true, message: 'Payment marked as paid', payment });
});

/**
 * @route  GET /api/payments/summary
 * @desc   Get financial summary for admin dashboard
 * @access Private/Admin
 */
const getFinancialSummary = asyncHandler(async (req, res) => {
  // Total collected this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const collectedThisMonth = await Payment.aggregate([
    { $match: { status: 'paid', paidAt: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  // Total outstanding dues
  const outstandingDues = await Payment.aggregate([
    { $match: { status: { $in: ['pending', 'overdue'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  // Count overdue payments
  const overdueCount = await Payment.countDocuments({
    status: 'pending',
    dueDate: { $lt: new Date() },
  });

  // Monthly collection trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrend = await Payment.aggregate([
    { $match: { status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: '$paidAt' }, year: { $year: '$paidAt' } },
        total: { $sum: '$totalAmount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    collectedThisMonth: collectedThisMonth[0]?.total || 0,
    outstandingDues: outstandingDues[0]?.total || 0,
    overdueCount,
    monthlyTrend,
  });
});

/**
 * @route  POST /api/payments/bulk
 * @desc   Generate monthly maintenance bills for all residents
 * @access Private/Admin
 */
const generateBulkPayments = asyncHandler(async (req, res) => {
  const { amount, dueDate, billingPeriod, description } = req.body;

  // Get all active residents
  const residents = await User.find({ role: 'resident', isActive: true });

  if (residents.length === 0) {
    return res.status(400).json({ success: false, message: 'No active residents found' });
  }

  // Check if bills already generated for this period
  const existing = await Payment.findOne({ billingPeriod, type: 'maintenance' });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Bills already generated for ${billingPeriod}`,
    });
  }

  // Create payment records for all residents
  const payments = residents.map((resident) => ({
    resident: resident._id,
    flatNumber: resident.flatNumber,
    type: 'maintenance',
    amount: parseFloat(amount),
    penalty: 0,
    totalAmount: parseFloat(amount),
    dueDate: new Date(dueDate),
    billingPeriod,
    description: description || `Monthly maintenance for ${billingPeriod}`,
    recordedBy: req.user._id,
  }));

  const created = await Payment.insertMany(payments);

  res.status(201).json({
    success: true,
    message: `${created.length} maintenance bills generated`,
    count: created.length,
  });
});

module.exports = { createPayment, getPayments, markAsPaid, getFinancialSummary, generateBulkPayments };
