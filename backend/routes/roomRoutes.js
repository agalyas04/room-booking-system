const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomAvailability
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validation rules
const roomValidation = [
  body('name').trim().notEmpty().withMessage('Room name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  handleValidationErrors
];

// Routes
router.route('/')
  .get(protect, getRooms)
  .post(protect, authorize('admin'), roomValidation, createRoom);

router.route('/:id')
  .get(protect, getRoom)
  .put(protect, authorize('admin'), updateRoom)
  .delete(protect, authorize('admin'), deleteRoom);

router.get('/:id/availability', protect, getRoomAvailability);

module.exports = router;
