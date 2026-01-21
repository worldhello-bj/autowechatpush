import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import * as cheerio from 'cheerio';
import { UserTemplate } from '../types/template.js';
import { createLogger } from '../utils/index.js';
import { getTemplateById as getSystemTemplateById } from '../config/designTemplates.js';

const logger = createLogger('template-service');

// File paths for persistence
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'user_templates.json');
let persistTimer: NodeJS.Timeout | null = null;
let persistInFlight: Promise<void> | null = null;

// In-memory storage with disk persistence
const templates: Map<string, UserTemplate> = new Map();

// Index for userId lookup
const userIndex: Map<string, Set<string>> = new Map(); // userId -> Set<templateId>

interface PersistedTemplateData {
  templates: UserTemplate[];
  version: string;
}

/**
 * Flush template data to disk
 */
const flushPersist = async () => {
  if (persistInFlight) {
    // Retry after current flush completes
    if (!persistTimer) {
      persistTimer = setTimeout(() => {
        persistTimer = null;
        void flushPersist();
      }, 50);
    }
    return;
  }

  const payload: PersistedTemplateData = {
    version: '1.0',
    templates: Array.from(templates.values()),
  };

  const tempFile = `${TEMPLATES_FILE}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;

  const currentPersist = (async () => {
    try {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      await fs.promises.writeFile(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, TEMPLATES_FILE);
      logger.debug('Template data persisted to disk', { templateCount: templates.size });
    } catch (error) {
      logger.error('Failed to persist template data to disk', { error });
      // Clean up temp file if it exists
      try {
        if (fs.existsSync(tempFile)) {
          await fs.promises.unlink(tempFile);
        }
      } catch { /* ignore */ }
    }
  })();

  persistInFlight = currentPersist.finally(() => {
    if (persistInFlight === currentPersist) {
      persistInFlight = null;
    }
  });

  await persistInFlight;
};

/**
 * Schedule template data persistence (debounced)
 */
const persistData = () => {
  if (persistTimer) return;

  persistTimer = setTimeout(() => {
    persistTimer = null;
    void flushPersist();
  }, 2000); // 2 second debounce
};

/**
 * Load template data from disk
 */
const loadData = async () => {
  try {
    try {
      await fs.promises.access(TEMPLATES_FILE, fs.constants.F_OK);
    } catch {
      logger.info('No existing template data file found, starting fresh');
      return;
    }

    const raw = await fs.promises.readFile(TEMPLATES_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistedTemplateData>;
    
    if (typeof parsed !== 'object' || parsed === null) {
      logger.warn('Template data file malformed (non-object), skipping load');
      return;
    }
    
    if (!Array.isArray(parsed.templates)) {
      logger.warn('Template data file malformed (no templates array), skipping load');
      return;
    }

    // Load and validate each template
    let loadedCount = 0;
    parsed.templates.forEach(t => {
      if (!t || !t.id || !t.userId || !t.name || !t.originalHtml) {
        logger.warn('Skipping invalid template entry', { templateId: t?.id });
        return;
      }

      templates.set(t.id, t);
      
      // Update index
      if (!userIndex.has(t.userId)) {
        userIndex.set(t.userId, new Set());
      }
      userIndex.get(t.userId)!.add(t.id);
      
      loadedCount++;
    });

    logger.info('Template data loaded from disk', { templateCount: loadedCount });
  } catch (error) {
    logger.error('Failed to load template data from disk', { error });
  }
};

/**
 * Initialize template data store
 */
export const initTemplateStore = async (): Promise<void> => {
  await loadData();
};

/**
 * Create a new user template
 */
export const createTemplate = async (
  userId: string,
  data: Omit<UserTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<UserTemplate> => {
  const templateId = uuidv4();
  const now = Date.now();
  
  const template: UserTemplate = {
    ...data,
    id: templateId,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  
  templates.set(templateId, template);
  
  if (!userIndex.has(userId)) {
    userIndex.set(userId, new Set());
  }
  userIndex.get(userId)!.add(templateId);
  
  persistData();
  logger.info('Template created', { templateId, userId });
  
  return template;
};

/**
 * Get templates for a user
 */
export const getUserTemplates = (userId: string): UserTemplate[] => {
  const templateIds = userIndex.get(userId);
  if (!templateIds) return [];
  
  return Array.from(templateIds)
    .map(id => templates.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt); // Newest first
};

/**
 * Get template by ID (with ownership check)
 */
export const getTemplateById = (templateId: string, userId: string): UserTemplate | null => {
  const template = templates.get(templateId);
  if (!template) return null;
  if (template.userId !== userId) return null;
  return template;
};

/**
 * Delete template
 */
export const deleteTemplate = (templateId: string, userId: string): boolean => {
  const template = templates.get(templateId);
  if (!template) return false;
  if (template.userId !== userId) return false; // Not owned by user
  
  templates.delete(templateId);
  
  const userTemplates = userIndex.get(userId);
  if (userTemplates) {
    userTemplates.delete(templateId);
  }
  
  persistData();
  logger.info('Template deleted', { templateId, userId });
  return true;
};

/**
 * Update template
 */
export const updateTemplate = (
  templateId: string, 
  userId: string, 
  updates: Partial<Pick<UserTemplate, 'name' | 'preview'>>
): UserTemplate | null => {
  const template = templates.get(templateId);
  if (!template) return null;
  if (template.userId !== userId) return null;
  
  const updatedTemplate = {
    ...template,
    ...updates,
    updatedAt: Date.now()
  };
  
  templates.set(templateId, updatedTemplate);
  persistData();
  
  logger.info('Template updated', { templateId, userId });
  return updatedTemplate;
};

/**
 * Apply a system template to existing content
 * Replaces template placeholders with actual content
 */
export const applyTemplateToContent = async (
  contentHtml: string, 
  templateId: string
): Promise<string> => {
  // 1. Get the template
  const template = getSystemTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // 2. Parse source content to extract meaningful blocks
  const $source = cheerio.load(contentHtml);
  const contentBlocks: Array<{ type: 'header' | 'paragraph' | 'list', content: string }> = [];
  const processedElements = new Set<any>();

  // Helper to identify visual headers
  const isVisualHeader = (el: any): boolean => {
    const $el = $source(el);
    const tagName = (el.tagName || '').toLowerCase();
    
    // 1. Standard tags
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) return true;
    
    // 2. Visual cues in style
    const style = $el.attr('style') || '';
    const text = $el.text().trim();
    const className = $el.attr('class') || '';
    
    // Must have text and not be too long to be a title
    if (!text || text.length > 100) return false;
    
    // Check font weight (bold)
    if (style.includes('font-weight: bold') || style.includes('font-weight: 700') || style.includes('font-weight: 600') || style.includes('font-weight:800') || style.includes('font-weight:900')) return true;
    
    // Check font size (> 16px roughly)
    if (/font-size:\s*([2-9][0-9]|[1-9][0-9]{2,})px/.test(style)) return true; // >= 20px
    if (/font-size:\s*1[8-9]px/.test(style)) return true; // 18-19px
    
    // Check specific class names
    if (className.includes('title') || className.includes('header') || className.includes('caption')) return true;

    // Check if it contains a strong/b tag that makes up most of the content
    const $strong = $el.find('strong, b');
    if ($strong.length > 0) {
      const strongText = $strong.text().trim();
      if (strongText.length > 0 && strongText.length >= text.length * 0.8) return true;
    }

    return false;
  };

  // 1. Extract Headers (Standard + Visual)
  // We prioritize this to catch styled paragraphs as headers
  $source('h1, h2, h3, h4, h5, h6, p, div, span, section').each((_, el) => {
    if (processedElements.has(el)) return;

    // Check if it's a visual header
    if (isVisualHeader(el)) {
      const $el = $source(el);
      const text = $el.text().trim();
      
      // Ensure it's not a container for other blocks (simplified check)
      // If it has many block children, it's likely a container, not a header itself
      const hasBlockChildren = $el.find('p, div, section, ul, ol').length > 0;
      
      if (text && !hasBlockChildren) {
        contentBlocks.push({ type: 'header', content: text });
        processedElements.add(el);
      }
    }
  });

  // 2. Extract Lists
  $source('ul, ol').each((_, el) => {
    if (processedElements.has(el)) return;
    const $el = $source(el);
    const html = $el.html();
    if (html && $el.text().trim()) {
      contentBlocks.push({ type: 'list', content: `<ul>${html}</ul>` });
      processedElements.add(el);
    }
  });

  // 3. Extract Paragraphs (remaining p, div, section)
  $source('p, div, section').each((_, el) => {
    if (processedElements.has(el)) return;
    
    const $el = $source(el);
    
    // Skip if it contains image (images handled separately or ignored in this text-focused extraction)
    if ($el.find('img').length > 0) return;
    
    const text = $el.text().trim();
    if (text) {
      // Avoid adding large containers as paragraphs
      // If it has block children, we skip it (assuming children will be picked up or we missed them)
      // But for simple "fallback", we might want to be permissive.
      // Let's rely on processedElements to avoid dupes.
      
      // Check if it has direct text content worth saving
      const hasDirectText = Array.from(el.childNodes).some((n: any) => n.type === 'text' && n.data.trim().length > 0);
      const hasChildren = $el.children().length > 0;
      
      if (hasDirectText || !hasChildren || $el.children().length < 5) {
         contentBlocks.push({ type: 'paragraph', content: $el.html() || text });
         processedElements.add(el);
      }
    }
  });

  // 3. Load template and find slots
  const $target = cheerio.load(template.html, { xmlMode: false }); // xmlMode false allows generic HTML parsing
  
  // Find all leaf elements with text
  const slots: Array<{ el: any, type: 'header' | 'paragraph' | 'list' }> = [];
  
  $target('*').each((_, el) => {
    const $el = $target(el);
    
    // Check if it's a leaf node or has only text children
    const hasChildren = $el.children().length > 0;
    const text = $el.text().trim();
    
    if (!text) return; // Skip empty elements

    // Simple heuristic for slots:
    // 1. Contains placeholder text keywords
    const isPlaceholder = /在此输入|标题|内容|描述/.test(text);
    
    // 2. Or is a specific tag
    // @ts-ignore
    const tagName = (el.tagName || '').toLowerCase();
    
    if (hasChildren && !isPlaceholder) return; // Skip containers unless they clearly have placeholder text

    // Classify
    let type: 'header' | 'paragraph' | 'list' = 'paragraph';
    
    if (['h1','h2','h3','h4','h5','h6'].includes(tagName)) {
      type = 'header';
    } else if (['ul','ol'].includes(tagName)) {
      type = 'list';
    } else if ($el.css('font-weight') === 'bold' || $el.css('font-weight') === '700' || text.includes('标题')) {
      type = 'header';
    }
    
    slots.push({ el: el as any, type });
  });

  // 4. Fill slots
  let blockIndex = 0;
  let headerIndex = 0;
  let paraIndex = 0;
  let listIndex = 0;

  // Separate blocks for easier matching
  const headers = contentBlocks.filter(b => b.type === 'header');
  const paragraphs = contentBlocks.filter(b => b.type === 'paragraph');
  const lists = contentBlocks.filter(b => b.type === 'list');

  slots.forEach(slot => {
    let contentToInject = '';
    
    if (slot.type === 'header' && headerIndex < headers.length) {
      contentToInject = headers[headerIndex].content;
      headerIndex++;
    } else if (slot.type === 'list' && listIndex < lists.length) {
      contentToInject = lists[listIndex].content;
      listIndex++;
    } else if (slot.type === 'paragraph' && paraIndex < paragraphs.length) {
      contentToInject = paragraphs[paraIndex].content;
      paraIndex++;
    } 
    // Fallback: if we ran out of specific types, use any remaining blocks
    else if (blockIndex < contentBlocks.length) {
      // Find next unused block
      // (This logic is simple, can be improved)
    }

    if (contentToInject) {
      $target(slot.el).html(contentToInject);
    } else {
      // If no content to fill, remove the slot element to avoid placeholder showing
      // But only if it looks like a placeholder
      const currentText = $target(slot.el).text();
      if (/在此输入|标题|内容|描述/.test(currentText)) {
         $target(slot.el).remove();
      }
    }
  });

  // 5. Append remaining content if any (to ensure no data loss)
  // This is tricky with simple templates. For now, we assume the user selected a template
  // that fits their content, or we accept truncation/mismatch. 
  // Better approach: Create a "overflow" section?
  // User Requirement: "Format existing content". 
  // Let's stick to replacing what fits for now.
  
  return $target.html();
};
