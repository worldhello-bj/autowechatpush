import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { requestIdMiddleware, logger } from './utils/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import { seedAdminUser, seedTestUser, initQuotaStore, initUserStore } from './services/index.js';

// Create Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

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

// 404 handler
app.use(notFoundHandler);

// Global error handler
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
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
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
