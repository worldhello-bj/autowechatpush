# 组件目录 (Components)

本目录包含所有 React 组件，用于构建微信公众号 AI 发布助手的用户界面。

## 📁 组件列表

| 组件 | 文件 | 描述 |
|------|------|------|
| Editor | `Editor.tsx` | 主编辑器组件 |
| HtmlEditor | `HtmlEditor.tsx` | HTML 源码编辑器 |
| MaterialLibrary | `MaterialLibrary.tsx` | 素材库组件 |
| AIToolsPanel | `AIToolsPanel.tsx` | AI 工具面板 |
| ArticlePreview | `ArticlePreview.tsx` | 文章预览组件 |
| Slider | `Slider.tsx` | 滑动条组件 |

---

## 📝 组件详解

### Editor.tsx

主编辑器组件，是应用的核心。

**功能：**
- 文章主题输入
- AI 模型选择 (Google/DeepSeek/Qwen)
- 双AI模式切换
- 图片上传与分析
- 搜索增强选项
- 文章生成与编辑
- 发布到微信

**关键状态：**
```typescript
const [topic, setTopic] = useState('');
const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.GOOGLE);
const [useDualAI, setUseDualAI] = useState(false);
const [htmlContent, setHtmlContent] = useState<string>('');
```

**核心函数：**
- `handleGenerate()` - 生成文章内容
- `convertBlocksToHtml()` - 将 AI 返回的块转换为 HTML
- `handlePublish()` - 发布到微信

**支持的块类型渲染：**
- 基础块: header, paragraph, card, list, quote, image, divider, code, callout, numbered_list, highlight, table
- 高级块: qrcode, faq, countdown, progress, gift, contact, stats, testimonial, steps

---

### MaterialLibrary.tsx

素材库组件，管理用户素材和预设文案。

**功能：**
- 我的素材 (图片/文字上传与管理)
- 预设文案 (40+ 预设模板)
- 分类筛选
- 搜索功能
- 一键插入

**标签页：**
1. **我的素材** - 用户上传的图片和文字
2. **预设文案** - 系统预设的文案模板

**预设文案分类：**
- 开场白 (opening)
- 结尾语 (closing)
- 过渡语 (transition)
- 行动号召 (cta)
- 名言警句 (quote)
- 问候语 (greeting)
- 公告 (announcement)
- 促销 (promotion)

**使用示例：**
```tsx
<MaterialLibrary
  onSelectMaterial={(material) => handleSelect(material)}
  onInsertImage={(imageUrl) => insertImage(imageUrl)}
  onInsertText={(text) => insertText(text)}
/>
```

---

### AIToolsPanel.tsx

AI 工具面板，提供多种 AI 辅助功能。

**功能：**
- 标题优化建议
- 关键词提取
- 风格调整建议
- 开场白生成
- CTA 生成

**AI 设置滑动条：**
- 创意度 (0-100)
- 内容长度 (短/中/长)
- 正式程度 (0-100)
- 情感强度 (0-100)

---

### HtmlEditor.tsx

HTML 源码编辑器，用于直接编辑文章 HTML。

**功能：**
- 语法高亮
- 代码格式化
- 实时预览同步
- 复制粘贴

---

### ArticlePreview.tsx

文章预览组件，模拟微信公众号显示效果。

**功能：**
- 手机模拟器样式
- 实时内容渲染
- 滚动查看

---

### Slider.tsx

自定义滑动条组件，用于 AI 设置参数调节。

**属性：**
```typescript
interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
}
```

---

## 🎨 样式规范

所有组件使用 Tailwind CSS 进行样式设计：

- **主色调**: green-600 (微信绿)
- **辅助色**: purple-600 (AI相关), blue-600 (信息提示)
- **圆角**: rounded-lg, rounded-xl
- **阴影**: shadow-md, shadow-lg

---

## 📦 依赖

组件依赖以下库：
- `react` - React 核心
- `react-dom` - DOM 渲染
- 自定义类型来自 `../types.ts`
- AI 服务来自 `../services/`

---

## 🔧 开发指南

### 添加新组件

1. 在 `components/` 目录创建 `.tsx` 文件
2. 使用 TypeScript 定义 Props 接口
3. 使用 Tailwind CSS 进行样式设计
4. 在 `Editor.tsx` 或 `App.tsx` 中引用

### 组件命名规范

- 文件名: PascalCase (如 `MyComponent.tsx`)
- 组件名: PascalCase (如 `const MyComponent: React.FC`)
- Props 接口: `${ComponentName}Props`
