/**
 * pages/login/login.js
 * 登录页面 - 模仿真实界面，点击任意按钮触发微信登录
 */

const { loginWithWechat } = require('../../utils/auth');
const { 
  showLoading, 
  hideLoading, 
  showSuccess, 
  showError, 
  showToast
} = require('../../utils/util');

Page({
  data: {
    isRegisterMode: false,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    loading: false,
    errorMsg: ''
  },

  onLoad() {
    // 页面加载
  },

  // 切换登录/注册模式
  switchMode() {
    this.setData({
      isRegisterMode: !this.data.isRegisterMode,
      errorMsg: ''
    });
  },

  // 输入处理 - 点击输入框时触发微信登录
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  // 切换密码显示
  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  // 触发微信登录 - 点击任意按钮或输入框时调用
  async triggerWechatLogin() {
    if (this.data.loading) return;
    
    this.setData({ loading: true, errorMsg: '' });
    
    try {
      console.log('[Login] 触发微信登录');
      const result = await loginWithWechat();
      
      if (result.success) {
        showSuccess('登录成功');
        
        // 延迟跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1000);
      } else {
        this.setData({ 
          errorMsg: result.error || '微信登录失败，请重试' 
        });
      }
    } catch (e) {
      console.error('[Login] 微信登录失败:', e);
      this.setData({ 
        errorMsg: '微信登录失败，请重试' 
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
