/**
 * Design Templates Library - 精美设计格式库
 *
 * A collection of pre-designed HTML templates for WeChat articles.
 * Each template provides beautiful, ready-to-use formatting.
 */
export interface DesignTemplate {
    id: string;
    name: string;
    nameZh: string;
    category: 'header' | 'card' | 'list' | 'quote' | 'callout' | 'divider' | 'special';
    preview: string;
    previewZh: string;
    html: string;
}
export declare const allTemplates: DesignTemplate[];
export declare const getTemplateById: (id: string) => DesignTemplate | undefined;
export declare const getTemplatesByCategory: (category: DesignTemplate["category"]) => DesignTemplate[];
//# sourceMappingURL=designTemplates.d.ts.map