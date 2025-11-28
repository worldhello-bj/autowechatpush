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
