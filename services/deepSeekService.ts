
import { ArticleBlock, BlockType, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';

const logger = loggers.deepseek;

const BASE_URL = "https://api.deepseek.com/chat/completions";

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
                role: { type: "string", description: "Author role/position for testimonial blocks." }
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

export const generateArticleStructureDeepSeek = async (
  input: string,
  apiKey: string,
  isFormattingMode: boolean = false
): Promise<GenerationResult> => {
  if (!apiKey) {
    throw new Error("DeepSeek API Key is required.");
  }

  let prompt = "";
  if (isFormattingMode) {
      prompt = `
        You are a professional WeChat Official Account editor.
        Your task is to format the input text into a rich WeChat article structure using the 'layout_article' tool.
        
        Guidelines:
        - **Content**: Keep the original text's meaning.
        - **Colors**: Assign colorful styles (red, blue, purple, orange, green, pink, cyan, gradient) to headers and cards to make it visually appealing.
        - **Structure**: Use 'card' blocks for emphasis, 'highlight' for key phrases.
        - **Rich Elements**: Use 'divider' between sections, 'callout' for important notices, 'numbered_list' for steps.
        - **Headers**: Use different header levels (1, 2, 3) for hierarchy.
        
        Input Text:
        """
        ${input}
        """
        
        Call the function 'layout_article' to return the formatted result.
      `;
  } else {
      prompt = `
        You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles.
        Your task is to write a high-quality article about: "${input}".
        
        Structure the article using the 'layout_article' tool with the following guidelines:
        - **Visual Variety**: Use 'card' blocks frequently for key takeaways, 'highlight' for important points.
        - **Colors**: You MUST use specific colors ('red', 'blue', 'orange', 'purple', 'gold', 'green', 'pink', 'cyan', 'gradient') for different Cards and Headers.
        - **Images**: Insert 'image' blocks where appropriate. Set the content to a description of the image.
        - **Rich Formatting**: Use 'divider' between major sections, 'callout' for tips/warnings, 'numbered_list' for steps, 'table' for data comparisons.
        - **Headers**: Use header levels (1=main, 2=sub, 3=minor) for proper hierarchy.
        - **Code**: Use 'code' blocks with language specified for any code snippets.
        
        Call the function 'layout_article' to return the result.
      `;
  }

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant that writes WeChat articles with colorful layouts." },
          { role: "user", content: prompt }
        ],
        tools: tools,
        tool_choice: "auto"
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`DeepSeek API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Log the raw API response
    logger.group('DeepSeek API Response', true);
    logger.debug('Raw response:', data);
    logger.groupEnd();
    
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (toolCall && toolCall.function.name === 'layout_article') {
        // Safely parse JSON with error handling
        let args;
        try {
          let jsonStr = toolCall.function.arguments;
          // Clean up common JSON issues from AI responses
          // Remove any trailing content after the closing brace
          const lastBrace = jsonStr.lastIndexOf('}');
          if (lastBrace !== -1 && lastBrace < jsonStr.length - 1) {
            jsonStr = jsonStr.substring(0, lastBrace + 1);
            logger.warn('Cleaned trailing content from JSON response');
          }
          args = JSON.parse(jsonStr);
        } catch (parseError) {
          logger.error('Failed to parse AI response JSON:', parseError);
          logger.error('Raw arguments:', toolCall.function.arguments);
          throw new Error(`Failed to parse AI response: ${parseError}`);
        }
        
        // Log generated content
        logger.group('Generated Article', true);
        logger.info('Title:', args.title);
        logger.info('Digest:', args.digest);
        logger.info('Blocks count:', args.blocks?.length || 0);
        logger.debug('Blocks detail:', args.blocks);
        logger.groupEnd();
        
        const blocks = (args.blocks || []).map((b: any, index: number) => ({
            id: `ds-${Date.now()}-${index}`,
            ...b
        }));

        return {
            title: args.title || "Untitled Article",
            digest: args.digest || "No summary available.",
            blocks,
            sources: [] 
        };
    }

    throw new Error("DeepSeek failed to generate structured content. Please try again.");

  } catch (error) {
    logger.error("DeepSeek generation failed:", error);
    throw error;
  }
};

// --- Helper for DeepSeek API calls ---
const callDeepSeekAPI = async (apiKey: string, messages: any[], temperature: number = 0.7): Promise<string> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`DeepSeek API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

// --- New AI Methods for Design Richness ---

/**
 * Generate multiple attractive title suggestions for an article
 */
export const generateTitleSuggestionsDeepSeek = async (
  content: string,
  count: number = 5,
  apiKey: string
): Promise<string[]> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are a creative content writer specializing in catchy headlines." },
      { role: "user", content: `
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
      ` }
    ], 0.8);

    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("DeepSeek title generation failed:", error);
    throw error;
  }
};

/**
 * Generate a concise summary/digest for an article
 */
export const generateSummaryDeepSeek = async (
  content: string,
  maxLength: number = 120,
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are an expert at creating concise, compelling article summaries." },
      { role: "user", content: `
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
      ` }
    ], 0.5);

    return text.trim();
  } catch (error) {
    console.error("DeepSeek summary generation failed:", error);
    throw error;
  }
};

/**
 * Expand a paragraph or section with more details
 */
export const expandContentDeepSeek = async (
  content: string,
  style: 'detailed' | 'examples' | 'storytelling' = 'detailed',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  const stylePrompts = {
    detailed: 'Add more detailed explanations, facts, and depth to the content.',
    examples: 'Expand with concrete examples, case studies, and practical applications.',
    storytelling: 'Expand using storytelling techniques, anecdotes, and narrative elements.'
  };

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are a skilled content writer who excels at expanding ideas." },
      { role: "user", content: `
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
      ` }
    ], 0.7);

    return text.trim() || content;
  } catch (error) {
    console.error("DeepSeek content expansion failed:", error);
    throw error;
  }
};

/**
 * Polish and improve content style and grammar
 */
export const polishContentDeepSeek = async (
  content: string,
  tone: 'professional' | 'casual' | 'formal' | 'creative' = 'professional',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  const toneDescriptions = {
    professional: 'professional, clear, and authoritative',
    casual: 'friendly, conversational, and approachable',
    formal: 'formal, academic, and scholarly',
    creative: 'creative, vivid, and engaging with literary flair'
  };

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are an expert editor skilled at polishing and improving content." },
      { role: "user", content: `
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
      ` }
    ], 0.5);

    return text.trim() || content;
  } catch (error) {
    console.error("DeepSeek content polish failed:", error);
    throw error;
  }
};

/**
 * Extract keywords from content for SEO purposes
 */
export const extractKeywordsDeepSeek = async (
  content: string,
  count: number = 10,
  apiKey: string
): Promise<string[]> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are an SEO expert skilled at identifying key terms and phrases." },
      { role: "user", content: `
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
      ` }
    ], 0.3);

    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("DeepSeek keyword extraction failed:", error);
    throw error;
  }
};

/**
 * Translate content between Chinese and English
 */
export const translateContentDeepSeek = async (
  content: string,
  targetLanguage: 'zh' | 'en',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  const targetLangName = targetLanguage === 'zh' ? 'Chinese (Simplified)' : 'English';

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are an expert translator fluent in both Chinese and English." },
      { role: "user", content: `
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
      ` }
    ], 0.3);

    return text.trim() || content;
  } catch (error) {
    console.error("DeepSeek translation failed:", error);
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

export const suggestStylesDeepSeek = async (
  content: string,
  apiKey: string
): Promise<StyleSuggestion[]> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are a design expert skilled at visual styling for articles." },
      { role: "user", content: `
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
      ` }
    ], 0.6);

    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [];
  } catch (error) {
    console.error("DeepSeek style suggestion failed:", error);
    throw error;
  }
};

/**
 * Generate an engaging article opening/hook
 */
export const generateHookDeepSeek = async (
  topic: string,
  style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising' = 'question',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  const styleDescriptions = {
    question: 'Start with a thought-provoking question that engages the reader',
    story: 'Begin with a short, compelling anecdote or mini-story',
    statistic: 'Open with a surprising or impactful statistic or fact',
    quote: 'Start with an inspiring or relevant quote',
    surprising: 'Begin with a surprising or counterintuitive statement'
  };

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are a creative writer skilled at writing engaging article openings." },
      { role: "user", content: `
        Generate an engaging article opening/hook for an article about: "${topic}"
        
        Style: ${styleDescriptions[style]}
        
        Requirements:
        - Keep it concise (2-4 sentences)
        - Make it immediately captivating
        - Create curiosity to continue reading
        - Suitable for WeChat article audience
        
        Return ONLY the opening paragraph, nothing else.
      ` }
    ], 0.8);

    return text.trim();
  } catch (error) {
    console.error("DeepSeek hook generation failed:", error);
    throw error;
  }
};

/**
 * Generate a compelling call-to-action for article ending
 */
export const generateCTADeepSeek = async (
  articleContext: string,
  ctaType: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection' = 'share',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  const ctaDescriptions = {
    subscribe: 'Encourage readers to follow/subscribe to the account',
    share: 'Encourage readers to share the article with others',
    comment: 'Encourage readers to leave comments and engage in discussion',
    action: 'Encourage readers to take a specific action related to the content',
    reflection: 'End with a reflective thought or question for the reader to ponder'
  };

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are a marketing expert skilled at writing compelling calls-to-action." },
      { role: "user", content: `
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
      ` }
    ], 0.7);

    return text.trim();
  } catch (error) {
    console.error("DeepSeek CTA generation failed:", error);
    throw error;
  }
};

/**
 * Rewrite content in a different style or perspective
 */
export const rewriteContentDeepSeek = async (
  content: string,
  newStyle: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational',
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("DeepSeek API Key is required.");

  const styleDescriptions = {
    humorous: 'witty, playful, with appropriate humor and light-hearted tone',
    serious: 'serious, thoughtful, with gravitas and depth',
    inspirational: 'uplifting, motivational, with emotional resonance',
    educational: 'informative, clear, with structured explanations',
    conversational: 'friendly, casual, as if talking to a friend'
  };

  try {
    const text = await callDeepSeekAPI(apiKey, [
      { role: "system", content: "You are a versatile writer skilled at adapting content to different styles." },
      { role: "user", content: `
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
      ` }
    ], 0.8);

    return text.trim() || content;
  } catch (error) {
    console.error("DeepSeek content rewrite failed:", error);
    throw error;
  }
};
