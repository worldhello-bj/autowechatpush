import React, { useState } from 'react';

interface RewriteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRewrite: (topic: string) => void;
  onSaveTemplate?: (name: string) => Promise<void>;
  isRewriting: boolean;
  originalTitle: string;
  originalDigest: string;
}

const RewriteDialog: React.FC<RewriteDialogProps> = ({
  isOpen,
  onClose,
  onRewrite,
  onSaveTemplate,
  isRewriting,
  originalTitle,
  originalDigest
}) => {
  const [topic, setTopic] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onRewrite(topic.trim());
    }
  };

  const handleClose = () => {
    setTopic('');
    setShowSaveForm(false);
    setTemplateName('');
    onClose();
  };

  const handleSaveTemplateClick = async () => {
    if (!templateName.trim() || !onSaveTemplate) return;
    
    setIsSaving(true);
    try {
      await onSaveTemplate(templateName.trim());
      setShowSaveForm(false);
      // Optional: Show success message or close dialog? 
      // For now, we keep the dialog open to allow rewriting
      alert('模板保存成功！');
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-icons text-purple-600">edit</span>
            AI重写文章
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isRewriting}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-gray-700 mb-1">原始文章信息</p>
          <p className="text-sm text-gray-600 mb-1"><strong>标题：</strong>{originalTitle}</p>
          <p className="text-sm text-gray-600"><strong>摘要：</strong>{originalDigest}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="material-icons text-purple-600 text-sm mt-0.5">lightbulb</span>
            <div className="text-xs text-purple-800">
              <p className="font-medium mb-1">AI重写说明</p>
              <p>AI将保持原文章的排版样式和结构，只重写文字内容以匹配新的主题。</p>
            </div>
          </div>
        </div>

        {/* Save Template Option */}
        {onSaveTemplate && !showSaveForm && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setTemplateName(originalTitle.slice(0, 20) + ' 模板');
                setShowSaveForm(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span className="material-icons text-sm">save</span>
              保存为我的模板
            </button>
          </div>
        )}

        {/* Save Template Form */}
        {showSaveForm && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              模板名称
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1 p-2 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入模板名称..."
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={handleSaveTemplateClick}
                disabled={isSaving || !templateName.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="px-3 py-2 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300"
                disabled={isSaving}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新主题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入新的文章主题..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isRewriting}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              AI将基于此主题重写文章内容，保持原有排版风格
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              disabled={isRewriting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isRewriting || !topic.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRewriting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  重写中...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">auto_fix_high</span>
                  开始重写
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RewriteDialog;
