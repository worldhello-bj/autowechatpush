
import { ArticleBlock, BlockType, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";

const BASE_URL = "https://api.deepseek.com/chat/completions";

// Re-use the structure but adapted for OpenAI-compatible tool definitions
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

export const generateArticleStructureDeepSeek = async (
  topic: string,
  apiKey: string
): Promise<GenerationResult> => {
  if (!apiKey) {
    throw new Error("DeepSeek API Key is required.");
  }

  const prompt = `
    You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles.
    Your task is to write a high-quality article about: "${topic}".
    
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
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant that writes WeChat articles." },
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
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (toolCall && toolCall.function.name === 'layout_article') {
        const args = JSON.parse(toolCall.function.arguments);
        const blocks = (args.blocks || []).map((b: any, index: number) => ({
            id: `ds-${Date.now()}-${index}`,
            ...b
        }));

        return {
            title: args.title || "Untitled Article",
            digest: args.digest || "No summary available.",
            blocks,
            sources: [] // DeepSeek does not support search grounding in this endpoint
        };
    }

    // Fallback if model didn't call tool properly
    throw new Error("DeepSeek failed to generate structured content. Please try again.");

  } catch (error) {
    console.error("DeepSeek generation failed:", error);
    throw error;
  }
};
