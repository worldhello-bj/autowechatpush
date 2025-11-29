
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
  STEPS = 'steps'              // 步骤流程
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
  GOOGLE = 'google',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen'
}
