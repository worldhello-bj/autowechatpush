import React from 'react';

interface ImportDialogProps {
  onClose: () => void;
  onImport: () => void;
  importUrl: string;
  onImportUrlChange: (url: string) => void;
  isImporting: boolean;
  importAsTemplate?: boolean;
  onImportAsTemplateChange?: (importAsTemplate: boolean) => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  onClose,
  onImport,
  importUrl,
  onImportUrlChange,
  isImporting,
  importAsTemplate = false,
  onImportAsTemplateChange
}) => {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-icons text-green-600">download</span>
            导入微信文章
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            粘贴微信公众号文章链接
          </label>
          <input
            type="text"
            value={importUrl}
            onChange={(e) => onImportUrlChange(e.target.value)}
            placeholder="https://mp.weixin.qq.com/s/..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isImporting}
          />
          <p className="text-xs text-gray-500 mt-2">
            支持微信公众号文章链接
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="material-icons text-yellow-600 text-sm mt-0.5">info</span>
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">版权提示</p>
              <p>本工具仅供排版学习使用，所有图片将被替换为占位符。请勿侵犯他人版权。</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-icons text-purple-600 text-sm">copy_all</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-800 mb-1">作为模板导入</p>
              <p className="text-xs text-purple-700">导入后可输入新主题，AI将基于模板样式重写内容</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={importAsTemplate}
                onChange={(e) => onImportAsTemplateChange?.(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                disabled={isImporting}
              />
              <span className="text-xs text-purple-800">启用</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            disabled={isImporting}
          >
            取消
          </button>
          <button
            onClick={onImport}
            disabled={isImporting || !importUrl.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                导入中...
              </>
            ) : (
              '智能拆解'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
