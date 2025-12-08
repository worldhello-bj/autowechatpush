
import { ArticleBlock, BlockType, GroundingSource } from "../types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';
import { safeParseJSON } from './jsonParser';

const logger = loggers.deepseek;

const BASE_URL = "https://api.deepseek.com/chat/completions";

// DeepSeek model types
export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';

// Whether to enable thinking mode (for deepseek-reasoner with tool calling)
let thinkingModeEnabled: boolean = false;

// Whether to enable multi-round layout mode (phased generation)
let multiRoundLayoutModeEnabled: boolean = false;

// Default model - can be changed to use reasoner mode
let currentModel: DeepSeekModel = 'deepseek-chat';

/**
 * Set the DeepSeek model to use
 * @param model - 'deepseek-chat' for regular chat or 'deepseek-reasoner' for reasoning mode with thinking
 * @description When 'deepseek-reasoner' is selected, the service uses 'deepseek-chat' with 
 *              `thinking: { type: "enabled" }` to enable enhanced reasoning with tool calling support.
 *              This is the recommended approach per DeepSeek's API documentation.
 */
export const setDeepSeekModel = (model: DeepSeekModel): void => {
  currentModel = model;
  // When using deepseek-reasoner, we use deepseek-chat with thinking enabled for tool calling support
  thinkingModeEnabled = model === 'deepseek-reasoner';
  logger.info(`DeepSeek model set to: ${model}, thinking mode: ${thinkingModeEnabled}`);
};

/**
 * Get the current DeepSeek model setting
 * @description Note: When 'deepseek-reasoner' is returned, the actual API calls use 'deepseek-chat' 
 *              with thinking mode enabled for tool calling support.
 */
export const getDeepSeekModel = (): DeepSeekModel => currentModel;

/**
 * Check if thinking mode is enabled
 * When enabled, DeepSeek uses enhanced reasoning capabilities with multi-turn tool calling support.
 */
export const isThinkingModeEnabled = (): boolean => thinkingModeEnabled;

/**
 * Enable or disable thinking mode manually
 * @param enabled - true to enable thinking mode (enhanced reasoning with tool calling)
 */
export const setThinkingMode = (enabled: boolean): void => {
  thinkingModeEnabled = enabled;
  logger.info(`DeepSeek thinking mode set to: ${enabled}`);
};

/**
 * Check if multi-round layout mode is enabled
 * When enabled, article generation is split into phases: background, content, images, summary
 */
export const isMultiRoundLayoutModeEnabled = (): boolean => multiRoundLayoutModeEnabled;

/**
 * Enable or disable multi-round layout mode
 * @param enabled - true to enable multi-round layout generation (higher token consumption)
 */
export const setMultiRoundLayoutMode = (enabled: boolean): void => {
  multiRoundLayoutModeEnabled = enabled;
  logger.info(`DeepSeek multi-round layout mode set to: ${enabled}`);
};

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
                role: { type: "string", description: "Author role/position for testimonial blocks." },
                // Typography properties for emphasis
                fontSize: { 
                  type: "string", 
                  enum: ["small", "normal", "large", "xlarge"], 
                  description: "Font size for visual hierarchy. Use 'large' or 'xlarge' for important text, 'small' for footnotes or secondary info." 
                },
                fontWeight: { 
                  type: "string", 
                  enum: ["normal", "bold", "light"], 
                  description: "Font weight for emphasis. Use 'bold' for key points and important statements." 
                },
                fontStyle: { 
                  type: "string", 
                  enum: ["normal", "italic"], 
                  description: "Font style. Use 'italic' for quotes, emphasis, or foreign words." 
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

/**
 * Interface for DeepSeek message with reasoning content
 */
interface DeepSeekMessage {
  role: string;
  content: string;
  reasoning_content?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * Make a single API call to DeepSeek
 */
const makeDeepSeekRequest = async (
  apiKey: string,
  messages: any[],
  useThinking: boolean = false
): Promise<any> => {
  const requestBody: Record<string, unknown> = {
    model: 'deepseek-chat', // Always use deepseek-chat, thinking mode is enabled via 'thinking' parameter
    messages,
    tools,
    tool_choice: "auto"
  };

  // Enable thinking mode for reasoner-style behavior with tool calling support
  if (useThinking) {
    // Note: In browser environment, we pass thinking config directly in the body
    // Some API clients use extra_body, but fetch API accepts it in the main body
    (requestBody as any).thinking = { type: "enabled" };
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const err = await response.json();
      errorMessage = err.error?.message || errorMessage;
    } catch {
      // Failed to parse error response, use statusText
    }
    throw new Error(`DeepSeek API Error: ${errorMessage}`);
  }

  return response.json();
};

/**
 * Clear reasoning_content from messages to save bandwidth
 * Called when starting a new turn/question
 */
const clearReasoningContent = (messages: any[]): void => {
  for (const message of messages) {
    if (message.reasoning_content) {
      delete message.reasoning_content;
    }
  }
};

/**
 * Generate article structure using multi-round layout mode
 * This splits the generation into 4 phases: background, content, images, summary
 */
const generateArticleMultiRoundLayout = async (
  input: string,
  apiKey: string,
  isFormattingMode: boolean = false,
  useReasonerMode?: boolean
): Promise<GenerationResult> => {
  const useThinking = useReasonerMode !== undefined ? useReasonerMode : thinkingModeEnabled;
  
  logger.group('=== DeepSeek Multi-Round Layout Generation ===', true);
  logger.info(`📝 Topic: ${input}`);
  logger.info(`🧠 Thinking Mode: ${useThinking ? 'Enabled' : 'Disabled'}`);
  logger.info(`📋 Mode: ${isFormattingMode ? 'Formatting' : 'Generation'}`);
  logger.info('⚠️  Note: This will make 4 separate API calls');

  const topic = input;
  
  // Round 1: Generate background/context
  logger.group('📘 Round 1: Background/Context', true);
  logger.time('Round 1');
  const round1Prompt = `You are a professional WeChat Official Account editor. For the topic "${topic}", generate ONLY the background and context section of the article.

Focus on:
- Opening hook or introduction
- Background information
- Context setting
- Why this topic matters

Use the 'layout_article' tool with:
- A working title (can be refined later)
- A brief digest
- 2-4 blocks for background/context (use 'header', 'paragraph', 'card', or 'callout' types)

Keep it concise - this is just the background section.`;

  const round1Messages = [
    { role: "system", content: "You are a talented content creator specializing in engaging WeChat articles." },
    { role: "user", content: round1Prompt }
  ];

  const round1Data = await makeDeepSeekRequest(apiKey, round1Messages, useThinking);
  const round1Result = extractLayoutFromResponse(round1Data);
  
  logger.timeEnd('Round 1');
  if (!round1Result) {
    logger.error('❌ Round 1 failed to generate content');
    throw new Error("Failed to generate background section");
  }
  logger.info(`✅ Generated ${round1Result.blocks.length} blocks for background`);
  logger.groupEnd();

  // Round 2: Generate main content/copy
  logger.group('📝 Round 2: Main Content/Copy', true);
  logger.time('Round 2');
  const round2Prompt = `Continue the article about "${topic}". You have the background. Now generate the MAIN CONTENT section with detailed text and copy.

Previous context:
${JSON.stringify(round1Result.blocks)}

Focus on:
- Main arguments and key points
- Detailed explanations
- Supporting evidence
- Rich text content

Use the 'layout_article' tool to ADD content blocks (use 'paragraph', 'card', 'list', 'numbered_list', 'quote', 'highlight' types).

Do NOT repeat the background - only provide NEW content blocks for the main body.`;

  const round2Messages = [
    { role: "system", content: "You are a talented content creator specializing in engaging WeChat articles." },
    { role: "user", content: round2Prompt }
  ];

  const round2Data = await makeDeepSeekRequest(apiKey, round2Messages, useThinking);
  const round2Result = extractLayoutFromResponse(round2Data);
  
  logger.timeEnd('Round 2');
  if (!round2Result) {
    logger.error('❌ Round 2 failed to generate content');
    throw new Error("Failed to generate main content section");
  }
  logger.info(`✅ Generated ${round2Result.blocks.length} blocks for main content`);
  logger.groupEnd();

  // Round 3: Add images and visual widgets
  logger.group('🎨 Round 3: Images and Visual Widgets', true);
  logger.time('Round 3');
  const round3Prompt = `Continue the article about "${topic}". You have background and main content. Now add IMAGES and VISUAL WIDGETS.

Previous sections:
Background: ${round1Result.blocks.length} blocks
Main Content: ${round2Result.blocks.length} blocks

Focus on:
- Image blocks with vivid descriptions
- Visual elements (divider, svg, stats, progress, etc.)
- Special widgets (qrcode, countdown, testimonial, etc.)

Use the 'layout_article' tool to ADD visual blocks (use 'image', 'divider', 'svg', 'stats', 'progress', 'countdown', 'testimonial' types).

Do NOT repeat previous content - only provide NEW visual/widget blocks.`;

  const round3Messages = [
    { role: "system", content: "You are a talented content creator specializing in engaging WeChat articles." },
    { role: "user", content: round3Prompt }
  ];

  const round3Data = await makeDeepSeekRequest(apiKey, round3Messages, useThinking);
  const round3Result = extractLayoutFromResponse(round3Data);
  
  logger.timeEnd('Round 3');
  if (!round3Result) {
    logger.error('❌ Round 3 failed to generate content');
    throw new Error("Failed to generate images and widgets section");
  }
  logger.info(`✅ Generated ${round3Result.blocks.length} blocks for visuals`);
  logger.groupEnd();

  // Round 4: Generate summary and conclusion
  logger.group('📊 Round 4: Summary and Conclusion', true);
  logger.time('Round 4');
  const round4Prompt = `Complete the article about "${topic}". You have background, content, and visuals. Now add a SUMMARY and CONCLUSION.

Article structure so far:
- Background: ${round1Result.blocks.length} blocks
- Main Content: ${round2Result.blocks.length} blocks  
- Visuals: ${round3Result.blocks.length} blocks

Focus on:
- Key takeaways summary
- Conclusion or call-to-action
- Final thoughts

Use the 'layout_article' tool to ADD conclusion blocks (use 'card', 'highlight', 'callout', 'quote' types).

Also provide:
- A refined final TITLE for the complete article
- A polished DIGEST/summary

Do NOT repeat previous content - only provide NEW conclusion blocks, final title, and digest.`;

  const round4Messages = [
    { role: "system", content: "You are a talented content creator specializing in engaging WeChat articles." },
    { role: "user", content: round4Prompt }
  ];

  const round4Data = await makeDeepSeekRequest(apiKey, round4Messages, useThinking);
  const round4Result = extractLayoutFromResponse(round4Data);
  
  logger.timeEnd('Round 4');
  if (!round4Result) {
    logger.error('❌ Round 4 failed to generate content');
    throw new Error("Failed to generate summary section");
  }
  logger.info(`✅ Generated ${round4Result.blocks.length} blocks for summary`);
  logger.groupEnd();

  // Combine all rounds
  logger.group('🔄 Combining All Rounds', true);
  logger.info('Merging all rounds into final article...');
  const allBlocks = [
    ...round1Result.blocks,
    ...round2Result.blocks,
    ...round3Result.blocks,
    ...round4Result.blocks
  ];

  // Use the final title and digest from round 4, or fall back to round 1
  const finalTitle = round4Result.title || round1Result.title || "Untitled Article";
  const finalDigest = round4Result.digest || round1Result.digest || "No summary available.";

  logger.group('✅ Multi-Round Article Generation Complete', true);
  logger.info(`📌 Final Title: ${finalTitle}`);
  logger.info(`📝 Final Digest: ${finalDigest}`);
  logger.info(`📊 Total Blocks: ${allBlocks.length}`);
  logger.info(`  └─ Round 1 (Background): ${round1Result.blocks.length} blocks`);
  logger.info(`  └─ Round 2 (Content): ${round2Result.blocks.length} blocks`);
  logger.info(`  └─ Round 3 (Visuals): ${round3Result.blocks.length} blocks`);
  logger.info(`  └─ Round 4 (Summary): ${round4Result.blocks.length} blocks`);
  logger.groupEnd();
  logger.groupEnd();

  return {
    title: finalTitle,
    digest: finalDigest,
    blocks: allBlocks,
    sources: []
  };
};

/**
 * Extract layout_article result from API response
 */
const extractLayoutFromResponse = (data: any): { title: string; digest: string; blocks: any[] } | null => {
  const message = data.choices?.[0]?.message;
  if (!message) return null;

  const toolCalls = message.tool_calls;
  if (!toolCalls || toolCalls.length === 0) return null;

  for (const toolCall of toolCalls) {
    if (toolCall.function?.name === 'layout_article') {
      try {
        const args = safeParseJSON(toolCall.function.arguments, logger);
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const blocks = (args.blocks || []).map((b: any, index: number) => ({
          id: `ds-${timestamp}-${index}-${random}`,
          ...b
        }));
        
        return {
          title: args.title || "",
          digest: args.digest || "",
          blocks
        };
      } catch (error) {
        logger.error('Failed to parse layout_article response:', error);
        return null;
      }
    }
  }

  return null;
};

export const generateArticleStructureDeepSeek = async (
  input: string,
  apiKey: string,
  isFormattingMode: boolean = false,
  useReasonerMode?: boolean
): Promise<GenerationResult> => {
  if (!apiKey) {
    throw new Error("DeepSeek API Key is required.");
  }

  // Check if multi-round layout mode is enabled
  if (multiRoundLayoutModeEnabled) {
    return await generateArticleMultiRoundLayout(input, apiKey, isFormattingMode, useReasonerMode);
  }

  // Determine whether to use thinking mode
  const useThinking = useReasonerMode !== undefined ? useReasonerMode : thinkingModeEnabled;
  
  logger.info(`Using DeepSeek with thinking mode: ${useThinking}`);

  let prompt = "";
  if (isFormattingMode) {
    prompt = `
You are a professional WeChat Official Account editor with a flair for creative, engaging writing.
Your task is to format the input text into a rich WeChat article structure using the 'layout_article' tool.

Guidelines:
- **Content**: Keep the original text's meaning but enhance the language with vivid, expressive writing.
- **Writing Style**: Use diverse sentence structures - mix short punchy sentences with flowing longer ones. Add rhetorical questions, metaphors, and analogies to make content more engaging.
- **Colors**: Assign colorful styles (red, blue, purple, orange, green, pink, cyan, gradient) to headers and cards to make it visually appealing.
- **Typography**: Use different font sizes and weights for emphasis:
  - Use 'fontSize: xlarge' for main headlines and key statistics
  - Use 'fontSize: large' for important points and subheadings
  - Use 'fontSize: small' for footnotes or supplementary info
  - Use 'fontWeight: bold' for key phrases and important statements
  - Use 'fontStyle: italic' for quotes, emphasis, or special terms
- **Structure**: Use 'card' blocks for emphasis, 'highlight' for key phrases and memorable quotes.
- **Rich Elements**: Use 'divider' between sections, 'callout' for important notices with emoji icons, 'numbered_list' for steps, 'quote' for inspiring statements.
- **Headers**: Use different header levels (1, 2, 3) for hierarchy with creative, attention-grabbing titles.
- **Engagement**: Start sections with hooks, use storytelling techniques, and end with thought-provoking conclusions.

Input Text:
"""
${input}
"""

Call the function 'layout_article' to return the formatted result.
    `;
  } else {
    prompt = `
You are a professional WeChat Official Account editor known for creating visually engaging "Xiumi-style" articles with captivating, diverse writing styles.
Your task is to write a high-quality article about: "${input}".

Structure the article using the 'layout_article' tool with the following guidelines:

**Writing Excellence:**
- Use varied sentence structures: mix short impactful statements with descriptive passages
- Incorporate storytelling elements: hooks, conflicts, resolutions
- Add rhetorical questions to engage readers: "Have you ever wondered...?"
- Use metaphors and analogies to explain complex concepts
- Include emotional triggers and relatable scenarios
- Vary paragraph lengths for rhythm and pacing
- Use transitions that flow naturally between ideas

**Typography & Visual Hierarchy:**
- Use fontSize: 'xlarge' for dramatic headlines and key statistics (e.g., "10倍增长！")
- Use fontSize: 'large' for important points, section highlights, and memorable quotes
- Use fontSize: 'normal' for regular body text
- Use fontSize: 'small' for footnotes, credits, or supplementary information
- Use fontWeight: 'bold' for key phrases, important statements, and emphasis
- Use fontWeight: 'light' for softer, secondary text
- Use fontStyle: 'italic' for quotes, foreign words, or special emphasis
- Combine typography with colors for maximum visual impact

**Visual Design:**
- Use 'card' blocks frequently for key takeaways with catchy titles
- Apply specific colors ('red', 'blue', 'orange', 'purple', 'gold', 'green', 'pink', 'cyan', 'gradient') for different Cards and Headers
- Insert 'image' blocks where appropriate with vivid descriptions
- Use 'divider' between major sections, 'callout' for tips/warnings with relevant emoji
- Use 'numbered_list' for steps, 'table' for data comparisons
- Use 'quote' blocks for memorable statements or inspirational lines
- Use 'highlight' to draw attention to surprising facts or key phrases

**Headers & Structure:**
- Use header levels (1=main, 2=sub, 3=minor) with creative, click-worthy titles
- Make headers intriguing: use questions, numbers, or power words
- Example: Instead of "Benefits" use "5 Surprising Benefits That Will Change Your Mind"

Call the function 'layout_article' to return the result.
    `;
  }

  try {
    // Initialize messages array
    const messages: any[] = [
      { role: "system", content: "You are a talented content creator who writes engaging WeChat articles with colorful layouts and diverse, captivating language styles. You excel at using varied sentence structures, storytelling techniques, rhetorical questions, metaphors, and emotional hooks to create compelling content that resonates with readers." },
      { role: "user", content: prompt }
    ];

    let subTurn = 1;
    const maxSubTurns = 10; // Fixed limit for tool calling iterations
    
    while (subTurn <= maxSubTurns) {
      logger.info(`DeepSeek API call - Sub-turn ${subTurn}/${maxSubTurns}`);
      
      const data = await makeDeepSeekRequest(apiKey, messages, useThinking);
      
      // Log the raw API response
      logger.group(`DeepSeek API Response (Sub-turn ${subTurn})`, true);
      logger.debug('Raw response:', data);
      logger.groupEnd();
      
      const choice = data.choices?.[0];
      const message = choice?.message;
      
      if (!message) {
        throw new Error("No message in API response");
      }

      // Log reasoning content if available (specific to thinking mode)
      if (message.reasoning_content) {
        logger.group('DeepSeek Reasoning', true);
        logger.debug('Reasoning content:', message.reasoning_content);
        logger.groupEnd();
      }

      // Append the assistant message to maintain conversation context
      // This includes reasoning_content which needs to be passed back in thinking mode
      messages.push(message);

      const toolCalls = message.tool_calls;
      
      // If there are no tool calls, the model has given a final answer
      if (!toolCalls || toolCalls.length === 0) {
        // Check if we got the layout_article function call in any previous turn
        // In this case, the final message might just be content without tool calls
        logger.info('No more tool calls, processing final response');
        
        // Look for the layout_article tool call in the conversation
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role === 'assistant' && msg.tool_calls) {
            for (const tc of msg.tool_calls) {
              if (tc.function?.name === 'layout_article') {
                // Found it! Parse and return
                let args;
                try {
                  args = safeParseJSON(tc.function.arguments, logger);
                } catch (parseError) {
                  logger.error('Failed to parse AI response JSON:', parseError);
                  logger.error('Raw arguments:', tc.function.arguments);
                  throw new Error(`Failed to parse AI response: ${parseError}`);
                }
                
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
            }
          }
        }
        
        // If we reach here without finding layout_article, the generation failed
        throw new Error("DeepSeek failed to generate structured content. Please try again.");
      }

      // Process tool calls
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function?.name;
        const functionArgs = toolCall.function?.arguments;
        
        logger.info(`Tool call: ${functionName}`);
        
        if (functionName === 'layout_article') {
          // This is our target function - parse and return the result
          let args;
          try {
            args = safeParseJSON(functionArgs, logger);
          } catch (parseError) {
            logger.error('Failed to parse AI response JSON:', parseError);
            logger.error('Raw arguments:', functionArgs);
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
        } else {
          // For other tool calls, provide a helpful response to guide the AI back to the main task
          logger.warn(`Unexpected tool call: ${functionName}, guiding AI back to main task`);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `This tool (${functionName}) is not available. Please use the 'layout_article' function to generate the article structure directly.`
          });
        }
      }
      
      subTurn++;
    }

    throw new Error("DeepSeek exceeded maximum sub-turns without generating content.");

  } catch (error) {
    logger.error("DeepSeek generation failed:", error);
    throw error;
  }
};

// --- Helper for DeepSeek API calls ---
/**
 * Helper function for DeepSeek API calls (simple text generation without tool calling)
 * @param apiKey - DeepSeek API key
 * @param messages - Chat messages
 * @param temperature - Temperature (default 0.7)
 * @param useThinkingMode - Whether to enable thinking mode for enhanced reasoning
 * @returns The content from the AI response
 */
const callDeepSeekAPI = async (
  apiKey: string, 
  messages: any[], 
  temperature: number = 0.7,
  useThinkingMode?: boolean
): Promise<string> => {
  const useThinking = useThinkingMode !== undefined ? useThinkingMode : thinkingModeEnabled;

  const requestBody: Record<string, unknown> = {
    model: 'deepseek-chat', // Always use deepseek-chat
    messages,
    temperature
  };

  // Enable thinking mode for enhanced reasoning
  if (useThinking) {
    (requestBody as any).thinking = { type: "enabled" };
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`DeepSeek API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  // Log reasoning content if available (when thinking mode is enabled)
  if (useThinking && message?.reasoning_content) {
    logger.group('DeepSeek Reasoning', true);
    logger.debug('Reasoning content:', message.reasoning_content);
    logger.groupEnd();
  }

  return message?.content || "";
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
