# Electron 应用后端连接问题解决方案

## 问题描述

在 PR #31 之后，所有 AI API 调用从前端直接调用改为通过后端服务器调用。这导致 Electron 桌面应用（EXE）必须连接到后端服务器才能正常工作。

### 症状
- ✗ 打包的 EXE 应用无法生成 AI 内容
- ✗ 清除缓存后问题依然存在
- ✗ 后端服务器已更新，但 EXE 仍连接旧地址

## 根本原因

### 架构变化

**之前（PR #31 前）：**
```
前端 → 直接调用 AI API（Gemini、DeepSeek 等）
     → 不需要后端服务器
```

**现在（PR #31 后）：**
```
前端 → 后端服务器 → AI API
     → 必须连接后端才能工作
```

### 技术原因

1. **环境变量在构建时被硬编码**
   - Vite 构建时将 `import.meta.env.VITE_API_BASE` 替换为实际值
   - 这个值被直接写入编译后的 JavaScript 文件
   - 示例：`const API_BASE = "/api/v1";` 被写入 `dist/assets/index-xxx.js`

2. **EXE 包含旧的构建产物**
   - EXE 文件包含 `dist/` 目录
   - `dist/` 中的 JavaScript 已经硬编码了 API 地址
   - 无法通过清除缓存或配置文件修改

3. **缺少后端代理配置**
   - 原来的 `server.cjs` 只代理微信 API
   - 没有代理 `/api/v1` 到真正的后端服务器
   - 导致前端请求无法到达后端

## 解决方案

### 1. 添加后端 API 代理

在 `server.cjs` 中添加：

```javascript
// Backend API base URL - configurable via environment variable
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://49.232.11.108:3001';

// Proxy Configuration for Backend API
const backendApiProxy = createProxyMiddleware({
    target: BACKEND_API_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Backend Proxy] ➤ ${req.method} ${req.url} -> ${BACKEND_API_URL}${req.url}`);
    },
    // ... error handling
});

// Use Proxy
app.use('/api/v1', backendApiProxy);
```

### 2. 更新 .env.production

```env
# 使用相对路径，由 server.cjs 代理到真正的后端
VITE_API_BASE=/api/v1
```

### 3. 新的架构

```
┌─────────────────────────────────────────┐
│         Electron EXE                    │
│  ┌───────────────────────────────────┐  │
│  │  前端 (React)                     │  │
│  │  API_BASE=/api/v1                │  │
│  │  fetch("/api/v1/ai/generate")    │  │
│  └───────────────────────────────────┘  │
│               ↓                         │
│  ┌───────────────────────────────────┐  │
│  │  server.cjs (代理服务器)          │  │
│  │  localhost:3000                   │  │
│  │  /api/v1/* → BACKEND_API_URL     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
               ↓
    ┌──────────────────────┐
    │  真正的后端服务器      │
    │  http://server:3001  │
    │  • AI API           │
    │  • Material API     │
    │  • Auth API         │
    └──────────────────────┘
```

## 使用说明

### 对于开发者

**更新后端地址并重新打包：**

1. 编辑 `server.cjs` 第 68 行：
   ```javascript
   const BACKEND_API_URL = 'http://your-new-backend:3001';
   ```

2. 重新打包：
   ```bash
   npm run electron:build:win
   ```

3. 分发新的 EXE 文件

### 对于用户

**方法 1：通过环境变量（推荐）**

创建启动脚本 `start-app.bat`：
```batch
@echo off
set BACKEND_API_URL=http://your-backend-server:3001
start "" "微信AI发布助手.exe"
```

**方法 2：重新下载新版本**

如果开发者已更新后端地址并重新打包，下载最新的 EXE 即可。

## 验证方法

### 1. 检查构建产物

```bash
# 应该看到 "/api/v1"
grep -o '"/api/v1"' dist/assets/*.js
```

### 2. 检查应用日志

打开应用后，按 F12 打开开发者工具，在 Console 中应该看到：

```
[Backend Proxy] ➤ POST /api/v1/ai/generate -> http://backend:3001/api/v1/ai/generate
```

### 3. 测试 API 连接

在开发者工具的 Network 标签中，检查 API 请求：
- 请求 URL：`http://localhost:3000/api/v1/...`
- 如果成功，状态码应该是 200
- 如果失败，检查控制台错误信息

## 常见问题

### Q: 为什么之前可以，现在不行了？

A: 因为 PR #31 改变了架构。之前前端直接调用 AI API，不需要后端服务器。现在所有 AI 调用都通过后端，Electron 应用必须连接到后端服务器。

### Q: 为什么清除缓存没用？

A: 因为问题不在缓存，而在编译后的 JavaScript 文件。这些文件在构建时就确定了，必须重新构建才能更新。

### Q: 能否让 EXE 不依赖后端服务器？

A: 如果要恢复到之前的架构，需要：
1. 回退 PR #31 的更改
2. 重新在前端实现 AI API 调用
3. 用户需要自己配置 AI API Key

这会带来安全风险（API Key 暴露在客户端）和维护负担。

### Q: 后端服务器必须公网可访问吗？

A: 不一定。只要运行 EXE 的电脑能访问后端服务器即可：
- 公网部署：任何人都能使用
- 局域网部署：只有同网络的用户能使用
- 本地部署：可以在同一台电脑运行后端和前端

## 相关文件

- `server.cjs` - Electron 内置的代理服务器
- `.env.production` - 前端生产环境配置
- `.env.production.web` - Web 部署配置示例
- `BUILD.md` - 详细的构建说明
- `services/apiClient.ts` - 前端 API 客户端

## 技术细节

### Vite 环境变量替换

Vite 使用静态替换：

```typescript
// 源代码
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

// 构建后（.env.production: VITE_API_BASE=/api/v1）
const API_BASE = "/api/v1";
```

这意味着：
- ✓ 构建快速，运行时无需解析
- ✗ 无法在运行时修改
- ✗ 更改配置需要重新构建

### 代理服务器的作用

`server.cjs` 作为中间层：

1. **解耦前端和后端**
   - 前端只需要知道相对路径 `/api/v1`
   - 后端地址可以灵活配置

2. **统一入口**
   - 所有请求经过同一个端口（3000）
   - 简化 CORS 配置

3. **可配置性**
   - 通过环境变量或代码修改后端地址
   - 无需重新构建前端

## 未来改进

### 选项 1：配置文件

在 EXE 旁边放置配置文件 `config.json`：

```json
{
  "backendUrl": "http://your-backend:3001"
}
```

server.cjs 读取这个文件来配置代理。

### 选项 2：应用内设置

在应用设置界面添加后端地址配置：
- 用户可以在界面中修改后端地址
- 保存到本地配置
- server.cjs 动态读取配置

### 选项 3：自动发现

实现后端服务器自动发现机制：
- 广播/多播查找局域网内的后端
- 或从中心服务器获取后端地址列表
- 自动选择最佳后端

## 总结

这个问题是架构演进的自然结果。从前端直接调用 API 迁移到后端统一调用，提高了安全性和可维护性，但也增加了 Electron 应用对后端的依赖。

通过添加代理配置，我们保持了灵活性：
- ✓ 前端代码无需修改
- ✓ 后端地址可配置
- ✓ 支持环境变量
- ✓ 清晰的错误提示

用户只需要重新打包应用或使用环境变量即可解决问题。
