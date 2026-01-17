import React from 'react';

interface GuideModalProps {
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">New User Guide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="prose prose-sm prose-green max-w-none">
          <p>Follow these steps to automate your WeChat Official Account publishing.</p>
          <h4>1. Get Credentials</h4>
          <ul>
            <li>Log in to WeChat Official Account Admin.</li>
            <li>Go to <strong>Development</strong> {'>'} <strong>Basic Configuration</strong>.</li>
            <li>Copy your <strong>AppID</strong> and <strong>AppSecret</strong>.</li>
          </ul>
          <h4>2. Whitelist IP</h4>
          <ul>
            <li>In Basic Configuration, add your current IP address to the whitelist.</li>
          </ul>
          <h4>3. Publishing</h4>
          <ul>
            <li>Generate content with AI (or format existing text).</li>
            <li>Edit visually in the right panel.</li>
            <li>Save draft locally if needed.</li>
            <li>Click "Publish to WeChat" to send to Draft Box.</li>
          </ul>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Got it</button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
