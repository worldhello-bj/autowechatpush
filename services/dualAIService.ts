/**
 * Dual Parallel AI Service - 双并行AI服务
 * 
 * This service implements a dual-AI architecture where:
 * - Content AI (文案AI): Focuses on generating and refining the actual content/copywriting
 * - Design AI (美化AI): Focuses on formatting, styling, and beautifying the layout
 * 
 * Each AI maintains its own context/memory to improve accuracy over multiple calls.
 */

import { ArticleBlock, BlockType, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';

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
  contentProvider: 'google' | 'deepseek' | 'qwen';
  designProvider: 'google' | 'deepseek' | 'qwen';
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
    const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_MEMORY, ...parsed };
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
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(trimmedMemory));
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
      description: "Takes raw article content and transforms it into a visually stunning WeChat layout with proper formatting, colors, and visual elements.",
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

const callAPI = async (
  provider: 'google' | 'deepseek' | 'qwen',
  apiKey: string,
  messages: any[],
  tools: any[],
  temperature: number = 0.7
): Promise<any> => {
  let url: string;
  let model: string;

  switch (provider) {
    case 'qwen':
      url = QWEN_BASE_URL;
      model = 'qwen-plus';
      break;
    case 'deepseek':
      url = DEEPSEEK_BASE_URL;
      model = 'deepseek-chat';
      break;
    default:
      // For Google, we would use their SDK directly
      throw new Error('Google provider should use SDK directly');
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`API Error: ${err.error?.message || response.statusText}`);
  }

  return response.json();
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
  imageContext?: string
): Promise<ContentAIResult> => {
  const context = buildContentContext(memory, topic);
  
  const systemPrompt = `You are an expert content writer for WeChat Official Accounts.
You specialize in creating engaging, well-structured articles that resonate with Chinese readers.

${context}

Focus on:
- Clear, compelling writing
- Logical structure
- Engaging storytelling
- Accurate information
- Cultural relevance for Chinese audience

Call the 'generate_article_content' function to return your result.`;

  const userPrompt = `Write a high-quality article about: "${topic}"
${imageContext ? `\n\nImage context: ${imageContext}` : ''}

Requirements:
- Create 3-5 well-structured sections
- Include key points for each section
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
    0.7
  );

  // Log the raw API response
  logger.group('Content AI Response', true);
  logger.debug('Raw response:', data);
  logger.groupEnd();

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'generate_article_content') {
    const receivedFunction = toolCall?.function?.name || 'none';
    const messageContent = data.choices?.[0]?.message?.content?.slice(0, 100) || 'no content';
    throw new Error(`Content AI failed to generate structured content. Expected 'generate_article_content', received: '${receivedFunction}'. Message: ${messageContent}`);
  }

  // Safely parse JSON with error handling
  let result;
  try {
    let jsonStr = toolCall.function.arguments;
    // Clean up common JSON issues from AI responses
    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, lastBrace + 1);
      logger.warn('Cleaned trailing content from JSON response');
    }
    result = JSON.parse(jsonStr);
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
  apiKey: string
): Promise<DesignAIResult> => {
  // Build a simplified representation for the design AI
  const contentSummary = contentResult.sections.map(s => ({
    heading: s.heading,
    contentPreview: s.content.slice(0, 200),
    keyPoints: s.keyPoints || [],
    visualSuggestion: s.suggestedVisual
  }));

  const context = buildDesignContext(memory, []);
  
  const systemPrompt = `You are an expert visual designer for WeChat Official Accounts.
You specialize in creating beautiful, engaging "Xiumi-style" article layouts.

${context}

Focus on:
- Visual variety (use different block types)
- Colorful, eye-catching design
- Proper visual hierarchy
- Engaging formatting
- Mobile-friendly layouts

Call the 'beautify_article' function to return your design.`;

  const userPrompt = `Transform this article content into a beautiful WeChat layout:

Title: ${contentResult.title}
Digest: ${contentResult.digest}
Tone: ${contentResult.tone}

Sections:
${JSON.stringify(contentSummary, null, 2)}

Requirements:
- Use at least 3 different colors for visual variety
- Include cards for key points
- Use headers with appropriate levels
- Add dividers between sections
- Use callouts for important tips
- Make each section visually distinct`;

  const data = await callAPI(
    provider,
    apiKey,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    designAITools,
    0.8
  );

  // Log the raw API response
  logger.group('Design AI Response', true);
  logger.debug('Raw response:', data);
  logger.groupEnd();

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'beautify_article') {
    const receivedFunction = toolCall?.function?.name || 'none';
    const messageContent = data.choices?.[0]?.message?.content?.slice(0, 100) || 'no content';
    throw new Error(`Design AI failed to beautify content. Expected 'beautify_article', received: '${receivedFunction}'. Message: ${messageContent}`);
  }

  // Safely parse JSON with error handling
  let result;
  try {
    let jsonStr = toolCall.function.arguments;
    // Clean up common JSON issues from AI responses
    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, lastBrace + 1);
      logger.warn('Cleaned trailing content from JSON response');
    }
    result = JSON.parse(jsonStr);
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
