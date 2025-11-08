// controller/recurrenceController.js - Recurrence management controller
const Booking = require('../models/booking');
const RecurrenceGroup = require('../models/recurrenceGroup');
const mongoose = require('mongoose');

// Cancel all occurrences in a recurrence group
const cancelAllOccurrences = async (req, res) => {
  try {
    const { recurrenceGroupId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(recurrenceGroupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recurrence group ID'
      });
    }

    const recurrenceGroup = await RecurrenceGroup.findById(recurrenceGroupId);

    if (!recurrenceGroup) {
      return res.status(404).json({
        success: false,
        message: 'Recurrence group not found'
      });
    }

    // Check if user owns the recurrence group or is admin
    if (recurrenceGroup.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You can only cancel your own recurring bookings'
      });
    }

    // Cancel all bookings in this recurrence group
    const result = await Booking.updateMany(
      { recurrenceGroup: recurrenceGroupId, status: { $ne: 'cancelled' } },
      { status: 'cancelled' }
    );

    // Mark recurrence group as cancelled
    recurrenceGroup.status = 'cancelled';
    await recurrenceGroup.save();

    res.status(200).json({
      success: true,
      message: 'All occurrences cancelled successfully',
      data: {
        recurrenceGroupId,
        cancelledCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling recurring bookings',
      error: error.message
    });
  }
};

// Cancel single occurrence
const cancelSingleOccurrence = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You can only cancel your own bookings'
      });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Cancel this single occurrence
    booking.status = 'cancelled';
    await booking.save();

    await booking.populate('room', 'name location capacity amenities');
    await booking.populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Single occurrence cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// Update all occurrences in a recurrence group
const updateAllOccurrences = async (req, res) => {
  try {
    const { recurrenceGroupId } = req.params;
    const { purpose, attendees, notes } = req.body;
    const userId = req.user._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(recurrenceGroupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recurrence group ID'
      });
    }

    const recurrenceGroup = await RecurrenceGroup.findById(recurrenceGroupId);

    if (!recurrenceGroup) {
      return res.status(404).json({
        success: false,
        message: 'Recurrence group not found'
      });
    }

    // Check if user owns the recurrence group or is admin
    if (recurrenceGroup.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You can only update your own recurring bookings'
      });
    }

    // Update recurrence group
    if (purpose) recurrenceGroup.purpose = purpose;
    if (attendees) recurrenceGroup.attendees = attendees;
    if (notes !== undefined) recurrenceGroup.notes = notes;
    await recurrenceGroup.save();

    // Update all non-cancelled bookings in this recurrence group
    const updateData = {};
    if (purpose) updateData.purpose = purpose;
    if (attendees) updateData.attendees = attendees;
    if (notes !== undefined) updateData.notes = notes;

    const result = await Booking.updateMany(
      { recurrenceGroup: recurrenceGroupId, status: { $ne: 'cancelled' } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: 'All occurrences updated successfully',
      data: {
        recurrenceGroupId,
        updatedCount: result.modifiedCount,
        updates: updateData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating recurring bookings',
      error: error.message
    });
  }
};

// Get all bookings in a recurrence group
const getRecurrenceGroupBookings = async (req, res) => {
  try {
    const { recurrenceGroupId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(recurrenceGroupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recurrence group ID'
      });
    }

    const recurrenceGroup = await RecurrenceGroup.findById(recurrenceGroupId);

    if (!recurrenceGroup) {
      return res.status(404).json({
        success: false,
        message: 'Recurrence group not found'
      });
    }

    const bookings = await Booking.find({ recurrenceGroup: recurrenceGroupId })
      .populate('room', 'name location capacity amenities')
      .populate('user', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      recurrenceGroup,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recurrence group bookings',
      error: error.message
    });
  }
};

module.exports = {
  cancelAllOccurrences,
  cancelSingleOccurrence,
  updateAllOccurrences,
  getRecurrenceGroupBookings
};
