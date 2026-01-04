import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { scrapeWeChatArticle, parseHtmlToBlocks } from '../services/index.js';
import { parseArticleContent } from '../services/index.js';
import { AIProvider, BlockType } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';

const logger = createLogger('scraper-controller');

/**
 * Parse WeChat article preserving section structure
 * WeChat articles use nested sections with backgrounds and styling
 */
const parseWeChatSections = (html: string, svgBlocks: Array<{ id: string; content: string }>) => {
  const $ = cheerio.load(html);
  const blocks: Array<{ id: string; type: BlockType; content: string; level?: number }> = [];
  const svgBlockMap = new Map(svgBlocks.map(svg => [svg.id, svg]));
  
  // Find top-level sections and major content blocks
  const topElements = $('body > *');
  
  topElements.each((_, element) => {
    const $el = $(element);
    const tagName = element.tagName?.toLowerCase();
    
    // Check if this is a styled section (has background, padding, etc.)
    const hasBackground = $el.attr('style')?.includes('background');
    const hasSection = $el.find('section').length > 0;
    
    // If it's a complex section with styling, preserve it as HTML block
    if (hasBackground || hasSection || tagName === 'section') {
      const sectionHtml = $.html($el);
      
      // Check for SVG markers in this section
      const svgMarkerRegex = /data-svg-block-id="([^"]+)"/g;
      const matches = [...sectionHtml.matchAll(svgMarkerRegex)];
      
      if (matches.length > 0) {
        // Extract and insert SVG blocks from markers
        let processedHtml = sectionHtml;
        for (const match of matches) {
          const svgId = match[1];
          const svgBlock = svgBlockMap.get(svgId);
          if (svgBlock) {
            // Replace marker with actual SVG
            processedHtml = processedHtml.replace(
              `<div data-svg-block-id="${svgId}" class="svg-placeholder"></div>`,
              svgBlock.content
            );
          }
        }
        
        blocks.push({
          id: uuidv4(),
          type: BlockType.PARAGRAPH, // Use paragraph type for HTML sections
          content: processedHtml,
        });
      } else {
        blocks.push({
          id: uuidv4(),
          type: BlockType.PARAGRAPH,
          content: sectionHtml,
        });
      }
    }
    // Handle simple headers
    else if (tagName?.match(/^h[1-6]$/)) {
      const level = parseInt(tagName.charAt(1));
      const text = $el.text().trim();
      if (text) {
        blocks.push({
          id: uuidv4(),
          type: BlockType.HEADER,
          content: text,
          level: level <= 3 ? level as 1 | 2 | 3 : 3,
        });
      }
    }
    // Handle simple paragraphs (no nested sections)
    else if (tagName === 'p' && !hasSection) {
      const text = $el.text().trim();
      if (text) {
        blocks.push({
          id: uuidv4(),
          type: BlockType.PARAGRAPH,
          content: text,
        });
      }
    }
  });
  
  return blocks;
};

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

    // Step 2: Parse content preserving WeChat section structure
    // Use specialized WeChat parser that keeps styled sections intact
    const finalBlocks = parseWeChatSections(scrapedArticle.cleanedHtml, scrapedArticle.svgBlocks);

    logger.info('Article imported successfully', {
      title: scrapedArticle.title,
      blocksCount: finalBlocks.length,
      svgBlocksCount: scrapedArticle.svgBlocks.length,
    });

    return sendSuccess(res, {
      title: scrapedArticle.title,
      author: scrapedArticle.author,
      digest: scrapedArticle.digest,
      blocks: finalBlocks,
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
