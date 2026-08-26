const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, flatNumber, block } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }

  // Create user in DB (password will be hashed by pre-save hook)
  const user = await User.create({ name, email, password, role, phone, flatNumber, block });

  // Generate JWT token for the new user
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      flatNumber: user.flatNumber,
      block: user.block,
    },
  });
});

/**
 * @route  POST /api/auth/login
 * @desc   Authenticate user and return JWT token
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Find user by email and explicitly select password (excluded by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
  }

  // Compare provided password with hashed password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      flatNumber: user.flatNumber,
      block: user.block,
      avatar: user.avatar,
    },
  });
});

/**
 * @route  GET /api/auth/me
 * @desc   Get logged-in user's profile
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

/**
 * @route  PUT /api/auth/updateprofile
 * @desc   Update logged-in user's profile info
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, vehicleNumber, emergencyContact, notificationPreferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, vehicleNumber, emergencyContact, notificationPreferences },
    { new: true, runValidators: true } // Return updated document
  );

  res.json({ success: true, message: 'Profile updated', user });
});

/**
 * @route  PUT /api/auth/changepassword
 * @desc   Change password for logged-in user
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Fetch user with password field
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword; // Will be re-hashed by pre-save hook
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = { register, login, getMe, updateProfile, changePassword };
