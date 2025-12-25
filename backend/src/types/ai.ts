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
