# 桌面应用程序打包说明

本文档介绍如何将微信AI发布助手打包为桌面应用程序（EXE）。

## 前提条件

1. **Node.js 18+** - 确保已安装 Node.js 18 或更高版本
2. **npm 或 yarn** - 包管理器
3. **Windows/macOS/Linux** - 支持跨平台打包

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 打包应用程序

#### Windows (EXE)
```bash
npm run electron:build:win
```

这将生成以下文件：
- `release/微信AI发布助手-1.3.0-win-x64.exe` - NSIS 安装程序
- `release/微信AI发布助手-1.3.0-win-x64-portable.exe` - 便携版（无需安装）

#### macOS (DMG)
```bash
npm run electron:build:mac
```

#### Linux (AppImage/DEB)
```bash
npm run electron:build:linux
```

## 开发模式

在开发模式下运行 Electron 应用：

```bash
npm run electron:dev
```

这将同时启动：
1. Vite 开发服务器（热重载）
2. Electron 应用程序

## 打包配置

打包配置位于 `package.json` 的 `build` 字段中：

```json
{
  "build": {
    "appId": "com.worldhello.wechat-ai-publisher",
    "productName": "微信AI发布助手",
    "win": {
      "target": ["nsis", "portable"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

## 应用图标

应用图标位于 `electron/icons/` 目录：

- `icon.ico` - Windows 图标 (256x256)
- `icon.icns` - macOS 图标
- `icon.png` - Linux 图标

### 生成图标

可以使用在线工具将 `icon.svg` 转换为各平台所需的图标格式：
- [CloudConvert](https://cloudconvert.com/svg-to-ico)
- [iConvert Icons](https://iconverticons.com/)

## 输出目录

打包后的文件位于 `release/` 目录：

```
release/
├── 微信AI发布助手-1.3.0-win-x64.exe       # Windows 安装程序
├── 微信AI发布助手-1.3.0-win-x64-portable.exe  # Windows 便携版
├── 微信AI发布助手-1.3.0.dmg               # macOS 镜像
├── 微信AI发布助手-1.3.0.AppImage          # Linux AppImage
└── 微信AI发布助手-1.3.0_amd64.deb         # Linux Debian 包
```

## 常见问题

### Q: 打包时出现 "Electron Builder" 错误？
A: 确保已安装所有依赖：`npm install`

### Q: Windows 打包需要管理员权限？
A: NSIS 安装程序可能需要管理员权限来创建快捷方式

### Q: 如何更改应用图标？
A: 替换 `electron/icons/` 目录中的图标文件

### Q: 便携版和安装版有什么区别？
A: 便携版可以直接运行，无需安装；安装版会创建快捷方式和开始菜单项

## 技术架构

```
┌─────────────────────────────────────────────┐
│           Electron Main Process             │
│  ┌───────────────────────────────────────┐  │
│  │          BrowserWindow               │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │       React Application         │  │  │
│  │  │  ┌───────────────────────────┐  │  │  │
│  │  │  │    Vite + TypeScript     │  │  │  │
│  │  │  └───────────────────────────┘  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │        Express Server (内置)          │  │
│  │  • 代理微信API请求                    │  │
│  │  • 提供静态文件                       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 更新日志

### v1.3.0
- ✅ 添加 Electron 桌面应用支持
- ✅ 支持 Windows/macOS/Linux 打包
- ✅ 内置 Express 服务器
- ✅ 中文本地化菜单
