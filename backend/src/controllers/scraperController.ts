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

    // Step 3: Process SVG markers and insert SVG blocks at their original positions
    const finalBlocks: typeof parsedBlocks = [];
    const svgBlockMap = new Map(scrapedArticle.svgBlocks.map(svg => [svg.id, svg]));
    
    for (const block of parsedBlocks) {
      // Check if this block's content contains SVG markers
      const svgMarkerRegex = /data-svg-block-id="([^"]+)"/g;
      let match;
      
      if (block.content && typeof block.content === 'string') {
        const matches = [...block.content.matchAll(svgMarkerRegex)];
        
        if (matches.length > 0) {
          // This block contains SVG markers
          // Split the content and insert SVG blocks
          let lastIndex = 0;
          const parts: typeof parsedBlocks = [];
          
          for (const m of matches) {
            const svgId = m[1];
            const markerIndex = m.index || 0;
            
            // Add text before the marker (if any)
            if (markerIndex > lastIndex) {
              const textBefore = block.content.substring(lastIndex, markerIndex);
              if (textBefore.trim()) {
                parts.push({ ...block, id: uuidv4(), content: textBefore });
              }
            }
            
            // Add the SVG block
            const svgBlock = svgBlockMap.get(svgId);
            if (svgBlock) {
              parts.push({
                id: svgBlock.id,
                type: BlockType.SVG,
                content: svgBlock.content,
              });
            }
            
            lastIndex = markerIndex + m[0].length;
          }
          
          // Add remaining text after last marker (if any)
          if (lastIndex < block.content.length) {
            const textAfter = block.content.substring(lastIndex);
            if (textAfter.trim()) {
              parts.push({ ...block, id: uuidv4(), content: textAfter });
            }
          }
          
          finalBlocks.push(...parts);
        } else {
          // No SVG markers in this block
          finalBlocks.push(block);
        }
      } else {
        // Block has no content or content is not a string
        finalBlocks.push(block);
      }
    }
    
    // Add any remaining SVG blocks that weren't found in markers (append at end)
    const usedSvgIds = new Set<string>();
    for (const block of finalBlocks) {
      if (block.type === BlockType.SVG) {
        usedSvgIds.add(block.id);
      }
    }
    
    for (const svg of scrapedArticle.svgBlocks) {
      if (!usedSvgIds.has(svg.id)) {
        finalBlocks.push({
          id: svg.id,
          type: BlockType.SVG,
          content: svg.content,
        });
      }
    }

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
