import * as cheerio from 'cheerio';
import { createLogger } from '../utils/index.js';
import { v4 as uuidv4 } from 'uuid';
import { BlockType, ArticleBlock } from '../types/index.js';

const logger = createLogger('scraper-service');

// Configuration constants for placeholder image
const PLACEHOLDER_WIDTH = 600;
const PLACEHOLDER_HEIGHT = 400;
const PLACEHOLDER_BORDER_MARGIN = 50;
const PLACEHOLDER_BORDER_RADIUS = 10;

// HTML parsing constants
const MAX_HEADER_LEVEL = 3;
const MIN_TEXT_LENGTH = 10;
const MAX_RECURSION_DEPTH = 5;

// SVG placeholder configuration
const PLACEHOLDER_SVG_CONTENT = `
<svg width="${PLACEHOLDER_WIDTH}" height="${PLACEHOLDER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${PLACEHOLDER_WIDTH}" height="${PLACEHOLDER_HEIGHT}" fill="#f5f5f5"/>
  <rect x="${PLACEHOLDER_BORDER_MARGIN}" y="${PLACEHOLDER_BORDER_MARGIN}" width="${PLACEHOLDER_WIDTH - 2 * PLACEHOLDER_BORDER_MARGIN}" height="${PLACEHOLDER_HEIGHT - 2 * PLACEHOLDER_BORDER_MARGIN}" fill="#e0e0e0" rx="${PLACEHOLDER_BORDER_RADIUS}"/>
  <text x="${PLACEHOLDER_WIDTH / 2}" y="${PLACEHOLDER_HEIGHT / 2 - 20}" font-family="Arial, sans-serif" font-size="24" fill="#999" text-anchor="middle" font-weight="bold">图片占位符</text>
  <text x="${PLACEHOLDER_WIDTH / 2}" y="${PLACEHOLDER_HEIGHT / 2 + 20}" font-family="Arial, sans-serif" font-size="16" fill="#bbb" text-anchor="middle">Image Placeholder</text>
  <text x="${PLACEHOLDER_WIDTH / 2}" y="${PLACEHOLDER_HEIGHT / 2 + 50}" font-family="Arial, sans-serif" font-size="12" fill="#ccc" text-anchor="middle">仅供排版学习使用</text>
</svg>
`.trim();

// Placeholder image - using data URL to avoid storing files on client side
const PLACEHOLDER_IMAGE_DATA_URL = 'data:image/svg+xml;base64,' + Buffer.from(PLACEHOLDER_SVG_CONTENT).toString('base64');

// Modern User-Agent string (can be updated via environment variable)
const USER_AGENT = process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

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
        'User-Agent': USER_AGENT,
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
  
  // Remove visibility:hidden and opacity:0 styles that hide content
  // WeChat articles often use these for lazy loading
  contentArea.removeAttr('style');
  contentArea.find('[style*="visibility"]').each((_, element) => {
    const $el = $(element);
    let style = $el.attr('style') || '';
    // Remove visibility and opacity properties
    style = style.replace(/visibility\s*:\s*hidden\s*;?/gi, '');
    style = style.replace(/opacity\s*:\s*0\s*;?/gi, '');
    style = style.trim();
    if (style) {
      $el.attr('style', style);
    } else {
      $el.removeAttr('style');
    }
  });
  
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
    // Preserve the img tag structure but replace src with data URL
    $img.attr('src', PLACEHOLDER_IMAGE_DATA_URL);
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

/**
 * Simple HTML to blocks parser (fallback when AI is not available)
 * Converts basic HTML structure to ArticleBlock format
 * Optimized for WeChat article structures
 */
export const parseHtmlToBlocks = (html: string, depth: number = 0): ArticleBlock[] => {
  const $ = cheerio.load(html);
  const blocks: ArticleBlock[] = [];
  
  // Prevent deep recursion
  if (depth > MAX_RECURSION_DEPTH) {
    logger.warn('Max recursion depth reached in HTML parser');
    return blocks;
  }
  
  // Process each top-level element in the content
  $('body').children().each((_, element) => {
    const $el = $(element);
    const tagName = element.tagName?.toLowerCase();
    
    if (!tagName) return;
    
    // Handle headers
    if (tagName.match(/^h[1-6]$/)) {
      const level = parseInt(tagName.charAt(1));
      const text = $el.text().trim();
      if (text) {
        blocks.push({
          id: uuidv4(),
          type: BlockType.HEADER,
          content: text,
          level: level <= MAX_HEADER_LEVEL ? level as 1 | 2 | 3 : MAX_HEADER_LEVEL as 3,
        });
      }
    }
    // Handle paragraphs
    else if (tagName === 'p') {
      const text = $el.text().trim();
      const imgCount = $el.find('img').length;
      
      // If paragraph contains images, create separate blocks
      if (imgCount > 0) {
        $el.find('img').each((_, img) => {
          const imgSrc = $(img).attr('src');
          if (imgSrc) {
            blocks.push({
              id: uuidv4(),
              type: BlockType.IMAGE,
              content: imgSrc,
            });
          }
        });
        
        // Add text content if any (excluding image alt text)
        const textContent = $el.clone().find('img').remove().end().text().trim();
        if (textContent && textContent.length > MIN_TEXT_LENGTH) {
          blocks.push({
            id: uuidv4(),
            type: BlockType.PARAGRAPH,
            content: textContent,
          });
        }
      } else if (text) {
        blocks.push({
          id: uuidv4(),
          type: BlockType.PARAGRAPH,
          content: text,
        });
      }
    }
    // Handle standalone images
    else if (tagName === 'img') {
      const imgSrc = $el.attr('src');
      if (imgSrc) {
        blocks.push({
          id: uuidv4(),
          type: BlockType.IMAGE,
          content: imgSrc,
        });
      }
    }
    // Handle sections/divs with images
    else if ((tagName === 'div' || tagName === 'section') && $el.find('img').length > 0) {
      // Extract all images from the section
      $el.find('img').each((_, img) => {
        const imgSrc = $(img).attr('src');
        if (imgSrc) {
          blocks.push({
            id: uuidv4(),
            type: BlockType.IMAGE,
            content: imgSrc,
          });
        }
      });
      
      // Get text content excluding images
      const textContent = $el.clone().find('img').remove().end().text().trim();
      if (textContent && textContent.length > MIN_TEXT_LENGTH) {
        blocks.push({
          id: uuidv4(),
          type: BlockType.PARAGRAPH,
          content: textContent,
        });
      }
    }
    // Handle SVG markers
    else if ($el.attr('data-svg-block-id')) {
      // Keep the marker in the content for later SVG insertion
      blocks.push({
        id: uuidv4(),
        type: BlockType.PARAGRAPH,
        content: `<div data-svg-block-id="${$el.attr('data-svg-block-id')}" class="svg-placeholder"></div>`,
      });
    }
    // Handle divs/sections with text content
    else if (tagName === 'div' || tagName === 'section') {
      const text = $el.text().trim();
      // Only add if it has substantial text and no nested block elements
      if (text && text.length > MIN_TEXT_LENGTH && $el.find('p, h1, h2, h3, h4, h5, h6').length === 0) {
        blocks.push({
          id: uuidv4(),
          type: BlockType.PARAGRAPH,
          content: text,
        });
      } else if ($el.children().length > 0) {
        // Process children recursively with depth limit
        $el.children().each((_, child) => {
          const childHtml = $(child).prop('outerHTML') || '';
          if (childHtml) {
            const childBlocks = parseHtmlToBlocks(childHtml, depth + 1);
            blocks.push(...childBlocks);
          }
        });
      }
    }
  });
  
  return blocks;
};
