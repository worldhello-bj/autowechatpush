
import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import HtmlEditor, { HtmlEditorRef } from './HtmlEditor';
import MaterialLibrary from './MaterialLibrary';
import AIToolsPanel, { AISettings, DEFAULT_AI_SETTINGS } from './AIToolsPanel';
import GuideModal from './Editor/modals/GuideModal';
import TemplateModal from './Editor/modals/TemplateModal';
import ContentTemplateModal from './Editor/modals/ContentTemplateModal';
import ImportDialog from './Editor/modals/ImportDialog';
import DisclaimerDialog from './Editor/modals/DisclaimerDialog';
import RewriteDialog from './Editor/modals/RewriteDialog';
import UserTemplatePicker from './Editor/modals/UserTemplatePicker';
import { ArticleBlock, GroundingSource, WeChatCredentials, WeChatAccount, BlockType, AIProvider } from '../types';
import { allDesignTemplates, getCategories, getTemplatesByCategory, DesignTemplate } from '../services/designTemplates';
import { getAccessToken, saveDraft, uploadImage, getAccessTokenByAccountId } from '../services/wechatService';
import { draftApi, templateApi } from '../services/apiClient';
import { wechatAccountService } from '../services/wechatAccountService';
import analytics from '../services/analytics';
import { useAuth } from './AuthContext';

// Import utility functions from the new utils directory
import { dataURLtoBlob, createDefaultCoverBlob } from './Editor/utils/imageUtils';
import { escapeHtml, textToSafeHtml } from './Editor/utils/htmlUtils';
import { convertBlocksToHtml } from './Editor/utils/blockConverter';

// Import custom hooks
import { useWeChatManager } from './Editor/hooks/useWeChatManager';
import { useAITools } from './Editor/hooks/useAITools';
import { useArticleGenerator } from './Editor/hooks/useArticleGenerator';

// Import extracted components
import AccountManagerModal from './Editor/components/AccountManagerModal';
import ControlPanel from './Editor/components/ControlPanel';
import PreviewPanel from './Editor/components/PreviewPanel';

interface EditorProps {
  onError: (msg: string) => void;
}

const DRAFT_KEY = 'wechat_editor_draft';
const PROVIDER_KEY = 'ai_provider';

const Editor: React.FC<EditorProps> = ({ onError }) => {
  // Auth context for refreshing user quota
  const { refreshUser } = useAuth();
  
  // UI State
  const [showGuide, setShowGuide] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // AI Provider Config (managed by admin via backend)
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.DEEPSEEK);

  // Article Content
  const [articleTitle, setArticleTitle] = useState('New Article');
  const [articleDigest, setArticleDigest] = useState('');
  const [htmlContent, setHtmlContent] = useState<string>('<p style="color:#888; text-align:center;">生成的内容将显示在这里...</p>');

  // --- Custom Hooks ---
  const wechatManager = useWeChatManager(onError);
  const articleGenerator = useArticleGenerator({
    aiProvider,
    onError,
    setArticleTitle,
    setArticleDigest,
    setHtmlContent,
    convertBlocksToHtml,
    onQuotaConsumed: refreshUser // Refresh user quota after generation
  });
  const aiTools = useAITools({
    aiProvider,
    topic: articleGenerator.topic,
    htmlContent,
    setArticleTitle,
    setArticleDigest,
    setHtmlContent,
    onError,
    onQuotaConsumed: refreshUser // Refresh user quota after AI tools usage
  });

  // Use article generator states and handlers
  const {
    loading,
    analyzingImage,
    isFormattingMode,
    setIsFormattingMode,
    useDualAI,
    setUseDualAI,
    useSearch,
    setUseSearch,
    uploadedImagePreview,
    setUploadedImagePreview,
    isPlaying,
    setIsPlaying,
    sources,
    featuresAvailable,
    showImportDialog,
    setShowImportDialog,
    importUrl,
    setImportUrl,
    isImporting,
    showDisclaimer,
    setShowDisclaimer,
    stitchFileInputRef,
    stitchLoading,
    handleGenerate,
    handleImageUpload,
    handleStitchUpload,
    handleTTS,
    handleImportArticle,
    acceptDisclaimerAndImport,
    performImport,
    handleInsertHookContent,
    handleInsertCTAContent,
    fetchFeatures,
  } = articleGenerator;

  // HTML Editor Ref (for inserting at cursor)
  const htmlEditorRef = useRef<HtmlEditorRef>(null);

  // Design Templates Panel State
  const [showDesignTemplates, setShowDesignTemplates] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<DesignTemplate['category']>('header');
  const templateCategories = getCategories();

  // User Templates Picker State
  const [showUserTemplatePicker, setShowUserTemplatePicker] = useState(false);

  // Template Preview Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DesignTemplate | null>(null);

  // Content Template Modal State (Full Article Templates)
  const [showContentTemplateModal, setShowContentTemplateModal] = useState(false);

  // Material Library Panel State
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false);

  // AI Settings State (with sliders)
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);

  // Initialize hooks on mount
  useEffect(() => {
    fetchFeatures();
    checkServerDrafts();
  }, []);

  // Server Draft Logic
  const [hasServerDraft, setHasServerDraft] = useState(false);
  const [latestDraftId, setLatestDraftId] = useState<string | null>(null);

  const checkServerDrafts = async () => {
    try {
      const response = await draftApi.list();
      if (response.success && response.data && response.data.length > 0) {
        setHasServerDraft(true);
        setLatestDraftId(response.data[0].id); // Assume sorted by latest
      }
    } catch (error) {
      console.error('Failed to check drafts', error);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const response = await draftApi.save({
        title: articleTitle,
        digest: articleDigest,
        content: htmlContent,
        topic: articleGenerator.topic,
        id: latestDraftId || undefined // Update existing if loaded
      });
      
      if (response.success && response.data) {
        setLatestDraftId(response.data.id);
        alert('草稿已保存到服务器！');
      } else {
        throw new Error(response.error?.message || 'Save failed');
      }
    } catch (error: any) {
      onError('保存草稿失败: ' + error.message);
    }
  };

  const handleLoadDraft = async () => {
    if (!latestDraftId) return;
    
    try {
      const response = await draftApi.get(latestDraftId);
      if (response.success && response.data) {
        const draft = response.data;
        setArticleTitle(draft.title);
        setArticleDigest(draft.digest);
        setHtmlContent(draft.content);
        articleGenerator.setTopic(draft.topic || '');
        setHasServerDraft(false); // Hide notification
      }
    } catch (error: any) {
      onError('加载草稿失败: ' + error.message);
    }
  };

  // Publish handler
  const handlePublish = async () => {
     // 检查是否有配置的微信账号
     const currentAccount = wechatAccountService.getCurrentAccount();
     if (!currentAccount) {
         onError("微信API未配置。请先添加微信账号（点击左侧'微信账号管理'按钮）。");
         return;
     }

     setIsPublishing(true);
     try {
         // 使用当前账号获取访问令牌
         const token = await getAccessTokenByAccountId(currentAccount.id);

         let thumb_media_id = "";
         if (uploadedImagePreview) {
             // Case 1: User uploaded an image explicitly
             const imageBlob = dataURLtoBlob(uploadedImagePreview);
             thumb_media_id = await uploadImage(token, imageBlob);
         } else {
             // Case 2: No image, generate a default one via Canvas
             console.log("No user cover image. Generating default cover...");
             try {
                // Generate a Blob from canvas with the current article title
                const defaultBlob = await createDefaultCoverBlob(articleTitle);
                // Upload this generated image to WeChat to get a valid ID
                thumb_media_id = await uploadImage(token, defaultBlob);
                console.log("Generated cover uploaded successfully. Media ID:", thumb_media_id);
             } catch (err: any) {
                console.error("Failed to upload generated cover:", err);
                throw new Error("Failed to generate and upload default cover image. Please try uploading an image manually.");
             }
         }

         const payload = {
             articles: [({
                 title: articleTitle,
                 author: "AI Assistant",
                 digest: articleDigest,
                 content: htmlContent,
                 content_source_url: "",
                 thumb_media_id: thumb_media_id,
                 show_cover_pic: 1,
                 need_open_comment: 1,
                 only_fans_can_comment: 0
             } as any)]
         };

         const result = await saveDraft(token, payload);
         alert(`成功！文章已保存到微信草稿箱。\n账号：${currentAccount.name}\nMedia ID: ${result.media_id}`);

         // Track publish event
         analytics.track('article_publish', {
           titleLength: articleTitle.length,
           contentLength: htmlContent.length,
           hasCoverImage: !!uploadedImagePreview,
           accountName: currentAccount.name,
         });

     } catch (e: any) {
         onError(e.message || "发布到微信失败");
     } finally {
         setIsPublishing(false);
     }
  };

  // Design Template Handler
  const handleInsertTemplate = async (template: DesignTemplate, smartMode: boolean = true) => {
    // Use ref to insert at cursor position if available
    if (htmlEditorRef.current) {
      // Check if there is selected content to format AND smart mode is enabled
      const selectedHtml = htmlEditorRef.current.getSelectionHtml();
      
      if (smartMode && selectedHtml && selectedHtml.trim().length > 0) {
        // Format existing content using backend API
        try {
          // Show a temporary loading indicator or toast could be good here
          // For now just console log
          console.log('Formatting selection with template...', template.id);
          
          const response = await templateApi.apply(selectedHtml, template.id);
          
          if (response.success && response.data) {
            htmlEditorRef.current.insertHtmlAtCursor(response.data.html);
            analytics.track('template_apply_smart', { templateId: template.id });
          } else {
            console.warn('Failed to apply template smart formatting, falling back to insert');
            htmlEditorRef.current.insertHtmlAtCursor(template.html);
          }
        } catch (error) {
          console.error('Error applying template:', error);
          // Fallback
          htmlEditorRef.current.insertHtmlAtCursor(template.html);
        }
      } else {
        // No selection or smart mode disabled, just insert empty template
        htmlEditorRef.current.insertHtmlAtCursor(template.html);
      }
    } else {
      // Fallback: append to end
      const separator = htmlContent.trim() ? '\n' : '';
      const newContent = htmlContent + separator + template.html;
      setHtmlContent(newContent);
    }
  };

  // Material Library Handlers
  const handleInsertMaterialImage = (imageDataUrl: string) => {
    const imgHtml = `
      <section style="margin: 20px 0; text-align: center;">
        <img src="${imageDataUrl}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
      </section>
    `;
    // Use ref to insert at cursor position if available
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(imgHtml);
    } else {
      // Fallback: append to end
      const separator = htmlContent.trim() ? '\n' : '';
      const newContent = htmlContent + separator + imgHtml;
      setHtmlContent(newContent);
    }
  };

  const handleInsertMaterialText = (text: string) => {
    const safeText = escapeHtml(text);
    // Insert text inline (without wrapper) to preserve cursor position
    // Use a span for inline styling that works with cursor positioning
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(safeText);
    } else {
      // Fallback: append with proper paragraph wrapper
      const textHtml = `<p style="font-size: 16px; line-height: 1.8; color: #444;">${safeText}</p>`;
      const separator = htmlContent.trim() ? '\n' : '';
      const newContent = htmlContent + separator + textHtml;
      setHtmlContent(newContent);
    }
  };

  const handleInsertMaterialVideo = (videoDataUrl: string) => {
    const videoHtml = `
      <section style="margin: 20px 0; text-align: center;">
        <video src="${videoDataUrl}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" controls></video>
        <section style="font-size: 12px; color: #888; margin-top: 6px;">视频</section>
      </section>
    `;
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(videoHtml);
    } else {
      const separator = htmlContent.trim() ? '\n' : '';
      const newContent = htmlContent + separator + videoHtml;
      setHtmlContent(newContent);
    }
  };

  const handleInsertMaterialGif = (gifDataUrl: string) => {
    const gifHtml = `
      <section style="margin: 20px 0; text-align: center;">
        <img src="${gifDataUrl}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
      </section>
    `;
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(gifHtml);
    } else {
      const separator = htmlContent.trim() ? '\n' : '';
      const newContent = htmlContent + separator + gifHtml;
      setHtmlContent(newContent);
    }
  };

  const handleInsertMaterialSvg = (svgContent: string) => {
    // Sanitize SVG using DOMPurify for proper security
    const sanitizedSvg = DOMPurify.sanitize(svgContent, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'],
      ADD_ATTR: ['xlink:href', 'href']
    });

    // Wrap SVG in a span to make it inline and preserve cursor position
    const inlineSvg = `<span style="display:inline-block; vertical-align:middle;">${sanitizedSvg}</span>`;

    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(inlineSvg);
    } else {
      // Fallback: append with wrapper for proper block display
      const svgHtml = `
        <section style="margin: 20px 0; text-align: center;">
          ${sanitizedSvg}
        </section>
      `;
      const separator = htmlContent.trim() ? '\n' : '';
      const newContent = htmlContent + separator + svgHtml;
      setHtmlContent(newContent);
    }
  };



  return (
    <div className="flex flex-col lg:flex-row h-full relative bg-slate-50 p-4 gap-6 overflow-hidden">
      
      {/* Draft Notification */}
      {hasServerDraft && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
            <span className="text-sm font-medium">发现服务器端有未完成的草稿。</span>
            <div className="flex gap-3">
                <button onClick={() => setHasServerDraft(false)} className="text-blue-100 hover:text-white text-sm">忽略</button>
                <button onClick={handleLoadDraft} className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-bold hover:bg-blue-50">恢复草稿</button>
            </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <GuideModal onClose={() => setShowGuide(false)} />
      )}

      {/* Design Template Gallery Modal */}
      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onInsertTemplate={(template, smartMode) => {
            handleInsertTemplate(template, smartMode);
            setShowTemplateModal(false);
          }}
          selectedCategory={selectedTemplateCategory}
          onCategoryChange={setSelectedTemplateCategory}
        />
      )}

      {/* Full Article Template Modal (全文模板) */}
      {showContentTemplateModal && (
        <ContentTemplateModal
          onClose={() => setShowContentTemplateModal(false)}
          onInsertTemplate={(template, smartMode) => {
            if (articleGenerator.useTemplate) {
              // "套用模板" mode: process template for AI generation (same as user templates)
              articleGenerator.handleSelectContentTemplate(template.nameZh || template.name, template.html);
            } else {
              // Direct insert mode: insert HTML into editor
              handleInsertTemplate(template, smartMode);
            }
            setShowContentTemplateModal(false);
          }}
        />
      )}

      {/* User Template Picker Modal */}
      {showUserTemplatePicker && (
        <UserTemplatePicker
          onClose={() => setShowUserTemplatePicker(false)}
          onSelect={(template) => {
            articleGenerator.setArticleTemplate(template);
            articleGenerator.setUseTemplate(true);
            // Do NOT set template URL here as it might trigger extraction logic or clear the template
            setShowUserTemplatePicker(false);
          }}
        />
      )}

      {/* Import Article Dialog */}
      {showImportDialog && (
        <ImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={handleImportArticle}
          importUrl={importUrl}
          onImportUrlChange={setImportUrl}
          isImporting={isImporting}
          importAsTemplate={articleGenerator.importAsTemplate}
          onImportAsTemplateChange={articleGenerator.setImportAsTemplate}
        />
      )}

      {/* Disclaimer Dialog */}
      {showDisclaimer && (
        <DisclaimerDialog
          onClose={() => setShowDisclaimer(false)}
          onAccept={acceptDisclaimerAndImport}
        />
      )}

      {/* Template Rewrite Dialog */}
      {articleGenerator.showRewriteDialog && (
        <RewriteDialog
          isOpen={articleGenerator.showRewriteDialog}
          onClose={() => articleGenerator.setShowRewriteDialog(false)}
          onRewrite={articleGenerator.handleRewrite}
          onSaveTemplate={articleGenerator.handleSaveTemplate}
          isRewriting={articleGenerator.isRewriting}
          originalTitle={articleGenerator.originalTitle}
          originalDigest={articleGenerator.originalDigest}
        />
      )}

      {/* Left Panel: Controls */}
      <ControlPanel
        showGuide={showGuide}
        setShowGuide={setShowGuide}
        showImportDialog={showImportDialog}
        setShowImportDialog={setShowImportDialog}
        showDisclaimer={showDisclaimer}
        setShowDisclaimer={setShowDisclaimer}
        showMaterialLibrary={showMaterialLibrary}
        setShowMaterialLibrary={setShowMaterialLibrary}
        showDesignTemplates={showDesignTemplates}
        setShowDesignTemplates={setShowDesignTemplates}
        selectedTemplateCategory={selectedTemplateCategory}
        setSelectedTemplateCategory={setSelectedTemplateCategory}
        aiProvider={aiProvider}
        articleTitle={articleTitle}
        setArticleTitle={setArticleTitle}
        articleDigest={articleDigest}
        setArticleDigest={setArticleDigest}
        isFormattingMode={isFormattingMode}
        setIsFormattingMode={setIsFormattingMode}
        topic={articleGenerator.topic}
        setTopic={articleGenerator.setTopic}
        userprompt={articleGenerator.userprompt}
        setUserprompt={articleGenerator.setUserprompt}
        useSearch={articleGenerator.useSearch}
        setUseSearch={articleGenerator.setUseSearch}
        useDualAI={articleGenerator.useDualAI}
        setUseDualAI={articleGenerator.setUseDualAI}
        uploadedImagePreview={uploadedImagePreview}
        analyzingImage={analyzingImage}
        handleImageUpload={handleImageUpload}
        stitchFileInputRef={stitchFileInputRef}
        stitchLoading={stitchLoading}
        handleStitchUpload={handleStitchUpload}
        loading={loading}
        handleGenerate={handleGenerate}
        useTemplate={articleGenerator.useTemplate}
        setUseTemplate={articleGenerator.setUseTemplate}
        templateUrl={articleGenerator.templateUrl}
        setTemplateUrl={articleGenerator.setTemplateUrl}
        isExtractingTemplate={articleGenerator.isExtractingTemplate}
        articleTemplateName={articleGenerator.articleTemplate?.title || articleGenerator.articleTemplate?.name || null}
        onOpenUserTemplatePicker={() => setShowUserTemplatePicker(true)}
        onOpenContentTemplates={() => setShowContentTemplateModal(true)}
        wechatAccounts={wechatManager.wechatAccounts}
        openWeChatAccountManager={wechatManager.openWeChatAccountManager}
        setShowAITools={aiTools.setShowAITools}
        sources={sources}
        saveLocalDraft={handleSaveDraft}
        featuresAvailable={featuresAvailable}
      />

      {/* Right Panel: Preview & Edit */}
      <PreviewPanel
        htmlContent={htmlContent}
        setHtmlContent={setHtmlContent}
        articleTitle={articleTitle}
        isPlaying={isPlaying}
        handleTTS={handleTTS}
        featuresAvailable={featuresAvailable}
        aiProvider={aiProvider}
        htmlEditorRef={htmlEditorRef}
        isPublishing={isPublishing}
        handlePublish={handlePublish}
      />

      {/* WeChat Account Manager Modal Overlay */}
      <AccountManagerModal
        isOpen={wechatManager.showWeChatAccountManager}
        onClose={wechatManager.closeWeChatAccountManager}
        wechatAccounts={wechatManager.wechatAccounts}
        currentWeChatAccount={wechatManager.currentWeChatAccount}
        newAccountForm={wechatManager.newAccountForm}
        updateNewAccountForm={wechatManager.updateNewAccountForm}
        handleAddWeChatAccount={wechatManager.handleAddWeChatAccount}
        handleDeleteWeChatAccount={wechatManager.handleDeleteWeChatAccount}
        handleSelectWeChatAccount={wechatManager.handleSelectWeChatAccount}
        handleSetDefaultWeChatAccount={wechatManager.handleSetDefaultWeChatAccount}
        handleTestWeChatAccount={wechatManager.handleTestWeChatAccount}
        isTestingAccount={wechatManager.isTestingAccount}
        accountTestResult={wechatManager.accountTestResult}
        loadWeChatAccounts={wechatManager.loadWeChatAccounts}
      />

      {/* Material Library Modal Overlay (Slide-in Left Drawer, Non-blocking) */}
      {showMaterialLibrary && (
        <div className="fixed top-0 left-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl animate-slide-in-left flex flex-col border-r border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-blue-600">folder_special</span>
                <span className="font-bold text-lg text-gray-800">素材库</span>
              </div>
              <button 
                onClick={() => setShowMaterialLibrary(false)}
                className="p-2 hover:bg-white/50 rounded-full transition"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <MaterialLibrary
                onSelectMaterial={() => {}}
                onInsertImage={(img) => { handleInsertMaterialImage(img); setShowMaterialLibrary(false); }}
                onInsertText={(txt) => { handleInsertMaterialText(txt); setShowMaterialLibrary(false); }}
                onInsertVideo={(video) => { handleInsertMaterialVideo(video); setShowMaterialLibrary(false); }}
                onInsertGif={(gif) => { handleInsertMaterialGif(gif); setShowMaterialLibrary(false); }}
                onInsertSvg={(svg) => { handleInsertMaterialSvg(svg); setShowMaterialLibrary(false); }}
              />
            </div>
        </div>
      )}

      {/* AI Tools Modal Overlay (Slide-in Left Drawer, Non-blocking) */}
      {aiTools.showAITools && (
        <div className="fixed top-0 left-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl animate-slide-in-left flex flex-col border-r border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-purple-600">psychology</span>
                <span className="font-bold text-lg text-gray-800">AI 智能工具</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">含滑动条</span>
              </div>
              <button
                onClick={() => aiTools.setShowAITools(false)}
                className="p-2 hover:bg-white/50 rounded-full transition"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <AIToolsPanel
                settings={aiSettings}
                onSettingsChange={setAiSettings}
                onGenerateTitles={aiTools.handleGenerateTitles}
                onGenerateSummary={aiTools.handleGenerateSummary}
                onExtractKeywords={aiTools.handleExtractKeywords}
                onGenerateHook={aiTools.handleGenerateHook}
                onGenerateCTA={aiTools.handleGenerateCTA}
                onSuggestStyles={aiTools.handleSuggestStyles}
                onPolishContent={aiTools.handlePolishContent}
                onRewriteContent={aiTools.handleRewriteContent}
                onExpandContent={aiTools.handleExpandContent}
                onTranslate={aiTools.handleTranslate}
                titleSuggestions={aiTools.titleSuggestions}
                keywords={aiTools.keywords}
                styleSuggestions={aiTools.styleSuggestions}
                generatedHook={aiTools.generatedHook}
                generatedCTA={aiTools.generatedCTA}
                onSelectTitle={(title) => { setArticleTitle(title); }}
                onInsertHook={(hook) => { handleInsertHookContent(hook); }}
                onInsertCTA={(cta) => { handleInsertCTAContent(cta); }}
                loading={aiTools.aiToolLoading}
              />
            </div>
        </div>
      )}

      {/* Design Templates Modal Overlay (Slide-in Left Drawer, Non-blocking) */}
      {showDesignTemplates && (
        <div className="fixed top-0 left-0 bottom-0 z-50 w-full max-w-2xl bg-white shadow-2xl animate-slide-in-left flex flex-col border-r border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-orange-50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-pink-600">palette</span>
                <span className="font-bold text-lg text-gray-800">设计格式库</span>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{allDesignTemplates.length}+</span>
              </div>
              <button 
                onClick={() => setShowDesignTemplates(false)}
                className="p-2 hover:bg-white/50 rounded-full transition"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-gray-100">
                {templateCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTemplateCategory(cat.id)}
                    className={`text-sm px-4 py-2 rounded-full transition flex items-center gap-1 ${
                      selectedTemplateCategory === cat.id 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.nameZh}</span>
                  </button>
                ))}
              </div>

              {/* Templates Grid with Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTemplatesByCategory(selectedTemplateCategory).map((template) => (
                  <div 
                    key={template.id}
                    className="border border-gray-200 rounded-xl hover:border-pink-400 hover:shadow-lg transition cursor-pointer group overflow-hidden"
                    onClick={() => { handleInsertTemplate(template); setShowDesignTemplates(false); }}
                  >
                    {/* Template Preview */}
                    <div 
                      className="bg-white p-4 border-b border-gray-100 min-h-[120px] flex items-center justify-center"
                      style={{ 
                        transform: 'scale(0.75)', 
                        transformOrigin: 'center center',
                        margin: '-20px -40px'
                      }}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: template.html }}
                        style={{ 
                          pointerEvents: 'none',
                          maxWidth: '100%',
                          overflow: 'hidden'
                        }}
                      />
                    </div>
                    {/* Template Info */}
                    <div className="p-3 bg-gray-50 group-hover:bg-pink-50/50 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{template.nameZh}</div>
                          <div className="text-xs text-gray-500">{template.previewZh}</div>
                        </div>
                        <div className="text-pink-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-xs">
                          <span className="material-icons text-sm">add_circle</span>
                          插入
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
