import React from 'react';
import { AIProvider } from '../../../types';
import { allDesignTemplates, getCategories } from '../../../services/designTemplates';
import { allContentTemplates } from '../../../services/contentTemplates';

interface ControlPanelProps {
  // UI State
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  showImportDialog: boolean;
  setShowImportDialog: (show: boolean) => void;
  showDisclaimer: boolean;
  setShowDisclaimer: (show: boolean) => void;
  showMaterialLibrary: boolean;
  setShowMaterialLibrary: (show: boolean) => void;
  showDesignTemplates: boolean;
  setShowDesignTemplates: (show: boolean) => void;
  selectedTemplateCategory: any;
  setSelectedTemplateCategory: (category: any) => void;

  // AI Provider
  aiProvider: AIProvider;

  // Article Content
  articleTitle: string;
  setArticleTitle: (title: string) => void;
  articleDigest: string;
  setArticleDigest: (digest: string) => void;

  // Article Generator
  isFormattingMode: boolean;
  setIsFormattingMode: (mode: boolean) => void;
  topic: string;
  setTopic: (topic: string) => void;
  userprompt: string;
  setUserprompt: (prompt: string) => void;
  useSearch: boolean;
  setUseSearch: (use: boolean) => void;
  useDualAI: boolean;
  setUseDualAI: (use: boolean) => void;
  uploadedImagePreview: string | null;
  analyzingImage: boolean;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  stitchFileInputRef: React.RefObject<HTMLInputElement>;
  stitchLoading: boolean;
  handleStitchUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  handleGenerate: () => void;

  // Template Import (for article generation)
  useTemplate: boolean;
  setUseTemplate: (use: boolean) => void;
  templateUrl: string;
  setTemplateUrl: (url: string) => void;
  isExtractingTemplate: boolean;
  articleTemplateName: string | null;
  onOpenUserTemplatePicker: () => void;
  onOpenContentTemplates: () => void;

  // WeChat Manager
  wechatAccounts: any[];
  openWeChatAccountManager: () => void;

  // AI Tools
  setShowAITools: (show: boolean) => void;

  // Sources
  sources: any[];

  // Actions
  saveLocalDraft: () => void;

  // Features
  featuresAvailable: any;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  showGuide,
  setShowGuide,
  showImportDialog,
  setShowImportDialog,
  showDisclaimer,
  setShowDisclaimer,
  showMaterialLibrary,
  setShowMaterialLibrary,
  showDesignTemplates,
  setShowDesignTemplates,
  selectedTemplateCategory,
  setSelectedTemplateCategory,
  aiProvider,
  articleTitle,
  setArticleTitle,
  articleDigest,
  setArticleDigest,
  isFormattingMode,
  setIsFormattingMode,
  topic,
  setTopic,
  userprompt,
  setUserprompt,
  useSearch,
  setUseSearch,
  useDualAI,
  setUseDualAI,
  uploadedImagePreview,
  analyzingImage,
  handleImageUpload,
  stitchFileInputRef,
  stitchLoading,
  handleStitchUpload,
  loading,
  handleGenerate,
  useTemplate,
  setUseTemplate,
  templateUrl,
  setTemplateUrl,
  isExtractingTemplate,
  articleTemplateName,
  onOpenUserTemplatePicker,
  onOpenContentTemplates,
  wechatAccounts,
  openWeChatAccountManager,
  setShowAITools,
  sources,
  saveLocalDraft,
  featuresAvailable
}) => {
  // Helper to determine badge color
  const getProviderColor = () => {
    switch(aiProvider) {
      case AIProvider.DEEPSEEK: return 'bg-blue-500';
      case AIProvider.QWEN: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getProviderName = () => {
    switch(aiProvider) {
      case AIProvider.DEEPSEEK: return 'DeepSeek';
      case AIProvider.QWEN: return 'Qwen (Tongyi)';
      default: return 'Unknown';
    }
  };

  const templateCategories = getCategories();

  return (
    <div className="w-full lg:w-1/2 p-6 flex flex-col gap-6 overflow-y-auto bg-white rounded-2xl shadow-lg border border-gray-100/50">
      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">编辑器工作区</h2>
            <button
              onClick={() => setShowGuide(true)}
              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1"
            >
              <span className="material-icons text-[14px]">help_outline</span> 指南
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${getProviderColor()}`}></span>
            <p className="text-gray-500 text-sm">Powered by {getProviderName()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveLocalDraft}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
            title="保存草稿到服务器"
          >
            <span className="material-icons">save</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        {/* Mode Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setIsFormattingMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${!isFormattingMode ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="material-icons text-sm">auto_awesome</span>
            创建新内容
          </button>
          <button
            onClick={() => setIsFormattingMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${isFormattingMode ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="material-icons text-sm">format_paint</span>
            格式化现有内容
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition"
          >
            <span className="material-icons text-sm">download</span>
            导入文章
          </button>
        </div>

        <div>
          <label htmlFor="editor-topic-input" className="block text-sm font-medium text-gray-700 mb-1">
            {isFormattingMode ? '粘贴要格式化的文本' : '主题/提示词'}
          </label>
          <textarea
            id="editor-topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={isFormattingMode
              ? "将您的文章内容粘贴到此处。AI将为您转换为丰富的微信布局..."
              : "例如：写一篇关于秋季京都旅行的指南..."}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all min-h-[80px] max-h-[150px] overflow-y-auto resize-y text-gray-800"
          />
        </div>

        {/* Custom User Prompt Input */}
        <div>
          <label htmlFor="editor-userprompt-input" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <span>自定义Prompt（可选）</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">个性化</span>
          </label>
          <textarea
            id="editor-userprompt-input"
            value={userprompt}
            onChange={(e) => setUserprompt(e.target.value)}
            placeholder="输入自定义prompt以覆盖默认的AI行为..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[60px] max-h-[120px] overflow-y-auto resize-y text-sm text-gray-800"
          />
          <p className="text-xs text-gray-500 mt-1">
            输入自定义prompt将覆盖默认的AI行为，支持个性化内容生成
          </p>
        </div>

        {/* Use Template Option */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="material-icons text-orange-500 text-sm">style</span>
              {isFormattingMode ? '套用设计模板' : '使用排版模板'}
            </span>
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">可选</span>
          </label>

          {useTemplate && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenContentTemplates}
                  className="py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition flex items-center justify-center gap-1 text-sm font-medium shadow-sm"
                >
                  <span className="material-icons text-sm">article</span>
                  全文模板
                </button>
                <button
                  onClick={onOpenUserTemplatePicker}
                  className="py-2 bg-white border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-50 transition flex items-center justify-center gap-1 text-sm font-medium shadow-sm"
                >
                  <span className="material-icons text-sm">folder_open</span>
                  我的模板
                </button>
              </div>
              
              {articleTemplateName && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="material-icons text-green-600 text-sm">check_circle</span>
                  <span className="text-xs text-green-700 font-medium truncate">已选模板：{articleTemplateName}</span>
                </div>
              )}
              
              {!isFormattingMode && (
                <p className="text-xs text-gray-500 bg-white/50 p-2 rounded border border-orange-100">
                  <span className="font-bold text-orange-600">提示：</span> 
                  如需添加新模板，请点击上方的“导入文章”按钮，勾选“作为模板导入”，并在导入后保存。
                </p>
              )}
              
              {isExtractingTemplate && <p className="text-xs text-orange-600">正在准备模板...</p>}
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <label className={`flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 transition ${aiProvider === AIProvider.DEEPSEEK || isFormattingMode ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-100'}`}>
            <input
              type="checkbox"
              checked={useSearch}
              onChange={(e) => setUseSearch(e.target.checked)}
              disabled={aiProvider === AIProvider.DEEPSEEK || isFormattingMode}
              className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              使用网页搜索
            </span>
          </label>

          {/* Dual AI Mode Toggle - Only available for new article generation from topic */}
          <label className={`flex items-center gap-2 px-3 py-2 rounded-md border transition ${
            (isFormattingMode || useTemplate)
              ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
              : useDualAI
                ? 'cursor-pointer bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300'
                : 'cursor-pointer hover:bg-purple-50 border-gray-200'
          }`}
            title={
              isFormattingMode 
                ? "双AI模式在格式化模式下不可用" 
                : useTemplate
                  ? "双AI模式在使用模板时不可用，仅用于主题生成新文章"
                  : "双AI模式：分两次调用，先生成内容后美化设计"
            }>
            <input
              type="checkbox"
              checked={useDualAI}
              onChange={(e) => setUseDualAI(e.target.checked)}
              disabled={isFormattingMode || useTemplate}
              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="material-icons text-sm text-purple-500">psychology</span>
              双AI模式
            </span>
            {useDualAI && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">两次调用</span>}
          </label>
        </div>

        {/* Dual AI Mode Info */}
        {useDualAI && !isFormattingMode && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-icons text-purple-500 text-lg">auto_awesome</span>
              <div>
                <span className="font-medium text-purple-700">双AI模式已启用（两次调用）</span>
                <p className="text-xs text-purple-600 mt-1">
                  ✨ 第一次：专注内容创作 → 第二次：优化排版设计 → 节省上下文，更加专精
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Image Analysis Upload */}
        <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 transition text-center relative ${aiProvider === AIProvider.DEEPSEEK ? 'hover:bg-gray-50 opacity-80' : 'hover:bg-gray-100'}`}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="pointer-events-none flex flex-col items-center justify-center">
            {uploadedImagePreview ? (
              <div className="relative">
                <img src={uploadedImagePreview} alt="Context" className="h-24 object-contain rounded shadow-sm mb-2" />
                <span className={`text-xs px-2 py-0.5 rounded-full ${analyzingImage ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {analyzingImage ? '分析中...' : (aiProvider !== AIProvider.DEEPSEEK ? '已分析并准备就绪' : '仅封面')}
                </span>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-gray-500 font-medium">上传图片（封面）</span>
                {aiProvider !== AIProvider.DEEPSEEK && <span className="text-[10px] text-gray-400 mt-0.5">+ 图片分析 ({getProviderName()})</span>}
              </>
            )}
          </div>
        </div>

        {/* Backend Stitch Control - Compact */}
        <div className="border border-green-200 rounded-lg p-2 bg-green-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-icons text-green-600 text-sm">photo_library</span>
            <span className="text-xs font-medium text-gray-700">无缝拼接</span>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={stitchFileInputRef}
              onChange={handleStitchUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => stitchFileInputRef.current?.click()}
              disabled={stitchLoading}
              className={`px-2 py-1 rounded text-white text-xs shadow ${stitchLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {stitchLoading ? '拼接中...' : '选择图片并拼接'}
            </button>
            <span className="text-[10px] text-gray-400 hidden sm:inline">多图拼接为长图</span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || analyzingImage}
          className={`w-full font-semibold py-3 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition flex justify-center items-center gap-2 ${
            useDualAI && !isFormattingMode
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {useDualAI && !isFormattingMode ? '双AI处理中...' : (isFormattingMode ? '格式化中...' : '生成中...')}
            </>
          ) : (
            <>
              <span className="material-icons">{isFormattingMode ? 'brush' : (useDualAI ? 'psychology' : 'auto_awesome')}</span>
              {isFormattingMode ? '格式化文章' : (useDualAI ? '双AI生成' : '生成文章')}
            </>
          )}
        </button>
      </div>

      {/* References */}
      {sources.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-xs font-bold text-blue-800 uppercase mb-2">使用的来源</h3>
          <ul className="text-xs space-y-1">
            {sources.map((s: any, idx: number) => (
              <li key={idx}>
                <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                  • {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Tools Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* WeChat Account Manager */}
        <button
          onClick={openWeChatAccountManager}
          className="group flex flex-col p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-green-200 transition text-left"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="material-icons text-green-600 text-2xl group-hover:scale-110 transition-transform">account_circle</span>
            <span className="text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-100">
              {wechatAccounts.length}
            </span>
          </div>
          <span className="font-semibold text-sm text-gray-800">微信账号</span>
          <span className="text-xs text-gray-500 mt-0.5">管理与配置</span>
        </button>

        {/* Material Library */}
        <button
          onClick={() => setShowMaterialLibrary(true)}
          className="group flex flex-col p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition text-left"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="material-icons text-blue-600 text-2xl group-hover:scale-110 transition-transform">folder_special</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">NEW</span>
          </div>
          <span className="font-semibold text-sm text-gray-800">素材库</span>
          <span className="text-xs text-gray-500 mt-0.5">图片/视频/SVG</span>
        </button>

        {/* AI Tools Panel */}
        <button
          onClick={() => setShowAITools(true)}
          className="group flex flex-col p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition text-left"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="material-icons text-purple-600 text-2xl group-hover:scale-110 transition-transform">psychology</span>
          </div>
          <span className="font-semibold text-sm text-gray-800">AI 工具箱</span>
          <span className="text-xs text-gray-500 mt-0.5">润色/摘要/扩写</span>
        </button>

        {/* Design Templates Panel */}
        <button
          onClick={() => setShowDesignTemplates(true)}
          className="group flex flex-col p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-pink-50 hover:border-pink-200 transition text-left"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="material-icons text-pink-600 text-2xl group-hover:scale-110 transition-transform">palette</span>
            <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">{allDesignTemplates.length}+</span>
          </div>
          <span className="font-semibold text-sm text-gray-800">设计格式</span>
          <span className="text-xs text-gray-500 mt-0.5">组件格式库</span>
        </button>

        {/* Full Article Templates Panel */}
        <button
          onClick={onOpenContentTemplates}
          className="group flex flex-col p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition text-left"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="material-icons text-orange-600 text-2xl group-hover:scale-110 transition-transform">article</span>
            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">{allContentTemplates.length}</span>
          </div>
          <span className="font-semibold text-sm text-gray-800">全文模板</span>
          <span className="text-xs text-gray-500 mt-0.5">文章版式库</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
