/**
 * Prompt Configuration System
 * Generic WeChat Official Account prompt configuration
 * Provides customizable prompts for article generation with defaults
 * based on common professional publishing standards.
 */

export interface PromptConfig {
  systemPrompt: string;
  generationPrompt: string;
  formattingPrompt: string;
  multiRound: {
    round1: string; // Background
    round2: string; // Main Content
    round3: string; // Images & Widgets
    round4: string; // Summary
  };
}

// Default prompts based on common WeChat publishing guidelines
const DEFAULT_PROMPTS: PromptConfig = {
  systemPrompt: `你是一名专业的公众号编辑。你需要遵循以下通用规范：

**文字规范**：
- 字体：官方可用字体或默认安全字体
- 字号：引言15px，标题16-17px加粗，正文15px，结语15px
- 行/段间距：1.5-2之间，段落之间空一行
- 对齐：引言/结语居中，正文短句居中，长段落两端对齐，正文顶格输入
- 重点内容：加粗或使用品牌主色强调

**图片规范**：
- 单图：宽度100%，与文字两端平齐
- 多图：比例相近并列，留出间距
- 图名：12px，浅灰色，居中对齐

**内容要求**：
- 传播正向、可信的信息
- 语言亲和、易读，保持专业与统一
- 合理使用视觉元素增强可读性`,

  generationPrompt: `基于通用公众号写作规范，创作一篇关于"{{topic}}"的推送。

**内容结构**：
1. **引言**（15px，居中对齐，重点加粗）
2. **正文**（标题16-17px加粗，正文15px）
   - 短句居中对齐
   - 长段落两端对齐，顶格输入
   - 段落间空一行
3. **结语**（15px，居中对齐，重点加粗）

**写作要求**：
- 保持真实准确，信息全面
- 语言生动亲和，贴近读者
- 合理运用多样化文字样式和视觉元素
- 重点内容使用加粗或品牌主色突出

使用'layout_article'工具返回结构化内容。`,

  formattingPrompt: `作为专业公众号编辑，请将以下文字按照规范格式化：

**格式要求**：
- 保持原文意思，优化语言表达
- 字号：引言15px，标题16-17px加粗，正文15px
- 间距：字间距1.5-2，行间距1.5-2，段落间空一行
- 对齐：引言/结语居中，正文短句居中，长段落两端对齐
- 重点内容加粗并使用品牌主色或强调色
- 添加适当的视觉元素（卡片、列表、引用等）

输入文字：
"""
{{input}}
"""

使用'layout_article'工具返回格式化结果。`,

  multiRound: {
    round1: `作为专业公众号编辑，为主题"{{topic}}"生成**引言和背景部分**。

**要求**：
- 引言：15px，居中对齐，2-3句话概括主题
- 背景：简要介绍活动/新闻背景，为什么重要
- 使用2-4个内容块（header、paragraph、card、callout类型）
- 重点内容加粗

保持简洁，这只是开头部分。`,

    round2: `继续"{{topic}}"的推送，生成**正文主体内容**。

前文已完成引言和背景。

**要求**：
- 标题：16-17px加粗
- 正文：15px，长段落两端对齐顶格输入，短句居中对齐
- 详细展开主题，包含关键信息和亮点
 - 使用多样化块类型（paragraph、card、list、numbered_list、quote、highlight）
- 重点内容使用加粗或品牌主色突出

不要重复背景，只提供新的正文内容块。`,

    round3: `为"{{topic}}"添加**图片和视觉元素**。

已完成：引言、背景和正文。

**要求**：
- 添加图片描述（image块）：生动具体的图片说明
- 视觉元素：divider分隔线、stats数据展示、progress进度条等
- 特殊组件：qrcode二维码、countdown倒计时、testimonial证言（如有需要）

只提供新的视觉/组件块，不重复前面内容。`,

    round4: `完成"{{topic}}"推送的**结语和总结**。

文章结构：引言、背景、正文、视觉元素已完成。

**要求**：
- 总结：提炼关键要点
- 结语：15px，居中对齐，正能量收尾
- 优化：提供精炼的最终标题和摘要
- 使用card、highlight、callout、quote块

同时提供最终标题和摘要（适合公众号预览）。`
  }
};

// Storage key for custom prompts
const STORAGE_KEY = 'wechat_custom_prompts';

/**
 * Load prompts from localStorage or return defaults
 */
export const loadPrompts = (): PromptConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_PROMPTS,
        ...parsed,
        multiRound: {
          ...DEFAULT_PROMPTS.multiRound,
          ...(parsed.multiRound || {})
        }
      };
    }
  } catch (error) {
    console.error('Failed to load custom prompts:', error);
  }
  return DEFAULT_PROMPTS;
};

/**
 * Save custom prompts to localStorage
 */
export const savePrompts = (prompts: PromptConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error('Failed to save custom prompts:', error);
  }
};

/**
 * Reset prompts to defaults
 */
export const resetPrompts = (): PromptConfig => {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_PROMPTS;
};

/**
 * Get default prompts (for reference/reset)
 */
export const getDefaultPrompts = (): PromptConfig => {
  return { ...DEFAULT_PROMPTS };
};

/**
 * Replace template variables in prompts
 * Uses simple string replacement to avoid ReDoS vulnerabilities
 */
export const interpolatePrompt = (template: string, variables: Record<string, string>): string => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    // Use split/join for safe replacement without regex
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
};
