# 服务器部署指南

本指南将帮助您将 WeChat AI Publisher 后端 API 服务部署到您的服务器上。

## 系统架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   前端应用       │    │   后端 API        │    │   AI 服务        │
│   (React/Vite)  │───▶│   (Express/TS)   │───▶│   DeepSeek/Qwen │
│   端口: 5173    │    │   端口: 3001     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                      │
        │                      ▼
        │              ┌──────────────────┐
        │              │   数据持久化       │
        │              │   backend/data/   │
        │              │   - users.json    │
        │              │   - quota.json    │
        │              │   - analytics.json│
        │              └──────────────────┘
        ▼
┌─────────────────┐
│   Electron/Web  │
│   端口: 3000    │
│   (server.cjs)  │
└─────────────────┘
```

## 目录

1. [服务器准备](#1-服务器准备)
2. [安装必要软件](#2-安装必要软件)
3. [获取代码](#3-获取代码)
4. [配置环境变量](#4-配置环境变量)
5. [部署后端服务](#5-部署后端服务)
6. [配置反向代理（可选）](#6-配置反向代理可选)
7. [设置开机自启](#7-设置开机自启)
8. [常见问题](#8-常见问题)

---

## 1. 服务器准备

### 1.1 系统要求

- **操作系统**: Ubuntu 20.04/22.04 LTS (推荐) 或 CentOS 7/8
- **内存**: 最低 1GB RAM
- **存储**: 最低 10GB 可用空间
- **网络**: 开放端口 80, 443, 3001

### 1.2 连接服务器

使用 SSH 连接到您的服务器：

```bash
# Windows: 使用 PowerShell 或 Git Bash
# macOS/Linux: 使用终端
ssh root@您的服务器IP地址
```

首次连接会提示确认指纹，输入 `yes` 继续。

---

## 2. 安装必要软件

### 2.1 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2.2 安装 Node.js 18+

```bash
# 使用 NodeSource 安装 Node.js 18 (推荐)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v   # 应显示 v18.x.x
npm -v    # 应显示 9.x.x 或更高
```

### 2.3 安装 Git

```bash
# Ubuntu/Debian
sudo apt install -y git

# 验证安装
git --version
```

### 2.4 安装 PM2（进程管理器）

```bash
sudo npm install -g pm2
```

---

## 3. 获取代码

### 3.1 克隆仓库

```bash
# 创建工作目录
mkdir -p /opt/wechat-ai-publisher
cd /opt/wechat-ai-publisher

# 克隆代码仓库
git clone https://github.com/worldhello-bj/autowechatpush.git .
```

### 3.2 安装依赖

```bash
# 进入后端目录
cd backend

# 安装依赖包
npm install
```

---

## 4. 配置环境变量

### 4.1 创建配置文件

```bash
# 在 backend 目录下
cp .env.example .env

# 使用编辑器修改配置（这里使用 nano，新手友好）
nano .env
```

### 4.2 修改配置内容

打开 `.env` 文件后，修改以下关键配置：

```bash
# 服务器配置
PORT=3001
NODE_ENV=production

# ⚠️ 重要：生成一个安全的密钥（至少32个字符）
# 可以使用此命令生成: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=请运行上方命令生成64位随机密钥并粘贴在这里

# CORS 配置（允许访问的域名，多个用逗号分隔）
# ⚠️ 生产环境请只填写您的真实域名，不要包含 localhost
# 如果只有IP，格式如: http://您的IP:端口
CORS_ORIGINS=http://您的域名

# AI 服务密钥（后端统一管理，用户无需提供）
# ⚠️ DeepSeek 或 Qwen 至少配置一个（可以两个都配置）
DEEPSEEK_API_KEY=您的DeepSeek密钥
DASHSCOPE_API_KEY=您的通义千问密钥
# 注意：Google Gemini 由前端直接调用，用户需在设置页面配置
```

### 4.3 配置 AI 密钥池（高并发推荐）

对于需要支持高并发的生产环境，可以配置多个 API 密钥实现负载均衡：

```bash
# 在后端源码目录创建配置文件
cd /opt/wechat-ai-publisher/backend/src/config
cp aikeys.example.json aikeys.json

# 编辑 aikeys.json，添加多个密钥
nano aikeys.json
```

**重要说明**：
- 配置文件在 `backend/src/config/aikeys.json`
- 构建时会自动复制到 `dist/config/` 目录
- 运行时优先从源码目录加载，保证配置可随时更新
- 如果不配置密钥池，系统会回退使用环境变量中的密钥

详见 [backend/AI_KEY_POOL.md](./backend/AI_KEY_POOL.md)。

### 4.4 生成 JWT 密钥

运行以下命令生成安全的随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将输出的字符串复制到 `.env` 文件的 `JWT_SECRET` 中。

### 4.5 保存配置

如果使用 nano 编辑器：
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

---

## 5. 部署后端服务

### 5.1 构建项目

```bash
# 确保在 backend 目录
cd /opt/wechat-ai-publisher/backend

# 构建 TypeScript 代码
npm run build
```

### 5.2 使用 PM2 启动服务

```bash
# 启动服务
pm2 start dist/index.js --name "wechat-api"

# 查看运行状态
pm2 status

# 查看日志
pm2 logs wechat-api
```

### 5.3 验证服务运行

```bash
# 测试健康检查接口
curl http://localhost:3001/api/v1/health
```

如果返回类似 `{"status":"ok","timestamp":"..."}` 的响应，说明服务运行正常！

### 5.4 数据持久化说明

后端服务会自动将以下数据持久化到 `backend/data/` 目录：

| 文件 | 内容 | 说明 |
|------|------|------|
| `users.json` | 用户账户信息 | 邮箱、密码哈希、角色、配额 |
| `quota.json` | 配额使用记录 | 每个用户的使用量和历史 |
| `analytics.json` | 用户行为数据 | 事件追踪、活跃度统计 |

**备份建议：** 定期备份 `backend/data/` 目录以防数据丢失。

### 5.5 部署前端到后端（可选）

如果您希望通过一个服务同时提供前端和 API，可以将构建好的前端文件放入后端的 `web/` 目录：

```bash
# 在项目根目录构建前端
cd /opt/wechat-ai-publisher
npm install
npm run build

# 将构建好的前端复制到后端 web 目录
cp -r dist/* backend/web/

# 重启后端服务
pm2 restart wechat-api
```

现在访问 `http://您的域名:3001/` 将直接显示前端应用，而 `/api/v1/*` 路由仍然处理 API 请求。

---

## 6. 配置反向代理（可选）

如果您希望使用域名访问，需要配置 Nginx 反向代理。

### 6.1 快速部署（aiwxcreator.cloud）

如果您正在部署 `aiwxcreator.cloud` 域名，可以使用预配置的脚本：

```bash
# 进入项目目录
cd /opt/wechat-ai-publisher

# 运行部署脚本
sudo bash nginx/deploy-nginx-https.sh
```

### 6.2 手动安装 Nginx

```bash
sudo apt install -y nginx
```

### 6.3 创建 Nginx 配置

#### 对于 aiwxcreator.cloud 域名：

```bash
# 复制预配置文件
sudo cp nginx/aiwxcreator.cloud.conf /etc/nginx/sites-available/aiwxcreator.cloud

# 创建软链接
sudo ln -s /etc/nginx/sites-available/aiwxcreator.cloud /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl reload nginx
```

#### 对于其他域名：

```bash
sudo nano /etc/nginx/sites-available/wechat-api
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name 您的域名或IP;

    # 开启 gzip 压缩 (优化加载速度)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE 支持
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

### 6.4 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/wechat-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 6.5 配置 HTTPS（推荐）

使用免费的 Let's Encrypt 证书：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（aiwxcreator.cloud 示例）
sudo certbot --nginx -d aiwxcreator.cloud -d www.aiwxcreator.cloud

# 或者替换为您的域名
sudo certbot --nginx -d 您的域名 -d www.您的域名
```

Certbot 会自动：
- 申请 SSL 证书
- 配置 Nginx 使用 HTTPS
- 设置 HTTP -> HTTPS 自动重定向
- 配置证书自动续期

### 6.6 验证 HTTPS

1. 访问 `https://www.aiwxcreator.cloud`（或您的域名）
2. 检查浏览器地址栏是否显示🔒（安全锁）
3. 打开开发者工具 (F12)，确认 Network 面板中没有 `ERR_SSL_PROTOCOL_ERROR` 或 `Mixed Content` 报错
4. 测试 API：`curl https://www.aiwxcreator.cloud/api/v1/health`

---

## 7. 设置开机自启

### 7.1 PM2 开机自启

```bash
# 生成启动脚本
pm2 startup

# 按照提示运行生成的命令（会显示一行 sudo 命令）

# 保存当前进程列表
pm2 save
```

### 7.2 验证自启动

```bash
# 重启服务器测试
sudo reboot
```

重新连接后，运行 `pm2 status` 确认服务已自动启动。

---

## 8. 常见问题

### Q: 端口 3001 无法访问？

1. 检查防火墙：
```bash
# Ubuntu (UFW)
sudo ufw allow 3001

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

2. 检查云服务商安全组规则，确保开放 3001 端口。

### Q: 服务启动失败？

查看详细日志：
```bash
pm2 logs wechat-api --lines 100
```

常见原因：
- `.env` 配置错误
- Node.js 版本过低
- 端口被占用

### Q: 如何更新代码？

```bash
cd /opt/wechat-ai-publisher

# 拉取最新代码
git pull origin main

# 重新安装依赖
cd backend
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart wechat-api
```

### Q: 如何查看实时日志？

```bash
# 实时跟踪日志
pm2 logs wechat-api --lines 50

# 或使用
tail -f ~/.pm2/logs/wechat-api-out.log
```

### Q: 内存不足怎么办？

1. 创建交换空间：
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 部署检查清单

- [ ] Node.js 18+ 已安装
- [ ] 代码已克隆
- [ ] `.env` 已配置
- [ ] JWT_SECRET 已设置
- [ ] 项目已构建 (`npm run build`)
- [ ] PM2 已启动服务
- [ ] 健康检查通过
- [ ] 防火墙端口已开放
- [ ] PM2 开机自启已配置

---

## 需要帮助？

如果遇到问题，请：

1. 查看 PM2 日志：`pm2 logs wechat-api`
2. 检查 `.env` 配置是否正确
3. 确认服务器端口是否开放
4. 在 GitHub Issues 中提问

---

## Docker 部署（高级）

如果您熟悉 Docker，可以使用容器化部署：

```bash
cd /opt/wechat-ai-publisher

# 首先构建前端（可选，如果需要通过后端访问前端）
npm install
npm run build

# 将前端复制到后端 web 目录
cp -r dist/* backend/web/

# 进入后端目录
cd backend

# 构建镜像
docker build -t wechat-api .

# 运行容器
# 注意：Docker 镜像内部使用端口 80（为微信云托管优化）
# 这里将主机的 3001 端口映射到容器的 80 端口
docker run -d \
  --name wechat-api \
  -p 3001:80 \
  -e JWT_SECRET=请生成一个64位随机密钥 \
  -e CORS_ORIGINS=http://您的域名 \
  wechat-api

# 验证服务运行
curl http://localhost:3001/api/v1/health

# 现在访问 http://您的域名:3001/ 将显示前端应用
```

---

祝您部署顺利！🎉
