
import { ArticleBlock, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';
import { safeParseJSON } from './jsonParser';
import { generateArticleViaBackend, callAIHelper, type StyleSuggestion } from './backendAIClient';

const logger = loggers.qwen;

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
                  enum: ["header", "paragraph", "card", "list", "quote", "image", "divider", "code", "callout", "numbered_list", "highlight", "table", "qrcode", "faq", "countdown", "progress", "gift", "contact", "stats", "testimonial", "steps", "svg"], 
                  description: "Block type. Use 'header' for section titles, 'paragraph' for body text, 'card' for key points, 'list' for bullets, 'numbered_list' for steps, 'quote' for citations, 'image' for visual placeholders, 'divider' for section breaks, 'code' for code snippets, 'callout' for notices, 'highlight' for emphasized text, 'table' for structured data, 'svg' for decorative SVG graphics. Special types: 'qrcode' for QR code sections, 'faq' for Q&A blocks, 'countdown' for timers, 'progress' for progress bars, 'gift' for promotional boxes, 'contact' for contact info, 'stats' for statistics display, 'testimonial' for user reviews, 'steps' for step-by-step flows." 
                },
                content: { type: "string", description: "The main text content. For images, provide a description. For divider, this can be empty. For svg, provide SVG code or description." },
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
  // API keys are no longer accepted from frontend for security reasons
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    logger.info('Using Qwen via backend', { useSearch, isFormattingMode });
    
    // Call backend AI service instead of direct API
    const result = await generateArticleViaBackend({
      message: input,
      provider: 'qwen',
      useSearch,
      imageContext,
      isFormattingMode
    });
    
    logger.info('Backend AI service completed', {
      title: result.title,
      blocksCount: result.blocks?.length || 0
    });
    
    return result;
  } catch (error) {
    logger.error("Qwen generation via backend failed:", error);
    throw error;
  }
};

export const analyzeImageQwen = async (base64Image: string, mimeType: string, apiKey: string = ''): Promise<string> => {
    if (!apiKey) {
        throw new Error("Image analysis requires Qwen to be configured on the backend. Please contact your administrator.");
    }

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

export const generateSpeechQwen = async (text: string, apiKey: string = ''): Promise<ArrayBuffer> => {
    if (!apiKey) {
        throw new Error("Text-to-speech requires Qwen to be configured on the backend. Please contact your administrator.");
    }

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

/**
 * Generate multiple attractive title suggestions for an article
 */
export const generateTitleSuggestionsQwen = async (
  content: string,
  count: number = 5,
  apiKey: string = ''
): Promise<string[]> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'generateTitles',
      content,
      provider: 'qwen',
      options: { count }
    });
    
    return Array.isArray(result) ? result as string[] : [];
  } catch (error) {
    logger.error("Qwen title generation via backend failed:", error);
    throw error;
  }
};

/**
 * Generate a concise summary/digest for an article
 */
export const generateSummaryQwen = async (
  content: string,
  maxLength: number = 120,
  apiKey: string = ''
): Promise<string> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'generateSummary',
      content,
      provider: 'qwen',
      options: { maxLength }
    });
    
    return typeof result === 'string' ? result : '';
  } catch (error) {
    logger.error("Qwen summary generation via backend failed:", error);
    throw error;
  }
};

/**
 * Expand a paragraph or section with more details
 */
export const expandContentQwen = async (
  content: string,
  style: 'detailed' | 'examples' | 'storytelling' = 'detailed',
  apiKey: string = ''
): Promise<string> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'expandContent',
      content,
      provider: 'qwen',
      options: { style }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("Qwen content expansion via backend failed:", error);
    throw error;
  }
};

/**
 * Polish and improve content style and grammar
 */
export const polishContentQwen = async (
  content: string,
  tone: 'professional' | 'casual' | 'formal' | 'creative' = 'professional',
  apiKey: string = ''
): Promise<string> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'polishContent',
      content,
      provider: 'qwen',
      options: { tone }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("Qwen content polish via backend failed:", error);
    throw error;
  }
};

/**
 * Extract keywords from content for SEO purposes
 */
export const extractKeywordsQwen = async (
  content: string,
  count: number = 10,
  apiKey: string = ''
): Promise<string[]> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'extractKeywords',
      content,
      provider: 'qwen',
      options: { count }
    });
    
    return Array.isArray(result) ? result as string[] : [];
  } catch (error) {
    logger.error("Qwen keyword extraction via backend failed:", error);
    throw error;
  }
};

/**
 * Translate content between Chinese and English
 */
export const translateContentQwen = async (
  content: string,
  targetLanguage: 'zh' | 'en',
  apiKey: string = ''
): Promise<string> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'translateContent',
      content,
      provider: 'qwen',
      options: { targetLanguage }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("Qwen translation via backend failed:", error);
    throw error;
  }
};

/**
 * Suggest visual styles based on content theme
 */
export const suggestStylesQwen = async (
  content: string,
  apiKey: string = ''
): Promise<StyleSuggestion[]> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'suggestStyles',
      content,
      provider: 'qwen'
    });
    
    return Array.isArray(result) ? result as StyleSuggestion[] : [];
  } catch (error) {
    logger.error("Qwen style suggestion via backend failed:", error);
    throw error;
  }
};

/**
 * Generate an engaging article opening/hook
 */
export const generateHookQwen = async (
  topic: string,
  style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising' = 'question',
  apiKey: string = ''
): Promise<string> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'generateHook',
      content: topic,
      provider: 'qwen',
      options: { style }
    });
    
    return typeof result === 'string' ? result : '';
  } catch (error) {
    logger.error("Qwen hook generation via backend failed:", error);
    throw error;
  }
};

/**
 * Generate a compelling call-to-action for article ending
 */
export const generateCTAQwen = async (
  articleContext: string,
  ctaType: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection' = 'share',
  apiKey: string = ''
): Promise<string> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'generateCTA',
      content: articleContext,
      provider: 'qwen',
      options: { type: ctaType }
    });
    
    return typeof result === 'string' ? result : '';
  } catch (error) {
    logger.error("Qwen CTA generation via backend failed:", error);
    throw error;
  }
};

/**
 * Rewrite content in a different style or perspective
 */
export const rewriteContentQwen = async (
  content: string,
  newStyle: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational',
  apiKey: string = ''
): Promise<string> => {
  // API keys are no longer accepted from frontend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    const result = await callAIHelper({
      action: 'rewriteContent',
      content,
      provider: 'qwen',
      options: { style: newStyle }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("Qwen content rewrite via backend failed:", error);
    throw error;
  }
};
