const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  getMyBookings
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validation rules
const bookingValidation = [
  body('room').notEmpty().withMessage('Room is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('endTime').custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.startTime)) {
      throw new Error('End time must be after start time');
    }
    return true;
  }),
  handleValidationErrors
];

// Routes
router.get('/my-bookings', protect, getMyBookings);

router.route('/')
  .get(protect, getBookings)
  .post(protect, bookingValidation, createBooking);

router.route('/:id')
  .get(protect, getBooking)
  .put(protect, updateBooking);

router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
