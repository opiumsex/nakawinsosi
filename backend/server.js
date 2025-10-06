const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const path = require('path');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs for auth
  message: 'Too many login attempts, please try again later.'
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/wheel', require('./routes/wheel'));
app.use('/api/inventory', require('./routes/inventory'));

// Admin route for managing content
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Nakawin Casino backend started successfully');
});