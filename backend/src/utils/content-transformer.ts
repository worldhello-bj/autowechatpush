/**
 * Content Transformer
 * Implements the Transform layer of the pipeline: Input → Config → Transform → Inline → Output
 * Provides utilities for converting content to styled HTML following best practices
 */

import { ThemeConfig, applyThemeToStyles } from '../config/theme-config.js';
import { injectDecorator, getDecorator, type SVGDecorator } from '../config/svg-decorators.js';

/**
 * Content Block Interface
 * Represents a structured content unit that can be transformed
 */
export interface ContentBlock {
  type: 'header' | 'paragraph' | 'image' | 'list' | 'quote' | 'divider';
  content: string;
  level?: number;
  decorator?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Transform Configuration
 */
export interface TransformConfig {
  theme: ThemeConfig;
  simplifyDOM?: boolean;        // Reduce nesting depth
  maxNestingLevel?: number;     // Limit section nesting
  preserveWhitespace?: boolean; // Keep original spacing
}

/**
 * Content Transformer Class
 * Implements the transformation pipeline
 */
export class ContentTransformer {
  private config: TransformConfig;
  private styles: ReturnType<typeof applyThemeToStyles>;
  
  constructor(config: TransformConfig) {
    this.config = config;
    this.styles = applyThemeToStyles(config.theme);
  }
  
  /**
   * Transform a content block to HTML
   * Main transformation method
   */
  transform(block: ContentBlock): string {
    switch (block.type) {
      case 'header':
        return this.transformHeader(block);
      case 'paragraph':
        return this.transformParagraph(block);
      case 'image':
        return this.transformImage(block);
      case 'list':
        return this.transformList(block);
      case 'quote':
        return this.transformQuote(block);
      case 'divider':
        return this.transformDivider(block);
      default:
        return `<p>${block.content}</p>`;
    }
  }
  
  /**
   * Transform header with optional decorator
   */
  private transformHeader(block: ContentBlock): string {
    const content = this.escapeHtml(block.content);

    const headerHtml = this.config.simplifyDOM
      ? `<div style="${this.styles.section}">
  <span style="${this.styles.title}">${content}</span>
</div>`
      : `<section style="${this.styles.section}">
  <span style="${this.styles.title}">${content}</span>
</section>`;

    if (block.decorator) {
      const decorator = getDecorator(block.decorator);
      if (decorator) {
        return injectDecorator(headerHtml, decorator, decorator.position || 'before');
      }
    }

    return headerHtml;
  }
  
  /**
   * Transform paragraph
   */
  private transformParagraph(block: ContentBlock): string {
    const content = block.content;
    
    // If content is already HTML (from WeChat sections), preserve it
    if (this.isHtml(content)) {
      return content;
    }
    
    // Otherwise wrap in paragraph
    const escaped = this.escapeHtml(content);
    return `<p style="margin: 10px 0; line-height: ${this.config.theme.typography.lineHeight}; color: ${this.config.theme.colors.textMain};">${escaped}</p>`;
  }
  
  /**
   * Transform image
   */
  private transformImage(block: ContentBlock): string {
    const src = block.content;
    return `<section style="${this.styles.section} text-align: center;">
      <img src="${src}" style="max-width: 100%; height: auto; border-radius: ${this.config.theme.spacing.borderRadius};" />
    </section>`;
  }
  
  /**
   * Transform list
   */
  private transformList(block: ContentBlock): string {
    // Parse list items (assume newline-separated)
    const items = block.content.split('\n').filter(item => item.trim());
    
    const listItems = items.map(item => {
      const escaped = this.escapeHtml(item);
      return `<li style="margin: 5px 0;">${escaped}</li>`;
    }).join('');
    
    return `<ul style="margin: 10px 0; padding-left: 20px;">${listItems}</ul>`;
  }
  
  /**
   * Transform quote/callout
   */
  private transformQuote(block: ContentBlock): string {
    const escaped = this.escapeHtml(block.content);
    return `<section style="margin: ${this.config.theme.spacing.sectionMargin}; padding: ${this.config.theme.spacing.contentPadding}; background-color: ${this.config.theme.colors.primaryBg}; border-left: 4px solid ${this.config.theme.colors.accentRed}; border-radius: ${this.config.theme.spacing.borderRadius};">
      <p style="margin: 0; font-style: italic; color: ${this.config.theme.colors.textMain};">${escaped}</p>
    </section>`;
  }
  
  /**
   * Transform divider
   */
  private transformDivider(block: ContentBlock): string {
    return `<section style="height: 1px; background: linear-gradient(to right, transparent, ${this.config.theme.colors.borderColor}, transparent); margin: 20px 0;"></section>`;
  }
  
  /**
   * Wrap all content in root container
   */
  wrapInContainer(content: string): string {
    return `<section style="${this.styles.container}">${content}</section>`;
  }
  
  /**
   * Simplify DOM structure by reducing nesting
   * Implements the "avoid deep nesting" best practice
   */
  simplifyStructure(html: string): string {
    if (!this.config.simplifyDOM) {
      return html;
    }
    
    // Remove redundant nested sections
    let simplified = html;
    const maxLevel = this.config.maxNestingLevel || 3;
    
    // This is a simplified version - in production, use proper HTML parser
    // to count and flatten nesting levels
    
    return simplified;
  }
  
  /**
   * Utility: Check if string contains HTML tags
   */
  private isHtml(str: string): boolean {
    return /<[^>]+>/.test(str);
  }
  
  /**
   * Utility: Escape HTML special characters
   */
  private escapeHtml(str: string): string {
    const div = { textContent: str };
    // In Node.js, we'll use a simple replacement
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * Pipeline function: Transform array of blocks to complete HTML
 */
export const transformContent = (
  blocks: ContentBlock[],
  config: TransformConfig
): string => {
  const transformer = new ContentTransformer(config);
  
  // Transform each block
  const transformedBlocks = blocks.map(block => transformer.transform(block));
  
  // Join all blocks
  const content = transformedBlocks.join('\n');
  
  // Wrap in container
  const wrapped = transformer.wrapInContainer(content);
  
  // Optionally simplify structure
  return transformer.simplifyStructure(wrapped);
};
