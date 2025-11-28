
import { ArticleBlock, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";

const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation";

const tools = [
  {
    type: "function",
    function: {
      name: "layout_article",
      description: "Generates a structured layout for a WeChat article based on content.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The main title of the article." },
          digest: { type: "string", description: "A short summary (digest) of the article." },
          blocks: {
            type: "array",
            description: "The content blocks of the article.",
            items: {
              type: "object",
              properties: {
                type: { 
                  type: "string", 
                  enum: ["header", "paragraph", "card", "list", "quote", "image"], 
                  description: "The type of the block. Use 'image' for suggested image placeholders." 
                },
                content: { type: "string", description: "The main text content. For images, provide a description." },
                title: { type: "string", description: "Title for card or header blocks." },
                items: { 
                  type: "array", 
                  items: { type: "string" }, 
                  description: "List items if type is list." 
                },
                style: { 
                  type: "string", 
                  enum: ["default", "primary", "warning", "quote", "red", "blue", "purple", "orange", "gold"], 
                  description: "Visual style color." 
                }
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

export const generateArticleStructureQwen = async (
  input: string,
  apiKey: string,
  useSearch: boolean,
  imageContext: string = "",
  isFormattingMode: boolean = false
): Promise<GenerationResult> => {
  if (!apiKey) {
    throw new Error("DashScope API Key is required for Qwen.");
  }

  let prompt = "";
  if (isFormattingMode) {
      prompt = `
        You are a professional WeChat Official Account editor.
        Your task is to take the provided text and format it into a structured WeChat article layout.
        
        Guidelines:
        - **Formatting**: Improve readability.
        - **Visuals**: Use 'card' blocks for important summaries.
        - **Colors**: Assign varied colors (red, blue, purple, orange) to sections to make it visually interesting.
        
        Input Text:
        """
        ${input}
        """
        
        ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
        
        Call the function 'layout_article' to return the result.
      `;
  } else {
      prompt = `
        You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles.
        Your task is to write a high-quality article about: "${input}".
        
        ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
        
        Structure the article using the 'layout_article' tool with the following guidelines:
        - **Visual Variety**: Do NOT just use paragraphs. You MUST use 'card' blocks.
        - **Colors**: Use colors like 'red', 'blue', 'orange', 'purple', 'gold' for Cards and Headers.
        - **Images**: Insert 'image' blocks. Content should be a description (e.g., "A neon city street").
        
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
        model: "qwen-plus",
        messages: [
          { role: "system", content: "You are a helpful assistant that writes WeChat articles with colorful layouts." },
          { role: "user", content: prompt }
        ],
        tools: tools,
        tool_choice: "auto",
        enable_search: useSearch && !isFormattingMode
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Qwen API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (toolCall && toolCall.function.name === 'layout_article') {
        const args = JSON.parse(toolCall.function.arguments);
        const blocks = (args.blocks || []).map((b: any, index: number) => ({
            id: `qwen-${Date.now()}-${index}`,
            ...b
        }));

        return {
            title: args.title || "Untitled Article",
            digest: args.digest || "No summary available.",
            blocks,
            sources: [] 
        };
    }

    throw new Error("Qwen failed to generate structured content. Please try again.");

  } catch (error) {
    console.error("Qwen generation failed:", error);
    throw error;
  }
};

export const analyzeImageQwen = async (base64Image: string, mimeType: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("DashScope API Key is required.");

    try {
        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "qwen-vl-max",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this image in detail. Describe the scene, objects, text, and overall mood." },
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Qwen VL Error: ${err.error?.message}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Failed to analyze image.";

    } catch (error) {
        console.error("Qwen Image analysis failed:", error);
        throw error;
    }
};

export const generateSpeechQwen = async (text: string, apiKey: string): Promise<ArrayBuffer> => {
    if (!apiKey) throw new Error("DashScope API Key is required.");

    // Using Sambert-zh-v1 via DashScope REST API
    try {
        const response = await fetch(TTS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "sambert-zh-v1",
                input: {
                    text: text
                },
                parameters: {
                    format: "mp3",
                    sample_rate: 48000
                }
            })
        });

        if (!response.ok) {
             const err = await response.json();
             throw new Error(`Qwen TTS Error: ${err.message || response.statusText}`);
        }

        // DashScope TTS REST API returns the binary audio stream directly for sync calls
        const audioBuffer = await response.arrayBuffer();
        return audioBuffer;

    } catch (error) {
        console.error("Qwen TTS failed:", error);
        throw error;
    }
};
