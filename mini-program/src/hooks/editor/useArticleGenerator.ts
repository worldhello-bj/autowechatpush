import { useState, useRef } from 'react';
import Taro from '@tarojs/taro';
import { aiApi } from '../../services/apiClient';
import analytics from '../../services/analytics';
import { ArticleBlock, GroundingSource, AIProvider } from '@shared/types';

interface UseArticleGeneratorProps {
  aiProvider: AIProvider;
  onError: (msg: string) => void;
  setArticleTitle: (title: string) => void;
  setArticleDigest?: (digest: string) => void;
  setHtmlContent?: (html: string) => void;
  convertBlocksToHtml?: (blocks: ArticleBlock[]) => string;
  onSuccess?: (result: any) => void;
  onQuotaConsumed?: () => void; // Callback to refresh user quota display
}

export const useArticleGenerator = ({
  aiProvider,
  onError,
  setArticleTitle,
  setArticleDigest,
  setHtmlContent,
  convertBlocksToHtml,
  onSuccess,
  onQuotaConsumed
}: UseArticleGeneratorProps) => {
  // Core generation states
  const [topic, setTopic] = useState('');
  const [userprompt, setUserprompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [isFormattingMode, setIsFormattingMode] = useState(false);
  const [useDualAI, setUseDualAI] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [imageContext, setImageContext] = useState<string>('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Features availability from backend
  const [featuresAvailable, setFeaturesAvailable] = useState({
    imageAnalysis: false,
    textToSpeech: false,
  });

  // Article content state
  const [sources, setSources] = useState<GroundingSource[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
        onError("请输入文章主题或内容");
        return;
    }

    setLoading(true);

    try {
      console.log('[useArticleGenerator] Calling backend API with provider:', aiProvider);

      const response = await aiApi.generate({
        message: topic,
        provider: aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek',
        useSearch: useSearch,
        imageContext: imageContext || undefined,
        isFormattingMode: isFormattingMode,
        userprompt: userprompt || undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '生成失败');
      }

      const result = response.data;
      setArticleTitle(result.title);
      if (setArticleDigest) setArticleDigest(result.digest);
      // @ts-ignore
      setSources(result.sources || []);

      if (convertBlocksToHtml && setHtmlContent) {
        const generatedHtml = convertBlocksToHtml(result.blocks as any);
        setHtmlContent(generatedHtml);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      // Track article generation event
      analytics.track('article_generate', {
        provider: aiProvider,
        useDualAI,
        useSearch,
        hasImage: !!imageContext,
        topicLength: topic.length,
      });

      // Refresh user quota display after consuming quota
      onQuotaConsumed?.();

    } catch (e: any) {
      console.error('[useArticleGenerator] Article generation error:', e);
      onError(e.message || "生成文章失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });
      
      const tempFilePath = res.tempFilePaths[0];
      setUploadedImagePreview(tempFilePath);
      
      // In Mini Program, we usually upload to backend immediately or keep path
      // For analysis, we might need to convert to base64
      const fs = Taro.getFileSystemManager();
      const base64 = fs.readFileSync(tempFilePath, 'base64');
      // ... analysis logic if needed ...
      
    } catch (e) {
      console.log('User cancelled image selection');
    }
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
    }
  };

  return {
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
    sources,
    featuresAvailable,
    handleGenerate,
    handleImageUpload,
    fetchFeatures,
  };
};