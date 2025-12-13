/**
 * pages/login/login.js
 * 登录页面
 */

const { login, register, loginWithWechat, loginWithWechatAndProfile, getUserProfile } = require('../../utils/auth');
const { 
  showLoading, 
  hideLoading, 
  showSuccess, 
  showError, 
  showToast,
  isValidEmail,
  isValidPassword
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
    wechatLoading: false,
    errorMsg: ''
  },

  onLoad() {
    // 页面加载
  },

  // 切换登录/注册模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      isRegisterMode: mode === 'register',
      errorMsg: '',
      password: '',
      confirmPassword: ''
    });
  },

  // 输入处理
  onNameInput(e) {
    this.setData({ name: e.detail.value, errorMsg: '' });
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value, errorMsg: '' });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value, errorMsg: '' });
  },

  // 切换密码显示
  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  // 表单验证
  validateForm() {
    const { isRegisterMode, name, email, password, confirmPassword } = this.data;
    
    if (isRegisterMode && !name.trim()) {
      this.setData({ errorMsg: '请输入用户名' });
      return false;
    }
    
    if (!email.trim()) {
      this.setData({ errorMsg: '请输入邮箱' });
      return false;
    }
    
    if (!isValidEmail(email)) {
      this.setData({ errorMsg: '邮箱格式不正确' });
      return false;
    }
    
    if (!password) {
      this.setData({ errorMsg: '请输入密码' });
      return false;
    }
    
    if (!isValidPassword(password)) {
      this.setData({ errorMsg: '密码至少需要6位' });
      return false;
    }
    
    if (isRegisterMode && password !== confirmPassword) {
      this.setData({ errorMsg: '两次输入的密码不一致' });
      return false;
    }
    
    return true;
  },

  // 提交表单
  async handleSubmit() {
    if (!this.validateForm()) return;
    
    const { isRegisterMode, name, email, password } = this.data;
    
    this.setData({ loading: true, errorMsg: '' });
    
    try {
      let result;
      
      if (isRegisterMode) {
        result = await register(email, password, name);
      } else {
        result = await login(email, password);
      }
      
      if (result.success) {
        showSuccess(isRegisterMode ? '注册成功' : '登录成功');
        
        // 延迟跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1000);
      } else {
        this.setData({ errorMsg: result.error || '操作失败，请重试' });
      }
    } catch (e) {
      console.error('[Login] 操作失败:', e);
      this.setData({ errorMsg: '网络错误，请重试' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 微信快捷登录
  async handleWechatLogin() {
    this.setData({ wechatLoading: true, errorMsg: '' });
    
    try {
      // 方式1: 直接使用wx.login进行静默登录
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
        this.setData({ errorMsg: result.error || '微信登录失败' });
      }
    } catch (e) {
      console.error('[Login] 微信登录失败:', e);
      this.setData({ errorMsg: '微信登录失败，请重试' });
    } finally {
      this.setData({ wechatLoading: false });
    }
  },

  // 微信登录并获取头像昵称（需要用户授权）
  async handleWechatLoginWithProfile() {
    this.setData({ wechatLoading: true, errorMsg: '' });
    
    try {
      // 先获取用户头像昵称
      const userInfo = await getUserProfile();
      console.log('[Login] 获取用户信息成功:', userInfo);
      
      // 使用用户信息进行登录
      const result = await loginWithWechatAndProfile(userInfo);
      
      if (result.success) {
        showSuccess(result.isNewUser ? '注册成功' : '登录成功');
        
        // 延迟跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1000);
      } else {
        this.setData({ errorMsg: result.error || '微信登录失败' });
      }
    } catch (e) {
      console.error('[Login] 微信登录失败:', e);
      // 用户拒绝授权
      if (e.errMsg && e.errMsg.includes('cancel')) {
        this.setData({ errorMsg: '您取消了授权，请重试' });
      } else {
        this.setData({ errorMsg: '微信登录失败，请重试' });
      }
    } finally {
      this.setData({ wechatLoading: false });
    }
  }
});
