# 微信公众号 AI 自动化发布助手 - 后端服务 (Backend Only)

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000.svg" alt="Express">
  <img src="https://img.shields.io/badge/AI-Multi--Model-green.svg" alt="AI">
</p>

这是 WeChat AI Publisher 的后端服务版本，专门用于服务器部署。提供 REST API 支持 AI 文章生成、用户认证、配额管理等功能。

> **注意**: 这是纯后端版本，不包含前端代码。如需完整版（含前端、小程序、Electron桌面应用），请参考主仓库的其他分支。

## 🚀 功能特性

- **多 AI 模型支持**: DeepSeek V3、Qwen Plus
- **双 AI 并行架构**: 内容AI + 设计AI 分工协作
- **JWT 认证系统**: Access Token + Refresh Token
- **配额管理**: 用户配额、使用记录持久化
- **SSE 流式响应**: 实时 AI 生成体验
- **API 密钥池**: 支持多密钥负载均衡

## 📁 项目结构

```
autowechatpush/
├── backend/                  # 后端服务
│   ├── src/
│   │   ├── config/          # 环境配置
│   │   ├── controllers/     # 请求处理器
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由定义
│   │   ├── services/        # 业务逻辑
│   │   ├── types/           # TypeScript 类型
│   │   ├── utils/           # 工具函数
│   │   └── index.ts         # 入口文件
│   ├── .env.example         # 环境变量模板
│   ├── Dockerfile           # Docker 构建文件
│   ├── package.json         # 依赖配置
│   └── tsconfig.json        # TS 配置
├── README.md
└── .gitignore
```

## 🔧 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

关键环境变量:

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | `3001` |
| `JWT_SECRET` | JWT 密钥 (≥32字符) | - |
| `CORS_ORIGINS` | 允许的跨域来源 | `http://localhost:5173` |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | - |
| `DASHSCOPE_API_KEY` | Qwen API 密钥 | - |
| `ADMIN_EMAIL` | 管理员邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | 管理员密码 | `admin123` |

### 3. 开发模式

```bash
cd backend
npm run dev
```

### 4. 生产构建

```bash
cd backend
npm run build
npm start
```

## 🐳 Docker 部署

```bash
cd backend
docker build -t wechat-ai-backend .
docker run -d -p 3001:3001 --env-file .env wechat-ai-backend
```

## 📚 API 端点

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/health` | 健康检查 |

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/token` | 登录获取 Token |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| GET | `/api/v1/auth/me` | 获取当前用户 |

### AI 生成

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/ai/generate` | 生成文章 |
| POST | `/api/v1/ai/chat/stream` | SSE 流式生成 |
| POST | `/api/v1/ai/helper` | AI 辅助功能 |
| GET | `/api/v1/ai/quota` | 获取配额 |

### 用户配额

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/user/quota` | 获取配额状态 |
| GET | `/api/v1/user/quota/history` | 获取使用记录 |

### 管理员 (需要 admin 角色)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/admin/stats` | 统计数据 |
| GET | `/api/v1/admin/users` | 用户列表 |
| POST | `/api/v1/admin/users` | 创建用户 |
| PATCH | `/api/v1/admin/users/:id/role` | 修改角色 |
| PATCH | `/api/v1/admin/users/:id/quota` | 修改配额 |
| DELETE | `/api/v1/admin/users/:id` | 删除用户 |

## 🔒 安全特性

- **Helmet**: HTTP 安全头
- **CORS**: 跨域保护
- **Rate Limiting**: 请求限流
- **JWT**: 无状态认证
- **Zod**: 输入验证

## 📖 更多文档

详细的 API 文档和配置说明请参考 [backend/README.md](./backend/README.md)。

关于 AI 密钥池配置，请参考 [backend/AI_KEY_POOL.md](./backend/AI_KEY_POOL.md)。

## 📄 License

MIT License
