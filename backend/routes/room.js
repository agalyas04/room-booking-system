// routes/room.js - Room routes
const express = require('express');
const router = express.Router();
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controller/room');

// GET /api/rooms - Get all rooms
router.get('/', getAllRooms);

// GET /api/rooms/:id - Get single room
router.get('/:id', getRoomById);

// POST /api/rooms - Create new room
router.post('/', createRoom);

// PUT /api/rooms/:id - Update room
router.put('/:id', updateRoom);

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', deleteRoom);

module.exports = router;

