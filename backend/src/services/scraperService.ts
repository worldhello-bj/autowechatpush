import * as cheerio from 'cheerio';
import { createLogger } from '../utils/index.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('scraper-service');

// Placeholder image URL - will be replaced with actual placeholder
const PLACEHOLDER_IMAGE_URL = '/images/placeholder_note.svg';

export interface ScrapedArticle {
  title: string;
  author: string;
  digest: string;
  cleanedHtml: string;
  svgBlocks: Array<{ id: string; content: string }>;
}

/**
 * Fetch WeChat article with proper headers to bypass anti-scraping
 */
const fetchWeChatArticle = async (url: string): Promise<string> => {
  logger.info('Fetching WeChat article', { url });

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://mp.weixin.qq.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    logger.info('Article fetched successfully');
    return html;
  } catch (error) {
    logger.error('Failed to fetch article', { error });
    throw error;
  }
};

/**
 * Extract metadata from WeChat article
 */
const extractMetadata = ($: cheerio.CheerioAPI): { title: string; author: string; digest: string } => {
  // Try to extract title from various possible locations
  let title = $('#activity-name').text().trim() || 
              $('h1.rich_media_title').text().trim() ||
              $('meta[property="og:title"]').attr('content')?.trim() ||
              'Untitled Article';

  // Extract author
  let author = $('#js_name').text().trim() ||
               $('.rich_media_meta_text').text().trim() ||
               $('meta[property="og:article:author"]').attr('content')?.trim() ||
               'Unknown Author';

  // Extract digest/summary
  let digest = $('#js_content').find('p').first().text().trim() ||
               $('meta[property="og:description"]').attr('content')?.trim() ||
               $('meta[name="description"]').attr('content')?.trim() ||
               'No summary available';

  // Limit digest length
  if (digest.length > 200) {
    digest = digest.substring(0, 200) + '...';
  }

  return { title, author, digest };
};

/**
 * Clean article content - remove scripts, replace images, extract SVGs
 */
const cleanContent = ($: cheerio.CheerioAPI): { cleanedHtml: string; svgBlocks: Array<{ id: string; content: string }> } => {
  const svgBlocks: Array<{ id: string; content: string }> = [];
  
  // Find the main content area
  const contentArea = $('#js_content, .rich_media_content, #img-content').first();
  
  if (contentArea.length === 0) {
    logger.warn('Could not find main content area');
    return { cleanedHtml: '', svgBlocks: [] };
  }

  // Remove all script tags for XSS prevention
  contentArea.find('script').remove();
  
  // Extract SVG blocks
  contentArea.find('svg').each((_, element) => {
    const svgHtml = $.html(element);
    const id = uuidv4();
    svgBlocks.push({ id, content: svgHtml });
    
    // Replace SVG with a marker that can be identified later
    $(element).replaceWith(`<div data-svg-block-id="${id}" class="svg-placeholder"></div>`);
  });

  // Replace all images with placeholder
  contentArea.find('img').each((_, element) => {
    const $img = $(element);
    // Preserve the img tag structure but replace src
    $img.attr('src', PLACEHOLDER_IMAGE_URL);
    // Remove data-src and other lazy loading attributes
    $img.removeAttr('data-src');
    $img.removeAttr('data-original');
    $img.removeAttr('data-lazy-src');
  });

  // Get cleaned HTML
  const cleanedHtml = contentArea.html() || '';
  
  logger.info('Content cleaned', { svgBlocksCount: svgBlocks.length });
  return { cleanedHtml, svgBlocks };
};

/**
 * Main scraping function
 */
export const scrapeWeChatArticle = async (url: string): Promise<ScrapedArticle> => {
  logger.info('Starting article scrape', { url });

  // Validate URL
  if (!url.includes('mp.weixin.qq.com')) {
    throw new Error('Invalid WeChat article URL');
  }

  // Fetch the article HTML
  const html = await fetchWeChatArticle(url);

  // Parse with Cheerio
  const $ = cheerio.load(html);

  // Extract metadata
  const metadata = extractMetadata($);

  // Clean content
  const { cleanedHtml, svgBlocks } = cleanContent($);

  logger.info('Article scraped successfully', {
    title: metadata.title,
    svgBlocks: svgBlocks.length,
  });

  return {
    ...metadata,
    cleanedHtml,
    svgBlocks,
  };
};
