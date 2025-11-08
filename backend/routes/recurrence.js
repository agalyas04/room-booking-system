// routes/recurrence.js - Recurrence management routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  cancelAllOccurrences,
  cancelSingleOccurrence,
  updateAllOccurrences,
  getRecurrenceGroupBookings
} = require('../controller/recurrenceController');

// GET /api/recurrence/:recurrenceGroupId - Get all bookings in a recurrence group
router.get('/:recurrenceGroupId', auth, getRecurrenceGroupBookings);

// DELETE /api/recurrence/:recurrenceGroupId/all - Cancel all occurrences
router.delete('/:recurrenceGroupId/all', auth, cancelAllOccurrences);

// DELETE /api/recurrence/single/:bookingId - Cancel single occurrence
router.delete('/single/:bookingId', auth, cancelSingleOccurrence);

// PUT /api/recurrence/:recurrenceGroupId/all - Update all occurrences
router.put('/:recurrenceGroupId/all', auth, updateAllOccurrences);

module.exports = router;
