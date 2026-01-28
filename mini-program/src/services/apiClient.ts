/**
 * Backend API Client Service
 * 
 * Provides a type-safe interface to communicate with the backend API.
 * Handles authentication, token refresh, and error handling.
 */

import Taro from '@tarojs/taro';
import { loggers } from './logger';

const logger = loggers.api;

// API base URL - configurable via environment variable for production
// In development: uses Vite proxy (/api/v1 -> localhost:3001)
// In production: set TARO_APP_API_BASE to your backend URL
const API_BASE = process.env.TARO_APP_API_BASE || 'https://www.aiwxcreator.cloud/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    quota: number;
    role: 'user' | 'admin';
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  quota: number;
  role: 'user' | 'admin';
}

// Token management
export const getAccessToken = (): string => {
  return Taro.getStorageSync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string => {
  return Taro.getStorageSync(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  Taro.setStorageSync(ACCESS_TOKEN_KEY, accessToken);
  Taro.setStorageSync(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  Taro.removeStorageSync(ACCESS_TOKEN_KEY);
  Taro.removeStorageSync(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// API request helper
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const accessToken = getAccessToken();
  
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (accessToken) {
    header['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    // Parse body if it's a string (Taro request data should be object for JSON)
    let data: any = undefined;
    if (options.body && typeof options.body === 'string') {
      try {
        data = JSON.parse(options.body);
      } catch {
        data = options.body;
      }
    } else {
      data = options.body;
    }

    const response = await Taro.request({
      url: `${API_BASE}${endpoint}`,
      method: (options.method as any) || 'GET',
      header,
      data,
    });
    
    const responseData = response.data as ApiResponse<T>;
    
    // Handle token expiration
    if (response.statusCode === 401 && responseData.error?.code === 'INVALID_TOKEN') {
      // Try to refresh the token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request with the new token
        return request<T>(endpoint, options);
      }
      // If refresh failed, clear tokens
      clearTokens();
    }
    
    return responseData;
  } catch (error) {
    logger.error('API request failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to the server',
      },
    };
  }
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  
  try {
    const response = await Taro.request({
      url: `${API_BASE}/auth/refresh`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { refreshToken },
    });
    
    const data = response.data as ApiResponse<{ accessToken: string; refreshToken: string }>;
    
    if (data.success && data.data) {
      setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string): Promise<ApiResponse<AuthResponse>> => {
    const result = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },
  
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const result = await request<AuthResponse>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },

  wechatLogin: async (code: string): Promise<ApiResponse<AuthResponse>> => {
    const result = await request<AuthResponse>('/auth/wechat', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },
  
  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    clearTokens();
  },
  
  getMe: async (): Promise<ApiResponse<User>> => {
    return request<User>('/auth/me');
  },
};

// AI API
export interface GenerationRequest {
  message: string;
  provider?: 'google' | 'deepseek' | 'qwen';
  useSearch?: boolean;
  imageContext?: string;
  isFormattingMode?: boolean;
  thinkingMode?: boolean;
  multiRoundMode?: boolean;
  userprompt?: string; // Custom user prompt for personalized generation
  template?: any; // Article template structure for generation guidance
}

// Import ArticleBlock and rewrite types from types.ts to maintain consistency
import type { ArticleBlock, AIRewriteRequest, AIRewriteResponse } from '@shared/types';

// Re-export for convenience
export type { ArticleBlock, AIRewriteRequest, AIRewriteResponse };

export interface GenerationResult {
  title: string;
  digest: string;
  blocks: ArticleBlock[];
  sources: Array<{ title: string; uri: string }>;
}

// AI Helper response types
export interface AIHelperResponse {
  action: string;
  result: string | string[] | Array<{style: string; preview: string}>;
  provider: string;
}

export const aiApi = {
  generate: async (genRequest: GenerationRequest): Promise<ApiResponse<GenerationResult>> => {
    return request<GenerationResult>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(genRequest),
    });
  },
  
  helper: async (action: string, content: string, provider?: 'deepseek' | 'qwen', options?: Record<string, unknown>): Promise<ApiResponse<AIHelperResponse>> => {
    return request<AIHelperResponse>('/ai/helper', {
      method: 'POST',
      body: JSON.stringify({ action, content, provider, options }),
    });
  },
  
  importUrl: async (url: string, skipAIFill: boolean = false, mode: string = 'structure_only'): Promise<ApiResponse<{
    title: string;
    author: string;
    digest: string;
    blocks: ArticleBlock[];
    cleanedHtml: string;
    svgBlocks: Array<{ id: string; content: string }>;
  }>> => {
    return request('/ai/import-url', {
      method: 'POST',
      body: JSON.stringify({ url, skipAIFill, mode }),
    });
  },
  
  getQuota: async (): Promise<ApiResponse<{
    userId: string;
    hasQuota: boolean;
    remainingQuota: number;
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
    plan: string;
    message: string;
  }>> => {
    return request('/ai/quota');
  },
  
  rewrite: async (rewriteRequest: AIRewriteRequest): Promise<ApiResponse<AIRewriteResponse>> => {
    return request<AIRewriteResponse>('/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify(rewriteRequest),
    });
  },

  getFeatures: async (): Promise<ApiResponse<{
    features: {
      articleGeneration: boolean;
      imageAnalysis: boolean;
      textToSpeech: boolean;
      articleRewrite: boolean;
    };
    providers: {
      deepseek: boolean;
      qwen: boolean;
    };
  }>> => {
    return request('/ai/features');
  },
};

// SSE streaming for AI generation
export interface SSECallbacks {
  onThinking?: (data: { message: string }) => void;
  onBlock?: (block: ArticleBlock) => void;
  onComplete?: (data: { title: string; digest: string; totalBlocks: number; sources: Array<{ title: string; uri: string }> }) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export const streamGeneration = async (
  genRequest: GenerationRequest,
  callbacks: SSECallbacks
): Promise<void> => {
  const accessToken = getAccessToken();
  
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    header['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const task = Taro.request({
      url: `${API_BASE}/ai/chat/stream`,
      method: 'POST',
      header,
      data: genRequest,
      enableChunked: true,
    });

    // Check if TextDecoder is available, otherwise fall back or warn
    // Note: TextDecoder is supported in modern WeChat Mini Program base library
    const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
    let buffer = '';

    task.onChunkReceived((res) => {
      if (!decoder) {
        console.error('TextDecoder not supported');
        return;
      }
      
      const chunk = res.data as ArrayBuffer;
      const text = decoder.decode(chunk, { stream: true });
      buffer += text;
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      let eventType = '';
      let eventData = '';
      
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data:')) {
          eventData = line.slice(5).trim();
        } else if (line === '' && eventType && eventData) {
          // Complete event
          try {
            const data = JSON.parse(eventData);
            
            switch (eventType) {
              case 'thinking':
                callbacks.onThinking?.(data);
                break;
              case 'block':
                callbacks.onBlock?.(data);
                break;
              case 'complete':
                callbacks.onComplete?.(data);
                break;
              case 'error':
                callbacks.onError?.(data);
                break;
            }
          } catch (e) {
            logger.error('Failed to parse SSE data:', e);
          }
          
          eventType = '';
          eventData = '';
        }
      }
    });

    const response = await task;
    
    if (response.statusCode >= 400) {
       callbacks.onError?.({ code: 'HTTP_ERROR', message: `Request failed with status ${response.statusCode}` });
    }

  } catch (error) {
    logger.error('SSE stream error:', error);
    callbacks.onError?.({ code: 'STREAM_ERROR', message: 'Connection failed' });
  }
};

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
  }>> => {
    return request('/health');
  },
};

// Material API
export interface MaterialMetadata {
  id: string;
  type: 'image' | 'video' | 'gif' | 'svg';
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif' | 'svg';
  filename: string;
  size: number;
}

export interface ListMaterialsResponse {
  materials: MaterialMetadata[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Material type enum for type safety
export type MaterialTypeValue = 'image' | 'video' | 'gif' | 'svg';

export const materialApi = {
  upload: async (data: string, filename: string, mimeType: string, type?: MaterialTypeValue): Promise<ApiResponse<UploadResponse>> => {
    return request<UploadResponse>('/materials', {
      method: 'POST',
      body: JSON.stringify({ data, filename, mimeType, type }),
    });
  },
  
  list: async (type?: MaterialTypeValue, page: number = 1, limit: number = 20): Promise<ApiResponse<ListMaterialsResponse>> => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    return request<ListMaterialsResponse>(`/materials?${params.toString()}`);
  },
  
  get: async (id: string): Promise<ApiResponse<MaterialMetadata>> => {
    return request<MaterialMetadata>(`/materials/${id}`);
  },
  
  delete: async (id: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return request<{ deleted: boolean }>(`/materials/${id}`, {
      method: 'DELETE',
    });
  },
  
  getPresignedUrl: async (filename: string, mimeType: string, size: number): Promise<ApiResponse<{ uploadUrl: string; materialId: string }>> => {
    return request<{ uploadUrl: string; materialId: string }>('/materials/presign', {
      method: 'POST',
      body: JSON.stringify({ filename, mimeType, size }),
    });
  },
};

// Quota/User API
export interface QuotaStatus {
  userId: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  resetDate: string;
  expiryDate?: string;
}

export interface UsageRecord {
  id: string;
  type: 'ai_generation' | 'material_upload' | 'ai_stream';
  cost: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface UsageStats {
  period: 'day' | 'week' | 'month';
  total: number;
  byType: Record<string, number>;
}

export const quotaApi = {
  getStatus: async (): Promise<ApiResponse<QuotaStatus>> => {
    return request<QuotaStatus>('/user/quota');
  },
  
  check: async (credits: number = 1): Promise<ApiResponse<{ allowed: boolean; remainingQuota: number; reason?: string }>> => {
    return request<{ allowed: boolean; remainingQuota: number; reason?: string }>(`/user/quota/check?credits=${credits}`);
  },
  
  getHistory: async (limit: number = 50): Promise<ApiResponse<{ history: UsageRecord[] }>> => {
    return request<{ history: UsageRecord[] }>(`/user/quota/history?limit=${limit}`);
  },
  
  getStats: async (period: 'day' | 'week' | 'month' = 'month'): Promise<ApiResponse<UsageStats>> => {
    return request<UsageStats>(`/user/quota/stats?period=${period}`);
  },
};

// Template API
export interface TextRegion {
  id: string;
  index: number;
  type: string;
  originalText: string;
  chineseSequence: string;
  htmlContent: string;
  level?: number;
  marker: string;
  generatedChinese?: string;
}

export interface UserTemplate {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;
  sourceUrl?: string;
  originalHtml: string; 
  textRegions: TextRegion[]; 
  svgBlocks?: Array<{id: string, content: string}>;
  statistics?: {
    totalBlocks: number;
    textRegions: number;
    imageBlocks: number;
    codeBlocks: number;
  };
}

export const templateApi = {
  create: async (data: Omit<UserTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<UserTemplate>> => {
    return request<UserTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list: async (): Promise<ApiResponse<UserTemplate[]>> => {
    return request<UserTemplate[]>('/templates');
  },

  get: async (id: string): Promise<ApiResponse<UserTemplate>> => {
    return request<UserTemplate>(`/templates/${id}`);
  },

  update: async (id: string, updates: Partial<Pick<UserTemplate, 'name' | 'preview'>>): Promise<ApiResponse<UserTemplate>> => {
    return request<UserTemplate>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return request<{ message: string }>(`/templates/${id}`, {
      method: 'DELETE',
    });
  },

  apply: async (contentHtml: string, templateId: string): Promise<ApiResponse<{ html: string }>> => {
    return request<{ html: string }>('/templates/apply', {
      method: 'POST',
      body: JSON.stringify({ contentHtml, templateId }),
    });
  },
};

// Draft API
export interface ArticleDraft {
  id: string;
  userId: string;
  title: string;
  digest: string;
  content: string;
  topic?: string;
  createdAt: number;
  updatedAt: number;
}

export const draftApi = {
  save: async (data: Omit<ArticleDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiResponse<ArticleDraft>> => {
    return request<ArticleDraft>('/drafts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list: async (): Promise<ApiResponse<ArticleDraft[]>> => {
    return request<ArticleDraft[]>('/drafts');
  },

  get: async (id: string): Promise<ApiResponse<ArticleDraft>> => {
    return request<ArticleDraft>(`/drafts/${id}`);
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return request<{ message: string }>(`/drafts/${id}`, {
      method: 'DELETE',
    });
  },
};

// WeChat Open Platform (Scheme B) API
export const wechatOpenPlatformApi = {
  getPreAuthUrl: async (redirectUri?: string): Promise<ApiResponse<{ url: string }>> => {
    const params = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
    return request<{ url: string }>(`/wechat-open/pre-auth-url${params}`);
  },

  bindAccount: async (authCode: string): Promise<ApiResponse<any>> => {
    return request<any>('/wechat-open/bind', {
      method: 'POST',
      body: JSON.stringify({ authCode }),
    });
  },

  listAccounts: async (): Promise<ApiResponse<any[]>> => {
    return request<any[]>('/wechat-open/accounts');
  },

  getStatus: async (appId: string): Promise<ApiResponse<{ isAuthorized: boolean }>> => {
    return request<{ isAuthorized: boolean }>(`/wechat-open/status/${appId}`);
  },
};

export default {
  auth: authApi,
  template: templateApi,
  draft: draftApi,
  ai: aiApi,
  health: healthApi,
  material: materialApi,
  quota: quotaApi,
  wechatOpen: wechatOpenPlatformApi,
  streamGeneration,
  isAuthenticated,
  clearTokens,
};
