/**
 * Backend API Client Service (Taro Version)
 * 
 * Provides a type-safe interface to communicate with the backend API.
 * Handles authentication, token refresh, and error handling.
 */
import Taro from '@tarojs/taro';
import { loggers } from './logger';
import type { 
  ApiResponse, 
  AuthResponse, 
  User, 
  GenerationRequest, 
  GenerationResult, 
  AIHelperResponse, 
  SSECallbacks,
  MaterialMetadata,
  UploadResponse,
  ListMaterialsResponse,
  MaterialTypeValue,
  QuotaStatus,
  UsageRecord,
  UsageStats,
  UserTemplate,
  ArticleDraft,
  ArticleBlock,
  AIRewriteRequest,
  AIRewriteResponse
} from '../types';

const logger = loggers.api;

// API base URL
const API_BASE = process.env.TARO_APP_API_BASE_URL || 'https://www.aiwxcreator.cloud/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Re-export types
export type { 
  ApiResponse, 
  AuthResponse, 
  User, 
  GenerationRequest, 
  GenerationResult, 
  AIHelperResponse,
  SSECallbacks,
  MaterialMetadata,
  UploadResponse,
  ListMaterialsResponse,
  MaterialTypeValue,
  QuotaStatus,
  UsageRecord,
  UsageStats,
  UserTemplate,
  ArticleDraft,
  ArticleBlock,
  AIRewriteRequest,
  AIRewriteResponse
};

// Token management
export const getAccessToken = (): string => {
  try {
    return Taro.getStorageSync(ACCESS_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const getRefreshToken = (): string => {
  try {
    return Taro.getStorageSync(REFRESH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  try {
    Taro.setStorageSync(ACCESS_TOKEN_KEY, accessToken);
    Taro.setStorageSync(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // storage error
  }
};

export const clearTokens = (): void => {
  try {
    Taro.removeStorageSync(ACCESS_TOKEN_KEY);
    Taro.removeStorageSync(REFRESH_TOKEN_KEY);
  } catch {
    // storage error
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// API request helper
const request = async <T>(
  endpoint: string,
  options: Omit<Taro.request.Option, 'url'> = {}
): Promise<ApiResponse<T>> => {
  const accessToken = getAccessToken();
  
  const header: Record<string, any> = {
    'Content-Type': 'application/json',
    ...options.header,
  };
  
  if (accessToken) {
    header['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const response = await Taro.request({
      url: `${API_BASE}${endpoint}`,
      ...options,
      header,
    });
    
    // Taro returns data directly in response.data
    const data = response.data as ApiResponse<T>;
    
    // Handle token expiration
    if (response.statusCode === 401 && data.error?.code === 'INVALID_TOKEN') {
      // Try to refresh the token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request with the new token
        return request<T>(endpoint, options);
      }
      // If refresh failed, clear tokens
      clearTokens();
    }
    
    return data;
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
  // Original register/login with email (Optional for Mini Program, usually strict WeChat login)
  register: async (email: string, password: string, name: string): Promise<ApiResponse<AuthResponse>> => {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      data: { email, password, name },
    });
  },
  
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    return request<AuthResponse>('/auth/token', {
      method: 'POST',
      data: { email, password },
    });
  },

  // WeChat Login
  loginWithWeChat: async (code: string): Promise<ApiResponse<AuthResponse>> => {
      return request<AuthResponse>('/auth/wechat', {
          method: 'POST',
          data: { code }
      });
  },
  
  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await request('/auth/logout', {
        method: 'POST',
        data: { refreshToken },
      });
    }
    clearTokens();
  },
  
  getMe: async (): Promise<ApiResponse<User>> => {
    return request<User>('/auth/me');
  },
};

export const aiApi = {
  generate: async (genRequest: GenerationRequest): Promise<ApiResponse<GenerationResult>> => {
    return request<GenerationResult>('/ai/generate', {
      method: 'POST',
      data: genRequest,
    });
  },
  
  helper: async (action: string, content: string, provider?: 'deepseek' | 'qwen', options?: Record<string, unknown>): Promise<ApiResponse<AIHelperResponse>> => {
    return request<AIHelperResponse>('/ai/helper', {
      method: 'POST',
      data: { action, content, provider, options },
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
      data: { url, skipAIFill, mode },
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
      data: rewriteRequest,
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

export const streamGeneration = async (
  genRequest: GenerationRequest,
  callbacks: SSECallbacks
): Promise<void> => {
  const accessToken = getAccessToken();
  
  const header: Record<string, any> = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    header['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const requestTask = Taro.request({
      url: `${API_BASE}/ai/chat/stream`,
      method: 'POST',
      header,
      data: genRequest,
      enableChunked: true, // Enable chunked transfer
      success: (res) => {
        // This only fires when request completes
        if (res.statusCode !== 200) {
            callbacks.onError?.({ code: 'HTTP_ERROR', message: `Status ${res.statusCode}` });
        }
      },
      fail: (err) => {
        callbacks.onError?.({ code: 'REQUEST_FAILED', message: err.errMsg });
      }
    });

    // Helper to decode ArrayBuffer to String
    const arrayBufferToString = (buffer: ArrayBuffer): string => {
        // @ts-ignore
        if (typeof TextDecoder !== 'undefined') {
             // @ts-ignore
             return new TextDecoder('utf-8').decode(buffer, { stream: true });
        } else {
             // Fallback for older envs
             const uint8 = new Uint8Array(buffer);
             let str = '';
             for (let i = 0; i < uint8.length; i++) {
                 str += String.fromCharCode(uint8[i]);
             }
             // Handle utf-8 multi-byte characters (basic fallback, might be buggy for split chars)
             // Ideally use a library like 'fast-text-encoding' polyfill
             return decodeURIComponent(escape(str));
        }
    };

    let buffer = '';

    requestTask.onChunkReceived((res) => {
        const chunk = arrayBufferToString(res.data);
        buffer += chunk;
        
        const lines = buffer.split('\n');
        // Keep the last partial line in buffer
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

  } catch (error) {
    logger.error('SSE stream error:', error);
    callbacks.onError?.({ code: 'STREAM_ERROR', message: 'Connection failed' });
  }
};

export const healthApi = {
  check: async (): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
  }>> => {
    return request('/health');
  },
};

export const materialApi = {
  upload: async (data: string, filename: string, mimeType: string, type?: MaterialTypeValue): Promise<ApiResponse<UploadResponse>> => {
    return request<UploadResponse>('/materials', {
      method: 'POST',
      data: { data, filename, mimeType, type },
    });
  },
  
  list: async (type?: MaterialTypeValue, page: number = 1, limit: number = 20): Promise<ApiResponse<ListMaterialsResponse>> => {
    // Taro doesn't have URLSearchParams standard, construct query string manually or use utils
    const params = [];
    if (type) params.push(`type=${type}`);
    params.push(`page=${page}`);
    params.push(`limit=${limit}`);
    
    return request<ListMaterialsResponse>(`/materials?${params.join('&')}`);
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
      data: { filename, mimeType, size },
    });
  },
};

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

export const templateApi = {
  create: async (data: Omit<UserTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<UserTemplate>> => {
    return request<UserTemplate>('/templates', {
      method: 'POST',
      data: data,
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
      data: updates,
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
      data: { contentHtml, templateId },
    });
  },
};

export const draftApi = {
  save: async (data: Omit<ArticleDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiResponse<ArticleDraft>> => {
    return request<ArticleDraft>('/drafts', {
      method: 'POST',
      data: data,
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

export default {
  auth: authApi,
  template: templateApi,
  draft: draftApi,
  ai: aiApi,
  health: healthApi,
  material: materialApi,
  quota: quotaApi,
  streamGeneration,
  isAuthenticated,
  clearTokens,
};
