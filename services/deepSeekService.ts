
import { ArticleBlock, BlockType, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';
import { safeParseJSON } from './jsonParser';
import { loadPrompts, interpolatePrompt } from './promptConfig';
import { generateArticleViaBackend, callAIHelper, type StyleSuggestion } from './backendAIClient';

const logger = loggers.deepseek;

const BASE_URL = "https://api.deepseek.com/chat/completions";

// DeepSeek model types
export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';

// Whether to enable thinking mode (for deepseek-reasoner with tool calling)
let thinkingModeEnabled: boolean = false;

// Whether to enable multi-round layout mode (phased generation)
let multiRoundLayoutModeEnabled: boolean = false;

// Default model - can be changed to use reasoner mode
let currentModel: DeepSeekModel = 'deepseek-chat';

/**
 * Set the DeepSeek model to use
 * @param model - 'deepseek-chat' for regular chat or 'deepseek-reasoner' for reasoning mode with thinking
 * @description When 'deepseek-reasoner' is selected, the service uses 'deepseek-chat' with 
 *              `thinking: { type: "enabled" }` to enable enhanced reasoning with tool calling support.
 *              This is the recommended approach per DeepSeek's API documentation.
 */
export const setDeepSeekModel = (model: DeepSeekModel): void => {
  currentModel = model;
  // When using deepseek-reasoner, we use deepseek-chat with thinking enabled for tool calling support
  thinkingModeEnabled = model === 'deepseek-reasoner';
  logger.info(`DeepSeek model set to: ${model}, thinking mode: ${thinkingModeEnabled}`);
};

/**
 * Get the current DeepSeek model setting
 * @description Note: When 'deepseek-reasoner' is returned, the actual API calls use 'deepseek-chat' 
 *              with thinking mode enabled for tool calling support.
 */
export const getDeepSeekModel = (): DeepSeekModel => currentModel;

/**
 * Check if thinking mode is enabled
 * When enabled, DeepSeek uses enhanced reasoning capabilities with multi-turn tool calling support.
 */
export const isThinkingModeEnabled = (): boolean => thinkingModeEnabled;

/**
 * Enable or disable thinking mode manually
 * @param enabled - true to enable thinking mode (enhanced reasoning with tool calling)
 */
export const setThinkingMode = (enabled: boolean): void => {
  thinkingModeEnabled = enabled;
  logger.info(`DeepSeek thinking mode set to: ${enabled}`);
};

/**
 * Check if multi-round layout mode is enabled
 * When enabled, article generation is split into phases: background, content, images, summary
 */
export const isMultiRoundLayoutModeEnabled = (): boolean => multiRoundLayoutModeEnabled;

/**
 * Enable or disable multi-round layout mode
 * @param enabled - true to enable multi-round layout generation (higher token consumption)
 */
export const setMultiRoundLayoutMode = (enabled: boolean): void => {
  multiRoundLayoutModeEnabled = enabled;
  logger.info(`DeepSeek multi-round layout mode set to: ${enabled}`);
};

// Re-use the structure but adapted for OpenAI-compatible tool definitions
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
                content: { type: "string", description: "The main text content. For images, this is the description/prompt. For divider, this can be empty. For svg, provide SVG code or description." },
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
                role: { type: "string", description: "Author role/position for testimonial blocks." },
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
            }
          }
        },
        required: ["title", "digest", "blocks"]
      }
    }
  }
];

/**
 * Interface for DeepSeek message with reasoning content
 */
interface DeepSeekMessage {
  role: string;
  content: string;
  reasoning_content?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * Make a single API call to DeepSeek
 */
const makeDeepSeekRequest = async (
  apiKey: string,
  messages: any[],
  useThinking: boolean = false
): Promise<any> => {
  const requestBody: Record<string, unknown> = {
    model: 'deepseek-chat', // Always use deepseek-chat, thinking mode is enabled via 'thinking' parameter
    messages,
    tools,
    tool_choice: "auto"
  };

  // Enable thinking mode for reasoner-style behavior with tool calling support
  if (useThinking) {
    // Note: In browser environment, we pass thinking config directly in the body
    // Some API clients use extra_body, but fetch API accepts it in the main body
    (requestBody as any).thinking = { type: "enabled" };
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const err = await response.json();
      errorMessage = err.error?.message || errorMessage;
    } catch {
      // Failed to parse error response, use statusText
    }
    throw new Error(`DeepSeek API Error: ${errorMessage}`);
  }

  return response.json();
};

/**
 * Clear reasoning_content from messages to save bandwidth
 * Called when starting a new turn/question
 */
const clearReasoningContent = (messages: any[]): void => {
  for (const message of messages) {
    if (message.reasoning_content) {
      delete message.reasoning_content;
    }
  }
};

/**
 * Generate article structure using multi-round layout mode
 * This splits the generation into 4 phases: background, content, images, summary
 */
const generateArticleMultiRoundLayout = async (
  input: string,
  apiKey: string,
  isFormattingMode: boolean = false,
  useReasonerMode?: boolean
): Promise<GenerationResult> => {
  const useThinking = useReasonerMode !== undefined ? useReasonerMode : thinkingModeEnabled;
  
  logger.group('=== DeepSeek Multi-Round Layout Generation ===', true);
  logger.info(`📝 Topic: ${input}`);
  logger.info(`🧠 Thinking Mode: ${useThinking ? 'Enabled' : 'Disabled'}`);
  logger.info(`📋 Mode: ${isFormattingMode ? 'Formatting' : 'Generation'}`);
  logger.info('⚠️  Note: This will make 4 separate API calls');

  const topic = input;
  
  // Load custom prompts
  const prompts = loadPrompts();
  
  // Round 1: Generate background/context
  logger.group('📘 Round 1: Background/Context', true);
  logger.time('Round 1');
  const round1Prompt = interpolatePrompt(prompts.multiRound.round1, { topic });

  const round1Messages = [
    { role: "system", content: prompts.systemPrompt },
    { role: "user", content: round1Prompt }
  ];

  const round1Data = await makeDeepSeekRequest(apiKey, round1Messages, useThinking);
  const round1Result = extractLayoutFromResponse(round1Data);
  
  logger.timeEnd('Round 1');
  if (!round1Result) {
    logger.error('❌ Round 1 failed to generate content');
    throw new Error("Failed to generate background section");
  }
  logger.info(`✅ Generated ${round1Result.blocks.length} blocks for background`);
  logger.groupEnd();

  // Round 2: Generate main content/copy
  logger.group('📝 Round 2: Main Content/Copy', true);
  logger.time('Round 2');
  const round2Prompt = interpolatePrompt(prompts.multiRound.round2, { topic });

  const round2Messages = [
    { role: "system", content: prompts.systemPrompt },
    { role: "user", content: round2Prompt }
  ];

  const round2Data = await makeDeepSeekRequest(apiKey, round2Messages, useThinking);
  const round2Result = extractLayoutFromResponse(round2Data);
  
  logger.timeEnd('Round 2');
  if (!round2Result) {
    logger.error('❌ Round 2 failed to generate content');
    throw new Error("Failed to generate main content section");
  }
  logger.info(`✅ Generated ${round2Result.blocks.length} blocks for main content`);
  logger.groupEnd();

  // Round 3: Add images and visual widgets
  logger.group('🎨 Round 3: Images and Visual Widgets', true);
  logger.time('Round 3');
  const round3Prompt = interpolatePrompt(prompts.multiRound.round3, { topic });

  const round3Messages = [
    { role: "system", content: prompts.systemPrompt },
    { role: "user", content: round3Prompt }
  ];

  const round3Data = await makeDeepSeekRequest(apiKey, round3Messages, useThinking);
  const round3Result = extractLayoutFromResponse(round3Data);
  
  logger.timeEnd('Round 3');
  if (!round3Result) {
    logger.error('❌ Round 3 failed to generate content');
    throw new Error("Failed to generate images and widgets section");
  }
  logger.info(`✅ Generated ${round3Result.blocks.length} blocks for visuals`);
  logger.groupEnd();

  // Round 4: Generate summary and conclusion
  logger.group('📊 Round 4: Summary and Conclusion', true);
  logger.time('Round 4');
  const round4Prompt = interpolatePrompt(prompts.multiRound.round4, { topic });

  const round4Messages = [
    { role: "system", content: prompts.systemPrompt },
    { role: "user", content: round4Prompt }
  ];

  const round4Data = await makeDeepSeekRequest(apiKey, round4Messages, useThinking);
  const round4Result = extractLayoutFromResponse(round4Data);
  
  logger.timeEnd('Round 4');
  if (!round4Result) {
    logger.error('❌ Round 4 failed to generate content');
    throw new Error("Failed to generate summary section");
  }
  logger.info(`✅ Generated ${round4Result.blocks.length} blocks for summary`);
  logger.groupEnd();

  // Combine all rounds
  logger.group('🔄 Combining All Rounds', true);
  logger.info('Merging all rounds into final article...');
  const allBlocks = [
    ...round1Result.blocks,
    ...round2Result.blocks,
    ...round3Result.blocks,
    ...round4Result.blocks
  ];

  // Use the final title and digest from round 4, or fall back to round 1
  const finalTitle = round4Result.title || round1Result.title || "Untitled Article";
  const finalDigest = round4Result.digest || round1Result.digest || "No summary available.";

  logger.group('✅ Multi-Round Article Generation Complete', true);
  logger.info(`📌 Final Title: ${finalTitle}`);
  logger.info(`📝 Final Digest: ${finalDigest}`);
  logger.info(`📊 Total Blocks: ${allBlocks.length}`);
  logger.info(`  └─ Round 1 (Background): ${round1Result.blocks.length} blocks`);
  logger.info(`  └─ Round 2 (Content): ${round2Result.blocks.length} blocks`);
  logger.info(`  └─ Round 3 (Visuals): ${round3Result.blocks.length} blocks`);
  logger.info(`  └─ Round 4 (Summary): ${round4Result.blocks.length} blocks`);
  logger.groupEnd();
  logger.groupEnd();

  return {
    title: finalTitle,
    digest: finalDigest,
    blocks: allBlocks,
    sources: []
  };
};

/**
 * Extract layout_article result from API response
 */
const extractLayoutFromResponse = (data: any): { title: string; digest: string; blocks: any[] } | null => {
  const message = data.choices?.[0]?.message;
  if (!message) return null;

  const toolCalls = message.tool_calls;
  if (!toolCalls || toolCalls.length === 0) return null;

  for (const toolCall of toolCalls) {
    if (toolCall.function?.name === 'layout_article') {
      try {
        const args = safeParseJSON(toolCall.function.arguments, logger);
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const blocks = (args.blocks || []).map((b: any, index: number) => ({
          id: `ds-${timestamp}-${index}-${random}`,
          ...b
        }));
        
        return {
          title: args.title || "",
          digest: args.digest || "",
          blocks
        };
      } catch (error) {
        logger.error('Failed to parse layout_article response:', error);
        return null;
      }
    }
  }

  return null;
};

export const generateArticleStructureDeepSeek = async (
  input: string,
  apiKey: string,
  isFormattingMode: boolean = false,
  useReasonerMode?: boolean
): Promise<GenerationResult> => {
  // API keys are no longer accepted from frontend for security reasons
  // All AI requests are now proxied through the backend
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }
  
  // Determine whether to use thinking mode
  const useThinking = useReasonerMode !== undefined ? useReasonerMode : thinkingModeEnabled;
  
  logger.info(`Using DeepSeek via backend with thinking mode: ${useThinking}`, { multiRound: multiRoundLayoutModeEnabled });

  try {
    // Call backend AI service instead of direct API
    const result = await generateArticleViaBackend({
      message: input,
      provider: 'deepseek',
      useSearch: false,
      isFormattingMode,
      thinkingMode: useThinking,
      multiRoundMode: multiRoundLayoutModeEnabled,
    });
    
    logger.info('Backend AI service completed', {
      title: result.title,
      blocksCount: result.blocks?.length || 0
    });
    
    return result;
  } catch (error) {
    logger.error("DeepSeek generation via backend failed:", error);
    throw error;
  }
};

// --- Helper for DeepSeek API calls ---
/**
 * Helper function for DeepSeek API calls (simple text generation without tool calling)
 * @param apiKey - DeepSeek API key
 * @param messages - Chat messages
 * @param temperature - Temperature (default 0.7)
 * @param useThinkingMode - Whether to enable thinking mode for enhanced reasoning
 * @returns The content from the AI response
 */
const callDeepSeekAPI = async (
  apiKey: string, 
  messages: any[], 
  temperature: number = 0.7,
  useThinkingMode?: boolean
): Promise<string> => {
  const useThinking = useThinkingMode !== undefined ? useThinkingMode : thinkingModeEnabled;

  const requestBody: Record<string, unknown> = {
    model: 'deepseek-chat', // Always use deepseek-chat
    messages,
    temperature
  };

  // Enable thinking mode for enhanced reasoning
  if (useThinking) {
    (requestBody as any).thinking = { type: "enabled" };
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`DeepSeek API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  // Log reasoning content if available (when thinking mode is enabled)
  if (useThinking && message?.reasoning_content) {
    logger.group('DeepSeek Reasoning', true);
    logger.debug('Reasoning content:', message.reasoning_content);
    logger.groupEnd();
  }

  return message?.content || "";
};

// --- New AI Methods for Design Richness ---

/**
 * Generate multiple attractive title suggestions for an article
 */
export const generateTitleSuggestionsDeepSeek = async (
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
      provider: 'deepseek',
      options: { count }
    });
    
    // Result should be an array of strings
    return Array.isArray(result) ? result : [];
  } catch (error) {
    logger.error("DeepSeek title generation via backend failed:", error);
    throw error;
  }
};

/**
 * Generate a concise summary/digest for an article
 */
export const generateSummaryDeepSeek = async (
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
      provider: 'deepseek',
      options: { maxLength }
    });
    
    return typeof result === 'string' ? result : '';
  } catch (error) {
    logger.error("DeepSeek summary generation via backend failed:", error);
    throw error;
  }
};

/**
 * Expand a paragraph or section with more details
 */
export const expandContentDeepSeek = async (
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
      provider: 'deepseek',
      options: { style }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("DeepSeek content expansion via backend failed:", error);
    throw error;
  }
};

/**
 * Polish and improve content style and grammar
 */
export const polishContentDeepSeek = async (
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
      provider: 'deepseek',
      options: { tone }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("DeepSeek content polish via backend failed:", error);
    throw error;
  }
};

/**
 * Extract keywords from content for SEO purposes
 */
export const extractKeywordsDeepSeek = async (
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
      provider: 'deepseek',
      options: { count }
    });
    
    return Array.isArray(result) ? result : [];
  } catch (error) {
    logger.error("DeepSeek keyword extraction via backend failed:", error);
    throw error;
  }
};

/**
 * Translate content between Chinese and English
 */
export const translateContentDeepSeek = async (
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
      provider: 'deepseek',
      options: { targetLanguage }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("DeepSeek translation via backend failed:", error);
    throw error;
  }
};

/**
 * Suggest visual styles based on content theme
 */
export const suggestStylesDeepSeek = async (
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
      provider: 'deepseek'
    });
    
    return Array.isArray(result) ? result : [];
  } catch (error) {
    logger.error("DeepSeek style suggestion via backend failed:", error);
    throw error;
  }
};

/**
 * Generate an engaging article opening/hook
 */
export const generateHookDeepSeek = async (
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
      provider: 'deepseek',
      options: { style }
    });
    
    return typeof result === 'string' ? result : '';
  } catch (error) {
    logger.error("DeepSeek hook generation via backend failed:", error);
    throw error;
  }
};

/**
 * Generate a compelling call-to-action for article ending
 */
export const generateCTADeepSeek = async (
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
      provider: 'deepseek',
      options: { type: ctaType }
    });
    
    return typeof result === 'string' ? result : '';
  } catch (error) {
    logger.error("DeepSeek CTA generation via backend failed:", error);
    throw error;
  }
};

/**
 * Rewrite content in a different style or perspective
 */
export const rewriteContentDeepSeek = async (
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
      provider: 'deepseek',
      options: { style: newStyle }
    });
    
    return typeof result === 'string' ? result : content;
  } catch (error) {
    logger.error("DeepSeek content rewrite via backend failed:", error);
    throw error;
  }
};
