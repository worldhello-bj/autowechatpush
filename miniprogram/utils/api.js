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

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return false;

  return new Promise((resolve) => {
    wx.request({
      url: `${baseUrl}/auth/refresh`,
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
  const baseUrl = getApiBaseUrl();
  
  // 验证API基础地址是否已配置
  if (!baseUrl) {
    console.error('[API] 请求失败: 后端API地址未配置');
    return {
      success: false,
      error: {
        code: 'API_NOT_CONFIGURED',
        message: '请先在设置页面配置后端API地址'
      }
    };
  }
  
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
      url: `${baseUrl}${endpoint}`,
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
   * API keys are now managed exclusively by the backend pool
   */
  generate: async (genRequest) => {
    return request('/ai/generate', {
      method: 'POST',
      data: genRequest,
      timeout: 60000 // AI请求可能需要较长时间
    });
  },

  /**
   * 获取配额状态
   */
  getQuota: async () => {
    return request('/ai/quota');
  },

  /**
   * 生成标题建议
   * @param {string} content - 文章内容
   * @param {number} count - 建议数量
   */
  generateTitles: async (content, count = 5) => {
    return request('/ai/titles', {
      method: 'POST',
      data: { content, count },
      timeout: 30000
    });
  },

  /**
   * 生成文章摘要
   * @param {string} content - 文章内容
   * @param {number} maxLength - 摘要最大长度
   */
  generateSummary: async (content, maxLength = 120) => {
    return request('/ai/summary', {
      method: 'POST',
      data: { content, maxLength },
      timeout: 30000
    });
  },

  /**
   * 提取关键词
   * @param {string} content - 文章内容
   * @param {number} count - 关键词数量
   */
  extractKeywords: async (content, count = 10) => {
    return request('/ai/keywords', {
      method: 'POST',
      data: { content, count },
      timeout: 30000
    });
  },

  /**
   * 内容润色
   * @param {string} content - 原文内容
   * @param {string} style - 润色风格: 'formal', 'casual', 'professional', 'creative'
   */
  polishContent: async (content, style = 'professional') => {
    return request('/ai/polish', {
      method: 'POST',
      data: { content, style },
      timeout: 60000
    });
  },

  /**
   * 翻译内容
   * @param {string} content - 原文内容
   * @param {string} targetLang - 目标语言: 'en', 'zh', 'ja', etc.
   */
  translateContent: async (content, targetLang = 'en') => {
    return request('/ai/translate', {
      method: 'POST',
      data: { content, targetLang },
      timeout: 60000
    });
  },

  /**
   * 内容扩写
   * @param {string} content - 原文内容
   * @param {number} targetLength - 目标字数（大概）
   */
  expandContent: async (content, targetLength = 1000) => {
    return request('/ai/expand', {
      method: 'POST',
      data: { content, targetLength },
      timeout: 90000
    });
  }
};

// ========== 文件上传通用函数 ==========

/**
 * 上传文件到后端
 * 使用 wx.uploadFile 进行真正的文件上传
 * @param {string} filePath - 本地文件路径
 * @param {string} endpoint - API端点
 * @param {string} name - 文件对应的 key（后端接收的字段名）
 * @param {Object} formData - 附加表单数据
 * @param {Object} options - 额外选项
 * @returns {Promise<Object>} - 响应数据
 */
async function uploadFile(filePath, endpoint, name = 'file', formData = {}, options = {}) {
  const baseUrl = getApiBaseUrl();
  
  // 验证API基础地址是否已配置
  if (!baseUrl) {
    console.error('[API] 上传失败: 后端API地址未配置');
    return {
      success: false,
      error: {
        code: 'API_NOT_CONFIGURED',
        message: '请先在设置页面配置后端API地址'
      }
    };
  }
  
  const accessToken = getAccessToken();
  const header = {};
  
  if (accessToken) {
    header['Authorization'] = `Bearer ${accessToken}`;
  }

  return new Promise((resolve) => {
    wx.uploadFile({
      url: `${baseUrl}${endpoint}`,
      filePath,
      name,
      formData,
      header,
      timeout: options.timeout || 60000,
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          console.log('[API] 上传响应:', data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            resolve({
              success: false,
              error: {
                code: `HTTP_${res.statusCode}`,
                message: data?.error?.message || '上传失败'
              }
            });
          }
        } catch (e) {
          console.error('[API] 解析上传响应失败:', e);
          resolve({
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: '解析响应失败'
            }
          });
        }
      },
      fail: (err) => {
        console.error('[API] 上传失败:', err);
        resolve({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: err.errMsg || '上传失败'
          }
        });
      }
    });
  });
}

// ========== 素材API ==========

const materialApi = {
  /**
   * 上传素材（Base64方式）
   */
  upload: async (data, filename, mimeType, type) => {
    return request('/materials', {
      method: 'POST',
      data: { data, filename, mimeType, type }
    });
  },

  /**
   * 上传素材文件（文件上传方式，推荐）
   * @param {string} filePath - 本地文件路径
   * @param {string} type - 素材类型: 'image', 'video', 'audio'
   * @returns {Promise<Object>} - { success, data: { id, url, ... } }
   */
  uploadFile: async (filePath, type = 'image') => {
    console.log('[Material API] 上传素材文件:', filePath, type);
    return uploadFile(filePath, '/materials/upload', 'file', { type });
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
// 参照源代码 services/wechatService.ts 实现
// 文档: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html

// 微信公众号API基础地址
const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin';

/**
 * 微信公众号API请求封装
 */
function wechatRequest(url, options = {}) {
  return new Promise((resolve) => {
    wx.request({
      url,
      method: options.method || 'GET',
      header: options.header || { 'Content-Type': 'application/json' },
      data: options.data,
      timeout: options.timeout || 30000,
      success: (res) => {
        console.log('[WeChat API] 响应:', res.data);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查微信API错误码
          if (res.data.errcode && res.data.errcode !== 0) {
            resolve({
              success: false,
              error: {
                code: `WECHAT_${res.data.errcode}`,
                message: res.data.errmsg || '微信API错误'
              }
            });
          } else {
            resolve({
              success: true,
              data: res.data
            });
          }
        } else {
          resolve({
            success: false,
            error: {
              code: `HTTP_${res.statusCode}`,
              message: '请求失败'
            }
          });
        }
      },
      fail: (err) => {
        console.error('[WeChat API] 请求失败:', err);
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

const wechatApi = {
  /**
   * 获取微信公众号Access Token
   * 文档: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html
   * @param {string} appId - 公众号AppID
   * @param {string} appSecret - 公众号AppSecret
   * @returns {Promise<Object>} - { success, data: { access_token, expires_in } }
   */
  getAccessToken: async (appId, appSecret) => {
    const url = `${WECHAT_API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    console.log('[WeChat API] 获取Access Token...');
    
    const result = await wechatRequest(url);
    
    if (result.success && result.data.access_token) {
      console.log('[WeChat API] Access Token获取成功');
      return {
        success: true,
        data: {
          accessToken: result.data.access_token,
          expiresIn: result.data.expires_in
        }
      };
    }
    
    return result;
  },

  /**
   * 上传永久素材（图片）到微信公众号
   * 文档: https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/Adding_Permanent_Assets.html
   * 注意: 小程序不支持FormData，需要使用wx.uploadFile
   * @param {string} accessToken - Access Token
   * @param {string} filePath - 本地图片路径
   * @returns {Promise<Object>} - { success, data: { mediaId } }
   */
  uploadImage: async (accessToken, filePath) => {
    const url = `${WECHAT_API_BASE}/material/add_material?access_token=${accessToken}&type=image`;
    console.log('[WeChat API] 上传图片...', filePath);
    
    return new Promise((resolve) => {
      wx.uploadFile({
        url,
        filePath,
        name: 'media',
        formData: {},
        timeout: 60000,
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            console.log('[WeChat API] 上传响应:', data);
            
            if (data.errcode && data.errcode !== 0) {
              resolve({
                success: false,
                error: {
                  code: `WECHAT_${data.errcode}`,
                  message: data.errmsg || '上传失败'
                }
              });
            } else if (data.media_id) {
              console.log('[WeChat API] 图片上传成功, media_id:', data.media_id);
              resolve({
                success: true,
                data: {
                  mediaId: data.media_id,
                  url: data.url
                }
              });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'UPLOAD_ERROR',
                  message: '上传返回格式错误'
                }
              });
            }
          } catch (e) {
            resolve({
              success: false,
              error: {
                code: 'PARSE_ERROR',
                message: '解析响应失败'
              }
            });
          }
        },
        fail: (err) => {
          console.error('[WeChat API] 上传失败:', err);
          resolve({
            success: false,
            error: {
              code: 'UPLOAD_FAILED',
              message: err.errMsg || '上传失败'
            }
          });
        }
      });
    });
  },

  /**
   * 保存草稿到微信公众号草稿箱
   * 文档: https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
   * @param {string} accessToken - Access Token
   * @param {Object} payload - 草稿内容 (WechatPayload格式)
   * @returns {Promise<Object>} - { success, data: { mediaId } }
   */
  saveDraft: async (accessToken, payload) => {
    const url = `${WECHAT_API_BASE}/draft/add?access_token=${accessToken}`;
    console.log('[WeChat API] 保存草稿...');
    
    const result = await wechatRequest(url, {
      method: 'POST',
      data: payload,
      timeout: 60000
    });
    
    if (result.success && result.data.media_id) {
      console.log('[WeChat API] 草稿保存成功, media_id:', result.data.media_id);
      return {
        success: true,
        data: {
          mediaId: result.data.media_id
        }
      };
    }
    
    return result;
  },

  /**
   * 一键发布文章到公众号草稿箱
   * 完整流程: 获取Token -> 上传封面 -> 保存草稿
   * @param {Object} params - 发布参数
   * @param {string} params.appId - 公众号AppID
   * @param {string} params.appSecret - 公众号AppSecret
   * @param {string} params.title - 文章标题
   * @param {string} params.author - 作者名
   * @param {string} params.content - 文章HTML内容
   * @param {string} params.digest - 文章摘要
   * @param {string} [params.coverImagePath] - 封面图片本地路径（可选）
   * @param {string} [params.thumbMediaId] - 封面图片media_id（如已上传）
   * @returns {Promise<Object>} - { success, data: { mediaId } }
   */
  publishArticle: async (params) => {
    const { appId, appSecret, title, author, content, digest, coverImagePath, thumbMediaId } = params;
    
    console.log('[WeChat API] 开始发布文章:', title);
    
    // 1. 获取Access Token
    const tokenResult = await wechatApi.getAccessToken(appId, appSecret);
    if (!tokenResult.success) {
      return tokenResult;
    }
    const accessToken = tokenResult.data.accessToken;
    
    // 2. 上传封面图片（如果提供了本地路径）
    let finalThumbMediaId = thumbMediaId;
    if (coverImagePath && !thumbMediaId) {
      const uploadResult = await wechatApi.uploadImage(accessToken, coverImagePath);
      if (!uploadResult.success) {
        return {
          success: false,
          error: {
            code: 'COVER_UPLOAD_FAILED',
            message: '封面图片上传失败: ' + (uploadResult.error?.message || '未知错误')
          }
        };
      }
      finalThumbMediaId = uploadResult.data.mediaId;
    }
    
    // 如果没有封面图片，返回错误（微信要求必须有封面）
    if (!finalThumbMediaId) {
      return {
        success: false,
        error: {
          code: 'NO_COVER_IMAGE',
          message: '发布文章需要封面图片'
        }
      };
    }
    
    // 3. 构建草稿payload（参照源代码types.ts的WechatPayload格式）
    const payload = {
      articles: [{
        title: title,
        author: author || 'AI助手',
        digest: digest || '',
        content: content,
        thumb_media_id: finalThumbMediaId,
        need_open_comment: 0,
        only_fans_can_comment: 0
      }]
    };
    
    // 4. 保存草稿
    const draftResult = await wechatApi.saveDraft(accessToken, payload);
    
    if (draftResult.success) {
      console.log('[WeChat API] 文章发布成功!');
    }
    
    return draftResult;
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

// ========== 微信公众号授权API（秀米风格扫码授权）==========
// 需要后端实现第三方平台授权服务

const wechatAuthApi = {
  /**
   * 获取公众号授权链接（秀米风格）
   * 后端需要作为微信第三方平台，生成授权二维码
   * @returns {Promise<Object>} - { success, data: { authUrl, authId, qrcodeUrl } }
   */
  getAuthUrl: async () => {
    return request('/wechat/auth/url', {
      method: 'POST',
      timeout: 30000
    });
  },

  /**
   * 检查授权状态（轮询）
   * @param {string} authId - 授权会话ID
   * @returns {Promise<Object>} - { success, data: { authorized, accountName, accessToken, expiresAt } }
   */
  checkAuthStatus: async (authId) => {
    return request(`/wechat/auth/status/${authId}`, {
      method: 'GET',
      timeout: 10000
    });
  },

  /**
   * 取消授权
   * @param {string} authId - 授权会话ID
   * @returns {Promise<Object>} - { success }
   */
  revokeAuth: async (authId) => {
    return request(`/wechat/auth/revoke/${authId}`, {
      method: 'POST'
    });
  },

  /**
   * 使用已授权的账号发布文章
   * 后端会使用存储的authorizer_access_token进行操作
   * @param {Object} params - 发布参数
   * @param {string} params.authId - 授权会话ID
   * @param {string} params.title - 文章标题
   * @param {string} params.author - 作者
   * @param {string} params.content - 文章HTML内容
   * @param {string} params.digest - 摘要
   * @param {string} [params.coverImagePath] - 封面图片本地路径
   * @returns {Promise<Object>} - { success, data: { mediaId } }
   */
  publishWithAuth: async (params) => {
    const { authId, title, author, content, digest, coverImagePath } = params;
    
    // 如果有封面图片，先上传
    let coverImageBase64 = null;
    if (coverImagePath) {
      try {
        const fs = wx.getFileSystemManager();
        coverImageBase64 = fs.readFileSync(coverImagePath, 'base64');
      } catch (e) {
        console.error('[WeChat Auth API] 读取封面图片失败:', e);
      }
    }
    
    return request('/wechat/auth/publish', {
      method: 'POST',
      data: {
        authId,
        title,
        author: author || 'AI助手',
        content,
        digest: digest || '',
        coverImageBase64
      },
      timeout: 120000
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
  wechatAuthApi,
  
  // 通用请求
  request,
  uploadFile
};
