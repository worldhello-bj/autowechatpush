import React, { useState } from 'react';
import { DesignTemplate } from '../../../services/designTemplates';
import { ContentTemplate, getContentCategories, getContentTemplatesByCategory, allContentTemplates } from '../../../services/contentTemplates';

interface ContentTemplateModalProps {
  onClose: () => void;
  onInsertTemplate: (template: DesignTemplate, smartMode?: boolean) => void;
}

const ContentTemplateModal: React.FC<ContentTemplateModalProps> = ({ 
  onClose, 
  onInsertTemplate 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ContentTemplate['category']>('tutorial');
  const [smartMode, setSmartMode] = useState(true);
  const contentCategories = getContentCategories();

  const handleContentTemplateClick = (contentTemplate: ContentTemplate) => {
    const designTemplate: DesignTemplate = {
      id: contentTemplate.id,
      name: contentTemplate.name,
      nameZh: contentTemplate.nameZh,
      category: 'special',
      preview: contentTemplate.preview,
      previewZh: contentTemplate.previewZh,
      html: contentTemplate.html
    };
    onInsertTemplate(designTemplate, smartMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="material-icons text-orange-500">article</span>
              全文模板库
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{allContentTemplates.length} 个模板</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">选择一套完整的文章版式，一键生成专业排版</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <span className="material-icons text-gray-400">close</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto">
          {contentCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                selectedCategory === cat.id 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' 
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {getContentTemplatesByCategory(selectedCategory).map((template) => (
              <div 
                key={template.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => handleContentTemplateClick(template)}
              >
                {/* Live Preview - Scaled down for full article templates (scale 0.3 → container 1/0.3 ≈ 333% to fill space) */}
                <div className="h-56 bg-gray-50 relative overflow-hidden">
                  <div 
                    className="absolute inset-0 w-full h-full p-4 overflow-hidden bg-white pointer-events-none"
                    style={{ transform: 'scale(0.3)', transformOrigin: 'top left', width: '333%', height: '333%' }}
                    dangerouslySetInnerHTML={{ __html: template.html }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="bg-white text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                      <span className="material-icons text-sm">add_circle</span>
                      使用此模板
                    </span>
                  </div>
                </div>
                {/* Template Info */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <h4 className="font-bold text-gray-800">{template.nameZh}</h4>
                  <p className="text-xs text-gray-500 mt-1">{template.previewZh}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="material-icons text-lg text-orange-400">lightbulb</span>
              模板插入后可在预览区域直接编辑内容
            </div>
            
            {/* Smart Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-orange-200 hover:bg-orange-50 transition select-none">
              <input 
                type="checkbox" 
                checked={smartMode}
                onChange={(e) => setSmartMode(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">智能匹配选中内容</span>
            </label>
          </div>

          <button 
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentTemplateModal;
