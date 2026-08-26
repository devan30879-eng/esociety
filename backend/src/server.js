require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ============================================================
// DATABASE
// ============================================================
connectDB();

// ============================================================
// EXPRESS + HTTP SERVER
// ============================================================
const app = express();
const server = http.createServer(app);

// ============================================================
// SOCKET.IO
// ============================================================
const io = new Server(server, {
  cors: {
    // In production frontend is served by this same server.
    // During development Vite normally runs on port 5173.
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ============================================================
// SOCKET.IO CONNECTION HANDLER
// ============================================================
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ----------------------------------------------------------
  // User-specific room
  // ----------------------------------------------------------
  socket.on('join_user_room', (userId) => {
    if (!userId) return;

    socket.join(`user_${userId}`);

    console.log(`👤 User ${userId} joined room: user_${userId}`);
  });

  // ----------------------------------------------------------
  // Role-specific room
  // ----------------------------------------------------------
  socket.on('join_role_room', (role) => {
    if (!role) return;

    socket.join(`role_${role}`);

    console.log(`🏷️ Socket joined room: role_${role}`);
  });

  // ----------------------------------------------------------
  // Disconnect
  // ----------------------------------------------------------
  socket.on('disconnect', (reason) => {
    console.log(`🔴 Socket disconnected: ${socket.id} (${reason})`);
  });
});

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// JSON body
app.use(express.json({ limit: '10mb' }));

// URL encoded body
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use(morgan('dev'));

// ============================================================
// INJECT SOCKET.IO INTO REQUEST
// ============================================================
// Controllers can access Socket.IO using:
//
// req.io.emit(...)
//
// or
//
// req.io.to(...).emit(...)
//
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/users', require('./routes/userRoutes'));

app.use('/api/visitors', require('./routes/visitorRoutes'));

app.use('/api/complaints', require('./routes/complaintRoutes'));

app.use('/api/facilities', require('./routes/facilityRoutes'));

app.use('/api/payments', require('./routes/paymentRoutes'));

app.use('/api/notices', require('./routes/noticeRoutes'));

app.use('/api/emergency', require('./routes/emergencyRoutes'));

app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'eSociety API is running 🚀',
    timestamp: new Date(),
  });
});

// ============================================================
// SERVE FRONTEND
// ============================================================
//
// Project structure:
//
// eSociety/
// ├── backend/
// │   └── server.js
// │
// └── frontend/
//     └── dist/
//         └── index.html
//
// Since server.js is inside /backend:
//
// __dirname = /eSociety/backend
//
// ../frontend/dist = /eSociety/frontend/dist
//
const frontendPath = path.join(__dirname, '../../frontend/dist');

console.log(`📁 Frontend path: ${frontendPath}`);

// Serve static files:
// /assets/*.js
// /assets/*.css
// /favicon.ico
// etc.
app.use(express.static(frontendPath));

// ============================================================
// FRONTEND SPA FALLBACK
// ============================================================
//
// IMPORTANT:
//
// This must come AFTER all /api routes.
//
// Example:
//
// GET /
// GET /login
// GET /dashboard
// GET /complaints
// GET /profile
//
// React Router handles these routes on the client.
//
// Express returns index.html and React Router takes over.
//
app.get('*', (req, res, next) => {
  // Never return index.html for API requests.
  if (req.originalUrl.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================================
// 404 HANDLER
// ============================================================
//
// At this point:
//
// - API route didn't exist
// - Frontend fallback didn't handle it
//
// Return JSON 404.
//
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log('🚀 eSociety Server Started');
  console.log('==========================================');
  console.log(`🌐 Application : http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO   : Ready`);
  console.log(`❤️  Health     : http://localhost:${PORT}/api/health`);
  console.log(`📁 Frontend    : ${frontendPath}`);
  console.log(`🌍 Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log('==========================================');
  console.log('');
});

// ============================================================
// UNHANDLED PROMISE REJECTION
// ============================================================

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:');
  console.error(err);

  server.close(() => {
    process.exit(1);
  });
});

// ============================================================
// UNCAUGHT EXCEPTION
// ============================================================

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:');
  console.error(err);

  server.close(() => {
    process.exit(1);
  });
});