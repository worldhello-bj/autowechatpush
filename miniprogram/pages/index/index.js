/**
 * pages/index/index.js
 * 主编辑器页面 - AI文章生成
 */

const { aiApi, materialApi } = require('../../utils/api');
const { requireAuth, getStoredUser } = require('../../utils/auth');
const { 
  showLoading, 
  hideLoading, 
  showSuccess, 
  showError, 
  showToast,
  showConfirm,
  formatDate,
  chooseImage,
  readFileAsBase64,
  copyToClipboard,
  generateId
} = require('../../utils/util');

// 预设文案模板
const PRESET_TEXTS = [
  { id: 'opening1', category: '🎬 开场白', content: '你有没有想过，为什么...' },
  { id: 'opening2', category: '🎬 开场白', content: '据最新数据显示...' },
  { id: 'opening3', category: '🎬 开场白', content: '今天，让我们一起来聊聊...' },
  { id: 'ending1', category: '🎯 结尾语', content: '总而言之，...' },
  { id: 'ending2', category: '🎯 结尾语', content: '希望今天的分享对你有所帮助！' },
  { id: 'ending3', category: '🎯 结尾语', content: '记得点赞收藏，我们下期再见！' },
  { id: 'cta1', category: '📣 行动号召', content: '如果你觉得这篇文章有帮助，请点击关注！' },
  { id: 'cta2', category: '📣 行动号召', content: '欢迎在评论区留下你的想法~' },
  { id: 'quote1', category: '💬 名言警句', content: '"千里之行，始于足下。" —— 老子' },
  { id: 'quote2', category: '💬 名言警句', content: '"学而不思则罔，思而不学则殆。" —— 孔子' }
];

// 预设SVG图标
const PRESET_SVGS = [
  { id: 'star', name: '星星', svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#FFD700"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  { id: 'heart', name: '爱心', svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
  { id: 'check', name: '对勾', svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07c160" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' },
  { id: 'fire', name: '火焰', svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#FF4500"><path d="M12 2C6.5 8 2 11 2 15c0 4.42 3.58 7 6 7 1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.42 0 6-2.58 6-7 0-4-4.5-7-8-13z"/></svg>' },
  { id: 'gift', name: '礼物', svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#9B59B6"><rect x="3" y="8" width="18" height="4" rx="1"/><rect x="5" y="12" width="14" height="9" rx="1"/><path d="M12 8V21M7.5 8C9 8 12 5 12 5s3 3 4.5 3"/></svg>' },
  { id: 'lightning', name: '闪电', svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#F39C12"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' }
];

Page({
  data: {
    // 模式
    isFormattingMode: false,
    
    // 输入
    topic: '',
    uploadedImage: '',
    analyzingImage: false,
    
    // AI设置
    aiProvider: 'deepseek',
    providerName: 'DeepSeek',
    useSearch: true,
    useDualAI: false,
    
    // 加载状态
    loading: false,
    
    // 文章数据
    articleTitle: '',
    articleDigest: '',
    articleHtml: '',
    sources: [],
    currentDate: '',
    
    // 弹窗
    showMaterialLibrary: false,
    showAITools: false,
    materialTab: 'images',
    
    // 素材
    materials: {
      images: [],
      videos: [],
      svgs: []
    },
    presetTexts: PRESET_TEXTS,
    presetSvgs: PRESET_SVGS
  },

  onLoad() {
    // 检查登录状态
    if (!requireAuth()) return;
    
    // 加载设置
    this.loadSettings();
    
    // 设置当前日期
    this.setData({
      currentDate: formatDate(new Date(), 'YYYY-MM-DD')
    });
    
    // 加载草稿
    this.loadDraft();
  },

  onShow() {
    // 每次显示时检查登录状态
    if (!requireAuth()) return;
    
    // 刷新设置（可能在设置页修改过）
    this.loadSettings();
  },

  // 加载设置
  loadSettings() {
    try {
      const app = getApp();
      const provider = app.globalData.aiProvider || 'deepseek';
      
      const providerNames = {
        'google': 'Google Gemini',
        'deepseek': 'DeepSeek',
        'qwen': 'Qwen (通义)'
      };
      
      this.setData({
        aiProvider: provider,
        providerName: providerNames[provider] || 'DeepSeek'
      });
    } catch (e) {
      console.error('[Index] 加载设置失败:', e);
    }
  },

  // 加载草稿
  loadDraft() {
    try {
      const draft = wx.getStorageSync('editor_draft');
      if (draft) {
        this.setData({
          topic: draft.topic || '',
          articleTitle: draft.title || '',
          articleDigest: draft.digest || '',
          articleHtml: draft.content || ''
        });
      }
    } catch (e) {
      console.error('[Index] 加载草稿失败:', e);
    }
  },

  // 保存草稿
  saveDraft() {
    try {
      const draft = {
        topic: this.data.topic,
        title: this.data.articleTitle,
        digest: this.data.articleDigest,
        content: this.data.articleHtml,
        timestamp: Date.now()
      };
      wx.setStorageSync('editor_draft', draft);
      showSuccess('草稿已保存');
    } catch (e) {
      console.error('[Index] 保存草稿失败:', e);
      showError('保存失败');
    }
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      isFormattingMode: mode === 'format'
    });
  },

  // 主题输入
  onTopicInput(e) {
    this.setData({
      topic: e.detail.value
    });
  },

  // 切换搜索
  toggleSearch() {
    if (this.data.aiProvider === 'deepseek' || this.data.isFormattingMode) {
      return;
    }
    this.setData({
      useSearch: !this.data.useSearch
    });
  },

  // 切换双AI模式
  toggleDualAI() {
    if (this.data.aiProvider === 'google' || this.data.isFormattingMode) {
      return;
    }
    this.setData({
      useDualAI: !this.data.useDualAI
    });
  },

  // 选择图片
  async chooseImage() {
    try {
      const tempFilePaths = await chooseImage(1);
      if (tempFilePaths && tempFilePaths.length > 0) {
        const filePath = tempFilePaths[0];
        
        this.setData({
          uploadedImage: filePath,
          analyzingImage: this.data.aiProvider !== 'deepseek'
        });
        
        // 如果不是DeepSeek，进行图像分析
        if (this.data.aiProvider !== 'deepseek') {
          // TODO: 实现图像分析
          setTimeout(() => {
            this.setData({ analyzingImage: false });
          }, 2000);
        }
      }
    } catch (e) {
      console.error('[Index] 选择图片失败:', e);
    }
  },

  // 移除图片
  removeImage() {
    this.setData({
      uploadedImage: '',
      analyzingImage: false
    });
  },

  // 生成文章
  async generateArticle() {
    const { topic, isFormattingMode, aiProvider, useSearch, useDualAI, uploadedImage } = this.data;
    
    if (!topic.trim()) {
      showToast(isFormattingMode ? '请输入要格式化的文本' : '请输入主题');
      return;
    }
    
    this.setData({ loading: true });
    showLoading(useDualAI && !isFormattingMode ? '双AI处理中...' : '生成中...');
    
    try {
      // 获取API密钥
      let apiKey = '';
      if (aiProvider === 'deepseek') {
        apiKey = wx.getStorageSync('deepseek_key') || '';
      } else if (aiProvider === 'qwen') {
        apiKey = wx.getStorageSync('dashscope_key') || '';
      } else {
        apiKey = wx.getStorageSync('google_api_key') || '';
      }
      
      // 读取图片为Base64（如果有）
      let imageContext = '';
      if (uploadedImage && aiProvider !== 'deepseek') {
        try {
          const base64 = await readFileAsBase64(uploadedImage);
          imageContext = base64;
        } catch (e) {
          console.error('[Index] 读取图片失败:', e);
        }
      }
      
      // 获取思考模式设置（兼容字符串和布尔类型）
      const thinkingModeValue = wx.getStorageSync('deepseek_thinking_mode');
      const thinkingMode = aiProvider === 'deepseek' && 
        (thinkingModeValue === true || thinkingModeValue === 'true');
      
      // 调用API
      const result = await aiApi.generate({
        message: topic,
        provider: aiProvider,
        useSearch: useSearch && aiProvider !== 'deepseek',
        imageContext,
        isFormattingMode,
        thinkingMode
      }, apiKey);
      
      if (result.success && result.data) {
        const { title, digest, blocks, sources } = result.data;
        
        // 将blocks转换为HTML
        const htmlContent = this.convertBlocksToHtml(blocks || []);
        
        this.setData({
          articleTitle: title || '未命名文章',
          articleDigest: digest || '',
          articleHtml: htmlContent,
          sources: sources || []
        });
        
        showSuccess('生成成功');
      } else {
        showError(result.error?.message || '生成失败');
      }
    } catch (e) {
      console.error('[Index] 生成文章失败:', e);
      showError('生成失败');
    } finally {
      this.setData({ loading: false });
      hideLoading();
    }
  },

  // 将blocks转换为HTML
  convertBlocksToHtml(blocks) {
    if (!blocks || blocks.length === 0) {
      return '<p style="color: #888; text-align: center;">暂无内容</p>';
    }
    
    return blocks.map(block => {
      switch (block.type) {
        case 'header':
          const fontSize = block.level === 1 ? '22px' : block.level === 2 ? '18px' : '16px';
          return `<h${block.level || 2} style="font-size: ${fontSize}; font-weight: bold; margin: 16px 0 8px 0; color: #333;">${block.content}</h${block.level || 2}>`;
        
        case 'paragraph':
          return `<p style="font-size: 16px; line-height: 1.8; color: #444; margin: 12px 0;">${block.content}</p>`;
        
        case 'quote':
          return `<blockquote style="margin: 16px 0; padding: 12px 16px; background: #f7f7f7; border-left: 4px solid #07c160; font-style: italic; color: #666;">${block.content}</blockquote>`;
        
        case 'list':
          const items = (block.items || []).map(item => 
            `<li style="margin: 6px 0; padding-left: 8px;">${item}</li>`
          ).join('');
          return `<ul style="margin: 12px 0; padding-left: 20px;">${items}</ul>`;
        
        case 'numbered_list':
          const numberedItems = (block.items || []).map(item => 
            `<li style="margin: 8px 0;">${item}</li>`
          ).join('');
          return `<ol style="margin: 12px 0; padding-left: 20px;">${numberedItems}</ol>`;
        
        case 'image':
          if (block.content.startsWith('http')) {
            return `<div style="margin: 16px 0; text-align: center;"><img src="${block.content}" style="max-width: 100%; border-radius: 8px;"/>${block.title ? `<p style="font-size: 12px; color: #888; margin-top: 8px;">${block.title}</p>` : ''}</div>`;
          }
          return `<div style="margin: 16px 0; padding: 24px; background: #fafafa; border: 2px dashed #ddd; border-radius: 8px; text-align: center; color: #999;"><p style="font-size: 14px;">📷 建议图片：${block.content}</p></div>`;
        
        case 'divider':
          return `<hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;"/>`;
        
        case 'card':
          return `<div style="margin: 16px 0; padding: 16px; background: #f6fffa; border: 1px solid #e0f2e9; border-radius: 12px;">${block.title ? `<h4 style="font-size: 16px; font-weight: bold; color: #07c160; margin-bottom: 8px;">${block.title}</h4>` : ''}<p style="font-size: 14px; color: #555; line-height: 1.6;">${block.content}</p></div>`;
        
        case 'callout':
          return `<div style="margin: 16px 0; padding: 16px; background: #f0f8ff; border-left: 4px solid #3498db; border-radius: 0 8px 8px 0;"><p style="font-size: 14px; color: #555;">${block.content}</p></div>`;
        
        case 'highlight':
          return `<div style="margin: 16px 0; padding: 16px 20px; background: #f6fffa; border-radius: 8px; border-top: 4px solid #07c160;"><p style="font-size: 16px; color: #333; font-weight: 500; line-height: 1.8;">${block.content}</p></div>`;
        
        case 'code':
          return `<pre style="margin: 16px 0; padding: 16px; background: #1e1e1e; color: #d4d4d4; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 14px; line-height: 1.5;"><code>${block.content}</code></pre>`;
        
        default:
          return `<p style="font-size: 16px; color: #444; line-height: 1.8;">${block.content}</p>`;
      }
    }).join('');
  },

  // 复制内容
  async copyContent() {
    if (!this.data.articleHtml) {
      showToast('暂无内容可复制');
      return;
    }
    
    // 将HTML转为纯文本
    const text = this.data.articleHtml
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    try {
      await copyToClipboard(text);
      showSuccess('已复制');
    } catch (e) {
      showError('复制失败');
    }
  },

  // 发布到微信
  async publishToWeChat() {
    if (!this.data.articleHtml) {
      showToast('请先生成文章');
      return;
    }
    
    const confirmed = await showConfirm('确定要将文章保存到微信草稿箱吗？');
    if (!confirmed) return;
    
    showToast('此功能需要配置微信公众号API');
    // TODO: 实现微信发布功能
  },

  // 打开来源链接
  openSource(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.setClipboardData({
        data: url,
        success: () => {
          showToast('链接已复制');
        }
      });
    }
  },

  // ===== 素材库相关 =====
  
  openMaterialLibrary() {
    this.setData({ showMaterialLibrary: true });
    this.loadMaterials();
  },

  closeMaterialLibrary() {
    this.setData({ showMaterialLibrary: false });
  },

  switchMaterialTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ materialTab: tab });
  },

  async loadMaterials() {
    // TODO: 从后端加载素材
    // 暂时使用本地存储
    try {
      const materials = wx.getStorageSync('user_materials') || { images: [], videos: [], svgs: [] };
      this.setData({ materials });
    } catch (e) {
      console.error('[Index] 加载素材失败:', e);
    }
  },

  async uploadMaterial() {
    try {
      const tempFilePaths = await chooseImage(1);
      if (tempFilePaths && tempFilePaths.length > 0) {
        const filePath = tempFilePaths[0];
        const base64 = await readFileAsBase64(filePath);
        
        // 保存到本地
        const materials = this.data.materials;
        materials.images.unshift({
          id: generateId(),
          url: `data:image/jpeg;base64,${base64}`,
          createdAt: Date.now()
        });
        
        wx.setStorageSync('user_materials', materials);
        this.setData({ materials });
        showSuccess('上传成功');
      }
    } catch (e) {
      console.error('[Index] 上传素材失败:', e);
      showError('上传失败');
    }
  },

  insertMaterial(e) {
    const { type, content } = e.currentTarget.dataset;
    
    // TODO: 将素材插入到文章中
    // 暂时简单追加到内容末尾
    let newHtml = this.data.articleHtml;
    
    if (type === 'image') {
      newHtml += `<div style="margin: 16px 0; text-align: center;"><img src="${content}" style="max-width: 100%; border-radius: 8px;"/></div>`;
    } else if (type === 'text') {
      newHtml += `<p style="font-size: 16px; color: #444; line-height: 1.8;">${content}</p>`;
    } else if (type === 'svg') {
      newHtml += `<div style="margin: 16px 0; text-align: center;">${content}</div>`;
    }
    
    this.setData({ 
      articleHtml: newHtml,
      showMaterialLibrary: false
    });
    showSuccess('已插入');
  },

  // ===== AI工具相关 =====
  
  openAITools() {
    this.setData({ showAITools: true });
  },

  closeAITools() {
    this.setData({ showAITools: false });
  },

  generateTitles() {
    showToast('功能开发中');
    // TODO: 实现标题生成
  },

  generateSummary() {
    showToast('功能开发中');
    // TODO: 实现摘要生成
  },

  extractKeywords() {
    showToast('功能开发中');
    // TODO: 实现关键词提取
  },

  polishContent() {
    showToast('功能开发中');
    // TODO: 实现内容润色
  },

  translateContent() {
    showToast('功能开发中');
    // TODO: 实现翻译
  },

  expandContent() {
    showToast('功能开发中');
    // TODO: 实现扩写
  },

  // ===== 模板库相关 =====
  
  openTemplates() {
    showToast('功能开发中');
    // TODO: 实现模板库
  },

  // ===== 页面导航 =====
  
  goToDrafts() {
    wx.navigateTo({
      url: '/pages/drafts/drafts'
    });
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  }
});
