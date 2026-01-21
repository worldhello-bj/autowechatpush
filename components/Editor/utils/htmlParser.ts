/**
 * Frontend HTML Parser using TreeWalker
 * Lightweight alternative to AI-based parsing for handling large HTML documents
 */

import { ArticleBlock, BlockType } from '../../../types';

export interface HtmlParseResult {
  blocks: ArticleBlock[];
  metadata: {
    totalElements: number;
    blockTypes: Record<string, number>;
    hasComplexStructure: boolean;
    parsingTime: number;
  };
}

/**
 * Lightweight HTML Parser using browser DOM APIs
 * Designed to handle large HTML documents efficiently without AI context limits
 */
export class HtmlParser {
  private static readonly CONFIG = {
    minTextLength: 3,      // Minimum text length to consider as content
    maxBlocks: 500,        // Maximum blocks to prevent excessive processing
    skipTags: new Set(['script', 'style', 'meta', 'link', 'noscript']), // Tags to skip
  };

  private static readonly BLOCK_TYPE_MAPPING: Record<string, BlockType> = {
    'h1': BlockType.HEADER,
    'h2': BlockType.HEADER,
    'h3': BlockType.HEADER,
    'h4': BlockType.HEADER,
    'h5': BlockType.HEADER,
    'h6': BlockType.HEADER,
    'p': BlockType.PARAGRAPH,
    'blockquote': BlockType.QUOTE,
    'q': BlockType.QUOTE,
    'ul': BlockType.LIST,
    'ol': BlockType.NUMBERED_LIST,
    'li': BlockType.PARAGRAPH, // List items as paragraphs
    'img': BlockType.IMAGE,
    'hr': BlockType.DIVIDER,
    'section': BlockType.PARAGRAPH,
    'div': BlockType.PARAGRAPH,
    'article': BlockType.PARAGRAPH,
    'main': BlockType.PARAGRAPH,
  };

  /**
   * Parse HTML string into ArticleBlocks using TreeWalker
   */
  static parseHtml(htmlString: string): HtmlParseResult {
    const startTime = performance.now();

    if (!htmlString || typeof htmlString !== 'string') {
      return this.createEmptyResult();
    }

    try {
      // Convert HTML string to DOM document
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');

      // Use TreeWalker for efficient DOM traversal
      const blocks = this.walkDomTree(doc.body);
      const metadata = this.generateMetadata(doc, blocks, performance.now() - startTime);

      return { blocks, metadata };
    } catch (error) {
      console.warn('[HtmlParser] Failed to parse HTML:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * Walk DOM tree using TreeWalker and extract blocks
   */
  private static walkDomTree(root: HTMLElement): ArticleBlock[] {
    const blocks: ArticleBlock[] = [];
    let blockIndex = 0;

    // Create TreeWalker with element filter
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Node): number => {
          const element = node as Element;
          const tagName = element.tagName.toLowerCase();

          // Skip unwanted tags
          if (this.CONFIG.skipTags.has(tagName)) {
            return NodeFilter.FILTER_SKIP;
          }

          // Check if element can be a block
          if (this.BLOCK_TYPE_MAPPING[tagName] ||
              this.hasSignificantContent(element) ||
              this.isSpecialElement(element)) {
            
            // Critical fix: If a container has block-level children, skip it to process children individually.
            // This prevents "mega-blocks" where a parent div swallows all paragraphs.
            if (this.hasBlockChildren(element)) {
              return NodeFilter.FILTER_SKIP;
            }

            return NodeFilter.FILTER_ACCEPT;
          }

          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    // Walk through all accepted nodes
    let node: Node | null;
    while ((node = walker.nextNode()) && blocks.length < this.CONFIG.maxBlocks) {
      const element = node as Element;
      const block = this.createBlockFromElement(element, blockIndex++);

      if (block) {
        blocks.push(block);
      }
    }

    return blocks;
  }

  /**
   * Create ArticleBlock from DOM element
   */
  private static createBlockFromElement(element: Element, index: number): ArticleBlock | null {
    const tagName = element.tagName.toLowerCase();
    let blockType = this.BLOCK_TYPE_MAPPING[tagName];

    // Check for visual headers (p/div/span styled as header)
    if (!blockType || blockType === BlockType.PARAGRAPH) {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const fontWeight = computedStyle.fontWeight;
      const isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 600;
      
      // Heuristic: Large text or Bold text with specific class/structure might be a header
      // Check for title-like classes
      const className = element.className || '';
      const isTitleClass = className.includes('title') || className.includes('header') || className.includes('caption');
      
      // Check for strong content
      const hasStrongTag = element.querySelector('strong, b') !== null;
      const textLength = element.textContent?.trim().length || 0;
      
      if (
        (fontSize >= 18) || // Large font
        (isBold && textLength < 100) || // Bold and short
        (isTitleClass && textLength < 100) || // Explicit class
        (hasStrongTag && textLength < 50 && isBold) // Strong tag inside short text
      ) {
         blockType = BlockType.HEADER;
      }
    }

    // Extract content based on element type
    const content = this.extractElementContent(element);

    if (!content || content.length < this.CONFIG.minTextLength) {
      return null;
    }

    // Generate unique ID
    const id = `parsed-${Date.now()}-${index}`;

    // Create base block
    const block: ArticleBlock = {
      id,
      type: blockType || BlockType.PARAGRAPH,
      content,
      style: 'default',
      alignment: 'left',
    };

    // Add type-specific properties
    this.addTypeSpecificProperties(block, element, tagName);

    return block;
  }

  /**
   * Extract content from element based on its type
   */
  private static extractElementContent(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    // Special handling for images
    if (tagName === 'img') {
      const img = element as HTMLImageElement;
      return img.src || img.alt || 'Image';
    }

    // Special handling for lists
    if (tagName === 'ul' || tagName === 'ol') {
      return ''; // List content is handled by list items
    }

    // For list items, get direct text content only
    if (tagName === 'li') {
      return (element as HTMLElement).innerText?.trim() || element.textContent?.trim() || '';
    }

    // For other elements, use innerText to preserve line breaks and formatting
    // Fallback to textContent if innerText is not available
    const textContent = (element as HTMLElement).innerText?.trim() || element.textContent?.trim() || '';

    // Limit content length to prevent excessive processing
    return textContent.length > 10000 ?
           textContent.substring(0, 10000) + '...' :
           textContent;
  }

  /**
   * Check if element has block-level children
   */
  private static hasBlockChildren(element: Element): boolean {
    const blockTags = Object.keys(this.BLOCK_TYPE_MAPPING);
    // Also include common block tags that might not be in MAPPING but imply structure
    const structuralTags = ['table', 'form', 'header', 'footer', 'nav', 'aside'];
    
    return Array.from(element.children).some(child => {
      const tagName = child.tagName.toLowerCase();
      // If child is a recognized block type or structural element
      if (blockTags.includes(tagName) || structuralTags.includes(tagName)) {
        return true;
      }
      // Special check: if child is a div/section with significant content, treat as block child
      if ((tagName === 'div' || tagName === 'section') && this.hasSignificantContent(child)) {
        return true;
      }
      return false;
    });
  }

  /**
   * Add type-specific properties to block
   */
  private static addTypeSpecificProperties(
    block: ArticleBlock,
    element: Element,
    tagName: string
  ): void {
    // Header level
    if (block.type === BlockType.HEADER && tagName.match(/^h[1-6]$/)) {
      block.level = parseInt(tagName.charAt(1)) as 1 | 2 | 3;
    }

    // List handling
    if (block.type === BlockType.LIST || block.type === BlockType.NUMBERED_LIST) {
      const items = Array.from(element.children)
        .filter(child => child.tagName.toLowerCase() === 'li')
        .map(li => (li.textContent || '').trim())
        .filter(text => text.length > 0);

      if (items.length > 0) {
        block.items = items;
        block.content = ''; // Content is now in items
      }
    }

    // Image handling
    if (block.type === BlockType.IMAGE) {
      const img = element as HTMLImageElement;
      block.title = img.alt || undefined;
    }

    // Extract styling information
    const computedStyle = window.getComputedStyle(element);
    this.extractStylingProperties(block, computedStyle, element);
  }

  /**
   * Extract styling properties from element
   */
  private static extractStylingProperties(
    block: ArticleBlock,
    style: CSSStyleDeclaration,
    element: Element
  ): void {
    // Text alignment
    const textAlign = style.textAlign;
    if (textAlign === 'center') block.alignment = 'center';
    else if (textAlign === 'right') block.alignment = 'right';

    // Font styling
    if (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600) {
      block.fontWeight = 'bold';
    }

    if (style.fontStyle === 'italic') {
      block.fontStyle = 'italic';
    }

    // Size hints
    const fontSize = parseFloat(style.fontSize);
    if (fontSize >= 20) block.fontSize = 'xlarge';
    else if (fontSize >= 16) block.fontSize = 'large';
    else if (fontSize <= 12) block.fontSize = 'small';

    // Intelligent style detection based on common patterns
    block.style = this.detectIntelligentStyle(element, style);
  }

  /**
   * Detect intelligent style based on element characteristics
   */
  private static detectIntelligentStyle(element: Element, style: CSSStyleDeclaration): 'default' | 'primary' | 'warning' | 'quote' | 'red' | 'blue' | 'purple' | 'orange' | 'gold' | 'green' | 'pink' | 'cyan' | 'gradient' {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const backgroundColor = style.backgroundColor;
    const borderLeft = style.borderLeftWidth;

    // Quote detection
    if (tagName === 'blockquote' || tagName === 'q' ||
        borderLeft !== '0px' || className.includes('quote')) {
      return 'quote';
    }

    // Card/highlight detection
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        backgroundColor !== 'transparent') {
      return 'primary';
    }

    // Callout detection
    if (borderLeft !== '0px' && style.borderLeftStyle === 'solid') {
      return 'warning';
    }

    // Default style
    return 'default';
  }

  /**
   * Check if element has significant content worth extracting
   */
  private static hasSignificantContent(element: Element): boolean {
    const textContent = element.textContent?.trim() || '';
    return textContent.length >= this.CONFIG.minTextLength;
  }

  /**
   * Check if element is special (has specific attributes indicating it's a block)
   */
  private static isSpecialElement(element: Element): boolean {
    // Check for data attributes that indicate blocks
    return element.hasAttribute('data-block-type') ||
           element.hasAttribute('data-fillable') ||
           element.classList.contains('fillable-gap');
  }

  /**
   * Generate parsing metadata
   */
  private static generateMetadata(
    doc: Document,
    blocks: ArticleBlock[],
    parsingTime: number
  ): HtmlParseResult['metadata'] {
    const blockTypes: Record<string, number> = {};
    const totalElements = doc.querySelectorAll('*').length;

    blocks.forEach(block => {
      blockTypes[block.type] = (blockTypes[block.type] || 0) + 1;
    });

    // Determine if structure is complex
    const hasComplexStructure =
      totalElements > 100 ||
      blocks.length > 20 ||
      Object.keys(blockTypes).length > 5 ||
      blocks.some(b => b.items && b.items.length > 0);

    return {
      totalElements,
      blockTypes,
      hasComplexStructure,
      parsingTime: Math.round(parsingTime * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Create empty result for error cases
   */
  private static createEmptyResult(): HtmlParseResult {
    return {
      blocks: [],
      metadata: {
        totalElements: 0,
        blockTypes: {},
        hasComplexStructure: false,
        parsingTime: 0,
      },
    };
  }
}

/**
 * Convenience function to parse HTML to blocks
 */
export const parseHtmlToBlocks = (html: string): ArticleBlock[] => {
  return HtmlParser.parseHtml(html).blocks;
};

/**
 * Convenience function with detailed result
 */
export const parseHtmlWithMetadata = (html: string): HtmlParseResult => {
  return HtmlParser.parseHtml(html);
};

/**
 * Parse blocks that need filling (replacement for identifyFillableBlocks)
 */
export const identifyFillableBlocks = (blocks: ArticleBlock[]): ArticleBlock[] => {
  return blocks.filter(block =>
    ['header', 'paragraph', 'quote', 'card', 'callout'].includes(block.type) &&
    block.content &&
    block.content.trim().length > 5
  );
};
