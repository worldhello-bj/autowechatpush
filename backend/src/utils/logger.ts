// Simple logger utility
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (process.env.LOG_LEVEL?.toUpperCase() as LogLevel) || 'INFO';

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
};

const formatMessage = (level: LogLevel, module: string, message: string, data?: unknown): string => {
  const timestamp = new Date().toISOString();
  const baseMsg = `[${timestamp}] [${level}] [${module}] ${message}`;
  return data ? `${baseMsg} ${JSON.stringify(data)}` : baseMsg;
};

export const createLogger = (module: string) => ({
  debug: (message: string, data?: unknown) => {
    if (shouldLog('DEBUG')) {
      console.log(formatMessage('DEBUG', module, message, data));
    }
  },
  info: (message: string, data?: unknown) => {
    if (shouldLog('INFO')) {
      console.log(formatMessage('INFO', module, message, data));
    }
  },
  warn: (message: string, data?: unknown) => {
    if (shouldLog('WARN')) {
      console.warn(formatMessage('WARN', module, message, data));
    }
  },
  error: (message: string, data?: unknown) => {
    if (shouldLog('ERROR')) {
      console.error(formatMessage('ERROR', module, message, data));
    }
  },
});

export const logger = createLogger('app');
