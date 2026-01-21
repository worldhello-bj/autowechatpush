/**
 * Logger Service - Unified logging mechanism for the application
 * Adapted for Taro/WeChat Mini Program
 */
import Taro from '@tarojs/taro';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE'
};

const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: '📘',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '🔴',
  [LogLevel.NONE]: ''
};

// Console colors are supported in WeChat DevTools but not on real devices usually.
// We keep them for DevTools.
const LOG_LEVEL_STYLES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'color: #888; font-style: italic;',
  [LogLevel.INFO]: 'color: #2196F3; font-weight: bold;',
  [LogLevel.WARN]: 'color: #FF9800; font-weight: bold;',
  [LogLevel.ERROR]: 'color: #F44336; font-weight: bold;',
  [LogLevel.NONE]: ''
};

const LOG_LEVEL_STORAGE_KEY = 'app_log_level';

const isDevelopment = process.env.NODE_ENV === 'development';

let globalLogLevel: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

try {
  const savedLevel = Taro.getStorageSync(LOG_LEVEL_STORAGE_KEY);
  if (savedLevel) {
    const level = parseInt(savedLevel, 10);
    if (level >= LogLevel.DEBUG && level <= LogLevel.NONE) {
      globalLogLevel = level;
    }
  }
} catch {
  // Storage not available
}

export const setLogLevel = (level: LogLevel): void => {
  globalLogLevel = level;
  try {
    Taro.setStorageSync(LOG_LEVEL_STORAGE_KEY, level.toString());
  } catch {
    // Storage error
  }
};

export const getLogLevel = (): LogLevel => globalLogLevel;

export const getLogLevelName = (level: LogLevel): string => LOG_LEVEL_NAMES[level];

const formatTimestamp = (): string => {
  const now = new Date();
  return now.toTimeString().substring(0, 8) + '.' + now.getMilliseconds();
};

const logMessage = (
  level: LogLevel,
  module: string,
  message: string,
  ...args: unknown[]
): void => {
  if (level < globalLogLevel) return;

  const timestamp = formatTimestamp();
  const icon = LOG_LEVEL_ICONS[level];
  const levelName = LOG_LEVEL_NAMES[level];
  
  // WeChat console supports styling with %c but argument order is strict.
  // [Time] 🔍 [Module] [Level] Message
  const prefix = `[${timestamp}] ${icon} [${module}] [${levelName}]`;

  // On real device, styling might be ignored or shown as text, so we keep it simple or conditionally use it.
  // For simplicity in this port, we output standard logs.

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(prefix, message, ...args);
      break;
    case LogLevel.INFO:
      console.info(prefix, message, ...args);
      break;
    case LogLevel.WARN:
      console.warn(prefix, message, ...args);
      break;
    case LogLevel.ERROR:
      console.error(prefix, message, ...args);
      break;
  }
};

export interface ModuleLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  group: (label: string, collapsed?: boolean) => void;
  groupEnd: () => void;
}

const timings: Map<string, number> = new Map();

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
        timings.set(`${module}:${label}`, Date.now());
      }
    },
    
    timeEnd: (label: string) => {
      if (globalLogLevel <= LogLevel.DEBUG) {
        const key = `${module}:${label}`;
        const start = timings.get(key);
        if (start !== undefined) {
          const duration = (Date.now() - start);
          logMessage(LogLevel.DEBUG, module, `${label}: ${duration}ms`);
          timings.delete(key);
        }
      }
    },
    
    group: (label: string, collapsed = false) => {
      if (globalLogLevel <= LogLevel.DEBUG) {
        const prefix = `[${module}]`;
        if (console.group) {
            if (collapsed && console.groupCollapsed) {
                console.groupCollapsed(`${prefix} ${label}`);
            } else {
                console.group(`${prefix} ${label}`);
            }
        } else {
            console.log(`--- Group: ${prefix} ${label} ---`);
        }
      }
    },
    
    groupEnd: () => {
      if (globalLogLevel <= LogLevel.DEBUG) {
        if (console.groupEnd) {
            console.groupEnd();
        } else {
            console.log(`--- End Group ---`);
        }
      }
    }
  };
};

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

export default {
  createLogger,
  setLogLevel,
  getLogLevel,
  getLogLevelName,
  LogLevel,
  loggers
};
