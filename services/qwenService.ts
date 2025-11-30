
import { ArticleBlock, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";

const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation";

const tools = [
  {
    type: "function",
    function: {
      name: "layout_article",
      description: "Generates a structured layout for a WeChat article based on content. Use various block types for rich formatting.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The main title of the article." },
          digest: { type: "string", description: "A short summary (digest) of the article." },
          blocks: {
            type: "array",
            description: "The content blocks of the article. Use diverse block types for visual variety.",
            items: {
              type: "object",
              properties: {
                type: { 
                  type: "string", 
                  enum: ["header", "paragraph", "card", "list", "quote", "image", "divider", "code", "callout", "numbered_list", "highlight", "table", "qrcode", "faq", "countdown", "progress", "gift", "contact", "stats", "testimonial", "steps"], 
                  description: "Block type. Use 'header' for section titles, 'paragraph' for body text, 'card' for key points, 'list' for bullets, 'numbered_list' for steps, 'quote' for citations, 'image' for visual placeholders, 'divider' for section breaks, 'code' for code snippets, 'callout' for notices, 'highlight' for emphasized text, 'table' for structured data. Special types: 'qrcode' for QR code sections, 'faq' for Q&A blocks, 'countdown' for timers, 'progress' for progress bars, 'gift' for promotional boxes, 'contact' for contact info, 'stats' for statistics display, 'testimonial' for user reviews, 'steps' for step-by-step flows." 
                },
                content: { type: "string", description: "The main text content. For images, provide a description. For divider, this can be empty." },
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
                role: { type: "string", description: "Author role/position for testimonial blocks." }
              },
              required: ["type", "content"]
            }
          }
        },
        required: ["title", "digest", "blocks"]
      }
    }
  }
];

export const generateArticleStructureQwen = async (
  input: string,
  apiKey: string,
  useSearch: boolean,
  imageContext: string = "",
  isFormattingMode: boolean = false
): Promise<GenerationResult> => {
  if (!apiKey) {
    throw new Error("DashScope API Key is required for Qwen.");
  }

  let prompt = "";
  if (isFormattingMode) {
      prompt = `
        You are a professional WeChat Official Account editor.
        Your task is to take the provided text and format it into a structured WeChat article layout.
        
        Guidelines:
        - **Formatting**: Improve readability with proper structure.
        - **Visuals**: Use 'card' blocks for important summaries, 'highlight' for key phrases.
        - **Colors**: Assign varied colors (red, blue, purple, orange, green, pink, cyan, gradient) to sections to make it visually interesting.
        - **Rich Elements**: Use 'divider' between major sections, 'callout' for important notices, 'numbered_list' for steps, 'table' for structured data.
        - **Headers**: Use header levels (1, 2, 3) for proper hierarchy.
        
        Input Text:
        """
        ${input}
        """
        
        ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
        
        Call the function 'layout_article' to return the result.
      `;
  } else {
      prompt = `
        You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles.
        Your task is to write a high-quality article about: "${input}".
        
        ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
        
        Structure the article using the 'layout_article' tool with the following guidelines:
        - **Visual Variety**: Do NOT just use paragraphs. You MUST use 'card' blocks, 'highlight' for emphasis.
        - **Colors**: Use colors like 'red', 'blue', 'orange', 'purple', 'gold', 'green', 'pink', 'cyan', 'gradient' for Cards and Headers.
        - **Images**: Insert 'image' blocks. Content should be a description (e.g., "A neon city street").
        - **Rich Elements**: Use 'divider' between sections, 'callout' for tips/info/warnings, 'numbered_list' for steps, 'table' for data.
        - **Headers**: Use header levels (1=main, 2=sub, 3=minor) for hierarchy.
        - **Code**: Use 'code' blocks with language for any code snippets.
        
        Call the function 'layout_article' to return the result.
      `;
  }

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: "You are a helpful assistant that writes WeChat articles with colorful layouts." },
          { role: "user", content: prompt }
        ],
        tools: tools,
        tool_choice: "auto",
        enable_search: useSearch && !isFormattingMode
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Qwen API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (toolCall && toolCall.function.name === 'layout_article') {
        const args = JSON.parse(toolCall.function.arguments);
        const blocks = (args.blocks || []).map((b: any, index: number) => ({
            id: `qwen-${Date.now()}-${index}`,
            ...b
        }));

        return {
            title: args.title || "Untitled Article",
            digest: args.digest || "No summary available.",
            blocks,
            sources: [] 
        };
    }

    throw new Error("Qwen failed to generate structured content. Please try again.");

  } catch (error) {
    console.error("Qwen generation failed:", error);
    throw error;
  }
};

export const analyzeImageQwen = async (base64Image: string, mimeType: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("DashScope API Key is required.");

    try {
        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "qwen-vl-max",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this image in detail. Describe the scene, objects, text, and overall mood." },
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Qwen VL Error: ${err.error?.message}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Failed to analyze image.";

    } catch (error) {
        console.error("Qwen Image analysis failed:", error);
        throw error;
    }
};

export const generateSpeechQwen = async (text: string, apiKey: string): Promise<ArrayBuffer> => {
    if (!apiKey) throw new Error("DashScope API Key is required.");

    // Using Sambert-zh-v1 via DashScope REST API
    try {
        const response = await fetch(TTS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "sambert-zh-v1",
                input: {
                    text: text
                },
                parameters: {
                    format: "mp3",
                    sample_rate: 48000
                }
            })
        });

        if (!response.ok) {
             const err = await response.json();
             throw new Error(`Qwen TTS Error: ${err.message || response.statusText}`);
        }

        // DashScope TTS REST API returns the binary audio stream directly for sync calls
        const audioBuffer = await response.arrayBuffer();
        return audioBuffer;

    } catch (error) {
        console.error("Qwen TTS failed:", error);
        throw error;
    }
};

// --- Helper for Qwen API calls ---
const callQwenAPI = async (apiKey: string, messages: any[], temperature: number = 0.7, enableSearch: boolean = false): Promise<string> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "qwen-plus",
      messages,
      temperature,
      enable_search: enableSearch
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Qwen API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

// --- New AI Methods for Design Richness ---

/**
 * Generate multiple attractive title suggestions for an article
 */
export const generateTitleSuggestionsQwen = async (
  content: string,
  count: number = 5,
  apiKey: string
): Promise<string[]> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位专业的内容创作者，擅长为文章起吸引人的标题。" },
      { role: "user", content: `
        根据以下文章内容，生成 ${count} 个吸引人的标题建议，适合微信公众号文章使用。
        
        要求:
        - 每个标题都应独特，从不同角度捕捉内容
        - 标题应吸引眼球，适合中文社交媒体
        - 包含多种风格：信息型、情感型、提问型和惊喜型
        - 标题简洁（最好不超过30个字符）
        
        文章内容:
        """
        ${content.slice(0, 2000)}
        """
        
        只返回JSON数组格式，如: ["标题1", "标题2", ...]
      ` }
    ], 0.8);

    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("Qwen title generation failed:", error);
    throw error;
  }
};

/**
 * Generate a concise summary/digest for an article
 */
export const generateSummaryQwen = async (
  content: string,
  maxLength: number = 120,
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位专业的编辑，擅长撰写简洁有力的文章摘要。" },
      { role: "user", content: `
        为以下文章内容生成一个简洁且引人入胜的摘要，适合作为微信文章的简介/描述。
        
        要求:
        - 最多${maxLength}个字符
        - 抓住文章的核心要点
        - 要有吸引力，鼓励读者点击阅读
        - 使用与内容相同的语言
        
        文章内容:
        """
        ${content.slice(0, 3000)}
        """
        
        只返回摘要文本，不要其他任何内容。
      ` }
    ], 0.5);

    return text.trim();
  } catch (error) {
    console.error("Qwen summary generation failed:", error);
    throw error;
  }
};

/**
 * Expand a paragraph or section with more details
 */
export const expandContentQwen = async (
  content: string,
  style: 'detailed' | 'examples' | 'storytelling' = 'detailed',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  const stylePrompts = {
    detailed: '添加更多详细的解释、事实和深度内容。',
    examples: '用具体的案例、实例和实际应用来扩展内容。',
    storytelling: '使用叙事技巧、轶事和故事元素来扩展内容。'
  };

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位专业的内容作家，擅长扩展和丰富文章内容。" },
      { role: "user", content: `
        扩展以下内容，同时保持其核心信息和语调。
        
        扩展风格: ${stylePrompts[style]}
        
        原始内容:
        """
        ${content}
        """
        
        要求:
        - 扩展到原始长度的2-3倍
        - 保持原有的声音和风格
        - 添加有价值的信息，而不是填充词
        - 保持适合微信文章的格式
        
        只返回扩展后的内容，不要其他任何内容。
      ` }
    ], 0.7);

    return text.trim() || content;
  } catch (error) {
    console.error("Qwen content expansion failed:", error);
    throw error;
  }
};

/**
 * Polish and improve content style and grammar
 */
export const polishContentQwen = async (
  content: string,
  tone: 'professional' | 'casual' | 'formal' | 'creative' = 'professional',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  const toneDescriptions = {
    professional: '专业、清晰、权威',
    casual: '友好、对话式、亲切',
    formal: '正式、学术、严谨',
    creative: '创意、生动、富有文学性'
  };

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位专业的编辑，擅长润色和改进文章内容。" },
      { role: "user", content: `
        润色并改进以下内容，使其更加${toneDescriptions[tone]}。
        
        原始内容:
        """
        ${content}
        """
        
        要求:
        - 修正任何语法或拼写错误
        - 改进句子结构和流畅性
        - 优化用词以增强表达效果
        - 保持原意
        - 保持大致相同的长度
        
        只返回润色后的内容，不要其他任何内容。
      ` }
    ], 0.5);

    return text.trim() || content;
  } catch (error) {
    console.error("Qwen content polish failed:", error);
    throw error;
  }
};

/**
 * Extract keywords from content for SEO purposes
 */
export const extractKeywordsQwen = async (
  content: string,
  count: number = 10,
  apiKey: string
): Promise<string[]> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位SEO专家，擅长从文章中提取关键词。" },
      { role: "user", content: `
        从以下内容中提取${count}个最重要的关键词或关键短语。
        这些关键词应该适用于SEO和内容标签。
        
        内容:
        """
        ${content.slice(0, 3000)}
        """
        
        要求:
        - 包括单个词和短语
        - 关注主题、主题和重要概念
        - 按相关性和搜索潜力排序
        
        只返回JSON数组格式，如: ["关键词1", "关键词2", ...]
      ` }
    ], 0.3);

    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("Qwen keyword extraction failed:", error);
    throw error;
  }
};

/**
 * Translate content between Chinese and English
 */
export const translateContentQwen = async (
  content: string,
  targetLanguage: 'zh' | 'en',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  const targetLangName = targetLanguage === 'zh' ? '简体中文' : '英文';

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位专业的翻译专家，精通中英双语。" },
      { role: "user", content: `
        将以下内容翻译成${targetLangName}。
        
        内容:
        """
        ${content}
        """
        
        要求:
        - 提供自然流畅的翻译
        - 保持原有的语调和风格
        - 保留任何格式标记
        - 适当地转换习语和表达
        
        只返回翻译后的内容，不要其他任何内容。
      ` }
    ], 0.3);

    return text.trim() || content;
  } catch (error) {
    console.error("Qwen translation failed:", error);
    throw error;
  }
};

/**
 * Suggest visual styles based on content theme
 */
export interface StyleSuggestion {
  style: string;
  reason: string;
  colorScheme: string[];
  mood: string;
}

export const suggestStylesQwen = async (
  content: string,
  apiKey: string
): Promise<StyleSuggestion[]> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位设计专家，擅长为文章推荐视觉样式。" },
      { role: "user", content: `
        分析以下文章内容，为微信文章推荐合适的视觉样式。
        
        内容:
        """
        ${content.slice(0, 2000)}
        """
        
        返回一个包含3个样式建议的JSON数组。每个建议应包含:
        - style: 主要样式名称（如"professional"、"playful"、"elegant"、"tech"、"nature"）
        - reason: 简要说明为什么这个样式适合
        - colorScheme: 3-4个推荐颜色的数组（使用如"blue"、"red"、"gold"等名称）
        - mood: 这个样式传达的整体氛围
        
        可用颜色: red, blue, purple, orange, gold, green, pink, cyan, gradient
        
        只返回有效的JSON数组，如:
        [{"style": "...", "reason": "...", "colorScheme": ["...", "..."], "mood": "..."}, ...]
      ` }
    ], 0.6);

    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("Qwen style suggestion failed:", error);
    throw error;
  }
};

/**
 * Generate an engaging article opening/hook
 */
export const generateHookQwen = async (
  topic: string,
  style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising' = 'question',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  const styleDescriptions = {
    question: '以一个发人深省的问题开头，吸引读者的注意',
    story: '以一个简短而引人入胜的轶事或小故事开头',
    statistic: '以一个令人惊讶或有影响力的统计数据或事实开头',
    quote: '以一句鼓舞人心或相关的名言开头',
    surprising: '以一个令人惊讶或反直觉的陈述开头'
  };

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位创意写手，擅长撰写引人入胜的文章开头。" },
      { role: "user", content: `
        为一篇关于 "${topic}" 的文章生成一个引人入胜的开头/钩子。
        
        风格: ${styleDescriptions[style]}
        
        要求:
        - 保持简洁（2-4句话）
        - 立即吸引读者
        - 创造继续阅读的好奇心
        - 适合微信文章的受众
        
        只返回开头段落，不要其他任何内容。
      ` }
    ], 0.8);

    return text.trim();
  } catch (error) {
    console.error("Qwen hook generation failed:", error);
    throw error;
  }
};

/**
 * Generate a compelling call-to-action for article ending
 */
export const generateCTAQwen = async (
  articleContext: string,
  ctaType: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection' = 'share',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  const ctaDescriptions = {
    subscribe: '鼓励读者关注/订阅账号',
    share: '鼓励读者分享文章给他人',
    comment: '鼓励读者留言评论并参与讨论',
    action: '鼓励读者采取与内容相关的具体行动',
    reflection: '以一个反思性的想法或问题结束，供读者思考'
  };

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位营销专家，擅长撰写有吸引力的行动号召。" },
      { role: "user", content: `
        为一篇具有以下上下文的文章生成一个有吸引力的行动号召结尾:
        """
        ${articleContext.slice(0, 1000)}
        """
        
        CTA类型: ${ctaDescriptions[ctaType]}
        
        要求:
        - 保持自然，不要太商业化
        - 与文章内容相关
        - 温暖且有吸引力
        - 最多2-3句话
        
        只返回CTA文本，不要其他任何内容。
      ` }
    ], 0.7);

    return text.trim();
  } catch (error) {
    console.error("Qwen CTA generation failed:", error);
    throw error;
  }
};

/**
 * Rewrite content in a different style or perspective
 */
export const rewriteContentQwen = async (
  content: string,
  newStyle: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DashScope API Key is required.");

  const styleDescriptions = {
    humorous: '诙谐、有趣，带有适当的幽默和轻松的语调',
    serious: '严肃、深思熟虑，有分量和深度',
    inspirational: '鼓舞人心、有激励性，带有情感共鸣',
    educational: '信息性强、清晰，有结构化的解释',
    conversational: '友好、随意，像和朋友聊天一样'
  };

  try {
    const text = await callQwenAPI(apiKey, [
      { role: "system", content: "你是一位多才多艺的作家，擅长将内容改写成不同的风格。" },
      { role: "user", content: `
        将以下内容改写成${styleDescriptions[newStyle]}的风格。
        
        原始内容:
        """
        ${content}
        """
        
        要求:
        - 完全转变语调和风格
        - 保持核心信息和事实
        - 保持大致相同的长度
        - 使其适合微信文章格式
        
        只返回改写后的内容，不要其他任何内容。
      ` }
    ], 0.8);

    return text.trim() || content;
  } catch (error) {
    console.error("Qwen content rewrite failed:", error);
    throw error;
  }
};
