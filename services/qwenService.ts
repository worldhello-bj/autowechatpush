
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
                  enum: ["header", "paragraph", "card", "list", "quote"], 
                  description: "The type of the block." 
                },
                content: { type: "string", description: "The main text content of the block." },
                title: { type: "string", description: "Title for card or header blocks." },
                items: { 
                  type: "array", 
                  items: { type: "string" }, 
                  description: "List items if type is list." 
                },
                style: { 
                  type: "string", 
                  enum: ["default", "primary", "warning", "quote"], 
                  description: "Visual style style." 
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
  topic: string,
  apiKey: string,
  useSearch: boolean,
  imageContext: string = ""
): Promise<GenerationResult> => {
  if (!apiKey) {
    throw new Error("DashScope API Key is required for Qwen.");
  }

  const prompt = `
    You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles.
    Your task is to write a high-quality article about: "${topic}".
    
    ${imageContext ? `Context from uploaded image: ${imageContext}` : ''}
    
    Structure the article using the 'layout_article' tool with the following guidelines:
    - **Visual Variety**: Do NOT just use paragraphs. You MUST use 'card' blocks for key takeaways, important summaries, or interesting facts.
    - **Headers**: Use clear headers to break up sections.
    - **Lists**: Use lists for steps or bullet points.
    - **Cards**: Use the 'card' type frequently to create styled boxes for emphasis.
    - **Tone**: Professional, engaging, and suitable for mobile reading.
    
    Call the function 'layout_article' to return the result.
  `;

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
          { role: "system", content: "You are a helpful assistant that writes WeChat articles." },
          { role: "user", content: prompt }
        ],
        tools: tools,
        tool_choice: "auto",
        // Enable search if requested. DashScope compatible endpoint may support this via specific params or default behavior for plus model.
        // Explicit parameter for DashScope search in OpenAI compatible mode is sometimes passed via extra body keys.
        enable_search: useSearch 
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
            sources: [] // Qwen via this endpoint doesn't standardized grounding metadata in the OpenAI format yet
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
