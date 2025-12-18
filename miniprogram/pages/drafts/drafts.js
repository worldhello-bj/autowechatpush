/**
 * pages/drafts/drafts.js
 * 草稿箱页面
 */

const { requireAuth } = require('../../utils/auth');
const { formatRelativeTime, showConfirm, showSuccess } = require('../../utils/util');

Page({
  data: {
    draft: null
  },

  onLoad() {
    if (!requireAuth()) return;
  },

  onShow() {
    if (!requireAuth()) return;
    this.loadDraft();
  },

  // 加载草稿
  loadDraft() {
    try {
      const draft = wx.getStorageSync('editor_draft');
      if (draft && (draft.topic || draft.title || draft.content)) {
        this.setData({
          draft: {
            ...draft,
            formattedTime: formatRelativeTime(draft.timestamp || Date.now())
          }
        });
      } else {
        this.setData({ draft: null });
      }
    } catch (e) {
      console.error('[Drafts] 加载草稿失败:', e);
      this.setData({ draft: null });
    }
  },

  // 继续编辑
  continueDraft() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 删除草稿
  async deleteDraft() {
    const confirmed = await showConfirm('确定要删除这个草稿吗？此操作不可恢复。');
    if (confirmed) {
      try {
        wx.removeStorageSync('editor_draft');
        this.setData({ draft: null });
        showSuccess('已删除');
      } catch (e) {
        console.error('[Drafts] 删除草稿失败:', e);
      }
    }
  },

  // 跳转到编辑器
  goToEditor() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
