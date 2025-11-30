import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { 
  allTextMaterials, 
  getTextMaterialCategories, 
  getMaterialsByCategory,
  TextMaterial,
  TextMaterialCategory
} from '../services/materialLibraryContent';

// Configure DOMPurify for SVG sanitization
const sanitizeSvg = (svgContent: string): string => {
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    ADD_ATTR: ['xlink:href', 'href']
  });
};

// --- Types ---
interface Material {
  id: string;
  type: 'image' | 'text' | 'template' | 'video' | 'svg' | 'gif';
  name: string;
  content: string; // base64 for images/videos/gifs, text/svg content for text/svg, HTML for templates
  thumbnail?: string;
  category: string;
  createdAt: number;
  tags: string[];
}

interface MaterialLibraryProps {
  onSelectMaterial: (material: Material) => void;
  onInsertImage: (imageDataUrl: string) => void;
  onInsertText: (text: string) => void;
  onInsertVideo?: (videoDataUrl: string) => void;
  onInsertSvg?: (svgContent: string) => void;
  onInsertGif?: (gifDataUrl: string) => void;
}

const STORAGE_KEY = 'wechat_material_library';

// Default categories
const DEFAULT_CATEGORIES = ['全部', '图片', '视频', 'GIF', 'SVG', '文字', '模板', '收藏'];

// --- Component ---
const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ 
  onSelectMaterial, 
  onInsertImage, 
  onInsertText,
  onInsertVideo,
  onInsertSvg,
  onInsertGif
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'text' | 'video' | 'svg' | 'gif'>('image');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialContent, setNewMaterialContent] = useState('');
  const [newMaterialTags, setNewMaterialTags] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('图片');
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // New state for preset materials
  const [activeTab, setActiveTab] = useState<'user' | 'preset'>('user');
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<TextMaterialCategory>('opening');
  const presetCategories = getTextMaterialCategories();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  // Memoized count of preset materials to avoid recalculation on every render
  const presetMaterialsCount = React.useMemo(() => allTextMaterials.length, []);

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

  // Handle video file upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setNewMaterialContent(base64);
      setNewMaterialName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadType('video');
      setNewMaterialCategory('视频');
      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
    
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Handle GIF file upload
  const handleGifUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setNewMaterialContent(base64);
      setNewMaterialName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadType('gif');
      setNewMaterialCategory('GIF');
      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
    
    if (gifInputRef.current) gifInputRef.current.value = '';
  };

  // Handle SVG file upload
  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const content = reader.result as string;
      setNewMaterialContent(content);
      setNewMaterialName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadType('svg');
      setNewMaterialCategory('SVG');
      setShowUploadModal(true);
    };
    reader.readAsText(file);
    
    if (svgInputRef.current) svgInputRef.current.value = '';
  };

  // Add new material
  const handleAddMaterial = () => {
    if (!newMaterialContent.trim()) return;

    // Generate a unique ID using crypto.randomUUID if available, fallback to timestamp-based
    const generateId = (): string => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `mat_${crypto.randomUUID()}`;
      }
      return `mat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    };

    // Determine thumbnail based on type
    let thumbnail: string | undefined;
    if (uploadType === 'image' || uploadType === 'gif') {
      thumbnail = newMaterialContent;
    } else if (uploadType === 'video') {
      // For video, we'll use a placeholder or generate a thumbnail later
      thumbnail = undefined;
    } else if (uploadType === 'svg') {
      // For SVG, create a data URL from the SVG content
      thumbnail = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(newMaterialContent)))}`;
    }

    const newMaterial: Material = {
      id: generateId(),
      type: uploadType,
      name: newMaterialName || `素材 ${materials.length + 1}`,
      content: newMaterialContent,
      thumbnail: thumbnail,
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
    switch (material.type) {
      case 'image':
        onInsertImage(material.content);
        break;
      case 'video':
        if (onInsertVideo) {
          onInsertVideo(material.content);
        }
        break;
      case 'gif':
        if (onInsertGif) {
          onInsertGif(material.content);
        } else {
          // Fallback to image insert for GIFs
          onInsertImage(material.content);
        }
        break;
      case 'svg':
        if (onInsertSvg) {
          onInsertSvg(material.content);
        }
        break;
      case 'text':
      case 'template':
      default:
        onInsertText(material.content);
        break;
    }
  };

  // Use preset material
  const handleUsePresetMaterial = (textMaterial: TextMaterial) => {
    onInsertText(textMaterial.content);
  };

  // Get filtered preset materials
  const filteredPresetMaterials = getMaterialsByCategory(selectedPresetCategory).filter(m => 
    searchQuery === '' || 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nameZh.includes(searchQuery) ||
    m.content.includes(searchQuery) ||
    m.tags.some(t => t.includes(searchQuery))
  );

  return (
    <div className="bg-white rounded-lg overflow-hidden h-full flex flex-col">
      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input 
        type="file" 
        ref={videoInputRef}
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />
      <input 
        type="file" 
        ref={gifInputRef}
        accept="image/gif"
        onChange={handleGifUpload}
        className="hidden"
      />
      <input 
        type="file" 
        ref={svgInputRef}
        accept="image/svg+xml,.svg"
        onChange={handleSvgUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-icons text-blue-600">folder_special</span>
            <h3 className="font-bold text-gray-800">素材库</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {activeTab === 'user' ? `${materials.length} 个素材` : `${presetMaterialsCount} 个预设`}
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

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'user' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-icons text-sm">cloud_upload</span>
            我的素材
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'preset' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-icons text-sm">auto_awesome</span>
            预设文案
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">NEW</span>
          </button>
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
            placeholder={activeTab === 'user' ? "搜索素材..." : "搜索预设文案..."}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category tabs - for user materials */}
        {activeTab === 'user' && (
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
        )}

        {/* Category tabs - for preset materials */}
        {activeTab === 'preset' && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {presetCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedPresetCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition flex items-center gap-1 ${
                  selectedPresetCategory === cat.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.nameZh}
                <span className={`text-xs px-1 rounded ${selectedPresetCategory === cat.id ? 'bg-purple-500' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload buttons - only show for user materials tab */}
      {activeTab === 'user' && (
        <div className="p-3 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-xs font-medium"
            >
              <span className="material-icons text-sm">add_photo_alternate</span>
              图片
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-xs font-medium"
            >
              <span className="material-icons text-sm">videocam</span>
              视频
            </button>
            <button
              onClick={() => gifInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition text-xs font-medium"
            >
              <span className="material-icons text-sm">gif</span>
              GIF
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => svgInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-xs font-medium"
            >
              <span className="material-icons text-sm">interests</span>
              SVG
            </button>
            <button
              onClick={() => {
                setUploadType('text');
                setNewMaterialCategory('文字');
                setShowUploadModal(true);
              }}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-xs font-medium"
            >
              <span className="material-icons text-sm">text_snippet</span>
              文字
            </button>
            <button
              onClick={() => {
                setUploadType('svg');
                setNewMaterialCategory('SVG');
                setShowUploadModal(true);
              }}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition text-xs font-medium"
            >
              <span className="material-icons text-sm">code</span>
              SVG代码
            </button>
          </div>
        </div>
      )}

      {/* Materials grid/list - User Materials */}
      {activeTab === 'user' && (
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
                  {/* Image type */}
                  {material.type === 'image' && (
                    <img
                      src={material.content}
                      alt={material.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* GIF type */}
                  {material.type === 'gif' && (
                    <div className="relative w-full h-full">
                      <img
                        src={material.content}
                        alt={material.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 right-1 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                        GIF
                      </span>
                    </div>
                  )}
                  
                  {/* Video type */}
                  {material.type === 'video' && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                      <div className="text-center">
                        <span className="material-icons text-3xl text-purple-600 mb-1">videocam</span>
                        <p className="text-xs text-purple-700 font-medium">视频</p>
                      </div>
                    </div>
                  )}
                  
                  {/* SVG type */}
                  {material.type === 'svg' && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-2">
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizeSvg(material.content)
                        }}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    </div>
                  )}
                  
                  {/* Text/Template type */}
                  {(material.type === 'text' || material.type === 'template') && (
                    <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                      <p className="text-xs text-gray-600 text-center overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
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
                {/* Thumbnail based on type */}
                {material.type === 'image' && (
                  <img
                    src={material.content}
                    alt={material.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                )}
                {material.type === 'gif' && (
                  <div className="relative">
                    <img
                      src={material.content}
                      alt={material.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] px-1 rounded font-bold">
                      GIF
                    </span>
                  </div>
                )}
                {material.type === 'video' && (
                  <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-md">
                    <span className="material-icons text-purple-600">videocam</span>
                  </div>
                )}
                {material.type === 'svg' && (
                  <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-md overflow-hidden">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeSvg(material.content)
                      }}
                      className="w-8 h-8"
                      style={{ transform: 'scale(0.3)', transformOrigin: 'center' }}
                    />
                  </div>
                )}
                {(material.type === 'text' || material.type === 'template') && (
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
      )}

      {/* Preset Materials Section */}
      {activeTab === 'preset' && (
        <div className="flex-1 overflow-y-auto p-3">
          {filteredPresetMaterials.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-gray-300 text-5xl mb-3 block">search_off</span>
              <p className="text-gray-500 text-sm">未找到匹配的预设文案</p>
              <p className="text-gray-400 text-xs mt-1">尝试其他搜索词或分类</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPresetMaterials.map((textMaterial) => (
                <div
                  key={textMaterial.id}
                  className="p-4 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
                  onClick={() => handleUsePresetMaterial(textMaterial)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{presetCategories.find(c => c.id === textMaterial.category)?.icon}</span>
                      <span className="font-medium text-gray-800">{textMaterial.nameZh}</span>
                    </div>
                    <span className="text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      <span className="material-icons text-sm">add_circle</span>
                      点击使用
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{textMaterial.content}</p>
                  <div className="flex flex-wrap gap-1">
                    {textMaterial.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {uploadType === 'image' && '添加图片素材'}
                {uploadType === 'video' && '添加视频素材'}
                {uploadType === 'gif' && '添加GIF素材'}
                {uploadType === 'svg' && '添加SVG素材'}
                {uploadType === 'text' && '添加文字素材'}
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
              {/* Preview for image */}
              {uploadType === 'image' && newMaterialContent && (
                <div className="flex justify-center">
                  <img
                    src={newMaterialContent}
                    alt="Preview"
                    className="max-h-40 rounded-lg shadow-md"
                  />
                </div>
              )}
              
              {/* Preview for GIF */}
              {uploadType === 'gif' && newMaterialContent && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={newMaterialContent}
                      alt="Preview"
                      className="max-h-40 rounded-lg shadow-md"
                    />
                    <span className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                      GIF
                    </span>
                  </div>
                </div>
              )}
              
              {/* Preview for video */}
              {uploadType === 'video' && newMaterialContent && (
                <div className="flex justify-center">
                  <video
                    src={newMaterialContent}
                    className="max-h-40 rounded-lg shadow-md"
                    controls
                  />
                </div>
              )}
              
              {/* Preview for SVG (from file) */}
              {uploadType === 'svg' && newMaterialContent && !newMaterialContent.startsWith('data:') && (
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeSvg(newMaterialContent)
                    }}
                    className="max-h-40"
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
              
              {/* Content (for SVG code input) */}
              {uploadType === 'svg' && !newMaterialContent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SVG代码</label>
                  <textarea
                    value={newMaterialContent}
                    onChange={(e) => setNewMaterialContent(e.target.value)}
                    placeholder="粘贴SVG代码，例如：<svg>...</svg>"
                    rows={6}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none font-mono"
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
                  <option value="视频">视频</option>
                  <option value="GIF">GIF</option>
                  <option value="SVG">SVG</option>
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
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">{previewMaterial.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  previewMaterial.type === 'video' ? 'bg-purple-100 text-purple-700' :
                  previewMaterial.type === 'gif' ? 'bg-pink-100 text-pink-700' :
                  previewMaterial.type === 'svg' ? 'bg-green-100 text-green-700' :
                  previewMaterial.type === 'image' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {previewMaterial.type.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            
            <div className="p-4">
              {/* Image preview */}
              {previewMaterial.type === 'image' && (
                <img
                  src={previewMaterial.content}
                  alt={previewMaterial.name}
                  className="w-full rounded-lg shadow-md"
                />
              )}
              
              {/* GIF preview */}
              {previewMaterial.type === 'gif' && (
                <img
                  src={previewMaterial.content}
                  alt={previewMaterial.name}
                  className="w-full rounded-lg shadow-md"
                />
              )}
              
              {/* Video preview */}
              {previewMaterial.type === 'video' && (
                <video
                  src={previewMaterial.content}
                  className="w-full rounded-lg shadow-md"
                  controls
                  autoPlay
                  muted
                />
              )}
              
              {/* SVG preview */}
              {previewMaterial.type === 'svg' && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeSvg(previewMaterial.content)
                    }}
                    className="max-w-full max-h-64"
                  />
                </div>
              )}
              
              {/* Text/Template preview */}
              {(previewMaterial.type === 'text' || previewMaterial.type === 'template') && (
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
