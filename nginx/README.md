# Nginx 部署文件

本目录包含用于部署 WeChat AI Publisher 后端服务的 Nginx 配置文件和部署脚本。

## 文件说明

| 文件 | 说明 |
|------|------|
| `aiwxcreator.cloud.conf` | 针对 `aiwxcreator.cloud` 域名的 Nginx 配置 |
| `deploy-nginx-https.sh` | 自动化部署脚本（安装 Nginx + Certbot + SSL） |

## 快速部署

### 方法 1：使用自动化脚本

```bash
# 在服务器上运行
sudo bash nginx/deploy-nginx-https.sh
```

脚本会自动完成以下操作：
1. 安装 Nginx 和 Certbot
2. 配置反向代理
3. 申请并安装 SSL 证书
4. 配置 HTTP -> HTTPS 自动重定向

### 方法 2：手动配置

```bash
# 1. 安装 Nginx
sudo apt update
sudo apt install -y nginx

# 2. 复制配置文件
sudo cp nginx/aiwxcreator.cloud.conf /etc/nginx/sites-available/aiwxcreator.cloud

# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/aiwxcreator.cloud /etc/nginx/sites-enabled/

# 4. 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 5. 测试并重载
sudo nginx -t && sudo systemctl reload nginx

# 6. 安装 SSL 证书
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d aiwxcreator.cloud -d www.aiwxcreator.cloud
```

## 架构说明

```
                    ┌─────────────────────────────────────────┐
                    │               服务器                     │
                    │                                         │
  用户请求           │  ┌─────────────┐    ┌─────────────────┐ │
  ─────────────────▶│  │   Nginx     │───▶│   Node.js 后端   │ │
  https://www.      │  │  (80/443)   │    │   (端口 3001)    │ │
  aiwxcreator.cloud │  │             │    │                 │ │
                    │  │ SSL 终止    │    │ Express API     │ │
                    │  │ 反向代理    │    │ 静态文件        │ │
                    │  └─────────────┘    └─────────────────┘ │
                    │                                         │
                    └─────────────────────────────────────────┘
```

**关键端口**：
- `80`: HTTP（自动重定向到 HTTPS）
- `443`: HTTPS（Nginx 处理 SSL）
- `3001`: Node.js 后端（仅内部访问）

## Nginx 路由配置

Nginx 配置使用了三个 location 块来处理不同类型的请求，按优先级从高到低：

### 1. SSE 流式端点（最高优先级）
```nginx
location /api/v1/ai/chat/stream {
    # 特殊配置：超长超时（24小时）用于 Server-Sent Events
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

### 2. API 请求
```nginx
location /api/ {
    # 所有 API 请求（除了上面的 SSE 端点）
    # 5分钟超时，支持 WebSocket
    proxy_read_timeout 300;
    proxy_send_timeout 300;
}
```

### 3. 前端和其他请求（最低优先级）
```nginx
location / {
    # 前端静态文件和其他请求
    # 60秒超时
    proxy_read_timeout 60;
}
```

**路由优先级说明**：
- Nginx 按照最长前缀匹配原则处理 location
- `/api/v1/ai/chat/stream` 优先于 `/api/`，优先于 `/`
- 这确保了 SSE 流式请求使用超长超时，普通 API 请求使用合理超时，前端请求使用短超时

## 验证部署

```bash
# 测试 API 健康检查
curl https://www.aiwxcreator.cloud/api/v1/health

# 检查 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

## SSL 证书续期

Certbot 会自动配置证书续期任务。手动续期：

```bash
sudo certbot renew
```

## 故障排除

### 1. Nginx 无法启动

```bash
# 检查配置语法
sudo nginx -t

# 查看错误日志
sudo tail -20 /var/log/nginx/error.log
```

### 2. 502 Bad Gateway

后端服务可能未运行：

```bash
# 检查后端状态
pm2 status

# 测试后端端口
curl http://127.0.0.1:3001/api/v1/health
```

### 3. SSL 证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 测试证书续期
sudo certbot renew --dry-run
```
