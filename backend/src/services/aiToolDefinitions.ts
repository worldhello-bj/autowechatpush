
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
            enum: ["header", "paragraph", "card", "list", "quote", "image", "divider", "code", "callout", "numbered_list", "highlight", "table", "qrcode", "faq", "countdown", "progress", "gift", "contact", "stats", "testimonial", "steps", "svg", "section"],
            description: "Block type. DEFAULT: Use 'section' as the primary container — every article should be composed of section blocks with children inside. Only 'divider' and 'image' should appear at the top level outside sections. 'section' creates a full-width background container with colored background, decorations, and nested child blocks (paragraph, card, list, header, highlight, quote, callout, numbered_list). Other types (header, paragraph, card, list, quote, code, callout, numbered_list, highlight, table, svg, faq, stats, testimonial, steps, progress, gift, contact, countdown, qrcode) should only be used as children inside a section container."
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
            enum: ["default", "primary", "warning", "quote", "red", "blue", "purple", "orange", "gold", "green", "pink", "cyan", "gradient", "teal", "indigo", "amber", "rose", "lime", "gradient_warm", "gradient_cool", "gradient_nature"],
            description: "Visual style color. Use varied colors for different sections to create rich, vibrant articles. Gradient variants (gradient_warm, gradient_cool, gradient_nature) add modern flair."
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
        // Container section properties
        children: {
            type: "array",
            description: "Child blocks nested inside a 'section' container. Each child is a regular block (paragraph, card, list, header, highlight, quote, etc.) rendered on top of the section's background. Use this to create rich layouts with colored backgrounds containing multiple content blocks.",
            items: {
                type: "object",
                properties: {
                    type: { type: "string", enum: ["header", "paragraph", "card", "list", "quote", "divider", "callout", "numbered_list", "highlight", "image"] },
                    content: { type: "string" },
                    title: { type: "string" },
                    items: { type: "array", items: { type: "string" } },
                    style: { type: "string", enum: ["default", "primary", "warning", "quote", "red", "blue", "purple", "orange", "gold", "green", "pink", "cyan", "gradient", "teal", "indigo", "amber", "rose", "lime", "gradient_warm", "gradient_cool", "gradient_nature"] },
                    level: { type: "number", enum: [1, 2, 3] },
                    alignment: { type: "string", enum: ["left", "center", "right"] },
                    icon: { type: "string", enum: ["info", "warning", "success", "error", "tip", "note"] },
                    fontSize: { type: "string", enum: ["small", "normal", "large", "xlarge"] },
                    fontWeight: { type: "string", enum: ["normal", "bold", "light"] },
                    fontStyle: { type: "string", enum: ["normal", "italic"] }
                },
                required: ["type", "content"]
            }
        },
        backgroundStyle: {
            type: "string",
            enum: ["solid", "gradient", "pattern"],
            description: "Background style for 'section' blocks. 'solid' uses the style color as background, 'gradient' uses gradient background, 'pattern' adds decorative patterns."
        },
        decoration: {
            type: "string",
            description: "Background decoration for 'section' blocks. Describe the decoration pattern, e.g., 'circles', 'dots', 'waves', 'geometric', 'stars'."
        },
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
            description: "The content blocks of the article. IMPORTANT: Use 'section' containers as the primary structure — all content (paragraphs, cards, lists, quotes, highlights) must be nested as children inside section blocks. Only 'divider' and 'image' may appear at the top level. Each section has its own background color, decoration, and contains multiple child blocks.",
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
        description: "Generates a structured layout for a WeChat article. The article must be composed primarily of 'section' container blocks — each section has a background color, decoration, and contains nested child blocks (paragraphs, cards, lists, etc.). Only dividers and images may appear outside sections.",
        parameters: LAYOUT_ARTICLE_PARAMETERS
    }
};
