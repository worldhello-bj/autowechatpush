/**
 * Backend AI Client - Client for calling backend AI API endpoints
 * 
 * This service replaces direct AI provider API calls with backend endpoint calls.
 * All API keys are managed by the backend for security.
 */

import { GenerationResult } from "./geminiService";
import { loggers } from './logger';

const logger = loggers.backendAI || console;

// Backend API base URL - defaults to relative path for same-origin requests
const getBackendBaseUrl = (): string => {
  // In development, use environment variable if available
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // For production or same-origin, use relative path
  return '/api/v1';
};

export interface BackendAIRequest {
  message: string;
  provider: 'deepseek' | 'qwen' | 'gemini';
  useSearch?: boolean;
  imageContext?: string;
  isFormattingMode?: boolean;
  thinkingMode?: boolean;
  multiRoundMode?: boolean;
}

export interface BackendHelperRequest {
  action: string;
  content: string;
  provider?: 'deepseek' | 'qwen';
  options?: Record<string, any>;
}

// Style suggestion interface
export interface StyleSuggestion {
  style: string;
  reason: string;
  colorScheme: string[];
  mood: string;
}

// Union type for AI helper return values based on action
export type AIHelperResult = 
  | string          // For generateSummary, polishContent, expandContent, translateContent, generateHook, generateCTA, rewriteContent
  | string[]        // For generateTitles, extractKeywords
  | StyleSuggestion[];  // For suggestStyles

/**
 * Generate article using backend AI service
 */
export const generateArticleViaBackend = async (
  request: BackendAIRequest
): Promise<GenerationResult> => {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/ai/generate`;
  
  try {
    logger.info?.('Calling backend AI service', { provider: request.provider });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const errorMessage = errorData.error?.message || `Backend API Error: ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json() as { success: boolean; data: GenerationResult };
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response from backend');
    }
    
    logger.info?.('Backend AI service completed', { 
      title: data.data.title,
      blocksCount: data.data.blocks?.length || 0
    });
    
    return data.data;
  } catch (error) {
    logger.error?.('Backend AI service failed:', error);
    throw error;
  }
};

/**
 * Call AI helper function via backend
 */
export const callAIHelper = async (
  request: BackendHelperRequest
): Promise<AIHelperResult> => {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/ai/helper`;
  
  try {
    logger.info?.('Calling backend AI helper', { action: request.action });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const errorMessage = errorData.error?.message || `Backend API Error: ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json() as { success: boolean; data: { result: any } };
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response from backend');
    }
    
    logger.info?.('Backend AI helper completed', { action: request.action });
    
    return data.data.result;
  } catch (error) {
    logger.error?.('Backend AI helper failed:', error);
    throw error;
  }
};

/**
 * Check AI features availability from backend
 */
export const getAIFeaturesAvailability = async (): Promise<{
  features: {
    articleGeneration: boolean;
    imageAnalysis: boolean;
    textToSpeech: boolean;
  };
  providers: {
    deepseek: boolean;
    qwen: boolean;
  };
}> => {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/ai/features`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to check features availability');
    }
    
    const data = await response.json() as { 
      success: boolean; 
      data: {
        features: {
          articleGeneration: boolean;
          imageAnalysis: boolean;
          textToSpeech: boolean;
        };
        providers: {
          deepseek: boolean;
          qwen: boolean;
        };
      };
    };
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response from backend');
    }
    
    return data.data;
  } catch (error) {
    logger.error?.('Failed to check features availability:', error);
    // Return default values on error
    return {
      features: {
        articleGeneration: false,
        imageAnalysis: false,
        textToSpeech: false,
      },
      providers: {
        deepseek: false,
        qwen: false,
      },
    };
  }
};
