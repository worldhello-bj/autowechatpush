import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { HealthCheckResponse } from '../types/index.js';

const logger = createLogger('health');
const startTime = Date.now();

/**
 * Health check endpoint
 * GET /api/v1/health
 */
export const healthCheck = async (req: Request, res: Response) => {
  logger.debug('Health check requested', { requestId: req.requestId });
  
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  // Check service health (expand as needed)
  const services = [
    {
      name: 'api',
      status: 'up' as const,
      latency: 0,
    },
    // Add more service checks here (database, redis, etc.)
  ];
  
  const allServicesUp = services.every(s => s.status === 'up');
  
  const response: HealthCheckResponse = {
    status: allServicesUp ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    timestamp: new Date().toISOString(),
    services,
  };
  
  sendSuccess(res, response);
};

/**
 * Liveness probe for Kubernetes/Docker
 * GET /api/v1/health/live
 */
export const liveness = (req: Request, res: Response) => {
  sendSuccess(res, { status: 'alive' });
};

/**
 * Readiness probe for Kubernetes/Docker
 * GET /api/v1/health/ready
 */
export const readiness = async (req: Request, res: Response) => {
  // Check if all required services are ready
  // For now, just check if the server is running
  const ready = true;
  
  if (ready) {
    sendSuccess(res, { status: 'ready' });
  } else {
    sendError(res, 503, 'NOT_READY', 'Service is not ready');
  }
};
