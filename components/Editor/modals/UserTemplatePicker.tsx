import React, { useState, useEffect } from 'react';
import { templateApi, UserTemplate } from '../../../services/apiClient';

interface UserTemplatePickerProps {
  onClose: () => void;
  onSelect: (template: UserTemplate) => void;
}

const UserTemplatePicker: React.FC<UserTemplatePickerProps> = ({ onClose, onSelect }) => {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await templateApi.list();
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error?.message || 'Failed to load templates');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个模板吗？')) return;

    try {
      await templateApi.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-800">我的模板库</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : templates.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <span className="material-icons text-4xl text-gray-300 mb-2">folder_open</span>
              <p>暂无保存的模板</p>
              <p className="text-xs mt-2">导入文章并勾选"保存为模板"即可添加到这里</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition group relative"
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {/* Preview (scaled down HTML) */}
                    <div 
                      className="absolute inset-0 w-full h-full p-2 overflow-hidden bg-white pointer-events-none opacity-60"
                      style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                      dangerouslySetInnerHTML={{ __html: template.originalHtml }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>
                  
                  <div className="p-3">
                    <h4 className="font-bold text-gray-800 truncate" title={template.name}>{template.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">{template.preview}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-400">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        {template.textRegions.length} 个区域
                      </span>
                    </div>
                  </div>

                  {/* Delete Button (visible on hover) */}
                  <button
                    onClick={(e) => handleDelete(e, template.id)}
                    className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
                    title="删除模板"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTemplatePicker;
