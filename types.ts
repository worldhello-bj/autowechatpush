
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
  TABLE = 'table'
}

export interface ArticleBlock {
  id: string;
  type: BlockType;
  content: string; // Text content or Image URL
  title?: string; // For Card/Header
  style?: 'default' | 'primary' | 'warning' | 'quote' | 'red' | 'blue' | 'purple' | 'orange' | 'gold' | 'green' | 'pink' | 'cyan' | 'gradient';
  items?: string[]; // For List/Numbered List
  level?: 1 | 2 | 3 | '1' | '2' | '3'; // For Header (h1, h2, h3) - accepts number or string
  alignment?: 'left' | 'center' | 'right'; // For text alignment
  language?: string; // For Code blocks
  icon?: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'note'; // For Callout
  rows?: string[][]; // For Table
  headers?: string[]; // For Table headers
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
