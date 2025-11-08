// models/recurrenceGroup.js - Recurrence Group model
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
    enum: ['weekly'],
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
    max: 52 // Maximum 52 weeks (1 year)
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

const RecurrenceGroup = mongoose.model('RecurrenceGroup', recurrenceGroupSchema);

module.exports = RecurrenceGroup;
