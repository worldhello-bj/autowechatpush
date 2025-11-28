import React, { useState } from 'react';
import Slider from './Slider';

// --- Types ---
export interface AISettings {
  creativity: number;       // 0-100: Low = factual, High = creative
  contentLength: number;    // 0-100: Short, Medium, Long
  formalityLevel: number;   // 0-100: Casual to Formal
  detailLevel: number;      // 0-100: Brief to Detailed
  emotionIntensity: number; // 0-100: Neutral to Emotional
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  creativity: 50,
  contentLength: 50,
  formalityLevel: 50,
  detailLevel: 50,
  emotionIntensity: 30,
};

interface AIToolsPanelProps {
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onGenerateTitles: () => void;
  onGenerateSummary: () => void;
  onExtractKeywords: () => void;
  onGenerateHook: (style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising') => void;
  onGenerateCTA: (type: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection') => void;
  onSuggestStyles: () => void;
  onPolishContent: (tone: 'professional' | 'casual' | 'formal' | 'creative') => void;
  onRewriteContent: (style: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational') => void;
  onExpandContent: (style: 'detailed' | 'examples' | 'storytelling') => void;
  onTranslate: (targetLang: 'zh' | 'en') => void;
  
  // Results
  titleSuggestions: string[];
  keywords: string[];
  styleSuggestions: { style: string; reason: string; colorScheme: string[]; mood: string }[];
  generatedHook: string;
  generatedCTA: string;
  
  // Actions for results
  onSelectTitle: (title: string) => void;
  onInsertHook: (hook: string) => void;
  onInsertCTA: (cta: string) => void;
  
  // Loading state
  loading: boolean;
}

const AIToolsPanel: React.FC<AIToolsPanelProps> = ({
  settings,
  onSettingsChange,
  onGenerateTitles,
  onGenerateSummary,
  onExtractKeywords,
  onGenerateHook,
  onGenerateCTA,
  onSuggestStyles,
  onPolishContent,
  onRewriteContent,
  onExpandContent,
  onTranslate,
  titleSuggestions,
  keywords,
  styleSuggestions,
  generatedHook,
  generatedCTA,
  onSelectTitle,
  onInsertHook,
  onInsertCTA,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'generate' | 'enhance'>('settings');

  const updateSetting = (key: keyof AISettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Get description based on setting value
  const getCreativityDesc = (value: number) => {
    if (value < 33) return '保守、事实性强';
    if (value < 66) return '平衡创意与事实';
    return '高度创意、富有想象力';
  };

  const getLengthDesc = (value: number) => {
    if (value < 33) return '简洁精炼';
    if (value < 66) return '适中长度';
    return '详细完整';
  };

  const getFormalityDesc = (value: number) => {
    if (value < 33) return '轻松随意';
    if (value < 66) return '正式与随意兼具';
    return '正式专业';
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-100">
        {[
          { id: 'settings', label: 'AI 参数', icon: 'tune' },
          { id: 'generate', label: '生成工具', icon: 'auto_awesome' },
          { id: 'enhance', label: '增强工具', icon: 'psychology' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="material-icons text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-3 bg-purple-50 text-purple-600">
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">AI 处理中...</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-1">
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <span className="material-icons text-purple-500 text-sm">info</span>
                调整下方参数来控制 AI 生成内容的风格
              </p>
            </div>

            <Slider
              label="创意程度"
              icon="lightbulb"
              value={settings.creativity}
              min={0}
              max={100}
              step={5}
              onChange={(v) => updateSetting('creativity', v)}
              unit="%"
              description={getCreativityDesc(settings.creativity)}
              colorClass="bg-purple-500"
            />

            <Slider
              label="内容长度"
              icon="straighten"
              value={settings.contentLength}
              min={0}
              max={100}
              step={5}
              onChange={(v) => updateSetting('contentLength', v)}
              unit="%"
              description={getLengthDesc(settings.contentLength)}
              colorClass="bg-blue-500"
            />

            <Slider
              label="正式程度"
              icon="school"
              value={settings.formalityLevel}
              min={0}
              max={100}
              step={5}
              onChange={(v) => updateSetting('formalityLevel', v)}
              unit="%"
              description={getFormalityDesc(settings.formalityLevel)}
              colorClass="bg-green-500"
            />

            <Slider
              label="细节程度"
              icon="zoom_in"
              value={settings.detailLevel}
              min={0}
              max={100}
              step={5}
              onChange={(v) => updateSetting('detailLevel', v)}
              unit="%"
              description={settings.detailLevel < 50 ? '简要概述' : '详细展开'}
              colorClass="bg-orange-500"
            />

            <Slider
              label="情感强度"
              icon="favorite"
              value={settings.emotionIntensity}
              min={0}
              max={100}
              step={5}
              onChange={(v) => updateSetting('emotionIntensity', v)}
              unit="%"
              description={settings.emotionIntensity < 50 ? '客观中立' : '富有感染力'}
              colorClass="bg-pink-500"
            />

            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => onSettingsChange(DEFAULT_AI_SETTINGS)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">refresh</span>
                重置为默认值
              </button>
            </div>
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            {/* Title Suggestions */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span className="material-icons text-sm text-orange-500">title</span>
                  标题建议
                </h4>
                <button
                  onClick={onGenerateTitles}
                  disabled={loading}
                  className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 disabled:opacity-50"
                >
                  生成
                </button>
              </div>
              {titleSuggestions.length > 0 && (
                <div className="space-y-1">
                  {titleSuggestions.map((title, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectTitle(title)}
                      className="w-full text-left text-xs p-2 bg-orange-50 hover:bg-orange-100 rounded border border-orange-100 transition truncate"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary & Keywords */}
            <div className="flex gap-2 border-b border-gray-100 pb-4">
              <button
                onClick={onGenerateSummary}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                <span className="material-icons text-sm">summarize</span>
                自动摘要
              </button>
              <button
                onClick={onExtractKeywords}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 disabled:opacity-50"
              >
                <span className="material-icons text-sm">sell</span>
                提取关键词
              </button>
            </div>

            {/* Keywords Display */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 border-b border-gray-100 pb-4">
                {keywords.map((kw, idx) => (
                  <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Hook Generation */}
            <div className="border-b border-gray-100 pb-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                <span className="material-icons text-sm text-purple-500">psychology</span>
                生成开场白
              </h4>
              <div className="flex flex-wrap gap-1">
                {(['question', 'story', 'statistic', 'quote', 'surprising'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => onGenerateHook(style)}
                    disabled={loading}
                    className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 disabled:opacity-50 capitalize"
                  >
                    {style === 'question' ? '提问' : 
                     style === 'story' ? '故事' : 
                     style === 'statistic' ? '数据' : 
                     style === 'quote' ? '引用' : '惊奇'}
                  </button>
                ))}
              </div>
              {generatedHook && (
                <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-gray-700 border border-purple-100">
                  {generatedHook}
                  <button
                    onClick={() => onInsertHook(generatedHook)}
                    className="block mt-2 text-purple-600 hover:underline"
                  >
                    + 插入到开头
                  </button>
                </div>
              )}
            </div>

            {/* CTA Generation */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                <span className="material-icons text-sm text-red-500">campaign</span>
                生成行动号召
              </h4>
              <div className="flex flex-wrap gap-1">
                {(['subscribe', 'share', 'comment', 'action', 'reflection'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onGenerateCTA(type)}
                    disabled={loading}
                    className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50"
                  >
                    {type === 'subscribe' ? '关注' : 
                     type === 'share' ? '分享' : 
                     type === 'comment' ? '评论' : 
                     type === 'action' ? '行动' : '反思'}
                  </button>
                ))}
              </div>
              {generatedCTA && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-gray-700 border border-red-100">
                  {generatedCTA}
                  <button
                    onClick={() => onInsertCTA(generatedCTA)}
                    className="block mt-2 text-red-600 hover:underline"
                  >
                    + 插入到结尾
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhance Tab */}
        {activeTab === 'enhance' && (
          <div className="space-y-4">
            {/* Style Suggestions */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span className="material-icons text-sm text-pink-500">palette</span>
                  风格建议
                </h4>
                <button
                  onClick={onSuggestStyles}
                  disabled={loading}
                  className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded hover:bg-pink-200 disabled:opacity-50"
                >
                  分析
                </button>
              </div>
              {styleSuggestions.length > 0 && (
                <div className="space-y-2">
                  {styleSuggestions.map((s, idx) => (
                    <div key={idx} className="p-2 bg-pink-50 rounded text-xs border border-pink-100">
                      <div className="font-medium text-pink-800 capitalize">{s.style}</div>
                      <div className="text-gray-600 mt-1">{s.reason}</div>
                      <div className="flex gap-1 mt-2">
                        {s.colorScheme.map((color, cidx) => (
                          <span key={cidx} className="px-2 py-0.5 bg-white rounded border text-gray-600">
                            {color}
                          </span>
                        ))}
                      </div>
                      <div className="text-pink-600 mt-1 italic">情调: {s.mood}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Polish */}
            <div className="border-b border-gray-100 pb-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                <span className="material-icons text-sm text-cyan-500">auto_fix_high</span>
                润色内容
              </h4>
              <div className="flex flex-wrap gap-1">
                {(['professional', 'casual', 'formal', 'creative'] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => onPolishContent(tone)}
                    disabled={loading}
                    className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded hover:bg-cyan-100 disabled:opacity-50"
                  >
                    {tone === 'professional' ? '专业' : 
                     tone === 'casual' ? '休闲' : 
                     tone === 'formal' ? '正式' : '创意'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rewrite Content */}
            <div className="border-b border-gray-100 pb-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                <span className="material-icons text-sm text-indigo-500">refresh</span>
                改写风格
              </h4>
              <div className="flex flex-wrap gap-1">
                {(['humorous', 'serious', 'inspirational', 'educational', 'conversational'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => onRewriteContent(style)}
                    disabled={loading}
                    className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {style === 'humorous' ? '幽默' : 
                     style === 'serious' ? '严肃' : 
                     style === 'inspirational' ? '励志' : 
                     style === 'educational' ? '教育' : '对话'}
                  </button>
                ))}
              </div>
            </div>

            {/* Expand Content */}
            <div className="border-b border-gray-100 pb-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                <span className="material-icons text-sm text-amber-500">unfold_more</span>
                扩展内容
              </h4>
              <div className="flex flex-wrap gap-1">
                {(['detailed', 'examples', 'storytelling'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => onExpandContent(style)}
                    disabled={loading}
                    className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded hover:bg-amber-100 disabled:opacity-50"
                  >
                    {style === 'detailed' ? '详细' : 
                     style === 'examples' ? '举例' : '故事化'}
                  </button>
                ))}
              </div>
            </div>

            {/* Translation */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                <span className="material-icons text-sm text-teal-500">translate</span>
                翻译
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => onTranslate('zh')}
                  disabled={loading}
                  className="flex-1 text-xs bg-teal-50 text-teal-700 px-3 py-2 rounded hover:bg-teal-100 disabled:opacity-50"
                >
                  → 中文
                </button>
                <button
                  onClick={() => onTranslate('en')}
                  disabled={loading}
                  className="flex-1 text-xs bg-teal-50 text-teal-700 px-3 py-2 rounded hover:bg-teal-100 disabled:opacity-50"
                >
                  → English
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIToolsPanel;
