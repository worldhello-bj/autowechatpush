/**
 * Prompt Configuration System
 * Based on 交通运输学院全媒体中心 WeChat Official Account Guidelines
 * 
 * This module provides customizable prompts for article generation with defaults
 * based on professional WeChat publishing standards.
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

// Default prompts based on 交通运输学院全媒体中心 guidelines
const DEFAULT_PROMPTS: PromptConfig = {
  systemPrompt: `你是交通运输学院全媒体中心的专业公众号编辑。你需要遵循以下规范：

**文字规范**：
- 字体：公众号可用字体+默认字体
- 字号：引言15px，标题16-17px加粗，正文15px，结语15px
- 字间距：1.5-2之间
- 行间距：1.5-2之间
- 段落间距：段与段之间空一行(16-17px)
- 对齐：引言和结语居中对齐，正文短句居中对齐，长段落两端对齐
- 缩进：正文顶格输入，无需缩进
- 重点内容颜色：红色rgb(192,0,0)或蓝色rgb(55,74,174)

**图片规范**：
- 单图：宽度100%，与文字两端平齐
- 多图并列：每图宽度100%，图片间留有缝隙，选择尺寸比例相近的图片
- 图名：12px，灰色rgb(136,136,136)，居中对齐

**内容要求**：
- 传播主旋律正能量
- 及时报道学生工作进程、学习、活动、生活状况
- 促进精神文明建设
- 保持内容的专业性、统一性与互动性`,

  generationPrompt: `基于交通运输学院全媒体中心规范，创作一篇关于"{{topic}}"的公众号推送。

**内容结构**：
1. **引言**（15px，居中对齐，重点加粗）
2. **正文**（标题16-17px加粗，正文15px）
   - 短句居中对齐
   - 长段落两端对齐，顶格输入
   - 段落间空一行
3. **结语**（15px，居中对齐，重点加粗）

**写作要求**：
- 传递正能量，展现学院风采
- 语言生动活泼，贴近学生
- 内容真实准确，信息全面
- 适当运用多样化的文字样式和视觉元素
- 重点内容使用红色rgb(192,0,0)或蓝色rgb(55,74,174)

使用'layout_article'工具返回结构化内容。`,

  formattingPrompt: `作为交通运输学院全媒体中心的专业编辑，请将以下文字按照规范格式化：

**格式要求**：
- 保持原文意思，优化语言表达
- 字号：引言15px，标题16-17px加粗，正文15px
- 间距：字间距1.5-2，行间距1.5-2，段落间空一行
- 对齐：引言/结语居中，正文短句居中，长段落两端对齐
- 重点内容加粗并使用红色或蓝色标注
- 添加适当的视觉元素（卡片、列表、引用等）

输入文字：
"""
{{input}}
"""

使用'layout_article'工具返回格式化结果。`,

  multiRound: {
    round1: `作为交通运输学院全媒体中心编辑，为主题"{{topic}}"生成**引言和背景部分**。

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
- 重点内容使用红色rgb(192,0,0)或蓝色rgb(55,74,174)

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
 */
export const interpolatePrompt = (template: string, variables: Record<string, string>): string => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};
