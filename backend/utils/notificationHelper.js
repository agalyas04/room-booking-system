// utils/notificationHelper.js - Helper functions for notifications
const Notification = require('../models/notification');

// Create notification for booking created
const createBookingNotification = async (userId, bookingId, roomName, startTime) => {
  try {
    const message = `Your booking for ${roomName} on ${new Date(startTime).toLocaleString()} has been confirmed.`;
    
    await Notification.create({
      user: userId,
      booking: bookingId,
      type: 'booking_created',
      message
    });
  } catch (error) {
    console.error('Error creating booking notification:', error);
  }
};

// Create notification for booking cancelled
const createCancellationNotification = async (userId, bookingId, roomName, startTime) => {
  try {
    const message = `Your booking for ${roomName} on ${new Date(startTime).toLocaleString()} has been cancelled.`;
    
    await Notification.create({
      user: userId,
      booking: bookingId,
      type: 'booking_cancelled',
      message
    });
  } catch (error) {
    console.error('Error creating cancellation notification:', error);
  }
};

// Create notification for booking updated
const createUpdateNotification = async (userId, bookingId, roomName, startTime) => {
  try {
    const message = `Your booking for ${roomName} on ${new Date(startTime).toLocaleString()} has been updated.`;
    
    await Notification.create({
      user: userId,
      booking: bookingId,
      type: 'booking_updated',
      message
    });
  } catch (error) {
    console.error('Error creating update notification:', error);
  }
};

// Create notification for admin override
const createAdminOverrideNotification = async (userId, bookingId, roomName, startTime, action) => {
  try {
    const message = `Admin has ${action} your booking for ${roomName} on ${new Date(startTime).toLocaleString()}.`;
    
    await Notification.create({
      user: userId,
      booking: bookingId,
      type: 'admin_override',
      message
    });
  } catch (error) {
    console.error('Error creating admin override notification:', error);
  }
};

module.exports = {
  createBookingNotification,
  createCancellationNotification,
  createUpdateNotification,
  createAdminOverrideNotification
};
