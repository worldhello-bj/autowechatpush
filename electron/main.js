/**
 * Electron Main Process
 * 微信AI发布助手 - 桌面应用程序
 */
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Keep a global reference of the window object
let mainWindow = null;
let serverProcess = null;

// Environment detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = 3000;

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
      preload: path.join(__dirname, 'preload.js'),
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
    waitForServer().then(() => {
      mainWindow.loadURL(`http://localhost:${PORT}`);
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
  if (isDev) return; // Don't start server in dev mode
  
  const serverPath = path.join(process.resourcesPath, 'server.js');
  
  console.log('[Electron] Starting built-in server...');
  
  serverProcess = spawn('node', [serverPath], {
    cwd: process.resourcesPath,
    env: {
      ...process.env,
      PORT: PORT.toString(),
      NODE_ENV: 'production'
    },
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (err) => {
    console.error('[Electron] Server error:', err);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`[Electron] Server exited with code ${code}`);
  });
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
app.whenReady().then(() => {
  startServer();
  createWindow();
  
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
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
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
