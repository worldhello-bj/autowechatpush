import React from 'react';
import { DesignTemplate, getCategories, getTemplatesByCategory } from '../../../services/designTemplates';

interface TemplateModalProps {
  onClose: () => void;
  onInsertTemplate: (template: DesignTemplate) => void;
  selectedCategory: DesignTemplate['category'];
  onCategoryChange: (category: DesignTemplate['category']) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ 
  onClose, 
  onInsertTemplate, 
  selectedCategory, 
  onCategoryChange 
}) => {
  const templateCategories = getCategories();

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="material-icons text-pink-500">palette</span>
              精美设计格式库
            </h3>
            <p className="text-sm text-gray-500 mt-1">点击任意模板即可插入到文章中</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <span className="material-icons text-gray-400">close</span>
          </button>
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-2 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto">
          {templateCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                selectedCategory === cat.id 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.nameZh}</span>
            </button>
          ))}
        </div>
        
        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getTemplatesByCategory(selectedCategory).map((template) => (
              <div 
                key={template.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => {
                  onInsertTemplate(template);
                  onClose();
                }}
              >
                {/* Template Info */}
                <div className="p-4 bg-white border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{template.nameZh}</h4>
                      <p className="text-xs text-gray-500 mt-1">{template.previewZh}</p>
                    </div>
                    <span className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition font-medium">
                      点击插入
                    </span>
                  </div>
                </div>
                {/* Live Preview - Safe: template.html is from internal trusted source */}
                <div 
                  className="p-4 bg-gray-50 min-h-[100px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: template.html }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="material-icons text-lg text-pink-400">lightbulb</span>
            模板插入后可在右侧预览中编辑内容
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
