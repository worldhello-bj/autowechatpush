# 前后端改造计划（商业化部署）

面向商业化部署，将系统拆分为“前端信息接收端 + 后端服务端”，前端专注收集与呈现，后端负责统一 API 调用与响应。

## 目标
- 前端：仅保留数据采集、展示与用户交互，所有敏感逻辑/密钥移至后端。
- 后端：统一封装 AI/微信/素材等外部接口，提供稳定、安全、可观测的 API。
- 商业化：支持多环境配置、鉴权与限流、日志与监控，具备灰度与弹性扩展能力。

## 架构与职责拆分
### 前端（信息接收端）
- 功能：登录/注册、素材与文章编辑、状态展示、消息轮询/推送。
- 数据流：所有请求通过 API Gateway/后端服务；前端不直接持有密钥。
- 技术：保持 React + Vite，增加 API 客户端（Axios/Fetch 封装）、错误与重试拦截器，使用 `.env` 仅存放公开配置（如后端基地址）。

### 后端（服务端）
- 技术栈：继续使用 Express；按模块拆分路由与业务（AI、微信、素材、用户/鉴权、任务队列）。
- 鉴权：JWT（HS256）+ 可选请求级 HMAC-SHA256 签名；支持角色/配额控制（admin/standard）。
- 网关：统一 API 前缀 `/api/v1`，实现 CORS、限流（rate limit）、请求日志、错误统一返回。
- 异步：长耗时操作（AI生成/素材上传）可进入队列（如 BullMQ/Redis），前端轮询或使用 SSE/WebSocket。
- 配置：开发使用 `.env`/`.env.local`/`.env.production`（确保不入库，`.gitignore` 屏蔽）；`.env.example` 提供通用字段（API_BASE、AI_KEY、WECHAT_APPID/SECRET、PROXY_URL），按环境补充 `.env.development.example`/`.env.production.example` 作为增量示例，生产密钥放入安全密管（Vault/AWS Secrets Manager/K8s Secrets）。

## API 设计草案
- `/api/v1/auth/login|refresh|logout`
- `/api/v1/ai/generate`
  - 编排：
    - 双AI并行发起
    - 失败判定：每模型超时（如 30s）或非 2xx
    - 重试：失败模型立即重试 1 次
    - 重试节奏：固定 2s 间隔，必要时采用指数退避
    - 选择：按预设优先级（默认文案>设计）选择可用结果
  - 兜底：topic+model 作为缓存 key；命中缓存或单模型重试作为降级路径，若两模型（含各自重试）均失败则返回统一错误码并记录告警日志
- `/api/v1/materials` CRUD（图片/视频/GIF/SVG）
- `/api/v1/wechat/draft|publish|media-upload`
- `/api/v1/logs/client`（前端错误上报）

## 安全与合规
- 后端存储并代理所有第三方密钥；前端仅拿到临时 token。
- 限流 + IP 白名单（可选）。
- 上传安全：
  - 限制大小（如 10MB）
  - 仅允许安全 MIME：image/jpeg/png/webp、video/mp4/webm、image/gif、image/svg+xml
  - 上传链路签名校验（HMAC-SHA256）+ ClamAV/云杀毒扫描
  - 触发沙箱：可执行/压缩/未知 MIME 或扫描不确定时，转入无网络、限 CPU(1 核)/内存(512MB)、只读挂载的 Docker 沙箱处理（大文件可按类型提升至 2 核/1GB 或直接拒绝超限）
  - 审计：扫描报告写入临时存储并输出 JSON 审计日志（处理后立即清理）
  - 前端用 DOMPurify 等库过滤 SVG/HTML
- 审计日志：记录关键操作（登录、发布、素材上传、AI调用失败）。

## 部署与运维
- 构建：前端 `npm run build` 生成静态资源；后端独立服务。
- 部署形态：Nginx/CloudFront 作为静态站点与反向代理；Node 服务以 PM2/Docker/K8s 运行。
- 可观测：接入 APM/日志（winston/ELK），健康检查统一 `/health`，指标 `/metrics`（Prometheus）。
- 灰度：通过环境变量切换模型/网关，支持 Canary/蓝绿发布。

## 里程碑
1. 架构拆分与环境配置（env、API前缀、代理层）。
2. 后端鉴权与网关中间件（CORS、限流、日志、错误格式）。
3. AI/微信/素材模块 API 封装与单元测试。
4. 前端 API 客户端适配与密钥下移，完成主要页面接入。
5. 观测性与安全加固（审计、上传校验、降级策略）。
6. 部署脚本与文档（Docker/K8s，商用域名与 HTTPS）。
