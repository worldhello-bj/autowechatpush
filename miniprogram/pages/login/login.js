/**
 * pages/login/login.js
 * 登录页面
 */

const { login, register, wxLogin } = require('../../utils/auth');
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
    showToast('微信登录功能开发中');
    
    // TODO: 实现微信登录
    // try {
    //   const code = await wxLogin();
    //   // 发送code到后端进行认证
    // } catch (e) {
    //   showError('微信登录失败');
    // }
  }
});
