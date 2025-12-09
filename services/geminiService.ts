import { GoogleGenAI, FunctionDeclaration, Type, Modality } from "@google/genai";
import { ArticleBlock, BlockType, GroundingSource } from "../types";
import { loggers } from './logger';

const logger = loggers.gemini;

export interface SeamlessBlock {
  type: 'image' | 'text';
  content: string;
  backgroundColor?: string;
  padding?: string;
  alt?: string;
}

const escapeHtmlSafe = (value: string | null | undefined): string => {
  const safeValue = value ?? '';
  return safeValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const sanitizeColor = (value?: string): string => {
  if (!value) return 'transparent';
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+))?\s*\)$/i);
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    const withinRange = [r, g, b].every((val) => {
      const num = Number(val);
      return num >= 0 && num <= 255;
    });
    const alphaOk = a === undefined || (Number(a) >= 0 && Number(a) <= 1);
    if (withinRange && alphaOk) return trimmed;
  }
  return 'transparent';
};

const sanitizePadding = (value?: string): string => {
  if (!value) return '20px';
  const trimmed = value.trim();
  if (trimmed === '0') return '0';
  if (/^[0-9]+$/.test(trimmed)) return `${trimmed}px`;
  if (/^[0-9]+(px|rem|em|%)$/.test(trimmed)) return trimmed;
  return '20px';
};

const sanitizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const dataUrlPattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;
  if (dataUrlPattern.test(trimmed)) return trimmed;
  return null;
};

// Keep text snug against images to avoid thin seams on some renderers
const SEAMLESS_TEXT_MARGIN = '-1px';
const SEAMLESS_TEXT_STYLE = 'line-height: 1.75; font-size: 16px; color: #3e3e3e;';

// Helper to get AI instance dynamically
const getAI = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("Google Gemini API Key is missing. Please configure it in Settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const generateSeamlessWechatHtml = (blocks: SeamlessBlock[], globalWidth: string = "100%"): string => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const width = typeof globalWidth === 'string' ? globalWidth.trim() : '100%';
  const safeWidth = /^([0-9]+%|[0-9]+px)$/i.test(width) ? width : '100%';
  let htmlOutput = `<section style="max-width: ${safeWidth}; margin: 0 auto; box-sizing: border-box;">`;

  safeBlocks.forEach((block) => {
    const bType = block.type;
    const content = block.content || '';
    const bgColor = sanitizeColor(block.backgroundColor);
    const safeBgColor = escapeHtmlSafe(bgColor);

    if (bType === 'image') {
      const safeSrc = sanitizeUrl(content);
      if (!safeSrc) {
        logger.warn('Skipped unsafe image URL in seamless layout');
        return;
      }
      const altText = escapeHtmlSafe(block.alt || 'Seamless stitched block');
      const safeSrcEscaped = escapeHtmlSafe(safeSrc);
      htmlOutput += `
<section style="line-height: 0; font-size: 0; background-color: ${safeBgColor};">
  <img src="${safeSrcEscaped}" alt="${altText}" style="vertical-align: top; width: 100%; display: block;" />
</section>`;
    } else if (bType === 'text') {
      const padding = sanitizePadding(block.padding);
      const safePadding = escapeHtmlSafe(padding);
      const safeContent = escapeHtmlSafe(content);
      htmlOutput += `
<section style="margin-top: ${SEAMLESS_TEXT_MARGIN}; background-color: ${safeBgColor}; padding: ${safePadding}; ${SEAMLESS_TEXT_STYLE}">
  ${safeContent}
</section>`;
    }
  });

  htmlOutput += '</section>';
  return htmlOutput;
};

// --- Tool Definitions ---

const seamlessWechatFunction: FunctionDeclaration = {
  name: "generate_seamless_wechat_html",
  description: "生成微信公众号专用的无缝拼接HTML代码。当用户需要将多张图片或“图片+文字”紧密排列，中间没有缝隙时调用此函数。",
  parameters: {
    type: Type.OBJECT,
    properties: {
      blocks: {
        type: Type.ARRAY,
        description: "内容块的列表，按顺序排列",
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ["image", "text"],
              description: "该区块是图片还是文字"
            },
            content: {
              type: Type.STRING,
              description: "如果是图片，填URL；如果是文字，填文本内容"
            },
            backgroundColor: {
              type: Type.STRING,
              description: "该区块的背景色（HEX或RGB），例如 #89B630"
            },
            padding: {
              type: Type.STRING,
              description: "仅文字区块需要，例如 '20px'"
            }
          },
          required: ["type", "content"]
        }
      },
      globalWidth: {
        type: Type.STRING,
        description: "容器宽度，通常为 '100%'",
        default: "100%"
      }
    },
    required: ["blocks"]
  }
};

const layoutArticleFunction: FunctionDeclaration = {
  name: 'layout_article',
  description: 'Generates a structured layout for a WeChat article based on content. Use various block types for rich formatting.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The main title of the article.' },
      digest: { type: Type.STRING, description: 'A short summary (digest) of the article.' },
      blocks: {
        type: Type.ARRAY,
        description: 'The content blocks of the article. Use diverse block types for visual variety.',
        items: {
          type: Type.OBJECT,
          properties: {
            type: { 
              type: Type.STRING, 
              enum: ['header', 'paragraph', 'card', 'list', 'quote', 'image', 'divider', 'code', 'callout', 'numbered_list', 'highlight', 'table', 'qrcode', 'faq', 'countdown', 'progress', 'gift', 'contact', 'stats', 'testimonial', 'steps', 'svg'], 
              description: 'Block type. Use "header" for section titles, "paragraph" for body text, "card" for key points, "list" for bullet points, "numbered_list" for steps, "quote" for citations, "image" for visual placeholders, "divider" for section breaks, "code" for code snippets, "callout" for important notices, "highlight" for emphasized text, "table" for structured data. Special types: "qrcode" for QR code sections, "faq" for Q&A blocks, "countdown" for timers, "progress" for progress bars, "gift" for promotional boxes, "contact" for contact info, "stats" for statistics display, "testimonial" for user reviews, "steps" for step-by-step flows, "svg" for decorative SVG graphics (icons, badges, dividers, arrows).' 
            },
            content: { type: Type.STRING, description: 'The main text content. For "image" type, provide a visual description. For "divider", this can be empty. For "svg" type, provide SVG code or a description of desired graphic.' },
            title: { type: Type.STRING, description: 'Title for card, header, callout, gift, faq, or table blocks.' },
            items: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List items for "list" or "numbered_list" types. Also used for FAQ questions or step descriptions.' },
            style: { 
              type: Type.STRING, 
              enum: ['default', 'primary', 'warning', 'quote', 'red', 'blue', 'purple', 'orange', 'gold', 'green', 'pink', 'cyan', 'gradient'], 
              description: 'Visual color style. Use varied colors for different sections to make content visually engaging.' 
            },
            level: { type: Type.STRING, enum: ['1', '2', '3'], description: 'Header level as string ("1"=large, "2"=medium, "3"=small). Only for "header" type.' },
            alignment: { type: Type.STRING, enum: ['left', 'center', 'right'], description: 'Text alignment. Useful for quotes or highlights.' },
            language: { type: Type.STRING, description: 'Programming language for "code" blocks (e.g., "javascript", "python").' },
            icon: { type: Type.STRING, enum: ['info', 'warning', 'success', 'error', 'tip', 'note'], description: 'Icon type for "callout" blocks.' },
            rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } }, description: 'Table data rows for "table" type. Each row is an array of cell values.' },
            headers: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Table header row for "table" type.' },
            // New properties for special blocks
            values: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Values for stats blocks (e.g., ["1000+", "50%", "99%"]).' },
            labels: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Labels for stats/progress/steps blocks (e.g., ["用户数", "增长率", "满意度"]).' },
            answers: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Answers for FAQ blocks, matching items array.' },
            countdown: { type: Type.OBJECT, description: 'Countdown values object with days, hours, minutes, seconds properties.' },
            percentage: { type: Type.NUMBER, description: 'Progress percentage (0-100) for progress blocks.' },
            author: { type: Type.STRING, description: 'Author name for testimonial blocks.' },
            role: { type: Type.STRING, description: 'Author role/position for testimonial blocks.' }
          },
          required: ['type', 'content']
        }
      }
    },
    required: ['title', 'digest', 'blocks']
  }
};

// --- Service Methods ---

export const analyzeImage = async (base64Image: string, mimeType: string, apiKey?: string): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Analyze this image in detail. Describe the scene, objects, text, and overall mood. This analysis will be used to write an article." }
        ]
      }
    });
    logger.info('Image analysis completed');
    return response.text || "Failed to analyze image.";
  } catch (error) {
    logger.error("Image analysis failed:", error);
    throw error;
  }
};

export interface GenerationResult {
  title: string;
  digest: string;
  blocks: ArticleBlock[];
  sources: GroundingSource[];
  html?: string;
  rawBlocks?: SeamlessBlock[];
}

export const generateArticleStructure = async (
  input: string,
  useSearch: boolean,
  imageContext: string = "",
  apiKey?: string,
  isFormattingMode: boolean = false
): Promise<GenerationResult> => {
  const modelId = 'gemini-2.5-flash';
  
  let prompt = "";

  if (isFormattingMode) {
    prompt = `
      You are a professional WeChat Official Account editor. 
      Your task is to take the provided raw text and format it into a structured WeChat article layout using the 'layout_article' tool.
      If the user asks for seamless layout / stitched long image (无缝排版、图片拼接、长图效果), switch to the 'generate_seamless_wechat_html' tool and build ordered image/text blocks.
      
      Guidelines:
      - **Content Fidelity**: Preserve the original meaning.
      - **Structure**: Identify sections and add Headers with appropriate levels (1 for main, 2 for sub, 3 for minor).
      - **Visuals**: Convert key points into 'card' blocks, use 'highlight' for important phrases.
      - **Colors**: Assign different 'style' colors (blue, red, orange, purple, gold, green, pink, cyan, gradient) to cards and headers to distinguish sections.
      - **Rich Formatting**: Use 'callout' for important notices, 'divider' between major sections, 'numbered_list' for steps, 'table' for structured data.
      - **Code**: Use 'code' blocks with appropriate language for any code snippets.
      
      Input Text to Format:
      """
      ${input}
      """
      
      ${imageContext ? `Context from uploaded image (incorporate if relevant): ${imageContext}` : ''}
      
      RETURN ONLY THE FUNCTION CALL.
    `;
  } else {
    prompt = `
      You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles.
      Your task is to write a high-quality article about: "${input}".
      If the request mentions seamless layout / stitched images / 无缝排版 / 图片无缝衔接 / 长图，请调用 'generate_seamless_wechat_html' 工具，按顺序提供 image/text blocks（包含背景色与文字 padding），避免直接输出 HTML。
      
      ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
      
      Structure the article using the 'layout_article' tool with the following guidelines:
      - **Visual Variety**: Do NOT just use paragraphs. You MUST use 'card' blocks for key takeaways, 'highlight' for important points.
      - **Colors**: You MUST use specific colors ('red', 'blue', 'orange', 'purple', 'gold', 'green', 'pink', 'cyan', 'gradient') for different Cards and Headers. Do not just use default.
      - **Images**: Insert 'image' blocks where appropriate. For the content, write a PROMPT describing the image (e.g., "A chart showing growth" or "A happy family in a park"). Do not provide URLs.
      - **SVG Graphics**: Use 'svg' blocks for decorative elements like icons, badges, arrows, or custom graphics. For the content, provide inline SVG code (e.g., '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#FFD700"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>') or a description of desired graphic.
      - **Headers**: Use clear headers with levels (1 for main sections, 2 for subsections, 3 for minor titles).
      - **Lists**: Use 'list' for bullet points, 'numbered_list' for steps or ordered items.
      - **Rich Elements**: Use 'divider' to separate major sections, 'callout' for important tips/warnings/info, 'code' for code snippets with language specified.
      - **Tables**: Use 'table' blocks with headers and rows for structured data comparisons.
      - **Quotes**: Use 'quote' for citations or testimonials with center alignment for impact.
      
      RETURN ONLY THE FUNCTION CALL.
    `;
  }

  const tools: any[] = [{ functionDeclarations: [layoutArticleFunction, seamlessWechatFunction] }];
  if (useSearch && !isFormattingMode) {
    tools.push({ googleSearch: {} });
  }

  logger.time('generateArticleStructure');
  try {
    const ai = getAI(apiKey);
    logger.info('Generating article structure...');
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: tools,
        systemInstruction: "You are a creative WeChat editor. You love using bright colors (blue, red, gold, purple) in your layouts to make them pop. For any request about seamless/stitched WeChat layouts (无缝排版、图片拼接、长图), you MUST call the generate_seamless_wechat_html tool instead of writing raw HTML yourself.",
        temperature: 0.7,
      }
    });

    // Log full AI response for debugging
    logger.group('AI Response', true);
    logger.debug('Raw response:', response);
    logger.groupEnd();

    // Handle Grounding
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    // Handle Function Call
    const parts = response.candidates?.[0]?.content?.parts || [];
    const callPart = parts.find(p => p.functionCall);

    if (callPart && callPart.functionCall) {
      const funcName = (callPart.functionCall as any).name;
      const args = callPart.functionCall.args as any;

      if (funcName === 'generate_seamless_wechat_html') {
        const rawBlocks: SeamlessBlock[] = Array.isArray(args.blocks) ? args.blocks : [];
        const html = generateSeamlessWechatHtml(rawBlocks, args.globalWidth || "100%");

        logger.group('Seamless Layout Generated', true);
        logger.info('Blocks count:', rawBlocks.length);
        logger.debug('Blocks detail:', rawBlocks);
        logger.groupEnd();

        logger.timeEnd('generateArticleStructure');
        logger.info('Seamless layout generated successfully');
        return {
          title: args.title || "Seamless Layout",
          digest: args.digest || "Seamless stitched layout generated via tool.",
          blocks: [],
          sources,
          html,
          rawBlocks
        };
      }

      // Log AI generated content details
      logger.group('Generated Article', true);
      logger.info('Title:', args.title);
      logger.info('Digest:', args.digest);
      logger.info('Blocks count:', args.blocks?.length || 0);
      logger.debug('Blocks detail:', args.blocks);
      logger.groupEnd();
      
      const blocks = (args.blocks || []).map((b: any, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        ...b
      }));

      logger.timeEnd('generateArticleStructure');
      logger.info('Article generated successfully:', args.title);
      return {
        title: args.title || "Untitled Article",
        digest: args.digest || "No summary available.",
        blocks,
        sources
      };
    }

    throw new Error("The model did not return a valid article layout. Please try again.");

  } catch (error) {
    logger.timeEnd('generateArticleStructure');
    logger.error("Article generation failed:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, apiKey?: string): Promise<ArrayBuffer> => {
    try {
        const ai = getAI(apiKey);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned");
        }

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (error) {
        console.error("TTS failed:", error);
        throw error;
    }
};

// --- New AI Methods for Design Richness ---

/**
 * Generate multiple attractive title suggestions for an article
 */
export const generateTitleSuggestions = async (
  content: string,
  count: number = 5,
  apiKey?: string
): Promise<string[]> => {
  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Based on the following article content, generate ${count} attractive and engaging title suggestions suitable for a WeChat Official Account article.
        
        Requirements:
        - Each title should be unique and capture different angles of the content
        - Titles should be catchy, clickable, and suitable for Chinese social media
        - Include a mix of styles: informative, emotional, question-based, and surprising
        - Keep titles concise (preferably under 30 characters)
        
        Article Content:
        """
        ${content.slice(0, 2000)}
        """
        
        Return ONLY a JSON array of title strings, like: ["Title 1", "Title 2", ...]
      `,
      config: {
        temperature: 0.8,
      }
    });
    
    const text = response.text || "[]";
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("Title generation failed:", error);
    throw error;
  }
};

/**
 * Generate a concise summary/digest for an article
 */
export const generateSummary = async (
  content: string,
  maxLength: number = 120,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Generate a concise and engaging summary for the following article content.
        The summary should be suitable as a WeChat article digest/description.
        
        Requirements:
        - Maximum ${maxLength} characters
        - Capture the main essence of the article
        - Make it compelling to encourage readers to click
        - Write in the same language as the content
        
        Article Content:
        """
        ${content.slice(0, 3000)}
        """
        
        Return ONLY the summary text, nothing else.
      `,
      config: {
        temperature: 0.5,
      }
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Summary generation failed:", error);
    throw error;
  }
};

/**
 * Expand a paragraph or section with more details
 */
export const expandContent = async (
  content: string,
  style: 'detailed' | 'examples' | 'storytelling' = 'detailed',
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    
    const stylePrompts = {
      detailed: 'Add more detailed explanations, facts, and depth to the content.',
      examples: 'Expand with concrete examples, case studies, and practical applications.',
      storytelling: 'Expand using storytelling techniques, anecdotes, and narrative elements.'
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Expand the following content while maintaining its core message and tone.
        
        Expansion Style: ${stylePrompts[style]}
        
        Original Content:
        """
        ${content}
        """
        
        Requirements:
        - Expand to approximately 2-3x the original length
        - Maintain the original voice and style
        - Add valuable information, not just filler
        - Keep it suitable for a WeChat article
        
        Return ONLY the expanded content, nothing else.
      `,
      config: {
        temperature: 0.7,
      }
    });
    
    return response.text?.trim() || content;
  } catch (error) {
    console.error("Content expansion failed:", error);
    throw error;
  }
};

/**
 * Polish and improve content style and grammar
 */
export const polishContent = async (
  content: string,
  tone: 'professional' | 'casual' | 'formal' | 'creative' = 'professional',
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    
    const toneDescriptions = {
      professional: 'professional, clear, and authoritative',
      casual: 'friendly, conversational, and approachable',
      formal: 'formal, academic, and scholarly',
      creative: 'creative, vivid, and engaging with literary flair'
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Polish and improve the following content while making it sound more ${toneDescriptions[tone]}.
        
        Original Content:
        """
        ${content}
        """
        
        Requirements:
        - Fix any grammar or spelling errors
        - Improve sentence structure and flow
        - Enhance word choice for better impact
        - Maintain the original meaning
        - Keep approximately the same length
        
        Return ONLY the polished content, nothing else.
      `,
      config: {
        temperature: 0.5,
      }
    });
    
    return response.text?.trim() || content;
  } catch (error) {
    console.error("Content polish failed:", error);
    throw error;
  }
};

/**
 * Extract keywords from content for SEO purposes
 */
export const extractKeywords = async (
  content: string,
  count: number = 10,
  apiKey?: string
): Promise<string[]> => {
  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Extract the ${count} most important keywords or key phrases from the following content.
        These keywords should be useful for SEO and content tagging.
        
        Content:
        """
        ${content.slice(0, 3000)}
        """
        
        Requirements:
        - Include both single words and short phrases
        - Focus on topics, themes, and important concepts
        - Prioritize by relevance and search potential
        
        Return ONLY a JSON array of keyword strings, like: ["keyword1", "keyword2", ...]
      `,
      config: {
        temperature: 0.3,
      }
    });
    
    const text = response.text || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("Keyword extraction failed:", error);
    throw error;
  }
};

/**
 * Translate content between Chinese and English
 */
export const translateContent = async (
  content: string,
  targetLanguage: 'zh' | 'en',
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    
    const targetLangName = targetLanguage === 'zh' ? 'Chinese (Simplified)' : 'English';
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Translate the following content to ${targetLangName}.
        
        Content:
        """
        ${content}
        """
        
        Requirements:
        - Provide a natural, fluent translation
        - Maintain the original tone and style
        - Preserve any formatting markers if present
        - Adapt idioms and expressions appropriately
        
        Return ONLY the translated content, nothing else.
      `,
      config: {
        temperature: 0.3,
      }
    });
    
    return response.text?.trim() || content;
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
};

/**
 * Suggest visual styles based on content theme
 */
export interface StyleSuggestion {
  style: string;
  reason: string;
  colorScheme: string[];
  mood: string;
}

export const suggestStyles = async (
  content: string,
  apiKey?: string
): Promise<StyleSuggestion[]> => {
  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the following article content and suggest appropriate visual styles for a WeChat article.
        
        Content:
        """
        ${content.slice(0, 2000)}
        """
        
        Return a JSON array with 3 style suggestions. Each suggestion should have:
        - style: The main style name (e.g., "professional", "playful", "elegant", "tech", "nature")
        - reason: Brief explanation of why this style fits
        - colorScheme: Array of 3-4 recommended colors (use names like "blue", "red", "gold", etc.)
        - mood: The overall mood this style conveys
        
        Available colors: red, blue, purple, orange, gold, green, pink, cyan, gradient
        
        Return ONLY a valid JSON array like:
        [{"style": "...", "reason": "...", "colorScheme": ["...", "..."], "mood": "..."}, ...]
      `,
      config: {
        temperature: 0.6,
      }
    });
    
    const text = response.text || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("Style suggestion failed:", error);
    throw error;
  }
};

/**
 * Generate an engaging article opening/hook
 */
export const generateHook = async (
  topic: string,
  style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising' = 'question',
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    
    const styleDescriptions = {
      question: 'Start with a thought-provoking question that engages the reader',
      story: 'Begin with a short, compelling anecdote or mini-story',
      statistic: 'Open with a surprising or impactful statistic or fact',
      quote: 'Start with an inspiring or relevant quote',
      surprising: 'Begin with a surprising or counterintuitive statement'
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Generate an engaging article opening/hook for an article about: "${topic}"
        
        Style: ${styleDescriptions[style]}
        
        Requirements:
        - Keep it concise (2-4 sentences)
        - Make it immediately captivating
        - Create curiosity to continue reading
        - Suitable for WeChat article audience
        
        Return ONLY the opening paragraph, nothing else.
      `,
      config: {
        temperature: 0.8,
      }
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Hook generation failed:", error);
    throw error;
  }
};

/**
 * Generate a compelling call-to-action for article ending
 */
export const generateCTA = async (
  articleContext: string,
  ctaType: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection' = 'share',
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    
    const ctaDescriptions = {
      subscribe: 'Encourage readers to follow/subscribe to the account',
      share: 'Encourage readers to share the article with others',
      comment: 'Encourage readers to leave comments and engage in discussion',
      action: 'Encourage readers to take a specific action related to the content',
      reflection: 'End with a reflective thought or question for the reader to ponder'
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Generate a compelling call-to-action ending for an article with this context:
        """
        ${articleContext.slice(0, 1000)}
        """
        
        CTA Type: ${ctaDescriptions[ctaType]}
        
        Requirements:
        - Keep it natural and not too salesy
        - Make it relevant to the article content
        - Be warm and engaging
        - 2-3 sentences maximum
        
        Return ONLY the CTA text, nothing else.
      `,
      config: {
        temperature: 0.7,
      }
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("CTA generation failed:", error);
    throw error;
  }
};

/**
 * Rewrite content in a different style or perspective
 */
export const rewriteContent = async (
  content: string,
  newStyle: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational',
  apiKey?: string
): Promise<string> => {
  try {
    const ai = getAI(apiKey);
    
    const styleDescriptions = {
      humorous: 'witty, playful, with appropriate humor and light-hearted tone',
      serious: 'serious, thoughtful, with gravitas and depth',
      inspirational: 'uplifting, motivational, with emotional resonance',
      educational: 'informative, clear, with structured explanations',
      conversational: 'friendly, casual, as if talking to a friend'
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Rewrite the following content in a ${styleDescriptions[newStyle]} style.
        
        Original Content:
        """
        ${content}
        """
        
        Requirements:
        - Completely transform the tone and style
        - Keep the core message and facts intact
        - Maintain approximately the same length
        - Make it suitable for WeChat article format
        
        Return ONLY the rewritten content, nothing else.
      `,
      config: {
        temperature: 0.8,
      }
    });
    
    return response.text?.trim() || content;
  } catch (error) {
    console.error("Content rewrite failed:", error);
    throw error;
  }
};
