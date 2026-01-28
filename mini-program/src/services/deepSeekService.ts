import { loggers } from './logger';
import { generateArticleViaBackend } from './backendAIClient';
import { GenerationResult } from "./geminiService";

// Re-export StyleSuggestion for use in other modules
export type { StyleSuggestion } from './backendAIClient';

const logger = loggers.deepseek;

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

// NOTE: AI helper functions (generateTitleSuggestions, generateSummary, expandContent, etc.)
// have been consolidated into backendAIClient.ts. Use callAIHelper() directly:
//
// import { callAIHelper } from './backendAIClient';
// const result = await callAIHelper({ action: 'generateTitles', content, provider: 'deepseek' });
//
// Supported actions: generateTitles, generateSummary, expandContent, polishContent,
//                   extractKeywords, translateContent, suggestStyles, generateHook,
//                   generateCTA, rewriteContent