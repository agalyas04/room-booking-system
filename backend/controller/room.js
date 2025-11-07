// controller/room.js - Room controller
const Room = require('../models/room');
const mongoose = require('mongoose');

// Room controller handles all room-related operations

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to handle errors
const handleError = (error, res, defaultMessage) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: Object.values(error.errors).map(err => err.message).join(', ')
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'Please provide a valid room ID'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      error: 'A room with this name already exists'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
};

// Get all rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    handleError(error, res, 'Error fetching rooms');
  }
};

// Get single room by ID
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'Please provide a valid room ID'
      });
    }
    
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
        error: `No room found with ID: ${id}`
      });
    }
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    handleError(error, res, 'Error fetching room');
  }
};

// Create new room
const createRoom = async (req, res) => {
  try {
    // Validate required fields
    const { name, capacity, location } = req.body;
    
    if (!name || !capacity || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'Name, capacity, and location are required'
      });
    }
    
    // Validate capacity is a positive number
    if (typeof capacity !== 'number' || capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid capacity',
        error: 'Capacity must be a positive number'
      });
    }
    
    const room = await Room.create(req.body);
    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    handleError(error, res, 'Error creating room');
  }
};

// Update room
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'Please provide a valid room ID'
      });
    }
    
    // Validate capacity if provided
    if (req.body.capacity !== undefined) {
      if (typeof req.body.capacity !== 'number' || req.body.capacity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid capacity',
          error: 'Capacity must be a positive number'
        });
      }
    }
    
    const room = await Room.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
        error: `No room found with ID: ${id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    handleError(error, res, 'Error updating room');
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'Please provide a valid room ID'
      });
    }
    
    const room = await Room.findByIdAndDelete(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
        error: `No room found with ID: ${id}`
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: room
    });
  } catch (error) {
    handleError(error, res, 'Error deleting room');
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};

