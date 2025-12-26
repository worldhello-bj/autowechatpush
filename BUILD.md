# 桌面应用程序打包说明

本文档介绍如何将微信AI发布助手打包为桌面应用程序（EXE）。

# 桌面应用程序打包说明

本文档介绍如何将微信AI发布助手打包为桌面应用程序（EXE）。

## ⚠️ 重要提示：后端服务器配置

**统一架构 - 简单配置**

```
前端 (Electron/Web) → 直接连接 → 后端服务器
```

**核心配置：`.env.production`**

只需要配置一个文件，无论是 Electron 还是网页部署都使用相同配置：

```env
# 修改这个地址为你的后端服务器
VITE_API_BASE=http://49.232.11.108:3001/api/v1
```

**✅ 好处：**
- 配置简单，只有一个地方需要修改
- Electron 和网页使用相同的配置
- 后端地址更新后，重新构建即可

**⚠️ 注意：**
- 后端地址在构建时被写入代码，无法运行时修改
- 如果后端地址改变，需要重新构建并分发新版本
- 确保使用公网 IP 或域名，不要用 `localhost`

## 前提条件

1. **Node.js 18+** - 确保已安装 Node.js 18 或更高版本
2. **npm 或 yarn** - 包管理器
3. **Windows/macOS/Linux** - 支持跨平台打包
4. **后端服务器已部署** - 确保后端 API 服务器正在运行并可访问

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置后端服务器地址

编辑 `server.cjs`，更新第 68 行的 `BACKEND_API_URL`：

```javascript
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://your-backend-server:3001';
```

### 3. 打包应用程序

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

**注意：** 开发模式使用 Vite 的开发服务器，已配置代理到 `localhost:3001` 的后端。

## 环境配置详解

### `.env.production` - Electron 应用配置

```env
# Electron 应用使用相对路径，由 server.cjs 代理到真正的后端
VITE_API_BASE=/api/v1
```

### `.env.production.web` - Web 部署配置（可选）

如果需要部署为 Web 应用（不是 Electron），使用这个配置：

```env
# 直接连接到后端服务器
VITE_API_BASE=http://your-backend-server:3001/api/v1
```

部署 Web 版本时：
```bash
# 1. 使用 Web 配置
cp .env.production.web .env.production

# 2. 构建
npm run build

# 3. 部署 dist/ 目录
```

### 为什么需要 server.cjs 代理？

**问题背景：**
- 前端构建时，`VITE_API_BASE` 会被硬编码到 JavaScript 文件中
- 如果直接使用后端服务器地址，更新后端地址需要重新构建前端
- Electron 应用需要在用户电脑上运行，无法预知网络环境

**解决方案：**
- 前端使用相对路径 `/api/v1`
- `server.cjs` 在 Electron 应用中作为代理服务器运行
- 只需要在 `server.cjs` 中配置后端地址
- 用户可以根据需要修改 `BACKEND_API_URL` 环境变量

## 技术架构

```
┌──────────────────────────────────────────────────────┐
│              Electron Main Process                   │
│  ┌────────────────────────────────────────────────┐  │
│  │           BrowserWindow                        │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │       React Application                  │  │  │
│  │  │  API_BASE=/api/v1                       │  │  │
│  │  │  ↓                                       │  │  │
│  │  │  fetch('http://localhost:3000/api/v1')  │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
│                    ↓                                 │
│  ┌────────────────────────────────────────────────┐  │
│  │     server.cjs (Express Proxy Server)         │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  监听 localhost:3000                    │  │  │
│  │  │  代理 /api/v1/* → BACKEND_API_URL      │  │  │
│  │  │  代理 /api/wechat/* → api.weixin.qq.com│  │  │
│  │  │  提供静态文件服务 (dist/)               │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   后端 API 服务器     │
        │  http://backend:3001 │
        │  • AI 生成 API       │
        │  • 素材管理 API      │
        │  • 用户认证 API      │
        └──────────────────────┘
```

**工作流程：**
1. 用户在前端界面操作
2. React 应用发送请求到 `/api/v1/...`
3. 请求到达 `http://localhost:3000/api/v1/...`
4. `server.cjs` 将请求代理到真实后端服务器
5. 后端处理请求并返回结果
6. 结果通过代理返回给前端

## 打包配置

打包配置位于 `package.json` 的 `build` 字段中：

```json
{
  "build": {
    "appId": "com.worldhello.wechat-ai-publisher",
    "productName": "微信AI发布助手",
    "files": [
      "dist/**/*",
      "electron/**/*",
      "server.cjs",
      "package.json"
    ],
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

**打包内容：**
- `dist/` - 前端构建产物
- `electron/` - Electron 主进程文件
- `server.cjs` - 内置代理服务器
- `package.json` - 应用元数据

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

### Q: 其他设备上的 app 能正常连接到服务器吗？

A: **取决于你的 `BACKEND_API_URL` 配置：**

| 配置 | 本机访问 | 其他设备访问 | 适用场景 |
|------|---------|-------------|---------|
| `http://49.232.11.108:3001` | ✅ | ✅ | **生产环境（推荐）** |
| `https://api.your-domain.com` | ✅ | ✅ | **生产环境（推荐）** |
| `http://192.168.1.100:3001` | ✅ | ⚠️ 仅同局域网 | 内网部署 |
| `http://localhost:3001` | ✅ | ❌ | 仅本地开发 |
| `http://127.0.0.1:3001` | ✅ | ❌ | 仅本地开发 |

**验证方法：**

1. 在其他设备上安装并运行 EXE
2. 按 F12 打开开发者工具
3. 查看 Console 标签，应该看到：
   ```
   [Server] Backend API URL: http://49.232.11.108:3001
   ```
4. 尝试生成 AI 内容，检查 Network 标签的请求

**如果其他设备无法连接：**

1. 检查 `server.cjs` 中的 `BACKEND_API_URL` 是否使用了 `localhost`
2. 改为公网 IP 或域名
3. 重新打包：`npm run electron:build:win`

### Q: EXE 应用连接的是旧的后端地址，怎么办？

A: 这是因为后端地址配置在 `server.cjs` 中。解决方法：

1. **方法一：修改 server.cjs 并重新打包**
   ```javascript
   // 编辑 server.cjs 第 68 行
   const BACKEND_API_URL = 'http://new-backend-server:3001';
   ```
   然后重新打包：
   ```bash
   npm run electron:build:win
   ```

2. **方法二：使用环境变量（用户可修改）**
   
   用户可以通过设置环境变量来修改后端地址：
   ```bash
   # Windows (在启动应用前设置)
   set BACKEND_API_URL=http://new-backend-server:3001
   
   # 或创建启动脚本 start-app.bat
   @echo off
   set BACKEND_API_URL=http://new-backend-server:3001
   start "" "微信AI发布助手.exe"
   ```

### Q: 为什么清除缓存没有用？

A: 因为问题不在前端的缓存，而在 `server.cjs` 的配置。`server.cjs` 包含在 EXE 中，需要重新打包才能更新后端地址。

### Q: 如何验证应用连接的后端地址？

A: 
1. 打开应用的开发者工具（菜单 → 视图 → 开发者工具，或按 F12）
2. 查看 Console 标签，应该能看到类似的日志：
   ```
   [Backend Proxy] ➤ Outgoing Request: POST /api/v1/ai/generate -> http://backend:3001/api/v1/ai/generate
   ```
3. 检查 Network 标签中的 API 请求

### Q: 后端服务器无法访问怎么办？

A: 检查以下几点：
1. 后端服务器是否正在运行
2. 网络连接是否正常
3. 防火墙是否允许访问后端端口
4. `server.cjs` 中的 `BACKEND_API_URL` 是否正确

查看 Electron 应用的控制台日志，会显示详细的错误信息。

### Q: 能否让用户在应用中配置后端地址？

A: 可以。需要做以下修改：
1. 在应用设置界面添加后端地址配置选项
2. 将配置保存到本地存储（如 localStorage 或配置文件）
3. 修改 `server.cjs` 读取配置并动态更新代理目标

这需要额外的开发工作，当前版本需要在打包时或通过环境变量配置。

### Q: 出现 "require is not defined in ES module scope" 错误？

A: 确保 Electron 文件使用 `.cjs` 扩展名。本项目使用 ES modules (`"type": "module"`)，但 Electron 主进程需要 CommonJS。

### Q: 打包时出现 "Electron Builder" 错误？

A: 确保已安装所有依赖：`npm install`

### Q: Windows 打包需要管理员权限？

A: NSIS 安装程序可能需要管理员权限来创建快捷方式

### Q: 便携版和安装版有什么区别？

A: 便携版可以直接运行，无需安装；安装版会创建快捷方式和开始菜单项

## 构建流程说明

运行 `npm run electron:build:win` 时的完整流程：

```bash
1. npm run build
   ├─ tsc (TypeScript 编译)
   └─ vite build
      ├─ 读取 .env.production (VITE_API_BASE=/api/v1)
      ├─ 将环境变量硬编码到 JavaScript
      └─ 生成 dist/ 目录

2. electron-builder --win
   ├─ 打包 dist/ 目录
   ├─ 打包 electron/ 目录
   ├─ 打包 server.cjs (包含 BACKEND_API_URL 配置)
   ├─ 打包 package.json
   └─ 生成 EXE 安装程序
```

**关键点：**
- `.env.production` 只影响前端使用的 API 路径（应该是 `/api/v1`）
- `server.cjs` 中的 `BACKEND_API_URL` 决定真正的后端服务器地址
- 两者配合工作：前端 → 本地代理 → 远程后端

## 部署检查清单

打包 Electron 应用前，请确认：

- [ ] 后端服务器已部署并正常运行
- [ ] 已在 `server.cjs` 中配置正确的 `BACKEND_API_URL`
- [ ] 已测试后端 API 的可访问性
- [ ] `.env.production` 使用 `/api/v1`（相对路径）
- [ ] 已安装所有依赖 (`npm install`)
- [ ] 已完成前端构建测试 (`npm run build`)

## 更新日志

### v1.3.1
- ✅ 修复 Electron 应用后端地址配置问题
- ✅ 在 `server.cjs` 中添加 `/api/v1` 代理配置
- ✅ 添加 `BACKEND_API_URL` 环境变量支持
- ✅ 更新文档说明架构和配置方法

### v1.3.0
- ✅ 添加 Electron 桌面应用支持
- ✅ 支持 Windows/macOS/Linux 打包
- ✅ 内置 Express 服务器
- ✅ 中文本地化菜单

