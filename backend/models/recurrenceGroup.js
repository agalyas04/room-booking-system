// models/RecurrenceGroup.js - Recurrence group model for managing recurring bookings
const mongoose = require('mongoose');

const recurrenceGroupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  attendees: {
    type: Number,
    required: true,
    min: 1
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  recurrencePattern: {
    type: String,
    enum: ['weekly', 'daily', 'monthly'],
    default: 'weekly'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  occurrences: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
recurrenceGroupSchema.index({ user: 1, status: 1 });
recurrenceGroupSchema.index({ room: 1, startTime: 1 });

const RecurrenceGroup = mongoose.model('RecurrenceGroup', recurrenceGroupSchema);

module.exports = RecurrenceGroup;
