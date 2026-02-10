import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { 
  createTemplate, 
  getUserTemplates, 
  deleteTemplate,
  getTemplateById,
  updateTemplate,
  applyTemplateToContent,
  flushPersist
} from '../services/templateService.js';

const logger = createLogger('template-controller');

/**
 * Create a new template
 * POST /api/v1/templates
 */
export const create = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { name, originalHtml, textRegions, svgBlocks, preview, sourceUrl, statistics } = req.body;
    
    if (!name || !originalHtml || !textRegions) {
      return sendError(res, 400, 'INVALID_DATA', 'Missing required fields');
    }

    const template = await createTemplate(req.user.userId, {
      name,
      originalHtml,
      textRegions,
      svgBlocks,
      preview,
      sourceUrl,
      statistics
    });

    // Ensure template is persisted to disk before responding
    await flushPersist();

    sendSuccess(res, template, 201);
  } catch (error) {
    logger.error('Create template failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to create template');
  }
};

/**
 * Get user templates
 * GET /api/v1/templates
 */
export const list = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const templates = getUserTemplates(req.user.userId);
    sendSuccess(res, templates);
  } catch (error) {
    logger.error('List templates failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to list templates');
  }
};

/**
 * Delete a template
 * DELETE /api/v1/templates/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id } = req.params;
    const success = deleteTemplate(id, req.user.userId);

    if (!success) {
      return sendError(res, 404, 'NOT_FOUND', 'Template not found or access denied');
    }

    // Ensure deletion is persisted to disk before responding
    await flushPersist();

    sendSuccess(res, { message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Delete template failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to delete template');
  }
};

/**
 * Get template by ID
 * GET /api/v1/templates/:id
 */
export const get = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id } = req.params;
    const template = getTemplateById(id, req.user.userId);

    if (!template) {
      return sendError(res, 404, 'NOT_FOUND', 'Template not found');
    }

    sendSuccess(res, template);
  } catch (error) {
    logger.error('Get template failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to get template');
  }
};

/**
 * Update template
 * PUT /api/v1/templates/:id
 */
export const update = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id } = req.params;
    const { name, preview } = req.body;
    
    const template = updateTemplate(id, req.user.userId, { name, preview });

    if (!template) {
      return sendError(res, 404, 'NOT_FOUND', 'Template not found or access denied');
    }

    // Ensure update is persisted to disk before responding
    await flushPersist();

    sendSuccess(res, template);
  } catch (error) {
    logger.error('Update template failed', { error, requestId: req.requestId });
    sendError(res, 500, 'SERVER_ERROR', 'Failed to update template');
  }
};

/**
 * Apply system template to content
 * POST /api/v1/templates/apply
 */
export const apply = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { contentHtml, templateId } = req.body;

    if (!contentHtml || !templateId) {
      return sendError(res, 400, 'INVALID_DATA', 'Missing required fields');
    }

    const formattedHtml = await applyTemplateToContent(contentHtml, templateId);
    
    sendSuccess(res, { html: formattedHtml });
  } catch (error: any) {
    logger.error('Apply template failed', { error, requestId: req.requestId });
    
    if (error.message && error.message.includes('Template not found')) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    
    sendError(res, 500, 'SERVER_ERROR', 'Failed to apply template');
  }
};
