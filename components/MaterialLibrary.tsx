import React, { useState, useEffect, useRef } from 'react';

// --- Types ---
interface Material {
  id: string;
  type: 'image' | 'text' | 'template';
  name: string;
  content: string; // base64 for images, text content for text, HTML for templates
  thumbnail?: string;
  category: string;
  createdAt: number;
  tags: string[];
}

interface MaterialLibraryProps {
  onSelectMaterial: (material: Material) => void;
  onInsertImage: (imageDataUrl: string) => void;
  onInsertText: (text: string) => void;
}

const STORAGE_KEY = 'wechat_material_library';

// Default categories
const DEFAULT_CATEGORIES = ['全部', '图片', '文字', '模板', '收藏'];

// --- Component ---
const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ 
  onSelectMaterial, 
  onInsertImage, 
  onInsertText 
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'text'>('image');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialContent, setNewMaterialContent] = useState('');
  const [newMaterialTags, setNewMaterialTags] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('图片');
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load materials from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMaterials(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load materials:', e);
      }
    }
  }, []);

  // Save materials to localStorage
  const saveMaterials = (newMaterials: Material[]) => {
    setMaterials(newMaterials);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaterials));
  };

  // Handle image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setNewMaterialContent(base64);
      setNewMaterialName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadType('image');
      setNewMaterialCategory('图片');
      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add new material
  const handleAddMaterial = () => {
    if (!newMaterialContent.trim()) return;

    const newMaterial: Material = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: uploadType,
      name: newMaterialName || `素材 ${materials.length + 1}`,
      content: newMaterialContent,
      thumbnail: uploadType === 'image' ? newMaterialContent : undefined,
      category: newMaterialCategory,
      createdAt: Date.now(),
      tags: newMaterialTags.split(',').map(t => t.trim()).filter(Boolean),
    };

    saveMaterials([newMaterial, ...materials]);
    resetUploadForm();
    setShowUploadModal(false);
  };

  // Delete material
  const handleDeleteMaterial = (id: string) => {
    if (confirm('确定要删除这个素材吗？')) {
      saveMaterials(materials.filter(m => m.id !== id));
      if (previewMaterial?.id === id) {
        setPreviewMaterial(null);
      }
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setNewMaterialName('');
    setNewMaterialContent('');
    setNewMaterialTags('');
    setNewMaterialCategory('图片');
  };

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    const matchesCategory = selectedCategory === '全部' || m.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Use material
  const handleUseMaterial = (material: Material) => {
    if (material.type === 'image') {
      onInsertImage(material.content);
    } else {
      onInsertText(material.content);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden h-full flex flex-col">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-icons text-blue-600">folder_special</span>
            <h3 className="font-bold text-gray-800">素材库</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {materials.length} 个素材
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-1.5 hover:bg-blue-100 rounded-md text-gray-500 hover:text-blue-600 transition"
              title={viewMode === 'grid' ? '列表视图' : '网格视图'}
            >
              <span className="material-icons text-sm">
                {viewMode === 'grid' ? 'view_list' : 'grid_view'}
              </span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索素材..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Upload buttons */}
      <div className="p-3 border-b border-gray-100 flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
        >
          <span className="material-icons text-sm">add_photo_alternate</span>
          上传图片
        </button>
        <button
          onClick={() => {
            setUploadType('text');
            setNewMaterialCategory('文字');
            setShowUploadModal(true);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
        >
          <span className="material-icons text-sm">text_snippet</span>
          添加文字
        </button>
      </div>

      {/* Materials grid/list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-icons text-gray-300 text-5xl mb-3 block">folder_open</span>
            <p className="text-gray-500 text-sm">暂无素材</p>
            <p className="text-gray-400 text-xs mt-1">点击上方按钮添加素材</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                onClick={() => setPreviewMaterial(material)}
              >
                {material.type === 'image' ? (
                  <img
                    src={material.content}
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                    <p className="text-xs text-gray-600 line-clamp-4 text-center">
                      {material.content.slice(0, 60)}...
                    </p>
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseMaterial(material);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700"
                  >
                    使用
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMaterial(material.id);
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700"
                  >
                    删除
                  </button>
                </div>

                {/* Name tag */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{material.name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border border-gray-100"
                onClick={() => setPreviewMaterial(material)}
              >
                {material.type === 'image' ? (
                  <img
                    src={material.content}
                    alt={material.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 rounded-md">
                    <span className="material-icons text-indigo-600">text_snippet</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{material.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseMaterial(material);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"
                    title="使用"
                  >
                    <span className="material-icons text-sm">add_circle</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMaterial(material.id);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"
                    title="删除"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {uploadType === 'image' ? '添加图片素材' : '添加文字素材'}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Preview */}
              {uploadType === 'image' && newMaterialContent && (
                <div className="flex justify-center">
                  <img
                    src={newMaterialContent}
                    alt="Preview"
                    className="max-h-40 rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">素材名称</label>
                <input
                  type="text"
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  placeholder="给素材起个名字..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Content (for text type) */}
              {uploadType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">文字内容</label>
                  <textarea
                    value={newMaterialContent}
                    onChange={(e) => setNewMaterialContent(e.target.value)}
                    placeholder="输入文字内容..."
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={newMaterialCategory}
                  onChange={(e) => setNewMaterialCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="图片">图片</option>
                  <option value="文字">文字</option>
                  <option value="模板">模板</option>
                  <option value="收藏">收藏</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
                <input
                  type="text"
                  value={newMaterialTags}
                  onChange={(e) => setNewMaterialTags(e.target.value)}
                  placeholder="例如：风景, 头图, 封面"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleAddMaterial}
                disabled={!newMaterialContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加素材
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">{previewMaterial.name}</h3>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4">
              {previewMaterial.type === 'image' ? (
                <img
                  src={previewMaterial.content}
                  alt={previewMaterial.name}
                  className="w-full rounded-lg shadow-md"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{previewMaterial.content}</p>
                </div>
              )}
              
              {/* Meta info */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {previewMaterial.category}
                </span>
                {previewMaterial.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                创建于 {new Date(previewMaterial.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => {
                  handleDeleteMaterial(previewMaterial.id);
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                删除
              </button>
              <button
                onClick={() => {
                  handleUseMaterial(previewMaterial);
                  setPreviewMaterial(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                使用此素材
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialLibrary;
