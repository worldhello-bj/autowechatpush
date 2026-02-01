"use strict";
/**
 * Design Templates Library - 精美设计格式库
 *
 * A collection of pre-designed HTML templates for WeChat articles.
 * Each template provides beautiful, ready-to-use formatting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplatesByCategory = exports.getTemplateById = exports.allTemplates = void 0;
// --- Beautiful Header Templates ---
const headerTemplates = [
    {
        id: 'header-ribbon',
        name: 'Ribbon Header',
        nameZh: '绸带标题',
        category: 'header',
        preview: 'Elegant ribbon-style section header',
        previewZh: '优雅的绸带风格章节标题',
        html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="display: inline-block; position: relative; padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-size: 18px; font-weight: bold; border-radius: 4px;">
          <section style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-right: 10px solid #667eea;"></section>
          <section style="position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-left: 10px solid #764ba2;"></section>
          在此输入标题
        </section>
      </section>
    `
    },
    {
        id: 'header-bracket',
        name: 'Bracket Header',
        nameZh: '括号标题',
        category: 'header',
        preview: 'Modern bracket-style header',
        previewZh: '现代括号风格标题',
        html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="display: inline-flex; align-items: center; gap: 12px;">
          <section style="font-size: 32px; color: #07c160; font-weight: 300;">【</section>
          <section style="font-size: 20px; font-weight: bold; color: #333; letter-spacing: 2px;">在此输入标题</section>
          <section style="font-size: 32px; color: #07c160; font-weight: 300;">】</section>
        </section>
      </section>
    `
    },
    {
        id: 'header-number',
        name: 'Number Header',
        nameZh: '数字标题',
        category: 'header',
        preview: 'Minimalist numbered header',
        previewZh: '极简数字标题',
        html: `
      <section style="margin: 30px 0 16px;">
        <section style="display: flex; align-items: baseline; border-bottom: 2px solid #333; padding-bottom: 8px;">
          <section style="font-size: 40px; font-weight: 900; color: #eee; line-height: 1; margin-right: 10px; -webkit-text-stroke: 1px #333;">01</section>
          <section style="font-size: 18px; font-weight: bold; color: #333;">在此输入章节标题</section>
        </section>
      </section>
    `
    },
    {
        id: 'header-underline',
        name: 'Underline Header',
        nameZh: '下划线标题',
        category: 'header',
        preview: 'Simple underline header with accent color',
        previewZh: '带强调色的简单下划线标题',
        html: `
      <section style="margin: 24px 0; display: inline-block;">
        <section style="font-size: 18px; font-weight: bold; color: #333; position: relative; z-index: 1;">
          在此输入标题
          <section style="position: absolute; bottom: 0; left: 0; width: 100%; height: 8px; background-color: rgba(255, 215, 0, 0.5); z-index: -1;"></section>
        </section>
      </section>
    `
    }
];
// --- Card Templates ---
const cardTemplates = [
    {
        id: 'card-glass',
        name: 'Glassmorphism Card',
        nameZh: '毛玻璃卡片',
        category: 'card',
        preview: 'Trendy glassmorphism effect card',
        previewZh: '流行的毛玻璃效果卡片',
        html: `
      <section style="margin: 20px 0; padding: 24px; background: rgba(255, 255, 255, 0.7); border-radius: 16px; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1); border: 1px solid rgba(255, 255, 255, 0.18); overflow: hidden;">
        <section style="font-size: 16px; color: #333; line-height: 1.8;">
          在此输入卡片内容。这里可以放置重要的信息、总结或者引用的段落。
        </section>
      </section>
    `
    },
    {
        id: 'card-shadow',
        name: 'Soft Shadow Card',
        nameZh: '柔和阴影卡片',
        category: 'card',
        preview: 'Clean card with soft shadow',
        previewZh: '干净的柔和阴影卡片',
        html: `
      <section style="margin: 20px 0; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);">
        <section style="font-size: 16px; color: #4a5568; line-height: 1.75;">
          在此输入卡片内容。
        </section>
      </section>
    `
    },
    {
        id: 'card-border',
        name: 'Bordered Card',
        nameZh: '边框卡片',
        category: 'card',
        preview: 'Card with dashed border',
        previewZh: '虚线边框卡片',
        html: `
      <section style="margin: 20px 0; padding: 20px; border: 2px dashed #cbd5e0; border-radius: 8px; background-color: #f7fafc;">
        <section style="font-size: 16px; color: #2d3748; line-height: 1.75;">
          在此输入卡片内容。
        </section>
      </section>
    `
    }
];
// --- Quote Templates ---
const quoteTemplates = [
    {
        id: 'quote-modern',
        name: 'Modern Quote',
        nameZh: '现代引用',
        category: 'quote',
        preview: 'Left border quote style',
        previewZh: '左侧边框引用风格',
        html: `
      <section style="margin: 20px 0; padding-left: 16px; border-left: 4px solid #3182ce; background-color: #ebf8ff; padding: 16px; border-radius: 0 8px 8px 0;">
        <section style="font-size: 16px; color: #2c5282; font-style: italic; line-height: 1.8;">
          "在此输入名言或重点引用内容。"
        </section>
      </section>
    `
    },
    {
        id: 'quote-center',
        name: 'Centered Quote',
        nameZh: '居中引用',
        category: 'quote',
        preview: 'Centered serif quote',
        previewZh: '居中衬线体引用',
        html: `
      <section style="margin: 30px 40px; text-align: center;">
        <section style="font-size: 48px; color: #e2e8f0; line-height: 0.5; font-family: serif;">"</section>
        <section style="font-size: 18px; color: #4a5568; font-family: 'Songti SC', serif; font-weight: bold; line-height: 1.8; margin: 10px 0;">
          在此输入引用内容
        </section>
        <section style="font-size: 14px; color: #a0aec0; margin-top: 10px;">—— 作者/来源</section>
      </section>
    `
    }
];
// --- Callout Templates ---
const calloutTemplates = [
    {
        id: 'callout-info',
        name: 'Info Callout',
        nameZh: '信息提示',
        category: 'callout',
        preview: 'Blue information box',
        previewZh: '蓝色信息框',
        html: `
      <section style="margin: 16px 0; padding: 16px; background-color: #eff6ff; border-radius: 8px; display: flex; gap: 12px; align-items: flex-start;">
        <section style="font-size: 20px;">💡</section>
        <section style="font-size: 15px; color: #1e40af; line-height: 1.6;">
          <span style="font-weight: bold;">提示：</span>在此输入提示信息。
        </section>
      </section>
    `
    },
    {
        id: 'callout-warning',
        name: 'Warning Callout',
        nameZh: '警告提示',
        category: 'callout',
        preview: 'Yellow warning box',
        previewZh: '黄色警告框',
        html: `
      <section style="margin: 16px 0; padding: 16px; background-color: #fffbeb; border-radius: 8px; display: flex; gap: 12px; align-items: flex-start;">
        <section style="font-size: 20px;">⚠️</section>
        <section style="font-size: 15px; color: #92400e; line-height: 1.6;">
          <span style="font-weight: bold;">注意：</span>在此输入需要注意的重要事项。
        </section>
      </section>
    `
    }
];
// --- Divider Templates ---
const dividerTemplates = [
    {
        id: 'divider-dots',
        name: 'Dots Divider',
        nameZh: '圆点分割线',
        category: 'divider',
        preview: 'Three minimalist dots',
        previewZh: '三个极简圆点',
        html: `
      <section style="margin: 40px 0; text-align: center;">
        <section style="display: inline-block; width: 6px; height: 6px; background-color: #cbd5e0; border-radius: 50%; margin: 0 4px;"></section>
        <section style="display: inline-block; width: 6px; height: 6px; background-color: #cbd5e0; border-radius: 50%; margin: 0 4px;"></section>
        <section style="display: inline-block; width: 6px; height: 6px; background-color: #cbd5e0; border-radius: 50%; margin: 0 4px;"></section>
      </section>
    `
    },
    {
        id: 'divider-line',
        name: 'Line Divider',
        nameZh: '线条分割线',
        category: 'divider',
        preview: 'Gradient line with icon',
        previewZh: '带图标的渐变线条',
        html: `
      <section style="margin: 40px 0; display: flex; align-items: center; justify-content: center;">
        <section style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #e2e8f0);"></section>
        <section style="margin: 0 16px; color: #cbd5e0; font-size: 12px;">✦</section>
        <section style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, #e2e8f0);"></section>
      </section>
    `
    }
];
exports.allTemplates = [
    ...headerTemplates,
    ...cardTemplates,
    ...quoteTemplates,
    ...calloutTemplates,
    ...dividerTemplates
];
const getTemplateById = (id) => {
    return exports.allTemplates.find(t => t.id === id);
};
exports.getTemplateById = getTemplateById;
const getTemplatesByCategory = (category) => {
    return exports.allTemplates.filter(t => t.category === category);
};
exports.getTemplatesByCategory = getTemplatesByCategory;
//# sourceMappingURL=designTemplates.js.map