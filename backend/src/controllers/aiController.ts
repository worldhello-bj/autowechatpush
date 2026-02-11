import { Request, Response } from 'express';
import { sendSuccess, sendError, createLogger } from '../utils/index.js';
import { generateArticle, generateArticleParallel, generatePlainText } from '../services/index.js';
import { checkQuota, consumeQuota, getUserQuotaStatus } from '../services/index.js';
import { getApiConfigStatus, isQwenAvailable, isProviderAvailable } from '../services/index.js';
import { AIChatRequest, SSEEvent, AIProvider, AIRewriteRequest, aiRewriteRequestSchema } from '../types/index.js';

const logger = createLogger('ai');

/**
 * Get fallback provider when primary provider fails
 */
const getFallbackProvider = (primaryProvider: AIProvider): AIProvider | null => {
  const configStatus = getApiConfigStatus();

  // Try providers in order of preference, skipping the failed primary provider
  const providerOrder: AIProvider[] = [
    AIProvider.DEEPSEEK,
    AIProvider.QWEN,
  ];

  const providerConfigured: Record<AIProvider, boolean> = {
    [AIProvider.DEEPSEEK]: configStatus.deepSeekConfigured,
    [AIProvider.QWEN]: configStatus.dashScopeConfigured,
  };

  // Find first configured provider that is not the primary one
  for (const provider of providerOrder) {
    if (provider !== primaryProvider && providerConfigured[provider]) {
      return provider;
    }
  }

  return null;
};

/**
 * Generate article (non-streaming)
 * POST /api/v1/ai/generate
 * 
 * Implements automatic fallback:
 * - Tries the requested provider first
 * - If it fails, automatically tries other configured providers
 */
export const generate = async (req: Request, res: Response) => {
  try {
    const request = req.body as AIChatRequest;
    logger.info('AI generation request', {
      provider: request.provider,
      requestId: req.requestId
    });

    // Check user quota (authentication is now required)
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const quotaCheck = checkQuota(req.user.userId, 1);
    if (!quotaCheck.allowed) {
      return sendError(res, 402, 'QUOTA_EXCEEDED', quotaCheck.reason || 'Insufficient quota. Please upgrade your plan.');
    }

    // API keys are now managed exclusively by the backend pool
    // User-provided API keys are no longer accepted for security reasons

    let result;
    let usedProvider = request.provider;

    try {
      // Try primary provider (using backend pool only)
      result = await generateArticle(request);
      logger.info('Primary provider succeeded', { provider: request.provider, requestId: req.requestId });
    } catch (primaryError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : 'Unknown error';
      logger.warn('Primary provider failed, attempting fallback', {
        provider: request.provider,
        error: primaryMessage,
        requestId: req.requestId
      });

      // Try fallback provider
      const fallbackProvider = getFallbackProvider(request.provider);

      if (fallbackProvider) {
        try {
          const fallbackRequest = { ...request, provider: fallbackProvider };
          result = await generateArticle(fallbackRequest);
          usedProvider = fallbackProvider;
          logger.info('Fallback provider succeeded', {
            fallbackProvider,
            originalProvider: request.provider,
            requestId: req.requestId
          });
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          logger.error('Fallback provider also failed', {
            provider: fallbackProvider,
            error: fallbackMessage,
            requestId: req.requestId
          });
          // Re-throw the original error if fallback also fails
          throw primaryError;
        }
      } else {
        logger.error('No fallback provider available', { requestId: req.requestId });
        throw primaryError;
      }
    }

    // Consume quota (user is guaranteed to exist)
    consumeQuota(req.user.userId, 1, 'ai_generation', {
      provider: usedProvider,
      requestedProvider: request.provider,
      blocksCount: result.blocks.length,
      title: result.title,
    }, req.requestId);

    logger.info('AI generation completed', {
      title: result.title,
      blocksCount: result.blocks.length,
      usedProvider,
      requestId: req.requestId
    });

    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed';
    logger.error('AI generation failed', { error: message, requestId: req.requestId });

    if (message.includes('API key')) {
      return sendError(res, 401, 'MISSING_API_KEY', message);
    }

    sendError(res, 500, 'AI_ERROR', message);
  }
};

/**
 * Generate article with streaming (SSE)
 * POST /api/v1/ai/chat/stream
 * 
 * Implements automatic fallback:
 * - Tries the requested provider first
 * - If it fails, automatically tries other configured providers
 */
export const chatStream = async (req: Request, res: Response) => {
  const request = req.body as AIChatRequest;

  logger.info('SSE stream request', {
    provider: request.provider,
    requestId: req.requestId
  });

  // Check user quota (authentication is now required)
  if (!req.user) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
  }

  const quotaCheck = checkQuota(req.user.userId, 1);
  if (!quotaCheck.allowed) {
    return sendError(res, 402, 'QUOTA_EXCEEDED', quotaCheck.reason || 'Insufficient quota. Please upgrade your plan.');
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial heartbeat
  res.write(':heartbeat\n\n');

  const sendSSEEvent = (event: SSEEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);
  };

  // Heartbeat interval to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 15000);

  try {
    // Send thinking event if thinking mode is enabled
    if (request.thinkingMode) {
      sendSSEEvent({
        type: 'thinking',
        data: { message: 'AI is analyzing your request...' },
        timestamp: Date.now(),
      });
    }

    let result;
    let usedProvider = request.provider;

    try {
      // Try primary provider
      result = await generateArticle(request);
      logger.info('Primary provider succeeded (stream)', { provider: request.provider, requestId: req.requestId });
    } catch (primaryError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : 'Unknown error';
      logger.warn('Primary provider failed (stream), attempting fallback', {
        provider: request.provider,
        error: primaryMessage,
        requestId: req.requestId
      });

      // Notify user about fallback
      sendSSEEvent({
        type: 'info',
        data: { message: `Primary provider (${request.provider}) failed, trying fallback...` },
        timestamp: Date.now(),
      });

      // Try fallback provider
      const fallbackProvider = getFallbackProvider(request.provider);

      if (fallbackProvider) {
        try {
          const fallbackRequest = { ...request, provider: fallbackProvider };
          result = await generateArticle(fallbackRequest);
          usedProvider = fallbackProvider;
          logger.info('Fallback provider succeeded (stream)', {
            fallbackProvider,
            originalProvider: request.provider,
            requestId: req.requestId
          });

          sendSSEEvent({
            type: 'info',
            data: { message: `Successfully switched to ${fallbackProvider}` },
            timestamp: Date.now(),
          });
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          logger.error('Fallback provider also failed (stream)', {
            provider: fallbackProvider,
            error: fallbackMessage,
            requestId: req.requestId
          });
          throw primaryError;
        }
      } else {
        logger.error('No fallback provider available (stream)', { requestId: req.requestId });
        throw primaryError;
      }
    }

    // Send blocks one by one for streaming effect
    for (const block of result.blocks) {
      sendSSEEvent({
        type: 'block',
        data: block,
        timestamp: Date.now(),
      });

      // Small delay between blocks for visual streaming effect
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Send complete event
    sendSSEEvent({
      type: 'complete',
      data: {
        title: result.title,
        digest: result.digest,
        totalBlocks: result.blocks.length,
        sources: result.sources,
      },
      timestamp: Date.now(),
    });

    // Consume quota (user is guaranteed to exist)
    consumeQuota(req.user.userId, 1, 'ai_stream', {
      provider: usedProvider,
      requestedProvider: request.provider,
      blocksCount: result.blocks.length,
      title: result.title,
    }, req.requestId);

    logger.info('SSE stream completed', {
      title: result.title,
      blocksCount: result.blocks.length,
      usedProvider,
      requestId: req.requestId
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed';
    logger.error('SSE stream failed', { error: message, requestId: req.requestId });

    sendSSEEvent({
      type: 'error',
      data: { code: 'AI_ERROR', message },
      timestamp: Date.now(),
    });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
};

/**
 * Get AI usage/quota status
 * GET /api/v1/ai/quota
 */
export const getQuota = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
  }

  const status = getUserQuotaStatus(req.user.userId);

  if (!status) {
    return sendError(res, 404, 'NOT_FOUND', 'Quota status not found');
  }

  // Return detailed quota status
  sendSuccess(res, {
    userId: req.user.userId,
    hasQuota: status.remainingQuota > 0,
    remainingQuota: status.remainingQuota,
    dailyUsed: status.dailyUsed,
    dailyLimit: status.dailyLimit,
    monthlyUsed: status.monthlyUsed,
    monthlyLimit: status.monthlyLimit,
    plan: status.plan,
    message: status.remainingQuota > 0 ? 'Quota available' : 'Quota exceeded',
  });
};

// Constants for AI helper mappings
const LANGUAGE_MAP: Record<string, string> = {
  'en': '英文',
  'zh': '中文',
  'ja': '日文',
  'ko': '韩文',
  'fr': '法文',
  'de': '德文',
  'es': '西班牙文'
};

const HOOK_STYLE_DESC: Record<string, string> = {
  'question': '疑问式',
  'story': '故事式',
  'statistic': '数据式',
  'quote': '引用式',
  'surprising': '惊讶式'
};

const CTA_TYPE_DESC: Record<string, string> = {
  'subscribe': '关注订阅',
  'share': '分享转发',
  'comment': '评论互动',
  'action': '行动号召',
  'reflection': '思考总结'
};

/**
 * AI Helper Functions
 * POST /api/v1/ai/helper
 * 
 * Generic endpoint for AI helper functions like:
 * - generateTitles: Generate title suggestions
 * - generateSummary: Generate content summary
 * - extractKeywords: Extract keywords from content
 * - expandContent: Expand/elaborate on content
 * - polishContent: Polish/refine content
 * - translateContent: Translate content
 * - suggestStyles: Suggest writing styles
 * - generateHook: Generate article hooks
 * - generateCTA: Generate call-to-action
 * - rewriteContent: Rewrite content in different style
 */
export const aiHelper = async (req: Request, res: Response) => {
  try {
    const { action, content, provider, options } = req.body;

    if (!action || !content) {
      return sendError(res, 400, 'INVALID_REQUEST', 'Action and content are required');
    }

    logger.info('AI helper request', {
      action,
      provider: provider || 'deepseek',
      contentLength: content.length,
      requestId: req.requestId
    });

    // Check user quota (authentication is now required)
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const quotaCheck = checkQuota(req.user.userId, 0.1); // Helpers cost 0.1 credits
    if (!quotaCheck.allowed) {
      return sendError(res, 402, 'QUOTA_EXCEEDED', quotaCheck.reason || 'Insufficient quota.');
    }

    const selectedProvider = provider || AIProvider.DEEPSEEK;
    let prompt = '';

    // Build prompt based on action type
    switch (action) {
      case 'generateTitles':
        const count = options?.count || 5;
        prompt = `请为以下内容生成${count}个吸引人的标题建议。要求标题简洁有力、吸引眼球。\n\n内容：\n${content}\n\n请以JSON数组格式返回，例如：["标题1", "标题2", "标题3"]`;
        break;

      case 'generateSummary':
        const maxLength = options?.maxLength || 120;
        prompt = `请为以下内容生成一个简洁的摘要，不超过${maxLength}个字。\n\n内容：\n${content}`;
        break;

      case 'extractKeywords':
        const keywordCount = options?.count || 10;
        prompt = `请从以下内容中提取${keywordCount}个关键词。以JSON数组格式返回，例如：["关键词1", "关键词2"]。\n\n内容：\n${content}`;
        break;

      case 'expandContent':
        if (content.trim().startsWith('[')) {
          prompt = `请扩展以下JSON数组中的每一段文本。保持原意，但增加更多细节。请严格以JSON字符串数组格式返回，数组长度必须与输入一致，不要包含任何markdown格式。\n\n内容：\n${content}`;
        } else {
          prompt = `请扩展以下内容，使其更加详细和丰富。保持原意，但增加更多细节、例子和解释。\n\n原内容：\n${content}`;
        }
        break;

      case 'polishContent':
        if (content.trim().startsWith('[')) {
          prompt = `请润色以下JSON数组中的每一段文本。保持原意，但提升表达质量。请严格以JSON字符串数组格式返回，数组长度必须与输入一致，不要包含任何markdown格式。\n\n内容：\n${content}`;
        } else {
          prompt = `请润色以下内容，使其更加流畅、优雅、专业。保持原意，但提升表达质量。\n\n原内容：\n${content}`;
        }
        break;

      case 'translateContent':
        const targetLang = options?.targetLanguage || 'en';
        if (content.trim().startsWith('[')) {
          prompt = `请将以下JSON数组中的每一段文本翻译成${LANGUAGE_MAP[targetLang] || targetLang}。请严格以JSON字符串数组格式返回，数组长度必须与输入一致，不要包含任何markdown格式。\n\n内容：\n${content}`;
        } else {
          prompt = `请将以下内容翻译成${LANGUAGE_MAP[targetLang] || targetLang}：\n\n${content}`;
        }
        break;

      case 'suggestStyles':
        prompt = `请为以下内容推荐3-5种不同的写作风格变体（如正式、轻松、幽默、专业、文艺等）。以JSON格式返回，包含style（风格名）和preview（预览文本）。\n\n内容：\n${content}`;
        break;

      case 'generateHook':
        const hookStyle = options?.style || 'question';
        prompt = `请为以下主题生成一个${HOOK_STYLE_DESC[hookStyle] || '吸引人的'}开场白/引子（Hook），要求能够立即抓住读者注意力。\n\n主题：${content}`;
        break;

      case 'generateCTA':
        const ctaType = options?.type || 'subscribe';
        prompt = `请为以下内容生成一个${CTA_TYPE_DESC[ctaType] || '有效的'}行动号召（CTA），鼓励读者采取行动。\n\n内容主题：${content}`;
        break;

      case 'rewriteContent':
        const rewriteStyle = options?.style || 'casual';
        if (content.trim().startsWith('[')) {
          prompt = `请用${rewriteStyle}风格重写以下JSON数组中的每一段文本。保持核心信息但改变表达方式。请严格以JSON字符串数组格式返回，数组长度必须与输入一致，不要包含任何markdown格式。\n\n内容：\n${content}`;
        } else {
          prompt = `请用${rewriteStyle}风格重写以下内容，保持核心信息但改变表达方式。\n\n原内容：\n${content}`;
        }
        break;

      case 'custom':
        prompt = content;
        break;

      case 'generateContent':
        const contentType = options?.contentType || 'paragraph';
        const contentMaxLength = options?.maxLength || content.length;
        prompt = `请根据"${content}"这个主题生成一段${contentType}类型的内容。

要求：
- 内容要与主题相关
- 长度适中（大约${Math.floor(contentMaxLength / 10)}字左右）
- 语言自然流畅
- 直接输出内容，不要包含多余的解释

生成的内容：`;
        break;

      default:
        return sendError(res, 400, 'INVALID_ACTION', `Unknown action: ${action}`);
    }

    // Call AI service with the constructed prompt
    let responseData: unknown;

    if (action === 'custom') {
      // Custom action uses plain text completion (no tool calling)
      // so the AI response is returned as-is without being split into blocks
      const plainResult = await generatePlainText(prompt, selectedProvider);
      responseData = plainResult;
    } else {
      const result = await generateArticle({
        message: prompt,
        provider: selectedProvider,
        useSearch: false,
        isFormattingMode: false,
        thinkingMode: false,
        multiRoundMode: false,
      });

      // Extract result based on action type
      if (action === 'generateTitles' || action === 'extractKeywords' || action === 'suggestStyles') {
        // Try to parse JSON from the AI response
        try {
          const textContent = result.blocks.map(b => b.content).join('\n');
          // Look for JSON array in the response (non-greedy match)
          const jsonMatch = textContent.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            responseData = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: split by newlines
            responseData = textContent.split('\n').filter(line => line.trim());
          }
        } catch {
          responseData = result.blocks.map(b => b.content).filter(c => c.trim());
        }
      } else {
        // Return the full text content
        responseData = result.blocks.map(b => b.content).join('\n\n');
      }
    }

    // Consume quota (user is guaranteed to exist)
    consumeQuota(req.user.userId, 0.1, 'ai_generation', {
      action,
      provider: selectedProvider,
      contentLength: content.length,
    }, req.requestId);

    logger.info('AI helper completed', { action, requestId: req.requestId });

    sendSuccess(res, {
      action,
      result: responseData,
      provider: selectedProvider,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI helper failed';
    logger.error('AI helper failed', { error: message, requestId: req.requestId });

    if (message.includes('API key')) {
      return sendError(res, 401, 'MISSING_API_KEY', message);
    }

    sendError(res, 500, 'AI_ERROR', message);
  }
};

/**
 * Rewrite article content based on DOM structure
 * POST /api/v1/ai/rewrite
 *
 * Implements DOM-based article rewriting with structure preservation:
 * - Extracts content blocks from HTML while preserving DOM references
 * - Generates new content with AI while maintaining structure
 * - Injects rewritten content back into original HTML
 */
export const rewriteArticle = async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validationResult = aiRewriteRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return sendError(res, 400, 'INVALID_REQUEST', validationResult.error.message);
    }

    const request: AIRewriteRequest = validationResult.data;

    logger.info('AI rewrite request', {
      topic: request.topic,
      blockCount: request.blocks.length,
      requestId: req.requestId
    });

    // Check user quota (authentication is now required)
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const quotaCheck = checkQuota(req.user.userId, 0.5); // Rewrite costs 0.5 credits
    if (!quotaCheck.allowed) {
      return sendError(res, 402, 'QUOTA_EXCEEDED', quotaCheck.reason || 'Insufficient quota.');
    }

    // Build structured prompt for AI
    const systemPrompt = `# Role
你是一位精通新媒体排版与内容创作的AI专家。你的任务是根据给定的文章结构，重写一篇关于主题 "${request.topic}" 的文章。

# Constraints (绝对准则)
1. **结构对齐**：输入包含 ${request.blocks.length} 个段落对象，输出必须严格包含 ${request.blocks.length} 个段落对象。顺序不得打乱。
2. **类型适配**：
   - type="title"：必须写成吸引人的标题。
   - type="subtitle"：写成简洁有力的副标题。
   - type="quote"：必须写成金句、总结或引言风格。
   - type="paragraph"：写成流畅的正文。
   - type="list-item"：写成列表项风格。
3. **字数控制**：参考 \`charLimit\` 字段。允许浮动 ±30%，但严禁过长导致排版溢出。
4. **格式要求**：输出纯 JSON 格式，键名必须为 \`index\` 和 \`newContent\`。

# Input Context
我将提供原文的结构数组。请忽略原文的具体内容，仅参考其长度和文风逻辑，用新主题 "${request.topic}" 彻底重写。

# Output Format Example
{
  "blocks": [
    { "index": 0, "newContent": "新文章的主标题" },
    { "index": 1, "newContent": "这是第一段重写的正文内容..." }
  ]
}`;

    // Format blocks for AI input
    const blocksText = request.blocks.map(block =>
      `Block ${block.index} (type: ${block.type}, limit: ${block.charLimit} chars):\n${block.originalText}`
    ).join('\n\n');

    const userPrompt = `请根据以下内容块结构，重写一篇关于"${request.topic}"的文章：

${blocksText}

请确保输出格式正确，每个块的内容都适合其类型和字数限制。`;

    // Try primary provider first
    let result;
    let usedProvider = AIProvider.DEEPSEEK;

    try {
      result = await generateArticle({
        message: userPrompt,
        provider: AIProvider.DEEPSEEK,
        useSearch: false,
        isFormattingMode: false,
        thinkingMode: false,
        multiRoundMode: false,
        userprompt: systemPrompt, // Use system prompt as userprompt
      });
      logger.info('Rewrite primary provider succeeded', { requestId: req.requestId });
    } catch (primaryError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : 'Unknown error';
      logger.warn('Rewrite primary provider failed, attempting fallback', {
        error: primaryMessage,
        requestId: req.requestId
      });

      // Try fallback provider
      const fallbackProvider = getFallbackProvider(AIProvider.DEEPSEEK);
      if (fallbackProvider) {
        try {
          result = await generateArticle({
            message: userPrompt,
            provider: fallbackProvider,
            useSearch: false,
            isFormattingMode: false,
            thinkingMode: false,
            multiRoundMode: false,
            userprompt: systemPrompt,
          });
          usedProvider = fallbackProvider;
          logger.info('Rewrite fallback provider succeeded', { fallbackProvider, requestId: req.requestId });
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          logger.error('Rewrite fallback provider also failed', {
            provider: fallbackProvider,
            error: fallbackMessage,
            requestId: req.requestId
          });
          throw primaryError;
        }
      } else {
        logger.error('No fallback provider available for rewrite', { requestId: req.requestId });
        throw primaryError;
      }
    }

    // Extract JSON response from AI result
    const aiResponseText = result.blocks.map(b => b.content).join('\n');

    let rewriteResult;
    try {
      // Try to parse JSON from AI response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (validateRewriteResponse(parsed)) {
          rewriteResult = parsed;
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      logger.warn('JSON parsing failed, using fallback strategy', {
        error: parseError instanceof Error ? parseError.message : 'Unknown',
        requestId: req.requestId
      });

      // Fallback: create response with original content
      rewriteResult = {
        blocks: request.blocks.map(block => ({
          index: block.index,
          newContent: block.originalText // Keep original content as fallback
        }))
      };
    }

    // Consume quota
    consumeQuota(req.user.userId, 0.5, 'ai_rewrite', {
      provider: usedProvider,
      topic: request.topic,
      blockCount: request.blocks.length,
    }, req.requestId);

    logger.info('AI rewrite completed', {
      topic: request.topic,
      blockCount: request.blocks.length,
      usedProvider,
      requestId: req.requestId
    });

    sendSuccess(res, {
      topic: request.topic,
      blocks: rewriteResult.blocks,
      provider: usedProvider,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI rewrite failed';
    logger.error('AI rewrite failed', { error: message, requestId: req.requestId });

    if (message.includes('API key')) {
      return sendError(res, 401, 'MISSING_API_KEY', message);
    }

    sendError(res, 500, 'AI_ERROR', message);
  }
};

/**
 * Validate rewrite response format
 */
function validateRewriteResponse(response: any): boolean {
  if (!response || typeof response !== 'object') return false;
  if (!Array.isArray(response.blocks)) return false;

  return response.blocks.every((block: any) =>
    typeof block === 'object' &&
    typeof block.index === 'number' &&
    typeof block.newContent === 'string'
  );
}

/**
 * Get AI features availability
 * Returns which AI features are available based on backend configuration
 */
export const getFeaturesAvailability = (req: Request, res: Response): void => {
  try {
    // Use the key pool service to check provider availability
    const deepseekAvailable = isProviderAvailable(AIProvider.DEEPSEEK);
    const qwenAvailable = isProviderAvailable(AIProvider.QWEN);

    sendSuccess(res, {
      features: {
        articleGeneration: deepseekAvailable || qwenAvailable,
        // Image analysis and TTS backend endpoints are not yet implemented
        // Once implemented, these should check qwenAvailable
        imageAnalysis: false, // TODO: Implement backend image analysis endpoint
        textToSpeech: false,  // TODO: Implement backend TTS endpoint
        articleRewrite: deepseekAvailable || qwenAvailable, // Rewrite feature
      },
      providers: {
        deepseek: deepseekAvailable,
        qwen: qwenAvailable,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check features';
    logger.error('Failed to check features availability', { error: message });
    sendError(res, 500, 'FEATURE_CHECK_ERROR', message);
  }
};
