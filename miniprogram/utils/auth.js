/**
 * Authentication Utilities for WeChat Mini Program
 * 微信小程序认证工具
 */

const { authApi, clearTokens, isAuthenticated: checkAuth, wxAuthApi } = require('./api');

// 用户信息存储键名
const USER_INFO_KEY = 'user_info';

/**
 * 保存用户信息到本地
 */
function saveUser(user) {
  try {
    wx.setStorageSync(USER_INFO_KEY, JSON.stringify(user));
    // 更新全局状态
    const app = getApp();
    if (app) {
      app.globalData.userInfo = user;
      app.globalData.isLoggedIn = true;
    }
  } catch (e) {
    console.error('[Auth] 保存用户信息失败:', e);
  }
}

/**
 * 获取存储的用户信息
 */
function getStoredUser() {
  try {
    const userStr = wx.getStorageSync(USER_INFO_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (e) {
    console.error('[Auth] 获取用户信息失败:', e);
    return null;
  }
}

/**
 * 清除用户信息
 */
function clearUser() {
  try {
    wx.removeStorageSync(USER_INFO_KEY);
    clearTokens();
    // 更新全局状态
    const app = getApp();
    if (app) {
      app.globalData.userInfo = null;
      app.globalData.isLoggedIn = false;
    }
  } catch (e) {
    console.error('[Auth] 清除用户信息失败:', e);
  }
}

/**
 * 检查是否已认证
 */
function isAuthenticated() {
  return checkAuth();
}

/**
 * 用户登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise<Object>} - 登录结果
 */
async function login(email, password) {
  const result = await authApi.login(email, password);
  
  if (result.success && result.data) {
    saveUser(result.data.user);
    return {
      success: true,
      user: result.data.user
    };
  }
  
  return {
    success: false,
    error: result.error?.message || '登录失败'
  };
}

/**
 * 用户注册
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @param {string} name - 用户名
 * @returns {Promise<Object>} - 注册结果
 */
async function register(email, password, name) {
  const result = await authApi.register(email, password, name);
  
  if (result.success && result.data) {
    saveUser(result.data.user);
    return {
      success: true,
      user: result.data.user
    };
  }
  
  return {
    success: false,
    error: result.error?.message || '注册失败'
  };
}

/**
 * 用户登出
 */
async function logout() {
  await authApi.logout();
  clearUser();
}

/**
 * 刷新用户信息
 */
async function refreshUserInfo() {
  const result = await authApi.getMe();
  
  if (result.success && result.data) {
    saveUser(result.data);
    return result.data;
  }
  
  return null;
}

/**
 * 检查登录状态并跳转
 * 如果未登录，跳转到登录页
 */
function requireAuth() {
  if (!isAuthenticated()) {
    wx.redirectTo({
      url: '/pages/login/login'
    });
    return false;
  }
  return true;
}

/**
 * 微信登录（获取code用于后端认证）
 * 注意：此功能需要后端支持微信登录接口
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
        } else {
          reject(new Error('微信登录失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 获取用户头像昵称（需要button组件触发）
 */
function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        resolve(res.userInfo);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 微信快捷登录（完整流程）
 * 1. 调用wx.login获取code
 * 2. 发送code到后端进行认证
 * 3. 保存用户信息和token
 * @returns {Promise<Object>} - 登录结果
 */
async function loginWithWechat() {
  try {
    // 1. 获取微信登录code
    const code = await wxLogin();
    console.log('[Auth] 获取微信登录code成功');
    
    // 2. 发送code到后端进行认证
    const result = await wxAuthApi.loginWithWechat(code);
    
    if (result.success && result.data) {
      // 3. 保存用户信息
      saveUser(result.data.user);
      console.log('[Auth] 微信登录成功:', result.data.user.name);
      
      return {
        success: true,
        user: result.data.user,
        isNewUser: result.data.isNewUser || false
      };
    }
    
    return {
      success: false,
      error: result.error?.message || '微信登录失败'
    };
  } catch (e) {
    console.error('[Auth] 微信登录失败:', e);
    return {
      success: false,
      error: e.message || '微信登录失败'
    };
  }
}

/**
 * 微信登录并获取用户头像昵称
 * 需要使用button组件触发getUserProfile
 * @param {Object} userInfo - 从getUserProfile获取的用户信息
 * @returns {Promise<Object>} - 登录结果
 */
async function loginWithWechatAndProfile(userInfo) {
  try {
    // 1. 获取微信登录code
    const code = await wxLogin();
    console.log('[Auth] 获取微信登录code成功');
    
    // 2. 发送code和用户信息到后端
    const result = await wxAuthApi.loginWithWechat(code, userInfo);
    
    if (result.success && result.data) {
      // 3. 保存用户信息
      saveUser(result.data.user);
      console.log('[Auth] 微信登录成功:', result.data.user.name);
      
      return {
        success: true,
        user: result.data.user,
        isNewUser: result.data.isNewUser || false
      };
    }
    
    return {
      success: false,
      error: result.error?.message || '微信登录失败'
    };
  } catch (e) {
    console.error('[Auth] 微信登录失败:', e);
    return {
      success: false,
      error: e.message || '微信登录失败'
    };
  }
}

module.exports = {
  saveUser,
  getStoredUser,
  clearUser,
  isAuthenticated,
  login,
  register,
  logout,
  refreshUserInfo,
  requireAuth,
  wxLogin,
  getUserProfile,
  loginWithWechat,
  loginWithWechatAndProfile
};
