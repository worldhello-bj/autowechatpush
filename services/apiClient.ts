/**
 * Backend API Client Service
 * 
 * Provides a type-safe interface to communicate with the backend API.
 * Handles authentication, token refresh, and error handling.
 */

import { loggers } from './logger';

const logger = loggers.api;

// API base URL - configurable via environment variable for production
// In development: uses Vite proxy (/api/v1 -> localhost:3001)
// In production: set VITE_API_BASE to your backend URL
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

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
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
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
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json() as ApiResponse<T>;
    
    // Handle token expiration
    if (response.status === 401 && data.error?.code === 'INVALID_TOKEN') {
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
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await response.json() as ApiResponse<{ accessToken: string; refreshToken: string }>;
    
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
}

export interface ArticleBlock {
  id: string;
  type: string;
  content: string;
  title?: string;
  style?: string;
  items?: string[];
  level?: number;
  alignment?: string;
  [key: string]: unknown;
}

export interface GenerationResult {
  title: string;
  digest: string;
  blocks: ArticleBlock[];
  sources: Array<{ title: string; uri: string }>;
}

export const aiApi = {
  generate: async (genRequest: GenerationRequest, apiKey?: string): Promise<ApiResponse<GenerationResult>> => {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    return request<GenerationResult>('/ai/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(genRequest),
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
  callbacks: SSECallbacks,
  apiKey?: string
): Promise<void> => {
  const accessToken = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  if (apiKey) {
    (headers as Record<string, string>)['X-API-Key'] = apiKey;
  }
  
  try {
    const response = await fetch(`${API_BASE}/ai/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(genRequest),
    });
    
    if (!response.ok) {
      const error = await response.json();
      callbacks.onError?.({ code: 'HTTP_ERROR', message: error.error?.message || 'Request failed' });
      return;
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError?.({ code: 'NO_READER', message: 'Could not read response' });
      return;
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages
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

export const materialApi = {
  upload: async (data: string, filename: string, mimeType: string, type?: string): Promise<ApiResponse<UploadResponse>> => {
    return request<UploadResponse>('/materials', {
      method: 'POST',
      body: JSON.stringify({ data, filename, mimeType, type }),
    });
  },
  
  list: async (type?: string, page: number = 1, limit: number = 20): Promise<ApiResponse<ListMaterialsResponse>> => {
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

export default {
  auth: authApi,
  ai: aiApi,
  health: healthApi,
  material: materialApi,
  quota: quotaApi,
  streamGeneration,
  isAuthenticated,
  clearTokens,
};
