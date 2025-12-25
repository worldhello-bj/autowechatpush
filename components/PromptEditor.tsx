import React, { useState, useEffect } from 'react';
import { loadPrompts, savePrompts, resetPrompts, getDefaultPrompts, PromptConfig } from '../services/promptConfig';
import analytics from '../services/analytics';

const PromptEditor: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptConfig>(loadPrompts());
  const [activeTab, setActiveTab] = useState<'system' | 'generation' | 'formatting' | 'multiRound'>('system');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    savePrompts(prompts);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // Track prompt update event
    analytics.track('prompt_update', {
      hasSystemPrompt: !!prompts.systemPrompt,
      hasGenerationPrompt: !!prompts.generationPrompt,
      hasFormattingPrompt: !!prompts.formattingPrompt,
    });
  };

  const handleReset = () => {
    if (confirm('确定要恢复所有提示词到默认设置吗？此操作不可撤销。')) {
      const defaults = resetPrompts();
      setPrompts(defaults);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleLoadDefaults = () => {
    if (confirm('确定要加载默认提示词吗？当前未保存的更改将丢失。')) {
      setPrompts(getDefaultPrompts());
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="material-icons text-gray-400">edit_note</span> 提示词管理
          </h3>
          <p className="text-sm text-gray-500 mt-1">基于交通运输学院全媒体中心规范，自定义AI生成提示词</p>
        </div>
        <div className="flex gap-2">
          {saved && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <span className="material-icons text-sm">check_circle</span>
              已保存
            </span>
          )}
          <button
            onClick={handleLoadDefaults}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
          >
            查看默认
          </button>
          <button
            onClick={handleReset}
            className="text-sm px-3 py-1.5 border border-orange-300 text-orange-600 rounded hover:bg-orange-50"
          >
            恢复默认
          </button>
          <button
            onClick={handleSave}
            className="text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
          >
            保存更改
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'system'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          系统提示词
        </button>
        <button
          onClick={() => setActiveTab('generation')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'generation'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          生成提示词
        </button>
        <button
          onClick={() => setActiveTab('formatting')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'formatting'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          格式化提示词
        </button>
        <button
          onClick={() => setActiveTab('multiRound')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'multiRound'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          多轮排版提示词
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'system' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              系统提示词（定义AI的角色和基本规范）
            </label>
            <textarea
              value={prompts.systemPrompt}
              onChange={(e) => setPrompts({ ...prompts, systemPrompt: e.target.value })}
              className="w-full h-96 p-3 border border-gray-300 rounded font-mono text-sm"
              placeholder="定义AI编辑的角色、规范和要求..."
            />
            <p className="text-xs text-gray-500 mt-1">
              此提示词用于所有生成场景，定义AI的基本角色和规范要求
            </p>
          </div>
        )}

        {activeTab === 'generation' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成提示词（从主题生成完整文章）
            </label>
            <textarea
              value={prompts.generationPrompt}
              onChange={(e) => setPrompts({ ...prompts, generationPrompt: e.target.value })}
              className="w-full h-96 p-3 border border-gray-300 rounded font-mono text-sm"
              placeholder="定义如何从主题生成完整文章..."
            />
            <p className="text-xs text-gray-500 mt-1">
              变量：{'{{topic}}'} - 将被替换为用户输入的主题
            </p>
          </div>
        )}

        {activeTab === 'formatting' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              格式化提示词（格式化现有文本）
            </label>
            <textarea
              value={prompts.formattingPrompt}
              onChange={(e) => setPrompts({ ...prompts, formattingPrompt: e.target.value })}
              className="w-full h-96 p-3 border border-gray-300 rounded font-mono text-sm"
              placeholder="定义如何格式化现有文本..."
            />
            <p className="text-xs text-gray-500 mt-1">
              变量：{'{{input}}'} - 将被替换为用户输入的文本
            </p>
          </div>
        )}

        {activeTab === 'multiRound' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">第一轮</span>
                引言和背景
              </label>
              <textarea
                value={prompts.multiRound.round1}
                onChange={(e) =>
                  setPrompts({
                    ...prompts,
                    multiRound: { ...prompts.multiRound, round1: e.target.value }
                  })
                }
                className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-sm"
                placeholder="第一轮：生成引言和背景..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">第二轮</span>
                正文主体
              </label>
              <textarea
                value={prompts.multiRound.round2}
                onChange={(e) =>
                  setPrompts({
                    ...prompts,
                    multiRound: { ...prompts.multiRound, round2: e.target.value }
                  })
                }
                className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-sm"
                placeholder="第二轮：生成正文主体内容..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">第三轮</span>
                图片和组件
              </label>
              <textarea
                value={prompts.multiRound.round3}
                onChange={(e) =>
                  setPrompts({
                    ...prompts,
                    multiRound: { ...prompts.multiRound, round3: e.target.value }
                  })
                }
                className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-sm"
                placeholder="第三轮：添加图片和视觉组件..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">第四轮</span>
                总结和结语
              </label>
              <textarea
                value={prompts.multiRound.round4}
                onChange={(e) =>
                  setPrompts({
                    ...prompts,
                    multiRound: { ...prompts.multiRound, round4: e.target.value }
                  })
                }
                className="w-full h-48 p-3 border border-gray-300 rounded font-mono text-sm"
                placeholder="第四轮：生成总结和结语..."
              />
            </div>

            <p className="text-xs text-gray-500">
              变量：{'{{topic}}'} - 将被替换为用户输入的主题
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptEditor;
