import { useState, useRef } from 'react';
import { aiApi } from '../../../services/apiClient';
import analytics from '../../../services/analytics';
import { GenerationResult } from '../../../services/geminiService';
import { loadMemory, saveMemory, AIMemory } from '../../../services/dualAIService';
import { ArticleBlock, GroundingSource, AIProvider } from '../../../types';

interface UseArticleGeneratorProps {
  aiProvider: AIProvider;
  onError: (msg: string) => void;
  setArticleTitle: (title: string) => void;
  setArticleDigest: (digest: string) => void;
  setHtmlContent: (html: string) => void;
  convertBlocksToHtml: (blocks: ArticleBlock[]) => string;
}

export const useArticleGenerator = ({
  aiProvider,
  onError,
  setArticleTitle,
  setArticleDigest,
  setHtmlContent,
  convertBlocksToHtml
}: UseArticleGeneratorProps) => {
  // Core generation states
  const [topic, setTopic] = useState('');
  const [userprompt, setUserprompt] = useState(''); // Custom user prompt for personalized generation
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [isFormattingMode, setIsFormattingMode] = useState(false); // Toggle between create and format modes
  const [useDualAI, setUseDualAI] = useState(false); // Dual AI Mode Toggle
  const [useSearch, setUseSearch] = useState(true); // Search toggle
  const [imageContext, setImageContext] = useState<string>('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Dual AI Memory State
  const [aiMemory, setAiMemory] = useState<AIMemory>(() => loadMemory());
  const [designNotes, setDesignNotes] = useState<string>('');

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Image stitch state
  const stitchFileInputRef = useRef<HTMLInputElement>(null);
  const [stitchLoading, setStitchLoading] = useState(false);

  // Features availability from backend
  const [featuresAvailable, setFeaturesAvailable] = useState({
    imageAnalysis: false,
    textToSpeech: false,
  });

  // Article content state
  const [sources, setSources] = useState<GroundingSource[]>([]);

  // Article Import State
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isAIFilling, setIsAIFilling] = useState(false);
  const [skipAIFill, setSkipAIFill] = useState(false);

  // Template Import State (for article generation)
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateUrl, setTemplateUrl] = useState('');
  const [isExtractingTemplate, setIsExtractingTemplate] = useState(false);
  const [articleTemplate, setArticleTemplate] = useState<any>(null);

  // Wrapper function for template URL updates - clears old template when URL changes
  const updateTemplateUrl = (newUrl: string) => {
    setTemplateUrl(newUrl);
    // Clear old template data when URL changes to ensure fresh extraction
    if (articleTemplate) {
      console.log('[updateTemplateUrl] URL changed, clearing old template data');
      setArticleTemplate(null);
    }
  };

  // Draft State
  const [foundDraft, setFoundDraft] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
        onError(isFormattingMode ? "Please enter the text you want to format." : "Please enter a topic.");
        return;
    }

    // Extract template if user chose to use template
    if (useTemplate && templateUrl.trim()) {
      try {
        setIsExtractingTemplate(true);
        const template = await extractArticleTemplate(templateUrl);
        setArticleTemplate(template);
      } catch (error) {
        console.warn('Template extraction failed, proceeding without template:', error);
        setArticleTemplate(null);
      } finally {
        setIsExtractingTemplate(false);
      }
    } else {
      setArticleTemplate(null);
    }

    setLoading(true);

    try {
      let result: GenerationResult;

      // Check if Dual AI mode is enabled
      if (useDualAI && !isFormattingMode) {
        // Dual AI Mode: Two-pass approach using backend API
        // Pass 1: Content AI - Expert content writer focused on storytelling
        // Pass 2: Design AI - Expert visual designer focused on layout and typography
        console.log('[useArticleGenerator] Using Dual AI Mode - Two-pass backend approach');

        // Pass 1: Content AI - Focus on high-quality content creation
        console.log('[useArticleGenerator] Dual AI Pass 1: Content AI Generation');
        const contentPrompt = `作为微信公众号的专业内容创作者，请为以下主题创作一篇高质量文章：

主题：${topic}
${imageContext ? `\n图片上下文：${imageContext}\n` : ''}

你的专长是创作引人入胜的故事，使用多样化的写作风格和丰富的语言表达。

请专注于：
- **清晰、引人注目的写作**：使用多样化的句式结构
- **故事叙述技巧**：包含引子、冲突、解决方案、情感线索
- **丰富的语言**：比喻、类比、修辞性问题、生动的描述
- **节奏和韵律**：混合使用简短有力的句子和流畅的长句
- **引人入胜的开头**：每个章节以吸引注意力的开场白开始
- **易于理解的例子**：使用读者能够产生共鸣的场景
- **准确的信息**：以娱乐的方式呈现
- **文化相关性**：适合中文受众，使用恰当的成语和典故

要求：
- 创建3-5个结构良好的章节，标题要有创意、吸引眼球
- 使用多样化的写作技巧：讲故事、比喻、修辞性问题
- 变化句式结构以增加阅读节奏感
- 为每个章节提炼关键要点，使用易记的措辞
- 添加情感触动点和可共鸣的场景
- 提取相关关键词用于SEO`;

        const contentResponse = await aiApi.generate({
          message: contentPrompt,
          provider: aiProvider,
          useSearch: true, // Always use search for content AI
          imageContext: imageContext || undefined,
          isFormattingMode: false,
        });

        if (!contentResponse.success || !contentResponse.data) {
          throw new Error(contentResponse.error?.message || 'Content AI generation failed');
        }

        // Pass 2: Design AI - Transform content into beautiful visual layout
        console.log('[useArticleGenerator] Dual AI Pass 2: Design AI Beautification');

        // Build content summary for design AI
        const contentSummary = {
          title: contentResponse.data.title,
          digest: contentResponse.data.digest,
          blockCount: contentResponse.data.blocks.length,
          blocks: contentResponse.data.blocks.map((block: any) => ({
            type: block.type,
            contentPreview: block.content?.slice(0, 200) || '',
            title: block.title
          }))
        };

        const designPrompt = `作为微信公众号的专业视觉设计师和创意作者，请将以下文章内容转化为精美的"秀米风格"排版布局。

文章标题：${contentSummary.title}
文章摘要：${contentSummary.digest}

原始内容概览（共${contentSummary.blockCount}个内容块）：
${JSON.stringify(contentSummary.blocks, null, 2)}

你的专长是创建美观、引人入胜的文章布局，使用丰富多样的内容呈现方式和排版设计。

请专注于：
- **视觉多样性**：使用不同的区块类型（卡片、提示框、引用、高亮、表格）
- **丰富的色彩设计**：应用鲜艳的颜色（red, blue, purple, orange, gold, green, pink, cyan, gradient）
- **卓越的排版**：使用不同的字体大小和粗细建立视觉层次：
  - fontSize: 'xlarge' 用于醒目的标题和关键统计数据
  - fontSize: 'large' 用于重要观点和令人难忘的引用
  - fontSize: 'small' 用于脚注和次要信息
  - fontWeight: 'bold' 用于关键短语和强调
  - fontStyle: 'italic' 用于引用和特殊术语
- **语言多样性**：使用多样化的句式结构和引人入胜的措辞增强内容
- **适当的视觉层次**：有效使用标题、副标题和强调区块
- **引人入胜的格式**：添加表情图标、创意标题和吸引注意力的元素
- **移动端友好的布局**：确保在移动设备上的可读性

要求：
- 使用至少4-5种不同的颜色以实现视觉多样性
- 应用排版变化（如上所述）
- 为关键点使用卡片，配以创意、吸引人的标题
- 使用适当级别的标题（1、2、3）和引人入胜的语言
- 在章节之间添加不同样式的分隔线
- 为重要提示使用提示框，配以相关的表情图标
- 为令人难忘的陈述或励志句子添加引用区块
- 为令人惊讶的事实或关键短语使用高亮区块
- 使每个章节在视觉上具有独特性，拥有自己的颜色主题和排版
- 变化内容呈现方式：混合简短有力的陈述和详细的解释

请返回优化后的完整文章结构。`;

        const designResponse = await aiApi.generate({
          message: designPrompt,
          provider: aiProvider,
          useSearch: false,
          isFormattingMode: true, // Use formatting mode for beautification
        });

        if (!designResponse.success || !designResponse.data) {
          // If beautification fails, use content from pass 1
          console.warn('[useArticleGenerator] Design AI beautification failed, using content from Content AI');
          result = {
            title: contentResponse.data.title,
            digest: contentResponse.data.digest,
            blocks: contentResponse.data.blocks as any as ArticleBlock[],
            sources: contentResponse.data.sources,
          };
        } else {
          // Use beautified version, preserving original title and digest if design didn't provide them
          result = {
            title: designResponse.data.title || contentResponse.data.title,
            digest: designResponse.data.digest || contentResponse.data.digest,
            blocks: designResponse.data.blocks as any as ArticleBlock[],
            sources: [...(contentResponse.data.sources || []), ...(designResponse.data.sources || [])],
          };
          console.log('[useArticleGenerator] Dual AI complete - Content AI + Design AI passes succeeded');
        }

      } else {
        // Standard single-pass generation
        console.log('[useArticleGenerator] Using standard backend API with provider:', aiProvider);

        const response = await aiApi.generate({
          message: topic,
          provider: aiProvider,
          useSearch: useSearch,
          imageContext: imageContext || undefined,
          isFormattingMode: isFormattingMode,
          userprompt: userprompt || undefined, // Include custom user prompt if provided
          template: articleTemplate || undefined, // Include template if available
        });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to generate article');
        }

        // Convert API response to GenerationResult type
        result = {
          title: response.data.title,
          digest: response.data.digest,
          blocks: response.data.blocks as any as ArticleBlock[],
          sources: response.data.sources,
        };
        console.log('[useArticleGenerator] Backend API generated article successfully');
      }

      setArticleTitle(result.title);
      setArticleDigest(result.digest);
      setSources(result.sources);

      const generatedHtml = (result as any).html ?? convertBlocksToHtml(result.blocks);
      setHtmlContent(generatedHtml);

      // Track article generation event
      analytics.track('article_generate', {
        provider: aiProvider,
        useDualAI,
        useSearch,
        hasImage: !!imageContext,
        topicLength: topic.length,
      });

    } catch (e: any) {
      console.error('[useArticleGenerator] Article generation error:', e);
      onError(e.message || "Failed to generate article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Base64 Preview always works
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const mimeType = file.type;
      setUploadedImagePreview(reader.result as string);

      // Image analysis - feature is only available if backend has Qwen configured
      // UI elements that trigger this are only shown when featuresAvailable.imageAnalysis is true
      if (aiProvider === AIProvider.QWEN && featuresAvailable.imageAnalysis) {
        setAnalyzingImage(true);
        try {
          // TODO: Implement backend endpoint for image analysis that uses backend Qwen keys
          // Backend endpoint should accept base64 image and return analysis
          onError("图片分析功能暂未实现后端接口，请联系管理员。");
        } catch (err: any) {
          onError("Failed to analyze image: " + err.message);
        } finally {
          setAnalyzingImage(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStitchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readers = files.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.readAsDataURL(file);
    }));

    Promise.all(readers)
      .then(async (imgs) => {
        const validImgs = imgs.filter(Boolean);
        if (!validImgs.length) return;
        setStitchLoading(true);
        const resp = await fetch('/api/v1/utility/stitch-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: validImgs })
        });
        if (!resp.ok) throw new Error('Stitch failed');
        const data = await resp.json();
        const stitchedHtml = data.data?.html || data.html;
        if (!stitchedHtml) return;

        // Insert at cursor - this will need to be passed from parent component
        // For now, we'll append to existing content
        // Note: setHtmlContent expects a string, not a function
        setHtmlContent(stitchedHtml);
      })
      .catch((err) => {
        console.error(err);
        onError('拼接服务调用失败，请重试');
      })
      .finally(() => {
        setStitchLoading(false);
        if (e.target) e.target.value = '';
      });
  };

  const handleTTS = async () => {
    if (aiProvider === AIProvider.DEEPSEEK) {
        onError("TTS is not supported with DeepSeek.");
        return;
    }

    if (isPlaying) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsPlaying(false);
      return;
    }

    // This will need htmlContent to be passed from parent or accessed differently
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = ''; // Will need to be passed from parent
    const textToRead = tempDiv.textContent || tempDiv.innerText || "";

    if (textToRead.length < 5) {
        onError("Content too short to read.");
        return;
    }

    // TTS feature is only available if backend has Qwen configured
    // This function should only be called when featuresAvailable.textToSpeech is true
    // (The TTS button is conditionally rendered based on this check)

    try {
      setIsPlaying(true);

      // TODO: Implement backend endpoint for TTS that uses backend Qwen keys
      // Backend endpoint should accept text and return audio buffer
      onError("文字转语音功能暂未实现后端接口，请联系管理员。");
      setIsPlaying(false);
    } catch (err: any) {
      onError("Failed to generate speech: " + err.message);
      setIsPlaying(false);
    }
  };

  const handleImportArticle = async () => {
    if (!importUrl.trim()) {
      onError('Please enter a WeChat article URL');
      return;
    }

    // Show disclaimer on first use
    const hasSeenDisclaimer = localStorage.getItem('import-disclaimer-seen');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
      return;
    }

    await performImport();
  };

  const acceptDisclaimerAndImport = () => {
    localStorage.setItem('import-disclaimer-seen', 'true');
    setShowDisclaimer(false);
    performImport();
  };

  const performImport = async () => {
    setIsImporting(true);
    const urlToImport = importUrl; // Capture URL before state might change
    try {
      const response = await aiApi.importUrl(urlToImport);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to import article');
      }

      let { title, digest, blocks } = response.data;

      // Check if user wants to skip AI filling
      if (!skipAIFill) {
        try {
          setIsAIFilling(true);
          // AI fill imported content
          const filledBlocks = await fillImportedContentWithAI(blocks, title, aiProvider);
          blocks = filledBlocks;
        } catch (fillError: any) {
          console.warn('AI filling failed, using original content:', fillError);
          // Continue with original content if AI filling fails
        } finally {
          setIsAIFilling(false);
        }
      }

      // Update article state - these setters need to be passed from parent
      setArticleTitle(title);
      setArticleDigest(digest);

      // Convert blocks to HTML
      const html = convertBlocksToHtml(blocks);
      setHtmlContent(html);

      // Close import dialog
      setShowImportDialog(false);
      setImportUrl('');
      setSkipAIFill(false); // Reset for next import

      // Track import event (don't let analytics errors affect the import)
      try {
        analytics.track('article_import', {
          url: urlToImport,
          blocksCount: blocks.length,
          aiFilled: !skipAIFill,
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

    } catch (e: any) {
      onError(e.message || 'Failed to import article. Please check the URL and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  // Save/Load Draft Logic
  const saveLocalDraft = () => {
    // This will need articleTitle, articleDigest, htmlContent from parent
    const draft = {
      title: '', // Will be passed from parent
      digest: '', // Will be passed from parent
      content: '', // Will be passed from parent
      topic: topic,
      timestamp: Date.now()
    };
    localStorage.setItem('wechat_editor_draft', JSON.stringify(draft));
    alert("Draft saved locally!");

    // Track draft save event
    analytics.track('article_save_draft', {
      titleLength: 0, // Will be passed from parent
      contentLength: 0, // Will be passed from parent
    });
  };

  const loadLocalDraft = () => {
    const raw = localStorage.getItem('wechat_editor_draft');
    if (!raw) return;
    const draft = JSON.parse(raw);

    // Update states - setters need to be passed from parent
    setArticleTitle(draft.title || 'Untitled');
    setArticleDigest(draft.digest || '');
    setHtmlContent(draft.content || '');
    setTopic(draft.topic || '');
    setFoundDraft(false);
  };

  const handleInsertHookContent = (hook: string) => {
    // This will need to be implemented to insert at cursor or append
    // For now, we'll just return the hook content to be handled by parent
    return hook;
  };

  const handleInsertCTAContent = (cta: string) => {
    // Similar to handleInsertHookContent
    return cta;
  };

  // Initialize features availability
  const fetchFeatures = async () => {
    try {
      const response = await aiApi.getFeatures();
      if (response.success && response.data) {
        setFeaturesAvailable({
          imageAnalysis: response.data.features.imageAnalysis,
          textToSpeech: response.data.features.textToSpeech,
        });
      }
    } catch (error) {
      console.error('Failed to fetch features availability:', error);
      // Default to false if fetch fails
      setFeaturesAvailable({
        imageAnalysis: false,
        textToSpeech: false,
      });
    }
  };

  // AI Fill Imported Content
  const fillImportedContentWithAI = async (
    blocks: any[],
    articleTitle: string,
    aiProvider: AIProvider
  ): Promise<any[]> => {
    console.log('[fillImportedContentWithAI] Starting AI fill for imported content');

    // Identify blocks that need filling
    const blocksToFill = identifyFillableBlocks(blocks);
    if (blocksToFill.length === 0) {
      console.log('[fillImportedContentWithAI] No blocks need filling');
      return blocks;
    }

    console.log(`[fillImportedContentWithAI] Found ${blocksToFill.length} blocks to fill`);

    // Fill blocks in batches to avoid overwhelming the API
    const batchSize = 3;
    const filledBlocks = [...blocks];

    for (let i = 0; i < blocksToFill.length; i += batchSize) {
      const batch = blocksToFill.slice(i, i + batchSize);
      const batchPromises = batch.map(async ({ index, block, fillType, plainText, originalHtml }) => {
        try {
          const filledContent = await generateContentForBlock(block, fillType, plainText, originalHtml, articleTitle, aiProvider);
          return { index, content: filledContent };
        } catch (error) {
          console.error(`[fillImportedContentWithAI] Failed to fill block ${index}:`, error);
          return { index, content: originalHtml }; // Keep original HTML on failure
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ index, content }) => {
        filledBlocks[index] = { ...filledBlocks[index], content };
      });
    }

    console.log('[fillImportedContentWithAI] AI fill completed');
    return filledBlocks;
  };

  // Identify blocks that need AI filling (recognize real WeChat article content)
  const identifyFillableBlocks = (blocks: any[]): Array<{ index: number; block: any; fillType: string; plainText: string; originalHtml: string }> => {
    const fillableBlocks: Array<{ index: number; block: any; fillType: string; plainText: string; originalHtml: string }> = [];

    blocks.forEach((block, index) => {
      const content = block.content || '';

      // Extract plain text from HTML content
      const plainText = extractPlainText(content);

      // Identify all blocks with substantial text content (headers, paragraphs, quotes, cards, callouts)
      if (['header', 'paragraph', 'quote', 'card', 'callout'].includes(block.type) &&
          plainText.trim() &&
          plainText.length > 5) {  // Has substantial content

        const fillType = block.type === 'header' ? 'title' : 'content';
        fillableBlocks.push({
          index,
          block,
          fillType,
          plainText,
          originalHtml: content
        });
      }
    });

    return fillableBlocks;
  };

  // Extract plain text from HTML content (handles WeChat article rich text)
  const extractPlainText = (html: string): string => {
    if (!html) return '';

    try {
      // Create a temporary DOM element to extract text content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    } catch (error) {
      console.warn('[extractPlainText] Failed to parse HTML:', error);
      return html; // Fallback to original content
    }
  };

  // Generate content for a specific block (handles WeChat rich text HTML)
  const generateContentForBlock = async (
    block: any,
    fillType: string,
    plainText: string,
    originalHtml: string,
    articleTitle: string,
    aiProvider: AIProvider
  ): Promise<string> => {
    let prompt = '';

    switch (fillType) {
      case 'title':
        prompt = `基于文章标题"${articleTitle}"，为这个段落生成一个吸引人的小标题。要求：简洁、有创意、相关性强，不超过20个字。当前内容是："${plainText}"，请根据这个内容生成一个更好的标题。`;
        break;
      case 'content':
        prompt = `基于文章标题"${articleTitle}"，为这个段落生成相关的内容。要求：信息丰富、有逻辑、适合微信公众号阅读，保持与原文相似的长度和风格。当前内容是："${plainText.slice(0, 200)}${plainText.length > 200 ? '...' : ''}"，请根据这个内容生成一个更好的版本。`;
        break;
      default:
        return originalHtml;
    }

    try {
      const response = await aiApi.generate({
        message: prompt,
        provider: aiProvider,
        useSearch: false,
        isFormattingMode: false,
      });

      if (response.success && response.data?.blocks?.[0]?.content) {
        const newPlainText = response.data.blocks[0].content;
        // Replace the plain text content while preserving HTML structure and styles
        return replacePlainTextInHtml(originalHtml, plainText, newPlainText);
      }

      // Fallback: return original HTML
      return originalHtml;
    } catch (error) {
      console.error(`[generateContentForBlock] Failed to generate content for ${fillType}:`, error);
      return originalHtml;
    }
  };

  // Replace plain text content in HTML while preserving structure and styles
  const replacePlainTextInHtml = (originalHtml: string, oldPlainText: string, newPlainText: string): string => {
    if (!originalHtml || !oldPlainText || !newPlainText) return originalHtml;

    try {
      // For WeChat articles, we need a more sophisticated replacement
      // For now, use a simple approach: split the text and replace
      const trimmedOld = oldPlainText.trim();
      const trimmedNew = newPlainText.trim();

      if (trimmedOld === trimmedNew) return originalHtml;

      // Simple text replacement - this may not work perfectly for complex HTML
      // but should work for most WeChat article structures
      return originalHtml.replace(trimmedOld, trimmedNew);

    } catch (error) {
      console.warn('[replacePlainTextInHtml] Failed to replace text, returning original:', error);
      return originalHtml;
    }
  };

  // Extract article template from URL
  const extractArticleTemplate = async (url: string): Promise<any> => {
    console.log('[extractArticleTemplate] Extracting template from URL:', url);

    const response = await aiApi.importUrl(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to extract template');
    }

    const { title, digest, blocks } = response.data;

    // Return complete template with original blocks and content info
    const template = {
      title,
      digest,
      originalBlocks: blocks,
      contentBlocks: blocks.filter((block: any) =>
        ['header', 'paragraph', 'quote', 'card', 'callout'].includes(block.type) &&
        block.content && block.content.trim()
      ).map((block: any, index: number) => ({
        index: blocks.indexOf(block), // Original position in blocks array
        type: block.type,
        originalContent: block.content,
        level: block.level || 1,
        style: block.style,
        title: block.title,
        icon: block.icon,
        language: block.language,
        alignment: block.alignment,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
        fontStyle: block.fontStyle,
      })),
      statistics: {
        totalBlocks: blocks.length,
        contentBlocks: blocks.filter((b: any) =>
          ['header', 'paragraph', 'quote', 'card', 'callout'].includes(b.type) &&
          b.content && b.content.trim()
        ).length,
      }
    };

    console.log('[extractArticleTemplate] Template extracted with', template.contentBlocks.length, 'content blocks');
    return template;
  };

  // Check for existing draft on mount
  const checkForDraft = () => {
    const raw = localStorage.getItem('wechat_editor_draft');
    if (raw) {
      setFoundDraft(true);
    }
  };

  return {
    // State
    topic,
    setTopic,
    userprompt,
    setUserprompt,
    loading,
    analyzingImage,
    isFormattingMode,
    setIsFormattingMode,
    useDualAI,
    setUseDualAI,
    useSearch,
    setUseSearch,
    imageContext,
    setImageContext,
    uploadedImagePreview,
    setUploadedImagePreview,
    aiMemory,
    setAiMemory,
    designNotes,
    setDesignNotes,
    isPlaying,
    setIsPlaying,
    sources,
    featuresAvailable,
    foundDraft,
    setFoundDraft,

    // Import states
    showImportDialog,
    setShowImportDialog,
    importUrl,
    setImportUrl,
    isImporting,
    showDisclaimer,
    setShowDisclaimer,
    isAIFilling,
    skipAIFill,
    setSkipAIFill,

    // Template states (for article generation)
    useTemplate,
    setUseTemplate,
    templateUrl,
    setTemplateUrl: updateTemplateUrl, // Use wrapper function that clears old template
    isExtractingTemplate,
    articleTemplate,

    // Stitch states
    stitchFileInputRef,
    stitchLoading,

    // Handlers
    handleGenerate,
    handleImageUpload,
    handleStitchUpload,
    handleTTS,
    handleImportArticle,
    acceptDisclaimerAndImport,
    performImport,
    saveLocalDraft,
    loadLocalDraft,
    handleInsertHookContent,
    handleInsertCTAContent,

    // Utilities
    fetchFeatures,
    checkForDraft,
  };
};
