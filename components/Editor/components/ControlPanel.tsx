import React from 'react';
import { AIProvider } from '../../../types';
import { allDesignTemplates, getCategories } from '../../../services/designTemplates';

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
    <div className="w-full lg:w-1/2 p-6 flex flex-col gap-6 overflow-y-auto bg-white border-r border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">Editor Workspace</h2>
            <button
              onClick={() => setShowGuide(true)}
              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1"
            >
              <span className="material-icons text-[14px]">help_outline</span> Guide
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
            title="Save Local Draft"
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
            Create New
          </button>
          <button
            onClick={() => setIsFormattingMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${isFormattingMode ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="material-icons text-sm">format_paint</span>
            Format Existing
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition"
          >
            <span className="material-icons text-sm">download</span>
            Import Article
          </button>
        </div>

        <div>
          <label htmlFor="editor-topic-input" className="block text-sm font-medium text-gray-700 mb-1">
            {isFormattingMode ? 'Paste Text to Format' : 'Topic / Prompt'}
          </label>
          <textarea
            id="editor-topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={isFormattingMode
              ? "Paste your article content here. The AI will format it into a rich WeChat layout..."
              : "e.g. Write a guide about traveling to Kyoto in Autumn..."}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[80px] max-h-[150px] overflow-y-auto resize-y"
          />
        </div>

        {/* Custom User Prompt Input */}
        <div>
          <label htmlFor="editor-userprompt-input" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <span>Custom Prompt (Optional)</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">个性化</span>
          </label>
          <textarea
            id="editor-userprompt-input"
            value={userprompt}
            onChange={(e) => setUserprompt(e.target.value)}
            placeholder="Enter your custom prompt to override the default AI behavior..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px] max-h-[120px] overflow-y-auto resize-y text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            输入自定义prompt将覆盖默认的AI行为，支持个性化内容生成
          </p>
        </div>

        {/* Import Template Option */}
        {!isFormattingMode && (
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="material-icons text-orange-500 text-sm">article</span>
                导入文章作为模板
              </span>
              <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">可选</span>
            </label>

            {useTemplate && (
              <div className="space-y-2 animate-fade-in">
                <label htmlFor="template-url-input" className="block text-sm font-medium text-gray-700">
                  参考文章链接
                </label>
                <input
                  id="template-url-input"
                  type="text"
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                  placeholder="https://mp.weixin.qq.com/s/..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-600">
                  系统将提取该文章的结构框架，并在相同结构下生成新内容。
                  {isExtractingTemplate && <span className="text-orange-600 ml-2">正在提取模板...</span>}
                </p>
              </div>
            )}
          </div>
        )}

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
              Use Web Search
            </span>
          </label>

          {/* Dual AI Mode Toggle */}
          <label className={`flex items-center gap-2 px-3 py-2 rounded-md border transition ${
            isFormattingMode
              ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
              : useDualAI
                ? 'cursor-pointer bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300'
                : 'cursor-pointer hover:bg-purple-50 border-gray-200'
          }`}
            title={isFormattingMode ? "双AI模式在格式化模式下不可用" : "双AI模式：分两次调用，先生成内容后美化设计"}>
            <input
              type="checkbox"
              checked={useDualAI}
              onChange={(e) => setUseDualAI(e.target.checked)}
              disabled={isFormattingMode}
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
                  {analyzingImage ? 'Analyzing...' : (aiProvider !== AIProvider.DEEPSEEK ? 'Analyzed & Ready' : 'Cover Only')}
                </span>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-gray-500 font-medium">Upload Image (Cover)</span>
                {aiProvider !== AIProvider.DEEPSEEK && <span className="text-[10px] text-gray-400 mt-0.5">+ Image Analysis ({getProviderName()})</span>}
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
              {useDualAI && !isFormattingMode ? '双AI处理中...' : (isFormattingMode ? 'Formatting...' : 'Generating...')}
            </>
          ) : (
            <>
              <span className="material-icons">{isFormattingMode ? 'brush' : (useDualAI ? 'psychology' : 'auto_awesome')}</span>
              {isFormattingMode ? 'Format Article' : (useDualAI ? '双AI生成' : 'Generate Article')}
            </>
          )}
        </button>
      </div>

      {/* References */}
      {sources.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-xs font-bold text-blue-800 uppercase mb-2">Sources Used</h3>
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

      {/* WeChat Account Manager - Button Only */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={openWeChatAccountManager}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition"
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-green-600 text-lg">account_circle</span>
            <span className="font-medium text-sm text-gray-800">微信账号管理</span>
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              {wechatAccounts.length > 0 ? `${wechatAccounts.length}个账号` : '未配置'}
            </span>
          </div>
          <span className="material-icons text-gray-500 text-sm">open_in_new</span>
        </button>
      </div>

      {/* Material Library Panel - Button Only */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowMaterialLibrary(true)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition"
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-blue-600 text-lg">folder_special</span>
            <span className="font-medium text-sm text-gray-800">素材库</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">NEW</span>
          </div>
          <span className="material-icons text-gray-500 text-sm">open_in_new</span>
        </button>
      </div>

      {/* AI Tools Panel - Button Only */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowAITools(true)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition"
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-purple-600 text-lg">psychology</span>
            <span className="font-medium text-sm text-gray-800">AI 智能工具</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">含滑动条</span>
          </div>
          <span className="material-icons text-gray-500 text-sm">open_in_new</span>
        </button>
      </div>

      {/* Design Templates Panel - Button Only */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowDesignTemplates(true)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 transition"
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-pink-600 text-lg">palette</span>
            <span className="font-medium text-sm text-gray-800">精美设计格式库</span>
            <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">{allDesignTemplates.length}+</span>
          </div>
          <span className="material-icons text-gray-500 text-sm">open_in_new</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
