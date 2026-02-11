import { ContentBlock } from '../../../types';

/**
 * 从HTML字符串中提取内容块，用于AI重写
 * @param html HTML字符串
 * @returns ContentBlock数组，包含DOM引用用于后续回填
 */
export function extractContentBlocksFromHTML(html: string): ContentBlock[] {
  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const blocks: ContentBlock[] = [];
  let index = 0;

  // 递归遍历所有文本节点
  function traverseNodes(node: Node): void {
    // 跳过script、style等非可视元素
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // 跳过不可见或装饰性元素（包括SVG，避免破坏模板中的SVG结构）
      if (['script', 'style', 'meta', 'link', 'svg'].includes(tagName)) {
        return;
      }

      // 检查是否是纯装饰性元素（没有实质内容的）
      if (isDecorativeElement(element)) {
        return;
      }
    }

    // 处理文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length >= 5) { // 跳过过短的文本
        const parentElement = node.parentElement;
        if (parentElement) {
          const blockType = determineBlockType(parentElement);
          const charLimit = calculateCharLimit(text);

          blocks.push({
            index,
            type: blockType,
            originalText: text,
            charLimit,
            domRef: node // 保存Text节点引用用于回填，避免textContent覆盖兄弟节点
          });

          index++;
        }
      }
    }

    // 递归处理子节点
    node.childNodes.forEach(traverseNodes);
  }

  traverseNodes(tempDiv);
  return blocks;
}

/**
 * 判断元素是否为装饰性元素（没有实质内容）
 */
function isDecorativeElement(element: Element): boolean {
  const text = element.textContent?.trim() || '';
  const hasChildren = element.children.length > 0;

  // 如果只有表情符号、特殊字符等装饰性内容
  if (text.length <= 3 && /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]*$/u.test(text)) {
    return true;
  }

  // 如果是空的容器元素
  if (!text && !hasChildren) {
    return true;
  }

  return false;
}

/**
 * 根据DOM元素确定内容块类型
 */
function determineBlockType(element: Element): ContentBlock['type'] {
  const tagName = element.tagName.toLowerCase();
  const className = element.className?.toLowerCase() || '';
  const text = element.textContent?.trim() || '';

  // 标题识别
  if (['h1', 'h2'].includes(tagName)) {
    return 'title';
  }
  if (['h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    return 'subtitle';
  }

  // 视觉标题识别 (Visual Header Detection)
  const style = element.getAttribute('style') || '';
  const textLength = text.length;
  
  // 检查字体大小和粗细
  const isBold = style.includes('font-weight: bold') || style.includes('font-weight: 700') || style.includes('font-weight: 600') || style.includes('font-weight:800');
  // 简单检查 font-size (假设 px 单位)
  const hasLargeFont = /font-size:\s*([2-9][0-9]|[1-9][0-9]{2,})px/.test(style) || /font-size:\s*1[8-9]px/.test(style);
  
  // 检查类名
  const isTitleClass = className.includes('title') || className.includes('header') || className.includes('caption');

  // 检查是否包含 strong/b 标签作为主要内容
  const hasStrongTag = element.querySelector('strong, b') !== null;
  const onlyHasStrong = hasStrongTag && element.textContent?.trim() === element.querySelector('strong, b')?.textContent?.trim();

  // 综合判定
  if (textLength > 0 && textLength < 100) {
    if (hasLargeFont || (isBold && (isTitleClass || onlyHasStrong || textLength < 50))) {
      return 'title';
    }
  }

  // 引用识别
  if (tagName === 'blockquote' || className.includes('quote') || text.startsWith('"') || text.startsWith('「')) {
    return 'quote';
  }

  // 列表项识别
  if (tagName === 'li') {
    return 'list-item';
  }

  // 默认作为段落
  return 'paragraph';
}

/**
 * 计算字符限制（原文长度±20%）
 */
function calculateCharLimit(text: string): number {
  const baseLength = text.length;
  const minLimit = Math.max(10, Math.floor(baseLength * 0.8)); // 至少10字符
  const maxLimit = Math.ceil(baseLength * 1.3); // 最多增加30%
  return Math.min(maxLimit, Math.max(minLimit, baseLength));
}

/**
 * 将AI重写结果回填到原始DOM中
 * @param originalBlocks 原始内容块（包含DOM引用）
 * @param aiResponse AI重写响应
 * @returns 更新后的HTML字符串
 */
export function injectRewrittenContent(
  originalBlocks: ContentBlock[],
  aiResponse: { blocks: { index: number; newContent: string }[] }
): string {
  // 创建响应数据的映射
  const responseMap = new Map<number, string>();
  aiResponse.blocks.forEach(block => {
    responseMap.set(block.index, block.newContent);
  });

  // 更新DOM节点（通过Text节点的nodeValue，避免textContent破坏子元素结构）
  originalBlocks.forEach(block => {
    const newContent = responseMap.get(block.index);
    if (newContent && block.domRef) {
      block.domRef.nodeValue = newContent;
    }
  });

  // 从第一个根元素获取更新后的HTML
  // 注意：domRef现在指向Text节点，需要向上遍历找到根容器（tempDiv）
  if (originalBlocks.length > 0 && originalBlocks[0].domRef) {
    let rootNode: Node = originalBlocks[0].domRef;
    // 向上遍历找到最顶层的容器（即extractContentBlocksFromHTML创建的disconnected tempDiv）
    // tempDiv.parentNode为null（因为未连接到document），所以循环会在tempDiv处停止
    while (rootNode.parentNode && rootNode.parentNode.nodeType !== Node.DOCUMENT_NODE) {
      rootNode = rootNode.parentNode;
    }
    if (rootNode instanceof Element) {
      return rootNode.innerHTML;
    }
  }

  return '';
}

/**
 * 生成AI重写系统提示词
 */
export function generateRewriteSystemPrompt(topic: string): string {
  return `# Role
你是一位精通新媒体排版与内容创作的AI专家。你的任务是根据给定的文章结构，重写一篇关于主题 "${topic}" 的文章。

# Constraints (绝对准则)
1. **结构对齐**：输入包含 N 个段落对象，输出必须严格包含 N 个段落对象。顺序不得打乱。
2. **类型适配**：
   - type="title"：必须写成吸引人的标题。
   - type="subtitle"：写成简洁有力的副标题。
   - type="quote"：必须写成金句、总结或引言风格。
   - type="paragraph"：写成流畅的正文。
   - type="list-item"：写成列表项风格。
3. **字数控制**：参考 \`charLimit\` 字段。允许浮动 ±30%，但严禁过长导致排版溢出。
4. **格式要求**：输出纯 JSON 格式，键名必须为 \`index\` 和 \`newContent\`。

# Input Context
我将提供原文的结构数组。请忽略原文的具体内容，仅参考其长度和文风逻辑，用新主题 "${topic}" 彻底重写。

# Output Format Example
{
  "blocks": [
    { "index": 0, "newContent": "新文章的主标题" },
    { "index": 1, "newContent": "这是第一段重写的正文内容..." }
  ]
}`;
}

/**
 * 验证AI响应格式
 */
export function validateRewriteResponse(response: any): boolean {
  if (!response || typeof response !== 'object') return false;
  if (!Array.isArray(response.blocks)) return false;

  return response.blocks.every((block: any) =>
    typeof block === 'object' &&
    typeof block.index === 'number' &&
    typeof block.newContent === 'string'
  );
}

/**
 * 处理AI响应解析错误，提供兜底策略
 */
export function handleRewriteResponseFallback(
  originalBlocks: ContentBlock[],
  rawResponse: string
): { blocks: { index: number; newContent: string }[] } {
  try {
    // 尝试提取JSON部分
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (validateRewriteResponse(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('JSON解析失败，尝试正则提取');
  }

  // 如果解析失败，使用对齐截断策略
  console.warn('AI响应格式错误，使用兜底策略：保留原文内容');
  return {
    blocks: originalBlocks.map(block => ({
      index: block.index,
      newContent: block.originalText // 保留原文
    }))
  };
}
