import { createLogger } from '../utils/index.js';

const logger = createLogger('config-service');

// API Configuration types
export interface ApiConfig {
  deepSeekApiKey: string;
  dashScopeApiKey: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * In-memory storage for API configurations (singleton - shared across all users)
 * 
 * SECURITY NOTE: This is a demo implementation using in-memory storage.
 * In production, API keys should be:
 * 1. Stored in a secure database with encryption at rest
 * 2. Encrypted using a key derivation function (e.g., PBKDF2, Argon2)
 * 3. Accessed through a secure key management service (e.g., AWS Secrets Manager, HashiCorp Vault)
 * 4. Never logged in plain text
 */
let apiConfig: ApiConfig = {
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
  deepSeekConfigured: boolean;
  dashScopeConfigured: boolean;
  updatedAt: Date;
} => {
  return {
    deepSeekConfigured: !!apiConfig.deepSeekApiKey,
    dashScopeConfigured: !!apiConfig.dashScopeApiKey,
    updatedAt: apiConfig.updatedAt,
  };
};

/**
 * Get specific API key for internal use (e.g., AI generation)
 */
export const getApiKey = (keyType: 'deepseek' | 'dashscope'): string | null => {
  switch (keyType) {
    case 'deepseek':
      return apiConfig.deepSeekApiKey || null;
    case 'dashscope':
      return apiConfig.dashScopeApiKey || null;
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
  keyType: 'deepSeekApiKey' | 'dashScopeApiKey',
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
