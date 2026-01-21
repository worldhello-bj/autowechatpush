
/**
 * Shared AI Tool Definitions
 * defining the schema for structured article generation
 */

// Common block properties definition used across AI services
export const ARTICLE_BLOCK_SCHEMA = {
    type: "object",
    properties: {
        type: {
            type: "string",
            enum: ["header", "paragraph", "card", "list", "quote", "image", "divider", "code", "callout", "numbered_list", "highlight", "table", "qrcode", "faq", "countdown", "progress", "gift", "contact", "stats", "testimonial", "steps", "svg"],
            description: "Block type. Use 'header' for section titles, 'paragraph' for body text, 'card' for key points, 'list' for bullets, 'numbered_list' for steps, 'quote' for citations, 'image' for visual placeholders, 'divider' for section breaks, 'code' for code snippets, 'callout' for notices, 'highlight' for emphasized text, 'table' for structured data, 'svg' for decorative SVG graphics. Special types: 'qrcode' for QR code sections, 'faq' for Q&A blocks, 'countdown' for timers, 'progress' for progress bars, 'gift' for promotional boxes, 'contact' for contact info, 'stats' for statistics display, 'testimonial' for user reviews, 'steps' for step-by-step flows."
        },
        content: { type: "string", description: "The main text content. For images, this is the description/prompt. For divider, this can be empty. For svg, provide SVG code or description." },
        title: { type: "string", description: "Title for card, header, callout, gift, faq, or table blocks." },
        items: {
            type: "array",
            items: { type: "string" },
            description: "List items for 'list' or 'numbered_list' types. Also used for FAQ questions or step descriptions."
        },
        style: {
            type: "string",
            enum: ["default", "primary", "warning", "quote", "red", "blue", "purple", "orange", "gold", "green", "pink", "cyan", "gradient"],
            description: "Visual style color. Use varied colors for different sections."
        },
        level: { type: "number", enum: [1, 2, 3], description: "Header level (1=large, 2=medium, 3=small). Only for 'header' type." },
        alignment: { type: "string", enum: ["left", "center", "right"], description: "Text alignment." },
        language: { type: "string", description: "Programming language for 'code' blocks." },
        icon: { type: "string", enum: ["info", "warning", "success", "error", "tip", "note"], description: "Icon type for 'callout' blocks." },
        rows: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Table data rows for 'table' type." },
        headers: { type: "array", items: { type: "string" }, description: "Table header row for 'table' type." },
        // New properties for special blocks
        values: { type: "array", items: { type: "string" }, description: "Values for stats blocks (e.g., ['1000+', '50%', '99%'])." },
        labels: { type: "array", items: { type: "string" }, description: "Labels for stats/progress/steps blocks (e.g., ['用户数', '增长率', '满意度'])." },
        answers: { type: "array", items: { type: "string" }, description: "Answers for FAQ blocks, matching items array." },
        countdown: { type: "object", description: "Countdown values: {days, hours, minutes, seconds}." },
        percentage: { type: "number", description: "Progress percentage (0-100) for progress blocks." },
        author: { type: "string", description: "Author name for testimonial blocks." },
        role: { type: "string", description: "Author role/position for testimonial blocks." },
        // Typography properties for emphasis
        fontSize: {
            type: "string",
            enum: ["small", "normal", "large", "xlarge"],
            description: "Font size for visual hierarchy. Use 'large' or 'xlarge' for important text, 'small' for footnotes or secondary info."
        },
        fontWeight: {
            type: "string",
            enum: ["normal", "bold", "light"],
            description: "Font weight for emphasis. Use 'bold' for key points and important statements."
        },
        fontStyle: {
            type: "string",
            enum: ["normal", "italic"],
            description: "Font style. Use 'italic' for quotes, emphasis, or foreign words."
        }
    },
    required: ["type", "content"]
};

// Parameter schema for layout_article tool
export const LAYOUT_ARTICLE_PARAMETERS = {
    type: "object",
    properties: {
        title: { type: "string", description: "The main title of the article." },
        digest: { type: "string", description: "A short summary (digest) of the article." },
        blocks: {
            type: "array",
            description: "The content blocks of the article. Use diverse block types for visual variety.",
            items: ARTICLE_BLOCK_SCHEMA
        }
    },
    required: ["title", "digest", "blocks"]
};

/**
 * OpenAI-compatible tool definition for layout_article
 */
export const LAYOUT_ARTICLE_TOOL_DEF = {
    type: "function",
    function: {
        name: "layout_article",
        description: "Generates a structured layout for a WeChat article based on content. Use various block types for rich formatting.",
        parameters: LAYOUT_ARTICLE_PARAMETERS
    }
};
