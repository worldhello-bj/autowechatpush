import { useState } from 'react';
import { aiApi } from '../../services/apiClient';
import { StyleSuggestion } from '../../services/deepSeekService';
import { AIProvider } from '@shared/types';

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
  onQuotaConsumed?: () => void; // Callback to refresh user quota display
}

export const useAITools = ({
  aiProvider,
  topic,
  htmlContent,
  setArticleTitle,
  setArticleDigest,
  setHtmlContent,
  onError,
  onQuotaConsumed
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

  // Simplified plain text extraction using regex for Mini Program
  const getPlainTextContent = (): string => {
    return htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const handleGenerateTitles = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("请先生成一些文章内容");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('generateTitles', content, helperProvider, { count: 5 });
      if (response.success && response.data) {
        const titles = Array.isArray(response.data.result) ? response.data.result as string[] : [];
        setTitleSuggestions(titles);
        onQuotaConsumed?.(); // Refresh quota after consuming
      } else {
        throw new Error(response.error?.message || '生成标题失败');
      }
    } catch (e: any) {
      onError(e.message || "生成标题失败");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateSummary = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("请先生成一些文章内容");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('generateSummary', content, helperProvider, { maxLength: 120 });
      if (response.success && response.data) {
        const summary = typeof response.data.result === 'string' ? response.data.result : '';
        setArticleDigest(summary);
        onQuotaConsumed?.(); // Refresh quota after consuming
      } else {
        throw new Error(response.error?.message || '生成摘要失败');
      }
    } catch (e: any) {
      onError(e.message || "生成摘要失败");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleExtractKeywords = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("请先生成一些文章内容");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('extractKeywords', content, helperProvider, { count: 10 });
      if (response.success && response.data) {
        const kws = Array.isArray(response.data.result) ? response.data.result as string[] : [];
        setKeywords(kws);
        onQuotaConsumed?.(); // Refresh quota after consuming
      } else {
        throw new Error(response.error?.message || '提取关键词失败');
      }
    } catch (e: any) {
      onError(e.message || "提取关键词失败");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleSuggestStyles = async (): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("请先生成一些文章内容");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('suggestStyles', content, helperProvider);
      if (response.success && response.data) {
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
      }
    } catch (e: any) {
      onError(e.message || "建议风格失败");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateHook = async (style: any): Promise<void> => {
    if (!topic.trim()) {
      onError("请先输入主题");
      return;
    }
    setAiToolLoading(true);
    try {
      const helperProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
      const response = await aiApi.helper('generateHook', topic, helperProvider, { style });
      if (response.success && response.data) {
        const hook = typeof response.data.result === 'string' ? response.data.result : '';
        setGeneratedHook(hook);
      }
    } catch (e: any) {
      onError(e.message || "生成引言失败");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateCTA = async (ctaType: any): Promise<void> => {
    const content = getPlainTextContent();
    setAiToolLoading(true);
    try {
      const response = await aiApi.helper('generateCTA', content, aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek', { type: ctaType });
      if (response.success && response.data) {
        const cta = typeof response.data.result === 'string' ? response.data.result : '';
        setGeneratedCTA(cta);
      }
    } catch (e: any) {
      onError(e.message || "生成结尾失败");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handlePolishContent = async (tone: any): Promise<void> => {
    // Simplified: Just re-generate polished HTML
    onError("小程序暂不支持结构化润色，即将为您提供整文润色（开发中）");
  };

  const handleRewriteContent = async (style: any): Promise<void> => {
    onError("小程序暂不支持结构化重写");
  };

  const handleTranslate = async (targetLang: any): Promise<void> => {
    onError("翻译功能开发中");
  };

  const handleExpandContent = async (style: any): Promise<void> => {
    onError("扩写功能开发中");
  };

  const handleDOMRewrite = async (): Promise<void> => {
    onError("重写功能开发中");
  };

  return {
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