/**
 * Main Server Entry Point
 * This file sets up the Express server, Socket.IO, and MySQL connection
 * It also registers all routes and socket handlers
 */

// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
require('./models'); // Initialize Sequelize models and associations

// Import route handlers
const authRoutes = require('./routes/auth');           // Authentication routes (signup, login)
const chatRoutes = require('./routes/chat');           // Chat message routes
const userRoutes = require('./routes/user');           // User management routes
const mediaRoutes = require('./routes/media');         // Media upload routes (AWS S3)
const aiRoutes = require('./routes/ai');               // AI suggestion routes (Gemini)
const groupRoutes = require('./routes/group');         // Group chat routes

// Import Socket.IO middleware and handlers
const socketAuth = require('./socket/middleware');     // Socket authentication middleware
const chatHandler = require('./socket/handlers/chat'); // General chat handler
const personalChatHandler = require('./socket/handlers/personalChat'); // Personal chat handler
const groupChatHandler = require('./socket/handlers/groupChat');        // Group chat handler

// Initialize archive messages cron job
// This runs daily at 2 AM to move old messages to ArchivedChat collection
require('./utils/archiveMessages');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
// This allows the frontend to connect to the WebSocket server
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"]
  }
});

// ==================== MIDDLEWARE ====================
// Enable CORS for all routes (allows frontend to make API calls)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ==================== API ROUTES ====================
// Mount route handlers at specific paths
app.use('/api/auth', authRoutes);      // Authentication endpoints
app.use('/api/chat', chatRoutes);      // Chat message endpoints
app.use('/api/user', userRoutes);      // User endpoints
app.use('/api/media', mediaRoutes);    // Media upload endpoints
app.use('/api/ai', aiRoutes);          // AI suggestion endpoints
app.use('/api/group', groupRoutes);    // Group chat endpoints

// ==================== SOCKET.IO SETUP ====================
// Apply authentication middleware to all socket connections
// This verifies the JWT token before allowing connection
io.use(socketAuth);

// Handle new socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Register all socket event handlers
  // These handle different types of chat events
  chatHandler(io, socket);              // General chat events
  personalChatHandler(io, socket);      // Personal (1-on-1) chat events
  groupChatHandler(io, socket);         // Group chat events

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// ==================== DATABASE CONNECTION ====================
// Sequelize connection and models are initialized in ./models/index.js
// The database connection is ready to use

// ==================== START SERVER ====================
// Start the server on the specified port (default: 5000)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
