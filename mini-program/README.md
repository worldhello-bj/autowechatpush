# WeChat AI Publisher (微信 AI 发文助手)

这是一个基于 Taro + React 开发的微信小程序，旨在为微信公众号运营者提供强大的 AI 辅助创作和排版工具。它集成了 DeepSeek、通义千问 (Qwen) 和 Google Gemini 等多种先进 AI 模型，实现从选题、写作到排版、发布的一站式自动化流程。

## ✨ 核心功能

### 1. 双 AI 协作系统 (Dual AI)
本项目首创 "内容+设计" 双 AI 协作模式：
- **内容 AI (Content AI)**: 负责文章的选题策划、大纲生成、正文写作和润色。支持 DeepSeek 和 Qwen。
- **设计 AI (Design AI)**: 负责文章的视觉排版、配色方案选择和组件布局。
- **智能记忆**: 系统会记录用户的写作风格和设计偏好，越用越懂你。

### 2. 多模型支持
- **DeepSeek V3**: 强大的中文写作能力，适合深度内容创作。
- **通义千问 (Qwen-Plus)**: 阿里通义大模型，兼顾创作与逻辑。
- **Google Gemini**: 支持多模态（文本生成、图像分析、语音合成）。

### 3. 丰富的素材与模板库
- **设计模板库**: 内置 45+ 精美 HTML 组件模板（标题、卡片、列表、引用、分割线等）。
- **文案素材库**: 40+ 预设金句和常用语（开场白、结尾、引导关注、促销活动等）。

### 4. 强大的编辑器
- **所见即所得**: 实时预览排版效果。
- **一键美化**: 基于 AI 的全文自动排版。
- **智能工具**: 包含扩写、润色、摘要生成、标题生成等辅助工具。

### 5. 微信公众号集成
- **一键同步**: 将编辑好的文章直接保存为公众号草稿。
- **素材管理**: 支持图片上传至微信素材库。

## 🛠️ 技术栈

- **框架**: [Taro](https://taro.zone/) v4 + React v18
- **语言**: TypeScript
- **样式**: Tailwind CSS (via `weapp-tailwindcss`), SCSS
- **构建**: Webpack / Vite
- **代码规范**: ESLint, Prettier, Husky, Commitlint

## 🚀 快速开始

### 1. 环境准备
确保你的开发环境已安装：
- Node.js (推荐 v18+)
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3. 配置环境
在项目根目录复制 `.env.development` 或 `.env.production` 并配置必要的环境变量（如后端 API 地址）。

### 4. 启动开发服务器

**微信小程序:**
```bash
npm run dev:weapp
```
启动后，使用 **微信开发者工具** 导入 `dist/weapp` 目录即可预览。

**H5 预览:**
```bash
npm run dev:h5
```

## 📂 项目结构

```
├── config/             # Taro 编译配置
├── src/
│   ├── assets/         # 静态资源 (图片, 图标)
│   ├── components/     # 通用组件
│   ├── context/        # React Context (如 AuthContext)
│   ├── hooks/          # 自定义 Hooks (AI 逻辑, 编辑器逻辑)
│   ├── pages/          # 页面文件
│   │   ├── index/      # 首页 (编辑器主界面)
│   │   ├── drafts/     # 草稿箱
│   │   ├── auth/       # 登录/授权
│   │   ├── settings/   # 设置页
│   │   └── ...
│   ├── services/       # 业务逻辑层 (API, AI 服务, 微信集成)
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── app.config.ts   # 小程序全局配置
│   └── app.tsx         # 入口文件
└── package.json
```

## 📖 使用指南

1.  **配置 API Key**: 在“设置”页面填入 DeepSeek/Qwen/Gemini 的 API Key（或连接后端服务）。
2.  **开始创作**: 在首页输入文章主题，选择 AI 模型。
3.  **生成与编辑**: 点击“生成”，AI 将自动产出大纲和正文。使用底部工具栏插入模板或调整样式。
4.  **同步公众号**: 完成编辑后，点击保存或同步按钮，文章将上传至绑定的微信公众号草稿箱。

## 🤝 贡献与反馈
欢迎提交 Issue 或 Pull Request 来改进这个项目！

---
*Generated via Gemini CLI*
