import express from 'express';
import cors from 'cors';
import { config } from './config';
import analysisRoutes from './api/routes/analysis';
import filesRoutes from './api/routes/files';
import userRoutes from './api/routes/user';
import { errorHandler } from './api/middleware/errorHandler';
import Debug from 'debug';

const debug = Debug('periospot:server');
const app = express();

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  debug('Uncaught Exception:', error);
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  debug('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('💥 Unhandled Rejection:', reason);
});

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With', 'X-User-Id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware with detailed information
app.use((req, res, next) => {
  debug(`📥 ${req.method} ${req.path}`, {
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Enhanced response logging
  const originalSend = res.send;
  res.send = function(body) {
    debug(`📤 Response ${res.statusCode}`, {
      body,
      headers: res.getHeaders(),
      timestamp: new Date().toISOString()
    });
    return originalSend.call(this, body);
  };

  next();
});

// Health check endpoint with detailed information
app.get('/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    version: process.version,
    cors: {
      enabled: true,
      origin: req.headers.origin || 'unknown'
    }
  };
  
  debug('Health check requested:', healthInfo);
  res.json(healthInfo);
});

// Test endpoint
app.get('/test', (req, res) => {
  const testInfo = {
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    method: req.method,
    path: req.path
  };
  
  debug('Test endpoint requested:', testInfo);
  res.json(testInfo);
});

// Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/user', userRoutes);

// Error handling must be last
app.use(errorHandler);

// Start server with enhanced error handling
const server = app.listen(config.port, () => {
  console.log(`
🚀 Server is running!
📡 Port: ${config.port}
🔧 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}
  `);
}).on('error', (error) => {
  debug('Server startup error:', error);
  console.error('💥 Server startup error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  debug('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    debug('Server closed');
    process.exit(0);
  });
}); 