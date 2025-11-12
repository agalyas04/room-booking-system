const analyticsService = require('../services/analyticsService');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const moment = require('moment-timezone');

/**
 * Comprehensive Analytics Service Tests
 * 
 * These tests verify:
 * - Correct utilization calculations
 * - Exclusive end time handling
 * - No double counting of overlapping bookings
 * - Proper timezone handling
 * - Cancelled booking exclusion
 * - Adjacent booking boundary handling
 */

describe('Analytics Service', () => {
  let testRoom;
  let testUser;

  beforeEach(async () => {
    // Create test room
    testRoom = await Room.create({
      name: 'Test Room',
      location: 'Building A',
      capacity: 10,
      isActive: true
    });

    // Create test user (mock)
    testUser = { _id: 'test-user-id' };
  });

  afterEach(async () => {
    // Clean up test data
    await Booking.deleteMany({});
    await Room.deleteMany({});
  });

  describe('Utilization Calculation', () => {
    test('should calculate 0% utilization when no bookings exist', async () => {
      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().endOf('day').toDate();

      const result = await analyticsService.calculateRoomUtilization(
        testRoom._id,
        startDate,
        endDate
      );

      expect(result.utilizationRate).toBe(0);
      expect(result.bookingCount).toBe(0);
      expect(result.totalBookedMinutes).toBe(0);
    });

    test('should calculate correct utilization for single booking', async () => {
      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().endOf('day').toDate();

      // Create a 2-hour booking (120 minutes)
      const bookingStart = moment.utc().startOf('day').add(9, 'hours').toDate();
      const bookingEnd = moment.utc().startOf('day').add(11, 'hours').toDate();

      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Test Booking',
        startTime: bookingStart,
        endTime: bookingEnd,
        attendees: [testUser._id],
        status: 'confirmed'
      });

      const result = await analyticsService.calculateRoomUtilization(
        testRoom._id,
        startDate,
        endDate
      );

      // 120 minutes out of 600 minutes (10 hours) = 20%
      expect(result.utilizationRate).toBe(20);
      expect(result.bookingCount).toBe(1);
      expect(result.totalBookedMinutes).toBe(120);
    });

    test('should exclude cancelled bookings from utilization', async () => {
      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().endOf('day').toDate();

      // Create confirmed booking
      const confirmedStart = moment.utc().startOf('day').add(9, 'hours').toDate();
      const confirmedEnd = moment.utc().startOf('day').add(11, 'hours').toDate();

      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Confirmed Booking',
        startTime: confirmedStart,
        endTime: confirmedEnd,
        attendees: [testUser._id],
        status: 'confirmed'
      });

      // Create cancelled booking (should be excluded)
      const cancelledStart = moment.utc().startOf('day').add(14, 'hours').toDate();
      const cancelledEnd = moment.utc().startOf('day').add(16, 'hours').toDate();

      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Cancelled Booking',
        startTime: cancelledStart,
        endTime: cancelledEnd,
        attendees: [testUser._id],
        status: 'cancelled'
      });

      const result = await analyticsService.calculateRoomUtilization(
        testRoom._id,
        startDate,
        endDate
      );

      // Only confirmed booking should count (120 minutes)
      expect(result.utilizationRate).toBe(20);
      expect(result.bookingCount).toBe(1);
      expect(result.totalBookedMinutes).toBe(120);
    });

    test('should not double count overlapping bookings', async () => {
      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().endOf('day').toDate();

      // Create two overlapping bookings
      // Booking 1: 9:00 - 11:00 (120 minutes)
      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Booking 1',
        startTime: moment.utc().startOf('day').add(9, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(11, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      // Booking 2: 10:00 - 12:00 (120 minutes, overlaps 1 hour with Booking 1)
      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Booking 2',
        startTime: moment.utc().startOf('day').add(10, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(12, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      const result = await analyticsService.calculateRoomUtilization(
        testRoom._id,
        startDate,
        endDate
      );

      // Merged time: 9:00 - 12:00 = 180 minutes (not 240)
      expect(result.totalBookedMinutes).toBe(180);
      expect(result.utilizationRate).toBe(30); // 180/600 = 30%
    });

    test('should treat end time as exclusive for adjacent bookings', async () => {
      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().endOf('day').toDate();

      // Booking 1: 9:00 - 10:00
      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Booking 1',
        startTime: moment.utc().startOf('day').add(9, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(10, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      // Booking 2: 10:00 - 11:00 (starts exactly when Booking 1 ends)
      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Booking 2',
        startTime: moment.utc().startOf('day').add(10, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(11, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      const result = await analyticsService.calculateRoomUtilization(
        testRoom._id,
        startDate,
        endDate
      );

      // Should count as 120 minutes total (not overlapping)
      expect(result.totalBookedMinutes).toBe(120);
      expect(result.utilizationRate).toBe(20);
    });
  });

  describe('Multiple Rooms', () => {
    test('should calculate utilization separately for each room', async () => {
      // Create second room
      const room2 = await Room.create({
        name: 'Test Room 2',
        location: 'Building B',
        capacity: 8,
        isActive: true
      });

      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().endOf('day').toDate();

      // Room 1: 2-hour booking
      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Room 1 Booking',
        startTime: moment.utc().startOf('day').add(9, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(11, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      // Room 2: 4-hour booking
      await Booking.create({
        room: room2._id,
        bookedBy: testUser._id,
        title: 'Room 2 Booking',
        startTime: moment.utc().startOf('day').add(9, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(13, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      const result1 = await analyticsService.calculateRoomUtilization(
        testRoom._id,
        startDate,
        endDate
      );

      const result2 = await analyticsService.calculateRoomUtilization(
        room2._id,
        startDate,
        endDate
      );

      expect(result1.utilizationRate).toBe(20); // 120/600
      expect(result2.utilizationRate).toBe(40); // 240/600
    });
  });

  describe('Cross-day Bookings', () => {
    test('should handle bookings that span multiple days', async () => {
      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().startOf('day').add(1, 'day').endOf('day').toDate();

      // Booking that spans two days: Today 20:00 - Tomorrow 02:00
      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Overnight Booking',
        startTime: moment.utc().startOf('day').add(20, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(1, 'day').add(2, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      const result = await analyticsService.calculateRoomUtilization(
        testRoom._id,
        startDate,
        endDate
      );

      // 6 hours = 360 minutes over 2 days (1200 minutes available)
      expect(result.totalBookedMinutes).toBe(360);
      expect(result.utilizationRate).toBe(30); // 360/1200
    });
  });

  describe('Timezone Handling', () => {
    test('should normalize dates to UTC for consistent comparisons', async () => {
      // Test that dates are normalized to UTC start/end of day
      const range = 'week';
      const { start, end } = analyticsService.getDateRange(range);

      // Verify dates are UTC
      expect(start.getUTCHours()).toBe(0);
      expect(start.getUTCMinutes()).toBe(0);
      expect(start.getUTCSeconds()).toBe(0);

      expect(end.getUTCHours()).toBe(23);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
    });
  });

  describe('Interval Merging', () => {
    test('should merge overlapping intervals correctly', () => {
      const intervals = [
        { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
        { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T12:00:00Z') },
        { start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T16:00:00Z') }
      ];

      const merged = analyticsService.mergeIntervals(intervals);

      expect(merged).toHaveLength(2);
      expect(merged[0].start).toEqual(new Date('2024-01-01T09:00:00Z'));
      expect(merged[0].end).toEqual(new Date('2024-01-01T12:00:00Z'));
      expect(merged[1].start).toEqual(new Date('2024-01-01T14:00:00Z'));
      expect(merged[1].end).toEqual(new Date('2024-01-01T16:00:00Z'));
    });

    test('should not merge adjacent intervals (exclusive end time)', () => {
      const intervals = [
        { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T10:00:00Z') },
        { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }
      ];

      const merged = analyticsService.mergeIntervals(intervals);

      // Should remain as 2 separate intervals (end time is exclusive)
      expect(merged).toHaveLength(2);
    });
  });

  describe('Comprehensive Analytics', () => {
    test('should return consistent data across all metrics', async () => {
      const startDate = moment.utc().startOf('day').toDate();
      const endDate = moment.utc().endOf('day').toDate();

      // Create multiple bookings
      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Booking 1',
        startTime: moment.utc().startOf('day').add(9, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(11, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      await Booking.create({
        room: testRoom._id,
        bookedBy: testUser._id,
        title: 'Booking 2',
        startTime: moment.utc().startOf('day').add(14, 'hours').toDate(),
        endTime: moment.utc().startOf('day').add(16, 'hours').toDate(),
        attendees: [testUser._id],
        status: 'confirmed'
      });

      const analytics = await analyticsService.getComprehensiveAnalytics(
        'week',
        startDate,
        endDate
      );

      // Verify all metrics are present and consistent
      expect(analytics.totalRooms).toBeGreaterThan(0);
      expect(analytics.totalBookings).toBe(2);
      expect(analytics.roomUtilization).toHaveLength(analytics.totalRooms);
      expect(analytics.weeklyUtilization).toHaveLength(7);
      expect(analytics.popularTimeSlots).toBeDefined();
      expect(analytics.bookingFrequency).toHaveLength(2);
    });
  });
});

module.exports = {};
