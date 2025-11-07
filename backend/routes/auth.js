// routes/auth.js - Authentication routes
const express = require('express');
const router = express.Router();
const { register, login } = require('../controller/authController');

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

module.exports = router;

