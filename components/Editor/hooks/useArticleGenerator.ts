import { useState, useRef } from 'react';
import { aiApi, templateApi } from '../../../services/apiClient';
import analytics from '../../../services/analytics';
import { GenerationResult } from '../../../services/geminiService';
import { loadMemory, saveMemory, AIMemory } from '../../../services/dualAIService';
import { ArticleBlock, GroundingSource, AIProvider } from '../../../types';
import { extractContentBlocksFromHTML, injectRewrittenContent } from '../utils/domRewriter';

// 文字区域接口定义 - 用于模板中的文字替换
interface TextRegion {
  id: string;
  index: number;
  type: string;
  originalText: string;        // 完整的原始文本（包含标点等）
  chineseSequence: string;     // 纯汉字序列
  htmlContent: string;         // 原始HTML内容
  level?: number;
  marker: string;
  generatedChinese?: string;   // AI生成的纯汉字内容
}

const PARAGRAPH_SEPARATOR = '===SPLIT===';

interface UseArticleGeneratorProps {
  aiProvider: AIProvider;
  onError: (msg: string) => void;
  setArticleTitle: (title: string) => void;
  setArticleDigest: (digest: string) => void;
  setHtmlContent: (html: string) => void;
  convertBlocksToHtml: (blocks: ArticleBlock[]) => string;
  onQuotaConsumed?: () => void; // Callback to refresh user quota display
}

export const useArticleGenerator = ({
  aiProvider,
  onError,
  setArticleTitle,
  setArticleDigest,
  setHtmlContent,
  convertBlocksToHtml,
  onQuotaConsumed
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
  const [importAsTemplate, setImportAsTemplate] = useState(false);

  // Template Rewrite State
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [importedTemplate, setImportedTemplate] = useState<any>(null);
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDigest, setOriginalDigest] = useState('');

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
    if (useTemplate) {
      if (articleTemplate) {
        console.log('Using existing article template');
      } else if (templateUrl.trim()) {
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
        // No template selected and no URL provided
        console.warn('Use template is checked but no template/URL provided');
        setArticleTemplate(null);
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
        
        const contentResponse = await aiApi.generate({
          message: topic,
          provider: aiProvider,
          useSearch: true, // Always use search for content AI
          imageContext: imageContext || undefined,
          isFormattingMode: false,
          useDualAI: true,
          dualAIPass: 'content',
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

        const designResponse = await aiApi.generate({
          message: topic,
          provider: aiProvider,
          useSearch: false,
          isFormattingMode: true, // Use formatting mode for beautification
          useDualAI: true,
          dualAIPass: 'design',
          contentSummary,
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
        // Check if using template - different generation logic
        if (articleTemplate) {
          console.log('[useArticleGenerator] Using template-based generation');

          // Template-based generation: AI only generates text content, we keep the template structure
          const templateTextRegions = articleTemplate.textRegions;

          // Generate text content for each text region
          const newTextRegions: TextRegion[] = [];

          console.log(`[useArticleGenerator] Starting template generation for ${templateTextRegions.length} regions (One-shot)`);
          
          // Process all regions in one go
          const batch = templateTextRegions;
          
          // Construct prompt with full context
          const batchPrompts: Array<{ id: string; index: number; type: string; originalText: string; charLimit: number }> = batch.map((region: TextRegion, idx: number) => {
            const paragraphType = region.type === 'header' ? '标题' :
                                 region.type === 'quote' ? '引用段落' :
                                 '正文段落';
            return {
              id: region.id,
              index: idx + 1,
              type: paragraphType,
              originalText: region.originalText, // Include full text for context
              charLimit: region.chineseSequence.length
            };
          });

          // Build a simplified prompt list showing only index, type, and charLimit
          const simplifiedList = batchPrompts
            .map(p => `[${p.index}] ${p.type}（约${p.charLimit}字）`)
            .join('\n');

          const prompt = `你是一个内容创作者。请围绕主题"${topic}"创作一篇全新的文章。

重要：你必须创作关于"${topic}"的全新内容，不要复制或改写下面的参考文本。参考文本仅用于展示文章结构和每段的字数要求。

文章结构（共${batch.length}个段落）：
${simplifiedList}

输出规则：
1. 必须恰好输出${batch.length}个段落，用 ${PARAGRAPH_SEPARATOR} 分隔。
2. 每段字数严格遵循上面括号中的字数要求（允许±10%波动）。
3. 只输出纯文本，不要输出编号、标签或任何格式标记。
4. 所有内容必须围绕"${topic}"这个主题展开。

请直接输出${batch.length}个段落，用 ${PARAGRAPH_SEPARATOR} 分隔：`;

          try {
            console.group('[useArticleGenerator] Template Generation Process');
            console.log(`1. Request Preparation: ${batch.length} regions`);
            console.log('   Prompt Preview:', prompt.slice(0, 200) + '...');
            
            console.log('2. Calling AI API...');
            const startTime = Date.now();
            const batchResponse = await aiApi.helper('custom', prompt, aiProvider);
            const latency = Date.now() - startTime;
            console.log(`   API Latency: ${latency}ms`);
            console.log('   Response success:', batchResponse.success);
            console.log('   Response data:', batchResponse.data ? 'present' : 'missing');
            console.log('   Response error:', batchResponse.error || 'none');

            if (batchResponse.success && batchResponse.data) {
              const rawResult = batchResponse.data.result as string;
              
              console.log('3. Response Received');
              console.log(`   Type: ${typeof rawResult}`);
              console.log(`   Length: ${rawResult.length} chars`);
              console.log(`   Is empty: ${!rawResult || rawResult.length === 0}`);
              console.log(`   Contains ===SPLIT===: ${rawResult.includes(PARAGRAPH_SEPARATOR)}`);
              console.log('   Full Raw Response:', rawResult);

              if (!rawResult || rawResult.length === 0) {
                console.error('   ❌ AI returned empty response! Check backend logs for details.');
              }

              // Client-side parsing: split by separator and map by index
              let paragraphs: string[];
              if (rawResult.includes(PARAGRAPH_SEPARATOR)) {
                paragraphs = rawResult.split(PARAGRAPH_SEPARATOR).map(p => p.trim()).filter(p => p.length > 0);
                console.log(`4. Split by ${PARAGRAPH_SEPARATOR}: Found ${paragraphs.length} paragraphs`);
              } else {
                console.warn(`4. Separator "${PARAGRAPH_SEPARATOR}" NOT found in response, using newline fallback`);
                // Fallback: try double-newline, then single-newline
                paragraphs = rawResult.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
                console.log(`   Double-newline split: ${paragraphs.length} paragraphs`);
                if (paragraphs.length < batch.length) {
                  const singleSplit = rawResult.split(/\n/).map(p => p.trim()).filter(p => p.length > 0);
                  console.log(`   Single-newline split: ${singleSplit.length} paragraphs`);
                  if (singleSplit.length > paragraphs.length) {
                    paragraphs = singleSplit;
                  }
                }
                // Strip leading numbering (e.g. "1. ", "2、", "（1）")
                paragraphs = paragraphs.map(p => p.replace(/^(?:\d+[.、)\uff09]\s*|[（(]\d+[)）]\s*)/, ''));
                console.log(`   After cleanup: ${paragraphs.length} paragraphs`);
              }

              console.log(`5. Paragraph Details (expected ${batch.length}):`);
              paragraphs.forEach((p, i) => {
                console.log(`   [${i}] (${p.length} chars): ${p.slice(0, 80)}${p.length > 80 ? '...' : ''}`);
              });

              if (paragraphs.length !== batch.length) {
                console.warn(`   ⚠️ Count Mismatch: Expected ${batch.length}, got ${paragraphs.length}`);
              }

              // Map paragraphs to regions by index (client-side structuring)
              batch.forEach((region: TextRegion, batchIdx: number) => {
                const generatedText = batchIdx < paragraphs.length ? paragraphs[batchIdx] : region.chineseSequence;
                
                if (batchIdx >= paragraphs.length) {
                  console.warn(`   ⚠️ Missing content for region ${region.id} (index ${region.index}), using original text.`);
                }
                
                newTextRegions.push({
                  ...region,
                  generatedChinese: generatedText
                });
              });
            } else {
              console.error('API Error:', batchResponse.error);
              console.warn('Request failed, using original text as fallback');
              batch.forEach((region: TextRegion) => {
                newTextRegions.push({
                  ...region,
                  generatedChinese: region.chineseSequence
                });
              });
            }
          } catch (error) {
            console.error('[useArticleGenerator] Critical Processing Error:', error);
            batch.forEach((region: TextRegion) => {
              newTextRegions.push({
                ...region,
                generatedChinese: region.chineseSequence
              });
            });
          } finally {
            console.groupEnd();
          }

          console.log(`[useArticleGenerator] Final Result: ${newTextRegions.length} text regions ready for injection`);

          // Apply template with new text content
          console.log('[useArticleGenerator] Applying template with new text regions...');
          console.log('[useArticleGenerator] Original HTML length:', articleTemplate.originalHtml.length);

          const finalHtml = applyTemplateWithTextReplacement(articleTemplate, newTextRegions);

          console.log('[useArticleGenerator] Final HTML length:', finalHtml.length);
          console.log('[useArticleGenerator] Template application completed');

          result = {
            title: articleTemplate.title || 'Generated Article',
            digest: articleTemplate.digest || 'Generated using template',
            blocks: [], // Not used in template mode
            sources: [],
            html: finalHtml, // Use the templated HTML directly
          };

          console.log('[useArticleGenerator] Template-based generation completed successfully');
          console.log('[useArticleGenerator] Result summary:', {
            title: result.title,
            htmlLength: finalHtml.length,
            regionsProcessed: newTextRegions.length
          });

        } else {
          // Standard single-pass generation (no template)
          console.log('[useArticleGenerator] Using standard backend API with provider:', aiProvider);

          const response = await aiApi.generate({
            message: topic,
            provider: aiProvider,
            useSearch: useSearch,
            imageContext: imageContext || undefined,
            isFormattingMode: isFormattingMode,
            userprompt: userprompt || undefined, // Include custom user prompt if provided
            // 注意：这里不再传递template参数，避免JSON序列化问题
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

      // Refresh user quota display after consuming quota
      onQuotaConsumed?.();

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

      const { title, digest, blocks, cleanedHtml, svgBlocks } = response.data;

      if (importAsTemplate) {
        // Template mode: Generate text regions and store full template data using DOM Tagging
        const { taggedHtml, textRegions } = processTemplateHtml(cleanedHtml);
        
        setImportedTemplate({
          title,
          digest,
          blocks,
          cleanedHtml: taggedHtml, // Use tagged HTML which corresponds to originalHtml
          svgBlocks,
          textRegions,
          url: urlToImport,
          statistics: {
            totalBlocks: blocks.length,
            textRegions: textRegions.length,
            imageBlocks: blocks.filter((b: any) => b.type === 'image').length,
            codeBlocks: blocks.filter((b: any) => b.type === 'code').length
          }
        });
        setOriginalTitle(title);
        setOriginalDigest(digest);

        // For template mode, use the tagged HTML for high-fidelity preview
        setHtmlContent(taggedHtml);
        setArticleTitle(title);
        setArticleDigest(digest);

        // Close import dialog and show rewrite dialog
        setShowImportDialog(false);
        setShowRewriteDialog(true);
      } else {
        // Normal import mode
        setArticleTitle(title);
        setArticleDigest(digest);

        // Convert blocks to HTML
        const html = convertBlocksToHtml(blocks);
        setHtmlContent(html);

        // Close import dialog
        setShowImportDialog(false);
      }

      setImportUrl('');
      setImportAsTemplate(false); // Reset for next import

      // Track import event (don't let analytics errors affect the import)
      try {
        analytics.track('article_import', {
          url: urlToImport,
          blocksCount: blocks.length,
          asTemplate: importAsTemplate,
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





  // Extract article template from URL - Improved DOM Tagging Strategy
  const extractArticleTemplate = async (url: string): Promise<any> => {
    console.log('[extractArticleTemplate] Starting template extraction from URL:', url);

    const response = await aiApi.importUrl(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to extract template');
    }

    const { title, digest, blocks, cleanedHtml, svgBlocks } = response.data;
    
    // Process HTML to tag text regions with unique IDs
    const { taggedHtml, textRegions } = processTemplateHtml(cleanedHtml);
    
    console.log('[extractArticleTemplate] Tagging complete. Created', textRegions.length, 'regions');

    // Return template with tagged HTML
    return {
      title,
      digest,
      originalHtml: taggedHtml, // Now contains data-ai-id attributes
      svgBlocks,
      textRegions,
      statistics: {
        totalBlocks: blocks.length,
        textRegions: textRegions.length,
        imageBlocks: blocks.filter((b: any) => b.type === 'image').length,
        codeBlocks: blocks.filter((b: any) => b.type === 'code').length
      }
    };
  };

  /**
   * Process HTML to find and tag text regions with IDs
   * Uses DOM parser to robustly identify leaf text nodes
   */
  const processTemplateHtml = (html: string): { taggedHtml: string; textRegions: TextRegion[] } => {
    console.log('[processTemplateHtml] Input HTML length:', html.length);
    console.log('[processTemplateHtml] Input HTML preview:', html.slice(0, 300) + '...');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const regions: TextRegion[] = [];
    let regionIndex = 0;

    // Helper to check if an element is a leaf block (contains text but no block children)
    const isLeafBlock = (el: Element): boolean => {
      const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'];
      const tagName = el.tagName.toLowerCase();
      
      // Explicitly exclude non-content tags
      if (['style', 'script', 'noscript', 'iframe', 'svg', 'path'].includes(tagName)) return false;

      // Explicit block tags are candidates
      if (blockTags.includes(tagName)) return true;
      
      // Divs/Sections are candidates only if they don't have block children
      if (tagName === 'div' || tagName === 'section') {
        const hasBlockChildren = Array.from(el.children).some(child => 
          blockTags.includes(child.tagName.toLowerCase()) || 
          child.tagName.toLowerCase() === 'div' || 
          child.tagName.toLowerCase() === 'section'
        );
        return !hasBlockChildren && (el.textContent?.trim().length || 0) > 0;
      }
      
      return false;
    };

    // Recursive traversal
    const traverse = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        // Skip hidden elements (simple check)
        if (el.style.display === 'none' || el.style.visibility === 'hidden') return;
        
        // Skip non-content tags
        if (['style', 'script', 'noscript', 'iframe', 'svg'].includes(el.tagName.toLowerCase())) return;

        // If it's a leaf block with Chinese content
        if (isLeafBlock(el)) {
          // Use innerText to get visible text only, avoiding CSS/Scripts if they somehow got here
          const text = el.innerText || el.textContent || '';
          const hasChinese = /[\u4e00-\u9fff]/.test(text);
          
          // Only tag if it has Chinese and sufficient length
          if (hasChinese && text.trim().length >= 5) {
            const id = `ai-region-${Date.now()}-${regionIndex++}`;
            el.setAttribute('data-ai-id', id);
            el.setAttribute('title', '点击查看原始内容'); // Tooltip hint
            el.classList.add('ai-template-region'); // Add class for styling/identification
            
            regions.push({
              id,
              index: regionIndex,
              type: el.tagName.toLowerCase(),
              originalText: text,
              chineseSequence: text.replace(/[^\u4e00-\u9fff]/g, ''),
              htmlContent: el.outerHTML, // This will capture the element BEFORE placeholder replacement? No, reference.
              // Wait, el.outerHTML is dynamic. I need to capture it NOW or ensure I replace AFTER.
              level: 1,
              marker: id
            });

            // Generate placeholder text: "可填写区域" repeating
            const placeholderBase = "可填写区域";
            const repeatCount = Math.ceil(text.length / placeholderBase.length);
            const placeholder = placeholderBase.repeat(repeatCount).slice(0, text.length);
            
            // Replace content in DOM for visualization
            el.textContent = placeholder;

            return; // Don't traverse deeper into a tagged block
          }
        }
        // Continue traversing children
        Array.from(el.children).forEach(traverse);
      }
    };

    traverse(doc.body);

    const taggedHtml = doc.body.innerHTML;
    console.log('[processTemplateHtml] Tagged HTML length:', taggedHtml.length);
    console.log('[processTemplateHtml] Regions found:', regions.length);
    console.log('[processTemplateHtml] data-ai-id count in HTML:', (taggedHtml.match(/data-ai-id=/g) || []).length);
    if (regions.length > 0) {
      console.log('[processTemplateHtml] First region:', { id: regions[0].id, type: regions[0].type, textPreview: regions[0].originalText.slice(0, 50) });
      console.log('[processTemplateHtml] Last region:', { id: regions[regions.length - 1].id, type: regions[regions.length - 1].type, textPreview: regions[regions.length - 1].originalText.slice(0, 50) });
    }

    return {
      taggedHtml,
      textRegions: regions
    };
  };

  /**
   * Apply template by finding tagged elements and replacing text
   * Uses DOM ID lookup for 100% accuracy
   */
  const applyTemplateWithTextReplacement = (template: any, newTextRegions: TextRegion[]): string => {
    console.log('[applyTemplateWithTextReplacement] Starting DOM-based replacement');
    console.log('[applyTemplateWithTextReplacement] Template originalHtml length:', template.originalHtml.length);
    console.log('[applyTemplateWithTextReplacement] data-ai-id count in template HTML:', (template.originalHtml.match(/data-ai-id=/g) || []).length);
    console.log('[applyTemplateWithTextReplacement] Regions to replace:', newTextRegions.length);
    console.log('[applyTemplateWithTextReplacement] Regions with generatedChinese:', newTextRegions.filter(r => r.generatedChinese).length);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.originalHtml, 'text/html');
    let replacedCount = 0;
    let notFoundCount = 0;

    // Restore SVG placeholders first (if any)
    if (template.svgBlocks) {
      // This part still uses string replacement on the result, or we can do it in DOM if we can find them
      // For now, let's keep SVGs as is, assuming they are preserved in doc.body.innerHTML
    }

    newTextRegions.forEach((region, idx) => {
      if (!region.generatedChinese) {
        console.warn(`[applyTemplateWithTextReplacement] Region ${idx} (${region.id}): no generatedChinese, skipping`);
        return;
      }

      // Find element by data-ai-id
      const el = doc.querySelector(`[data-ai-id="${region.id}"]`);
      if (el) {
        // Direct text replacement
        el.textContent = region.generatedChinese;
        
        // Clean up template markers
        el.removeAttribute('data-ai-id');
        el.removeAttribute('title');
        el.classList.remove('ai-template-region');
        
        replacedCount++;
      } else {
        notFoundCount++;
        console.warn(`[applyTemplateWithTextReplacement] Region ${idx}: Could not find element with data-ai-id="${region.id}"`);
      }

    });

    console.log(`[applyTemplateWithTextReplacement] Result: ${replacedCount} replaced, ${notFoundCount} not found out of ${newTextRegions.length} total`);
    
    let resultHtml = doc.body.innerHTML;

    // Restore SVGs using string replacement on the final HTML
    // (Because DOMParser might have messed up SVGs or we need to put real content back into placeholders)
    if (template.svgBlocks && template.svgBlocks.length > 0) {
      const svgMap = new Map<string, string>(template.svgBlocks.map((svg: any) => [svg.id, svg.content]));
      resultHtml = resultHtml.replace(/<div data-svg-block-id="([^"]+)" class="svg-placeholder"><\/div>/g, (match: string, svgId: string) => {
        const svgContent = svgMap.get(svgId);
        return typeof svgContent === 'string' ? svgContent : match;
      });
    }

    return resultHtml;
  };

  // 正则转义辅助函数
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Handle template rewrite
  const handleRewrite = async (newTopic: string) => {
    if (!importedTemplate || !newTopic.trim()) {
      onError('模板数据或主题不能为空');
      return;
    }

    setIsRewriting(true);
    try {
      // 1. 解析原始HTML内容块
      const contentBlocks = extractContentBlocksFromHTML(importedTemplate.cleanedHtml);

      if (contentBlocks.length === 0) {
        onError("无法解析模板内容，请检查HTML格式");
        return;
      }

      // 2. 准备发送给AI的数据（去除DOM引用）
      const blocksForAI = contentBlocks.map(({ domRef, ...block }) => block);

      // 3. 调用AI重写API
      const response = await aiApi.rewrite({
        topic: newTopic,
        blocks: blocksForAI
      });

      if (response.success && response.data) {
        // 4. 将AI结果回填到原始DOM中
        const newHtml = injectRewrittenContent(contentBlocks, response.data);
        setHtmlContent(newHtml);

        // 更新标题和摘要（可选）
        setArticleTitle(`AI重写：${newTopic}`);
        setArticleDigest(`基于"${originalTitle}"模板重写的新内容`);

        // 关闭重写对话框
        setShowRewriteDialog(false);

        // 清理状态
        setImportedTemplate(null);
        setOriginalTitle('');
        setOriginalDigest('');
      } else {
        throw new Error(response.error?.message || '重写失败');
      }
    } catch (e: any) {
      onError(e.message || "文章重写失败");
    } finally {
      setIsRewriting(false);
    }
  };

  // Save template to backend
  const handleSaveTemplate = async (name: string): Promise<void> => {
    if (!importedTemplate) throw new Error("No template data to save");
    
    const templateData = {
      name,
      originalHtml: importedTemplate.cleanedHtml,
      textRegions: importedTemplate.textRegions,
      svgBlocks: importedTemplate.svgBlocks,
      preview: importedTemplate.digest || "Imported from WeChat article",
      sourceUrl: importedTemplate.url,
      statistics: importedTemplate.statistics
    };
    
    const response = await templateApi.create(templateData);
    
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to save template");
    }
    
    analytics.track('template_save', {
      nameLength: name.length,
      regionsCount: importedTemplate.textRegions.length
    });
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
    importAsTemplate,
    setImportAsTemplate,

    // Template Rewrite states
    showRewriteDialog,
    setShowRewriteDialog,
    isRewriting,
    importedTemplate,
    originalTitle,
    originalDigest,

    // Template states (for article generation)
    useTemplate,
    setUseTemplate,
    templateUrl,
    setTemplateUrl: updateTemplateUrl, // Use wrapper function that clears old template
    isExtractingTemplate,
    articleTemplate,
    setArticleTemplate,

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
    handleRewrite,
    handleSaveTemplate,
    saveLocalDraft,
    loadLocalDraft,
    handleInsertHookContent,
    handleInsertCTAContent,

    // Utilities
    fetchFeatures,
    checkForDraft,
  };
};
