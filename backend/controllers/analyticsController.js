const Booking = require('../models/Booking'); // Booking model
const Room = require('../models/Room');
const User = require('../models/User');
const AvailabilityLog = require('../models/AvailabilityLog');
const moment = require('moment');
const analyticsService = require('../services/analyticsService');

// @desc    Get comprehensive analytics for dashboard
// @route   GET /api/analytics
// @access  Private/Admin
// 
// FIXED: Complete rewrite using centralized analytics service
// - Consistent date filtering across all metrics
// - Proper timezone handling (UTC normalization)
// - Exclusive end time treatment
// - No double counting of overlapping bookings
// - Only confirmed bookings counted
exports.getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, range = 'week' } = req.query;
    
    // Use centralized analytics service for consistent calculations
    const analyticsData = await analyticsService.getComprehensiveAnalytics(
      range,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    next(error);
  }
};

// @desc    Get all analytics data (combined)
// @route   GET /api/analytics
// @access  Private/Admin
exports.getAllAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    // Total bookings
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Most popular rooms
    const mostPopularRooms = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$room',
          bookingCount: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                3600000
              ]
            }
          }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'roomData'
        }
      },
      {
        $unwind: '$roomData'
      },
      {
        $project: {
          _id: 0,
          name: '$roomData.name',
          location: '$roomData.location',
          bookingCount: 1,
          totalHours: { $round: ['$totalHours', 2] }
        }
      }
    ]);

    // Peak booking hours
    const peakHours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $project: {
          hour: { $hour: '$startTime' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          count: 1
        }
      }
    ]);

    // Room utilization
    const rooms = await Room.find({ isActive: true });
    
    const roomUtilization = await Promise.all(
      rooms.map(async (room) => {
        const bookings = await Booking.find({
          room: room._id,
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'completed'] }
        });

        const totalBookedMinutes = bookings.reduce((sum, booking) => {
          const duration = (booking.endTime - booking.startTime) / 60000;
          return sum + duration;
        }, 0);

        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalAvailableMinutes = days * 10 * 60;

        const utilizationRate = totalAvailableMinutes > 0
          ? parseFloat(((totalBookedMinutes / totalAvailableMinutes) * 100).toFixed(2))
          : 0;

        return {
          roomName: room.name,
          location: room.location,
          totalBookings: bookings.length,
          totalHours: parseFloat((totalBookedMinutes / 60).toFixed(2)),
          utilizationRate
        };
      })
    );

    // Top users
    const topUsers = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$bookedBy',
          bookingCount: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                3600000
              ]
            }
          }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: '$userData'
      },
      {
        $project: {
          _id: 0,
          name: '$userData.name',
          email: '$userData.email',
          department: '$userData.department',
          bookingCount: 1,
          totalHours: { $round: ['$totalHours', 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        bookingsByStatus,
        mostPopularRooms,
        peakHours,
        roomUtilization: roomUtilization.sort((a, b) => b.utilizationRate - a.utilizationRate),
        topUsers
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    next(error);
  }
};

// @desc    Get analytics dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    // Total bookings
    const totalBookings = await Booking.countDocuments({
      startTime: { $gte: start, $lte: end },
      status: 'confirmed'
    });

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Most popular rooms
    const popularRooms = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$room',
          bookingCount: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                3600000 // Convert milliseconds to hours
              ]
            }
          }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      {
        $unwind: '$room'
      },
      {
        $project: {
          roomName: '$room.name',
          location: '$room.location',
          bookingCount: 1,
          totalHours: { $round: ['$totalHours', 2] }
        }
      }
    ]);

    // Peak booking hours
    const peakHours = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end },
          status: 'confirmed'
        }
      },
      {
        $project: {
          hour: { $hour: '$startTime' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Bookings trend (daily)
    const bookingsTrend = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        bookingsByStatus,
        popularRooms,
        peakHours,
        bookingsTrend,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room utilization rates
// @route   GET /api/analytics/utilization
// @access  Private/Admin
exports.getRoomUtilization = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    const rooms = await Room.find({ isActive: true });
    
    const utilizationData = await Promise.all(
      rooms.map(async (room) => {
        const bookings = await Booking.find({
          room: room._id,
          startTime: { $gte: start, $lte: end },
          status: 'confirmed'
        });

        // Calculate total booked hours
        const totalBookedMinutes = bookings.reduce((sum, booking) => {
          const duration = (booking.endTime - booking.startTime) / 60000; // Convert to minutes
          return sum + duration;
        }, 0);

        // Calculate available hours (8 AM to 6 PM = 10 hours/day)
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalAvailableMinutes = days * 10 * 60; // 10 hours * 60 minutes

        const utilizationRate = totalAvailableMinutes > 0
          ? ((totalBookedMinutes / totalAvailableMinutes) * 100).toFixed(2)
          : 0;

        return {
          roomId: room._id,
          roomName: room.name,
          location: room.location,
          capacity: room.capacity,
          totalBookings: bookings.length,
          totalBookedHours: (totalBookedMinutes / 60).toFixed(2),
          utilizationRate: parseFloat(utilizationRate)
        };
      })
    );

    // Sort by utilization rate
    utilizationData.sort((a, b) => b.utilizationRate - a.utilizationRate);

    res.status(200).json({
      success: true,
      data: utilizationData,
      dateRange: { start, end }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking frequency by time slot
// @route   GET /api/analytics/time-slots
// @access  Private/Admin
exports.getTimeSlotPopularity = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    const timeSlots = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end },
          status: 'confirmed'
        }
      },
      {
        $project: {
          hour: { $hour: '$startTime' },
          dayOfWeek: { $dayOfWeek: '$startTime' } // 1 = Sunday, 2 = Monday, etc.
        }
      },
      {
        $group: {
          _id: {
            hour: '$hour',
            dayOfWeek: '$dayOfWeek'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 }
      }
    ]);

    // Format data for frontend
    const formattedData = timeSlots.map(slot => ({
      hour: slot._id.hour,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot._id.dayOfWeek - 1],
      count: slot.count
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
      dateRange: { start, end }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user booking statistics
// @route   GET /api/analytics/user-stats
// @access  Private/Admin
exports.getUserStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    const userStats = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$bookedBy',
          totalBookings: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                3600000
              ]
            }
          }
        }
      },
      {
        $sort: { totalBookings: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userName: '$user.name',
          userEmail: '$user.email',
          department: '$user.department',
          totalBookings: 1,
          totalHours: { $round: ['$totalHours', 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: userStats,
      dateRange: { start, end }
    });
  } catch (error) {
    next(error);
  }
};
