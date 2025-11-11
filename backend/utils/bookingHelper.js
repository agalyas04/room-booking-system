const moment = require('moment'); // Date utility
const Booking = require('../models/Booking');

// Check for overlapping bookings
exports.checkOverlap = async (roomId, startTime, endTime, excludeBookingId = null) => {
  const query = {
    room: roomId,
    status: 'confirmed',
    $or: [
      // New booking starts during existing booking
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New booking ends during existing booking
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New booking completely contains existing booking
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      // Existing booking completely contains new booking
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };

  // Exclude current booking when updating
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const overlapping = await Booking.findOne(query);
  return !!overlapping;
};

// Generate recurring booking dates
exports.generateRecurringDates = (startDate, endDate, dayOfWeek) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Find the first occurrence of the day of week
  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1);
  }

  // Generate all occurrences
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7); // Add one week
  }

  return dates;
};

// Combine date and time
exports.combineDateAndTime = (date, timeString) => {
  const [hours, minutes] = timeString.split(':');
  const combined = new Date(date);
  combined.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return combined;
};

// Enhanced overlap check that includes recurring bookings
exports.checkOverlapWithRecurring = async (roomId, startTime, endTime, excludeBookingId = null) => {
  // First check regular bookings
  const hasRegularOverlap = await exports.checkOverlap(roomId, startTime, endTime, excludeBookingId);
  if (hasRegularOverlap) {
    return true;
  }

  // Then check against recurring booking patterns
  const RecurrenceGroup = require('../models/RecurrenceGroup');
  
  // FIXED: Extract date-only values from the booking times for proper date range comparison
  // The issue was comparing full datetime objects against date-only fields in RecurrenceGroup
  const bookingDate = new Date(startTime);
  bookingDate.setHours(0, 0, 0, 0); // Normalize to start of day for date comparison
  
  const activeRecurrenceGroups = await RecurrenceGroup.find({
    room: roomId,
    isActive: true, // FIXED: Only check active recurrence groups
    startDate: { $lte: bookingDate }, // FIXED: Compare date-only values
    endDate: { $gte: bookingDate } // FIXED: Compare date-only values
  });

  // Get the day of week for the booking date (0 = Sunday, 1 = Monday, etc.)
  const bookingDayOfWeek = startTime.getDay();

  for (const group of activeRecurrenceGroups) {
    // FIXED: Only check if the booking day matches the recurring pattern's day of week
    // This prevents false positives when the date range overlaps but the day doesn't match
    if (group.dayOfWeek !== bookingDayOfWeek) {
      continue; // Skip this recurrence group - different day of week
    }

    // Generate all recurring dates for this group
    const recurringDates = exports.generateRecurringDates(
      group.startDate, 
      group.endDate, 
      group.dayOfWeek
    );

    // Check each recurring instance
    for (const date of recurringDates) {
      // Normalize the recurring date to match the booking date
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      
      // FIXED: Only check time overlap if the dates actually match
      // This prevents comparing times across different dates
      if (normalizedDate.getTime() === bookingDate.getTime()) {
        const recurringStart = exports.combineDateAndTime(date, group.baseStartTime);
        const recurringEnd = exports.combineDateAndTime(date, group.baseEndTime);
        
        // Check if the new booking overlaps with this recurring instance
        // Standard overlap check: (StartA < EndB) AND (EndA > StartB)
        if (startTime < recurringEnd && endTime > recurringStart) {
          return true; // Actual time overlap found on the same date
        }
      }
    }
  }

  return false; // No overlaps found
};
