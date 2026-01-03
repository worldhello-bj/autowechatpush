import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { 
  createFeedbackSchema,
  updateFeedbackStatusSchema,
  FeedbackStatus,
  FeedbackCategory,
} from '../types/index.js';
import {
  createFeedback,
  getFeedbackById,
  getUserFeedbacks,
  getAllFeedbacks,
  getFeedbackStats,
  updateFeedbackStatus,
  deleteFeedback,
  getUserById,
} from '../services/index.js';

const logger = createLogger('feedback');

/**
 * Submit feedback (authenticated users)
 * POST /api/v1/feedback
 */
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const parseResult = createFeedbackSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', parseResult.error.errors[0].message);
    }

    const userId = req.user?.userId;
    const userEmail = req.user?.email || '';

    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Get user's actual name from database
    const user = getUserById(userId);
    const userName = user?.name || userEmail.split('@')[0] || 'Anonymous';

    logger.info('User submitting feedback', { 
      userId,
      category: parseResult.data.category,
      title: parseResult.data.title,
      requestId: req.requestId 
    });

    const feedback = createFeedback(userId, userName, userEmail, parseResult.data);

    sendSuccess(res, feedback, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit feedback';
    logger.error('Failed to submit feedback', { error: message, requestId: req.requestId });
    
    // Return appropriate status codes based on error type
    if (message.includes('validation') || message.includes('invalid')) {
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }
    sendError(res, 500, 'SUBMIT_FEEDBACK_FAILED', message);
  }
};

/**
 * Get user's own feedbacks
 * GET /api/v1/feedback
 */
export const getMyFeedbacks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const feedbacks = getUserFeedbacks(userId, limit);

    sendSuccess(res, { feedbacks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get feedbacks';
    logger.error('Failed to get user feedbacks', { error: message, requestId: req.requestId });
    
    // Return appropriate status codes based on error type
    if (message.includes('not found')) {
      return sendError(res, 404, 'NOT_FOUND', message);
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }
    sendError(res, 500, 'GET_FEEDBACKS_FAILED', message);
  }
};

/**
 * Get feedback by ID (user can only see their own, admin can see all)
 * GET /api/v1/feedback/:id
 */
export const getFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';

    const feedback = getFeedbackById(id);

    if (!feedback) {
      return sendError(res, 404, 'FEEDBACK_NOT_FOUND', 'Feedback not found');
    }

    // Non-admin users can only see their own feedback
    if (!isAdmin && feedback.userId !== userId) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    sendSuccess(res, feedback);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get feedback';
    logger.error('Failed to get feedback', { error: message, requestId: req.requestId });
    
    // Return appropriate status codes based on error type
    if (message.includes('not found')) {
      return sendError(res, 404, 'FEEDBACK_NOT_FOUND', message);
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }
    sendError(res, 500, 'GET_FEEDBACK_FAILED', message);
  }
};

/**
 * Get all feedbacks (admin only)
 * GET /api/v1/admin/feedback
 */
export const listAllFeedbacks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as FeedbackStatus | undefined;
    const category = req.query.category as FeedbackCategory | undefined;

    logger.info('Admin listing feedbacks', { 
      adminId: req.user?.userId,
      page,
      limit,
      status,
      category,
      requestId: req.requestId 
    });

    const result = getAllFeedbacks(page, limit, status, category);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list feedbacks';
    logger.error('Failed to list feedbacks', { error: message, requestId: req.requestId });
    
    // Return appropriate status codes based on error type
    if (message.includes('validation') || message.includes('invalid')) {
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }
    sendError(res, 500, 'LIST_FEEDBACKS_FAILED', message);
  }
};

/**
 * Get feedback statistics (admin only)
 * GET /api/v1/admin/feedback/stats
 */
export const getFeedbackStatistics = async (req: Request, res: Response) => {
  try {
    const stats = getFeedbackStats();
    sendSuccess(res, stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get feedback stats';
    logger.error('Failed to get feedback stats', { error: message, requestId: req.requestId });
    sendError(res, 500, 'GET_FEEDBACK_STATS_FAILED', message);
  }
};

/**
 * Update feedback status (admin only)
 * PATCH /api/v1/admin/feedback/:id
 */
export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const parseResult = updateFeedbackStatusSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', parseResult.error.errors[0].message);
    }

    logger.info('Admin updating feedback', { 
      adminId: req.user?.userId,
      feedbackId: id,
      status: parseResult.data.status,
      hasReply: !!parseResult.data.adminReply,
      requestId: req.requestId 
    });

    const feedback = updateFeedbackStatus(id, parseResult.data.status, parseResult.data.adminReply);

    if (!feedback) {
      return sendError(res, 404, 'FEEDBACK_NOT_FOUND', 'Feedback not found');
    }

    sendSuccess(res, feedback);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update feedback';
    logger.error('Failed to update feedback', { error: message, requestId: req.requestId });
    
    // Return appropriate status codes based on error type
    if (message.includes('not found')) {
      return sendError(res, 404, 'FEEDBACK_NOT_FOUND', message);
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }
    sendError(res, 500, 'UPDATE_FEEDBACK_FAILED', message);
  }
};

/**
 * Delete feedback (admin only)
 * DELETE /api/v1/admin/feedback/:id
 */
export const removeFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info('Admin deleting feedback', { 
      adminId: req.user?.userId,
      feedbackId: id,
      requestId: req.requestId 
    });

    const success = deleteFeedback(id);

    if (!success) {
      return sendError(res, 404, 'FEEDBACK_NOT_FOUND', 'Feedback not found');
    }

    sendSuccess(res, { deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete feedback';
    logger.error('Failed to delete feedback', { error: message, requestId: req.requestId });
    
    // Return appropriate status codes based on error type
    if (message.includes('not found')) {
      return sendError(res, 404, 'FEEDBACK_NOT_FOUND', message);
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return sendError(res, 400, 'VALIDATION_ERROR', message);
    }
    sendError(res, 500, 'DELETE_FEEDBACK_FAILED', message);
  }
};
