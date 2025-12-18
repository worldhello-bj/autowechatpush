/**
 * pages/login/login.js
 * 登录页面 - 外观与主界面完全一致
 * 所有按钮点击都触发微信登录
 */

const { loginWithWechat } = require('../../utils/auth');
const { showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    loading: false,
    showLoginHint: false
  },

  onLoad() {
    // 页面加载时显示登录提示
    setTimeout(() => {
      this.setData({ showLoginHint: true });
    }, 500);
  },

  // 点击任意按钮触发登录
  triggerLogin() {
    this.setData({ showLoginHint: true });
  },

  // 隐藏登录提示
  hideLoginHint() {
    this.setData({ showLoginHint: false });
  },

  // 微信登录
  async handleWechatLogin() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      console.log('[Login] 开始微信登录');
      const result = await loginWithWechat();
      
      if (result.success) {
        showSuccess('登录成功');
        
        // 登录成功后跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1000);
      } else {
        showError(result.error || '登录失败');
      }
    } catch (e) {
      console.error('[Login] 微信登录失败:', e);
      showError('登录失败，请重试');
    } finally {
      this.setData({ loading: false });
    }
  }
});
