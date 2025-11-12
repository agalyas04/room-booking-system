const Booking = require('../models/Booking');
const Room = require('../models/Room');
const moment = require('moment-timezone');

/**
 * Centralized Analytics Service
 * 
 * This service provides consistent analytics calculations across the application.
 * 
 * Key principles:
 * - All date comparisons use UTC timezone internally
 * - End times are treated as EXCLUSIVE (not inclusive)
 * - Only 'confirmed' bookings count toward utilization
 * - Cancelled, expired, draft bookings are excluded
 * - Same filters produce same results across all widgets
 */

class AnalyticsService {
  constructor() {
    // Default working hours: 8 AM to 6 PM (10 hours per day)
    this.WORKING_HOURS_PER_DAY = 10;
    this.WORKING_MINUTES_PER_DAY = this.WORKING_HOURS_PER_DAY * 60;
    
    // Valid booking statuses that count toward utilization
    this.VALID_STATUSES = ['confirmed'];
  }

  /**
   * Normalize date to UTC start of day
   * This ensures consistent date comparisons across timezones
   */
  normalizeToUTCStartOfDay(date) {
    return moment.utc(date).startOf('day').toDate();
  }

  /**
   * Normalize date to UTC end of day
   */
  normalizeToUTCEndOfDay(date) {
    return moment.utc(date).endOf('day').toDate();
  }

  /**
   * Get date range based on range parameter
   */
  getDateRange(range, startDate, endDate) {
    let start, end;

    if (startDate && endDate) {
      start = this.normalizeToUTCStartOfDay(startDate);
      end = this.normalizeToUTCEndOfDay(endDate);
    } else {
      const now = moment.utc();
      switch (range) {
        case 'week':
          start = now.clone().startOf('week').toDate();
          end = now.clone().endOf('week').toDate();
          break;
        case 'month':
          start = now.clone().startOf('month').toDate();
          end = now.clone().endOf('month').toDate();
          break;
        case 'year':
          start = now.clone().startOf('year').toDate();
          end = now.clone().endOf('year').toDate();
          break;
        default:
          // Default to current week
          start = now.clone().startOf('week').toDate();
          end = now.clone().endOf('week').toDate();
      }
    }

    return { start, end };
  }

  /**
   * Calculate booking duration in minutes
   * End time is EXCLUSIVE (not inclusive)
   */
  calculateDurationMinutes(startTime, endTime) {
    const start = moment.utc(startTime);
    const end = moment.utc(endTime);
    return end.diff(start, 'minutes');
  }

  /**
   * Calculate total available minutes for a room in a date range
   */
  calculateAvailableMinutes(startDate, endDate) {
    const start = moment.utc(startDate);
    const end = moment.utc(endDate);
    const days = end.diff(start, 'days') + 1; // +1 to include end day
    return days * this.WORKING_MINUTES_PER_DAY;
  }

  /**
   * Get bookings within date range with proper filtering
   * CRITICAL: Uses startTime for range filtering to ensure bookings are within the window
   */
  async getBookingsInRange(startDate, endDate, additionalFilters = {}) {
    const query = {
      // Booking must START within the range
      startTime: { $gte: startDate, $lt: endDate },
      // Only count confirmed bookings
      status: { $in: this.VALID_STATUSES },
      ...additionalFilters
    };

    return await Booking.find(query).populate('room bookedBy');
  }

  /**
   * Calculate utilization rate for a specific room
   */
  async calculateRoomUtilization(roomId, startDate, endDate) {
    const bookings = await this.getBookingsInRange(startDate, endDate, { room: roomId });
    
    // Calculate total booked minutes
    let totalBookedMinutes = 0;
    const bookingIntervals = [];

    // Sort bookings by start time
    bookings.sort((a, b) => a.startTime - b.startTime);

    // Merge overlapping intervals to avoid double counting
    for (const booking of bookings) {
      const start = moment.utc(booking.startTime);
      const end = moment.utc(booking.endTime);
      
      // Clamp booking to the date range
      const clampedStart = moment.max(start, moment.utc(startDate));
      const clampedEnd = moment.min(end, moment.utc(endDate));
      
      if (clampedStart.isBefore(clampedEnd)) {
        bookingIntervals.push({
          start: clampedStart.toDate(),
          end: clampedEnd.toDate()
        });
      }
    }

    // Merge overlapping intervals
    const mergedIntervals = this.mergeIntervals(bookingIntervals);
    
    // Calculate total minutes from merged intervals
    totalBookedMinutes = mergedIntervals.reduce((sum, interval) => {
      return sum + this.calculateDurationMinutes(interval.start, interval.end);
    }, 0);

    const totalAvailableMinutes = this.calculateAvailableMinutes(startDate, endDate);
    const utilizationRate = totalAvailableMinutes > 0 
      ? (totalBookedMinutes / totalAvailableMinutes) * 100 
      : 0;

    return {
      totalBookedMinutes,
      totalAvailableMinutes,
      utilizationRate: parseFloat(utilizationRate.toFixed(2)),
      bookingCount: bookings.length
    };
  }

  /**
   * Merge overlapping time intervals to avoid double counting
   * This is critical for accurate utilization calculations
   */
  mergeIntervals(intervals) {
    if (intervals.length === 0) return [];

    // Sort by start time
    intervals.sort((a, b) => a.start - b.start);

    const merged = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const current = intervals[i];
      const lastMerged = merged[merged.length - 1];

      // Check if intervals overlap or touch
      // Note: We treat end time as EXCLUSIVE, so touching intervals don't overlap
      if (current.start < lastMerged.end) {
        // Overlapping - merge them
        lastMerged.end = new Date(Math.max(lastMerged.end.getTime(), current.end.getTime()));
      } else {
        // No overlap - add as new interval
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Get comprehensive analytics for dashboard
   */
  async getComprehensiveAnalytics(range, startDate, endDate) {
    const { start, end } = this.getDateRange(range, startDate, endDate);

    // Get all active rooms
    const rooms = await Room.find({ isActive: true });
    const totalRooms = rooms.length;

    // Get all bookings in the selected range
    const bookingsInRange = await this.getBookingsInRange(start, end);
    const totalBookings = bookingsInRange.length;

    // Calculate overall utilization rate
    let totalUtilization = 0;
    const roomUtilization = [];

    for (const room of rooms) {
      const utilization = await this.calculateRoomUtilization(room._id, start, end);
      
      totalUtilization += utilization.utilizationRate;
      roomUtilization.push({
        roomId: room._id,
        roomName: room.name,
        location: room.location,
        capacity: room.capacity,
        utilizationRate: utilization.utilizationRate,
        totalBookings: utilization.bookingCount,
        totalBookedHours: parseFloat((utilization.totalBookedMinutes / 60).toFixed(2))
      });
    }

    const overallUtilizationRate = totalRooms > 0 
      ? parseFloat((totalUtilization / totalRooms).toFixed(2))
      : 0;

    // Sort room utilization by rate (descending)
    roomUtilization.sort((a, b) => b.utilizationRate - a.utilizationRate);

    // Calculate peak usage hour
    const peakUsage = await this.calculatePeakUsageHour(start, end);

    // Calculate weekly utilization (for the current week, not the selected range)
    const weeklyUtilization = await this.calculateWeeklyUtilization();

    // Get popular time slots
    const popularTimeSlots = await this.calculatePopularTimeSlots(start, end);

    // Get booking frequency (single vs recurring)
    const bookingFrequency = await this.calculateBookingFrequency(start, end);

    return {
      totalRooms,
      utilizationRate: overallUtilizationRate,
      totalBookings,
      peakUsage,
      weeklyUtilization,
      roomUtilization,
      popularTimeSlots,
      bookingFrequency,
      dateRange: { start, end }
    };
  }

  /**
   * Calculate peak usage hour
   */
  async calculatePeakUsageHour(startDate, endDate) {
    const bookings = await this.getBookingsInRange(startDate, endDate);

    const hourCounts = {};
    bookings.forEach(booking => {
      const hour = moment.utc(booking.startTime).hour();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    if (Object.keys(hourCounts).length === 0) {
      return 'N/A';
    }

    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    return `${peakHour}:00`;
  }

  /**
   * Calculate weekly utilization for current week
   */
  async calculateWeeklyUtilization() {
    const weekStart = moment.utc().startOf('week');
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyUtilization = [];

    const rooms = await Room.find({ isActive: true });
    const totalRooms = rooms.length;

    for (let i = 0; i < 7; i++) {
      const dayStart = weekStart.clone().add(i, 'days').startOf('day').toDate();
      const dayEnd = weekStart.clone().add(i, 'days').endOf('day').toDate();

      const bookings = await this.getBookingsInRange(dayStart, dayEnd);

      // Calculate total booked minutes for all rooms
      let totalBookedMinutes = 0;
      const roomIntervals = {};

      // Group bookings by room to avoid double counting overlaps
      bookings.forEach(booking => {
        const roomId = booking.room._id.toString();
        if (!roomIntervals[roomId]) {
          roomIntervals[roomId] = [];
        }
        roomIntervals[roomId].push({
          start: booking.startTime,
          end: booking.endTime
        });
      });

      // Merge intervals per room and sum
      Object.values(roomIntervals).forEach(intervals => {
        const merged = this.mergeIntervals(intervals);
        merged.forEach(interval => {
          totalBookedMinutes += this.calculateDurationMinutes(interval.start, interval.end);
        });
      });

      const totalAvailableMinutes = totalRooms * this.WORKING_MINUTES_PER_DAY;
      const dayUtilization = totalAvailableMinutes > 0
        ? (totalBookedMinutes / totalAvailableMinutes) * 100
        : 0;

      weeklyUtilization.push({
        day: weekDays[i],
        utilization: parseFloat(dayUtilization.toFixed(2))
      });
    }

    return weeklyUtilization;
  }

  /**
   * Calculate popular time slots
   * Returns exactly the top 2 most popular time slots based on booking frequency
   * Uses consistent filtering (same date range, only confirmed bookings)
   * Time buckets are 1-hour intervals aligned to hour boundaries
   */
  async calculatePopularTimeSlots(startDate, endDate) {
    // Get bookings with same filters as rest of analytics
    const bookings = await this.getBookingsInRange(startDate, endDate);

    if (bookings.length === 0) {
      return []; // Return empty array for "no data" state
    }

    // Count bookings per hour bucket (using start time hour)
    // Hour buckets are 0-23, representing time slots like 9:00-10:00, 10:00-11:00, etc.
    const hourCounts = {};
    
    bookings.forEach(booking => {
      // Use UTC hour to ensure consistent timezone handling
      const hour = moment.utc(booking.startTime).hour();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Sort by count (descending) and take exactly top 2
    const timeSlotData = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2); // FIXED: Return exactly top 2 time slots

    // Format time slots for display
    return timeSlotData.map(slot => {
      const hour = slot.hour;
      const nextHour = (hour + 1) % 24;
      
      // Format hour in 12-hour format with AM/PM
      const formatHour = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayHour}:00 ${period}`;
      };

      return {
        timeSlot: `${formatHour(hour)} - ${formatHour(nextHour)}`,
        count: slot.count,
        hour: hour // Include hour for potential sorting/filtering
      };
    });
  }

  /**
   * Calculate booking frequency (single vs recurring)
   */
  async calculateBookingFrequency(startDate, endDate) {
    const bookings = await this.getBookingsInRange(startDate, endDate);

    const recurringBookings = bookings.filter(b => b.recurrenceGroup != null).length;
    const singleBookings = bookings.length - recurringBookings;

    return [
      {
        type: 'Single Bookings',
        count: singleBookings,
        percentage: bookings.length > 0 
          ? Math.round((singleBookings / bookings.length) * 100) 
          : 0
      },
      {
        type: 'Recurring Bookings',
        count: recurringBookings,
        percentage: bookings.length > 0 
          ? Math.round((recurringBookings / bookings.length) * 100) 
          : 0
      }
    ];
  }

  /**
   * Invalidate cache when bookings change
   * This will be called by booking controller on create/update/delete
   */
  invalidateCache() {
    // For now, we don't have caching implemented
    // This is a placeholder for future caching implementation
    // When implemented, this would clear Redis cache or in-memory cache
  }
}

module.exports = new AnalyticsService();
