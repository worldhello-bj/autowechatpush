/**
 * Prompt Configuration System
 * 
 * Centralized prompt management for WeChat AI Publisher.
 * All prompts are stored and managed on the backend to prevent
 * network exposure and enable centralized administration.
 */

export interface PromptConfig {
  systemPrompt: string;
  generationPrompt: string;
  formattingPrompt: string;
  templateImportPrompt: string; // Template-based content generation
  multiRound: {
    round1: string; // Background
    round2: string; // Main Content
    round3: string; // Images & Widgets
    round4: string; // Summary
  };
  dualAI: {
    contentPrompt: string; // Dual AI Pass 1: Content generation
    designPrompt: string;  // Dual AI Pass 2: Design beautification
  };
}

// Default prompts based on common WeChat publishing guidelines
export const DEFAULT_PROMPTS: PromptConfig = {
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

  templateImportPrompt: `请根据主题"{{topic}}"生成纯中文文字内容。

**要求**：
- 只输出纯汉字文字，不要包含任何标点符号、空格、HTML标签或其他特殊字符
- 内容要与主题相关，符合公众号文章风格
- 文字长度要与原始内容相当（约{{charCount}}个汉字）
- 语言要自然流畅，适合公众号阅读
- 直接输出文字内容，不要有任何解释或格式

新内容：`,

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
  },
  
  dualAI: {
    contentPrompt: `作为微信公众号的专业内容创作者，请为以下主题创作一篇高质量文章：

主题：{{topic}}
{{imageContext}}

你的专长是创作引人入胜的故事，使用多样化的写作风格和丰富的语言表达。

请专注于：
- **清晰、引人注目的写作**：使用多样化的句式结构
- **故事叙述技巧**：包含引子、冲突、解决方案、情感线索
- **丰富的语言**：比喻、类比、修辞性问题、生动的描述
- **节奏和韵律**：混合使用简短有力的句子和流畅的长句
- **引人入胜的开头**：每个章节以吸引注意力的开场白开始
- **易于理解的例子**：使用读者能够产生共鸣的场景
- **准确的信息**：以娱乐的方式呈现
- **文化相关性**：适合中文受众，使用恰当的成语和典故

要求：
- 创建3-5个结构良好的章节，标题要有创意、吸引眼球
- 使用多样化的写作技巧：讲故事、比喻、修辞性问题
- 变化句式结构以增加阅读节奏感
- 为每个章节提炼关键要点，使用易记的措辞
- 添加情感触动点和可共鸣的场景
- 提取相关关键词用于SEO

使用'layout_article'工具返回结构化内容。`,

    designPrompt: `作为微信公众号的专业视觉设计师和创意作者，请将以下文章内容转化为精美的"秀米风格"排版布局。

文章标题：{{title}}
文章摘要：{{digest}}

原始内容概览（共{{blockCount}}个内容块）：
{{blocks}}

你的专长是创建美观、引人入胜的文章布局，使用丰富多样的内容呈现方式和排版设计。

请专注于：
- **视觉多样性**：使用不同的区块类型（卡片、提示框、引用、高亮、表格）
- **丰富的色彩设计**：应用鲜艳的颜色（red, blue, purple, orange, gold, green, pink, cyan, gradient）
- **卓越的排版**：使用不同的字体大小和粗细建立视觉层次：
  - fontSize: 'xlarge' 用于醒目的标题和关键统计数据
  - fontSize: 'large' 用于重要观点和令人难忘的引用
  - fontSize: 'small' 用于脚注和次要信息
  - fontWeight: 'bold' 用于关键短语和强调
  - fontStyle: 'italic' 用于引用和特殊术语
- **语言多样性**：使用多样化的句式结构和引人入胜的措辞增强内容
- **适当的视觉层次**：有效使用标题、副标题和强调区块
- **引人入胜的格式**：添加表情图标、创意标题和吸引注意力的元素
- **移动端友好的布局**：确保在移动设备上的可读性

要求：
- 使用至少4-5种不同的颜色以实现视觉多样性
- 应用排版变化（如上所述）
- 为关键点使用卡片，配以创意、吸引人的标题
- 使用适当级别的标题（1、2、3）和引人入胜的语言
- 在章节之间添加不同样式的分隔线
- 为重要提示使用提示框，配以相关的表情图标
- 为令人难忘的陈述或励志句子添加引用区块
- 为令人惊讶的事实或关键短语使用高亮区块
- 使每个章节在视觉上具有独特性，拥有自己的颜色主题和排版
- 变化内容呈现方式：混合简短有力的陈述和详细的解释

使用'layout_article'工具返回优化后的完整文章结构。`
  }
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

/**
 * Get prompt template by type
 */
export const getPromptTemplate = (
  type: keyof PromptConfig | 'multiRound.round1' | 'multiRound.round2' | 'multiRound.round3' | 'multiRound.round4' | 'dualAI.contentPrompt' | 'dualAI.designPrompt',
  config: PromptConfig = DEFAULT_PROMPTS
): string => {
  if (type.startsWith('multiRound.')) {
    const round = type.split('.')[1] as keyof typeof config.multiRound;
    return config.multiRound[round];
  }
  if (type.startsWith('dualAI.')) {
    const dualAIType = type.split('.')[1] as keyof typeof config.dualAI;
    return config.dualAI[dualAIType];
  }
  return config[type as keyof PromptConfig] as string;
};
