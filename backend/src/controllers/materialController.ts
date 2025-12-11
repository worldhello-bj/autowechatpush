import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { 
  processUpload, 
  getMaterialById, 
  listUserMaterials, 
  deleteMaterial,
  getPresignedUploadUrl 
} from '../services/index.js';
import { MaterialType, listMaterialsSchema } from '../types/index.js';

const logger = createLogger('material');

/**
 * Upload a material
 * POST /api/v1/materials
 */
export const uploadMaterial = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    // Check if we have file data in the request
    // For multipart, the file would be in req.file (from multer)
    // For base64, it would be in req.body
    const { data, filename, mimeType, type } = req.body;

    if (!data || !filename || !mimeType) {
      return sendError(
        res, 
        400, 
        'INVALID_REQUEST', 
        'Missing required fields: data, filename, mimeType'
      );
    }

    // Decode base64 data with error handling
    let buffer: Buffer;
    try {
      buffer = Buffer.from(data, 'base64');
      // Validate that we got valid data (empty buffer from invalid base64)
      if (buffer.length === 0 && data.length > 0) {
        throw new Error('Invalid base64 data');
      }
    } catch (decodeError) {
      logger.warn('Base64 decoding failed', { 
        error: decodeError instanceof Error ? decodeError.message : 'Unknown error',
        dataLength: data?.length,
        requestId: req.requestId 
      });
      return sendError(
        res, 
        400, 
        'INVALID_DATA', 
        'Invalid base64 encoded data. Please ensure the data is properly encoded.'
      );
    }

    logger.info('Processing material upload', { 
      userId: req.user.userId, 
      filename, 
      mimeType,
      size: buffer.length,
      requestId: req.requestId 
    });

    const result = await processUpload(
      req.user.userId,
      buffer,
      filename,
      mimeType,
      type as MaterialType | undefined
    );

    logger.info('Material uploaded successfully', { 
      materialId: result.id, 
      userId: req.user.userId,
      requestId: req.requestId 
    });

    sendSuccess(res, result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    logger.error('Material upload failed', { 
      error: message, 
      requestId: req.requestId 
    });

    if (message.includes('Unsupported') || message.includes('Invalid MIME')) {
      return sendError(res, 400, 'INVALID_FILE_TYPE', message);
    }
    if (message.includes('too large')) {
      return sendError(res, 413, 'FILE_TOO_LARGE', message);
    }
    if (message.includes('spoofing')) {
      return sendError(res, 400, 'FILE_VALIDATION_FAILED', message);
    }

    sendError(res, 500, 'UPLOAD_ERROR', message);
  }
};

/**
 * Get a presigned URL for direct upload (large files)
 * POST /api/v1/materials/presign
 */
export const getPresignedUrl = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { filename, mimeType, size } = req.body;

    if (!filename || !mimeType || !size) {
      return sendError(
        res, 
        400, 
        'INVALID_REQUEST', 
        'Missing required fields: filename, mimeType, size'
      );
    }

    logger.info('Generating presigned URL', { 
      userId: req.user.userId, 
      filename, 
      mimeType,
      size,
      requestId: req.requestId 
    });

    const result = await getPresignedUploadUrl(
      req.user.userId,
      filename,
      mimeType,
      size
    );

    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate upload URL';
    logger.error('Presigned URL generation failed', { 
      error: message, 
      requestId: req.requestId 
    });

    if (message.includes('Unsupported')) {
      return sendError(res, 400, 'INVALID_FILE_TYPE', message);
    }
    if (message.includes('too large')) {
      return sendError(res, 413, 'FILE_TOO_LARGE', message);
    }

    sendError(res, 500, 'PRESIGN_ERROR', message);
  }
};

/**
 * Get material by ID
 * GET /api/v1/materials/:id
 */
export const getMaterial = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id } = req.params;
    const material = getMaterialById(id);

    if (!material) {
      return sendError(res, 404, 'NOT_FOUND', 'Material not found');
    }

    // Check ownership
    if (material.userId !== req.user.userId) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    sendSuccess(res, material);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get material';
    logger.error('Get material failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'GET_ERROR', message);
  }
};

/**
 * List user's materials
 * GET /api/v1/materials
 */
export const listMaterials = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    // Validate query parameters
    const parseResult = listMaterialsSchema.safeParse(req.query);
    if (!parseResult.success) {
      return sendError(res, 400, 'INVALID_REQUEST', 'Invalid query parameters');
    }

    const { type, page, limit } = parseResult.data;

    const result = listUserMaterials(
      req.user.userId,
      type,
      page,
      limit
    );

    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list materials';
    logger.error('List materials failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'LIST_ERROR', message);
  }
};

/**
 * Delete a material
 * DELETE /api/v1/materials/:id
 */
export const removeMaterial = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { id } = req.params;
    const success = deleteMaterial(id, req.user.userId);

    if (!success) {
      return sendError(res, 404, 'NOT_FOUND', 'Material not found or access denied');
    }

    logger.info('Material deleted', { 
      materialId: id, 
      userId: req.user.userId,
      requestId: req.requestId 
    });

    sendSuccess(res, { deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete material';
    logger.error('Delete material failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'DELETE_ERROR', message);
  }
};
