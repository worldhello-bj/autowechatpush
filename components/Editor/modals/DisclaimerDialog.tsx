import React from 'react';

interface DisclaimerDialogProps {
  onClose: () => void;
  onAccept: () => void;
}

const DisclaimerDialog: React.FC<DisclaimerDialogProps> = ({ onClose, onAccept }) => {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-icons text-yellow-600">warning</span>
            免责声明
          </h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">版权提示</h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>本工具仅供学习优秀文章的排版结构使用</li>
              <li>所有外部图片将被替换为占位符，不保留原始图片</li>
              <li>请勿将导入的内容用于商业用途</li>
              <li>请尊重原作者的版权，仅学习排版思路</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">功能说明</h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>系统会自动提取文章结构（标题、段落、布局等）</li>
              <li>保留排版骨架和代码结构</li>
              <li>清洗原文章的图片素材，替换为占位符</li>
              <li>可识别并提取SVG图形元素</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            取消
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            我已阅读并同意
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerDialog;
