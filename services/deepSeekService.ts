
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
                  enum: ["header", "paragraph", "card", "list", "quote", "image"], 
                  description: "The type of the block. Use 'image' for suggested image positions." 
                },
                content: { type: "string", description: "The main text content. For images, this is the description/prompt." },
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
        - **Colors**: Assign colorful styles (red, blue, purple, orange) to headers and cards to make it pretty.
        - **Structure**: Use 'card' blocks for emphasis.
        
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
        - **Visual Variety**: Use 'card' blocks frequently for key takeaways.
        - **Colors**: You MUST use specific colors ('red', 'blue', 'orange', 'purple', 'gold') for different Cards and Headers.
        - **Images**: Insert 'image' blocks where appropriate. Set the content to a description of the image (e.g., "A photo of...") so the user knows what to put there.
        
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
            sources: [] 
        };
    }

    throw new Error("DeepSeek failed to generate structured content. Please try again.");

  } catch (error) {
    console.error("DeepSeek generation failed:", error);
    throw error;
  }
};
