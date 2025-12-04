/**
 * Storage Service
 * 统一的数据存储服务，支持浏览器 localStorage 和 Electron 文件存储
 * 
 * - 在 Electron 环境中，数据会保存到磁盘文件
 * - 在浏览器环境中，数据会保存到 localStorage
 */

import { loggers } from './logger';

const logger = loggers.storage;

// Type declaration for Electron API exposed via preload
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getAppVersion: () => Promise<string>;
      getAppPath: () => Promise<string>;
      platform: string;
      storage: {
        save: (key: string, data: any) => Promise<{ success: boolean; error?: string }>;
        load: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
        delete: (key: string) => Promise<{ success: boolean; error?: string }>;
        list: () => Promise<{ success: boolean; keys?: string[]; error?: string }>;
      };
    };
  }
}

/**
 * Check if running in Electron environment
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.electronAPI?.isElectron === true &&
         typeof window.electronAPI?.storage?.save === 'function';
};

/**
 * Save data to storage (disk in Electron, localStorage in browser)
 * @param key - The storage key
 * @param data - The data to save (will be JSON serialized)
 */
export const saveData = async (key: string, data: any): Promise<boolean> => {
  try {
    if (isElectron()) {
      // Electron: Save to disk via IPC
      const result = await window.electronAPI!.storage.save(key, data);
      if (!result.success) {
        logger.error(`Failed to save ${key} to disk:`, result.error);
        return false;
      }
      logger.debug(`Saved ${key} to disk`);
      return true;
    } else {
      // Browser: Save to localStorage
      localStorage.setItem(key, JSON.stringify(data));
      logger.debug(`Saved ${key} to localStorage`);
      return true;
    }
  } catch (error) {
    logger.error(`Error saving ${key}:`, error);
    return false;
  }
};

/**
 * Load data from storage
 * @param key - The storage key
 * @returns The loaded data, or null if not found
 */
export const loadData = async <T = any>(key: string): Promise<T | null> => {
  try {
    if (isElectron()) {
      // Electron: Load from disk via IPC
      const result = await window.electronAPI!.storage.load(key);
      if (!result.success) {
        logger.error(`Failed to load ${key} from disk:`, result.error);
        return null;
      }
      if (result.data !== null && result.data !== undefined) {
        logger.debug(`Loaded ${key} from disk`);
      }
      return result.data as T;
    } else {
      // Browser: Load from localStorage
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw) as T;
      logger.debug(`Loaded ${key} from localStorage`);
      return data;
    }
  } catch (error) {
    logger.error(`Error loading ${key}:`, error);
    return null;
  }
};

/**
 * Delete data from storage
 * @param key - The storage key
 */
export const deleteData = async (key: string): Promise<boolean> => {
  try {
    if (isElectron()) {
      // Electron: Delete from disk via IPC
      const result = await window.electronAPI!.storage.delete(key);
      if (!result.success) {
        logger.error(`Failed to delete ${key} from disk:`, result.error);
        return false;
      }
      logger.debug(`Deleted ${key} from disk`);
      return true;
    } else {
      // Browser: Remove from localStorage
      localStorage.removeItem(key);
      logger.debug(`Deleted ${key} from localStorage`);
      return true;
    }
  } catch (error) {
    logger.error(`Error deleting ${key}:`, error);
    return false;
  }
};

/**
 * List all storage keys
 */
export const listKeys = async (): Promise<string[]> => {
  try {
    if (isElectron()) {
      // Electron: List from disk via IPC
      const result = await window.electronAPI!.storage.list();
      if (!result.success) {
        logger.error('Failed to list keys from disk:', result.error);
        return [];
      }
      return result.keys || [];
    } else {
      // Browser: List from localStorage
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    }
  } catch (error) {
    logger.error('Error listing keys:', error);
    return [];
  }
};

/**
 * Synchronous load for compatibility with existing code
 * Falls back to localStorage in all cases for sync access
 * Use loadData for async disk storage
 */
export const loadDataSync = <T = any>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.error(`Error loading ${key} sync:`, error);
    return null;
  }
};

/**
 * Synchronous save for compatibility with existing code
 * Saves to localStorage immediately, and also to disk if in Electron
 */
export const saveDataSync = (key: string, data: any): void => {
  try {
    // Always save to localStorage for sync access
    localStorage.setItem(key, JSON.stringify(data));
    
    // Also save to disk if in Electron (async, fire and forget)
    if (isElectron()) {
      window.electronAPI!.storage.save(key, data).then(result => {
        if (result.success) {
          logger.debug(`Saved ${key} to disk (async)`);
        } else {
          logger.error(`Failed to save ${key} to disk:`, result.error);
        }
      }).catch(err => {
        logger.error(`Error saving ${key} to disk:`, err);
      });
    }
  } catch (error) {
    logger.error(`Error saving ${key} sync:`, error);
  }
};

/**
 * Initialize storage by migrating localStorage data to disk in Electron
 * Call this once on app startup
 */
export const initializeStorage = async (): Promise<void> => {
  if (!isElectron()) {
    logger.info('Storage: Using localStorage (browser mode)');
    return;
  }
  
  logger.info('Storage: Initializing disk storage (Electron mode)');
  
  // List of keys to migrate from localStorage to disk
  const keysToMigrate = [
    'wechat_editor_draft',
    'wechat_creds',
    'user_profile',
    'ai_provider',
    'google_api_key',
    'deepseek_key',
    'dashscope_key',
    'deepseek_thinking_mode',
    'deepseek_thinking_rounds',
    'wechat_materials',
    'dual_ai_memory',
    'log_level'
  ];
  
  for (const key of keysToMigrate) {
    // Check if data exists in localStorage but not on disk
    const localData = localStorage.getItem(key);
    if (localData) {
      const diskResult = await window.electronAPI!.storage.load(key);
      if (diskResult.success && diskResult.data === null) {
        // Migrate to disk
        try {
          const data = JSON.parse(localData);
          await window.electronAPI!.storage.save(key, data);
          logger.info(`Migrated ${key} to disk storage`);
        } catch (e) {
          logger.error(`Failed to migrate ${key}:`, e);
        }
      }
    }
  }
  
  logger.info('Storage: Initialization complete');
};

/**
 * Load all settings from storage on app startup
 * Prefers disk storage in Electron, falls back to localStorage
 */
export const loadAllSettings = async (): Promise<{ [key: string]: any }> => {
  const settings: { [key: string]: any } = {};
  
  const keys = [
    'wechat_editor_draft',
    'wechat_creds',
    'user_profile',
    'ai_provider',
    'google_api_key',
    'deepseek_key',
    'dashscope_key',
    'deepseek_thinking_mode',
    'deepseek_thinking_rounds'
  ];
  
  for (const key of keys) {
    const data = await loadData(key);
    if (data !== null) {
      settings[key] = data;
    }
  }
  
  return settings;
};
