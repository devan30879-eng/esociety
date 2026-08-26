const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, createUser, updateUser,
  deleteUser, getResidentsList, getUserStats,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

// Admin-only routes
router.get('/', authorize('admin'), getAllUsers);
router.post('/', authorize('admin'), createUser);
router.get('/stats/overview', authorize('admin'), getUserStats);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// Available to all authenticated users (for visitor forms etc.)
router.get('/residents/list', getResidentsList);
router.get('/:id', authorize('admin'), getUserById);

module.exports = router;
