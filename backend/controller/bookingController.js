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

// Placeholder functions (to be implemented)
const getAllBookings = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getBookingById = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const updateBooking = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const cancelBooking = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getUserBookings = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getRoomBookings = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
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
