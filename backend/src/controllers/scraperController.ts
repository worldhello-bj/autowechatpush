import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { scrapeWeChatArticle } from '../services/index.js';
import { parseArticleContent } from '../services/index.js';
import { AIProvider, BlockType } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('scraper-controller');

/**
 * Import article from WeChat URL
 * POST /api/v1/ai/import-url
 */
export const importFromUrl = async (req: Request, res: Response) => {
  try {
    const { url, mode } = req.body;

    if (!url || typeof url !== 'string') {
      return sendError(res, 400, 'INVALID_REQUEST', 'URL is required');
    }

    if (!url.includes('mp.weixin.qq.com')) {
      return sendError(res, 400, 'INVALID_URL', 'Only WeChat article URLs are supported');
    }

    logger.info('Article import request', { url, mode });

    // Step 1: Scrape the article
    const scrapedArticle = await scrapeWeChatArticle(url);

    // Step 2: Parse content with AI to get structured blocks
    const parsedBlocks = await parseArticleContent(scrapedArticle.cleanedHtml, AIProvider.DEEPSEEK);

    // Step 3: Insert SVG blocks at appropriate positions
    // For now, append SVG blocks at the end, but could be improved to insert based on markers
    const svgBlocks = scrapedArticle.svgBlocks.map((svg) => ({
      id: svg.id,
      type: BlockType.SVG,
      content: svg.content,
    }));

    const allBlocks = [...parsedBlocks, ...svgBlocks];

    logger.info('Article imported successfully', {
      title: scrapedArticle.title,
      blocksCount: allBlocks.length,
    });

    return sendSuccess(res, {
      title: scrapedArticle.title,
      author: scrapedArticle.author,
      digest: scrapedArticle.digest,
      blocks: allBlocks,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to import article', { error: errorMessage });

    if (errorMessage.includes('Invalid WeChat article URL')) {
      return sendError(res, 400, 'INVALID_URL', errorMessage);
    }

    if (errorMessage.includes('Failed to fetch')) {
      return sendError(res, 502, 'FETCH_FAILED', 'Unable to fetch the article. Please check the URL and try again.');
    }

    return sendError(res, 500, 'IMPORT_FAILED', 'Failed to import article. Please try again later.');
  }
};
