
import { ArticleBlock, GroundingSource } from "@shared/types";
import { GenerationResult } from "./geminiService";
import { loggers } from './logger';
import { safeParseJSON } from '@shared/utils/jsonParser';
import { generateArticleViaBackend, callAIHelper, type StyleSuggestion } from './backendAIClient';

const logger = loggers.qwen;

const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation";

import { LAYOUT_ARTICLE_TOOL_DEF } from './aiToolDefinitions';

const tools = [
  LAYOUT_ARTICLE_TOOL_DEF
];

export const generateArticleStructureQwen = async (
  input: string,
  apiKey: string,
  useSearch: boolean,
  imageContext: string = "",
  isFormattingMode: boolean = false
): Promise<GenerationResult> => {
  // API keys are no longer accepted from frontend for security reasons
  if (apiKey && apiKey.trim() !== '') {
    logger.warn('⚠️  API keys should not be provided from frontend. Using backend service instead.');
  }

  try {
    logger.info('Using Qwen via backend', { useSearch, isFormattingMode });

    // Call backend AI service instead of direct API
    const result = await generateArticleViaBackend({
      message: input,
      provider: 'qwen',
      useSearch,
      imageContext,
      isFormattingMode
    });

    logger.info('Backend AI service completed', {
      title: result.title,
      blocksCount: result.blocks?.length || 0
    });

    return result;
  } catch (error) {
    logger.error("Qwen generation via backend failed:", error);
    throw error;
  }
};

export const analyzeImageQwen = async (base64Image: string, mimeType: string, apiKey: string = ''): Promise<string> => {
  if (!apiKey) {
    throw new Error("Image analysis requires Qwen to be configured on the backend. Please contact your administrator.");
  }

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

export const generateSpeechQwen = async (text: string, apiKey: string = ''): Promise<ArrayBuffer> => {
  if (!apiKey) {
    throw new Error("Text-to-speech requires Qwen to be configured on the backend. Please contact your administrator.");
  }

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

// --- Helper for Qwen API calls ---
const callQwenAPI = async (apiKey: string, messages: any[], temperature: number = 0.7, enableSearch: boolean = false): Promise<string> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "qwen-plus",
      messages,
      temperature,
      enable_search: enableSearch
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Qwen API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};


// NOTE: AI helper functions (generateTitleSuggestions, generateSummary, expandContent, etc.)
// have been consolidated into backendAIClient.ts. Use callAIHelper() directly:
//
// import { callAIHelper } from './backendAIClient';
// const result = await callAIHelper({ action: 'generateTitles', content, provider: 'qwen' });
//
//                   extractKeywords, translateContent, suggestStyles, generateHook,
//                   generateCTA, rewriteContent
