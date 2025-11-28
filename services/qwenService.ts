
import { ArticleBlock, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";

const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation";

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
                  enum: ["header", "paragraph", "card", "list", "quote", "image", "divider", "code", "callout", "numbered_list", "highlight", "table"], 
                  description: "Block type. Use 'header' for section titles, 'paragraph' for body text, 'card' for key points, 'list' for bullets, 'numbered_list' for steps, 'quote' for citations, 'image' for visual placeholders, 'divider' for section breaks, 'code' for code snippets, 'callout' for notices, 'highlight' for emphasized text, 'table' for structured data." 
                },
                content: { type: "string", description: "The main text content. For images, provide a description. For divider, this can be empty." },
                title: { type: "string", description: "Title for card, header, callout, or table blocks." },
                items: { 
                  type: "array", 
                  items: { type: "string" }, 
                  description: "List items for 'list' or 'numbered_list' types." 
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
                headers: { type: "array", items: { type: "string" }, description: "Table header row for 'table' type." }
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
        - **Formatting**: Improve readability with proper structure.
        - **Visuals**: Use 'card' blocks for important summaries, 'highlight' for key phrases.
        - **Colors**: Assign varied colors (red, blue, purple, orange, green, pink, cyan, gradient) to sections to make it visually interesting.
        - **Rich Elements**: Use 'divider' between major sections, 'callout' for important notices, 'numbered_list' for steps, 'table' for structured data.
        - **Headers**: Use header levels (1, 2, 3) for proper hierarchy.
        
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
        - **Visual Variety**: Do NOT just use paragraphs. You MUST use 'card' blocks, 'highlight' for emphasis.
        - **Colors**: Use colors like 'red', 'blue', 'orange', 'purple', 'gold', 'green', 'pink', 'cyan', 'gradient' for Cards and Headers.
        - **Images**: Insert 'image' blocks. Content should be a description (e.g., "A neon city street").
        - **Rich Elements**: Use 'divider' between sections, 'callout' for tips/info/warnings, 'numbered_list' for steps, 'table' for data.
        - **Headers**: Use header levels (1=main, 2=sub, 3=minor) for hierarchy.
        - **Code**: Use 'code' blocks with language for any code snippets.
        
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
