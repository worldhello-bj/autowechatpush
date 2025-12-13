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
  return app.globalData.apiBaseUrl || 'http://localhost:3001/api/v1';
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
  
  // 通用请求
  request
};
