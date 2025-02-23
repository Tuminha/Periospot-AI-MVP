"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const analysis_1 = __importDefault(require("./api/routes/analysis"));
const files_1 = __importDefault(require("./api/routes/files"));
const user_1 = __importDefault(require("./api/routes/user"));
const errorHandler_1 = require("./api/middleware/errorHandler");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('periospot:server');
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With', 'X-User-Id'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
}));
// Body parsing middleware with increased limits
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
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
    res.send = function (body) {
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
app.use('/api/analysis', analysis_1.default);
app.use('/api/files', files_1.default);
app.use('/api/user', user_1.default);
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server with enhanced error handling
const server = app.listen(config_1.config.port, () => {
    console.log(`
🚀 Server is running!
📡 Port: ${config_1.config.port}
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
