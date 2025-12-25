/**
 * Common Utility Functions for WeChat Mini Program
 * 微信小程序通用工具函数
 */

/**
 * 显示加载提示
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 */
function showSuccess(title, duration = 1500) {
  wx.showToast({
    title,
    icon: 'success',
    duration
  });
}

/**
 * 显示错误提示
 */
function showError(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'error',
    duration
  });
}

/**
 * 显示消息提示（无图标）
 */
function showToast(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'none',
    duration
  });
}

/**
 * 显示确认对话框
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 显示输入对话框
 */
function showPrompt(placeholder = '', defaultValue = '', title = '请输入') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      editable: true,
      placeholderText: placeholder,
      content: defaultValue,
      success: (res) => {
        if (res.confirm) {
          resolve(res.content || '');
        } else {
          resolve(null);
        }
      },
      fail: () => {
        resolve(null);
      }
    });
  });
}

/**
 * 防抖函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 */
function throttle(fn, delay = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 格式化日期
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return formatDate(date, 'MM-DD HH:mm');
  } else if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
}

/**
 * 截断文本
 */
function truncate(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + suffix;
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 生成唯一ID
 */
function generateId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

/**
 * 校验邮箱格式
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 校验密码强度（至少6位）
 */
function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * HTML转义（用于安全显示）
 */
function escapeHtml(text) {
  if (!text) return '';
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return String(text).replace(/[&<>"'/]/g, char => escapeMap[char]);
}

/**
 * 获取系统信息
 */
function getSystemInfo() {
  try {
    return wx.getSystemInfoSync();
  } catch (e) {
    console.error('[Utils] 获取系统信息失败:', e);
    return null;
  }
}

/**
 * 检查网络状态
 */
function checkNetworkStatus() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve({
          isConnected: res.networkType !== 'none',
          networkType: res.networkType
        });
      },
      fail: () => {
        resolve({
          isConnected: false,
          networkType: 'unknown'
        });
      }
    });
  });
}

/**
 * 复制文本到剪贴板
 */
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => {
        resolve(true);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 预览图片
 */
function previewImage(current, urls) {
  wx.previewImage({
    current,
    urls: Array.isArray(urls) ? urls : [urls]
  });
}

/**
 * 选择图片
 */
function chooseImage(count = 1, sourceType = ['album', 'camera']) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count,
      sourceType,
      sizeType: ['compressed'],
      success: (res) => {
        resolve(res.tempFilePaths);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 选择媒体文件（图片/视频）
 * 使用新版API，支持更多配置
 */
function chooseMedia(count = 1, mediaType = ['image'], sourceType = ['album', 'camera']) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count,
      mediaType,
      sourceType,
      maxDuration: 60,
      sizeType: ['compressed'],
      success: (res) => {
        resolve(res.tempFiles);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 压缩图片
 * @param {string} filePath - 原图路径
 * @param {number} quality - 压缩质量 0-100
 * @returns {Promise<string>} - 压缩后的图片路径
 */
function compressImage(filePath, quality = 80) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality,
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (err) => {
        // 压缩失败则返回原图
        console.warn('[Utils] 图片压缩失败，使用原图:', err);
        resolve(filePath);
      }
    });
  });
}

/**
 * 获取图片信息
 * @param {string} filePath - 图片路径
 * @returns {Promise<Object>} - 图片信息 { width, height, path, type }
 */
function getImageInfo(filePath) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: filePath,
      success: (res) => {
        resolve(res);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 读取文件为Base64
 */
function readFileAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        resolve(res.data);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 保存文件到本地
 * @param {string} tempFilePath - 临时文件路径
 * @returns {Promise<string>} - 保存后的文件路径
 */
function saveFile(tempFilePath) {
  return new Promise((resolve, reject) => {
    wx.saveFile({
      tempFilePath,
      success: (res) => {
        resolve(res.savedFilePath);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 保存图片到相册
 * @param {string} filePath - 图片路径
 * @returns {Promise<boolean>}
 */
function saveImageToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        resolve(true);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

module.exports = {
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showToast,
  showConfirm,
  showPrompt,
  debounce,
  throttle,
  formatDate,
  formatRelativeTime,
  truncate,
  deepClone,
  generateId,
  isValidEmail,
  isValidPassword,
  escapeHtml,
  getSystemInfo,
  checkNetworkStatus,
  copyToClipboard,
  previewImage,
  chooseImage,
  chooseMedia,
  compressImage,
  getImageInfo,
  readFileAsBase64,
  saveFile,
  saveImageToAlbum
};
