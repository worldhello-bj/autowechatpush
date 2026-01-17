/**
 * Prompt Management Service
 * 
 * Handles prompt storage, validation, and retrieval.
 * Supports both system prompts and user custom prompts.
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/index.js';
import { DEFAULT_PROMPTS, PromptConfig, interpolatePrompt } from '../config/promptConfig.js';

const logger = createLogger('prompt-service');

// File paths for prompt storage
const PROMPT_CONFIG_PATH = path.join(process.cwd(), 'data', 'prompts.json');
const SENSITIVE_WORDS_PATH = path.join(process.cwd(), 'data', 'sensitive-words.txt');

// Default sensitive words list (can be extended via file)
const DEFAULT_SENSITIVE_WORDS = [
  'api_key', 'apikey', 'secret', 'password', 'token',
  'system', 'root', 'admin', 'sudo', 'exec', 'eval',
  'javascript:', 'data:', 'file:', 'http://', 'https://',
  '<script>', '</script>', 'onload=', 'onerror=',
  'DROP TABLE', 'DELETE FROM', 'INSERT INTO', 'UPDATE',
  'UNION SELECT', 'OR 1=1', ';--'
];

export interface PromptValidationResult {
  isValid: boolean;
  score: number; // 0-100 safety score
  issues: string[];
  filteredPrompt?: string;
  originalLength: number;
  filteredLength: number;
}

export interface UserPromptRequest {
  prompt: string;
  type?: 'generation' | 'formatting' | 'system' | 'custom';
  userId?: string;
}

/**
 * Load current prompt configuration from file
 * Falls back to defaults if file doesn't exist
 */
export const loadPromptConfig = async (): Promise<PromptConfig> => {
  try {
    await fs.access(PROMPT_CONFIG_PATH);
    const content = await fs.readFile(PROMPT_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content) as PromptConfig;
    
    // Validate structure
    if (!config.systemPrompt || !config.generationPrompt || !config.formattingPrompt || !config.multiRound) {
      logger.warn('Prompt config file has invalid structure, using defaults');
      return DEFAULT_PROMPTS;
    }
    
    logger.info('Loaded prompt configuration from file');
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.info('No prompt config file found, using defaults');
      // Create directory and save defaults
      await savePromptConfig(DEFAULT_PROMPTS);
      return DEFAULT_PROMPTS;
    }
    logger.error('Failed to load prompt config:', error);
    return DEFAULT_PROMPTS;
  }
};

/**
 * Save prompt configuration to file
 */
export const savePromptConfig = async (config: PromptConfig): Promise<void> => {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(PROMPT_CONFIG_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save to file
    await fs.writeFile(PROMPT_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    logger.info('Saved prompt configuration to file');
  } catch (error) {
    logger.error('Failed to save prompt config:', error);
    throw new Error('Failed to save prompt configuration');
  }
};

/**
 * Reset prompt configuration to defaults
 */
export const resetPromptConfig = async (): Promise<PromptConfig> => {
  await savePromptConfig(DEFAULT_PROMPTS);
  logger.info('Reset prompt configuration to defaults');
  return DEFAULT_PROMPTS;
};

/**
 * Load sensitive words list from file
 */
const loadSensitiveWords = async (): Promise<string[]> => {
  try {
    await fs.access(SENSITIVE_WORDS_PATH);
    const content = await fs.readFile(SENSITIVE_WORDS_PATH, 'utf-8');
    const words = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    return [...DEFAULT_SENSITIVE_WORDS, ...words];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Create default sensitive words file
      await fs.mkdir(path.dirname(SENSITIVE_WORDS_PATH), { recursive: true });
      await fs.writeFile(SENSITIVE_WORDS_PATH, DEFAULT_SENSITIVE_WORDS.join('\n'), 'utf-8');
    }
    return DEFAULT_SENSITIVE_WORDS;
  }
};

/**
 * Validate user-provided prompt for safety and compliance
 */
export const validateUserPrompt = async (
  userPrompt: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    strictMode?: boolean;
  } = {}
): Promise<PromptValidationResult> => {
  const {
    maxLength = 5000,
    minLength = 10,
    allowHtml = false,
    strictMode = false
  } = options;
  
  const issues: string[] = [];
  let filteredPrompt = userPrompt;
  let score = 100; // Start with perfect score
  
  // 1. Length validation
  const originalLength = userPrompt.length;
  if (originalLength < minLength) {
    issues.push(`Prompt too short (${originalLength} chars, minimum ${minLength})`);
    score -= 30;
  }
  if (originalLength > maxLength) {
    issues.push(`Prompt too long (${originalLength} chars, maximum ${maxLength})`);
    score -= 40;
    // Truncate if too long
    filteredPrompt = userPrompt.substring(0, maxLength);
  }
  
  // 2. Load sensitive words
  const sensitiveWords = await loadSensitiveWords();
  
  // 3. Check for sensitive content
  const lowerPrompt = filteredPrompt.toLowerCase();
  const foundSensitiveWords: string[] = [];
  
  for (const word of sensitiveWords) {
    if (lowerPrompt.includes(word.toLowerCase())) {
      foundSensitiveWords.push(word);
      score -= 5; // Deduct 5 points per sensitive word
    }
  }
  
  if (foundSensitiveWords.length > 0) {
    issues.push(`Found sensitive words: ${foundSensitiveWords.join(', ')}`);
    
    if (strictMode) {
      // Remove sensitive words in strict mode
      for (const word of foundSensitiveWords) {
        const regex = new RegExp(word, 'gi');
        filteredPrompt = filteredPrompt.replace(regex, '[FILTERED]');
      }
    }
  }
  
  // 4. Check for dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /`.*`/, // Backticks for command execution
    /\$\(.*\)/, // Command substitution
    /<script.*>/i,
    /javascript:/i,
    /data:text\/html/i
  ];
  
  const foundPatterns: string[] = [];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(filteredPrompt)) {
      foundPatterns.push(pattern.toString());
      score -= 20; // Heavy penalty for dangerous patterns
    }
  }
  
  if (foundPatterns.length > 0) {
    issues.push(`Found dangerous patterns: ${foundPatterns.join(', ')}`);
    
    // Remove dangerous patterns
    for (const pattern of dangerousPatterns) {
      filteredPrompt = filteredPrompt.replace(pattern, '[REMOVED]');
    }
  }
  
  // 5. HTML validation (if not allowed)
  if (!allowHtml) {
    const htmlTags = filteredPrompt.match(/<[^>]+>/g);
    if (htmlTags && htmlTags.length > 0) {
      issues.push(`HTML tags found: ${htmlTags.slice(0, 3).join(', ')}${htmlTags.length > 3 ? '...' : ''}`);
      score -= 15;
      
      // Remove HTML tags
      filteredPrompt = filteredPrompt.replace(/<[^>]+>/g, '');
    }
  }
  
  // 6. Check for excessive repetition (potential spam)
  const words = filteredPrompt.split(/\s+/);
  const wordCounts: Record<string, number> = {};
  let hasExcessiveRepetition = false;
  
  for (const word of words) {
    if (word.length > 3) { // Only count words longer than 3 chars
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] > 10) {
        hasExcessiveRepetition = true;
        break;
      }
    }
  }
  
  if (hasExcessiveRepetition) {
    issues.push('Excessive word repetition detected');
    score -= 10;
  }
  
  // Calculate final score (ensure it's between 0 and 100)
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  const filteredLength = filteredPrompt.length;
  
  return {
    isValid: issues.length === 0 && score >= 70,
    score,
    issues,
    filteredPrompt: filteredPrompt !== userPrompt ? filteredPrompt : undefined,
    originalLength,
    filteredLength
  };
};

/**
 * Build complete prompt for AI generation
 * Combines system prompt, user prompt, and context
 */
export const buildCompletePrompt = async (
  request: {
    message: string;
    isFormattingMode?: boolean;
    userprompt?: string;
    imageContext?: string;
    useMultiRound?: boolean;
    round?: number;
    template?: any;
  },
  promptConfig: PromptConfig
): Promise<{
  systemPrompt: string;
  userPrompt: string;
  validationResult?: PromptValidationResult;
}> => {
  const { message, isFormattingMode, userprompt, imageContext, useMultiRound, round } = request;
  
  let systemPrompt = promptConfig.systemPrompt;
  let userPrompt = '';
  
  // Validate user-provided prompt if present
  let validationResult: PromptValidationResult | undefined;
  if (userprompt) {
    validationResult = await validateUserPrompt(userprompt, {
      maxLength: 5000,
      minLength: 10,
      allowHtml: false,
      strictMode: true
    });
    
    if (validationResult.isValid) {
      // Use validated user prompt
      userPrompt = validationResult.filteredPrompt || userprompt;
    } else {
      logger.warn('User prompt validation failed, using default prompt', {
        issues: validationResult.issues,
        score: validationResult.score
      });
      // Fall back to default prompt
    }
  }
  
  // If no valid user prompt, use default template
  if (!userPrompt) {
    if (useMultiRound && round) {
      // Multi-round mode
      const roundKey = `round${round}` as keyof typeof promptConfig.multiRound;
      const template = promptConfig.multiRound[roundKey];
      userPrompt = interpolatePrompt(template, { topic: message });
    } else if (isFormattingMode) {
      // Formatting mode
      userPrompt = interpolatePrompt(promptConfig.formattingPrompt, { input: message });
    } else {
      // Standard generation mode
      userPrompt = interpolatePrompt(promptConfig.generationPrompt, { topic: message });
    }
  }
  
  // Add image context if provided
  if (imageContext) {
    userPrompt += `\n\nImage context: ${imageContext}`;
  }

  // Add template guidance if provided
  if (request.template) {
    const template = request.template;
    userPrompt += `\n\n请为以下文章模板中的每个文字内容块生成新内容，保持原有样式和结构不变：

文章标题：${template.title || '未指定'}

需要生成新内容的文字块：
${template.contentBlocks?.map((block: any, index: number) => {
  const blockIndex = block.index + 1; // 1-based position
  const originalContent = block.originalContent?.slice(0, 50) + (block.originalContent?.length > 50 ? '...' : '');

  let typeDesc = '';
  switch (block.type) {
    case 'header': typeDesc = `标题 (级别 ${block.level || 1})`; break;
    case 'paragraph': typeDesc = '段落'; break;
    case 'quote': typeDesc = '引用'; break;
    case 'card': typeDesc = `卡片${block.title ? ` (标题：${block.title})` : ''}`; break;
    case 'callout': typeDesc = `提示框${block.icon ? ` (图标：${block.icon})` : ''}`; break;
    default: typeDesc = block.type;
  }

  return `文字块 ${index + 1} (位置 ${blockIndex}): ${typeDesc}
  原始内容预览: "${originalContent}"
  样式信息: ${JSON.stringify({
    style: block.style,
    alignment: block.alignment,
    fontSize: block.fontSize,
    fontWeight: block.fontWeight,
    fontStyle: block.fontStyle,
    level: block.level,
    title: block.title,
    icon: block.icon,
    language: block.language
  })}`;
}).join('\n\n') || '无需要生成内容的文字块'}

重要要求：
1. 为每个文字块生成全新的内容，完全替换原始内容
2. 保持每个块的类型和所有样式属性完全不变
3. 生成的内容要与用户指定的主题"${request.message}"完全相关
4. 内容的长度和复杂度应该与原始内容相当
5. 对于标题块，生成简洁有力的标题
6. 对于段落块，生成信息丰富的内容
7. 对于引用块，生成富有哲理或强调性的话语
8. 对于卡片和提示框，生成相应的说明性内容

请返回一个JSON数组，包含每个文字块的新内容，按原始顺序排列。格式：
[{"index": 0, "newContent": "新生成的内容"}, {"index": 1, "newContent": "新生成的内容"}, ...]`;

    logger.info('Added template content fill guidance to prompt', {
      templateTitle: template.title,
      contentBlocks: template.contentBlocks?.length || 0
    });
  }

  return {
    systemPrompt,
    userPrompt,
    validationResult
  };
};

/**
 * Get prompt usage statistics
 */
export const getPromptStats = async (): Promise<{
  totalPrompts: number;
  defaultPrompts: number;
  customPrompts: number;
  averageLength: number;
  lastUpdated: string;
}> => {
  try {
    const config = await loadPromptConfig();
    const defaultConfig = DEFAULT_PROMPTS;
    
    // Calculate statistics
    const allPrompts = [
      config.systemPrompt,
      config.generationPrompt,
      config.formattingPrompt,
      config.multiRound.round1,
      config.multiRound.round2,
      config.multiRound.round3,
      config.multiRound.round4
    ];
    
    const totalLength = allPrompts.reduce((sum, prompt) => sum + prompt.length, 0);
    const averageLength = Math.round(totalLength / allPrompts.length);
    
    // Check if config matches defaults
    const isDefault = JSON.stringify(config) === JSON.stringify(defaultConfig);
    
    return {
      totalPrompts: allPrompts.length,
      defaultPrompts: isDefault ? allPrompts.length : 0,
      customPrompts: isDefault ? 0 : allPrompts.length,
      averageLength,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to get prompt stats:', error);
    return {
      totalPrompts: 0,
      defaultPrompts: 0,
      customPrompts: 0,
      averageLength: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};
