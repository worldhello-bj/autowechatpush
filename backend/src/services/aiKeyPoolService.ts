import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/index.js';
import { AIProvider, AIKeyConfig, AIKeyPoolConfig, KeyUsageStats } from '../types/index.js';
import { config } from '../config/index.js';

const logger = createLogger('ai-key-pool');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to check for the key pool configuration file (in priority order)
// 1. Source config directory (for development: src/config/aikeys.json)
// 2. Project root config (for deployment: ../config/aikeys.json relative to backend)
// 3. Dist config directory (for compiled code: dist/config/aikeys.json)
const KEY_POOL_PATHS = [
  path.join(process.cwd(), 'src', 'config', 'aikeys.json'),
  path.join(__dirname, '../../config/aikeys.json'),
  path.join(__dirname, '../config/aikeys.json'),
];

const KEY_POOL_EXAMPLE_PATH = path.join(__dirname, '../config/aikeys.example.json');

// In-memory key pool and usage statistics
let keyPool: AIKeyPoolConfig = {
  deepseek: [],
  qwen: [],
};

// Track usage statistics for each key
const keyUsageMap = new Map<string, KeyUsageStats>();

// Track initialization status
let initializationError: Error | null = null;

/**
 * Initialize key usage stats for a key
 */
const initKeyStats = (key: string): KeyUsageStats => {
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    currentConcurrent: 0,
  };
};

/**
 * Mask an API key for security (show only first and last 4 characters)
 */
const maskApiKey = (key: string): string => {
  return key.length > 8 
    ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
    : '****';
};

/**
 * Find and return the first existing key pool file path
 */
const findKeyPoolPath = async (): Promise<string | null> => {
  for (const filePath of KEY_POOL_PATHS) {
    try {
      await fs.access(filePath);
      logger.info('Found key pool file', { path: filePath });
      return filePath;
    } catch {
      // File doesn't exist, try next path
    }
  }
  return null;
};

/**
 * Load key pool from JSON file
 */
export const loadKeyPool = async (): Promise<void> => {
  try {
    // Find the key pool file from multiple possible locations
    const keyPoolPath = await findKeyPoolPath();
    
    if (!keyPoolPath) {
      logger.warn('Key pool file not found in any location, using environment variables as fallback', {
        searchedPaths: KEY_POOL_PATHS,
      });
      // Create empty pool, will fall back to environment variables
      keyPool = {
        deepseek: [],
        qwen: [],
      };
      return;
    }
    
    // Try to load the actual key pool file
    const data = await fs.readFile(keyPoolPath, 'utf-8');
    keyPool = JSON.parse(data) as AIKeyPoolConfig;
    
    // Initialize usage stats for all keys
    [...keyPool.deepseek, ...keyPool.qwen].forEach((keyConfig) => {
      if (!keyUsageMap.has(keyConfig.key)) {
        keyUsageMap.set(keyConfig.key, initKeyStats(keyConfig.key));
      }
    });
    
    logger.info('Key pool loaded successfully', {
      path: keyPoolPath,
      deepseekKeys: keyPool.deepseek.length,
      qwenKeys: keyPool.qwen.length,
    });
  } catch (error) {
    logger.error('Failed to load key pool', { error });
    // Don't throw, fall back to environment variables
    keyPool = {
      deepseek: [],
      qwen: [],
    };
  }
};

/**
 * Save key pool to JSON file
 */
export const saveKeyPool = async (): Promise<void> => {
  try {
    // Find existing key pool path or use the first priority path
    let savePath = await findKeyPoolPath();
    if (!savePath) {
      // If no existing file, save to backend/src/config/aikeys.json (first priority)
      savePath = KEY_POOL_PATHS[0];
    }
    
    // Ensure config directory exists
    const configDir = path.dirname(savePath);
    await fs.mkdir(configDir, { recursive: true });
    
    // Write the key pool to file
    await fs.writeFile(savePath, JSON.stringify(keyPool, null, 2), 'utf-8');
    logger.info('Key pool saved successfully', { path: savePath });
  } catch (error) {
    logger.error('Failed to save key pool', { error });
    throw error;
  }
};

/**
 * Reload key pool from file (hot reload)
 */
export const reloadKeyPool = async (): Promise<void> => {
  logger.info('Reloading key pool from file');
  await loadKeyPool();
};

/**
 * Get available keys for a provider with least concurrent usage (round-robin with load balancing)
 */
const getAvailableKey = (provider: AIProvider): AIKeyConfig | null => {
  const providerKey = provider === AIProvider.DEEPSEEK ? 'deepseek' : 'qwen';
  const keys = keyPool[providerKey].filter((k) => k.enabled);
  
  if (keys.length === 0) {
    return null;
  }
  
  // Sort by current concurrent usage (ascending) and weight (descending)
  const sortedKeys = keys
    .map((keyConfig) => {
      const stats = keyUsageMap.get(keyConfig.key) || initKeyStats(keyConfig.key);
      return { keyConfig, stats };
    })
    .filter(({ keyConfig, stats }) => {
      // Filter out keys that are at max concurrent limit
      if (keyConfig.maxConcurrent && stats.currentConcurrent >= keyConfig.maxConcurrent) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Primary sort: by concurrent usage (lower is better)
      if (a.stats.currentConcurrent !== b.stats.currentConcurrent) {
        return a.stats.currentConcurrent - b.stats.currentConcurrent;
      }
      // Secondary sort: by weight (higher is better)
      const weightA = a.keyConfig.weight || 100;
      const weightB = b.keyConfig.weight || 100;
      return weightB - weightA;
    });
  
  if (sortedKeys.length === 0) {
    logger.warn('All keys are at max concurrent limit', { provider });
    return null;
  }
  
  return sortedKeys[0].keyConfig;
};

/**
 * Get fallback API key from environment variables
 */
const getFallbackKey = (provider: AIProvider): string => {
  const providerConfig: Record<AIProvider, { envKey?: string; name: string }> = {
    [AIProvider.DEEPSEEK]: { envKey: config.DEEPSEEK_API_KEY, name: 'DeepSeek' },
    [AIProvider.QWEN]: { envKey: config.DASHSCOPE_API_KEY, name: 'Qwen' },
  };
  
  const { envKey, name } = providerConfig[provider];
  if (!envKey) {
    throw new Error(`${name} API key not found in pool or environment`);
  }
  return envKey;
};

/**
 * Check if a key is from the pool (as opposed to user-provided or environment fallback)
 */
const isPoolKey = (key: string): boolean => {
  return keyUsageMap.has(key);
};

/**
 * Get an API key for the specified provider from the pool
 * Returns key from pool or falls back to environment variable
 * All API keys are now managed exclusively by the backend pool
 */
export const getApiKeyFromPool = async (provider: AIProvider): Promise<string> => {
  // Try to get key from pool
  const keyConfig = getAvailableKey(provider);
  
  if (keyConfig) {
    const stats = keyUsageMap.get(keyConfig.key) || initKeyStats(keyConfig.key);
    stats.currentConcurrent++;
    stats.totalRequests++;
    stats.lastUsed = Date.now();
    keyUsageMap.set(keyConfig.key, stats);
    
    logger.debug('Using key from pool', {
      provider,
      keyName: keyConfig.name || 'unnamed',
      concurrent: stats.currentConcurrent,
    });
    
    return keyConfig.key;
  }
  
  // Fall back to environment variables
  logger.debug('No keys available in pool, using environment variable', { provider });
  return getFallbackKey(provider);
};

/**
 * Release an API key after use (decrement concurrent counter)
 * Only processes keys that are in the pool to avoid incorrect statistics
 * 
 * NOTE: The concurrent counter operations are not atomic. In extremely high-concurrency
 * scenarios (thousands of requests per second), there's a theoretical race condition risk.
 * For production use with such high load, consider using atomic operations or a
 * distributed lock mechanism. For typical API usage patterns, this implementation is sufficient.
 */
export const releaseApiKey = (key: string, success: boolean, error?: string): void => {
  // Only track stats for keys that are in the pool
  if (!isPoolKey(key)) {
    return;
  }
  
  const stats = keyUsageMap.get(key);
  if (stats) {
    stats.currentConcurrent = Math.max(0, stats.currentConcurrent - 1);
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
      stats.lastError = error;
    }
    keyUsageMap.set(key, stats);
    
    logger.debug('Released API key', {
      concurrent: stats.currentConcurrent,
      success,
    });
  }
};

/**
 * Get key pool statistics
 */
export const getKeyPoolStats = (): Record<string, KeyUsageStats> => {
  const stats: Record<string, KeyUsageStats> = {};
  keyUsageMap.forEach((value, key) => {
    stats[maskApiKey(key)] = value;
  });
  return stats;
};

/**
 * Get current key pool configuration (for admin purposes)
 */
export const getKeyPoolConfig = (): AIKeyPoolConfig => {
  // Return a copy with masked keys
  return {
    deepseek: keyPool.deepseek.map((k) => ({
      ...k,
      key: maskApiKey(k.key),
    })),
    qwen: keyPool.qwen.map((k) => ({
      ...k,
      key: maskApiKey(k.key),
    })),
  };
};

/**
 * Check if Qwen features are available (image analysis and TTS)
 * Returns true if there are Qwen keys configured in the pool or environment
 */
export const isQwenAvailable = (): boolean => {
  // Check if there are keys in the pool
  if (keyPool.qwen && keyPool.qwen.length > 0) {
    return true;
  }
  
  // Check if there's a fallback environment variable
  const envKey = config.DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY;
  return !!envKey;
};

/**
 * Update key pool configuration (for admin purposes)
 */
export const updateKeyPoolConfig = async (newConfig: AIKeyPoolConfig): Promise<void> => {
  keyPool = newConfig;
  await saveKeyPool();
  
  // Initialize stats for new keys
  [...keyPool.deepseek, ...keyPool.qwen].forEach((keyConfig) => {
    if (!keyUsageMap.has(keyConfig.key)) {
      keyUsageMap.set(keyConfig.key, initKeyStats(keyConfig.key));
    }
  });
  
  logger.info('Key pool configuration updated', {
    deepseekKeys: keyPool.deepseek.length,
    qwenKeys: keyPool.qwen.length,
  });
};

// Initialize key pool on module load
loadKeyPool().catch((error) => {
  initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
  logger.error('Failed to initialize key pool', { error: initializationError.message });
  // Don't throw - allow module to load but operations will use fallback
});
