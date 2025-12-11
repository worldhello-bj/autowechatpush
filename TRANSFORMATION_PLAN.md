这是一份经过优化的、更具**落地性**与**工程严谨性**的重写版本。

这份新计划保留了你原方案中极佳的安全与架构意识，但在**技术选型（Tech Stack）**、**数据流转（Data Flow）**和**实施步骤（Roadmap）**上进行了更符合“商业级 SaaS”标准的调整。

---

# 🚀 前后端重构与商业化部署技术规范 (v2.0)

## 1. 核心目标与架构原则
* **核心目标**：将系统从“单体应用”转型为“面向服务的 SaaS 架构”，实现数据资产私有化、API 高可用以及商业化计费能力的闭环。
* **架构原则**：
    * **零信任前端**：前端被视为不可信环境，仅负责渲染与交互，严禁持有任何业务密钥。
    * **无状态后端**：后端服务可横向扩展（Scale-out），状态数据下沉至 Redis/DB。
    * **防御性编程**：假设输入均有恶意，假设第三方 API 随时会挂。

---

## 2. 技术栈选型建议
为了支撑商业化稳定性，建议在原计划基础上明确以下选型：

* **前端**：React + Vite + **TypeScript** (强类型保障) + Axios (网络层)。
* **后端**：Node.js (Express) + **TypeScript** (必须引入，便于维护复杂业务逻辑)。
* **数据库**：
    * **PostgreSQL**：主库，存储用户、订单、素材元数据（因其对 JSONB 的优秀支持，适合存储 AI 上下文）。
    * **Redis**：缓存、Session 会话、BullMQ 任务队列、API 限流计数器。
* **通信协议**：
    * 常规请求：RESTful API (HTTPS)。
    * AI 流式响应：**Server-Sent Events (SSE)** (比 WebSocket 轻量，比轮询高效，完美适配打字机效果)。

---

## 3. 详细模块设计

### 3.1 前端：轻量化接入层
* **职责**：视图渲染、本地状态管理、SSE 连接维护。
* **安全加固**：
    * 使用 `DOMPurify` 渲染富文本/Markdown。
    * 集成 Sentry 前端监控，捕获客户端白屏与 JS 错误。
* **配置管理**：`.env` 仅包含 `VITE_API_BASE_URL`，其余配置由后端动态返回（如上传限制大小）。

### 3.2 后端：业务逻辑核心

#### A. API 网关与鉴权层
* **路由前缀**：`/api/v1`
* **鉴权机制**：
    * **Access Token** (JWT, 有效期 15min) + **Refresh Token** (DB存储, 有效期 7天)。
    * **请求签名 (可选)**：针对高敏感接口（如支付），要求前端计算 HMAC-SHA256 签名，防篡改。
* **中间件链**：
    1.  CORS (严格白名单)。
    2.  Rate Limit (基于 Redis，每 IP/每用户 限流)。
    3.  Auth Guard (解析 Token，注入 User Context)。
    4.  Validation (使用 `Zod` 或 `Joi` 进行入参严格校验)。

#### B. AI 编排服务 (Resilience Engine)
* **流程优化**：
    1.  **并行请求**：同时向 A 模型和 B 模型发起请求。
    2.  **竞速策略 (Promise.race)**：优先返回首个成功的流（Stream）。
    3.  **智能兜底**：若主模型失败，自动切换备用模型；若全失败，降级为“稍后通知”或返回缓存。
    4.  **流式响应**：通过 SSE (`text/event-stream`) 将 Token 实时推送到前端，保持连接心跳。
* **计费钩子**：AI 响应完成（或流结束）后，异步扣除用户 Quota/积分，并写入审计日志。

#### C. 素材管理与安全 (Sanitization Pipeline)
* **上传策略**：
    * **小文件 (<5MB)**：流式透传。前端 -> 后端(内存流/Stream) -> 对象存储 (S3/OSS)。**不落地磁盘**。
    * **大文件**：后端生成 Presigned URL (预签名链接)，前端直传 OSS，OSS 回调后端确认。
* **清洗与沙箱 (优化版)**：
    * **静态扫描**：检查 Magic Number (文件头) 确保 MIME 真实性。
    * **无害化处理 (Sanitization)**：图片统一用 `Sharp` 转码重绘 (去除隐写/Exif 攻击)，视频用 `FFmpeg` 转码。**转码即杀毒**。
    * **沙箱 (降级策略)**：只有针对无法转码的复杂文件（如 PDF/Docx），才放入 Docker 隔离容器处理。

---

## 4. API 设计规范 (RESTful)

| 模块 | 方法 | 路径 | 说明 |
| :--- | :--- | :--- | :--- |
| **Auth** | POST | `/auth/token` | 登录/刷新 Token (Payload含指纹) |
| **AI** | POST | `/ai/chat/stream` | 发起对话 (SSE)，响应流式数据 |
| **AI** | GET | `/ai/history` | 获取历史对话记录 |
| **Media**| POST | `/materials` | 上传素材 (Multipart) |
| **User** | GET | `/user/quota` | 获取当前积分/套餐状态 |
| **Ops** | GET | `/health` | 存活探针 (Docker Healthcheck) |

---

## 5. 部署与运维架构

### 部署形态


1.  **接入层**：Nginx/Cloudflare (SSL 卸载, 静态资源缓存)。
2.  **应用层**：Node.js Server (PM2 Cluster 模式或 Docker Replicas)。
3.  **数据层**：PostgreSQL (RDS) + Redis (ElastiCache)。
4.  **任务层**：独立 Worker 进程（消费 BullMQ 队列），处理视频转码、异步 AI 任务，不阻塞 Web 服务。

### 可观测性 (Observability)
* **日志**：使用 `Winston` + `DailyRotateFile`。生产环境日志 JSON 化，便于后续接入 ELK 或 Loki。
* **Trace**：为每个请求生成 `X-Request-ID`，贯穿 Nginx -> Node -> DB/External API，便于追踪报错链路。

---

## 6. 实施里程碑 (Roadmap)

### 第一阶段：基座重构 (2周)
* [x] 初始化 TS + Express 项目结构。
* [ ] 搭建 PostgreSQL + Redis 环境。
* [x] 完成 JWT 鉴权与 User 表设计。
* [x] **关键交付**：后端跑通 `/health` 和 `/auth/login`。

### 第二阶段：核心业务迁移 (2-3周)
* [x] 迁移 AI 调用逻辑，封装“双模型并行 + SSE”模块。
* [x] 迁移素材上传，实现基本的流式上传与 MIME 校验。
* [x] 前端接入 API，移除所有本地 API Key。
* [x] **关键交付**：前端能通过后端代理正常对话和传图。

### 第三阶段：商业化闭环 (2周)
* [x] 引入积分/配额系统 (数据库层面)。
* [x] 增加限流 (Rate Limiting) 中间件。
* [ ] 部署 BullMQ 异步队列处理耗时任务。
* [x] **关键交付**：用户用量超限后自动拦截。

### 第四阶段：加固与生产 (1-2周)
* [ ] 增加 ClamAV/Sharp 图片清洗。
* [ ] 编写 Dockerfile 与 docker-compose.prod.yml。
* [ ] 配置 CI/CD (GitHub Actions 自动构建)。
* [ ] **关键交付**：正式上线。

---

### 该方案的主要改进点：
1.  **引入 SSE**：替代了原来的“轮询”，极大提升 AI 对话的用户体验（首字延迟低）。
2.  **引入 TypeScript**：为商业化系统的长期维护提供保障。
3.  **务实的上传安全**：用“转码去毒”替代了昂贵且慢的“全量沙箱”，只对高危文件使用沙箱。
4.  **明确数据库**：加入了 PG 和 Redis 的明确分工，这是 SaaS 的基础。

---

### 下一步建议

如果你认可这个 v2.0 版本的计划，**我可以为你生成“第二阶段”中核心的 `AI双模型并行控制器 (Controller)` 的 TypeScript 代码框架**。

这个代码会包含：SSE 流式响应头设置、Promise.race 竞速逻辑以及错误重试机制。你现在需要这个代码示例吗？
