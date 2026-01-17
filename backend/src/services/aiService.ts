import { config } from '../config/index.js';
import { createLogger } from '../utils/index.js';
import { AIProvider, AIChatRequest, GenerationResult, BlockType, ArticleBlock } from '../types/index.js';
import { getApiKeyFromPool, releaseApiKey } from './aiKeyPoolService.js';
import { loadPromptConfig, buildCompletePrompt } from './promptService.js';

const logger = createLogger('ai-service');

// API configuration
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/chat/completions';
const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

type LayoutFunctionArgs = {
  title?: string;
  digest?: string;
  blocks?: Array<Partial<ArticleBlock>>;
};

// Tool definition for article layout
const layoutArticleFunction = {
  type: 'function',
  function: {
    name: 'layout_article',
    description: 'Generates a structured layout for a WeChat article based on content.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The main title of the article.' },
        digest: { type: 'string', description: 'A short summary of the article.' },
        blocks: {
          type: 'array',
          description: 'The content blocks of the article.',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: Object.values(BlockType),
                description: 'Block type for formatting.',
              },
              content: { type: 'string', description: 'The main text content.' },
              title: { type: 'string', description: 'Title for card, header, callout blocks.' },
              items: {
                type: 'array',
                items: { type: 'string' },
                description: 'List items for list or numbered_list types.',
              },
              style: {
                type: 'string',
                enum: ['default', 'primary', 'warning', 'quote', 'red', 'blue', 'purple', 'orange', 'gold', 'green', 'pink', 'cyan', 'gradient'],
                description: 'Visual color style.',
              },
              level: { type: 'number', enum: [1, 2, 3], description: 'Header level.' },
              alignment: { type: 'string', enum: ['left', 'center', 'right'], description: 'Text alignment.' },
              icon: { type: 'string', enum: ['info', 'warning', 'success', 'error', 'tip', 'note'], description: 'Icon type for callout blocks.' },
            },
            required: ['type', 'content'],
          },
        },
      },
      required: ['title', 'digest', 'blocks'],
    },
  },
};

/**
 * Interface for streaming callbacks
 */
export interface StreamCallbacks {
  onThinking?: (content: string) => void;
  onContent?: (content: string) => void;
  onComplete?: (result: GenerationResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Make a request to DeepSeek API
 */
const callDeepSeekAPI = async (
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  thinkingMode: boolean = false
): Promise<GenerationResult> => {
  logger.info('Calling DeepSeek API', { thinkingMode });

  const requestBody: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
    tools: [layoutArticleFunction],
    tool_choice: 'auto',
  };

  if (thinkingMode) {
    requestBody.thinking = { type: 'enabled' };
  }

  let success = false;
  let errorMessage: string | undefined;

  try {
    const response = await fetch(DEEPSEEK_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      errorMessage = `DeepSeek API Error: ${errorData.error?.message || response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices?: Array<{ message?: { tool_calls?: Array<{ function: { name: string; arguments: string } }> } }> };
    const message = data.choices?.[0]?.message;

    if (!message?.tool_calls?.[0]) {
      errorMessage = 'DeepSeek did not return structured content';
      throw new Error(errorMessage);
    }

    const toolCall = message.tool_calls[0];
    if (toolCall.function.name !== 'layout_article') {
      errorMessage = 'Unexpected function call from DeepSeek';
      throw new Error(errorMessage);
    }

    const args = JSON.parse(toolCall.function.arguments);
    const blocks = (args.blocks || []).map((b: Record<string, unknown>, index: number) => ({
      id: `ds-${Date.now()}-${index}`,
      ...b,
    }));

    success = true;
    return {
      title: args.title || 'Untitled Article',
      digest: args.digest || 'No summary available.',
      blocks,
      sources: [],
    };
  } finally {
    // Release the API key back to the pool
    releaseApiKey(apiKey, success, errorMessage);
  }
};

/**
 * Make a request to Qwen (DashScope) API
 */
const callQwenAPI = async (
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<GenerationResult> => {
  logger.info('Calling Qwen API');

  let success = false;
  let errorMessage: string | undefined;

  try {
    const response = await fetch(QWEN_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages,
        tools: [layoutArticleFunction],
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      errorMessage = `Qwen API Error: ${errorData.error?.message || response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices?: Array<{ message?: { tool_calls?: Array<{ function: { name: string; arguments: string } }> } }> };
    const message = data.choices?.[0]?.message;

    if (!message?.tool_calls?.[0]) {
      errorMessage = 'Qwen did not return structured content';
      throw new Error(errorMessage);
    }

    const toolCall = message.tool_calls[0];
    if (toolCall.function.name !== 'layout_article') {
      errorMessage = 'Unexpected function call from Qwen';
      throw new Error(errorMessage);
    }

    const args = JSON.parse(toolCall.function.arguments);
    const blocks = (args.blocks || []).map((b: Record<string, unknown>, index: number) => ({
      id: `qw-${Date.now()}-${index}`,
      ...b,
    }));

    success = true;
    return {
      title: args.title || 'Untitled Article',
      digest: args.digest || 'No summary available.',
      blocks,
      sources: [],
    };
  } finally {
    // Release the API key back to the pool
    releaseApiKey(apiKey, success, errorMessage);
  }
};

/**
 * Make a request to Google Gemini API (backend proxy)
 */

/**
 * Build prompt for article generation using backend prompt configuration
 */
const buildPrompt = async (request: AIChatRequest): Promise<{
  systemPrompt: string;
  userPrompt: string;
  validationResult?: any;
}> => {
  // Load current prompt configuration
  const promptConfig = await loadPromptConfig();

  // Build complete prompt using prompt service
  const result = await buildCompletePrompt(
    {
      message: request.message,
      isFormattingMode: request.isFormattingMode,
      userprompt: request.userprompt,
      imageContext: request.imageContext,
      useMultiRound: request.multiRoundMode,
      round: request.multiRoundMode ? 1 : undefined,
      template: request.template
    },
    promptConfig
  );

  return result;
};

/**
 * Generate article with the specified AI provider
 */
export const generateArticle = async (
  request: AIChatRequest
): Promise<GenerationResult> => {
  // Handle template fill mode - special case where we fill existing template
  if (request.template) {
    return generateTemplateFill(request);
  }

  // Build prompt using backend prompt configuration
  const { systemPrompt, userPrompt, validationResult } = await buildPrompt(request);

  // Log validation result if user provided custom prompt
  if (request.userprompt && validationResult) {
    logger.info('User prompt validation result', {
      isValid: validationResult.isValid,
      score: validationResult.score,
      issues: validationResult.issues,
      originalLength: validationResult.originalLength,
      filteredLength: validationResult.filteredLength
    });
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  switch (request.provider) {
    case AIProvider.DEEPSEEK: {
      const apiKey = await getApiKeyFromPool(AIProvider.DEEPSEEK);
      return callDeepSeekAPI(apiKey, messages, request.thinkingMode);
    }
    case AIProvider.QWEN: {
      const apiKey = await getApiKeyFromPool(AIProvider.QWEN);
      return callQwenAPI(apiKey, messages);
    }
    default:
      throw new Error('Unsupported AI provider');
  }
};

/**
 * Generate content to fill existing template blocks
 */
const generateTemplateFill = async (request: AIChatRequest): Promise<GenerationResult> => {
  const template = request.template;
  const { systemPrompt, userPrompt } = await buildPrompt(request);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let newContents: Array<{ index: number; newContent: string }> = [];

  try {
    // Call AI to generate content for template blocks
    switch (request.provider) {
      case AIProvider.DEEPSEEK: {
        const apiKey = await getApiKeyFromPool(AIProvider.DEEPSEEK);
        const result = await callDeepSeekForTemplateFill(apiKey, messages, request.thinkingMode);
        newContents = result;
        break;
      }
      case AIProvider.QWEN: {
        const apiKey = await getApiKeyFromPool(AIProvider.QWEN);
        const result = await callQwenForTemplateFill(apiKey, messages);
        newContents = result;
        break;
      }
      default:
        throw new Error('Unsupported AI provider');
    }

    // Fill original blocks with new content
    const filledBlocks = [...template.originalBlocks];
    newContents.forEach(({ index, newContent }) => {
      if (filledBlocks[index]) {
        filledBlocks[index] = { ...filledBlocks[index], content: newContent };
      }
    });

    logger.info('Template fill completed', {
      totalBlocks: template.originalBlocks.length,
      filledBlocks: newContents.length
    });

    return {
      title: template.title,
      digest: template.digest || 'Template filled content',
      blocks: filledBlocks,
      sources: [],
    };

  } catch (error) {
    logger.error('Template fill failed, returning original blocks:', error);
    // Return original blocks if fill fails
    return {
      title: template.title,
      digest: template.digest || 'Original template content',
      blocks: template.originalBlocks,
      sources: [],
    };
  }
};

/**
 * Call DeepSeek API for template fill
 */
const callDeepSeekForTemplateFill = async (
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  thinkingMode: boolean = false
): Promise<Array<{ index: number; newContent: string }>> => {
  logger.info('Calling DeepSeek API for template fill');

  const requestBody: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
  };

  if (thinkingMode) {
    requestBody.thinking = { type: 'enabled' };
  }

  let success = false;
  let errorMessage: string | undefined;

  try {
    const response = await fetch(`https://api.deepseek.com/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      errorMessage = `DeepSeek API Error: ${errorData.error?.message || response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      errorMessage = 'DeepSeek did not return content';
      throw new Error(errorMessage);
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    success = true;
    return Array.isArray(parsed) ? parsed : [];

  } finally {
    // Release the API key back to the pool
    releaseApiKey(apiKey, success, errorMessage);
  }
};

/**
 * Call Qwen API for template fill
 */
const callQwenForTemplateFill = async (
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<Array<{ index: number; newContent: string }>> => {
  logger.info('Calling Qwen API for template fill');

  let success = false;
  let errorMessage: string | undefined;

  try {
    const response = await fetch(`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      errorMessage = `Qwen API Error: ${errorData.error?.message || response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      errorMessage = 'Qwen did not return content';
      throw new Error(errorMessage);
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    success = true;
    return Array.isArray(parsed) ? parsed : [];

  } finally {
    // Release the API key back to the pool
    releaseApiKey(apiKey, success, errorMessage);
  }
};

/**
 * Parallel AI generation with race strategy
 * Uses Promise.race to return the first successful response
 */
export const generateArticleParallel = async (
  request: AIChatRequest
): Promise<GenerationResult> => {
  logger.info('Starting parallel AI generation');

  const primaryProvider = request.provider;
  const fallbackProvider =
    primaryProvider === AIProvider.DEEPSEEK ? AIProvider.QWEN : AIProvider.DEEPSEEK;

  const promises: Promise<GenerationResult>[] = [];

  // Primary provider
  promises.push(
    generateArticle(request).catch((err) => {
      logger.warn(`Primary provider ${primaryProvider} failed`, { error: err.message });
      throw err;
    })
  );

  // Fallback provider
  const fallbackRequest = { ...request, provider: fallbackProvider };
  promises.push(
    generateArticle(fallbackRequest).catch((err) => {
      logger.warn(`Fallback provider ${fallbackProvider} failed`, { error: err.message });
      throw err;
    })
  );

  try {
    // Race: first successful response wins
    const result = await Promise.race(promises);
    logger.info('Parallel generation completed successfully');
    return result;
  } catch (error) {
    // If race fails, try to get any result
    const results = await Promise.allSettled(promises);
    const successResult = results.find((r) => r.status === 'fulfilled');
    if (successResult && successResult.status === 'fulfilled') {
      return successResult.value;
    }

    // All failed
    throw new Error('All AI providers failed to generate content');
  }
};

/**
 * Parse article content and convert to structured blocks
 * Used for importing articles from external sources
 */
export const parseArticleContent = async (
  cleanedHtml: string,
  provider: AIProvider = AIProvider.DEEPSEEK
): Promise<ArticleBlock[]> => {
  logger.info('Parsing article content with AI');

  const systemPrompt = `You are a layout reverse engineer. Your task is to analyze HTML content and convert it into structured blocks.

Guidelines:
- Identify headers (h1, h2, h3) and create HEADER blocks with appropriate levels
- Convert paragraphs to PARAGRAPH blocks
- Identify images (marked with placeholder URLs) and create IMAGE blocks
- Identify quoted text and create QUOTE blocks
- Identify lists and create LIST or NUMBERED_LIST blocks
- Preserve text hierarchy and structure
- Use appropriate block types from: header, paragraph, image, quote, list, numbered_list, divider, card, callout
- For images, preserve the placeholder URL as content
- Add visual variety with different styles (red, blue, purple, green, orange, gold)`;

  const userPrompt = `Convert the following HTML content into structured article blocks:

"""
${cleanedHtml}
"""

Return structured blocks using the layout_article tool. For each image placeholder found, create an IMAGE block.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let result: GenerationResult;
  
  switch (provider) {
    case AIProvider.DEEPSEEK: {
      const apiKey = await getApiKeyFromPool(AIProvider.DEEPSEEK);
      result = await callDeepSeekAPI(apiKey, messages, false);
      break;
    }
    case AIProvider.QWEN: {
      const apiKey = await getApiKeyFromPool(AIProvider.QWEN);
      result = await callQwenAPI(apiKey, messages);
      break;
    }
    default:
      throw new Error('Unsupported AI provider');
  }

  logger.info('Content parsed successfully', { blocksCount: result.blocks.length });
  return result.blocks;
};
