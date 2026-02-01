import { z } from 'zod';

// AI Provider enum
export enum AIProvider {
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
}

// Block types for article structure
export enum BlockType {
  HEADER = 'header',
  PARAGRAPH = 'paragraph',
  IMAGE = 'image',
  CARD = 'card',
  LIST = 'list',
  QUOTE = 'quote',
  DIVIDER = 'divider',
  CODE = 'code',
  CALLOUT = 'callout',
  NUMBERED_LIST = 'numbered_list',
  HIGHLIGHT = 'highlight',
  TABLE = 'table',
  QRCODE = 'qrcode',
  FAQ = 'faq',
  COUNTDOWN = 'countdown',
  PROGRESS = 'progress',
  GIFT = 'gift',
  CONTACT = 'contact',
  STATS = 'stats',
  TESTIMONIAL = 'testimonial',
  STEPS = 'steps',
  SVG = 'svg',
}

// Article block structure
export interface ArticleBlock {
  id: string;
  type: BlockType;
  content: string;
  title?: string;
  style?: 'default' | 'primary' | 'warning' | 'quote' | 'red' | 'blue' | 'purple' | 'orange' | 'gold' | 'green' | 'pink' | 'cyan' | 'gradient';
  items?: string[];
  level?: 1 | 2 | 3;
  alignment?: 'left' | 'center' | 'right';
  language?: string;
  icon?: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'note';
  rows?: string[][];
  headers?: string[];
  fontSize?: 'small' | 'normal' | 'large' | 'xlarge';
  fontWeight?: 'normal' | 'bold' | 'light';
  fontStyle?: 'normal' | 'italic';
  values?: string[];
  labels?: string[];
  answers?: string[];
  countdown?: { days?: string; hours?: string; minutes?: string; seconds?: string };
  percentage?: number;
  author?: string;
  role?: string;
}

// AI Chat request schema
export const aiChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  provider: z.nativeEnum(AIProvider).default(AIProvider.DEEPSEEK),
  useSearch: z.boolean().default(false),
  imageContext: z.string().optional(),
  isFormattingMode: z.boolean().default(false),
  thinkingMode: z.boolean().default(false),
  multiRoundMode: z.boolean().default(false),
  userprompt: z.string().max(5000, 'User prompt too long (max 5000 characters)').optional(),
  template: z.any().optional(), // Article template structure for generation guidance
  useDualAI: z.boolean().default(false).optional(),
  dualAIPass: z.enum(['content', 'design']).optional(),
  contentSummary: z.object({
    title: z.string(),
    digest: z.string(),
    blockCount: z.number(),
    blocks: z.array(z.any())
  }).optional(),
});

export type AIChatRequest = z.infer<typeof aiChatRequestSchema>;

// AI Generation result
export interface GenerationResult {
  title: string;
  digest: string;
  blocks: ArticleBlock[];
  sources: GroundingSource[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// SSE Event types
export interface SSEEvent {
  type: 'thinking' | 'content' | 'block' | 'complete' | 'error' | 'info';
  data: unknown;
  timestamp: number;
}

// AI usage tracking
export interface AIUsage {
  userId: string;
  provider: AIProvider;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

// AI Key Pool types
export interface AIKeyConfig {
  key: string;
  name?: string;
  enabled: boolean;
  weight?: number; // Higher weight = more likely to be selected (for weighted selection)
  maxConcurrent?: number; // Max concurrent requests this key can handle
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
  };
}

export interface AIKeyPoolConfig {
  deepseek: AIKeyConfig[];
  qwen: AIKeyConfig[];
}

export interface KeyUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  currentConcurrent: number;
  lastUsed?: number; // timestamp
  lastError?: string;
}

// Content Block for DOM-based article rewriting
export interface ContentBlock {
  index: number;        // 原始顺序索引 (用于对齐)
  type: 'title' | 'subtitle' | 'paragraph' | 'quote' | 'list-item'; // 语义类型
  originalText: string; // 原文内容 (用于参考字数)
  charLimit: number;    // 建议字数限制 (原文长度 ±20%)
}

// AI Rewriting Request/Response schemas
export const aiRewriteRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
  blocks: z.array(z.object({
    index: z.number().min(0),
    type: z.enum(['title', 'subtitle', 'paragraph', 'quote', 'list-item']),
    originalText: z.string(),
    charLimit: z.number().min(1).max(10000)
  })).min(1, 'At least one block required').max(100, 'Too many blocks')
});

export type AIRewriteRequest = z.infer<typeof aiRewriteRequestSchema>;

export interface AIRewriteResponse {
  blocks: {
    index: number;
    newContent: string;
  }[];
}
