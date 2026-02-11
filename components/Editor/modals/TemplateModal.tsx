import React, { useState, useEffect } from 'react';
import { DesignTemplate, getCategories, getTemplatesByCategory } from '../../../services/designTemplates';
import { ContentTemplate, getContentCategories, getContentTemplatesByCategory, allContentTemplates } from '../../../services/contentTemplates';
import { templateApi, UserTemplate } from '../../../services/apiClient';

interface TemplateModalProps {
  onClose: () => void;
  onInsertTemplate: (template: DesignTemplate, smartMode?: boolean) => void;
  selectedCategory: DesignTemplate['category'];
  onCategoryChange: (category: DesignTemplate['category']) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ 
  onClose, 
  onInsertTemplate, 
  selectedCategory, 
  onCategoryChange 
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'custom'>('design');
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [smartMode, setSmartMode] = useState(true);
  const [selectedContentCategory, setSelectedContentCategory] = useState<ContentTemplate['category']>('tutorial');
  const designCategories = getCategories();
  const contentCategories = getContentCategories();

  useEffect(() => {
    if (activeTab === 'custom') {
      loadUserTemplates();
    }
  }, [activeTab]);

  const loadUserTemplates = async () => {
    setLoading(true);
    try {
      const response = await templateApi.list();
      if (response.success && response.data) {
        setUserTemplates(response.data);
      }
    } catch (err) {
      console.error('Failed to load user templates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserTemplateClick = (userTemplate: UserTemplate) => {
    // Adapt UserTemplate to DesignTemplate format for insertion
    const designTemplate: DesignTemplate = {
      id: userTemplate.id,
      name: userTemplate.name,
      nameZh: userTemplate.name,
      category: 'special', // Treat as special category
      preview: userTemplate.preview || 'Custom Template',
      previewZh: userTemplate.preview || '自定义模板',
      html: userTemplate.originalHtml
    };
    onInsertTemplate(designTemplate, smartMode);
    onClose();
  };

  const handleContentTemplateClick = (contentTemplate: ContentTemplate) => {
    // Adapt ContentTemplate to DesignTemplate format for insertion
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
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="material-icons text-pink-500">palette</span>
              格式与模板库
            </h3>
            <p className="text-sm text-gray-500 mt-1">选择设计格式或文章模板插入到文章中</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <span className="material-icons text-gray-400">close</span>
          </button>
        </div>

        {/* Main Tabs - 3 tabs: Design Formats, Article Templates, My Templates */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-1 ${
              activeTab === 'design'
                ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="material-icons text-sm">brush</span>
            设计格式
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-1 ${
              activeTab === 'content'
                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="material-icons text-sm">article</span>
            文章模板
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">{allContentTemplates.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-1 ${
              activeTab === 'custom'
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="material-icons text-sm">folder_special</span>
            我的模板
          </button>
        </div>
        
        {/* Category Tabs (Design Formats) */}
        {activeTab === 'design' && (
          <div className="flex gap-2 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto">
            {designCategories.map((cat) => (
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
        )}

        {/* Category Tabs (Article Templates) */}
        {activeTab === 'content' && (
          <div className="flex gap-2 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto">
            {contentCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedContentCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                  selectedContentCategory === cat.id 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.nameZh}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'design' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTemplatesByCategory(selectedCategory).map((template) => (
                <div 
                  key={template.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    onInsertTemplate(template, smartMode);
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
          ) : activeTab === 'content' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getContentTemplatesByCategory(selectedContentCategory).map((template) => (
                <div 
                  key={template.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleContentTemplateClick(template)}
                >
                  {/* Template Info */}
                  <div className="p-4 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800">{template.nameZh}</h4>
                        <p className="text-xs text-gray-500 mt-1">{template.previewZh}</p>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition font-medium">
                        点击插入
                      </span>
                    </div>
                  </div>
                  {/* Live Preview - Scaled down for full article templates */}
                  <div className="h-48 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                    <div 
                      className="absolute inset-0 w-full h-full p-4 overflow-hidden bg-white pointer-events-none opacity-80"
                      style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '286%', height: '286%' }}
                      dangerouslySetInnerHTML={{ __html: template.html }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // User Templates Grid
            loading ? (
              <div className="flex justify-center items-center h-40">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : userTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <span className="material-icons text-4xl text-gray-300 mb-2">folder_open</span>
                <p>暂无保存的模板</p>
                <p className="text-xs mt-2">导入文章并保存后即可在此处看到</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleUserTemplateClick(template)}
                  >
                    <div className="p-4 bg-white border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-800">{template.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{template.preview}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition font-medium">
                          点击插入
                        </span>
                      </div>
                    </div>
                    {/* Live Preview - Scaled down */}
                    <div className="h-40 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                      <div 
                        className="absolute inset-0 w-full h-full p-4 overflow-hidden bg-white pointer-events-none opacity-80"
                        style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                        dangerouslySetInnerHTML={{ __html: template.originalHtml }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="material-icons text-lg text-pink-400">lightbulb</span>
              {activeTab === 'design' ? '格式插入后可在预览中编辑内容' : '模板插入后可在预览中编辑内容'}
            </div>
            
            {/* Smart Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-full border border-pink-200 hover:bg-pink-50 transition select-none">
              <input 
                type="checkbox" 
                checked={smartMode}
                onChange={(e) => setSmartMode(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-700">智能匹配选中内容</span>
            </label>
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
