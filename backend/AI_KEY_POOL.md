# AI Key Pool 使用指南

## 概述

AI Key Pool 是一个用于管理和分配 AI API 密钥的池化系统，旨在应对高并发场景。通过密钥池，系统可以：

- 支持多个 API 密钥轮流使用，提高并发处理能力
- 自动负载均衡，优先使用并发量较低的密钥
- 支持密钥权重配置，灵活控制密钥使用频率
- 实时监控每个密钥的使用情况
- 支持热重载，无需重启服务即可更新密钥配置

## 重要说明

**🔒 安全设计：后端统一管理**

所有 API 密钥由后端统一管理，用户无需也无法提供自己的 API 密钥。这种设计具有以下优势：

- ✅ **安全性**：密钥集中管理，避免泄露风险
- ✅ **便捷性**：用户无需获取和配置 API 密钥
- ✅ **稳定性**：统一的密钥池确保服务质量
- ✅ **成本控制**：管理员可以集中监控和控制 API 使用成本

用户只需专注于内容创作，系统会自动从密钥池中选择最优密钥处理所有 AI 请求。

## 配置文件

### 文件位置

密钥池配置文件位于：`backend/src/config/aikeys.json`

示例配置文件：`backend/src/config/aikeys.example.json`

### 配置格式

```json
{
  "deepseek": [
    {
      "key": "sk-your-deepseek-key-1",
      "name": "DeepSeek Primary",
      "enabled": true,
      "weight": 100,
      "maxConcurrent": 10,
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerDay": 10000
      }
    }
  ],
  "qwen": [
    {
      "key": "sk-your-qwen-key-1",
      "name": "Qwen Primary",
      "enabled": true,
      "weight": 100,
      "maxConcurrent": 10,
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerDay": 10000
      }
    }
  ]
}
```

### 配置项说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | 是 | API 密钥 |
| `name` | string | 否 | 密钥的名称/标识，便于管理 |
| `enabled` | boolean | 是 | 是否启用此密钥 |
| `weight` | number | 否 | 权重（默认100），权重越高，被选中的概率越大 |
| `maxConcurrent` | number | 否 | 最大并发请求数，超过此数量将不再分配此密钥 |
| `rateLimit.requestsPerMinute` | number | 否 | 每分钟请求限制（目前仅用于记录） |
| `rateLimit.requestsPerDay` | number | 否 | 每日请求限制（目前仅用于记录） |

## 使用方法

### 1. 创建密钥池配置文件

复制示例文件并修改：

```bash
cd backend/src/config
cp aikeys.example.json aikeys.json
```

编辑 `aikeys.json`，添加你的实际 API 密钥。

### 2. 启动服务

密钥池会在服务启动时自动加载。如果配置文件不存在，系统会回退到使用环境变量中的密钥。

```bash
cd backend
npm run dev
```

### 3. 管理密钥池（管理员接口）

#### 获取密钥池配置和统计信息

```bash
GET /api/v1/admin/keypool
Authorization: Bearer <admin_token>
```

响应示例：
```json
{
  "success": true,
  "data": {
    "config": {
      "deepseek": [
        {
          "key": "sk-ab...xy",
          "name": "DeepSeek Primary",
          "enabled": true,
          "weight": 100,
          "maxConcurrent": 10
        }
      ],
      "qwen": [...]
    },
    "stats": {
      "sk-ab...xy": {
        "totalRequests": 150,
        "successfulRequests": 148,
        "failedRequests": 2,
        "currentConcurrent": 3,
        "lastUsed": 1703001234567
      }
    }
  }
}
```

#### 更新密钥池配置

```bash
PUT /api/v1/admin/keypool
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "deepseek": [...],
  "qwen": [...]
}
```

#### 重新加载密钥池（从文件）

如果你直接修改了 `aikeys.json` 文件，可以通过此接口热重载配置：

```bash
POST /api/v1/admin/keypool/reload
Authorization: Bearer <admin_token>
```

## 密钥选择策略

系统采用智能负载均衡策略选择密钥：

1. **过滤**：只选择已启用且未达到最大并发限制的密钥
2. **排序**：
   - 主要排序依据：当前并发数（越少越优先）
   - 次要排序依据：权重（越高越优先）
3. **选择**：选择排序后的第一个密钥

### 示例场景

假设有以下密钥配置：

| 密钥 | 权重 | 当前并发 | 最大并发 | 是否启用 |
|------|------|----------|----------|----------|
| Key-A | 100 | 2 | 10 | 是 |
| Key-B | 80 | 5 | 10 | 是 |
| Key-C | 120 | 2 | 10 | 是 |
| Key-D | 100 | 10 | 10 | 是 |
| Key-E | 100 | 1 | 10 | 否 |

选择结果：
1. Key-D 被过滤（已达到最大并发）
2. Key-E 被过滤（未启用）
3. 剩余 Key-A、Key-B、Key-C
4. 按并发数排序：Key-A(2)、Key-C(2)、Key-B(5)
5. Key-A 和 Key-C 并发数相同，按权重排序：Key-C(120) 优先
6. **最终选择：Key-C**

## 监控与统计

每个密钥都会记录以下统计信息：

- `totalRequests`: 总请求次数
- `successfulRequests`: 成功请求次数
- `failedRequests`: 失败请求次数
- `currentConcurrent`: 当前并发请求数
- `lastUsed`: 最后使用时间戳
- `lastError`: 最后一次错误信息（如果有）

管理员可以通过 `/api/v1/admin/keypool` 接口查看实时统计。

## 故障转移

如果密钥池中的所有密钥都不可用（全部禁用、达到并发限制或不存在），系统会自动回退到使用环境变量中配置的密钥：

- DeepSeek: `DEEPSEEK_API_KEY`
- Qwen: `DASHSCOPE_API_KEY`

## 安全注意事项

1. **密钥保护**：
   - `aikeys.json` 文件已添加到 `.gitignore`，不会被提交到版本控制
   - API 返回的密钥会被掩码处理（只显示前4位和后4位）

2. **访问控制**：
   - 密钥池管理接口仅限管理员访问
   - 需要有效的管理员 JWT token

3. **文件权限**：
   - 建议设置 `aikeys.json` 文件为仅服务器用户可读写
   - Linux/Mac: `chmod 600 backend/src/config/aikeys.json`

## 常见问题

### Q: 密钥池配置文件不存在会怎样？

A: 系统会自动回退到使用环境变量中的密钥，不会影响服务运行。

### Q: 如何临时禁用某个密钥？

A: 将该密钥的 `enabled` 字段设置为 `false`，然后调用热重载接口或重启服务。

### Q: 密钥池对性能有影响吗？

A: 密钥选择算法非常轻量，对性能影响可忽略不计。所有配置和统计都存储在内存中，访问速度极快。

### Q: 可以动态添加密钥吗？

A: 可以。通过管理员接口更新配置，或直接修改 `aikeys.json` 文件后调用热重载接口。

### Q: 用户可以提供自己的 API key 吗？

A: **不可以**。出于安全考虑，所有 API 密钥都由后端统一管理。用户无需也无法提供自己的 API 密钥，系统会自动从密钥池中选择最优密钥处理请求。这种设计确保了密钥的集中管理和安全性。

## 示例：完整工作流程

1. **初始配置**：
```bash
cd backend/src/config
cp aikeys.example.json aikeys.json
# 编辑 aikeys.json，添加你的密钥
```

2. **启动服务**：
```bash
cd backend
npm run dev
```

3. **验证配置**（使用管理员账号）：
```bash
curl -X GET http://localhost:3001/api/v1/admin/keypool \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

4. **监控使用情况**：
定期检查统计信息，确保密钥负载均衡

5. **动态调整**（如需要）：
```bash
# 直接修改 aikeys.json
vim backend/src/config/aikeys.json

# 热重载配置
curl -X POST http://localhost:3001/api/v1/admin/keypool/reload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 技术实现

密钥池系统的核心组件：

- `backend/src/services/aiKeyPoolService.ts`: 核心服务，负责密钥加载、选择和统计
- `backend/src/types/ai.ts`: 类型定义
- `backend/src/controllers/adminController.ts`: 管理接口
- `backend/src/routes/adminRoutes.ts`: 路由配置
- `backend/src/services/aiService.ts`: AI 服务集成
- `backend/src/controllers/aiController.ts`: AI 请求处理（仅使用后端密钥池）

### 密钥使用流程

```
用户请求 → aiController (后端统一管理)
           ↓
    getApiKeyFromPool() (从密钥池选择最优密钥)
           ↓
    aiKeyPoolService (负载均衡算法)
           ↓
    执行 AI 请求
           ↓
    releaseApiKey() (更新统计信息)
           ↓
    返回结果给用户
```

**关键设计**：
- 用户请求中**不接受** `X-API-Key` header
- 所有请求都通过 `getApiKeyFromPool()` 获取密钥
- 密钥选择基于并发数和权重的智能负载均衡
- 请求完成后自动释放密钥并更新统计
