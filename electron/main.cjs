/**
 * Electron Main Process
 * 微信AI发布助手 - 桌面应用程序
 */
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Keep a global reference of the window object
let mainWindow = null;

// Environment detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = 3000;

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

/**
 * Setup auto-updater event handlers
 */
function setupAutoUpdater() {
  // Only check for updates in production
  if (isDev) {
    console.log('[AutoUpdater] Skipping auto-update check in development mode');
    return;
  }

  // Check for updates on app ready
  autoUpdater.checkForUpdates().catch((err) => {
    console.log('[AutoUpdater] Failed to check for updates:', err.message);
  });

  // Update available
  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    }
  });

  // Update not available
  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] Current version is up to date:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', {
        version: info.version,
      });
    }
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    console.log(`[AutoUpdater] Download progress: ${progress.percent.toFixed(2)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    }
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
      });
    }
  });

  // Error
  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err.message);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', {
        message: err.message,
      });
    }
  });
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: '微信AI发布助手',
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    },
    show: false, // Don't show until ready
    backgroundColor: '#f9fafb'
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built-in server
    waitForServer()
      .then(() => {
        mainWindow.loadURL(`http://localhost:${PORT}`);
      })
      .catch((err) => {
        console.error('[Electron] Server wait failed:', err);
        // Show error dialog to help with debugging
        dialog.showErrorBox('连接失败', '无法连接到后端服务，请检查日志。\n\n错误信息: ' + err.message);
      });
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

/**
 * Wait for the server to be ready
 */
function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    
    const checkServer = (attempt) => {
      const req = http.get(`http://localhost:${PORT}`, (res) => {
        resolve();
      });
      
      req.on('error', () => {
        if (attempt < retries) {
          setTimeout(() => checkServer(attempt + 1), 500);
        } else {
          reject(new Error('Server did not start in time'));
        }
      });
      
      req.setTimeout(1000);
    };
    
    checkServer(0);
  });
}

/**
 * Start the built-in Express server
 */
function startServer() {
  if (isDev) return Promise.resolve(); // Don't start server in dev mode
  
  console.log('[Electron] Starting built-in server internally...');
  
  try {
    // Directly require and start the server using Electron's built-in Node.js
    // In production, server.cjs is bundled in app.asar at the app root level
    const serverPath = path.join(__dirname, '..', 'server.cjs');
    
    console.log('[Electron] Loading server from:', serverPath);
    const serverModule = require(serverPath);
    
    // Start the server and return the promise
    return serverModule.startServer().then(() => {
      console.log('[Electron] Internal server started successfully');
    }).catch((err) => {
      console.error('[Electron] Failed to start internal server:', err);
      dialog.showErrorBox('启动错误', '无法启动内置服务器: ' + err.message);
      throw err; // Re-throw to propagate the error
    });
  } catch (err) {
    console.error('[Electron] Failed to load server module:', err);
    dialog.showErrorBox('启动错误', '无法加载内置服务器模块: ' + err.message);
    return Promise.reject(err);
  }
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '微信AI发布助手',
              detail: `版本: ${app.getVersion()}\n\n一款智能微信公众号文章生成与发布工具。\n\n功能特点:\n• AI生成文章内容\n• 35+ SVG预设组件\n• 素材库管理\n• 一键发布到微信`
            });
          }
        },
        {
          label: '检查更新',
          click: () => {
            shell.openExternal('https://github.com/worldhello-bj/autowechatpush/releases');
          }
        },
        { type: 'separator' },
        {
          label: 'GitHub',
          click: () => {
            shell.openExternal('https://github.com/worldhello-bj/autowechatpush');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App ready
app.whenReady().then(async () => {
  await startServer();
  createWindow();
  setupAutoUpdater();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up before quit
app.on('before-quit', () => {
  // Server cleanup is handled automatically when the app exits
  // since it's running in the same process
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// IPC handlers for renderer process communication
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Auto-update IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { success: false, message: 'Updates are disabled in development mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  if (isDev) {
    return { success: false, message: 'Updates are disabled in development mode' };
  }
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('install-update', () => {
  if (isDev) {
    return { success: false, message: 'Updates are disabled in development mode' };
  }
  autoUpdater.quitAndInstall();
  return { success: true };
});
