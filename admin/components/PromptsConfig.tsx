/**
 * Prompts Configuration Component
 * 
 * This component allows administrators to view and edit AI generation prompts
 * used throughout the application.
 */

import React, { useState } from 'react';
import { loadPrompts, savePrompts, resetPrompts, getDefaultPrompts, type PromptConfig } from '../../services/promptConfig';

const PromptsConfig: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptConfig>(loadPrompts());
  const [activePrompt, setActivePrompt] = useState<'system' | 'generation' | 'formatting' | 'round1' | 'round2' | 'round3' | 'round4'>('system');
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = () => {
    try {
      savePrompts(prompts);
      setSaveMessage({ type: 'success', text: '✅ 提示词配置已保存' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: '❌ 保存失败，请重试' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleReset = () => {
    const defaults = resetPrompts();
    setPrompts(defaults);
    setShowResetConfirm(false);
    setSaveMessage({ type: 'success', text: '✅ 已恢复默认配置' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleCancel = () => {
    setPrompts(loadPrompts());
    setSaveMessage({ type: 'success', text: '✅ 已取消更改' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const updatePrompt = (key: string, value: string) => {
    if (key.startsWith('round')) {
      setPrompts({
        ...prompts,
        multiRound: {
          ...prompts.multiRound,
          [key]: value
        }
      });
    } else {
      setPrompts({
        ...prompts,
        [key === 'system' ? 'systemPrompt' : key === 'generation' ? 'generationPrompt' : 'formattingPrompt']: value
      });
    }
  };

  const getCurrentPromptValue = (): string => {
    switch (activePrompt) {
      case 'system':
        return prompts.systemPrompt;
      case 'generation':
        return prompts.generationPrompt;
      case 'formatting':
        return prompts.formattingPrompt;
      case 'round1':
        return prompts.multiRound.round1;
      case 'round2':
        return prompts.multiRound.round2;
      case 'round3':
        return prompts.multiRound.round3;
      case 'round4':
        return prompts.multiRound.round4;
      default:
        return '';
    }
  };

  const promptsNav = [
    { id: 'system' as const, label: '系统提示词', icon: 'settings', desc: 'AI的基础行为规范和角色设定' },
    { id: 'generation' as const, label: '生成提示词', icon: 'create', desc: '用于生成新文章的提示词' },
    { id: 'formatting' as const, label: '格式化提示词', icon: 'format_align_left', desc: '用于格式化现有文本的提示词' },
    { id: 'round1' as const, label: '多轮-引言背景', icon: 'looks_one', desc: '多轮生成第1轮：引言和背景' },
    { id: 'round2' as const, label: '多轮-正文主体', icon: 'looks_two', desc: '多轮生成第2轮：正文主体内容' },
    { id: 'round3' as const, label: '多轮-图片元素', icon: 'looks_3', desc: '多轮生成第3轮：图片和视觉元素' },
    { id: 'round4' as const, label: '多轮-总结结语', icon: 'looks_4', desc: '多轮生成第4轮：总结和结语' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="material-icons text-purple-500">edit_note</span>
          提示词配置管理
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          配置AI生成文章时使用的提示词。这些提示词定义了AI的行为、输出格式和写作风格。
        </p>
      </div>

      <div className="flex">
        {/* Left Sidebar - Navigation */}
        <div className="w-64 border-r bg-gray-50 p-4 space-y-1">
          {promptsNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePrompt(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activePrompt === item.id
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-6">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Right Content - Editor */}
        <div className="flex-1 p-6">
          {/* Current Prompt Info */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="material-icons text-purple-500">
                  {promptsNav.find(p => p.id === activePrompt)?.icon}
                </span>
                {promptsNav.find(p => p.id === activePrompt)?.label}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const defaults = getDefaultPrompts();
                    const defaultValue = activePrompt === 'system' ? defaults.systemPrompt :
                                       activePrompt === 'generation' ? defaults.generationPrompt :
                                       activePrompt === 'formatting' ? defaults.formattingPrompt :
                                       defaults.multiRound[activePrompt];
                    updatePrompt(activePrompt, defaultValue);
                  }}
                  className="text-sm text-gray-600 hover:text-purple-600 flex items-center gap-1"
                >
                  <span className="material-icons text-sm">refresh</span>
                  恢复默认
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {promptsNav.find(p => p.id === activePrompt)?.desc}
            </p>
          </div>

          {/* Prompt Editor */}
          <div className="mb-4">
            <textarea
              value={getCurrentPromptValue()}
              onChange={(e) => updatePrompt(activePrompt, e.target.value)}
              className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm resize-none"
              placeholder="在此输入提示词..."
            />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div>
                字符数: {getCurrentPromptValue().length}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-xs">info</span>
                <span>支持变量: {'{{topic}}'}, {'{{input}}'}</span>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="material-icons text-blue-500 text-sm">lightbulb</span>
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">提示词编写建议：</div>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>使用清晰、具体的指令，避免模糊的描述</li>
                  <li>提供示例来说明期望的输出格式</li>
                  <li>使用 {'{{topic}}'} 或 {'{{input}}'} 作为变量占位符</li>
                  <li>分步骤说明任务，帮助AI理解复杂需求</li>
                  <li>指定输出格式、长度、风格等约束条件</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              {saveMessage && (
                <div className={`text-sm flex items-center gap-2 ${
                  saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="material-icons text-lg">
                    {saveMessage.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  {saveMessage.text}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition"
              >
                <span className="material-icons text-sm mr-1 align-middle">restore</span>
                全部重置
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <span className="material-icons text-lg">save</span>
                保存配置
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-icons text-red-500 text-3xl">warning</span>
              <h3 className="text-lg font-bold text-gray-800">确认重置</h3>
            </div>
            <p className="text-gray-600 mb-6">
              确定要将所有提示词恢复为默认配置吗？此操作将丢失所有自定义修改。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptsConfig;
