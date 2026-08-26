/**
 * Dashboard Controller
 * Aggregates data from multiple models for a unified dashboard view
 */
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Complaint = require('../models/Complaint');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notice = require('../models/Notice');
const Emergency = require('../models/Emergency');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route  GET /api/dashboard/admin
 * @desc   Aggregated stats for admin dashboard
 * @access Private/Admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel fetching of all stats for performance
  const [
    totalResidents,
    totalStaff,
    visitorsToday,
    visitorsInside,
    openComplaints,
    pendingPayments,
    activeEmergencies,
    recentNotices,
    complaintTrend,
    paymentSummary,
  ] = await Promise.all([
    User.countDocuments({ role: 'resident', isActive: true }),
    User.countDocuments({ role: { $in: ['security'] }, isActive: true }),
    Visitor.countDocuments({ createdAt: { $gte: today } }),
    Visitor.countDocuments({ status: 'inside' }),
    Complaint.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
    Payment.countDocuments({ status: { $in: ['pending', 'overdue'] } }),
    Emergency.countDocuments({ status: 'active' }),
    Notice.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('title type priority createdAt'),
    // Complaint trend for last 7 days
    Complaint.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // This month's payment collection
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      totalResidents,
      totalStaff,
      visitorsToday,
      visitorsInside,
      openComplaints,
      pendingPayments,
      activeEmergencies,
      collectedThisMonth: paymentSummary[0]?.total || 0,
    },
    recentNotices,
    complaintTrend,
  });
});

/**
 * @route  GET /api/dashboard/resident
 * @desc   Dashboard data for a resident
 * @access Private/Resident
 */
const getResidentDashboard = asyncHandler(async (req, res) => {
  const residentId = req.user._id;

  const [
    myComplaints,
    pendingPayments,
    recentVisitors,
    notices,
    upcomingBookings,
  ] = await Promise.all([
    Complaint.find({ raisedBy: residentId }).sort({ createdAt: -1 }).limit(5),
    Payment.find({ resident: residentId, status: { $in: ['pending', 'overdue'] } }),
    Visitor.find({ resident: residentId }).sort({ createdAt: -1 }).limit(5),
    Notice.find({
      isActive: true,
      $or: [{ targetRole: 'all' }, { targetRole: 'resident' }],
    }).sort({ createdAt: -1 }).limit(5),
    // Future bookings
    Booking.find({
      bookedBy: residentId,
      date: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('facility', 'name type')
      .sort({ date: 1 })
      .limit(3),
  ]);
  res.json({
    success: true,
    myComplaints,
    pendingPayments,
    pendingPaymentsCount: pendingPayments.length,
    totalDue: pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0),
    recentVisitors,
    notices,
    upcomingBookings,
  });
});

/**
 * @route  GET /api/dashboard/security
 * @desc   Dashboard data for security guard
 * @access Private/Security
 */
const getSecurityDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayVisitors, insideVisitors, pendingApprovals, activeEmergencies] = await Promise.all([
    Visitor.find({ createdAt: { $gte: today } })
      .populate('resident', 'name flatNumber block')
      .sort({ createdAt: -1 })
      .limit(20),
    Visitor.countDocuments({ status: 'inside' }),
    Visitor.countDocuments({ status: 'pending' }),
    Emergency.find({ status: 'active' })
      .populate('raisedBy', 'name flatNumber')
      .sort({ createdAt: -1 }),
  ]);

  res.json({
    success: true,
    todayVisitors,
    insideVisitors,
    pendingApprovals,
    activeEmergencies,
  });
});

module.exports = { getAdminDashboard, getResidentDashboard, getSecurityDashboard };
