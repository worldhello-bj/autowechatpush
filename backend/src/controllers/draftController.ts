import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { 
  saveDraft, 
  getUserDrafts, 
  deleteDraft,
  getDraftById
} from '../services/draftService.js';

const logger = createLogger('draft-controller');

/**
 * Save a draft (create or update)
 * POST /api/v1/drafts
 */
export const save = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id, title, digest, content, topic } = req.body;
    
    if (!title || !content) {
      return sendError(res, 400, 'INVALID_DATA', 'Missing required fields');
    }

    const draft = await saveDraft(req.user.userId, {
      id,
      title,
      digest,
      content,
      topic
    });

    sendSuccess(res, draft, 201);
  } catch (error) {
    logger.error('Save draft failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to save draft');
  }
};

/**
 * Get user drafts
 * GET /api/v1/drafts
 */
export const list = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const drafts = getUserDrafts(req.user.userId);
    sendSuccess(res, drafts);
  } catch (error) {
    logger.error('List drafts failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to list drafts');
  }
};

/**
 * Delete a draft
 * DELETE /api/v1/drafts/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id } = req.params;
    const success = deleteDraft(id, req.user.userId);

    if (!success) {
      return sendError(res, 404, 'NOT_FOUND', 'Draft not found or access denied');
    }

    sendSuccess(res, { message: 'Draft deleted successfully' });
  } catch (error) {
    logger.error('Delete draft failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to delete draft');
  }
};

/**
 * Get draft by ID
 * GET /api/v1/drafts/:id
 */
export const get = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id } = req.params;
    const draft = getDraftById(id, req.user.userId);

    if (!draft) {
      return sendError(res, 404, 'NOT_FOUND', 'Draft not found');
    }

    sendSuccess(res, draft);
  } catch (error) {
    logger.error('Get draft failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to get draft');
  }
};
