// routes/admin.js - Admin-specific routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Booking = require('../models/booking');
const mongoose = require('mongoose');

// DELETE /api/admin/bookings/:id - Admin force cancel any booking
router.delete('/bookings/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Admin can cancel any booking
    booking.status = 'cancelled';
    await booking.save();

    // Populate details for response
    await booking.populate('room', 'name location capacity amenities');
    await booking.populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled by admin',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// PUT /api/admin/bookings/:id - Admin override/update any booking
router.put('/bookings/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, purpose, attendees, notes, status } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Admin can update any field including status
    if (startTime) booking.startTime = new Date(startTime);
    if (endTime) booking.endTime = new Date(endTime);
    if (purpose) booking.purpose = purpose;
    if (attendees) booking.attendees = attendees;
    if (notes !== undefined) booking.notes = notes;
    if (status) booking.status = status;

    await booking.save();

    // Populate details for response
    await booking.populate('room', 'name location capacity amenities');
    await booking.populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Booking updated by admin',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

module.exports = router;
