import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { generateArticle, generateArticleParallel } from '../services/index.js';
import { checkQuota, consumeQuota, getUserQuotaStatus } from '../services/index.js';
import { AIChatRequest, SSEEvent } from '../types/index.js';

const logger = createLogger('ai');

/**
 * Generate article (non-streaming)
 * POST /api/v1/ai/generate
 */
export const generate = async (req: Request, res: Response) => {
  try {
    const request = req.body as AIChatRequest;
    logger.info('AI generation request', { 
      provider: request.provider, 
      requestId: req.requestId 
    });
    
    // Check user quota if authenticated
    if (req.user) {
      const quotaCheck = checkQuota(req.user.userId, 1);
      if (!quotaCheck.allowed) {
        return sendError(res, 402, 'QUOTA_EXCEEDED', quotaCheck.reason || 'Insufficient quota. Please upgrade your plan.');
      }
    }
    
    // Get API key from request headers or use server-side key
    const userApiKey = req.headers['x-api-key'] as string | undefined;
    
    const result = await generateArticle(request, userApiKey);
    
    // Consume quota if authenticated
    if (req.user) {
      consumeQuota(req.user.userId, 1, 'ai_generation', {
        provider: request.provider,
        blocksCount: result.blocks.length,
        title: result.title,
      }, req.requestId);
    }
    
    logger.info('AI generation completed', { 
      title: result.title,
      blocksCount: result.blocks.length,
      requestId: req.requestId 
    });
    
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed';
    logger.error('AI generation failed', { error: message, requestId: req.requestId });
    
    if (message.includes('API key')) {
      return sendError(res, 401, 'MISSING_API_KEY', message);
    }
    
    sendError(res, 500, 'AI_ERROR', message);
  }
};

/**
 * Generate article with streaming (SSE)
 * POST /api/v1/ai/chat/stream
 */
export const chatStream = async (req: Request, res: Response) => {
  const request = req.body as AIChatRequest;
  
  logger.info('SSE stream request', { 
    provider: request.provider, 
    requestId: req.requestId 
  });
  
  // Check user quota if authenticated
  if (req.user) {
    const quotaCheck = checkQuota(req.user.userId, 1);
    if (!quotaCheck.allowed) {
      return sendError(res, 402, 'QUOTA_EXCEEDED', quotaCheck.reason || 'Insufficient quota. Please upgrade your plan.');
    }
  }
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Send initial heartbeat
  res.write(':heartbeat\n\n');
  
  const sendSSEEvent = (event: SSEEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);
  };
  
  // Heartbeat interval to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 15000);
  
  try {
    // Get API key from request headers or use server-side key
    const userApiKey = req.headers['x-api-key'] as string | undefined;
    
    // Send thinking event if thinking mode is enabled
    if (request.thinkingMode) {
      sendSSEEvent({
        type: 'thinking',
        data: { message: 'AI is analyzing your request...' },
        timestamp: Date.now(),
      });
    }
    
    // Generate article
    const result = await generateArticle(request, userApiKey);
    
    // Send blocks one by one for streaming effect
    for (const block of result.blocks) {
      sendSSEEvent({
        type: 'block',
        data: block,
        timestamp: Date.now(),
      });
      
      // Small delay between blocks for visual streaming effect
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Send complete event
    sendSSEEvent({
      type: 'complete',
      data: {
        title: result.title,
        digest: result.digest,
        totalBlocks: result.blocks.length,
        sources: result.sources,
      },
      timestamp: Date.now(),
    });
    
    // Consume quota if authenticated
    if (req.user) {
      consumeQuota(req.user.userId, 1, 'ai_stream', {
        provider: request.provider,
        blocksCount: result.blocks.length,
        title: result.title,
      }, req.requestId);
    }
    
    logger.info('SSE stream completed', { 
      title: result.title,
      blocksCount: result.blocks.length,
      requestId: req.requestId 
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed';
    logger.error('SSE stream failed', { error: message, requestId: req.requestId });
    
    sendSSEEvent({
      type: 'error',
      data: { code: 'AI_ERROR', message },
      timestamp: Date.now(),
    });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
};

/**
 * Get AI usage/quota status
 * GET /api/v1/ai/quota
 */
export const getQuota = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
  }
  
  const status = getUserQuotaStatus(req.user.userId);
  
  if (!status) {
    return sendError(res, 404, 'NOT_FOUND', 'Quota status not found');
  }
  
  // Return detailed quota status
  sendSuccess(res, {
    userId: req.user.userId,
    hasQuota: status.remainingQuota > 0,
    remainingQuota: status.remainingQuota,
    dailyUsed: status.dailyUsed,
    dailyLimit: status.dailyLimit,
    monthlyUsed: status.monthlyUsed,
    monthlyLimit: status.monthlyLimit,
    plan: status.plan,
    message: status.remainingQuota > 0 ? 'Quota available' : 'Quota exceeded',
  });
};
