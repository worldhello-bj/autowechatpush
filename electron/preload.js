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
  isElectron: true
});

// Log that preload script is loaded
console.log('[Preload] Electron preload script loaded');
