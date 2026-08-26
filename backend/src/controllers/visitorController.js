const Visitor = require('../models/Visitor');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const QRCode = require('qrcode');

/**
 * @route  POST /api/visitors
 * @desc   Log a new visitor entry (security guard)
 * @access Private/Security, Admin
 */
const createVisitor = asyncHandler(async (req, res) => {
  const { name, phone, purpose, vehicleNumber, residentId, expectedArrival, notes } = req.body;

  // Verify the resident exists
  const resident = await User.findOne({ _id: residentId, role: 'resident', isActive: true });
  if (!resident) {
    return res.status(404).json({ success: false, message: 'Resident not found' });
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // OTP valid for 30 minutes

  const visitor = await Visitor.create({
    name,
    phone,
    purpose,
    vehicleNumber,
    resident: residentId,
    expectedArrival,
    notes,
    otp: { code: otp, expiresAt: otpExpiry },
    approvedBy: req.user._id,
  });

  // Generate QR code as base64 data URL using the visitor's unique qrCode token
  const qrDataUrl = await QRCode.toDataURL(visitor.qrCode);

  // Emit real-time notification to resident via Socket.IO
  if (req.io) {
    req.io.to(`user_${residentId}`).emit('visitor_arrived', {
      message: `${name} is at the gate`,
      visitor: visitor._id,
      purpose,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Visitor logged successfully',
    visitor,
    qrCode: qrDataUrl,
    otp, // In production, send via SMS to resident
  });
});

/**
 * @route  GET /api/visitors
 * @desc   Get all visitors (filtered by role)
 * @access Private
 */
const getVisitors = asyncHandler(async (req, res) => {
  const { status, purpose, date, residentId } = req.query;
  const filter = {};

  // Residents only see their own visitors
  if (req.user.role === 'resident') {
    filter.resident = req.user._id;
  } else if (residentId) {
    filter.resident = residentId;
  }

  if (status) filter.status = status;
  if (purpose) filter.purpose = purpose;

  // Filter by specific date
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

  const visitors = await Visitor.find(filter)
    .populate('resident', 'name flatNumber block')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: visitors.length, visitors });
});

/**
 * @route  PUT /api/visitors/:id/approve
 * @desc   Resident approves or denies a visitor
 * @access Private/Resident
 */
const approveVisitor = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approved' or 'denied'

  const visitor = await Visitor.findOne({ _id: req.params.id, resident: req.user._id });

  if (!visitor) {
    return res.status(404).json({ success: false, message: 'Visitor not found' });
  }

  visitor.status = action === 'approve' ? 'approved' : 'denied';
  await visitor.save();

  // Notify security guard about the resident's decision
  if (req.io) {
    req.io.emit('visitor_status_updated', {
      visitorId: visitor._id,
      status: visitor.status,
      visitorName: visitor.name,
    });
  }

  res.json({ success: true, message: `Visitor ${visitor.status}`, visitor });
});

/**
 * @route  PUT /api/visitors/:id/entry
 * @desc   Mark visitor entry time (security confirms entry)
 * @access Private/Security, Admin
 */
const markEntry = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return res.status(404).json({ success: false, message: 'Visitor not found' });
  }

  if (visitor.status !== 'approved' && visitor.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Visitor not approved for entry' });
  }

  visitor.status = 'inside';
  visitor.entryTime = new Date();
  await visitor.save();

  res.json({ success: true, message: 'Entry marked', visitor });
});

/**
 * @route  PUT /api/visitors/:id/exit
 * @desc   Mark visitor exit time
 * @access Private/Security, Admin
 */
const markExit = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return res.status(404).json({ success: false, message: 'Visitor not found' });
  }

  visitor.status = 'exited';
  visitor.exitTime = new Date();
  await visitor.save();

  res.json({ success: true, message: 'Exit marked', visitor });
});

/**
 * @route  POST /api/visitors/preapprove
 * @desc   Resident pre-approves a visitor before arrival
 * @access Private/Resident
 */
const preApproveVisitor = asyncHandler(async (req, res) => {
  const { name, phone, purpose, expectedArrival, vehicleNumber } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // Valid 24 hours

  const visitor = await Visitor.create({
    name,
    phone,
    purpose,
    vehicleNumber,
    expectedArrival,
    resident: req.user._id,
    preApproved: true,
    status: 'approved',
    otp: { code: otp, expiresAt: otpExpiry },
  });

  const qrDataUrl = await QRCode.toDataURL(visitor.qrCode);

  res.status(201).json({
    success: true,
    message: 'Visitor pre-approved',
    visitor,
    qrCode: qrDataUrl,
    otp,
  });
});

/**
 * @route  GET /api/visitors/verify/:qrToken
 * @desc   Verify visitor by QR code token (security guard scans)
 * @access Private/Security
 */
const verifyByQR = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findOne({ qrCode: req.params.qrToken })
    .populate('resident', 'name flatNumber block phone');

  if (!visitor) {
    return res.status(404).json({ success: false, message: 'Invalid QR code' });
  }

  res.json({ success: true, visitor });
});

/**
 * @route  GET /api/visitors/stats
 * @desc   Visitor statistics for admin dashboard
 * @access Private/Admin
 */
const getVisitorStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayCount = await Visitor.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } });
  const insideCount = await Visitor.countDocuments({ status: 'inside' });
  const pendingCount = await Visitor.countDocuments({ status: 'pending' });

  // Purpose breakdown using aggregation
  const purposeStats = await Visitor.aggregate([
    { $group: { _id: '$purpose', count: { $sum: 1 } } },
  ]);

  res.json({ success: true, todayCount, insideCount, pendingCount, purposeStats });
});

module.exports = { createVisitor, getVisitors, approveVisitor, markEntry, markExit, preApproveVisitor, verifyByQR, getVisitorStats };
