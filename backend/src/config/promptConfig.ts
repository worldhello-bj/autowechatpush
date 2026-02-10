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
- 使用section容器包裹内容：type:'section'创建带背景色和装饰的全宽区块，在children中放置paragraph、card、list、highlight等子blocks
- 灵活运用丰富的布局形式：用section容器包裹相关内容、card展示要点、highlight突出核心观点、callout做温馨提示、quote引用名言、table展示对比数据、numbered_list做步骤流程
- 每篇文章至少使用3-5个section容器，每个用不同颜色和装饰
- 每篇文章至少使用4-5种不同的颜色样式（如red、blue、purple、teal、indigo、amber、rose、gradient等）

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

    designPrompt: `作为微信公众号的专业视觉设计师和排版专家，请将以下文章内容转化为精美的"秀米风格"排版布局。

文章标题：{{title}}
文章摘要：{{digest}}

原始内容概览（共{{blockCount}}个内容块）：
{{blocks}}

你的专长是创建美观、引人入胜的文章布局，精通多种排版布局形式和模板设计。

🏗️ **核心布局模式：全文容器区块 (section)**
这是最重要的排版技巧！使用 type:'section' 创建带背景色和装饰的全宽容器，在容器内放置子blocks：

**section容器用法示例**：
\`\`\`json
{
  "type": "section",
  "title": "章节标题",
  "content": "",
  "style": "blue",
  "backgroundStyle": "solid",
  "decoration": "circles",
  "children": [
    { "type": "paragraph", "content": "段落文字..." },
    { "type": "card", "title": "要点", "content": "卡片内容...", "style": "blue" },
    { "type": "list", "content": "", "items": ["条目1", "条目2"], "style": "blue" }
  ]
}
\`\`\`

**section背景样式 (backgroundStyle)**：
- "solid"：纯色背景（使用style指定的颜色浅色背景）
- "gradient"：渐变背景（更丰富的视觉效果）
- "pattern"：带图案的背景

**section装饰 (decoration)**：
- "circles"：圆形气泡装饰（适合现代感设计）
- "dots"：点阵装饰（适合简约设计）
- "waves"：底部波浪效果（适合流畅感设计）
- "geometric"：几何形状装饰（适合科技感设计）
- "stars"：星标装饰（适合活泼设计）

**推荐的section布局组合**：
1. 📘 **知识要点型**：蓝色section + header子块 + 多个card子块
2. 🌿 **自然清新型**：绿色/teal section + circles装饰 + paragraph + list子块
3. 🎯 **重点强调型**：渐变section + highlight子块 + numbered_list子块
4. 💡 **提示说明型**：amber/gold section + dots装饰 + callout子块 + paragraph
5. 🏆 **成就展示型**：indigo section + geometric装饰 + card子块 (带数据)
6. 💭 **引用回顾型**：rose/pink section + waves装饰 + quote子块 + paragraph

**重要**：每篇文章应至少使用3-5个section容器，每个section用不同的颜色和装饰风格！

📐 **标题布局模式**（每种标题用不同风格）：
- 🎀 绸带式标题：彩色背景条 + 白字，左右带三角装饰
- 【】括号式标题：大号方括号 + 居中文字
- ▬ 渐变下划线标题：标题下方彩虹渐变线条
- 🔢 大号序号标题：圆角方块序号 + 标题文字并列
- 🏷️ 徽章式标题：圆角边框 + 顶部标签
- 📌 图钉式标题：装饰图标 + 加粗标题

📦 **内容卡片布局模式**：
- 💡 要点卡片：带图标和彩色左边框的要点总结
- 🎯 特色展示卡：圆角边框 + 彩色顶部条 + 图标标题
- 📊 数据卡片：大号数字 + 标签说明，多组并列
- 📝 信息卡片：浅色背景 + 标题 + 分条内容

📋 **列表布局模式**：
- ✅ 打勾清单：绿色对勾 + 水平分隔条目
- 🔢 编号步骤：圆形编号 + 步骤说明
- 💎 图标列表：emoji前缀 + 文字描述

💬 **引用和强调布局模式**：
- 📜 经典引用：灰色背景 + 左边框 + 斜体
- 🌟 高亮引用：浅色渐变背景 + 顶部彩色条
- ✨ 金句卡片：深色背景 + 居中大字 + 装饰线

📏 **分隔装饰布局模式**：
- ◆◆◆ 菱形装饰分隔
- ━━━ 渐变彩色条分隔
- 🌿•🌿 叶子装饰分隔
- ○●○ 圆形装饰分隔

**色彩设计要求**：
- 应用丰富的颜色（red, blue, purple, orange, gold, green, pink, cyan, teal, indigo, amber, rose, lime）
- 使用渐变效果（gradient, gradient_warm, gradient_cool, gradient_nature）
- 每篇文章使用至少6-8种不同的颜色
- 每个section容器拥有独立的颜色主题

**排版层次要求**：
- fontSize: 'xlarge' 用于醒目的数据和重要标题
- fontSize: 'large' 用于章节核心观点和引用
- fontSize: 'small' 用于脚注、备注和补充说明
- fontWeight: 'bold' 用于关键词和重点强调

**整体布局原则**：
- 优先使用section容器包裹内容，创建丰富的背景层次
- 不同的section使用不同的颜色和装饰，追求视觉节奏感
- section内部的子blocks选用不同类型，避免千篇一律
- 段落之间用不同风格的divider分隔
- 善用card、highlight、callout、quote等区块丰富版面

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
 * Valid prompt template type keys (excludes object-valued keys to prevent runtime bugs)
 */
type PromptTemplateType = 
  | 'systemPrompt' 
  | 'generationPrompt' 
  | 'formattingPrompt' 
  | 'templateImportPrompt' 
  | 'multiRound.round1' 
  | 'multiRound.round2' 
  | 'multiRound.round3' 
  | 'multiRound.round4' 
  | 'dualAI.contentPrompt' 
  | 'dualAI.designPrompt';

/**
 * Get prompt template by type
 * Excludes object-valued keys to prevent runtime bugs
 */
export const getPromptTemplate = (
  type: PromptTemplateType,
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
  return config[type as 'systemPrompt' | 'generationPrompt' | 'formattingPrompt' | 'templateImportPrompt'];
};
