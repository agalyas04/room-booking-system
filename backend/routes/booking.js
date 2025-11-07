// routes/booking.js - Booking routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getUserBookings,
  getRoomBookings
} = require('../controller/bookingController');

// POST /api/bookings - Create new booking (protected)
router.post('/', auth, createBooking);

// GET /api/bookings - Get all bookings (protected)
router.get('/', auth, getAllBookings);

// GET /api/bookings/my-bookings - Get current user's bookings (protected)
router.get('/my-bookings', auth, getUserBookings);

// GET /api/bookings/room/:roomId - Get bookings for a specific room (protected)
router.get('/room/:roomId', auth, getRoomBookings);

// GET /api/bookings/:id - Get single booking (protected)
router.get('/:id', auth, getBookingById);

// PUT /api/bookings/:id - Update booking (protected)
router.put('/:id', auth, updateBooking);

// DELETE /api/bookings/:id - Cancel booking (protected)
router.delete('/:id', auth, cancelBooking);

module.exports = router;
