import { GoogleGenAI, FunctionDeclaration, Type, Modality } from "@google/genai";
import { ArticleBlock, BlockType, GroundingSource } from "../types";

// Helper to get AI instance dynamically
const getAI = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("Google Gemini API Key is missing. Please configure it in Settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- Tool Definitions ---

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
              enum: ['header', 'paragraph', 'card', 'list', 'quote', 'image', 'divider', 'code', 'callout', 'numbered_list', 'highlight', 'table'], 
              description: 'Block type. Use "header" for section titles, "paragraph" for body text, "card" for key points, "list" for bullet points, "numbered_list" for steps, "quote" for citations, "image" for visual placeholders, "divider" for section breaks, "code" for code snippets, "callout" for important notices, "highlight" for emphasized text, "table" for structured data.' 
            },
            content: { type: Type.STRING, description: 'The main text content. For "image" type, provide a visual description. For "divider", this can be empty.' },
            title: { type: Type.STRING, description: 'Title for card, header, callout, or table blocks.' },
            items: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List items for "list" or "numbered_list" types.' },
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
            headers: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Table header row for "table" type.' }
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
    return response.text || "Failed to analyze image.";
  } catch (error) {
    console.error("Image analysis failed:", error);
    throw error;
  }
};

export interface GenerationResult {
  title: string;
  digest: string;
  blocks: ArticleBlock[];
  sources: GroundingSource[];
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
      
      ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
      
      Structure the article using the 'layout_article' tool with the following guidelines:
      - **Visual Variety**: Do NOT just use paragraphs. You MUST use 'card' blocks for key takeaways, 'highlight' for important points.
      - **Colors**: You MUST use specific colors ('red', 'blue', 'orange', 'purple', 'gold', 'green', 'pink', 'cyan', 'gradient') for different Cards and Headers. Do not just use default.
      - **Images**: Insert 'image' blocks where appropriate. For the content, write a PROMPT describing the image (e.g., "A chart showing growth" or "A happy family in a park"). Do not provide URLs.
      - **Headers**: Use clear headers with levels (1 for main sections, 2 for subsections, 3 for minor titles).
      - **Lists**: Use 'list' for bullet points, 'numbered_list' for steps or ordered items.
      - **Rich Elements**: Use 'divider' to separate major sections, 'callout' for important tips/warnings/info, 'code' for code snippets with language specified.
      - **Tables**: Use 'table' blocks with headers and rows for structured data comparisons.
      - **Quotes**: Use 'quote' for citations or testimonials with center alignment for impact.
      
      RETURN ONLY THE FUNCTION CALL.
    `;
  }

  const tools: any[] = [{ functionDeclarations: [layoutArticleFunction] }];
  if (useSearch && !isFormattingMode) {
    tools.push({ googleSearch: {} });
  }

  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: tools,
        systemInstruction: "You are a creative WeChat editor. You love using bright colors (blue, red, gold, purple) in your layouts to make them pop.",
        temperature: 0.7,
      }
    });

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
      const args = callPart.functionCall.args as any;
      const blocks = (args.blocks || []).map((b: any, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        ...b
      }));

      return {
        title: args.title || "Untitled Article",
        digest: args.digest || "No summary available.",
        blocks,
        sources
      };
    }

    throw new Error("The model did not return a valid article layout. Please try again.");

  } catch (error) {
    console.error("Article generation failed:", error);
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
