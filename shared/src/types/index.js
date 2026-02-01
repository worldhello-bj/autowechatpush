"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProvider = exports.BlockType = void 0;
var BlockType;
(function (BlockType) {
    BlockType["HEADER"] = "header";
    BlockType["PARAGRAPH"] = "paragraph";
    BlockType["IMAGE"] = "image";
    BlockType["CARD"] = "card";
    BlockType["LIST"] = "list";
    BlockType["QUOTE"] = "quote";
    BlockType["DIVIDER"] = "divider";
    BlockType["CODE"] = "code";
    BlockType["CALLOUT"] = "callout";
    BlockType["NUMBERED_LIST"] = "numbered_list";
    BlockType["HIGHLIGHT"] = "highlight";
    BlockType["TABLE"] = "table";
    // Special block types for advanced templates
    BlockType["QRCODE"] = "qrcode";
    BlockType["FAQ"] = "faq";
    BlockType["COUNTDOWN"] = "countdown";
    BlockType["PROGRESS"] = "progress";
    BlockType["GIFT"] = "gift";
    BlockType["CONTACT"] = "contact";
    BlockType["STATS"] = "stats";
    BlockType["TESTIMONIAL"] = "testimonial";
    BlockType["STEPS"] = "steps";
    BlockType["SVG"] = "svg"; // SVG图形/装饰
})(BlockType || (exports.BlockType = BlockType = {}));
var AIProvider;
(function (AIProvider) {
    AIProvider["DEEPSEEK"] = "deepseek";
    AIProvider["QWEN"] = "qwen";
})(AIProvider || (exports.AIProvider = AIProvider = {}));
//# sourceMappingURL=index.js.map