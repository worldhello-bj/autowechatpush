# 域名配置指南

## 当前配置（使用 IP 地址）

```env
VITE_API_BASE=http://49.232.11.108:3001/api/v1
```

## 添加域名后的配置

### 步骤 1：配置域名

假设你的域名是 `api.example.com`，需要在域名 DNS 设置中添加 A 记录：

```
类型    主机记录    记录值
A       api         49.232.11.108
```

### 步骤 2：配置 Nginx/后端服务器

确保你的后端服务器配置了 HTTPS 和 CORS：

```nginx
# /etc/nginx/sites-available/api.example.com

server {
    listen 80;
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api/v1 {
        proxy_pass http://localhost:3001/api/v1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Origin, Content-Type, Accept, Authorization';
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

### 步骤 3：修改 `.env.production`

只需要修改一个地方：

```env
# Production Environment Configuration
# Backend API base URL - used by both Electron and Web deployments
# 
# 🎯 统一配置：
# Electron 桌面应用和网页部署都使用相同的后端地址
# 无需区分部署类型，简化配置管理
# 
# 配置示例：
#   开发环境: http://localhost:3001/api/v1
#   生产环境: http://49.232.11.108:3001/api/v1  
#   域名部署: https://api.example.com/api/v1
#
# 当前配置：使用域名（推荐）
VITE_API_BASE=https://api.example.com/api/v1
```

### 步骤 4：重新构建

#### 网页部署

```bash
# 1. 修改 .env.production
# 2. 重新构建
npm run build

# 3. 部署 dist/ 目录到你的静态服务器
```

#### Electron 桌面应用

```bash
# 1. 修改 .env.production
# 2. 重新打包
npm run electron:build:win

# 3. 分发新的 EXE 文件
```

## 为什么这么简单？

### 统一架构

```
┌─────────────────┐
│  .env.production │ ← 只需要改这一个文件
└─────────────────┘
        ↓
┌─────────────────────────────┐
│  构建时被嵌入到 JavaScript  │
└─────────────────────────────┘
        ↓
┌──────────────┬──────────────┐
│ Electron EXE │  Web 部署     │
│ 直接连域名    │  直接连域名    │
└──────────────┴──────────────┘
```

### 一次修改，处处生效

- ✅ Electron 应用自动使用新域名
- ✅ 网页部署自动使用新域名
- ✅ 无需修改代码
- ✅ 无需修改 server.cjs
- ✅ 无需区分部署类型

## 域名配置对比

| 配置方式 | 优点 | 缺点 |
|---------|------|------|
| **IP 地址** | 简单直接 | IP 变更需重新构建<br>不支持 HTTPS |
| **域名 (推荐)** | 专业、稳定<br>支持 HTTPS<br>IP 变更不影响 | 需要域名和 SSL 证书 |

## 使用 HTTPS 的好处

1. **安全性** - 数据加密传输
2. **兼容性** - 某些浏览器要求 HTTPS
3. **专业性** - 给用户更好的体验
4. **SEO** - 搜索引擎更青睐 HTTPS

## 验证方法

### 1. 修改后验证配置

```bash
# 检查 .env.production
cat .env.production

# 应该看到
VITE_API_BASE=https://api.example.com/api/v1
```

### 2. 构建后验证

```bash
# 构建
npm run build

# 检查构建产物中的 URL
grep -o '"https://api.example.com/api/v1"' dist/assets/*.js
```

### 3. 运行时验证

1. 打开应用（Electron 或网页）
2. 按 F12 打开开发者工具
3. 查看 Network 标签
4. 应该看到请求发送到 `https://api.example.com/api/v1/...`

## 常见问题

### Q: 我有多个域名怎么办？

A: 选择一个主域名配置在 `.env.production`，如果需要支持多个域名，在 Nginx 配置多个 server_name：

```nginx
server {
    server_name api.example.com api2.example.com;
    # ...
}
```

### Q: 域名还没配置好，能先用 IP 吗？

A: 可以！先用 IP：

```env
VITE_API_BASE=http://49.232.11.108:3001/api/v1
```

等域名配置好后，修改为：

```env
VITE_API_BASE=https://api.example.com/api/v1
```

然后重新构建即可。

### Q: 需要通知所有用户更新吗？

A: 
- **Electron 应用**：是的，需要分发新的 EXE
- **网页应用**：不需要，用户刷新页面自动使用新版本

### Q: 能否让用户自己配置域名？

A: 当前架构不支持运行时配置（域名在构建时固定）。如需支持，需要改造架构：

1. 方案 A：在应用中添加设置界面
2. 方案 B：读取配置文件（需要额外开发）

建议：保持当前简单架构，域名变更时重新构建即可。

## 推荐配置流程

### 生产环境配置（使用域名）

```bash
# 1. 购买域名（如 api.yourapp.com）
# 2. 配置 DNS A 记录指向服务器 IP
# 3. 配置 Nginx 反向代理 + SSL 证书
# 4. 修改 .env.production
echo "VITE_API_BASE=https://api.yourapp.com/api/v1" > .env.production

# 5. 构建应用
npm run build                  # 网页版
npm run electron:build:win     # Windows 桌面版

# 6. 部署/分发
```

### 开发/测试环境配置（使用 IP）

```bash
# 直接使用 IP 地址，快速测试
echo "VITE_API_BASE=http://192.168.1.100:3001/api/v1" > .env.production

npm run build
```

## 总结

✅ **修改非常简单** - 只需要改 `.env.production` 一个文件
✅ **自动生效** - 重新构建后所有部署方式都使用新域名
✅ **无需代码修改** - 不需要改任何 TypeScript/JavaScript 代码
✅ **统一管理** - Electron 和 Web 使用同一个配置

**只需要三步：**
1. 修改 `.env.production`
2. 重新构建（`npm run build` 或 `npm run electron:build:win`）
3. 部署/分发新版本
