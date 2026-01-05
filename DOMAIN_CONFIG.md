# 域名配置指南

## 当前配置（使用 HTTPS + 域名）

```env
VITE_API_BASE=https://www.aiwxcreator.cloud/api/v1
```

## 部署架构

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   浏览器/客户端   │──────▶│     Nginx       │──────▶│   Node.js 后端   │
│                 │      │   (80/443)      │      │   (端口 3001)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ↓                        ↓
   HTTPS 请求              反向代理 + SSL
```

**关键点**：
- **Nginx** 监听 `80` (HTTP) 和 `443` (HTTPS) 端口
- **Node.js** 监听内部端口 `3001`
- Nginx 负责 SSL 终止和反向代理

## 当前域名配置 (aiwxcreator.cloud)

### 1. DNS 配置

在域名提供商处添加以下 A 记录：

```
类型    主机记录    记录值
A       @           49.232.11.108
A       www         49.232.11.108
```

### 2. Nginx 配置

项目已提供预配置的 Nginx 配置文件：

```bash
# 复制配置文件
sudo cp nginx/aiwxcreator.cloud.conf /etc/nginx/sites-available/aiwxcreator.cloud

# 启用配置
sudo ln -s /etc/nginx/sites-available/aiwxcreator.cloud /etc/nginx/sites-enabled/

# 测试并重载
sudo nginx -t && sudo systemctl reload nginx
```

### 3. SSL 证书

使用 Certbot 自动配置 Let's Encrypt 证书：

```bash
sudo certbot --nginx -d aiwxcreator.cloud -d www.aiwxcreator.cloud
```

### 4. 验证部署

```bash
# 测试 HTTPS 连接
curl https://www.aiwxcreator.cloud/api/v1/health

# 应该返回类似：
# {"status":"healthy","version":"1.0.0","uptime":123,"timestamp":"2024-01-01T00:00:00.000Z","services":[]}
```

## 自定义域名配置

如果您使用不同的域名（如 `api.example.com`），需要修改以下配置：

### 步骤 1：配置 DNS

在域名 DNS 设置中添加 A 记录：

```
类型    主机记录    记录值
A       api         您的服务器IP
```

### 步骤 2：配置 Nginx

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/api.example.com
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

    # 开启 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # SSE 支持
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

### 步骤 3：启用配置并安装 SSL

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/api.example.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 安装 SSL 证书
sudo certbot --nginx -d api.example.com
```

### 步骤 4：修改 `.env.production`

只需要修改一个地方：

```env
# Production Environment Configuration
# 当前配置：使用 HTTPS + 域名
VITE_API_BASE=https://www.aiwxcreator.cloud/api/v1

# 或者使用您自己的域名
VITE_API_BASE=https://api.your-domain.com/api/v1
```

### 步骤 5：重新构建

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
VITE_API_BASE=https://www.aiwxcreator.cloud/api/v1
```

### 2. 构建后验证

```bash
# 构建
npm run build

# 检查构建产物中的 URL
grep -o '"https://www.aiwxcreator.cloud/api/v1"' dist/assets/*.js
```

### 3. 运行时验证

1. 打开应用（Electron 或网页）
2. 按 F12 打开开发者工具
3. 查看 Network 标签
4. 应该看到请求发送到 `https://www.aiwxcreator.cloud/api/v1/...`

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
