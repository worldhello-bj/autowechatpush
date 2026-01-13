import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { requestIdMiddleware, logger } from './utils/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import { seedAdminUser, seedTestUser, initQuotaStore, initUserStore } from './services/index.js';

// Create Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware with CSP configuration for frontend
// Note: 'unsafe-inline' and 'unsafe-eval' are required for Tailwind CDN runtime.
// For production, consider using build-time Tailwind compilation instead.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://aistudiocdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://aistudiocdn.com", "https://cdn.tailwindcss.com"],
      connectSrc: ["'self'", "https://api.weixin.qq.com", "https://api.ipify.org"],
    },
  },
}));

// CORS configuration
const corsOrigins = config.CORS_ORIGINS.split(',').map(origin => origin.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request ID middleware (for tracing)
app.use(requestIdMiddleware);

// Body parsing
// Limit set to 70mb to accommodate base64-encoded files (video max is 50MB, base64 adds ~33% overhead)
app.use(express.json({ limit: '70mb' }));
app.use(express.urlencoded({ extended: true, limit: '70mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
    });
  });
  next();
});

// API routes
app.use('/api/v1', routes);

// API 404 handler - for unmatched /api/* routes
app.use('/api', notFoundHandler);

// Static file serving for frontend (web folder)
// The web folder contains the built frontend files.
// In production (Docker), this typically resolves to /app/dist/web.
// In development (ts-node / tsx), this usually resolves to <project-root>/web.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webPath = path.join(__dirname, '..', 'web');
const indexPath = path.join(webPath, 'index.html');

// Log the resolved webPath to help diagnose environment-specific path issues
logger.info('Resolved webPath for static assets', {
  webPath,
  dirname: __dirname,
  nodeEnv: process.env.NODE_ENV,
});

// Check if web folder exists and has index.html
let hasFrontend = false;
try {
  fs.accessSync(indexPath, fs.constants.F_OK);
  hasFrontend = true;
} catch (error) {
  logger.warn('Static frontend index.html not found or inaccessible', {
    indexPath,
    error: error instanceof Error ? error.message : String(error),
  });
}

if (hasFrontend) {
  // Serve static files from web folder
  app.use(express.static(webPath));
  
  // SPA fallback - serve index.html for any non-API GET requests
  app.get(/^(?!\/api\/).*$/, (req, res, next) => {
    res.sendFile(indexPath, (err) => {
      if (err) {
        next(err);
      }
    });
  });
  
  logger.info('📁 Static file serving enabled from web/ folder');
} else {
  // No frontend files, show info message for root path
  app.get('/', (req, res) => {
    res.json({
      message: 'WeChat AI Publisher API',
      version: '1.0.0',
      api: '/api/v1',
      health: '/api/v1/health',
      docs: 'See README.md for API documentation',
      frontend: 'Place built frontend files in the web/ folder to enable web access',
    });
  });
}

// Global error handler (must be last)
app.use(errorHandler);

// Initialize server
const startServer = async () => {
  // Load persisted data
  await initQuotaStore();
  await initUserStore();

  // Seed admin user on startup
  try {
    await seedAdminUser();
    logger.info('✅ Admin user initialization complete');
  } catch (error) {
    logger.error('Failed to seed admin user', { error });
  }

  // Seed test user on startup (only in non-production environments)
  if (config.NODE_ENV !== 'production') {
    try {
      await seedTestUser();
      logger.info('✅ Test user initialization complete (username: test, password: 123456)');
    } catch (error) {
      logger.error('Failed to seed test user', { error });
    }
  }

  // Start server
  const PORT = config.PORT;
  const HOST = '127.0.0.1'; // Bind to localhost only for security
  app.listen(PORT, HOST, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`🔒 Security: Bound to ${HOST} (not accessible from public internet)`);
    logger.info(`📊 Environment: ${config.NODE_ENV}`);
    logger.info(`🔗 API Base: http://localhost:${PORT}/api/v1`);
    logger.info(`👤 Admin: ${config.ADMIN_EMAIL}`);
    if (config.NODE_ENV !== 'production') {
      logger.info(`🧪 Test Account: test / 123456`);
    }
    logger.info('');
    logger.info('Available endpoints:');
    logger.info('  GET  /api/v1/health        - Health check');
    logger.info('  POST /api/v1/auth/register - Register user');
    logger.info('  POST /api/v1/auth/token    - Login');
    logger.info('  POST /api/v1/auth/refresh  - Refresh token');
    logger.info('  GET  /api/v1/auth/me       - Current user');
    logger.info('  POST /api/v1/ai/generate   - Generate article');
    logger.info('  POST /api/v1/ai/chat/stream - SSE streaming');
    logger.info('  GET  /api/v1/ai/quota      - Get quota');
    logger.info('  POST /api/v1/materials     - Upload material');
    logger.info('  GET  /api/v1/materials     - List materials');
    logger.info('  GET  /api/v1/user/quota    - Get user quota status');
    logger.info('  GET  /api/v1/user/quota/history - Usage history');
    logger.info('');
    logger.info('Admin endpoints (require admin role):');
    logger.info('  GET  /api/v1/admin/stats   - Dashboard stats');
    logger.info('  GET  /api/v1/admin/users   - List users');
    logger.info('  POST /api/v1/admin/users   - Create user');
    logger.info('  PATCH /api/v1/admin/users/:id/role - Change role');
    logger.info('  PATCH /api/v1/admin/users/:id/quota - Update quota');
    logger.info('  DELETE /api/v1/admin/users/:id - Delete user');
  });
};

startServer();

export default app;
