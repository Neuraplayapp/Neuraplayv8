const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Import modular components
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { initializeDatabase, handleDatabaseRequest } = require('./services/database');
const { handleWebSocketConnections } = require('./services/websockets');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use modular routes
app.use('/api/auth', authRoutes.router);
app.use('/api', apiRoutes.router);

// Database API endpoint
app.post('/api/database', handleDatabaseRequest);

// Initialize database on startup
initializeDatabase().catch(err => {
  console.log('⚠️ Database initialization failed, using in-memory mode');
});

// WebSocket connection handling using modular service
handleWebSocketConnections(wss);

// Serve static files (AFTER all API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes for SPA (MUST BE LAST!)
app.get('*', (req, res) => {
  console.log('🔄 Catch-all route hit for:', req.path);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 WebSocket server ready on ws://localhost:${PORT}`);
  console.log(`🛡️ Security: bcrypt password hashing enabled`);
  console.log(`🗃️ Database: Knex.js query builder for SQL injection prevention`);
  console.log(`📡 Transcription: Webhook-based AssemblyAI processing`);
  console.log(`🏗️ Architecture: Modular structure with separated concerns`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
