/**
 * pages/settings/settings.js
 * 设置页面
 */

const { healthApi, wechatAuthApi } = require('../../utils/api');
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
    
    // 微信公众号设置（扫码授权）
    wechatAuthorized: false,
    wechatAccountName: '',
    showManualConfig: false,
    
    // 微信公众号设置（手动配置）
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
    
    // 检查微信授权状态
    this.checkWechatAuthStatus();
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
      
      // 解析布尔值（兼容字符串和布尔类型）
      const thinkingModeValue = wx.getStorageSync('deepseek_thinking_mode');
      const deepSeekThinkingMode = thinkingModeValue === true || thinkingModeValue === 'true';
      
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

  // ===== 微信公众号扫码授权 =====
  
  // 检查微信授权状态
  checkWechatAuthStatus() {
    try {
      const authInfo = wx.getStorageSync('wechat_auth_info');
      if (authInfo) {
        const info = JSON.parse(authInfo);
        // 检查授权是否过期
        if (info.expiresAt && new Date(info.expiresAt) > new Date()) {
          this.setData({
            wechatAuthorized: true,
            wechatAccountName: info.accountName || '已授权公众号'
          });
          return;
        }
      }
      this.setData({
        wechatAuthorized: false,
        wechatAccountName: ''
      });
    } catch (e) {
      console.error('[Settings] 检查微信授权状态失败:', e);
      this.setData({
        wechatAuthorized: false,
        wechatAccountName: ''
      });
    }
  },

  // 开始扫码授权流程（秀米风格）
  async startWechatAuth() {
    showLoading('正在获取授权链接...');
    
    try {
      // 调用后端获取授权链接
      const result = await wechatAuthApi.getAuthUrl();
      
      if (result.success && result.data?.authUrl) {
        hideLoading();
        
        // 显示授权二维码或跳转到授权页面
        // 小程序可以使用 webview 打开授权页面
        // 或者显示二维码让用户扫描
        
        wx.showModal({
          title: '扫码授权',
          content: '请使用微信扫描二维码，并用公众号管理员账号确认授权',
          confirmText: '打开授权页',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 复制授权链接或打开webview
              wx.setClipboardData({
                data: result.data.authUrl,
                success: () => {
                  wx.showToast({
                    title: '授权链接已复制，请在浏览器打开',
                    icon: 'none',
                    duration: 3000
                  });
                  
                  // 开始轮询授权状态
                  this.pollAuthStatus(result.data.authId);
                }
              });
            }
          }
        });
      } else {
        hideLoading();
        showError(result.error?.message || '获取授权链接失败');
      }
    } catch (e) {
      hideLoading();
      console.error('[Settings] 获取授权链接失败:', e);
      showError('获取授权链接失败，请检查网络');
    }
  },

  // 轮询授权状态
  pollAuthStatus(authId) {
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询60次（约5分钟）
    
    const poll = async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        showToast('授权超时，请重试');
        return;
      }
      
      try {
        const result = await wechatAuthApi.checkAuthStatus(authId);
        
        if (result.success && result.data?.authorized) {
          // 授权成功
          const authInfo = {
            authId: authId,
            accountName: result.data.accountName,
            accessToken: result.data.accessToken,
            expiresAt: result.data.expiresAt
          };
          
          wx.setStorageSync('wechat_auth_info', JSON.stringify(authInfo));
          
          this.setData({
            wechatAuthorized: true,
            wechatAccountName: result.data.accountName || '已授权公众号'
          });
          
          showSuccess('授权成功');
          return;
        }
        
        // 继续轮询
        setTimeout(poll, 5000);
      } catch (e) {
        console.error('[Settings] 轮询授权状态失败:', e);
        setTimeout(poll, 5000);
      }
    };
    
    // 5秒后开始轮询
    setTimeout(poll, 5000);
  },

  // 取消微信授权
  async revokeWechatAuth() {
    const confirmed = await showConfirm('确定要取消公众号授权吗？取消后需要重新扫码授权。');
    
    if (confirmed) {
      try {
        // 清除本地存储的授权信息
        wx.removeStorageSync('wechat_auth_info');
        wx.removeStorageSync('wechat_creds');
        
        this.setData({
          wechatAuthorized: false,
          wechatAccountName: '',
          wechatAppId: '',
          wechatAppSecret: ''
        });
        
        showSuccess('已取消授权');
      } catch (e) {
        console.error('[Settings] 取消授权失败:', e);
        showError('取消授权失败');
      }
    }
  },

  // 切换手动配置显示
  toggleManualConfig() {
    this.setData({
      showManualConfig: !this.data.showManualConfig
    });
  },

  // 微信公众号配置输入
  onWechatAppIdInput(e) {
    this.setData({ wechatAppId: e.detail.value });
  },

  onWechatAppSecretInput(e) {
    this.setData({ wechatAppSecret: e.detail.value });
  },

  // 保存微信公众号配置（手动方式）
  saveWechatConfig() {
    if (!this.data.wechatAppId || !this.data.wechatAppSecret) {
      showToast('请填写完整的AppID和AppSecret');
      return;
    }
    
    try {
      const creds = {
        appId: this.data.wechatAppId,
        appSecret: this.data.wechatAppSecret
      };
      wx.setStorageSync('wechat_creds', JSON.stringify(creds));
      
      // 标记为已授权（手动配置方式）
      const authInfo = {
        authId: 'manual',
        accountName: '手动配置的公众号',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年有效期
      };
      wx.setStorageSync('wechat_auth_info', JSON.stringify(authInfo));
      
      this.setData({
        wechatAuthorized: true,
        wechatAccountName: '手动配置的公众号',
        showManualConfig: false
      });
      
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
