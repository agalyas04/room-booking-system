// models/AvailabilityLog.js - Availability log model for tracking room availability changes
const mongoose = require('mongoose');

const availabilityLogSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    startTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance', 'blocked'],
    default: 'available'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeType: {
    type: String,
    enum: ['booking_created', 'booking_cancelled', 'manual_block', 'maintenance_scheduled', 'system_update'],
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['available', 'booked', 'maintenance', 'blocked'],
    default: null
  },
  metadata: {
    bookingTitle: String,
    attendeeCount: Number,
    duration: Number, // in minutes
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrenceGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurrenceGroup',
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
availabilityLogSchema.index({ room: 1, date: 1 });
availabilityLogSchema.index({ room: 1, date: 1, 'timeSlot.startTime': 1 });
availabilityLogSchema.index({ status: 1, date: 1 });
availabilityLogSchema.index({ changeType: 1, createdAt: -1 });
availabilityLogSchema.index({ changedBy: 1, createdAt: -1 });

// Virtual for formatted time slot
availabilityLogSchema.virtual('formattedTimeSlot').get(function() {
  return `${this.timeSlot.startTime} - ${this.timeSlot.endTime}`;
});

// Static method to log availability change
availabilityLogSchema.statics.logChange = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging availability change:', error);
    throw error;
  }
};

// Static method to get room availability for a date
availabilityLogSchema.statics.getRoomAvailability = async function(roomId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await this.find({
      room: roomId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('booking', 'title purpose attendees')
      .populate('changedBy', 'name email')
      .sort({ 'timeSlot.startTime': 1 });

    return logs;
  } catch (error) {
    console.error('Error getting room availability:', error);
    throw error;
  }
};

const AvailabilityLog = mongoose.model('AvailabilityLog', availabilityLogSchema);

module.exports = AvailabilityLog;
