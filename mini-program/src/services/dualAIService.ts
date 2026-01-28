/**
 * Dual Parallel AI Service - 双并行AI服务
 * 
 * This service implements a dual-AI architecture where:
 * - Content AI (文案AI): Focuses on generating and refining the actual content/copywriting
 * - Design AI (美化AI): Focuses on formatting, styling, and beautifying the layout
 * 
 * Each AI maintains its own context/memory to improve accuracy over multiple calls.
 */

import Taro from '@tarojs/taro';
import { ArticleBlock, BlockType, GroundingSource } from "@shared/types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';
import { safeParseJSON } from '@shared/utils/jsonParser';

const logger = loggers.dualAI;

// --- Types ---

export interface AIMemory {
  contentHistory: ContentMemoryEntry[];
  designHistory: DesignMemoryEntry[];
  preferences: UserPreferences;
}

export interface ContentMemoryEntry {
  timestamp: number;
  topic: string;
  style: string;
  keywords: string[];
  feedback?: string;
}

export interface DesignMemoryEntry {
  timestamp: number;
  colorScheme: string[];
  preferredBlocks: BlockType[];
  feedback?: string;
}

export interface UserPreferences {
  writingTone: 'formal' | 'casual' | 'professional' | 'creative';
  colorPalette: string[];
  preferredBlockTypes: BlockType[];
  contentLength: 'short' | 'medium' | 'long';
}

export interface DualAIConfig {
  contentApiKey: string;
  designApiKey: string;
  contentProvider: 'deepseek' | 'qwen';
  designProvider: 'deepseek' | 'qwen';
  memory: AIMemory;
}

export interface DualAIResult {
  content: GenerationResult;
  designEnhancements: DesignEnhancement[];
  memoryUpdates: Partial<AIMemory>;
}

export interface DesignEnhancement {
  blockId: string;
  originalBlock: ArticleBlock;
  enhancedBlock: ArticleBlock;
  reason: string;
}

// --- Default Memory ---

const DEFAULT_MEMORY: AIMemory = {
  contentHistory: [],
  designHistory: [],
  preferences: {
    writingTone: 'professional',
    colorPalette: ['blue', 'green', 'purple'],
    preferredBlockTypes: [BlockType.HEADER, BlockType.PARAGRAPH, BlockType.CARD, BlockType.LIST],
    contentLength: 'medium'
  }
};

// --- Memory Storage ---

const MEMORY_STORAGE_KEY = 'dual_ai_memory';

export const loadMemory = (): AIMemory => {
  try {
    const saved = Taro.getStorageSync(MEMORY_STORAGE_KEY);
    if (saved) {
      const parsed = saved; // Taro getStorageSync already parses JSON if it was an object
      return { ...DEFAULT_MEMORY, ...(typeof parsed === 'string' ? JSON.parse(parsed) : parsed) };
    }
  } catch (e) {
    console.error('Failed to load AI memory:', e);
  }
  return DEFAULT_MEMORY;
};

// Maximum number of history entries to keep in memory
const MAX_HISTORY_SIZE = 20;

export const saveMemory = (memory: AIMemory): void => {
  try {
    // Limit history size to prevent localStorage overflow
    const trimmedMemory: AIMemory = {
      ...memory,
      contentHistory: memory.contentHistory.slice(-MAX_HISTORY_SIZE),
      designHistory: memory.designHistory.slice(-MAX_HISTORY_SIZE)
    };
    Taro.setStorageSync(MEMORY_STORAGE_KEY, trimmedMemory);
  } catch (e) {
    console.error('Failed to save AI memory:', e);
  }
};

// --- Context Building Helpers ---

const buildContentContext = (memory: AIMemory, topic: string): string => {
  const recentHistory = memory.contentHistory.slice(-5);
  const historyContext = recentHistory.length > 0 
    ? `Recent writing history: ${recentHistory.map(h => `${h.topic} (${h.style})`).join(', ')}.`
    : '';
  
  const preferenceContext = `
    User preferences: 
    - Writing tone: ${memory.preferences.writingTone}
    - Content length: ${memory.preferences.contentLength}
    - Frequently used keywords: ${recentHistory.flatMap(h => h.keywords).slice(-10).join(', ')}
  `;
  
  return `
    ${historyContext}
    ${preferenceContext}
    
    Current topic: ${topic}
    
    Use this context to create more personalized and consistent content.
  `.trim();
};

const buildDesignContext = (memory: AIMemory, blocks: ArticleBlock[]): string => {
  const recentHistory = memory.designHistory.slice(-5);
  const usedColors = recentHistory.flatMap(h => h.colorScheme);
  const colorPreference = usedColors.length > 0
    ? `Previously used colors: ${[...new Set(usedColors)].join(', ')}`
    : `Preferred colors: ${memory.preferences.colorPalette.join(', ')}`;
  
  const blockTypeAnalysis = blocks.map(b => b.type).join(', ');
  
  return `
    ${colorPreference}
    
    Current block types in article: ${blockTypeAnalysis}
    
    Design guidelines:
    - Ensure visual variety by using different colors for different sections
    - Use gradient styles for emphasis
    - Maintain consistent styling within sections
    - Prefer ${memory.preferences.preferredBlockTypes.join(', ')} for key content
  `.trim();
};

// --- Tool Definitions for Content AI ---

const contentAITools = [
  {
    type: "function",
    function: {
      name: "generate_article_content",
      description: "Generates high-quality article content with proper structure. Focus on the writing quality, storytelling, and information accuracy.",
      parameters: {
        type: "object",
        properties: {
          title: { 
            type: "string", 
            description: "An engaging article title that captures the essence of the content" 
          },
          digest: { 
            type: "string", 
            description: "A compelling 100-120 character summary that hooks readers" 
          },
          sections: {
            type: "array",
            description: "Content sections of the article",
            items: {
              type: "object",
              properties: {
                heading: { type: "string", description: "Section heading" },
                content: { type: "string", description: "Section body text with detailed information" },
                keyPoints: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Key points to emphasize in this section" 
                },
                suggestedVisual: { 
                  type: "string", 
                  description: "Description of a visual element that could enhance this section" 
                }
              },
              required: ["heading", "content"]
            }
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Main keywords extracted from the content for SEO"
          },
          tone: {
            type: "string",
            enum: ["formal", "casual", "professional", "creative", "educational", "inspirational"],
            description: "The overall tone of the article"
          }
        },
        required: ["title", "digest", "sections", "keywords", "tone"]
      }
    }
  }
];

// --- Tool Definitions for Design AI ---

const designAITools = [
  {
    type: "function",
    function: {
      name: "beautify_article",
      description: "Takes raw article content and transforms it into a visually stunning WeChat layout with proper formatting, colors, typography, and visual elements.",
      parameters: {
        type: "object",
        properties: {
          blocks: {
            type: "array",
            description: "The formatted content blocks for WeChat article",
            items: {
              type: "object",
              properties: {
                type: { 
                  type: "string", 
                  enum: ["header", "paragraph", "card", "list", "quote", "image", "divider", "code", "callout", "numbered_list", "highlight", "table", "qrcode", "faq", "countdown", "progress", "gift", "contact", "stats", "testimonial", "steps", "svg"],
                  description: "Block type - use special types like qrcode, faq, countdown, progress, gift, contact, stats, testimonial, steps, svg for advanced layouts" 
                },
                content: { type: "string", description: "The content for this block. For svg, provide SVG code or description." },
                title: { type: "string", description: "Title for card, header, callout, gift, faq blocks" },
                items: { type: "array", items: { type: "string" }, description: "List items, FAQ questions, or step descriptions" },
                style: { 
                  type: "string", 
                  enum: ["default", "red", "blue", "purple", "orange", "gold", "green", "pink", "cyan", "gradient"],
                  description: "Visual color style - use varied colors for visual variety" 
                },
                level: { type: "number", enum: [1, 2, 3], description: "Header level" },
                alignment: { type: "string", enum: ["left", "center", "right"], description: "Text alignment" },
                icon: { type: "string", enum: ["info", "warning", "success", "error", "tip", "note"], description: "Callout icon" },
                // Typography properties for emphasis
                fontSize: { 
                  type: "string", 
                  enum: ["small", "normal", "large", "xlarge"], 
                  description: "Font size for visual hierarchy. Use 'large' or 'xlarge' for important text." 
                },
                fontWeight: { 
                  type: "string", 
                  enum: ["normal", "bold", "light"], 
                  description: "Font weight for emphasis. Use 'bold' for key points." 
                },
                fontStyle: { 
                  type: "string", 
                  enum: ["normal", "italic"], 
                  description: "Font style. Use 'italic' for quotes or emphasis." 
                },
                // New properties for special blocks
                values: { type: "array", items: { type: "string" }, description: "Values for stats blocks (e.g., ['1000+', '50%', '99%'])" },
                labels: { type: "array", items: { type: "string" }, description: "Labels for stats/progress blocks (e.g., ['用户数', '增长率', '满意度'])" },
                answers: { type: "array", items: { type: "string" }, description: "Answers for FAQ blocks, matching items array" },
                countdown: { type: "object", description: "Countdown values: {days, hours, minutes, seconds}" },
                percentage: { type: "number", description: "Progress percentage (0-100)" }
              },
              required: ["type", "content"]
            }
          },
          colorScheme: {
            type: "array",
            items: { type: "string" },
            description: "The primary colors used in this design"
          },
          designNotes: {
            type: "string",
            description: "Brief explanation of design choices made"
          }
        },
        required: ["blocks", "colorScheme"]
      }
    }
  }
];

// --- Base API Call Helpers ---

const QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";

// DeepSeek thinking mode configuration for dualAI
let dualAIThinkingModeEnabled: boolean = false;
let dualAIMaxThinkingRounds: number = 10;

// Multi-round layout mode for dualAI
let dualAIMultiRoundLayoutMode: boolean = false;

/**
 * Enable or disable thinking mode for Dual AI DeepSeek operations
 * When enabled, DeepSeek uses enhanced reasoning capabilities with multi-turn tool calling support.
 * @param enabled - true to enable thinking mode
 */
export const setDualAIThinkingMode = (enabled: boolean): void => {
  dualAIThinkingModeEnabled = enabled;
  logger.info(`Dual AI DeepSeek thinking mode set to: ${enabled}`);
};

/**
 * Check if thinking mode is enabled for Dual AI
 * @returns true if thinking mode is enabled
 */
export const isDualAIThinkingModeEnabled = (): boolean => dualAIThinkingModeEnabled;

/**
 * Get the maximum number of thinking rounds for Dual AI
 * @returns The current maximum thinking rounds limit
 */
export const getDualAIMaxThinkingRounds = (): number => dualAIMaxThinkingRounds;

/**
 * Set the maximum number of thinking rounds for Dual AI
 * @param rounds - Number of rounds (1-20, default 10)
 */
export const setDualAIMaxThinkingRounds = (rounds: number): void => {
  dualAIMaxThinkingRounds = Math.max(1, Math.min(20, rounds)); // Clamp between 1 and 20
  logger.info(`Dual AI max thinking rounds set to: ${dualAIMaxThinkingRounds}`);
};

/**
 * Set multi-round layout mode for Dual AI
 * @param enabled - true to enable multi-round layout (4 separate generation phases)
 */
export const setDualAIMultiRoundLayoutMode = (enabled: boolean): void => {
  dualAIMultiRoundLayoutMode = enabled;
  logger.info(`Dual AI multi-round layout mode set to: ${enabled}`);
};

/**
 * Check if multi-round layout mode is enabled for Dual AI
 */
export const isDualAIMultiRoundLayoutModeEnabled = (): boolean => dualAIMultiRoundLayoutMode;

// For backward compatibility
export type DeepSeekDualModel = 'deepseek-chat' | 'deepseek-reasoner';

/**
 * Set the DeepSeek model to use for Dual AI operations
 * @deprecated Use setDualAIThinkingMode(true) instead. When 'deepseek-reasoner' is selected,
 *             the service uses 'deepseek-chat' with thinking mode enabled for tool calling support.
 * @param model - 'deepseek-chat' for regular mode, 'deepseek-reasoner' to enable thinking mode
 */
export const setDualAIDeepSeekModel = (model: DeepSeekDualModel): void => {
  dualAIThinkingModeEnabled = model === 'deepseek-reasoner';
  logger.info(`Dual AI DeepSeek thinking mode set to: ${dualAIThinkingModeEnabled} (via deprecated setDualAIDeepSeekModel with model: ${model})`);
};

/**
 * Get the current DeepSeek model for Dual AI
 * @deprecated Use isDualAIThinkingModeEnabled() instead. This returns 'deepseek-reasoner' when
 *             thinking mode is enabled, but the actual API calls use 'deepseek-chat' with thinking parameter.
 * @returns 'deepseek-reasoner' if thinking mode is enabled, otherwise 'deepseek-chat'
 */
export const getDualAIDeepSeekModel = (): DeepSeekDualModel => 
  dualAIThinkingModeEnabled ? 'deepseek-reasoner' : 'deepseek-chat';

/**
 * Make a single API call with optional multi-turn tool calling support for thinking mode
 */
const callAPI = async (
  provider: 'deepseek' | 'qwen',
  apiKey: string,
  messages: any[],
  tools: any[],
  temperature: number = 0.7,
  useThinkingMode?: boolean
): Promise<any> => {
  let url: string;
  let model: string;

  // Determine if using thinking mode for deepseek
  const isDeepSeekThinking = provider === 'deepseek' && 
    (useThinkingMode !== undefined ? useThinkingMode : dualAIThinkingModeEnabled);

  switch (provider) {
    case 'qwen':
      url = QWEN_BASE_URL;
      model = 'qwen-plus';
      break;
    case 'deepseek':
      url = DEEPSEEK_BASE_URL;
      model = 'deepseek-chat'; // Always use deepseek-chat, thinking is enabled via extra param
      break;
    default:
      throw new Error('Unsupported provider');
  }

  logger.info(`Calling ${provider} API with model: ${model}, thinking mode: ${isDeepSeekThinking}`);

  // For DeepSeek with thinking mode, we need to handle multi-turn tool calling
  if (isDeepSeekThinking) {
    return callDeepSeekWithThinking(apiKey, messages, tools, temperature);
  }

  // Regular API call
  const requestBody: Record<string, unknown> = {
    model,
    messages,
    tools,
    tool_choice: "auto",
    temperature
  };

  const response = await Taro.request({
    url,
    method: "POST",
    header: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    data: requestBody
  });

  if (response.statusCode !== 200) {
    const err = response.data as any;
    throw new Error(`API Error: ${err.error?.message || response.errMsg}`);
  }

  return response.data;
};

/**
 * DeepSeek API call with thinking mode enabled
 * Handles multi-turn tool calling as required by the thinking mode
 */
const callDeepSeekWithThinking = async (
  apiKey: string,
  initialMessages: any[],
  tools: any[],
  temperature: number
): Promise<any> => {
  const messages = [...initialMessages];
  let subTurn = 1;
  const maxSubTurns = dualAIMaxThinkingRounds; // Use configurable thinking rounds

  while (subTurn <= maxSubTurns) {
    logger.info(`DeepSeek thinking mode - Sub-turn ${subTurn}/${maxSubTurns}`);

    const requestBody: Record<string, unknown> = {
      model: 'deepseek-chat',
      messages,
      tools,
      tool_choice: "auto",
      temperature,
      thinking: { type: "enabled" }
    };

    const response = await Taro.request({
      url: DEEPSEEK_BASE_URL,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      data: requestBody
    });

    if (response.statusCode !== 200) {
      let errorMessage = response.errMsg;
      try {
        const err = response.data as any;
        errorMessage = err.error?.message || errorMessage;
      } catch {
        // Failed to parse error response
      }
      throw new Error(`DeepSeek API Error: ${errorMessage}`);
    }

    const data = response.data as any;
    const message = data.choices?.[0]?.message;

    if (!message) {
      throw new Error("No message in API response");
    }

    // Log reasoning content if available
    if (message.reasoning_content) {
      logger.group(`DeepSeek Reasoning (Sub-turn ${subTurn})`, true);
      logger.debug('Reasoning content:', message.reasoning_content);
      logger.groupEnd();
    }

    // Append the assistant message to maintain conversation context
    messages.push(message);

    const toolCalls = message.tool_calls;

    // If there are no tool calls, return the final response
    if (!toolCalls || toolCalls.length === 0) {
      return data;
    }

    // Check if this is the target tool call we're looking for
    // For dualAI, we're looking for generate_article_content or beautify_article
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function?.name;
      if (functionName === 'generate_article_content' || functionName === 'beautify_article') {
        // Return the data with this tool call
        return data;
      }
    }

    // For other tool calls, provide helpful guidance to the AI
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function?.name;
      logger.warn(`Unexpected tool call in thinking mode: ${functionName}`);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: `This tool (${functionName}) is not available. Please use either 'generate_article_content' for content generation or 'beautify_article' for design beautification.`
      });
    }

    subTurn++;
  }

  throw new Error("DeepSeek exceeded maximum sub-turns in thinking mode");
};

// --- Content AI Service ---

interface ContentAIResult {
  title: string;
  digest: string;
  sections: {
    heading: string;
    content: string;
    keyPoints?: string[];
    suggestedVisual?: string;
  }[];
  keywords: string[];
  tone: string;
}

export const generateContentWithAI = async (
  topic: string,
  memory: AIMemory,
  provider: 'deepseek' | 'qwen',
  apiKey: string,
  imageContext?: string,
  useThinkingMode?: boolean
): Promise<ContentAIResult> => {
  const context = buildContentContext(memory, topic);
  
  // Determine if using thinking mode for enhanced reasoning
  const useThinking = provider === 'deepseek' && 
    (useThinkingMode !== undefined ? useThinkingMode : dualAIThinkingModeEnabled);
  
  const systemPrompt = `You are an expert content writer for WeChat Official Accounts with a gift for creative, engaging storytelling.
You specialize in creating articles that captivate readers through diverse writing styles and rich language.

${context}

Focus on:
- **Clear, compelling writing** with varied sentence structures
- **Storytelling techniques**: hooks, conflicts, resolutions, emotional arcs
- **Diverse language**: metaphors, analogies, rhetorical questions, vivid descriptions
- **Rhythm and pacing**: mix short punchy sentences with flowing longer ones
- **Engaging hooks**: start sections with attention-grabbing openings
- **Relatable examples**: use scenarios readers can connect with
- **Accurate information** presented in an entertaining way
- **Cultural relevance** for Chinese audience with appropriate idioms and references

Call the 'generate_article_content' function to return your result.`;

  const userPrompt = `Write a high-quality article about: "${topic}"
${imageContext ? `\n\nImage context: ${imageContext}` : ''}

Requirements:
- Create 3-5 well-structured sections with creative, attention-grabbing titles
- Use diverse writing techniques: storytelling, metaphors, rhetorical questions
- Vary sentence structures for engaging rhythm
- Include key points for each section with memorable phrasing
- Add emotional hooks and relatable scenarios
- Suggest visual elements where appropriate
- Extract relevant keywords for SEO`;

  const data = await callAPI(
    provider,
    apiKey,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    contentAITools,
    0.7,
    useThinking
  );

  // Log the raw API response
  logger.group('Content AI Response', true);
  logger.debug('Raw response:', data);
  logger.groupEnd();

  const message = data.choices?.[0]?.message;

  // Log reasoning content if available (when thinking mode is enabled)
  if (message?.reasoning_content) {
    logger.group('Content AI Reasoning', true);
    logger.debug('Reasoning content:', message.reasoning_content);
    logger.groupEnd();
  }

  // Handle response with function calling (works for both regular and thinking modes)
  const toolCall = message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'generate_article_content') {
    const receivedFunction = toolCall?.function?.name || 'none';
    const messageContent = message?.content?.slice(0, 100) || 'no content';
    throw new Error(`Content AI failed to generate structured content. Expected 'generate_article_content', received: '${receivedFunction}'. Message: ${messageContent}`);
  }

  // Safely parse JSON with error handling
  let result;
  try {
    let jsonStr = toolCall.function.arguments;
    result = safeParseJSON(jsonStr, logger);
  } catch (parseError) {
    logger.error('Failed to parse Content AI response JSON:', parseError);
    logger.error('Raw arguments:', toolCall.function.arguments);
    throw new Error(`Failed to parse Content AI response: ${parseError}`);
  }
  
  // Log generated content
  logger.group('Content AI Generated', true);
  logger.info('Title:', result.title);
  logger.info('Digest:', result.digest);
  logger.info('Sections:', result.sections?.length || 0);
  logger.debug('Full result:', result);
  logger.groupEnd();
  
  return result;
};

// --- Design AI Service ---

interface DesignAIResult {
  blocks: ArticleBlock[];
  colorScheme: string[];
  designNotes?: string;
}

export const beautifyWithAI = async (
  contentResult: ContentAIResult,
  memory: AIMemory,
  provider: 'deepseek' | 'qwen',
  apiKey: string,
  useThinkingMode?: boolean
): Promise<DesignAIResult> => {
  // Build a simplified representation for the design AI
  const contentSummary = contentResult.sections.map(s => ({
    heading: s.heading,
    contentPreview: s.content.slice(0, 200),
    keyPoints: s.keyPoints || [],
    visualSuggestion: s.suggestedVisual
  }));

  const context = buildDesignContext(memory, []);
  
  // Determine if using thinking mode for enhanced reasoning
  const useThinking = provider === 'deepseek' && 
    (useThinkingMode !== undefined ? useThinkingMode : dualAIThinkingModeEnabled);

  const systemPrompt = `You are an expert visual designer and creative writer for WeChat Official Accounts.
You specialize in creating beautiful, engaging "Xiumi-style" article layouts with rich, diverse content presentation and typography.

${context}

Focus on:
- **Visual variety**: Use different block types (cards, callouts, quotes, highlights, tables)
- **Colorful design**: Apply vibrant colors (red, blue, purple, orange, gold, green, pink, cyan, gradient)
- **Typography excellence**: Use different font sizes and weights for visual hierarchy:
  - fontSize: 'xlarge' for dramatic headlines and key statistics
  - fontSize: 'large' for important points and memorable quotes
  - fontSize: 'small' for footnotes and secondary information
  - fontWeight: 'bold' for key phrases and emphasis
  - fontStyle: 'italic' for quotes and special terms
- **Language diversity**: Enhance content with varied sentence structures and engaging phrasing
- **Proper visual hierarchy**: Use headers, subheaders, and emphasis blocks effectively
- **Engaging formatting**: Add emoji icons, creative titles, and attention-grabbing elements
- **Mobile-friendly layouts**: Ensure readability on mobile devices

Call the 'beautify_article' function to return your design.`;

  const userPrompt = `Transform this article content into a beautiful WeChat layout:

Title: ${contentResult.title}
Digest: ${contentResult.digest}
Tone: ${contentResult.tone}

Sections:
${JSON.stringify(contentSummary, null, 2)}

Requirements:
- Use at least 4-5 different colors for visual variety
- Apply typography variations:
  - Use fontSize: 'xlarge' for main headline and key statistics
  - Use fontSize: 'large' for section highlights and important quotes
  - Use fontWeight: 'bold' for key phrases and important statements
  - Use fontStyle: 'italic' for quotations and emphasis
- Include cards for key points with creative, catchy titles
- Use headers with appropriate levels (1, 2, 3) and engaging language
- Add dividers between sections with style variations
- Use callouts for important tips with relevant emoji icons
- Add quote blocks for memorable statements or inspirational lines
- Use highlight blocks for surprising facts or key phrases
- Make each section visually distinct with its own color theme and typography
- Vary content presentation: mix short impactful statements with detailed explanations`;

  const data = await callAPI(
    provider,
    apiKey,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    designAITools,
    0.8,
    useThinking
  );

  // Log the raw API response
  logger.group('Design AI Response', true);
  logger.debug('Raw response:', data);
  logger.groupEnd();

  const message = data.choices?.[0]?.message;

  // Log reasoning content if available (when thinking mode is enabled)
  if (message?.reasoning_content) {
    logger.group('Design AI Reasoning', true);
    logger.debug('Reasoning content:', message.reasoning_content);
    logger.groupEnd();
  }

  // Handle response with function calling (works for both regular and thinking modes)
  const toolCall = message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'beautify_article') {
    const receivedFunction = toolCall?.function?.name || 'none';
    const messageContent = message?.content?.slice(0, 100) || 'no content';
    throw new Error(`Design AI failed to beautify content. Expected 'beautify_article', received: '${receivedFunction}'. Message: ${messageContent}`);
  }

  // Safely parse JSON with error handling
  let result;
  try {
    let jsonStr = toolCall.function.arguments;
    result = safeParseJSON(jsonStr, logger);
  } catch (parseError) {
    logger.error('Failed to parse Design AI response JSON:', parseError);
    logger.error('Raw arguments:', toolCall.function.arguments);
    throw new Error(`Failed to parse Design AI response: ${parseError}`);
  }
  
  // Log design result
  logger.group('Design AI Generated', true);
  logger.info('Blocks count:', result.blocks?.length || 0);
  logger.info('Color scheme:', result.colorScheme);
  logger.info('Design notes:', result.designNotes);
  logger.debug('Blocks detail:', result.blocks);
  logger.groupEnd();
  
  // Add IDs to blocks
  const blocks = (result.blocks || []).map((b: any, index: number) => ({
    id: `dual-${Date.now()}-${index}`,
    ...b
  }));

  return {
    blocks,
    colorScheme: result.colorScheme || [],
    designNotes: result.designNotes
  };
};

// --- Validation Helper ---

/**
 * Validate that API keys are provided for dual AI mode
 * @throws Error if API keys are missing or empty
 */
const validateDualAIConfig = (config: {
  contentProvider: 'deepseek' | 'qwen';
  designProvider: 'deepseek' | 'qwen';
  contentApiKey: string;
  designApiKey: string;
}): void => {
  if (!config.contentApiKey || config.contentApiKey.trim() === '') {
    const providerName = config.contentProvider === 'qwen' ? 'Qwen (DashScope)' : 'DeepSeek';
    throw new Error(`双AI模式需要配置 ${providerName} API密钥。请在设置中配置API密钥后再使用双AI模式。`);
  }
  
  if (!config.designApiKey || config.designApiKey.trim() === '') {
    const providerName = config.designProvider === 'qwen' ? 'Qwen (DashScope)' : 'DeepSeek';
    throw new Error(`双AI模式需要配置 ${providerName} API密钥。请在设置中配置API密钥后再使用双AI模式。`);
  }
};

// --- Multi-Round Layout Dual AI Pipeline ---

/**
 * Generate article with Dual AI using multi-round layout approach
 * Splits generation into 4 phases: background, content, images, summary
 */
export const generateWithDualAIMultiRound = async (
  topic: string,
  config: {
    contentProvider: 'deepseek' | 'qwen';
    designProvider: 'deepseek' | 'qwen';
    contentApiKey: string;
    designApiKey: string;
  },
  memory: AIMemory,
  imageContext?: string
): Promise<{
  result: GenerationResult;
  memoryUpdate: Partial<AIMemory>;
  designNotes?: string;
}> => {
  // Validate API keys are provided
  validateDualAIConfig(config);
  
  logger.group('=== Multi-Round Dual AI Generation Starting ===', true);
  logger.info(`Topic: ${topic}`);
  logger.info(`Content Provider: ${config.contentProvider}, Design Provider: ${config.designProvider}`);
  logger.info(`Using thinking mode: ${config.contentProvider === 'deepseek' ? dualAIThinkingModeEnabled : false}`);
  
  const allBlocks: ArticleBlock[] = [];
  let finalTitle = '';
  let finalDigest = '';
  const allKeywords: string[] = [];
  const colorSchemes: string[] = [];
  
  // Round 1: Background & Context
  logger.group('📘 Round 1: Background & Context', true);
  logger.time('Round 1');
  try {
    const round1Content = await generateContentWithAI(
      `${topic}\n\nGenerate ONLY the background and context section. Include opening hook, background information, and why this topic matters. Keep it concise (2-4 paragraphs).`,
      memory,
      config.contentProvider,
      config.contentApiKey,
      imageContext
    );
    
    logger.info(`✓ Content generated: ${round1Content.sections.length} sections`);
    
    const round1Design = await beautifyWithAI(
      round1Content,
      memory,
      config.designProvider,
      config.designApiKey
    );
    
    logger.info(`✓ Design applied: ${round1Design.blocks.length} blocks`);
    logger.info(`✓ Colors used: ${round1Design.colorScheme.join(', ')}`);
    
    allBlocks.push(...round1Design.blocks);
    finalTitle = round1Content.title;
    finalDigest = round1Content.digest;
    allKeywords.push(...round1Content.keywords);
    colorSchemes.push(...round1Design.colorScheme);
  } catch (error) {
    logger.error('Round 1 failed:', error);
    throw new Error(`Round 1 (Background) failed: ${error}`);
  } finally {
    logger.timeEnd('Round 1');
    logger.groupEnd();
  }
  
  // Round 2: Main Content & Copy
  logger.group('📝 Round 2: Main Content & Copy', true);
  logger.time('Round 2');
  try {
    const round2Content = await generateContentWithAI(
      `${topic}\n\nContinue the article. Generate the MAIN CONTENT with detailed explanations, key points, and supporting evidence. Do NOT repeat the background. Focus on the core message.`,
      memory,
      config.contentProvider,
      config.contentApiKey,
      imageContext
    );
    
    logger.info(`✓ Content generated: ${round2Content.sections.length} sections`);
    
    const round2Design = await beautifyWithAI(
      round2Content,
      memory,
      config.designProvider,
      config.designApiKey
    );
    
    logger.info(`✓ Design applied: ${round2Design.blocks.length} blocks`);
    logger.info(`✓ Colors used: ${round2Design.colorScheme.join(', ')}`);
    
    allBlocks.push(...round2Design.blocks);
    allKeywords.push(...round2Content.keywords);
    colorSchemes.push(...round2Design.colorScheme);
  } catch (error) {
    logger.error('Round 2 failed:', error);
    throw new Error(`Round 2 (Main Content) failed: ${error}`);
  } finally {
    logger.timeEnd('Round 2');
    logger.groupEnd();
  }
  
  // Round 3: Images & Visual Widgets
  logger.group('🎨 Round 3: Images & Visual Widgets', true);
  logger.time('Round 3');
  try {
    const round3Content = await generateContentWithAI(
      `${topic}\n\nAdd visual elements to enhance the article. Generate image descriptions, infographics ideas, statistics displays, or visual widgets. Focus on enhancing understanding through visuals.`,
      memory,
      config.contentProvider,
      config.contentApiKey,
      imageContext
    );
    
    logger.info(`✓ Content generated: ${round3Content.sections.length} visual elements`);
    
    const round3Design = await beautifyWithAI(
      round3Content,
      memory,
      config.designProvider,
      config.designApiKey
    );
    
    logger.info(`✓ Design applied: ${round3Design.blocks.length} blocks`);
    logger.info(`✓ Colors used: ${round3Design.colorScheme.join(', ')}`);
    
    allBlocks.push(...round3Design.blocks);
    allKeywords.push(...round3Content.keywords);
    colorSchemes.push(...round3Design.colorScheme);
  } catch (error) {
    logger.warn('⚠️  Round 3 failed - visual elements will be skipped:', error);
    logger.info('📄 Continuing with text-only article...');
    // Round 3 failure is not critical, continue without visual elements
  } finally {
    logger.timeEnd('Round 3');
    logger.groupEnd();
  }
  
  // Round 4: Summary & Conclusion
  logger.group('📊 Round 4: Summary & Conclusion', true);
  logger.time('Round 4');
  try {
    const round4Content = await generateContentWithAI(
      `${topic}\n\nProvide a summary and conclusion. Include key takeaways, final thoughts, and call-to-action. Also refine the article title and digest for maximum impact.`,
      memory,
      config.contentProvider,
      config.contentApiKey,
      imageContext
    );
    
    logger.info(`✓ Content generated: ${round4Content.sections.length} sections`);
    
    const round4Design = await beautifyWithAI(
      round4Content,
      memory,
      config.designProvider,
      config.designApiKey
    );
    
    logger.info(`✓ Design applied: ${round4Design.blocks.length} blocks`);
    logger.info(`✓ Colors used: ${round4Design.colorScheme.join(', ')}`);
    
    allBlocks.push(...round4Design.blocks);
    // Use round 4's refined title and digest
    finalTitle = round4Content.title || finalTitle;
    finalDigest = round4Content.digest || finalDigest;
    allKeywords.push(...round4Content.keywords);
    colorSchemes.push(...round4Design.colorScheme);
  } catch (error) {
    logger.warn('⚠️  Round 4 failed - using preliminary title and digest:', error);
    logger.info('📝 Article will use working title and digest from earlier rounds');
    // Round 4 failure is not critical, continue with preliminary title/digest
  } finally {
    logger.timeEnd('Round 4');
    logger.groupEnd();
  }
  
  // Final Summary
  logger.group('✅ Multi-Round Generation Complete', true);
  logger.info(`Final Title: ${finalTitle}`);
  logger.info(`Final Digest: ${finalDigest}`);
  logger.info(`Total Blocks: ${allBlocks.length}`);
  logger.info(`Total Keywords: ${allKeywords.length}`);
  logger.info(`Color Palette Used: ${[...new Set(colorSchemes)].join(', ')}`);
  logger.groupEnd();
  
  // Update memory
  const memoryUpdate: Partial<AIMemory> = {
    contentHistory: [
      ...memory.contentHistory,
      {
        timestamp: Date.now(),
        topic,
        style: 'multi-round',
        keywords: [...new Set(allKeywords)]
      }
    ],
    designHistory: [
      ...memory.designHistory,
      {
        timestamp: Date.now(),
        colorScheme: [...new Set(colorSchemes)],
        preferredBlocks: allBlocks.map(b => b.type).filter((t): t is BlockType => Object.values(BlockType).includes(t as BlockType))
      }
    ]
  };
  
  return {
    result: {
      title: finalTitle,
      digest: finalDigest,
      blocks: allBlocks,
      sources: []
    },
    memoryUpdate,
    designNotes: `Generated using multi-round layout mode with ${allBlocks.length} total blocks across 4 phases.`
  };
};

// --- Main Dual AI Pipeline ---

export const generateWithDualAI = async (
  topic: string,
  config: {
    contentProvider: 'deepseek' | 'qwen';
    designProvider: 'deepseek' | 'qwen';
    contentApiKey: string;
    designApiKey: string;
  },
  memory: AIMemory,
  imageContext?: string
): Promise<{
  result: GenerationResult;
  memoryUpdate: Partial<AIMemory>;
  designNotes?: string;
}> => {
  // Validate API keys are provided
  validateDualAIConfig(config);
  
  // Check if multi-round layout mode is enabled
  if (dualAIMultiRoundLayoutMode) {
    logger.info('🔄 Using Multi-Round Layout Mode for Dual AI');
    return generateWithDualAIMultiRound(topic, config, memory, imageContext);
  }
  
  // Standard dual AI generation
  logger.group('=== Dual AI Generation (Standard Mode) ===', true);
  logger.info(`Topic: ${topic}`);
  logger.info(`Content Provider: ${config.contentProvider}, Design Provider: ${config.designProvider}`);
  
  // Step 1: Content AI generates the article content
  logger.info('Step 1: Generating content with', config.contentProvider);
  logger.time('Content Generation');
  const contentResult = await generateContentWithAI(
    topic,
    memory,
    config.contentProvider,
    config.contentApiKey,
    imageContext
  );
  logger.timeEnd('Content Generation');

  // Step 2: Design AI beautifies the content
  logger.info('Step 2: Beautifying design with', config.designProvider);
  logger.time('Design Beautification');
  const designResult = await beautifyWithAI(
    contentResult,
    memory,
    config.designProvider,
    config.designApiKey
  );
  logger.timeEnd('Design Beautification');

  // Step 3: Update memory with this interaction
  logger.info('Step 3: Updating memory');
  const memoryUpdate: Partial<AIMemory> = {
    contentHistory: [
      ...memory.contentHistory,
      {
        timestamp: Date.now(),
        topic,
        style: contentResult.tone,
        keywords: contentResult.keywords
      }
    ],
    designHistory: [
      ...memory.designHistory,
      {
        timestamp: Date.now(),
        colorScheme: designResult.colorScheme,
        preferredBlocks: designResult.blocks.map(b => b.type as BlockType)
      }
    ]
  };

  // Final Summary
  logger.group('✅ Dual AI Generation Complete', true);
  logger.info(`Title: ${contentResult.title}`);
  logger.info(`Digest: ${contentResult.digest}`);
  logger.info(`Total Blocks: ${designResult.blocks.length}`);
  logger.info(`Keywords: ${contentResult.keywords.join(', ')}`);
  logger.info(`Color Scheme: ${designResult.colorScheme.join(', ')}`);
  logger.groupEnd();

  return {
    result: {
      title: contentResult.title,
      digest: contentResult.digest,
      blocks: designResult.blocks,
      sources: []
    },
    memoryUpdate,
    designNotes: designResult.designNotes
  };
};

// --- Export Memory Functions ---

export { DEFAULT_MEMORY };
