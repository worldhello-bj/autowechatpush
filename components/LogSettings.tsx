/**
 * Log Settings Component
 * 
 * A UI panel for configuring logging options:
 * - Log level selection (DEBUG, INFO, WARN, ERROR, NONE)
 * - View and clear console logs
 * - Module-specific log filtering (future)
 */

import React, { useState, useEffect } from 'react';
import { LogLevel, getLogLevel, setLogLevel, getLogLevelName, loggers } from '../services/logger';

interface LogSettingsProps {
  className?: string;
}

const LogSettings: React.FC<LogSettingsProps> = ({ className = '' }) => {
  const [currentLevel, setCurrentLevel] = useState<LogLevel>(getLogLevel());
  const [showTestLogs, setShowTestLogs] = useState(false);

  // Log level options with descriptions
  const logLevelOptions = [
    { 
      level: LogLevel.DEBUG, 
      name: 'DEBUG', 
      icon: '🔍', 
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      description: '显示所有日志，包括调试信息'
    },
    { 
      level: LogLevel.INFO, 
      name: 'INFO', 
      icon: '📘', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      description: '显示信息、警告和错误'
    },
    { 
      level: LogLevel.WARN, 
      name: 'WARN', 
      icon: '⚠️', 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      description: '只显示警告和错误'
    },
    { 
      level: LogLevel.ERROR, 
      name: 'ERROR', 
      icon: '🔴', 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      description: '只显示错误'
    },
    { 
      level: LogLevel.NONE, 
      name: 'NONE', 
      icon: '🔇', 
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      description: '关闭所有日志输出'
    }
  ];

  const handleLevelChange = (level: LogLevel) => {
    setLogLevel(level);
    setCurrentLevel(level);
    
    // Log the change at INFO level (will show if new level allows it)
    if (level <= LogLevel.INFO) {
      loggers.app.info(`Log level changed to ${getLogLevelName(level)}`);
    }
  };

  const handleTestLogs = () => {
    setShowTestLogs(true);
    
    // Generate test logs at all levels
    loggers.app.debug('This is a DEBUG level test log');
    loggers.app.info('This is an INFO level test log');
    loggers.app.warn('This is a WARN level test log');
    loggers.app.error('This is an ERROR level test log');
    
    // Show timing test
    loggers.app.time('Test Operation');
    setTimeout(() => {
      loggers.app.timeEnd('Test Operation');
    }, 100);

    setTimeout(() => setShowTestLogs(false), 2000);
  };

  const handleClearConsole = () => {
    console.clear();
    loggers.app.info('Console cleared');
  };

  const currentOption = logLevelOptions.find(opt => opt.level === currentLevel);

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="material-icons text-gray-400">terminal</span> 
        日志设置
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Developer</span>
      </h3>
      
      {/* Current Log Level Display */}
      <div className={`mb-6 p-4 rounded-lg border ${currentOption?.bgColor} ${currentOption?.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentOption?.icon}</span>
            <div>
              <div className={`font-bold ${currentOption?.color}`}>
                当前日志级别: {currentOption?.name}
              </div>
              <div className="text-sm text-gray-500">{currentOption?.description}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Level Selection */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">选择日志级别</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {logLevelOptions.map((option) => (
            <label
              key={option.level}
              className={`
                flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                ${currentLevel === option.level 
                  ? `${option.borderColor} ${option.bgColor} ring-2 ring-offset-1 ring-${option.color.replace('text-', '')}`
                  : 'border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="radio"
                name="logLevel"
                value={option.level}
                checked={currentLevel === option.level}
                onChange={() => handleLevelChange(option.level)}
                className="sr-only"
              />
              <span className="text-xl">{option.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${option.color}`}>{option.name}</div>
                <div className="text-xs text-gray-500 truncate">{option.description}</div>
              </div>
              {currentLevel === option.level && (
                <span className="material-icons text-green-500 text-lg">check_circle</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Log Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={handleTestLogs}
          disabled={showTestLogs}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
            ${showTestLogs 
              ? 'bg-green-100 text-green-700 cursor-not-allowed' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <span className="material-icons text-sm">science</span>
          {showTestLogs ? '已发送测试日志' : '发送测试日志'}
        </button>
        
        <button
          onClick={handleClearConsole}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
        >
          <span className="material-icons text-sm">clear_all</span>
          清空控制台
        </button>
        
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset to default log level?')) {
              const defaultLevel = window.location.hostname === 'localhost' ? LogLevel.DEBUG : LogLevel.INFO;
              handleLevelChange(defaultLevel);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
        >
          <span className="material-icons text-sm">restart_alt</span>
          恢复默认
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="material-icons text-blue-500 mt-0.5">info</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">日志使用说明</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>日志输出在浏览器开发者工具的Console面板中查看</li>
              <li>按 <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">F12</kbd> 或 <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Shift+I</kbd> 打开开发者工具</li>
              <li>日志级别设置会自动保存到本地存储</li>
              <li>生产环境建议使用 INFO 或更高级别</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogSettings;
