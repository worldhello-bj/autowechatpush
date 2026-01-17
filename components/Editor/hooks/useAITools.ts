import { useState } from 'react';
import { aiApi } from '../../../services/apiClient';
import { StyleSuggestion } from '../../../services/deepSeekService';
import { AIProvider } from '../../../types';

// StyleSuggestion type still needed for component state
export interface AIToolsState {
  showAITools: boolean;
  aiToolLoading: boolean;
  titleSuggestions: string[];
  keywords: string[];
  styleSuggestions: StyleSuggestion[];
  generatedHook: string;
  generatedCTA: string;
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

  const handlePolishContent = async (tone: 'professional' | 'casual' | 'formal' | 'creative'): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const response = await aiApi.helper('polishContent', content, aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek', { tone });
      if (response.success && response.data) {
        const polished = typeof response.data.result === 'string' ? response.data.result : '';
        setHtmlContent(textToSafeHtml(polished));
      } else {
        throw new Error(response.error?.message || 'Failed to polish content');
      }
    } catch (e: any) {
      onError(e.message || "Failed to polish content");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleRewriteContent = async (style: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational'): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const response = await aiApi.helper('rewriteContent', content, aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek', { style });
      if (response.success && response.data) {
        const rewritten = typeof response.data.result === 'string' ? response.data.result : '';
        setHtmlContent(textToSafeHtml(rewritten));
      } else {
        throw new Error(response.error?.message || 'Failed to rewrite content');
      }
    } catch (e: any) {
      onError(e.message || "Failed to rewrite content");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleTranslate = async (targetLang: 'zh' | 'en'): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 10) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const response = await aiApi.helper('translateContent', content, aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek', { targetLanguage: targetLang });
      if (response.success && response.data) {
        const translated = typeof response.data.result === 'string' ? response.data.result : '';
        setHtmlContent(textToSafeHtml(translated));
      } else {
        throw new Error(response.error?.message || 'Failed to translate content');
      }
    } catch (e: any) {
      onError(e.message || "Failed to translate content");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleExpandContent = async (style: 'detailed' | 'examples' | 'storytelling'): Promise<void> => {
    const content = getPlainTextContent();
    if (content.length < 30) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      const response = await aiApi.helper('expandContent', content, aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek', { style });
      if (response.success && response.data) {
        const expanded = typeof response.data.result === 'string' ? response.data.result : '';
        setHtmlContent(textToSafeHtml(expanded));
      } else {
        throw new Error(response.error?.message || 'Failed to expand content');
      }
    } catch (e: any) {
      onError(e.message || "Failed to expand content");
    } finally {
      setAiToolLoading(false);
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
  };
};
