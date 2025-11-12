const analyticsService = require('../services/analyticsService');

/**
 * Server-Sent Events (SSE) Controller for Real-time Analytics
 * 
 * This controller provides real-time analytics updates using SSE.
 * When bookings are created, updated, or cancelled, the analytics
 * are recalculated and pushed to connected clients.
 */

// Store active SSE connections
const clients = new Set();

/**
 * @desc    Stream analytics updates via SSE
 * @route   GET /api/analytics/stream
 * @access  Private/Admin
 */
exports.streamAnalytics = async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Extract query parameters
  const { range = 'week', startDate, endDate } = req.query;

  // Create client object
  const client = {
    id: Date.now(),
    res,
    range,
    startDate,
    endDate
  };

  // Add client to set
  clients.add(client);

  // Send initial data
  try {
    const analyticsData = await analyticsService.getComprehensiveAnalytics(
      range,
      startDate,
      endDate
    );

    res.write(`data: ${JSON.stringify({
      type: 'initial',
      data: analyticsData,
      timestamp: new Date().toISOString()
    })}\n\n`);
  } catch (error) {
    console.error('Error sending initial analytics:', error);
  }

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(client);
    console.log(`Client ${client.id} disconnected. Active clients: ${clients.size}`);
  });

  console.log(`Client ${client.id} connected. Active clients: ${clients.size}`);
};

/**
 * Broadcast analytics update to all connected clients
 * This should be called when bookings are created, updated, or cancelled
 */
exports.broadcastAnalyticsUpdate = async () => {
  if (clients.size === 0) {
    return; // No clients connected
  }

  console.log(`Broadcasting analytics update to ${clients.size} clients`);

  // Group clients by their filter parameters
  const clientGroups = new Map();

  for (const client of clients) {
    const key = `${client.range}-${client.startDate}-${client.endDate}`;
    if (!clientGroups.has(key)) {
      clientGroups.set(key, []);
    }
    clientGroups.get(key).push(client);
  }

  // Calculate analytics for each unique filter set
  for (const [key, groupClients] of clientGroups) {
    try {
      const { range, startDate, endDate } = groupClients[0];
      const analyticsData = await analyticsService.getComprehensiveAnalytics(
        range,
        startDate,
        endDate
      );

      // Send to all clients in this group
      for (const client of groupClients) {
        try {
          client.res.write(`data: ${JSON.stringify({
            type: 'update',
            data: analyticsData,
            timestamp: new Date().toISOString()
          })}\n\n`);
        } catch (error) {
          console.error(`Error sending to client ${client.id}:`, error);
          clients.delete(client);
        }
      }
    } catch (error) {
      console.error(`Error calculating analytics for group ${key}:`, error);
    }
  }
};

/**
 * Debounced broadcast to avoid flooding clients with updates
 */
let broadcastTimeout = null;
exports.debouncedBroadcast = () => {
  if (broadcastTimeout) {
    clearTimeout(broadcastTimeout);
  }

  broadcastTimeout = setTimeout(() => {
    exports.broadcastAnalyticsUpdate();
    broadcastTimeout = null;
  }, 1000); // Wait 1 second before broadcasting
};

module.exports = exports;
