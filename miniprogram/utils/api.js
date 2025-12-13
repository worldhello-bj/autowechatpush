/**
 * API Client for WeChat Mini Program
 * 微信小程序API客户端
 * 
 * 使用 wx.request 替代 fetch，适配小程序网络请求
 */

// Token存储键名
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * 获取API基础地址
 */
function getApiBaseUrl() {
  const app = getApp();
  const url = app.globalData.apiBaseUrl;
  if (!url) {
    console.warn('[API] 后端API地址未配置，请在设置页面配置');
    return '';
  }
  return url;
}

/**
 * 获取访问令牌
 */
function getAccessToken() {
  try {
    return wx.getStorageSync(ACCESS_TOKEN_KEY) || null;
  } catch (e) {
    console.error('[API] 获取访问令牌失败:', e);
    return null;
  }
}

/**
 * 获取刷新令牌
 */
function getRefreshToken() {
  try {
    return wx.getStorageSync(REFRESH_TOKEN_KEY) || null;
  } catch (e) {
    console.error('[API] 获取刷新令牌失败:', e);
    return null;
  }
}

/**
 * 保存令牌
 */
function setTokens(accessToken, refreshToken) {
  try {
    wx.setStorageSync(ACCESS_TOKEN_KEY, accessToken);
    wx.setStorageSync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.error('[API] 保存令牌失败:', e);
  }
}

/**
 * 清除令牌
 */
function clearTokens() {
  try {
    wx.removeStorageSync(ACCESS_TOKEN_KEY);
    wx.removeStorageSync(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error('[API] 清除令牌失败:', e);
  }
}

/**
 * 检查是否已认证
 */
function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * 刷新访问令牌
 */
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  return new Promise((resolve) => {
    wx.request({
      url: `${getApiBaseUrl()}/auth/refresh`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: { refreshToken },
      success(res) {
        if (res.statusCode === 200 && res.data.success && res.data.data) {
          setTokens(res.data.data.accessToken, res.data.data.refreshToken);
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail() {
        resolve(false);
      }
    });
  });
}

/**
 * 通用请求方法
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} - 响应数据
 */
async function request(endpoint, options = {}) {
  const accessToken = getAccessToken();
  
  const header = {
    'Content-Type': 'application/json',
    ...options.header
  };
  
  if (accessToken) {
    header['Authorization'] = `Bearer ${accessToken}`;
  }

  return new Promise((resolve) => {
    wx.request({
      url: `${getApiBaseUrl()}${endpoint}`,
      method: options.method || 'GET',
      header,
      data: options.data,
      timeout: options.timeout || 30000,
      success: async (res) => {
        // 处理令牌过期
        if (res.statusCode === 401) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // 重试请求
            const retryResult = await request(endpoint, options);
            resolve(retryResult);
            return;
          }
          // 刷新失败，清除令牌
          clearTokens();
        }
        
        // 成功响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          resolve({
            success: false,
            error: {
              code: `HTTP_${res.statusCode}`,
              message: res.data?.error?.message || '请求失败'
            }
          });
        }
      },
      fail: (err) => {
        console.error('[API] 请求失败:', err);
        resolve({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: err.errMsg || '网络连接失败'
          }
        });
      }
    });
  });
}

// ========== 认证API ==========

const authApi = {
  /**
   * 用户注册
   */
  register: async (email, password, name) => {
    const result = await request('/auth/register', {
      method: 'POST',
      data: { email, password, name }
    });
    
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },

  /**
   * 用户登录
   */
  login: async (email, password) => {
    const result = await request('/auth/token', {
      method: 'POST',
      data: { email, password }
    });
    
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },

  /**
   * 用户登出
   */
  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await request('/auth/logout', {
        method: 'POST',
        data: { refreshToken }
      });
    }
    clearTokens();
  },

  /**
   * 获取当前用户信息
   */
  getMe: async () => {
    return request('/auth/me');
  }
};

// ========== AI API ==========

const aiApi = {
  /**
   * 生成文章
   */
  generate: async (genRequest, apiKey) => {
    const header = {};
    if (apiKey) {
      header['X-API-Key'] = apiKey;
    }
    
    return request('/ai/generate', {
      method: 'POST',
      header,
      data: genRequest,
      timeout: 60000 // AI请求可能需要较长时间
    });
  },

  /**
   * 获取配额状态
   */
  getQuota: async () => {
    return request('/ai/quota');
  }
};

// ========== 素材API ==========

const materialApi = {
  /**
   * 上传素材
   */
  upload: async (data, filename, mimeType, type) => {
    return request('/materials', {
      method: 'POST',
      data: { data, filename, mimeType, type }
    });
  },

  /**
   * 获取素材列表
   */
  list: async (type, page = 1, limit = 20) => {
    let url = `/materials?page=${page}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    return request(url);
  },

  /**
   * 获取素材详情
   */
  get: async (id) => {
    return request(`/materials/${id}`);
  },

  /**
   * 删除素材
   */
  delete: async (id) => {
    return request(`/materials/${id}`, {
      method: 'DELETE'
    });
  }
};

// ========== 配额API ==========

const quotaApi = {
  /**
   * 获取配额状态
   */
  getStatus: async () => {
    return request('/user/quota');
  },

  /**
   * 检查配额
   */
  check: async (credits = 1) => {
    return request(`/user/quota/check?credits=${credits}`);
  },

  /**
   * 获取使用历史
   */
  getHistory: async (limit = 50) => {
    return request(`/user/quota/history?limit=${limit}`);
  },

  /**
   * 获取使用统计
   */
  getStats: async (period = 'month') => {
    return request(`/user/quota/stats?period=${period}`);
  }
};

// ========== 健康检查API ==========

const healthApi = {
  /**
   * 检查服务健康状态
   */
  check: async () => {
    return request('/health');
  }
};

// ========== 微信公众号API ==========

const wechatApi = {
  /**
   * 获取微信公众号Access Token
   * @param {string} appId - 公众号AppID
   * @param {string} appSecret - 公众号AppSecret
   */
  getAccessToken: async (appId, appSecret) => {
    return request('/wechat/token', {
      method: 'POST',
      data: { appId, appSecret }
    });
  },

  /**
   * 上传图片到微信公众号
   * @param {string} accessToken - 公众号Access Token
   * @param {string} imageBase64 - 图片Base64数据
   * @param {string} filename - 文件名
   */
  uploadImage: async (accessToken, imageBase64, filename = 'cover.jpg') => {
    return request('/wechat/upload-image', {
      method: 'POST',
      data: { accessToken, imageBase64, filename },
      timeout: 60000
    });
  },

  /**
   * 保存草稿到微信公众号
   * @param {string} accessToken - 公众号Access Token
   * @param {Object} article - 文章内容
   */
  saveDraft: async (accessToken, article) => {
    return request('/wechat/draft', {
      method: 'POST',
      data: { accessToken, article },
      timeout: 60000
    });
  },

  /**
   * 一键发布文章到公众号草稿箱
   * @param {Object} params - 发布参数
   * @param {string} params.appId - 公众号AppID
   * @param {string} params.appSecret - 公众号AppSecret
   * @param {string} params.title - 文章标题
   * @param {string} params.content - 文章HTML内容
   * @param {string} params.digest - 文章摘要
   * @param {string} [params.coverImageBase64] - 封面图片Base64（可选）
   */
  publishArticle: async (params) => {
    return request('/wechat/publish', {
      method: 'POST',
      data: params,
      timeout: 120000 // 发布可能需要较长时间
    });
  }
};

// ========== 微信小程序登录API ==========

const wxAuthApi = {
  /**
   * 微信小程序登录
   * @param {string} code - wx.login获取的code
   * @param {Object} [userInfo] - 用户信息（可选）
   */
  loginWithWechat: async (code, userInfo = null) => {
    const result = await request('/auth/wechat-login', {
      method: 'POST',
      data: { code, userInfo }
    });
    
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
    }
    
    return result;
  },

  /**
   * 绑定微信账号到已有账户
   * @param {string} code - wx.login获取的code
   */
  bindWechat: async (code) => {
    return request('/auth/bind-wechat', {
      method: 'POST',
      data: { code }
    });
  }
};

module.exports = {
  // Token管理
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
  
  // API模块
  authApi,
  aiApi,
  materialApi,
  quotaApi,
  healthApi,
  wechatApi,
  wxAuthApi,
  
  // 通用请求
  request
};
