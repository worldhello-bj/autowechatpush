import { Router } from 'express';
import { healthCheck, liveness, readiness } from '../controllers/index.js';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', healthCheck);

/**
 * @route GET /api/v1/health/live
 * @desc Liveness probe for Kubernetes/Docker
 * @access Public
 */
router.get('/live', liveness);

/**
 * @route GET /api/v1/health/ready
 * @desc Readiness probe for Kubernetes/Docker
 * @access Public
 */
router.get('/ready', readiness);

export default router;
