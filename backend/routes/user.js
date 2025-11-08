// routes/user.js - User routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  deleteUser
} = require('../controller/userController');

// GET /api/users/me - Get current user profile (authenticated)
router.get('/me', auth, getUserProfile);

// PUT /api/users/me - Update current user profile (authenticated)
router.put('/me', auth, updateUserProfile);

// GET /api/users - Get all users (admin only)
router.get('/', auth, admin, getAllUsers);

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', auth, admin, getUserById);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', auth, admin, deleteUser);

module.exports = router;
