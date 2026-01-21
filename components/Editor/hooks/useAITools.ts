import { useState } from 'react';
import { aiApi } from '../../../services/apiClient';
import { StyleSuggestion } from '../../../services/deepSeekService';
import { AIProvider } from '../../../types';
import { extractContentBlocksFromHTML, injectRewrittenContent } from '../utils/domRewriter';

// StyleSuggestion type still needed for component state
export interface AIToolsState {
  showAITools: boolean;
  aiToolLoading: boolean;
  titleSuggestions: string[];
  keywords: string[];
  styleSuggestions: StyleSuggestion[];
  generatedHook: string;
  generatedCTA: string;
  showRewriteModal: boolean;
  rewriteTopic: string;
  isRewriting: boolean;
}

export interface AIToolsActions {
  setShowAITools: (show: boolean) => void;
  handleGenerateTitles: () => Promise<void>;
  handleGenerateSummary: () => Promise<void>;
  handleExtractKeywords: () => Promise<void>;
  handleSuggestStyles: () => Promise<void>;
  handleGenerateHook: (style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising') => Promise<void>;
  handleGenerateCTA: (ctaType: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection') => Promise<void>;
  handlePolishContent: (tone: 'professional' | 'casual' | 'formal' | 'creative') => Promise<void>;
  handleRewriteContent: (style: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational') => Promise<void>;
  handleTranslate: (targetLang: 'zh' | 'en') => Promise<void>;
  handleExpandContent: (style: 'detailed' | 'examples' | 'storytelling') => Promise<void>;
  handleDOMRewrite: () => Promise<void>;
  setShowRewriteModal: (show: boolean) => void;
  setRewriteTopic: (topic: string) => void;
}

export interface UseAIToolsProps {
  aiProvider: AIProvider;
  topic: string;
  htmlContent: string;
  setArticleTitle: (title: string) => void;
  setArticleDigest: (digest: string) => void;
  setHtmlContent: (content: string) => void;
  onError: (msg: string) => void;
}

export const useAITools = ({
  aiProvider,
  topic,
  htmlContent,
  setArticleTitle,
  setArticleDigest,
  setHtmlContent,
  onError
}: UseAIToolsProps): AIToolsState & AIToolsActions => {
  const [showAITools, setShowAITools] = useState(false);
  const [aiToolLoading, setAiToolLoading] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([]);
  const [generatedHook, setGeneratedHook] = useState('');
  const [generatedCTA, setGeneratedCTA] = useState('');
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteTopic, setRewriteTopic] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  const getPlainTextContent = (): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const textToSafeHtml = (text: string): string => {
    return text.split('\n').map(line => `<p style="color:#888; text-align:center;">${line}</p>`).join('');
  };

  const handleGenerateTitles = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('generateTitles', content, helperProvider, { count: 5 });
      if (response.success && response.data) {
        const titles = Array.isArray(response.data.result) ? response.data.result as string[] : [];
        setTitleSuggestions(titles);
      } else {
        throw new Error(response.error?.message || 'Failed to generate titles');
      }
    } catch (e: any) {
      onError(e.message || "Failed to generate titles");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateSummary = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('generateSummary', content, helperProvider, { maxLength: 120 });
      if (response.success && response.data) {
        const summary = typeof response.data.result === 'string' ? response.data.result : '';
        setArticleDigest(summary);
      } else {
        throw new Error(response.error?.message || 'Failed to generate summary');
      }
    } catch (e: any) {
      onError(e.message || "Failed to generate summary");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleExtractKeywords = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('extractKeywords', content, helperProvider, { count: 10 });
      if (response.success && response.data) {
        const kws = Array.isArray(response.data.result) ? response.data.result as string[] : [];
        setKeywords(kws);
      } else {
        throw new Error(response.error?.message || 'Failed to extract keywords');
      }
    } catch (e: any) {
      onError(e.message || "Failed to extract keywords");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleSuggestStyles = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('suggestStyles', content, helperProvider);
      if (response.success && response.data) {
        // Backend returns simplified style suggestions, adapt to UI format
        const styles = Array.isArray(response.data.result)
          ? (response.data.result as Array<{style: string; preview: string}>).map(s => ({
              style: s.style,
              preview: s.preview,
              reason: '',
              colorScheme: [] as string[],
              mood: s.style
            } as StyleSuggestion))
          : [];
        setStyleSuggestions(styles);
      } else {
        throw new Error(response.error?.message || 'Failed to suggest styles');
      }
    } catch (e: any) {
      onError(e.message || "Failed to suggest styles");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateHook = async (style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising'): Promise<void> => {
    if (!topic.trim()) {
      onError("Please enter a topic first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('generateHook', topic, helperProvider, { style });
      if (response.success && response.data) {
        const hook = typeof response.data.result === 'string' ? response.data.result : '';
        setGeneratedHook(hook);
      } else {
        throw new Error(response.error?.message || 'Failed to generate hook');
      }
    } catch (e: any) {
      onError(e.message || "Failed to generate hook");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateCTA = async (ctaType: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection'): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const response = await aiApi.helper('generateCTA', content, aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek', { type: ctaType });
      if (response.success && response.data) {
        const cta = typeof response.data.result === 'string' ? response.data.result : '';
        setGeneratedCTA(cta);
      } else {
        throw new Error(response.error?.message || 'Failed to generate CTA');
      }
    } catch (e: any) {
      onError(e.message || "Failed to generate CTA");
    } finally {
      setAiToolLoading(false);
    }
  };

  // Helper to handle structure-aware content processing
  const processStructuredContent = async (
    action: string, 
    options: any = {}
  ): Promise<void> => {
    if (!htmlContent.trim()) {
      onError("请先创建一些文章内容");
      return;
    }

    setAiToolLoading(true);
    try {
      // 1. Extract content blocks
      const contentBlocks = extractContentBlocksFromHTML(htmlContent);
      
      if (contentBlocks.length === 0) {
        onError("无法解析文章内容，请检查HTML格式");
        return;
      }

      // 2. Prepare JSON payload (array of strings)
      const textArray = contentBlocks.map(b => b.originalText);
      const jsonContent = JSON.stringify(textArray);

      // 3. Call AI Helper
      const providerName = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper(action as any, jsonContent, providerName, options);

      if (response.success && response.data) {
        let resultData = response.data.result;
        
        // 4. Parse response
        let resultArray: string[] = [];
        if (Array.isArray(resultData)) {
          resultArray = resultData as string[];
        } else if (typeof resultData === 'string') {
          // Try parsing if string
          try {
            resultArray = JSON.parse(resultData);
          } catch {
            // Fallback: if not JSON, treat as single block? No, this will likely fail mapping.
            // Split by newlines as last resort fallback
            resultArray = resultData.split('\n').filter(s => s.trim());
          }
        }

        if (!Array.isArray(resultArray) || resultArray.length === 0) {
           throw new Error("AI response format error");
        }

        // 5. Map back to blocks
        // Note: AI might return different number of blocks if it merged/split.
        // But our prompt asks for strict alignment.
        // We map simply by index.
        const rewriteResponse = {
          blocks: contentBlocks.map((block, idx) => ({
            index: block.index,
            newContent: resultArray[idx] || block.originalText // Fallback to original if missing
          }))
        };

        // 6. Inject back
        const newHtml = injectRewrittenContent(contentBlocks, rewriteResponse);
        setHtmlContent(newHtml);
      } else {
        throw new Error(response.error?.message || 'AI processing failed');
      }
    } catch (e: any) {
      console.error(e);
      onError(e.message || "处理失败，请重试");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handlePolishContent = async (tone: 'professional' | 'casual' | 'formal' | 'creative'): Promise<void> => {
    await processStructuredContent('polishContent', { tone });
  };

  const handleRewriteContent = async (style: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational'): Promise<void> => {
    await processStructuredContent('rewriteContent', { style });
  };

  const handleTranslate = async (targetLang: 'zh' | 'en'): Promise<void> => {
    await processStructuredContent('translateContent', { targetLanguage: targetLang });
  };

  const handleExpandContent = async (style: 'detailed' | 'examples' | 'storytelling'): Promise<void> => {
    await processStructuredContent('expandContent', { style });
  };

  const handleDOMRewrite = async (): Promise<void> => {
    if (!rewriteTopic.trim()) {
      onError("请输入新的主题");
      return;
    }

    if (!htmlContent.trim()) {
      onError("请先创建一些文章内容");
      return;
    }

    setIsRewriting(true);
    try {
      // 1. 解析HTML内容块
      const contentBlocks = extractContentBlocksFromHTML(htmlContent);

      if (contentBlocks.length === 0) {
        onError("无法解析文章内容，请检查HTML格式");
        return;
      }

      // 2. 准备发送给AI的数据（去除DOM引用）
      const blocksForAI = contentBlocks.map(({ domRef, ...block }) => block);

      // 3. 调用AI重写API
      const response = await aiApi.rewrite({
        topic: rewriteTopic,
        blocks: blocksForAI
      });

      if (response.success && response.data) {
        // 4. 将AI结果回填到原始DOM中
        const newHtml = injectRewrittenContent(contentBlocks, response.data);
        setHtmlContent(newHtml);

        // 关闭模态框
        setShowRewriteModal(false);
        setRewriteTopic('');
      } else {
        throw new Error(response.error?.message || '重写失败');
      }
    } catch (e: any) {
      onError(e.message || "文章重写失败");
    } finally {
      setIsRewriting(false);
    }
  };

  return {
    // State
    showAITools,
    aiToolLoading,
    titleSuggestions,
    keywords,
    styleSuggestions,
    generatedHook,
    generatedCTA,
    showRewriteModal,
    rewriteTopic,
    isRewriting,

    // Actions
    setShowAITools,
    handleGenerateTitles,
    handleGenerateSummary,
    handleExtractKeywords,
    handleSuggestStyles,
    handleGenerateHook,
    handleGenerateCTA,
    handlePolishContent,
    handleRewriteContent,
    handleTranslate,
    handleExpandContent,
    handleDOMRewrite,
    setShowRewriteModal,
    setRewriteTopic,
  };
};
