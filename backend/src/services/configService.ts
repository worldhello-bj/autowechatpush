import { createLogger } from '../utils/index.js';

const logger = createLogger('config-service');

// API Configuration types
export interface ApiConfig {
  wechatAppId: string;
  wechatAppSecret: string;
  googleApiKey: string;
  deepSeekApiKey: string;
  dashScopeApiKey: string;
  updatedAt: Date;
  updatedBy: string;
}

// In-memory storage for API configurations (singleton - shared across all users)
// In production, this should be stored in a database with encryption
let apiConfig: ApiConfig = {
  wechatAppId: '',
  wechatAppSecret: '',
  googleApiKey: '',
  deepSeekApiKey: '',
  dashScopeApiKey: '',
  updatedAt: new Date(),
  updatedBy: 'system',
};

/**
 * Get API configuration (admin only - full access)
 */
export const getApiConfig = (): ApiConfig => {
  return { ...apiConfig };
};

/**
 * Get API configuration for users (masked secrets)
 * Only returns whether keys are configured, not the actual values
 */
export const getApiConfigStatus = (): {
  wechatConfigured: boolean;
  googleConfigured: boolean;
  deepSeekConfigured: boolean;
  dashScopeConfigured: boolean;
  updatedAt: Date;
} => {
  return {
    wechatConfigured: !!(apiConfig.wechatAppId && apiConfig.wechatAppSecret),
    googleConfigured: !!apiConfig.googleApiKey,
    deepSeekConfigured: !!apiConfig.deepSeekApiKey,
    dashScopeConfigured: !!apiConfig.dashScopeApiKey,
    updatedAt: apiConfig.updatedAt,
  };
};

/**
 * Get specific API key for internal use (e.g., AI generation)
 */
export const getApiKey = (keyType: 'google' | 'deepseek' | 'dashscope' | 'wechat'): string | { appId: string; appSecret: string } | null => {
  switch (keyType) {
    case 'google':
      return apiConfig.googleApiKey || null;
    case 'deepseek':
      return apiConfig.deepSeekApiKey || null;
    case 'dashscope':
      return apiConfig.dashScopeApiKey || null;
    case 'wechat':
      if (apiConfig.wechatAppId && apiConfig.wechatAppSecret) {
        return { appId: apiConfig.wechatAppId, appSecret: apiConfig.wechatAppSecret };
      }
      return null;
    default:
      return null;
  }
};

/**
 * Update API configuration (admin only)
 */
export const updateApiConfig = (
  updates: Partial<Omit<ApiConfig, 'updatedAt' | 'updatedBy'>>,
  adminUserId: string
): ApiConfig => {
  logger.info('Updating API configuration', { 
    adminUserId, 
    keysUpdated: Object.keys(updates).filter(k => updates[k as keyof typeof updates]) 
  });
  
  apiConfig = {
    ...apiConfig,
    ...updates,
    updatedAt: new Date(),
    updatedBy: adminUserId,
  };
  
  return { ...apiConfig };
};

/**
 * Clear a specific API key (admin only)
 */
export const clearApiKey = (
  keyType: 'wechatAppId' | 'wechatAppSecret' | 'googleApiKey' | 'deepSeekApiKey' | 'dashScopeApiKey',
  adminUserId: string
): ApiConfig => {
  logger.info('Clearing API key', { adminUserId, keyType });
  
  apiConfig = {
    ...apiConfig,
    [keyType]: '',
    updatedAt: new Date(),
    updatedBy: adminUserId,
  };
  
  return { ...apiConfig };
};

/**
 * Initialize API configuration from environment variables (for server startup)
 */
export const initApiConfigFromEnv = (): void => {
  const envConfig: Partial<ApiConfig> = {};
  
  if (process.env.WECHAT_APP_ID) {
    envConfig.wechatAppId = process.env.WECHAT_APP_ID;
  }
  if (process.env.WECHAT_APP_SECRET) {
    envConfig.wechatAppSecret = process.env.WECHAT_APP_SECRET;
  }
  if (process.env.GOOGLE_API_KEY) {
    envConfig.googleApiKey = process.env.GOOGLE_API_KEY;
  }
  if (process.env.DEEPSEEK_API_KEY) {
    envConfig.deepSeekApiKey = process.env.DEEPSEEK_API_KEY;
  }
  if (process.env.DASHSCOPE_API_KEY) {
    envConfig.dashScopeApiKey = process.env.DASHSCOPE_API_KEY;
  }
  
  if (Object.keys(envConfig).length > 0) {
    apiConfig = {
      ...apiConfig,
      ...envConfig,
      updatedAt: new Date(),
      updatedBy: 'environment',
    };
    logger.info('API configuration initialized from environment variables', {
      keysConfigured: Object.keys(envConfig),
    });
  }
};
