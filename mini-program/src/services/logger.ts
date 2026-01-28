import Taro from '@tarojs/taro';

/**
 * Logger Service - Unified logging mechanism for the application
 * 
 * Features:
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Module-based logging with prefixes
 * - Configurable log level filtering
 * - Timestamp support
 * - Development vs Production mode
 * - Local storage for log level persistence
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Log level names for display
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE'
};

// Emoji indicators for each log level
const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: '📘',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '🔴',
  [LogLevel.NONE]: ''
};

// Color styles for console output
const LOG_LEVEL_STYLES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'color: #888; font-style: italic;',
  [LogLevel.INFO]: 'color: #2196F3; font-weight: bold;',
  [LogLevel.WARN]: 'color: #FF9800; font-weight: bold;',
  [LogLevel.ERROR]: 'color: #F44336; font-weight: bold;',
  [LogLevel.NONE]: ''
};

// Storage key for persisting log level
const LOG_LEVEL_STORAGE_KEY = 'app_log_level';

// Detect if running in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Global log level - defaults to INFO in production, DEBUG in development
let globalLogLevel: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

// Try to load saved log level from localStorage
try {
  const savedLevel = Taro.getStorageSync(LOG_LEVEL_STORAGE_KEY);
  if (savedLevel) {
    const level = parseInt(savedLevel as string, 10);
    if (level >= LogLevel.DEBUG && level <= LogLevel.NONE) {
      globalLogLevel = level;
    }
  }
} catch {
  // localStorage not available
}

/**
 * Set the global log level
 */
export const setLogLevel = (level: LogLevel): void => {
  globalLogLevel = level;
  try {
    Taro.setStorageSync(LOG_LEVEL_STORAGE_KEY, level.toString());
  } catch {
    // localStorage not available
  }
};

/**
 * Get the current global log level
 */
export const getLogLevel = (): LogLevel => globalLogLevel;

/**
 * Get the log level name
 */
export const getLogLevelName = (level: LogLevel): string => LOG_LEVEL_NAMES[level];

/**
 * Format a timestamp for logging
 */
const formatTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 23);
};

/**
 * Core logging function
 */
const logMessage = (
  level: LogLevel,
  module: string,
  message: string,
  ...args: unknown[]
): void => {
  // Check if this log level should be displayed
  if (level < globalLogLevel) return;

  const timestamp = formatTimestamp();
  const icon = LOG_LEVEL_ICONS[level];
  const levelName = LOG_LEVEL_NAMES[level];
  const style = LOG_LEVEL_STYLES[level];

  // Format the prefix
  const prefix = `[${timestamp}] ${icon} [${module}] [${levelName}]`;

  // Choose the appropriate console method
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`%c${prefix}`, style, message, ...args);
      break;
    case LogLevel.INFO:
      console.info(`%c${prefix}`, style, message, ...args);
      break;
    case LogLevel.WARN:
      console.warn(`%c${prefix}`, style, message, ...args);
      break;
    case LogLevel.ERROR:
      console.error(`%c${prefix}`, style, message, ...args);
      break;
  }
};

/**
 * Logger interface for a specific module
 */
export interface ModuleLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  /** Log with timing measurement */
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  /** Group related logs */
  group: (label: string, collapsed?: boolean) => void;
  groupEnd: () => void;
}

// Store timing labels
const timings: Map<string, number> = new Map();

/**
 * Create a logger for a specific module
 * 
 * @param module - The module name (e.g., 'WeChat', 'Gemini', 'Editor')
 * @returns A logger object with debug, info, warn, error methods
 * 
 * @example
 * ```typescript
 * const logger = createLogger('WeChat');
 * logger.info('Requesting access token...');
 * logger.error('Failed to get token:', error);
 * ```
 */
export const createLogger = (module: string): ModuleLogger => {
  return {
    debug: (message: string, ...args: unknown[]) => 
      logMessage(LogLevel.DEBUG, module, message, ...args),
    
    info: (message: string, ...args: unknown[]) => 
      logMessage(LogLevel.INFO, module, message, ...args),
    
    warn: (message: string, ...args: unknown[]) => 
      logMessage(LogLevel.WARN, module, message, ...args),
    
    error: (message: string, ...args: unknown[]) => 
      logMessage(LogLevel.ERROR, module, message, ...args),
    
    time: (label: string) => {
      if (globalLogLevel <= LogLevel.DEBUG) {
        timings.set(`${module}:${label}`, performance.now());
      }
    },
    
    timeEnd: (label: string) => {
      if (globalLogLevel <= LogLevel.DEBUG) {
        const key = `${module}:${label}`;
        const start = timings.get(key);
        if (start !== undefined) {
          const duration = (performance.now() - start).toFixed(2);
          logMessage(LogLevel.DEBUG, module, `${label}: ${duration}ms`);
          timings.delete(key);
        }
      }
    },
    
    group: (label: string, collapsed = false) => {
      if (globalLogLevel <= LogLevel.DEBUG) {
        const prefix = `[${module}]`;
        if (collapsed) {
          console.groupCollapsed(`${prefix} ${label}`);
        } else {
          console.group(`${prefix} ${label}`);
        }
      }
    },
    
    groupEnd: () => {
      if (globalLogLevel <= LogLevel.DEBUG) {
        console.groupEnd();
      }
    }
  };
};

// Pre-configured loggers for common modules
export const loggers = {
  wechat: createLogger('WeChat'),
  gemini: createLogger('Gemini'),
  deepseek: createLogger('DeepSeek'),
  qwen: createLogger('Qwen'),
  dualAI: createLogger('DualAI'),
  backendAI: createLogger('BackendAI'),
  editor: createLogger('Editor'),
  material: createLogger('Material'),
  design: createLogger('Design'),
  app: createLogger('App'),
  api: createLogger('API')
};

// Default export for convenience
export default {
  createLogger,
  setLogLevel,
  getLogLevel,
  getLogLevelName,
  LogLevel,
  loggers
};
