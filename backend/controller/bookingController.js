// controller/bookingController.js - Booking controller
const Booking = require('../models/booking');
const Room = require('../models/room');
const mongoose = require('mongoose');

// Create new booking
const createBooking = async (req, res) => {
  try {
    const { room, startTime, endTime, purpose, attendees, notes } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!room || !startTime || !endTime || !purpose || !attendees) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'Room, startTime, endTime, purpose, and attendees are required'
      });
    }

    // Validate time
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range',
        error: 'End time must be after start time'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start time',
        error: 'Cannot book in the past'
      });
    }

    // Check if room exists
    const roomData = await Room.findById(room);
    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Validate attendees don't exceed room capacity
    if (attendees > roomData.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Attendees exceed room capacity',
        error: `Room capacity is ${roomData.capacity}, but ${attendees} attendees requested`
      });
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      room: room,
      status: { $nin: ['cancelled'] },
      $or: [
        // New booking starts during existing booking
        { startTime: { $lte: start }, endTime: { $gt: start } },
        // New booking ends during existing booking
        { startTime: { $lt: end }, endTime: { $gte: end } },
        // New booking completely contains existing booking
        { startTime: { $gte: start }, endTime: { $lte: end } }
      ]
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Room is not available',
        error: 'This room is already booked for the selected time slot'
      });
    }

    // Create booking
    const booking = await Booking.create({
      room,
      user: userId,
      startTime: start,
      endTime: end,
      purpose,
      attendees,
      notes: notes || ''
    });

    // Populate room and user details
    await booking.populate('room', 'name location capacity amenities');
    await booking.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('room', 'name location capacity amenities')
      .populate('user', 'name email')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id)
      .populate('room', 'name location capacity amenities')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, purpose, attendees, notes } = req.body;
    const userId = req.user._id;

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

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You can only update your own bookings'
      });
    }

    // Check if booking is cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update cancelled booking'
      });
    }

    // Validate time if provided
    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : booking.startTime;
      const end = endTime ? new Date(endTime) : booking.endTime;

      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time range',
          error: 'End time must be after start time'
        });
      }

      if (start < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start time',
          error: 'Cannot book in the past'
        });
      }

      // Check for overlapping bookings (excluding current booking)
      const overlappingBooking = await Booking.findOne({
        _id: { $ne: id },
        room: booking.room,
        status: { $nin: ['cancelled'] },
        $or: [
          { startTime: { $lte: start }, endTime: { $gt: start } },
          { startTime: { $lt: end }, endTime: { $gte: end } },
          { startTime: { $gte: start }, endTime: { $lte: end } }
        ]
      });

      if (overlappingBooking) {
        return res.status(409).json({
          success: false,
          message: 'Room is not available',
          error: 'This room is already booked for the selected time slot'
        });
      }

      booking.startTime = start;
      booking.endTime = end;
    }

    // Validate attendees if provided
    if (attendees) {
      const roomData = await Room.findById(booking.room);
      if (attendees > roomData.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Attendees exceed room capacity',
          error: `Room capacity is ${roomData.capacity}, but ${attendees} attendees requested`
        });
      }
      booking.attendees = attendees;
    }

    // Update other fields if provided
    if (purpose) booking.purpose = purpose;
    if (notes !== undefined) booking.notes = notes;

    await booking.save();

    // Populate details for response
    await booking.populate('room', 'name location capacity amenities');
    await booking.populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

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

    // Update status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Populate details for response
    await booking.populate('room', 'name location capacity amenities');
    await booking.populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
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

// Get current user's bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId })
      .populate('room', 'name location capacity amenities')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user bookings',
      error: error.message
    });
  }
};

// Get bookings for a specific room
const getRoomBookings = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID'
      });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const bookings = await Booking.find({ room: roomId })
      .populate('user', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      room: {
        id: room._id,
        name: room.name,
        location: room.location
      },
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room bookings',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getUserBookings,
  getRoomBookings
};
