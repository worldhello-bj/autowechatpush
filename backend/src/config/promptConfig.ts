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

**核心排版规则**：
- 所有文章内容必须使用section容器嵌套模式
- 文章由多个section块组成，每个section包含背景色、装饰和children子块
- paragraph、card、list、quote等内容块只能作为section的children，不能独立放在顶层
- 只有divider和image可以放在顶层blocks数组中

**文字规范**：
- 字体：官方可用字体或默认安全字体
- 字号：引言15px，标题16-17px加粗，正文15px，结语15px
- 字间距：letter-spacing: 1px
- 行/段间距：line-height: 1.75，段落之间空一行
- 对齐：引言/结语居中，正文短句居中，长段落两端对齐，正文顶格输入
- 重点内容：加粗或使用品牌主色强调

**微信公众号HTML结构规范**：
- 文本段落使用 <p><span>文字内容</span></p> 结构
- 布局容器使用 <section> 标签，包含背景色和装饰
- 段落间使用 <p><span><br></span></p> 空段落控制间距
- 所有样式使用内联style属性
- 图片使用 <section> 包裹 <img> 标签

**图片规范**：
- 单图：宽度100%，与文字两端平齐
- 多图：比例相近并列，留出间距
- 图名：12px，浅灰色，居中对齐

**内容要求**：
- 传播正向、可信的信息
- 语言亲和、易读，保持专业与统一
- 合理使用视觉元素增强可读性`,

  generationPrompt: `基于通用公众号写作规范，创作一篇关于"{{topic}}"的推送。

**核心排版规则——section容器嵌套是默认输出方式**：
所有内容必须放在section容器内！文章的blocks数组应由多个section块组成，每个section用children包裹子blocks。
不要在顶层直接放paragraph、card等块，必须嵌套在section内部。只有divider和image可以放在顶层。

**文章结构（全部使用section容器）**：
1. **引言section**（style:"blue", decoration:"waves"）→ children中放paragraph（居中，15px）
2. **正文section×2-3个**（每个不同颜色和装饰）→ children中放header + paragraph/card/list/highlight等
3. **结语section**（style:"gradient_warm", decoration:"stars"）→ children中放paragraph + quote

**section容器格式**：
\`\`\`json
{
  "type": "section",
  "title": "章节标题",
  "content": "",
  "style": "blue",
  "backgroundStyle": "solid",
  "decoration": "circles",
  "children": [
    { "type": "header", "content": "小标题", "level": 2, "style": "blue" },
    { "type": "paragraph", "content": "正文内容..." },
    { "type": "card", "title": "要点", "content": "卡片内容...", "style": "blue" }
  ]
}
\`\`\`

**写作要求**：
- 保持真实准确，语言生动亲和
- 重点内容使用加粗或品牌主色突出
- 每个section使用不同的style颜色（red、blue、purple、teal、indigo、amber、rose、green、gradient_warm等）
- 每个section使用不同的decoration装饰（circles、dots、waves、geometric、stars）
- section内children使用多样化类型：paragraph、card、list、numbered_list、highlight、callout、quote

使用'layout_article'工具返回结构化内容。`,

  formattingPrompt: `作为专业公众号编辑，请将以下文字按照规范格式化：

**核心规则**：所有内容必须放在section容器内，不要在顶层直接放paragraph等块。只有divider和image可以放在顶层。

**格式要求**：
- 保持原文意思，优化语言表达
- 字号：引言15px，标题16-17px加粗，正文15px
- 间距：字间距1.5-2，行间距1.5-2，段落间空一行
- 对齐：引言/结语居中，正文短句居中，长段落两端对齐
- 重点内容加粗并使用品牌主色或强调色
- 将内容组织成多个section容器，每个section用不同颜色和装饰
- section的children中放paragraph、card、list、highlight等子块

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

**核心规则**：所有内容必须放在section容器内，不要在顶层直接放paragraph等块。

**要求**：
- 用1个section容器包裹引言（style:"blue", decoration:"waves"）
  - children中放paragraph（居中对齐，2-3句话概括主题）
- 用1个section容器包裹背景（style:"teal", decoration:"dots"）
  - children中放header + paragraph + card/callout
- 重点内容加粗

保持简洁，这只是开头部分。`,

    round2: `继续"{{topic}}"的推送，生成**正文主体内容**。

前文已完成引言和背景。

**核心规则**：所有内容必须放在section容器内。每个section用不同颜色和装饰。

**要求**：
- 用2-3个section容器组织正文（每个用不同style和decoration）
  - section的children中放header + paragraph/card/list/numbered_list/highlight/quote
- 重点内容使用加粗或品牌主色突出

不要重复背景，只提供新的正文section块。`,

    round3: `为"{{topic}}"添加**图片和视觉元素**。

已完成：引言、背景和正文。

**要求**：
- 添加image块和divider块（这两种可放在顶层section之间）
- 视觉元素：stats数据展示、progress进度条等（放在section容器的children中）

只提供新的视觉/组件块，不重复前面内容。`,

    round4: `完成"{{topic}}"推送的**结语和总结**。

文章结构：引言、背景、正文、视觉元素已完成。

**核心规则**：结语内容必须放在section容器内。

**要求**：
- 用1个section容器包裹结语（style:"gradient_warm", decoration:"stars"）
  - children中放highlight（总结要点）+ quote（结语金句）+ paragraph（正能量收尾）
- 提供精炼的最终标题和摘要

同时提供最终标题和摘要（适合公众号预览）。`
  },
  
  dualAI: {
    contentPrompt: `作为微信公众号的专业内容创作者，请为以下主题创作一篇高质量文章：

主题：{{topic}}
{{imageContext}}

你的专长是创作引人入胜的故事，使用多样化的写作风格和丰富的语言表达。

**核心排版规则——section容器嵌套是默认输出方式**：
所有内容必须放在section容器内！文章的blocks数组应由多个section块组成，每个section用children包裹子blocks。
不要在顶层直接放paragraph、card等块。只有divider和image可以放在顶层。

请专注于：
- **清晰、引人注目的写作**：使用多样化的句式结构
- **故事叙述技巧**：包含引子、冲突、解决方案、情感线索
- **丰富的语言**：比喻、类比、修辞性问题、生动的描述
- **节奏和韵律**：混合使用简短有力的句子和流畅的长句
- **引人入胜的开头**：每个章节以吸引注意力的开场白开始

要求：
- 创建4-6个section容器，每个section是一个章节，用不同颜色(style)和装饰(decoration)
- 每个section的children中放header（章节标题）+ 多个paragraph/card/list/highlight/quote等子blocks
- 变化句式结构以增加阅读节奏感
- 添加情感触动点和可共鸣的场景

**section容器示例**：
\`\`\`json
{
  "type": "section", "title": "引人入胜的标题", "content": "",
  "style": "blue", "backgroundStyle": "solid", "decoration": "circles",
  "children": [
    { "type": "header", "content": "标题", "level": 2 },
    { "type": "paragraph", "content": "正文..." },
    { "type": "card", "title": "要点", "content": "内容...", "style": "blue" }
  ]
}
\`\`\`

使用'layout_article'工具返回结构化内容。`,

    designPrompt: `作为微信公众号的专业视觉设计师和排版专家，请将以下文章内容转化为精美的"秀米风格"排版布局。

文章标题：{{title}}
文章摘要：{{digest}}

原始内容概览（共{{blockCount}}个内容块）：
{{blocks}}

你的专长是创建美观、引人入胜的文章布局，精通多种排版布局形式和模板设计。

⚠️ **最重要的规则：section容器嵌套是默认且唯一的输出方式**
所有内容都必须包裹在section容器中！blocks数组中只能是section、divider、image这三种顶层类型。
paragraph、card、list、quote、highlight、callout、header等只能作为section的children子块，绝不单独放在顶层。

**正确的文章结构**（必须遵循）：
\`\`\`json
{
  "blocks": [
    {
      "type": "section", "title": "引言", "content": "", "style": "blue",
      "backgroundStyle": "solid", "decoration": "waves",
      "children": [
        { "type": "paragraph", "content": "引言文字...", "alignment": "center" }
      ]
    },
    { "type": "divider", "content": "", "style": "gradient" },
    {
      "type": "section", "title": "第一章", "content": "", "style": "teal",
      "backgroundStyle": "solid", "decoration": "circles",
      "children": [
        { "type": "header", "content": "章节标题", "level": 2, "style": "teal" },
        { "type": "paragraph", "content": "正文..." },
        { "type": "card", "title": "要点", "content": "卡片内容...", "style": "teal" },
        { "type": "list", "content": "", "items": ["条目1", "条目2"], "style": "teal" }
      ]
    },
    { "type": "divider", "content": "", "style": "rose" },
    {
      "type": "section", "title": "第二章", "content": "", "style": "indigo",
      "backgroundStyle": "gradient", "decoration": "geometric",
      "children": [
        { "type": "header", "content": "章节标题", "level": 2, "style": "indigo" },
        { "type": "highlight", "content": "核心观点...", "style": "indigo" },
        { "type": "numbered_list", "content": "", "items": ["步骤1", "步骤2"] }
      ]
    },
    {
      "type": "section", "title": "结语", "content": "", "style": "gradient_warm",
      "backgroundStyle": "gradient", "decoration": "stars",
      "children": [
        { "type": "quote", "content": "结语金句...", "style": "gradient_warm" },
        { "type": "paragraph", "content": "感谢阅读...", "alignment": "center" }
      ]
    }
  ]
}
\`\`\`

**❌ 错误做法**（绝对不允许）：
\`\`\`json
{
  "blocks": [
    { "type": "header", "content": "标题" },
    { "type": "paragraph", "content": "正文" },
    { "type": "card", "title": "要点", "content": "..." }
  ]
}
\`\`\`
以上是错误的！header、paragraph、card不能直接放在顶层blocks数组中。

**section背景样式 (backgroundStyle)**：solid（纯色）、gradient（渐变）、pattern（图案）

**section装饰 (decoration)**：circles、dots、waves、geometric、stars

**推荐的section布局组合**：
1. 📘 蓝色section(solid/circles) → header + card×2-3
2. 🌿 绿色/teal section(solid/dots) → paragraph + list
3. 🎯 渐变section(gradient/geometric) → highlight + numbered_list
4. 💡 amber/gold section(solid/dots) → callout + paragraph
5. 🏆 indigo section(gradient/geometric) → card(数据) + paragraph
6. 💭 rose section(solid/waves) → quote + paragraph
7. 🔥 gradient_warm section(gradient/stars) → highlight + paragraph

**子blocks类型说明**（只能放在section的children中）：
- header：章节标题（level: 1/2/3）
- paragraph：正文段落
- card：要点卡片（有title和content）
- list / numbered_list：列表/步骤
- highlight：强调文字
- callout：提示框
- quote：引用

**色彩要求**：每个section必须使用不同的style颜色！
可选颜色：red, blue, purple, orange, gold, green, pink, cyan, teal, indigo, amber, rose, lime, gradient, gradient_warm, gradient_cool, gradient_nature

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
