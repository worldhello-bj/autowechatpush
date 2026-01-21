
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
  // Special block types for advanced templates
  QRCODE = 'qrcode',           // 二维码区域
  FAQ = 'faq',                 // FAQ问答区
  COUNTDOWN = 'countdown',     // 倒计时
  PROGRESS = 'progress',       // 进度条
  GIFT = 'gift',               // 福利/优惠框
  CONTACT = 'contact',         // 联系方式
  STATS = 'stats',             // 数据统计卡片
  TESTIMONIAL = 'testimonial', // 用户评价
  STEPS = 'steps',             // 步骤流程
  SVG = 'svg'                  // SVG图形/装饰
}

export interface ArticleBlock {
  id: string;
  type: BlockType;
  content: string; // Text content or Image URL
  title?: string; // For Card/Header
  style?: 'default' | 'primary' | 'warning' | 'quote' | 'red' | 'blue' | 'purple' | 'orange' | 'gold' | 'green' | 'pink' | 'cyan' | 'gradient';
  items?: string[]; // For List/Numbered List, FAQ questions, step descriptions
  level?: 1 | 2 | 3 | '1' | '2' | '3'; // For Header (h1, h2, h3) - accepts number or string
  alignment?: 'left' | 'center' | 'right'; // For text alignment
  language?: string; // For Code blocks
  icon?: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'note'; // For Callout
  rows?: string[][]; // For Table
  headers?: string[]; // For Table headers
  // Typography properties for emphasis
  fontSize?: 'small' | 'normal' | 'large' | 'xlarge'; // Font size variation
  fontWeight?: 'normal' | 'bold' | 'light'; // Font weight for emphasis
  fontStyle?: 'normal' | 'italic'; // Italic text
  // New properties for special blocks
  values?: string[]; // For stats blocks (e.g., ['1000+', '50%', '99%'])
  labels?: string[]; // For stats/progress blocks (e.g., ['用户数', '增长率', '满意度'])
  answers?: string[]; // For FAQ blocks, matching items array
  countdown?: { days?: string; hours?: string; minutes?: string; seconds?: string }; // For countdown blocks
  percentage?: number; // For progress blocks (0-100)
  author?: string; // For testimonial blocks
  role?: string; // For testimonial blocks (author role/position)
}

export interface Article {
  title: string;
  author: string;
  digest: string; // Summary
  coverImage: string;
  blocks: ArticleBlock[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  description: string;
  tags: string[];
}

export interface WeChatCredentials {
  appId: string;
  appSecret: string;
}

export interface WeChatAccount {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  isDefault: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface WechatPayload {
  articles: {
    title: string;
    author: string;
    digest: string;
    content: string;
    content_source_url?: string;
    thumb_media_id: string;
    need_open_comment?: number;
    only_fans_can_comment?: number;
  }[];
}

export enum AIProvider {
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen'
}

// Content Block for DOM-based article rewriting
export interface ContentBlock {
  index: number;        // 原始顺序索引 (用于对齐)
  type: 'title' | 'subtitle' | 'paragraph' | 'quote' | 'list-item'; // 语义类型
  originalText: string; // 原文内容 (用于参考字数)
  charLimit: number;    // 建议字数限制 (原文长度 ±20%)
  domRef?: Element;     // DOM节点引用 (仅在内存中保留，不发给AI)
}

// AI Rewriting Request/Response types
export interface AIRewriteRequest {
  topic: string;        // 新主题
  blocks: Omit<ContentBlock, 'domRef'>[]; // 不包含DOM引用的内容块
}

export interface AIRewriteResponse {
  blocks: {
    index: number;
    newContent: string;
  }[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    quota: number;
    role: 'user' | 'admin';
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  quota: number;
  role: 'user' | 'admin';
}

export interface GenerationRequest {
  message: string;
  provider?: 'google' | 'deepseek' | 'qwen';
  useSearch?: boolean;
  imageContext?: string;
  isFormattingMode?: boolean;
  thinkingMode?: boolean;
  multiRoundMode?: boolean;
  userprompt?: string;
  template?: any;
}

export interface GenerationResult {
  title: string;
  digest: string;
  blocks: ArticleBlock[];
  sources: Array<{ title: string; uri: string }>;
}

export interface AIHelperResponse {
  action: string;
  result: string | string[] | Array<{style: string; preview: string}>;
  provider: string;
}

export interface SSECallbacks {
  onThinking?: (data: { message: string }) => void;
  onBlock?: (block: ArticleBlock) => void;
  onComplete?: (data: { title: string; digest: string; totalBlocks: number; sources: Array<{ title: string; uri: string }> }) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export interface MaterialMetadata {
  id: string;
  type: 'image' | 'video' | 'gif' | 'svg';
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif' | 'svg';
  filename: string;
  size: number;
}

export interface ListMaterialsResponse {
  materials: MaterialMetadata[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type MaterialTypeValue = 'image' | 'video' | 'gif' | 'svg';

export interface QuotaStatus {
  userId: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  resetDate: string;
  expiryDate?: string;
}

export interface UsageRecord {
  id: string;
  type: 'ai_generation' | 'material_upload' | 'ai_stream';
  cost: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface UsageStats {
  period: 'day' | 'week' | 'month';
  total: number;
  byType: Record<string, number>;
}

export interface TextRegion {
  id: string;
  index: number;
  type: string;
  originalText: string;
  chineseSequence: string;
  htmlContent: string;
  level?: number;
  marker: string;
  generatedChinese?: string;
}

export interface UserTemplate {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;
  sourceUrl?: string;
  originalHtml: string; 
  textRegions: TextRegion[]; 
  svgBlocks?: Array<{id: string, content: string}>;
  statistics?: {
    totalBlocks: number;
    textRegions: number;
    imageBlocks: number;
    codeBlocks: number;
  };
}

export interface ArticleDraft {
  id: string;
  userId: string;
  title: string;
  digest: string;
  content: string;
  topic?: string;
  createdAt: number;
  updatedAt: number;
}
