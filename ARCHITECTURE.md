# WeChat Article Replicator - 工程化架构文档

## 概述

本文档描述了微信公众号排版复刻工具的工程化架构设计，实现了"样式与内容分离"的自动化生产流程。

## 架构设计

### 核心管线 (Pipeline)

```
Input (输入层) → Config (配置层) → Transform (转换层) → Inline (内联层) → Output (输出层)
```

### 1. Input Layer (输入层)

**功能**: 接收并解析微信文章内容

**实现文件**: 
- `backend/src/services/scraperService.ts`
- `backend/src/controllers/scraperController.ts`

**流程**:
```typescript
// 步骤1: 抓取文章
const scrapedArticle = await scrapeWeChatArticle(url);

// 步骤2: 提取元数据
{ title, author, digest }

// 步骤3: 清洗HTML (移除script, 替换图片, 提取SVG)
{ cleanedHtml, svgBlocks }
```

### 2. Config Layer (配置层)

**功能**: 定义主题的"视觉DNA"

**实现文件**: `backend/src/config/theme-config.ts`

**主题配置结构**:
```typescript
interface ThemeConfig {
  name: string;
  colors: {
    primaryBg: string;      // 主背景色
    accentRed: string;      // 强调红色
    accentYellow: string;   // 装饰黄色
    // ... more colors
  };
  typography: {
    letterSpacing: string;
    lineHeight: string;
    baseFontSize: string;
  };
  spacing: {
    sectionMargin: string;
    contentPadding: string;
    borderRadius: string;
  };
}
```

**预设主题**:
- `DEFAULT_THEME`: 红金学院风 (Red-Gold Academy)
- `BLUE_PROFESSIONAL_THEME`: 蓝色专业风

**使用示例**:
```typescript
import { getTheme, applyThemeToStyles } from './config/theme-config';

const theme = getTheme('red-gold-academy');
const styles = applyThemeToStyles(theme);

// 应用到HTML
const titleHtml = `<span style="${styles.title}">标题内容</span>`;
```

### 3. Transform Layer (转换层)

**功能**: 将内容映射到HTML骨架

**实现文件**: `backend/src/utils/content-transformer.ts`

**核心类**: `ContentTransformer`

**转换流程**:
```typescript
// 创建转换器
const transformer = new ContentTransformer({
  theme: getTheme('red-gold-academy'),
  simplifyDOM: true,          // 简化DOM结构
  maxNestingLevel: 3          // 限制嵌套深度
});

// 转换内容块
const blocks: ContentBlock[] = [
  { type: 'header', content: '第一部分：核心观点', level: 2 },
  { type: 'paragraph', content: '正文内容...' },
  { type: 'image', content: 'https://...' }
];

const html = transformContent(blocks, config);
```

**支持的内容类型**:
- `header`: 标题 (H1-H6)
- `paragraph`: 段落
- `image`: 图片
- `list`: 列表
- `quote`: 引用/强调
- `divider`: 分隔线

### 4. Decorator System (装饰器系统)

**功能**: 可复用的视觉装饰元素

**实现文件**: `backend/src/config/svg-decorators.ts`

**可用装饰器**:
```typescript
- YELLOW_DOTS_DECORATOR  // 黄色圆点
- RED_DOTS_DECORATOR     // 红色圆点
- CORNER_TRIANGLE        // 三角装饰
- DIVIDER_LINE           // 分隔线
- STAR_ACCENT            // 星标装饰
```

**使用示例**:
```typescript
import { decorateTitle, getDecorator } from './config/svg-decorators';

// 为标题添加装饰
const decoratedTitle = decorateTitle('我的标题', 'yellow-dots', 'red-gold-academy');

// 手动注入装饰器
const decorator = getDecorator('corner-triangle');
const content = injectDecorator(myContent, decorator, 'before');
```

### 5. Inline Layer (内联层)

**功能**: 确保所有样式以内联形式存在

**实现**: 所有生成的HTML都直接使用 `style="..."` 属性

**关键原则**:
```typescript
// ❌ 错误：使用CSS类 (微信编辑器会移除)
<div class="red-title">标题</div>
<style>.red-title { background: red; }</style>

// ✅ 正确：内联样式
<div style="background-color: #c60201; color: #fff; padding: 5px 15px;">标题</div>
```

**未来增强**: 可集成 `juice` 库实现自动CSS内联转换:
```typescript
import juice from 'juice';

const htmlWithClasses = '<div class="title">Hello</div>';
const css = '.title { color: red; }';
const inlined = juice(htmlWithClasses, { extraCss: css });
// 结果: <div style="color: red;">Hello</div>
```

### 6. Output Layer (输出层)

**功能**: 生成最终可用的HTML

**实现文件**: `backend/src/controllers/scraperController.ts`

**输出格式**:
```typescript
{
  success: true,
  data: {
    title: "文章标题",
    author: "作者",
    digest: "摘要",
    blocks: [
      {
        id: "uuid-1",
        type: "paragraph",
        content: "<section style='...'><img src='...' /></section>"
      },
      // ... more blocks
    ]
  }
}
```

## 工程化最佳实践

### 1. 样式与内容分离

**Before (硬编码)**:
```typescript
const html = `<div style="background: #c60201; color: #fff;">标题</div>`;
```

**After (配置化)**:
```typescript
const theme = getTheme('red-gold-academy');
const styles = applyThemeToStyles(theme);
const html = `<div style="${styles.title}">标题</div>`;
```

### 2. 避免深层嵌套

**原则**: 限制 `<section>` 嵌套深度 ≤ 3层

**实现**:
```typescript
const config: TransformConfig = {
  theme: getTheme(),
  simplifyDOM: true,
  maxNestingLevel: 3
};
```

### 3. 装饰器模式

**原则**: 将重复的视觉元素提取为可复用组件

**示例**:
```typescript
// 不要在每个标题里重复写SVG代码
// 使用装饰器系统
const decoratedTitle = decorateTitle('标题', 'yellow-dots');
```

### 4. 主题切换

**支持多主题**:
```typescript
// 红金学院风
const theme1 = getTheme('red-gold-academy');

// 蓝色专业风
const theme2 = getTheme('blue-professional');

// 自定义主题
const customTheme: ThemeConfig = {
  name: 'my-theme',
  colors: { /* ... */ },
  // ...
};
```

## API 使用示例

### 基础使用 (导入微信文章)

```typescript
POST /api/v1/ai/import-url

Request:
{
  "url": "https://mp.weixin.qq.com/s/xxxxx",
  "mode": "structure_only"
}

Response:
{
  "success": true,
  "data": {
    "title": "文章标题",
    "blocks": [ /* 结构化blocks */ ]
  }
}
```

### 高级使用 (自定义主题转换)

```typescript
// 在 scraperController.ts 中
import { transformContent } from '../utils/content-transformer';
import { getTheme } from '../config/theme-config';

// 使用自定义主题转换内容
const config = {
  theme: getTheme('blue-professional'),
  simplifyDOM: true
};

const html = transformContent(contentBlocks, config);
```

## 架构优势

1. **可维护性**: 主题配置集中管理，修改样式只需更新配置文件
2. **可扩展性**: 新增主题或装饰器无需修改核心逻辑
3. **可测试性**: 每层独立，便于单元测试
4. **可复用性**: 装饰器和主题可在不同项目间共享
5. **工程化**: 符合"关注点分离"和"单一职责"原则

## 未来扩展

1. **CSS内联工具集成**: 使用 `juice` 或 `inline-css` 支持CSS类自动转换
2. **Markdown支持**: 集成 `markdown-it`，支持从Markdown生成微信排版
3. **可视化编辑器**: 前端拖拽式主题定制界面
4. **模板市场**: 社区分享主题配置
5. **批量处理**: 支持批量导入和转换文章

## 相关文件

```
backend/
├── src/
│   ├── config/
│   │   ├── theme-config.ts      # 主题配置系统
│   │   └── svg-decorators.ts    # SVG装饰器
│   ├── utils/
│   │   └── content-transformer.ts # 内容转换器
│   ├── services/
│   │   └── scraperService.ts     # 抓取服务
│   └── controllers/
│       └── scraperController.ts  # 控制器
```

## 总结

本架构实现了文档中提出的工程化理念：

✅ **模块化管线**: Input → Config → Transform → Inline → Output
✅ **配置层**: 视觉DNA提取为主题配置
✅ **装饰器系统**: 可复用的视觉组件
✅ **样式内联**: 完全符合微信编辑器要求
✅ **简化DOM**: 避免过深嵌套
✅ **可扩展**: 易于添加新主题和装饰器

这为"内容 → 模板 → 样式"的自动化生产打下了坚实基础。
