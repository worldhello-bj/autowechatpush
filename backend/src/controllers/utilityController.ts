import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';

const logger = createLogger('utility');

/**
 * Sanitize data URL to prevent XSS attacks
 */
const sanitizeDataUrl = (value: string = ''): string | null => {
  const trimmed = value.trim();
  const dataUrlPattern = /^data:image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;
  return dataUrlPattern.test(trimmed) ? trimmed : null;
};

/**
 * Stitch images together into a single HTML section
 * POST /api/v1/utility/stitch-images
 */
export const stitchImages = async (req: Request, res: Response) => {
  try {
    const { images = [], width = '100%' } = req.body || {};
    
    const safeImages = Array.isArray(images) 
      ? images.map((img: string) => sanitizeDataUrl(img)).filter(Boolean) as string[]
      : [];
    
    if (!safeImages.length) {
      return sendError(res, 400, 'INVALID_REQUEST', 'No valid images provided');
    }

    const safeWidth = typeof width === 'string' && /^([0-9]+%|[0-9]+px)$/i.test(width.trim()) 
      ? width.trim() 
      : '100%';

    const sections = safeImages.map((src, idx) => `
  <section style="margin-top: ${idx === 0 ? '0' : '-1px'}; line-height: 0; font-size: 0; background-color: transparent;">
    <img src="${src}" style="vertical-align: top; width: 100%; display: block;" />
  </section>`).join('');
    
    const html = `<section style="max-width: ${safeWidth}; margin: 0 auto; box-sizing: border-box;">${sections}</section>`;

    logger.info('Images stitched successfully', { 
      imageCount: safeImages.length,
      width: safeWidth,
      requestId: req.requestId 
    });

    sendSuccess(res, { html });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stitching failed';
    logger.error('Stitch images failed', { 
      error: message, 
      requestId: req.requestId 
    });
    sendError(res, 500, 'STITCH_ERROR', message);
  }
};
