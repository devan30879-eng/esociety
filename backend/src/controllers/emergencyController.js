const Emergency = require('../models/Emergency');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route  POST /api/emergency
 * @desc   Raise an emergency alert (any logged-in user)
 * @access Private
 */
const raiseEmergency = asyncHandler(async (req, res) => {
  const { title, description, type, severity, location } = req.body;

  const emergency = await Emergency.create({
    title,
    description,
    type,
    severity: severity || 'high',
    location,
    raisedBy: req.user._id,
  });

  // Get all user IDs to notify
  const allUsers = await User.find({ isActive: true }).select('_id');
  const userIds = allUsers.map((u) => u._id);
  emergency.notifiedUsers = userIds;
  await emergency.save();

  // Broadcast critical emergency alert to ALL connected users
  if (req.io) {
    req.io.emit('emergency_alert', {
      type: 'EMERGENCY',
      category: type,
      severity,
      title,
      description,
      location,
      raisedBy: req.user.name,
      emergencyId: emergency._id,
      timestamp: new Date(),
    });
  }

  res.status(201).json({
    success: true,
    message: 'Emergency alert raised. All users notified.',
    emergency,
  });
});

/**
 * @route  GET /api/emergency
 * @desc   Get all emergencies
 * @access Private
 */
const getEmergencies = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (type) filter.type = type;

  const emergencies = await Emergency.find(filter)
    .populate('raisedBy', 'name flatNumber role')
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: emergencies.length, emergencies });
});

/**
 * @route  PUT /api/emergency/:id/resolve
 * @desc   Mark an emergency as resolved
 * @access Private/Admin, Security
 */
const resolveEmergency = asyncHandler(async (req, res) => {
  const { resolutionNote } = req.body;

  const emergency = await Emergency.findById(req.params.id);

  if (!emergency) {
    return res.status(404).json({ success: false, message: 'Emergency not found' });
  }

  emergency.status = 'resolved';
  emergency.resolvedBy = req.user._id;
  emergency.resolvedAt = new Date();
  emergency.resolutionNote = resolutionNote;
  await emergency.save();

  // Notify all users that the emergency is resolved
  if (req.io) {
    req.io.emit('emergency_resolved', {
      emergencyId: emergency._id,
      title: emergency.title,
      resolvedBy: req.user.name,
    });
  }

  res.json({ success: true, message: 'Emergency resolved', emergency });
});

/**
 * @route  GET /api/emergency/contacts
 * @desc   Get emergency contact numbers (hardcoded + configurable)
 * @access Private
 */
const getEmergencyContacts = asyncHandler(async (req, res) => {
  // Standard emergency contacts - can be stored in DB in future
  const contacts = [
    { name: 'Police', number: '100', icon: '🚔' },
    { name: 'Ambulance', number: '102', icon: '🚑' },
    { name: 'Fire Brigade', number: '101', icon: '🚒' },
    { name: 'Disaster Management', number: '108', icon: '⚠️' },
    { name: 'Society Security', number: '+91-9999999999', icon: '🔐' },
    { name: 'Society Manager', number: '+91-8888888888', icon: '👨‍💼' },
  ];

  res.json({ success: true, contacts });
});

module.exports = { raiseEmergency, getEmergencies, resolveEmergency, getEmergencyContacts };
