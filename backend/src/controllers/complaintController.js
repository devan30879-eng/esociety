const Complaint = require('../models/Complaint');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route  POST /api/complaints
 * @desc   Resident raises a new complaint
 * @access Private/Resident
 */
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority,
    raisedBy: req.user._id,
    flatNumber: req.user.flatNumber,
    statusHistory: [{ status: 'open', changedBy: req.user._id, note: 'Complaint raised' }],
  });

  // Notify admins via socket
  if (req.io) {
    req.io.to('role_admin').emit('new_complaint', {
      message: `New ${priority} priority complaint: ${title}`,
      complaintId: complaint._id,
    });
  }

  res.status(201).json({ success: true, message: 'Complaint submitted', complaint });
});

/**
 * @route  GET /api/complaints
 * @desc   Get complaints (residents see own, admin sees all)
 * @access Private
 */
const getComplaints = asyncHandler(async (req, res) => {
  const { status, category, priority, search } = req.query;
  const filter = {};

  // Residents only see their own complaints
  if (req.user.role === 'resident') {
    filter.raisedBy = req.user._id;
  }

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const complaints = await Complaint.find(filter)
    .populate('raisedBy', 'name flatNumber block')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: complaints.length, complaints });
});

/**
 * @route  GET /api/complaints/:id
 * @desc   Get single complaint details
 * @access Private
 */
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('raisedBy', 'name flatNumber block phone')
    .populate('assignedTo', 'name email phone')
    .populate('statusHistory.changedBy', 'name role');

  if (!complaint) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  // Residents can only view their own complaints
  if (req.user.role === 'resident' && complaint.raisedBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, complaint });
});

/**
 * @route  PUT /api/complaints/:id/status
 * @desc   Admin/staff updates complaint status
 * @access Private/Admin
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, note, assignedTo, resolutionNote } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  // Update status and add to history log
  complaint.status = status;
  if (assignedTo) complaint.assignedTo = assignedTo;
  if (resolutionNote) complaint.resolutionNote = resolutionNote;

  // Record resolution timestamp
  if (status === 'resolved') {
    complaint.resolvedAt = new Date();
  }

  // Append to status history
  complaint.statusHistory.push({
    status,
    changedBy: req.user._id,
    note: note || `Status changed to ${status}`,
  });

  await complaint.save();

  // Notify resident about complaint update
  if (req.io) {
    req.io.to(`user_${complaint.raisedBy}`).emit('complaint_updated', {
      message: `Your complaint "${complaint.title}" is now ${status}`,
      complaintId: complaint._id,
      status,
    });
  }

  res.json({ success: true, message: 'Complaint updated', complaint });
});

/**
 * @route  PUT /api/complaints/:id/rate
 * @desc   Resident rates resolved complaint
 * @access Private/Resident
 */
const rateComplaint = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  const complaint = await Complaint.findOne({ _id: req.params.id, raisedBy: req.user._id });

  if (!complaint) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  if (complaint.status !== 'resolved') {
    return res.status(400).json({ success: false, message: 'Can only rate resolved complaints' });
  }

  complaint.rating = rating;
  await complaint.save();

  res.json({ success: true, message: 'Rating submitted', complaint });
});

/**
 * @route  GET /api/complaints/stats
 * @desc   Complaint statistics for dashboard
 * @access Private/Admin
 */
const getComplaintStats = asyncHandler(async (req, res) => {
  // Aggregate count by status
  const byStatus = await Complaint.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Aggregate count by category
  const byCategory = await Complaint.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const total = await Complaint.countDocuments();

  res.json({ success: true, total, byStatus, byCategory });
});

module.exports = { createComplaint, getComplaints, getComplaintById, updateComplaintStatus, rateComplaint, getComplaintStats };
