
export enum BlockType {
  HEADER = 'header',
  PARAGRAPH = 'paragraph',
  IMAGE = 'image',
  CARD = 'card',
  LIST = 'list',
  QUOTE = 'quote'
}

export interface ArticleBlock {
  id: string;
  type: BlockType;
  content: string; // Text content or Image URL
  title?: string; // For Card/Header
  style?: 'default' | 'primary' | 'warning' | 'quote';
  items?: string[]; // For List
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
