const Room = require('../models/Room'); // Room model
const Booking = require('../models/Booking');
const NotificationService = require('../services/notificationService');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
exports.getRooms = async (req, res, next) => {
  try {
    const { isActive, minCapacity, location } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (minCapacity) query.capacity = { $gte: parseInt(minCapacity) };
    if (location) query.location = new RegExp(location, 'i');

    const rooms = await Room.find(query).sort('name');

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Fetch all confirmed bookings for this room
    const bookings = await Booking.find({
      room: req.params.id,
      status: 'confirmed'
    }).populate('bookedBy', 'name email').sort('startTime');

    // Add bookings to room object
    const roomWithBookings = {
      ...room.toObject(),
      bookings
    };

    res.status(200).json({
      success: true,
      data: roomWithBookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    
    // Notify admins about room creation
    await NotificationService.notifyAdminsOfRoomAction('room_created', room, req.user);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Notify admins about room update
    await NotificationService.notifyAdminsOfRoomAction('room_updated', room, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room has future bookings
    const futureBookings = await Booking.find({
      room: req.params.id,
      startTime: { $gte: new Date() },
      status: 'confirmed'
    });

    if (futureBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with future bookings'
      });
    }

    // Notify admins about room deletion
    await NotificationService.notifyAdminsOfRoomAction('room_deleted', room, req.user);
    
    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room availability
// @route   GET /api/rooms/:id/availability
// @access  Private
exports.getRoomAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date'
      });
    }

    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      room: req.params.id,
      status: 'confirmed',
      startTime: { $lt: endOfDay },
      endTime: { $gt: startOfDay }
    }).populate('bookedBy', 'name email').sort('startTime');

    res.status(200).json({
      success: true,
      data: {
        room,
        date,
        bookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms (admin)
// @route   GET /api/rooms/all
// @access  Private/Admin
exports.getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({}).sort('name');

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle room status
// @route   PATCH /api/rooms/:id/status
// @access  Private/Admin
exports.toggleRoomStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Notify admins about room status change
    await NotificationService.notifyAdminsOfRoomAction(
      'room_updated', 
      { ...room.toObject(), statusChanged: true }, 
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Room ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: room
    });
  } catch (error) {
    next(error);
  }
};
