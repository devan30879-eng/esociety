const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route  GET /api/users
 * @desc   Get all users (admin only)
 * @access Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search } = req.query;

  // Build dynamic filter object based on query params
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { flatNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

/**
 * @route  GET /api/users/:id
 * @desc   Get a single user by ID
 * @access Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

/**
 * @route  POST /api/users
 * @desc   Create a new user (admin creates staff/residents)
 * @access Private/Admin
 */
const createUser = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create(req.body);
  res.status(201).json({ success: true, message: 'User created successfully', user });
});

/**
 * @route  PUT /api/users/:id
 * @desc   Update user by ID (admin)
 * @access Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  // Prevent password update through this route
  delete req.body.password;

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, message: 'User updated', user });
});

/**
 * @route  DELETE /api/users/:id
 * @desc   Deactivate (soft delete) a user
 * @access Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, message: 'User deactivated successfully' });
});

/**
 * @route  GET /api/users/residents/list
 * @desc   Get all active residents (for dropdowns)
 * @access Private
 */
const getResidentsList = asyncHandler(async (req, res) => {
  const residents = await User.find({ role: 'resident', isActive: true })
    .select('name flatNumber block phone')
    .sort({ flatNumber: 1 });

  res.json({ success: true, count: residents.length, residents });
});

/**
 * @route  GET /api/users/stats/overview
 * @desc   Get user statistics for admin dashboard
 * @access Private/Admin
 */
const getUserStats = asyncHandler(async (req, res) => {
  // Count users grouped by role using MongoDB aggregation
  const stats = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  res.json({ success: true, stats, totalUsers, activeUsers });
});

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getResidentsList, getUserStats };
