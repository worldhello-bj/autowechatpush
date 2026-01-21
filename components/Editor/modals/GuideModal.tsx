import React from 'react';

interface GuideModalProps {
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">新用户指南</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="prose prose-sm prose-green max-w-none">
          <p>按照以下步骤自动发布您的微信公众号内容。</p>
          <h4>1. 获取凭证</h4>
          <ul>
            <li>登录微信公众号后台管理。</li>
            <li>进入<strong>开发</strong> {'>'} <strong>基本配置</strong>。</li>
            <li>复制您的<strong>AppID</strong>和<strong>AppSecret</strong>。</li>
          </ul>
          <h4>2. IP白名单</h4>
          <ul>
            <li>在基本配置中，将当前IP地址添加到白名单。</li>
          </ul>
          <h4>3. 发布内容</h4>
          <ul>
            <li>使用AI生成内容（或格式化现有文本）。</li>
            <li>在右侧面板中进行可视化编辑。</li>
            <li>如需要，可将草稿本地保存。</li>
            <li>点击"发布到微信"发送到草稿箱。</li>
          </ul>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">知道了</button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
