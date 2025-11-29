# 微信公众号 AI 自动化发布助手 (WeChat AI Publisher)

<p align="center">
  <img src="https://img.shields.io/badge/version-1.2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB.svg" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/AI-Multi--Model-green.svg" alt="AI">
</p>

一个功能强大的 AI 驱动 Web 应用程序，旨在简化微信公众号内容的创作和发布流程。支持多AI模型、双AI并行架构、丰富的素材库和微信公众号一键发布。

## 📋 目录

- [功能特性](#-功能特性)
- [技术架构](#-技术架构)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [配置说明](#️-配置说明)
- [使用指南](#-使用指南)
- [API 参考](#-api-参考)

---

## 🚀 功能特性

### 🤖 多AI模型支持

| AI模型 | 提供商 | 功能 |
|--------|--------|------|
| Gemini 2.5 Flash | Google | 文本生成、搜索增强 |
| Gemini 3 Pro Preview | Google | 图像分析 |
| DeepSeek V3 | DeepSeek | 文本生成 |
| Qwen Plus | 阿里云 | 文本生成、图像分析、TTS |

### 🔀 双AI并行架构 (Dual AI System)

创新的双AI模式，让内容创作更专业：

- **文案AI (Content AI)**: 专注于内容创作、故事叙述、关键词提取
- **美化AI (Design AI)**: 专注于排版设计、颜色搭配、视觉呈现
- **记忆系统**: 自动记录用户偏好，优化后续生成效果

### 📚 素材库系统

#### 设计模板 (45+ 模板)
- 标题样式: 绸带标题、括号标题、渐变背景、标签式等
- 卡片样式: 数据统计、图文卡片、特性卡片、用户评价等
- 列表样式: 图标列表、步骤流程、对比列表等
- 特殊组件: 二维码区域、福利框、FAQ、联系方式、进度条、倒计时等

#### 文案素材 (40+ 预设)
- 开场白、结尾语、过渡语
- 行动号召 (CTA)、名言警句
- 问候语、公告、促销文案

### 🎨 21种内容块类型

| 基础块 (12种) | 高级块 (9种) |
|--------------|--------------|
| header, paragraph, card | qrcode (二维码) |
| list, numbered_list | faq (问答区) |
| quote, callout, highlight | countdown (倒计时) |
| image, divider, code, table | progress (进度条) |
| | gift (福利框) |
| | contact (联系方式) |
| | stats (数据统计) |
| | testimonial (用户评价) |
| | steps (步骤流程) |

### 📲 微信集成

- 草稿自动保存与恢复
- 图片上传到微信服务器
- 一键发布到公众号草稿箱

---

## 🛠 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Components          │  Services            │  Types         │
│  ├── Editor          │  ├── geminiService   │  ├── BlockType │
│  ├── HtmlEditor      │  ├── qwenService     │  ├── Article   │
│  ├── MaterialLibrary │  ├── deepSeekService │  └── ...       │
│  ├── AIToolsPanel    │  ├── dualAIService   │                │
│  └── ArticlePreview  │  ├── designTemplates │                │
│                      │  └── wechatService   │                │
├─────────────────────────────────────────────────────────────┤
│                     AI Providers                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────────┐  │
│  │ Google  │  │DeepSeek │  │  Qwen   │  │  Dual AI Mode  │  │
│  │ Gemini  │  │   V3    │  │  Plus   │  │ Content+Design │  │
│  └─────────┘  └─────────┘  └─────────┘  └────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   WeChat MP API                              │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **前端框架**: React 18 + TypeScript 5.5
- **构建工具**: Vite 5.4
- **UI样式**: Tailwind CSS + Material Icons
- **AI SDK**: @google/genai
- **后端代理**: Express.js + http-proxy-middleware

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

### Windows 快捷启动

```batch
# 开发模式
start.bat

# 生产模式
start-prod.bat
```

---

## 📁 项目结构

```
autowechatpush/
├── components/           # React 组件
│   ├── README.md         # 组件文档
│   ├── Editor.tsx        # 主编辑器
│   ├── HtmlEditor.tsx    # HTML 编辑器
│   ├── MaterialLibrary.tsx # 素材库
│   ├── AIToolsPanel.tsx  # AI 工具面板
│   └── ArticlePreview.tsx # 文章预览
├── services/             # AI 服务层
│   ├── README.md         # 服务文档
│   ├── geminiService.ts  # Google Gemini
│   ├── qwenService.ts    # 阿里云 Qwen
│   ├── deepSeekService.ts # DeepSeek
│   ├── dualAIService.ts  # 双AI系统
│   ├── designTemplates.ts # 设计模板库
│   ├── materialLibraryContent.ts # 文案素材库
│   └── wechatService.ts  # 微信API
├── types.ts              # TypeScript 类型定义
├── App.tsx               # 应用入口
├── server.js             # Express 代理服务器
└── vite.config.ts        # Vite 配置
```

详细文档请查看各目录下的 README.md 文件。

---

## ⚙️ 配置说明

### 1. AI 模型配置

在应用的 **Settings** 页面配置 API 密钥：

| 模型 | 密钥来源 |
|------|----------|
| Google Gemini | [Google AI Studio](https://aistudio.google.com/) |
| DeepSeek | [DeepSeek Platform](https://platform.deepseek.com/) |
| Qwen | [阿里云百炼](https://dashscope.console.aliyun.com/) |

### 2. 微信公众号配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **设置与开发** > **基本配置**
3. 获取 **AppID** 和 **AppSecret**
4. 将服务器 IP 添加到 **IP 白名单**
5. 在应用 Settings 页面填入凭证

### 3. CORS 代理配置

微信 API 不支持浏览器直接跨域请求，需配置代理：

```javascript
// server.js 已配置代理
// 生产环境请修改 PROXY_URL 为您的代理服务器地址
```

---

## 📖 使用指南

### 单AI模式

1. 选择AI模型 (Google/DeepSeek/Qwen)
2. 输入文章主题
3. (可选) 开启 Google Search 增强
4. (可选) 上传图片进行分析
5. 点击 **Generate Article** 生成

### 双AI模式 (推荐)

1. 选择 DeepSeek 或 Qwen 模型
2. 开启 **双AI模式** 开关
3. 输入主题后点击 **双AI生成**
4. 系统自动执行：文案AI创作 → 美化AI排版

### 使用素材库

1. 点击 **素材库** 按钮
2. 切换 **我的素材** / **预设文案** 标签
3. 选择分类，点击素材即可插入

### 发布到微信

1. 完成文章编辑
2. 点击 **Publish to WeChat**
3. 文章将保存到公众号草稿箱

---

## 📚 API 参考

### BlockType 枚举

```typescript
enum BlockType {
  // 基础块
  HEADER, PARAGRAPH, IMAGE, CARD, LIST, QUOTE,
  DIVIDER, CODE, CALLOUT, NUMBERED_LIST, HIGHLIGHT, TABLE,
  // 高级块
  QRCODE, FAQ, COUNTDOWN, PROGRESS, GIFT, 
  CONTACT, STATS, TESTIMONIAL, STEPS
}
```

### AI Memory 接口

```typescript
interface AIMemory {
  contentHistory: ContentMemoryEntry[];
  designHistory: DesignMemoryEntry[];
  preferences: UserPreferences;
}
```

### 双AI生成函数

```typescript
const result = await generateWithDualAI(topic, {
  contentProvider: 'qwen',
  designProvider: 'qwen',
  contentApiKey,
  designApiKey
}, aiMemory, imageContext);
```

---

## 💾 数据持久化

所有数据保存在浏览器 `localStorage` 中：

| Key | 内容 |
|-----|------|
| `wechat_editor_draft` | 当前草稿 |
| `wechat_creds` | 微信凭证 |
| `ai_provider` | 当前AI模型 |
| `dual_ai_memory` | 双AI记忆 |
| `wechat_material_library` | 用户素材 |

---

## 📄 License

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
