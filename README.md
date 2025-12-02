# 微信公众号 AI 自动化发布助手 (WeChat AI Publisher)

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB.svg" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/AI-Multi--Model-green.svg" alt="AI">
</p>

一个功能强大的 AI 驱动 Web 应用程序，旨在简化微信公众号内容的创作和发布流程。支持多AI模型、双AI并行架构、丰富的素材库（含40+预设文案、35+SVG组件）和微信公众号一键发布。

## 📋 目录

- [功能特性](#-功能特性)
- [素材库系统](#-素材库系统)
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

### 🎨 22种内容块类型

| 基础块 (12种) | 高级块 (10种) |
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
| | **svg (SVG图形)** |

### 📲 微信集成

- 草稿自动保存与恢复
- 图片上传到微信服务器
- 一键发布到公众号草稿箱

---

## 📚 素材库系统

素材库是本应用的核心功能之一，提供丰富的预设内容和用户自定义素材管理。

### 我的素材

支持上传和管理多种媒体类型：

| 类型 | 格式 | 说明 |
|------|------|------|
| 🖼️ 图片 | JPG, PNG, WebP | 静态图片素材 |
| 🎬 视频 | MP4, WebM | 视频素材，支持播放预览 |
| 🎞️ GIF | GIF | 动态图片，带GIF标识 |
| 🎨 SVG | SVG | 矢量图形，支持文件上传或代码粘贴 |
| 📝 文字 | 文本 | 自定义文字模板 |

### 预设文案库 (40+ 模板)

专业文案模板，一键插入：

| 分类 | 数量 | 说明 |
|------|------|------|
| 🎬 开场白 | 8个 | 提问式、故事式、数据式等开场方式 |
| 🎯 结尾语 | 6个 | 总结式、励志式、金句式等结尾方式 |
| 🔗 过渡语 | 6个 | 承上启下、举例说明、重点强调等 |
| 📣 行动号召 | 7个 | 关注、分享、评论、点赞等CTA |
| 💬 名言警句 | 8个 | 孔子、老子、爱因斯坦、乔布斯等名言 |
| 👋 问候语 | 5个 | 早安、晚安、周末、节日问候 |
| 📢 公告 | 4个 | 新功能、活动、重要通知、维护公告 |
| 🎁 促销 | 5个 | 限时特惠、折扣、赠品、秒杀等 |

### SVG组件库 (35+ 组件) 🆕

精心设计的SVG小组件，支持直接插入文章：

| 分类 | 数量 | 包含组件 |
|------|------|----------|
| ⭐ 图标 | 8个 | 星星、爱心、对勾、警告、信息、礼物、火焰、闪电 |
| 🎀 装饰 | 6个 | 丝带横幅、NEW徽章、HOT徽章、促销标签、角标、引号装饰 |
| ➖ 分割线 | 5个 | 波浪线、圆点线、菱形线、箭头线、叶子线 |
| 🏷️ 徽章 | 5个 | VIP、官方认证、品质保证、免费、推荐 |
| ➡️ 箭头 | 5个 | 右箭头、下箭头、弯曲箭头、双箭头、手指指向 |
| 💬 社交 | 6个 | 微信、微博、QQ、电话、邮箱、位置图标 |

### 设计模板库 (45+ 模板)

丰富的HTML设计模板：

- 标题样式: 绸带标题、括号标题、渐变背景、标签式等
- 卡片样式: 数据统计、图文卡片、特性卡片、用户评价等
- 列表样式: 图标列表、步骤流程、对比列表等
- 特殊组件: 二维码区域、福利框、FAQ、联系方式、进度条、倒计时等

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
│                      │  ├── materialLibraryContent           │
│                      │  ├── presetMediaMaterials (NEW)       │
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
- **安全**: DOMPurify (SVG/HTML 安全过滤)
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
│   ├── Editor.tsx        # 主编辑器
│   ├── HtmlEditor.tsx    # HTML 编辑器 (支持光标位置保存)
│   ├── MaterialLibrary.tsx # 素材库 (支持视频/GIF/SVG)
│   ├── AIToolsPanel.tsx  # AI 工具面板
│   ├── LogSettings.tsx   # 日志设置面板 🆕
│   └── ArticlePreview.tsx # 文章预览
├── services/             # 服务层
│   ├── geminiService.ts  # Google Gemini
│   ├── qwenService.ts    # 阿里云 Qwen
│   ├── deepSeekService.ts # DeepSeek
│   ├── dualAIService.ts  # 双AI系统
│   ├── designTemplates.ts # 设计模板库 (45+)
│   ├── materialLibraryContent.ts # 文案素材库 (40+)
│   ├── presetMediaMaterials.ts # SVG组件库 (35+)
│   ├── logger.ts         # 统一日志系统 🆕
│   └── wechatService.ts  # 微信API
├── types.ts              # TypeScript 类型定义
├── App.tsx               # 应用入口
├── server.js             # Express 代理服务器
└── vite.config.ts        # Vite 配置
```

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
2. 选择标签页：
   - **我的素材**: 管理上传的图片/视频/GIF/SVG
   - **预设文案**: 40+专业文案模板
   - **SVG组件**: 35+精美SVG小组件 🆕
3. 点击素材即可插入到光标位置

### 上传素材

支持多种媒体格式：
- **图片**: 点击"图片"按钮上传
- **视频**: 点击"视频"按钮上传MP4/WebM
- **GIF**: 点击"GIF"按钮上传动态图片
- **SVG**: 上传SVG文件或直接粘贴SVG代码

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
  CONTACT, STATS, TESTIMONIAL, STEPS, SVG
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

### HtmlEditor 光标保存

```typescript
// 保存光标位置 (用于模态框交互)
htmlEditorRef.current.saveCursorPosition();

// 在光标位置插入内容
htmlEditorRef.current.insertHtmlAtCursor(htmlContent);
```

### 日志系统 (Logger)

统一的日志机制，支持多级日志、模块分类、性能计时：

```typescript
import { createLogger, loggers, setLogLevel, LogLevel } from './services/logger';

// 使用预设日志器
loggers.wechat.info('Requesting access token...');
loggers.gemini.error('API call failed:', error);

// 创建模块日志器
const logger = createLogger('MyModule');
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// 性能计时
logger.time('operation');
// ... 执行操作
logger.timeEnd('operation'); // 输出: MyModule: operation: 123.45ms

// 分组日志
logger.group('Batch operations');
logger.info('Step 1');
logger.info('Step 2');
logger.groupEnd();

// 设置日志级别
setLogLevel(LogLevel.WARN); // 只显示 WARN 和 ERROR
```

#### 图形界面设置 🆕

在 **Settings** 页面新增了 **日志设置** 面板，提供可视化的日志配置：

- 📊 **日志级别选择**: 可视化选择 DEBUG/INFO/WARN/ERROR/NONE
- 🧪 **测试日志**: 一键发送测试日志验证配置
- 🗑️ **清空控制台**: 快速清除控制台输出
- ↩️ **恢复默认**: 重置为默认日志级别

![Log Settings UI](https://img.shields.io/badge/Settings-Log%20Settings-green)

| 日志级别 | 说明 |
|---------|------|
| DEBUG | 详细调试信息 (开发环境默认) |
| INFO | 一般信息 (生产环境默认) |
| WARN | 警告信息 |
| ERROR | 错误信息 |
| NONE | 禁用所有日志 |

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
| `app_log_level` | 日志级别 |

---

## 📄 License

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 🔄 更新日志

### v1.3.0 (最新)
- ✨ 新增35+ SVG组件库（图标、装饰、分割线、徽章、箭头、社交图标）
- 🎬 素材库支持视频、GIF、SVG文件上传
- 🔧 修复素材库插入时光标位置丢失问题
- 🔒 使用DOMPurify进行SVG安全过滤
- 📊 统一日志系统 + UI设置面板
- 🖥️ **新增Electron桌面应用支持 (EXE打包)**

### v1.2.0
- 🤖 双AI并行架构
- 📚 40+预设文案模板
- 🎨 45+设计模板

---

## 🖥️ 桌面应用 (EXE)

本项目支持打包为桌面应用程序，详见 [BUILD.md](./BUILD.md)。

### 快速打包

```bash
# 安装依赖
npm install

# 打包 Windows EXE
npm run electron:build:win

# 打包 macOS DMG
npm run electron:build:mac

# 打包 Linux AppImage
npm run electron:build:linux
```

### 输出文件

| 平台 | 文件类型 | 位置 |
|------|----------|------|
| Windows | NSIS安装程序 | `release/微信AI发布助手-1.3.0-win-x64.exe` |
| Windows | 便携版 | `release/微信AI发布助手-1.3.0-win-x64-portable.exe` |
| macOS | DMG镜像 | `release/微信AI发布助手-1.3.0.dmg` |
| Linux | AppImage | `release/微信AI发布助手-1.3.0.AppImage` |

### 开发调试

```bash
# Electron 开发模式 (热重载)
npm run electron:dev
```
