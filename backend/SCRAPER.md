# 微信公众号抓取与解析服务 (WeChat Scraper Service) 技术文档

| 文档版本 | v1.0 |
| --- | --- |
| **最后更新** | 2026-01-17 |
| **状态** | 已投产 / 维护中 |
| **涉及模块** | `scraper-controller`, `scraper-service` |

## 1. 概述 (Overview)

本服务旨在将微信公众号（mp.weixin.qq.com）的富文本内容抓取并转换为系统原生的**结构化数据块 (Article Blocks)**。
目标是"**去样式化、保语义、扁平化**"，使得抓取的内容可以在编辑器中被二次编辑，同时保留图片、代码块和基础格式。

## 2. 核心流程 (Core Workflow)

服务处理流程主要分为三个阶段：

1. **Fetcher (获取)**: 伪造请求头绕过基础反爬。
2. **Cleaner (清洗)**: DOM 标准化，修复懒加载图片，提取 SVG。
3. **Parser (解析)**: 将嵌套 DOM 转化为扁平的 Block 列表。

```mermaid
graph LR
A[输入 URL] --> B(Fetcher: 获取 HTML)
B --> C(Cleaner: DOM 清洗/图片修复)
C --> D(Parser: DFS 遍历与分块)
D --> E[输出: ArticleBlock[]]

```

## 3. 关键技术实现与难点突破

### 3.1 图片懒加载修复 (Image Recovery)

微信文章图片默认使用 `data-src` 实现懒加载，`src` 属性通常为空或为占位符。直接清洗会导致图片丢失。

* **问题**：直接移除 `data-src` 会导致图片链接永久丢失。
* **解决方案**：在清洗阶段（Clean Phase），优先读取 `data-src` 或 `data-original`，将其赋值给标准 `src` 属性，之后再移除多余属性。

### 3.2 线性解析策略 (Linear Parsing via DFS)

微信文章排版结构极其复杂（Section 嵌套 Section），使用基于标签（如仅查找 `<p>`）的解析方式会破坏"图文混排"的顺序。

* **算法**：采用 **深度优先遍历 (DFS)**。
* **逻辑**：
* 从 `body` 开始递归遍历。
* 遇到**文本节点** -> 追加到当前文本块。
* 遇到**原子节点**（图片、标题、代码块） -> 截断当前文本块，插入原子块，保持流式顺序。
* 遇到**容器节点**（div, section） -> 递归进入。



### 3.3 代码块启发式识别 (Heuristic Code Block Detection)

微信中不存在标准的 `<pre><code>` 结构，代码块通常是由第三方编辑器生成的复杂 `section/span` 嵌套结构，极易被误判为普通文本。

* **策略**：在 DFS 遍历中加入**拦截器 (Interceptor)**。
* **识别特征**：
1. **标签匹配**：`pre`, `code`。
2. **Class 特征**：包含 `snippet`, `code`, `syntax`, `highlight` 等关键词。
3. **样式特征**：`font-family` 包含 `Consolas`, `Monaco`, `monospace` 等等宽字体。


* **处理**：一旦命中特征，停止向下递归，直接提取该容器内的纯文本（并保留换行符），生成 `BlockType.CODE`。

## 4. 数据结构定义

输出结果为 `ArticleBlock` 数组，前端编辑器可直接渲染。

```typescript
enum BlockType {
  HEADER = 'header',
  PARAGRAPH = 'paragraph',
  IMAGE = 'image',
  CODE = 'code',
  QUOTE = 'quote'
}

interface ArticleBlock {
  id: string;      // UUID
  type: BlockType;
  content: string; // 文本内容 或 图片URL
  level?: 1 | 2 | 3; // 仅 header 类型有效
  language?: string; // 仅 code 类型有效
}

```

## 5. 维护与排查指南

### 5.1 常见问题 (FAQ)

**Q: 抓取回来的内容图片显示裂图？**

* **A**: 检查 `cleanContent` 函数。确保没有在赋值 `src` 之前就删除了 `data-src`。同时检查防盗链（Referer 必须设为 `https://mp.weixin.qq.com/`）。

**Q: 代码块变成了一堆乱序的文字？**

* **A**: 说明启发式识别失效。请检查目标文章的代码块 DOM 结构，看是否使用了新的排版工具。可以在 `isCodeBlockWrapper` 函数中添加新的 `class` 关键词或 `data-type` 特征。

**Q: 文章只有第一段，后面都没了？**

* **A**: 可能是 DFS 遍历中抛出了异常导致中断，或者微信文章结构有变（例如内容不在 `#js_content` 中）。检查 `extractMetadata` 和根节点选择器。

### 5.2 依赖库

* `cheerio`: HTML 解析与操作 (必须配置 `{ xmlMode: false }` 以支持 HTML5 宽松模式)。
* `axios` / `fetch`: 网络请求。

---

## 6. 代码片段示例 (Parser 核心)

*仅展示 DFS 遍历入口逻辑，完整代码见仓库 `src/services/scraper.ts*`

```typescript
// 伪代码示例
const traverse = (element) => {
  // 1. 拦截代码块
  if (isCodeBlockWrapper(element)) {
     pushBlock('CODE', extractTextPreservingNewlines(element));
     return; // 停止递归
  }

  // 2. 处理图片
  if (element.tagName === 'img') {
     pushBlock('IMAGE', element.attr('src'));
     return;
  }

  // 3. 递归容器
  if (element.children) {
     element.children.forEach(traverse);
  }
}

```

---

**下一步建议：**

* **单元测试**：建立一个 `test/fixtures` 目录，保存几个典型排版（纯文本、复杂图文、包含代码块）的微信文章 HTML，编写 Jest 测试用例确保 `parseHtmlToBlocks` 输出符合预期。
* **SVG 支持**：目前 SVG 仅作占位符处理，未来可考虑转换为图片服务生成的 PNG 链接。
* **缓存策略**：考虑添加 Redis 缓存已抓取文章，避免重复抓取。

## 7. API 接口规范

### POST /api/v1/ai/import-url

**请求体**:
```json
{
  "url": "https://mp.weixin.qq.com/s/xxxxx",
  "mode": "structure_only"  // 可选参数
}
```

**响应体**:
```json
{
  "success": true,
  "data": {
    "title": "文章标题",
    "author": "作者名",
    "digest": "文章摘要",
    "blocks": [
      {
        "id": "uuid",
        "type": "paragraph|header|image|code|quote",
        "content": "内容文本或图片URL",
        "level": 1|2|3,  // header类型有效
        "language": "javascript"  // code类型有效
      }
    ]
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL|QUOTA_EXCEEDED|FETCH_FAILED",
    "message": "错误描述"
  }
}
```

## 8. 性能与监控

### 性能指标
- **响应时间**: 平均 2-5 秒（网络因素为主）
- **成功率**: > 95%（正常文章）
- **资源消耗**: 内存峰值约 50MB/请求

### 监控要点
- 抓取失败率统计
- 图片占位符替换成功率
- 代码块识别准确率
- 用户配额消耗统计

## 9. 扩展性设计

### 支持新内容类型
在 `BlockType` 枚举中添加新类型：
```typescript
enum BlockType {
  // 现有类型...
  VIDEO = 'video',
  TABLE = 'table',
  CARD = 'card'
}
```

### 自定义解析规则
扩展 `parseWeChatSections` 函数支持新的DOM模式匹配。

### 缓存策略
考虑添加 Redis 缓存已抓取文章，避免重复抓取。
