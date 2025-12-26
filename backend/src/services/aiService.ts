import { config } from '../config/index.js';
import { createLogger } from '../utils/index.js';
import { AIProvider, AIChatRequest, GenerationResult, BlockType, ArticleBlock } from '../types/index.js';
import { getApiKeyFromPool, releaseApiKey } from './aiKeyPoolService.js';

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
 * Build prompt for article generation
 */
const buildPrompt = (request: AIChatRequest): string => {
  if (request.isFormattingMode) {
    return `
      You are a professional WeChat Official Account editor.
      Your task is to take the provided raw text and format it into a structured WeChat article layout using the 'layout_article' tool.
      
      Guidelines:
      - Preserve the original meaning
      - Add Headers with appropriate levels
      - Convert key points into 'card' blocks
      - Use different colors to distinguish sections
      
      Input Text to Format:
      """
      ${request.message}
      """
      
      RETURN ONLY THE FUNCTION CALL.
    `;
  }

  return `
    You are a professional WeChat Official Account editor.
    Your task is to write a high-quality article about: "${request.message}".
    
    ${request.imageContext ? `Context from uploaded image: ${request.imageContext}` : ''}
    
    Guidelines:
    - Use 'card' blocks for key takeaways
    - Use headers with levels (1, 2, 3)
    - Add dividers between sections
    - Use callouts for important tips
    - Make each section visually distinct with colors
    
    RETURN ONLY THE FUNCTION CALL.
  `;
};

/**
 * Generate article with the specified AI provider
 */
export const generateArticle = async (
  request: AIChatRequest
): Promise<GenerationResult> => {
  const systemPrompt =
    'You are a creative WeChat editor. Use bright colors (blue, red, gold, purple) in your layouts.';
  const userPrompt = buildPrompt(request);

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
