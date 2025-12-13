/**
 * pages/settings/settings.js
 * 设置页面
 */

const { healthApi } = require('../../utils/api');
const { 
  getStoredUser, 
  logout, 
  requireAuth 
} = require('../../utils/auth');
const { 
  showLoading, 
  hideLoading, 
  showSuccess, 
  showError, 
  showToast,
  showConfirm 
} = require('../../utils/util');

Page({
  data: {
    // 用户信息
    userInfo: null,
    
    // AI设置
    aiProvider: 'deepseek',
    googleKey: '',
    deepSeekKey: '',
    dashScopeKey: '',
    deepSeekThinkingMode: false,
    
    // 密钥显示控制
    showGoogleKey: false,
    showDeepSeekKey: false,
    showDashScopeKey: false,
    showAppSecret: false,
    
    // 后端设置
    apiBaseUrl: '',
    
    // 微信公众号设置
    wechatAppId: '',
    wechatAppSecret: '',
    
    // 通用设置
    autoSave: true
  },

  onLoad() {
    this.loadSettings();
  },

  onShow() {
    // 刷新用户信息
    const userInfo = getStoredUser();
    this.setData({ userInfo });
  },

  // 加载设置
  loadSettings() {
    try {
      const app = getApp();
      
      // AI设置
      const aiProvider = wx.getStorageSync('ai_provider') || 'deepseek';
      const googleKey = wx.getStorageSync('google_api_key') || '';
      const deepSeekKey = wx.getStorageSync('deepseek_key') || '';
      const dashScopeKey = wx.getStorageSync('dashscope_key') || '';
      const deepSeekThinkingMode = wx.getStorageSync('deepseek_thinking_mode') === 'true';
      
      // 后端设置
      const apiBaseUrl = app.globalData.apiBaseUrl || '';
      
      // 微信公众号设置
      let wechatAppId = '';
      let wechatAppSecret = '';
      try {
        const wechatCreds = wx.getStorageSync('wechat_creds');
        if (wechatCreds) {
          const creds = JSON.parse(wechatCreds);
          wechatAppId = creds.appId || '';
          wechatAppSecret = creds.appSecret || '';
        }
      } catch (e) {}
      
      // 通用设置
      const autoSave = wx.getStorageSync('auto_save') !== 'false';
      
      // 用户信息
      const userInfo = getStoredUser();
      
      this.setData({
        userInfo,
        aiProvider,
        googleKey,
        deepSeekKey,
        dashScopeKey,
        deepSeekThinkingMode,
        apiBaseUrl,
        wechatAppId,
        wechatAppSecret,
        autoSave
      });
    } catch (e) {
      console.error('[Settings] 加载设置失败:', e);
    }
  },

  // 跳转登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 选择AI提供商
  selectProvider(e) {
    const provider = e.currentTarget.dataset.provider;
    this.setData({ aiProvider: provider });
  },

  // 密钥输入处理
  onGoogleKeyInput(e) {
    this.setData({ googleKey: e.detail.value });
  },

  onDeepSeekKeyInput(e) {
    this.setData({ deepSeekKey: e.detail.value });
  },

  onDashScopeKeyInput(e) {
    this.setData({ dashScopeKey: e.detail.value });
  },

  // 密钥显示切换
  toggleGoogleKey() {
    this.setData({ showGoogleKey: !this.data.showGoogleKey });
  },

  toggleDeepSeekKey() {
    this.setData({ showDeepSeekKey: !this.data.showDeepSeekKey });
  },

  toggleDashScopeKey() {
    this.setData({ showDashScopeKey: !this.data.showDashScopeKey });
  },

  toggleAppSecret() {
    this.setData({ showAppSecret: !this.data.showAppSecret });
  },

  // 思考模式切换
  toggleThinkingMode(e) {
    this.setData({ deepSeekThinkingMode: e.detail.value });
  },

  // 保存设置
  saveSettings() {
    try {
      const app = getApp();
      
      // 保存AI设置
      wx.setStorageSync('ai_provider', this.data.aiProvider);
      wx.setStorageSync('google_api_key', this.data.googleKey);
      wx.setStorageSync('deepseek_key', this.data.deepSeekKey);
      wx.setStorageSync('dashscope_key', this.data.dashScopeKey);
      wx.setStorageSync('deepseek_thinking_mode', String(this.data.deepSeekThinkingMode));
      
      // 更新全局状态
      app.setAIProvider(this.data.aiProvider);
      
      showSuccess('设置已保存');
    } catch (e) {
      console.error('[Settings] 保存设置失败:', e);
      showError('保存失败');
    }
  },

  // 后端URL输入
  onApiUrlInput(e) {
    this.setData({ apiBaseUrl: e.detail.value });
  },

  // 测试后端连接
  async testConnection() {
    if (!this.data.apiBaseUrl) {
      showToast('请先输入API地址');
      return;
    }
    
    showLoading('测试连接中...');
    
    try {
      const app = getApp();
      app.setApiBaseUrl(this.data.apiBaseUrl);
      
      const result = await healthApi.check();
      
      if (result.success) {
        showSuccess('连接成功');
      } else {
        showError(result.error?.message || '连接失败');
      }
    } catch (e) {
      console.error('[Settings] 测试连接失败:', e);
      showError('连接失败');
    } finally {
      hideLoading();
    }
  },

  // 微信公众号配置输入
  onWechatAppIdInput(e) {
    this.setData({ wechatAppId: e.detail.value });
  },

  onWechatAppSecretInput(e) {
    this.setData({ wechatAppSecret: e.detail.value });
  },

  // 保存微信公众号配置
  saveWechatConfig() {
    try {
      const creds = {
        appId: this.data.wechatAppId,
        appSecret: this.data.wechatAppSecret
      };
      wx.setStorageSync('wechat_creds', JSON.stringify(creds));
      showSuccess('配置已保存');
    } catch (e) {
      console.error('[Settings] 保存微信配置失败:', e);
      showError('保存失败');
    }
  },

  // 自动保存切换
  toggleAutoSave(e) {
    const value = e.detail.value;
    this.setData({ autoSave: value });
    wx.setStorageSync('auto_save', String(value));
  },

  // 退出登录
  async handleLogout() {
    const confirmed = await showConfirm('确定要退出登录吗？');
    if (confirmed) {
      showLoading('退出中...');
      try {
        await logout();
        this.setData({ userInfo: null });
        showSuccess('已退出');
        
        // 跳转到登录页
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }, 1000);
      } catch (e) {
        console.error('[Settings] 退出登录失败:', e);
        showError('退出失败');
      } finally {
        hideLoading();
      }
    }
  }
});
