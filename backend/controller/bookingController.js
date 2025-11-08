const Booking = require('../models/Booking');
const RecurrenceGroup = require('../models/RecurrenceGroup');
const Room = require('../models/Room');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { checkOverlap, generateRecurringDates, combineDateAndTime } = require('../utils/bookingHelper');
const { sendEmail, bookingCreatedEmail, bookingCancelledEmail } = require('../utils/emailService');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    const { room, startDate, endDate, status } = req.query;
    
    const query = {};
    
    // Filter by rooms
    if (room) query.room = room;
    
    // Filter by date range
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    // Filter by status
    if (status) query.status = status;
    
    // Non-admin users can only see their own bookings or bookings they're attending
    if (req.user.role !== 'admin') {
      query.$or = [
        { bookedBy: req.user._id },
        { attendees: req.user._id }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('room', 'name location capacity')
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email')
      .sort('-startTime');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'name location capacity amenities')
      .populate('bookedBy', 'name email department')
      .populate('attendees', 'name email')
      .populate('recurrenceGroup');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check access rights
    if (req.user.role !== 'admin' && 
        booking.bookedBy._id.toString() !== req.user._id.toString() &&
        !booking.attendees.some(a => a._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { room, title, description, startTime, endTime, attendees, isRecurring, recurrenceEndDate } = req.body;

    // Verify room exists
    const roomExists = await Room.findById(room);
    if (!roomExists) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check for overlapping bookings
    const hasOverlap = await checkOverlap(room, new Date(startTime), new Date(endTime));
    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'Room is already booked for this time slot'
      });
    }

    // Handle recurring booking
    if (isRecurring && recurrenceEndDate) {
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);
      const dayOfWeek = startDateTime.getDay();
      
      // Extract time components
      const baseStartTime = `${startDateTime.getHours()}:${startDateTime.getMinutes().toString().padStart(2, '0')}`;
      const baseEndTime = `${endDateTime.getHours()}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;

      // Create recurrence group
      const recurrenceGroup = await RecurrenceGroup.create({
        createdBy: req.user._id,
        room,
        recurrencePattern: 'weekly',
        dayOfWeek,
        startDate: startDateTime,
        endDate: new Date(recurrenceEndDate),
        baseStartTime,
        baseEndTime,
        title,
        description
      });

      // Generate all recurring dates
      const recurringDates = generateRecurringDates(startDateTime, new Date(recurrenceEndDate), dayOfWeek);
      
      const createdBookings = [];
      const failedDates = [];

      for (const date of recurringDates) {
        const bookingStart = combineDateAndTime(date, baseStartTime);
        const bookingEnd = combineDateAndTime(date, baseEndTime);

        // Check for overlap
        const overlap = await checkOverlap(room, bookingStart, bookingEnd);
        if (!overlap) {
          const booking = await Booking.create({
            room,
            bookedBy: req.user._id,
            title,
            description,
            startTime: bookingStart,
            endTime: bookingEnd,
            attendees: attendees || [],
            recurrenceGroup: recurrenceGroup._id
          });
          createdBookings.push(booking);
        } else {
          failedDates.push(date);
        }
      }

      // Send notification
      await Notification.create({
        user: req.user._id,
        type: 'booking_created',
        title: 'Recurring Booking Created',
        message: `Your recurring booking for ${title} has been created with ${createdBookings.length} occurrences.`,
        room
      });

      return res.status(201).json({
        success: true,
        message: 'Recurring booking created successfully',
        data: {
          recurrenceGroup,
          createdBookings: createdBookings.length,
          failedDates: failedDates.length
        }
      });
    }

    // Create single booking
    const booking = await Booking.create({
      room,
      bookedBy: req.user._id,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees: attendees || []
    });

    await booking.populate('room bookedBy attendees');

    // Create notification
    await Notification.create({
      user: req.user._id,
      type: 'booking_created',
      title: 'Booking Created',
      message: `Your booking for ${booking.title} has been confirmed.`,
      booking: booking._id,
      room: booking.room._id
    });

    // Send email notification (async, don't wait)
    if (process.env.EMAIL_USER) {
      sendEmail({
        email: req.user.email,
        subject: 'Booking Confirmation - Room Booking Lite',
        html: bookingCreatedEmail(booking, roomExists, req.user)
      }).catch(err => console.error('Email error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && booking.bookedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    const { startTime, endTime, room } = req.body;

    // If time or room is being changed, check for overlaps
    if (startTime || endTime || room) {
      const newStartTime = startTime ? new Date(startTime) : booking.startTime;
      const newEndTime = endTime ? new Date(endTime) : booking.endTime;
      const newRoom = room || booking.room;

      const hasOverlap = await checkOverlap(newRoom, newStartTime, newEndTime, booking._id);
      if (hasOverlap) {
        return res.status(400).json({
          success: false,
          message: 'Room is already booked for this time slot'
        });
      }
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('room bookedBy attendees');

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room bookedBy');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization (own booking or admin)
    if (req.user.role !== 'admin' && booking.bookedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = Date.now();
    booking.cancellationReason = req.body.cancellationReason || req.body.reason || '';
    
    await booking.save();

    // Create notification
    await Notification.create({
      user: booking.bookedBy._id,
      type: req.user.role === 'admin' ? 'admin_override' : 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for ${booking.title} has been cancelled.`,
      booking: booking._id,
      room: booking.room._id
    });

    // Send email notification
    if (process.env.EMAIL_USER) {
      const user = await User.findById(booking.bookedBy._id);
      sendEmail({
        email: user.email,
        subject: 'Booking Cancelled - Room Booking Lite',
        html: bookingCancelledEmail(booking, booking.room, user)
      }).catch(err => console.error('Email error:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const { upcoming } = req.query;
    
    const query = {
      $or: [
        { bookedBy: req.user._id },
        { attendees: req.user._id }
      ]
    };

    if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
      query.status = 'confirmed';
    }

    const bookings = await Booking.find(query)
      .populate('room', 'name location capacity')
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email')
      .populate('recurrenceGroup')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};
