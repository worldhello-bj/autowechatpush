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
  description: 'Generates a structured layout for a WeChat article based on content.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The main title of the article.' },
      digest: { type: Type.STRING, description: 'A short summary (digest) of the article.' },
      blocks: {
        type: Type.ARRAY,
        description: 'The content blocks of the article.',
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['header', 'paragraph', 'card', 'list', 'quote'], description: 'The type of the block.' },
            content: { type: Type.STRING, description: 'The main text content of the block.' },
            title: { type: Type.STRING, description: 'Title for card or header blocks.' },
            items: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List items if type is list.' },
            style: { type: Type.STRING, enum: ['default', 'primary', 'warning', 'quote'], description: 'Visual style style.' }
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
  topic: string,
  useSearch: boolean,
  imageContext: string = "",
  apiKey?: string
): Promise<GenerationResult> => {
  const modelId = 'gemini-2.5-flash';
  
  const prompt = `
    You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles.
    Your task is to write a high-quality article about: "${topic}".
    
    ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
    
    Structure the article using the 'layout_article' tool with the following guidelines:
    - **Visual Variety**: Do NOT just use paragraphs. You MUST use 'card' blocks for key takeaways, important summaries, or interesting facts.
    - **Headers**: Use clear headers to break up sections.
    - **Lists**: Use lists for steps or bullet points.
    - **Content**: If the topic requires current information, use the provided Search tool (if available) to get facts.
    - **Cards**: Use the 'card' type frequently to create styled boxes for emphasis.
    - **Tone**: Professional, engaging, and suitable for mobile reading.
    
    RETURN ONLY THE FUNCTION CALL.
  `;

  const tools: any[] = [{ functionDeclarations: [layoutArticleFunction] }];
  if (useSearch) {
    tools.push({ googleSearch: {} });
  }

  try {
    const ai = getAI(apiKey);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: tools,
        systemInstruction: "You are a creative WeChat editor assistant. You love using rich text formatting, especially styled cards/boxes, to make articles look beautiful.",
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
    // The model might function call in the first part or subsequent parts
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

    // Fallback if no function call
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