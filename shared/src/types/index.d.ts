export declare enum BlockType {
    HEADER = "header",
    PARAGRAPH = "paragraph",
    IMAGE = "image",
    CARD = "card",
    LIST = "list",
    QUOTE = "quote",
    DIVIDER = "divider",
    CODE = "code",
    CALLOUT = "callout",
    NUMBERED_LIST = "numbered_list",
    HIGHLIGHT = "highlight",
    TABLE = "table",
    QRCODE = "qrcode",// 二维码区域
    FAQ = "faq",// FAQ问答区
    COUNTDOWN = "countdown",// 倒计时
    PROGRESS = "progress",// 进度条
    GIFT = "gift",// 福利/优惠框
    CONTACT = "contact",// 联系方式
    STATS = "stats",// 数据统计卡片
    TESTIMONIAL = "testimonial",// 用户评价
    STEPS = "steps",// 步骤流程
    SVG = "svg"
}
export interface ArticleBlock {
    id: string;
    type: BlockType;
    content: string;
    title?: string;
    style?: 'default' | 'primary' | 'warning' | 'quote' | 'red' | 'blue' | 'purple' | 'orange' | 'gold' | 'green' | 'pink' | 'cyan' | 'gradient';
    items?: string[];
    level?: 1 | 2 | 3 | '1' | '2' | '3';
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
    countdown?: {
        days?: string;
        hours?: string;
        minutes?: string;
        seconds?: string;
    };
    percentage?: number;
    author?: string;
    role?: string;
}
export interface Article {
    title: string;
    author: string;
    digest: string;
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
export interface WeChatAuthorization {
    appId: string;
    authAppId: string;
    authorizationCode: string;
    expiresIn: number;
    refreshToken: string;
    funcInfo: number[];
}
export interface WeChatAccount {
    id: string;
    name: string;
    appId: string;
    appSecret?: string;
    isDefault: boolean;
    createdAt: string;
    lastUsed?: string;
    authorization?: WeChatAuthorization;
    authType: 'credentials' | 'authorization';
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
export declare enum AIProvider {
    DEEPSEEK = "deepseek",
    QWEN = "qwen"
}
export interface ContentBlock {
    index: number;
    type: 'title' | 'subtitle' | 'paragraph' | 'quote' | 'list-item';
    originalText: string;
    charLimit: number;
    domRef?: any;
}
export interface AIRewriteRequest {
    topic: string;
    blocks: Omit<ContentBlock, 'domRef'>[];
}
export interface AIRewriteResponse {
    blocks: {
        index: number;
        newContent: string;
    }[];
}
//# sourceMappingURL=index.d.ts.map