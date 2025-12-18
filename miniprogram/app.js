// app.js
const { isAuthenticated, getStoredUser } = require('./utils/auth');

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    aiProvider: 'deepseek',  // 'google', 'deepseek', 'qwen'
    apiBaseUrl: '',  // 需要在设置页配置后端API地址
  },

  onLaunch() {
    console.log('[App] 小程序启动');
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 加载用户设置
    this.loadSettings();
  },

  // 检查登录状态
  checkLoginStatus() {
    if (isAuthenticated()) {
      const user = getStoredUser();
      if (user) {
        this.globalData.userInfo = user;
        this.globalData.isLoggedIn = true;
        console.log('[App] 用户已登录:', user.name);
      }
    }
  },

  // 加载保存的设置
  loadSettings() {
    try {
      const provider = wx.getStorageSync('ai_provider');
      if (provider) {
        this.globalData.aiProvider = provider;
      }
      
      const apiUrl = wx.getStorageSync('api_base_url');
      if (apiUrl) {
        this.globalData.apiBaseUrl = apiUrl;
      }
    } catch (e) {
      console.error('[App] 加载设置失败:', e);
    }
  },

  // 设置AI提供商
  setAIProvider(provider) {
    this.globalData.aiProvider = provider;
    wx.setStorageSync('ai_provider', provider);
  },

  // 设置API地址
  setApiBaseUrl(url) {
    this.globalData.apiBaseUrl = url;
    wx.setStorageSync('api_base_url', url);
  }
});
