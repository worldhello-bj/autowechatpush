import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import {
  trackEvent,
  getAnalyticsSummary,
  getUserActivitySummary,
  getUserEvents,
  getEvents,
  getUserSegmentation,
  getTimeAnalytics,
  getUserBehaviorPatterns,
  getEventTimeDistribution,
} from '../services/index.js';
import { EventType } from '../types/index.js';

const logger = createLogger('analytics');

/**
 * Track a user event
 * POST /api/v1/analytics/event
 */
export const recordEvent = async (req: Request, res: Response) => {
  try {
    const { eventType, eventData } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
    }

    if (!eventType) {
      return sendError(res, 400, 'INVALID_REQUEST', 'Missing eventType');
    }

    // Get user agent and IP from request
    const userAgent = req.headers['user-agent'];
    // Use the leftmost IP in x-forwarded-for (client's real IP in trusted proxy setups)
    // Note: This can be spoofed - use with caution and validate if needed
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || req.socket.remoteAddress;

    const event = trackEvent(
      userId,
      eventType as EventType,
      eventData,
      userAgent,
      ipAddress
    );

    logger.debug('Event recorded', {
      userId,
      eventType,
      eventId: event.id,
      requestId: req.requestId,
    });

    sendSuccess(res, { event }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record event';
    logger.error('Failed to record event', { error: message, requestId: req.requestId });
    sendError(res, 500, 'RECORD_EVENT_FAILED', message);
  }
};

/**
 * Get analytics summary (admin only)
 * GET /api/v1/admin/analytics
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    logger.info('Admin fetching analytics summary', {
      adminId: req.user?.userId,
      requestId: req.requestId,
    });

    const summary = getAnalyticsSummary();
    sendSuccess(res, summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get analytics';
    logger.error('Failed to get analytics', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_ANALYTICS_FAILED', message);
  }
};

/**
 * Get user activity summary (admin only)
 * GET /api/v1/admin/analytics/users/:userId
 */
export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('Admin fetching user analytics', {
      adminId: req.user?.userId,
      targetUserId: userId,
      requestId: req.requestId,
    });

    const summary = getUserActivitySummary(userId);
    
    if (!summary) {
      return sendError(res, 404, 'NO_DATA', 'No activity data found for this user');
    }

    sendSuccess(res, summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user analytics';
    logger.error('Failed to get user analytics', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_USER_ANALYTICS_FAILED', message);
  }
};

/**
 * Get user events (admin only)
 * GET /api/v1/admin/analytics/users/:userId/events
 */
export const getUserEventHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    logger.info('Admin fetching user events', {
      adminId: req.user?.userId,
      targetUserId: userId,
      limit,
      requestId: req.requestId,
    });

    const events = getUserEvents(userId, limit);
    sendSuccess(res, { events, count: events.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user events';
    logger.error('Failed to get user events', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_USER_EVENTS_FAILED', message);
  }
};

/**
 * Get all events with pagination (admin only)
 * GET /api/v1/admin/analytics/events
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    logger.info('Admin fetching all events', {
      adminId: req.user?.userId,
      page,
      limit,
      requestId: req.requestId,
    });

    const result = getEvents(page, limit);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get events';
    logger.error('Failed to get events', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_EVENTS_FAILED', message);
  }
};

/**
 * Get user segmentation data (admin only)
 * GET /api/v1/admin/analytics/segmentation
 */
export const getUserSegmentationData = async (req: Request, res: Response) => {
  try {
    logger.info('Admin fetching user segmentation', {
      adminId: req.user?.userId,
      requestId: req.requestId,
    });

    const segmentation = getUserSegmentation();
    sendSuccess(res, segmentation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user segmentation';
    logger.error('Failed to get user segmentation', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_SEGMENTATION_FAILED', message);
  }
};

/**
 * Get time-based analytics data (admin only)
 * GET /api/v1/admin/analytics/time
 */
export const getTimeAnalyticsData = async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);

    logger.info('Admin fetching time analytics', {
      adminId: req.user?.userId,
      days,
      requestId: req.requestId,
    });

    const timeData = getTimeAnalytics(days);
    sendSuccess(res, timeData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get time analytics';
    logger.error('Failed to get time analytics', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_TIME_ANALYTICS_FAILED', message);
  }
};

/**
 * Get user behavior patterns (admin only)
 * GET /api/v1/admin/analytics/behavior
 */
export const getUserBehaviorData = async (req: Request, res: Response) => {
  try {
    logger.info('Admin fetching user behavior patterns', {
      adminId: req.user?.userId,
      requestId: req.requestId,
    });

    const behaviorData = getUserBehaviorPatterns();
    sendSuccess(res, behaviorData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user behavior patterns';
    logger.error('Failed to get user behavior patterns', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_BEHAVIOR_FAILED', message);
  }
};

/**
 * Get event time distribution analysis (admin only)
 * GET /api/v1/admin/analytics/timedistribution
 */
export const getEventTimeDistributionData = async (req: Request, res: Response) => {
  try {
    logger.info('Admin fetching event time distribution', {
      adminId: req.user?.userId,
      requestId: req.requestId,
    });

    const timeDistribution = getEventTimeDistribution();
    sendSuccess(res, timeDistribution);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get event time distribution';
    logger.error('Failed to get event time distribution', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_TIME_DISTRIBUTION_FAILED', message);
  }
};
