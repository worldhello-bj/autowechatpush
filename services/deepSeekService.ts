
import { ArticleBlock, BlockType, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';
import { safeParseJSON } from './jsonParser';
import { generateArticleViaBackend, callAIHelper, type StyleSuggestion } from './backendAIClient';

// Re-export StyleSuggestion for use in other modules
export type { StyleSuggestion } from './backendAIClient';

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

import { LAYOUT_ARTICLE_TOOL_DEF } from './aiToolDefinitions';

// Re-use the shared structure for OpenAI-compatible tool definitions
const tools = [
  LAYOUT_ARTICLE_TOOL_DEF
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

// NOTE: AI helper functions (generateTitleSuggestions, generateSummary, expandContent, etc.)
// have been consolidated into backendAIClient.ts. Use callAIHelper() directly:
//
// import { callAIHelper } from './backendAIClient';
// const result = await callAIHelper({ action: 'generateTitles', content, provider: 'deepseek' });
//
// Supported actions: generateTitles, generateSummary, expandContent, polishContent,
//                   extractKeywords, translateContent, suggestStyles, generateHook,
//                   generateCTA, rewriteContent
