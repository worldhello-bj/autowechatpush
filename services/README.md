# 服务层 (Services)

本目录包含前端服务模块，包括 AI 服务封装、模板库和微信 API 集成。

> **⚠️ 重要架构说明**
> 
> 自 v1.3.0 起，DeepSeek 和 Qwen 的 AI 调用已迁移到后端统一处理。前端通过 `apiClient.ts` 调用后端 API，不再直接调用 AI 服务商接口。
> 
> - **DeepSeek/Qwen**: 通过 `apiClient.ts` → 后端 `/api/v1/ai/*`
> - **Google Gemini**: 仍由前端直接调用（需用户配置 API Key）

## 📁 服务列表

| 服务 | 文件 | 描述 |
|------|------|------|
| API Client | `apiClient.ts` | 后端 API 客户端（推荐使用） |
| Gemini Service | `geminiService.ts` | Google Gemini AI 服务（前端直调） |
| Qwen Service | `qwenService.ts` | 阿里云 Qwen AI 服务（仅类型导出） |
| DeepSeek Service | `deepSeekService.ts` | DeepSeek AI 服务（仅类型导出） |
| Dual AI Service | `dualAIService.ts` | 双AI并行系统（记忆管理） |
| Design Templates | `designTemplates.ts` | 设计模板库（45+ 模板） |
| Material Content | `materialLibraryContent.ts` | 文案素材库（40+ 预设） |
| WeChat Service | `wechatService.ts` | 微信公众号 API |
| Analytics | `analytics.ts` | 用户行为追踪 |
| Logger | `logger.ts` | 统一日志系统 |

---

## 🔌 API 客户端（推荐）

### apiClient.ts

后端 API 客户端，提供类型安全的接口调用。所有 AI 功能都应通过此客户端访问。

**核心功能：**

```typescript
import { aiApi, authApi, quotaApi, materialApi } from '../services/apiClient';

// AI 生成
const result = await aiApi.generate({
  message: '写一篇关于秋天的文章',
  provider: 'deepseek',  // 或 'qwen'
  useSearch: false,
  isFormattingMode: false,
});

// AI 助手功能
const titles = await aiApi.helper('generateTitles', content, 'deepseek', { count: 5 });

// 认证
const loginResult = await authApi.login(email, password);
const user = await authApi.getMe();

// 配额
const quota = await quotaApi.getStatus();
```

**自动功能：**
- Token 自动刷新（401 时自动重试）
- 统一错误处理
- 请求 ID 追踪

---

## 🤖 AI 服务详解

### geminiService.ts

Google Gemini AI 服务，支持文本生成、图像分析和 TTS。

**模型：**
- `gemini-2.5-flash` - 文本生成与搜索
- `gemini-3-pro-preview` - 图像分析
- `gemini-2.5-flash-preview-tts` - 语音合成

**核心函数：**

```typescript
// 生成文章结构
export const generateArticleStructure = async (
  input: string,
  useSearch: boolean,
  imageContext: string,
  apiKey?: string,
  isFormattingMode?: boolean
): Promise<GenerationResult>

// 分析图片
export const analyzeImage = async (
  base64Image: string,
  mimeType: string,
  apiKey?: string
): Promise<string>
```

**Function Calling 工具：**
```typescript
const layoutArticleFunction = {
  name: 'layout_article',
  parameters: {
    title: string,
    digest: string,
    blocks: ArticleBlock[]
  }
}
```

**支持的块类型：**
- 基础: header, paragraph, card, list, quote, image, divider, code, callout, numbered_list, highlight, table
- 高级: qrcode, faq, countdown, progress, gift, contact, stats, testimonial, steps

---

### qwenService.ts

阿里云通义千问 (Qwen) AI 服务。

**API 端点：**
```
https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

**模型：** `qwen-plus`

**核心函数：**
```typescript
export const generateArticleStructureQwen = async (
  input: string,
  apiKey: string,
  useSearch: boolean,
  imageContext: string,
  isFormattingMode?: boolean
): Promise<GenerationResult>

// 图片分析
export const analyzeImageQwen = async (
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<string>

// 语音合成
export const generateSpeechQwen = async (
  text: string,
  apiKey: string
): Promise<ArrayBuffer>
```

---

### deepSeekService.ts

DeepSeek V3 AI 服务。

**API 端点：**
```
https://api.deepseek.com/chat/completions
```

**模型：** `deepseek-chat`

**核心函数：**
```typescript
export const generateArticleStructureDeepSeek = async (
  input: string,
  apiKey: string,
  isFormattingMode?: boolean
): Promise<GenerationResult>
```

**注意：** DeepSeek 不支持图像分析功能。

---

### dualAIService.ts

双AI并行系统，实现文案AI + 美化AI 的协作模式。

**架构：**
```
用户输入 → 文案AI (内容创作) → 美化AI (排版设计) → 最终输出
```

**核心类型：**

```typescript
// AI 记忆系统
interface AIMemory {
  contentHistory: ContentMemoryEntry[];  // 内容历史
  designHistory: DesignMemoryEntry[];    // 设计历史
  preferences: UserPreferences;           // 用户偏好
}

// 内容历史条目
interface ContentMemoryEntry {
  timestamp: number;
  topic: string;
  style: string;
  keywords: string[];
  feedback?: string;
}

// 设计历史条目
interface DesignMemoryEntry {
  timestamp: number;
  colorScheme: string[];
  preferredBlocks: BlockType[];
  feedback?: string;
}

// 用户偏好
interface UserPreferences {
  writingTone: 'formal' | 'casual' | 'professional' | 'creative';
  colorPalette: string[];
  preferredBlockTypes: BlockType[];
  contentLength: 'short' | 'medium' | 'long';
}
```

**核心函数：**

```typescript
// 双AI生成
export const generateWithDualAI = async (
  topic: string,
  config: {
    contentProvider: 'qwen' | 'deepseek';
    designProvider: 'qwen' | 'deepseek';
    contentApiKey: string;
    designApiKey: string;
  },
  memory: AIMemory,
  imageContext?: string
): Promise<{
  result: GenerationResult;
  memoryUpdate: Partial<AIMemory>;
  designNotes?: string;
}>

// 加载记忆
export const loadMemory = (): AIMemory

// 保存记忆
export const saveMemory = (memory: AIMemory): void
```

**Function Calling 工具：**

1. **Content AI 工具** - `generate_article_content`
   - 生成标题、摘要、章节、关键词、语调

2. **Design AI 工具** - `beautify_article`
   - 生成块布局、颜色方案、设计备注

---

## 📚 模板库

### designTemplates.ts

设计模板库，包含 45+ 预设 HTML 模板。

**模板分类：**

| 分类 | 英文 | 数量 | 示例 |
|------|------|------|------|
| 标题 | header | 9+ | 绸带标题、括号标题、渐变背景 |
| 卡片 | card | 8+ | 数据统计、图文卡片、特性卡片 |
| 列表 | list | 6+ | 图标列表、步骤流程、对比列表 |
| 引用 | quote | 2+ | 引用框、名人名言 |
| 提示 | callout | 3+ | 信息提示、警告、成功 |
| 分隔 | divider | 5+ | 表情分隔、双线、文字分隔 |
| 特殊 | special | 12+ | 二维码、福利框、FAQ、倒计时 |

**核心函数：**

```typescript
// 获取所有模板
export const allDesignTemplates: DesignTemplate[]

// 按分类获取
export const getTemplatesByCategory = (
  category: DesignTemplate['category']
): DesignTemplate[]

// 获取所有分类
export const getCategories = (): {
  id: string;
  name: string;
  nameZh: string;
}[]
```

**模板结构：**
```typescript
interface DesignTemplate {
  id: string;           // 唯一标识
  name: string;         // 英文名称
  nameZh: string;       // 中文名称
  category: 'header' | 'card' | 'list' | 'quote' | 'callout' | 'divider' | 'special';
  preview: string;      // 英文描述
  previewZh: string;    // 中文描述
  html: string;         // HTML 模板
}
```

---

### materialLibraryContent.ts

文案素材库，包含 40+ 预设文案模板。

**素材分类：**

| 分类 | 英文 | 图标 | 数量 |
|------|------|------|------|
| 开场白 | opening | 🎬 | 5+ |
| 结尾语 | closing | 🎯 | 5+ |
| 过渡语 | transition | 🔄 | 5+ |
| 行动号召 | cta | 📢 | 5+ |
| 名言警句 | quote | 💬 | 5+ |
| 问候语 | greeting | 👋 | 5+ |
| 公告 | announcement | 📣 | 5+ |
| 促销 | promotion | 🎁 | 5+ |

**核心函数：**

```typescript
// 获取所有素材
export const allTextMaterials: TextMaterial[]

// 按分类获取
export const getMaterialsByCategory = (
  category: TextMaterialCategory
): TextMaterial[]

// 获取分类信息
export const getTextMaterialCategories = (): {
  id: TextMaterialCategory;
  name: string;
  nameZh: string;
  icon: string;
  count: number;
}[]
```

**素材结构：**
```typescript
interface TextMaterial {
  id: string;
  name: string;           // 英文名称
  nameZh: string;         // 中文名称
  category: TextMaterialCategory;
  content: string;        // 文案内容
  tags: string[];         // 标签
}
```

---

## 📲 微信服务

### wechatService.ts

微信公众号 API 集成。

**API 端点：**
```
https://api.weixin.qq.com
```

**核心函数：**

```typescript
// 获取访问令牌
export const getAccessToken = async (
  appId: string,
  appSecret: string
): Promise<string>

// 上传图片
export const uploadImage = async (
  accessToken: string,
  imageData: string
): Promise<string>  // 返回 media_id

// 创建草稿
export const createDraft = async (
  accessToken: string,
  payload: WechatPayload
): Promise<void>
```

**CORS 注意事项：**

微信 API 不支持浏览器直接跨域请求，需要使用代理：

```javascript
// server.js 配置
const PROXY_URL = 'http://localhost:3001/api';
```

---

## 🔧 开发指南

### 添加新 AI 服务

1. 创建新的服务文件 `xxxService.ts`
2. 实现 `generateArticleStructure` 函数
3. 定义 Function Calling 工具
4. 在 `Editor.tsx` 中添加调用逻辑
5. 在 `types.ts` 中添加 AIProvider 枚举值

### 添加新模板

1. 在 `designTemplates.ts` 中添加模板对象
2. 设置正确的 category
3. 编写 HTML 模板代码
4. 添加到对应的模板数组

### 添加新文案素材

1. 在 `materialLibraryContent.ts` 中添加素材对象
2. 设置正确的 category
3. 添加相关标签
