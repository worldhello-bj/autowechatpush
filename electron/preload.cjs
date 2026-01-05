/**
 * Electron Preload Script
 * 提供安全的API给渲染进程
 */
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Get app data path
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Platform detection
  platform: process.platform,
  
  // Check if running in Electron
  isElectron: true,
  
  // Auto-update APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Update event listeners
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, data) => callback(data));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (event, data) => callback(data));
  },
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (event, data) => callback(data));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, data) => callback(data));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, data) => callback(data));
  },
});

// Log that preload script is loaded
console.log('[Preload] Electron preload script loaded');
