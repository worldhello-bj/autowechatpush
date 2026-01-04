/**
 * Feedback Management Component
 * 
 * This component allows administrators to view and manage user feedback.
 */

import React, { useState, useEffect } from 'react';

// API configuration
const API_BASE = '/api/v1';

// Types
type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'closed';
type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other';

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: FeedbackCategory;
  title: string;
  content: string;
  status: FeedbackStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
  appVersion?: string;
  platform?: string;
  logContent?: string;
}

interface FeedbackStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  closed: number;
  byCategory: Record<FeedbackCategory, number>;
}

// Token management
const getAccessToken = (): string | null => localStorage.getItem('admin_access_token');

// API request helper
const request = async <T,>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: { message: string } }> => {
  const accessToken = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    return await response.json();
  } catch (error) {
    return { success: false, error: { message: '网络错误' } };
  }
};

// Category display names
const categoryLabels: Record<FeedbackCategory, string> = {
  bug: '问题反馈',
  feature: '功能建议',
  question: '使用咨询',
  other: '其他',
};

const categoryColors: Record<FeedbackCategory, string> = {
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  question: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
};

// Status display names
const statusLabels: Record<FeedbackStatus, string> = {
  pending: '待处理',
  reviewed: '已查看',
  resolved: '已解决',
  closed: '已关闭',
};

const statusColors: Record<FeedbackStatus, string> = {
  pending: 'bg-orange-100 text-orange-700',
  reviewed: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const FeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | ''>('');
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | ''>('');
  const [adminReply, setAdminReply] = useState('');
  const [newStatus, setNewStatus] = useState<FeedbackStatus>('reviewed');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch feedbacks
  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      
      const [feedbackResult, statsResult] = await Promise.all([
        request<{ feedbacks: Feedback[] }>(`/admin/feedback?${params.toString()}`),
        request<FeedbackStats>('/admin/feedback/stats'),
      ]);

      if (feedbackResult.success && feedbackResult.data) {
        setFeedbacks(feedbackResult.data.feedbacks);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filterStatus, filterCategory]);

  // Handle update feedback
  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;
    
    setIsUpdating(true);
    try {
      const result = await request<Feedback>(`/admin/feedback/${selectedFeedback.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          adminReply: adminReply || undefined,
        }),
      });

      if (result.success && result.data) {
        setFeedbacks(feedbacks.map(f => f.id === selectedFeedback.id ? result.data! : f));
        setSelectedFeedback(null);
        setAdminReply('');
        setMessage({ type: 'success', text: '反馈已更新' });
        setTimeout(() => setMessage(null), 3000);
        // Refresh stats
        const statsResult = await request<FeedbackStats>('/admin/feedback/stats');
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      } else {
        setMessage({ type: 'error', text: result.error?.message || '更新失败' });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete feedback
  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('确定要删除此反馈吗？')) return;

    const result = await request(`/admin/feedback/${id}`, { method: 'DELETE' });
    if (result.success) {
      setFeedbacks(feedbacks.filter(f => f.id !== id));
      setMessage({ type: 'success', text: '反馈已删除' });
      setTimeout(() => setMessage(null), 3000);
      // Refresh stats
      const statsResult = await request<FeedbackStats>('/admin/feedback/stats');
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } else {
      setMessage({ type: 'error', text: result.error?.message || '删除失败' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Open feedback detail modal
  const openFeedbackDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setNewStatus(feedback.status);
    setAdminReply(feedback.adminReply || '');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-gray-500 text-sm mb-1">总反馈</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-orange-500 text-sm mb-1">待处理</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-blue-500 text-sm mb-1">已查看</div>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-green-500 text-sm mb-1">已解决</div>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-gray-500 text-sm mb-1">已关闭</div>
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <span className="material-icons text-lg">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="material-icons text-gray-400">filter_list</span>
            <span className="text-gray-600 font-medium">筛选:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FeedbackStatus | '')}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="reviewed">已查看</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FeedbackCategory | '')}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">全部类型</option>
            <option value="bug">问题反馈</option>
            <option value="feature">功能建议</option>
            <option value="question">使用咨询</option>
            <option value="other">其他</option>
          </select>
          <button
            onClick={fetchFeedbacks}
            className="flex items-center gap-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg"
          >
            <span className="material-icons text-lg">refresh</span>
            刷新
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="material-icons text-purple-500">feedback</span>
            用户反馈列表
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="material-icons text-5xl mb-2">inbox</span>
            <p>暂无反馈</p>
          </div>
        ) : (
          <div className="divide-y">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => openFeedbackDetail(feedback)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[feedback.category]}`}>
                        {categoryLabels[feedback.category]}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[feedback.status]}`}>
                        {statusLabels[feedback.status]}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-800 truncate">{feedback.title}</h4>
                    <p className="text-sm text-gray-500 truncate mt-1">{feedback.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{feedback.userName} ({feedback.userEmail})</span>
                      <span>{new Date(feedback.createdAt).toLocaleString('zh-CN')}</span>
                      {feedback.appVersion && <span>v{feedback.appVersion}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {feedback.logContent && (
                      <span className="material-icons text-blue-500 text-lg" title="包含日志">description</span>
                    )}
                    {feedback.adminReply && (
                      <span className="material-icons text-green-500 text-lg" title="已回复">reply</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFeedback(feedback.id);
                      }}
                      className="text-red-400 hover:text-red-600"
                      title="删除"
                    >
                      <span className="material-icons text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">反馈详情</h3>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Meta */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${categoryColors[selectedFeedback.category]}`}>
                  {categoryLabels[selectedFeedback.category]}
                </span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${statusColors[selectedFeedback.status]}`}>
                  {statusLabels[selectedFeedback.status]}
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">标题</label>
                <div className="text-lg font-medium text-gray-800">{selectedFeedback.title}</div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">内容</label>
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {selectedFeedback.content}
                </div>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-500 mb-1">用户</label>
                  <div className="text-gray-800">{selectedFeedback.userName}</div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">邮箱</label>
                  <div className="text-gray-800">{selectedFeedback.userEmail}</div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">提交时间</label>
                  <div className="text-gray-800">{new Date(selectedFeedback.createdAt).toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">应用版本</label>
                  <div className="text-gray-800">{selectedFeedback.appVersion || '-'}</div>
                </div>
              </div>

              {/* Attached Logs */}
              {selectedFeedback.logContent && (
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-1 flex items-center gap-2">
                    <span className="material-icons text-sm">description</span>
                    附带日志
                  </label>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg border border-gray-700 overflow-auto max-h-64">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {selectedFeedback.logContent}
                    </pre>
                  </div>
                </div>
              )}

              {/* Existing Reply */}
              {selectedFeedback.adminReply && (
                <div>
                  <label className="block text-sm font-medium text-green-600 mb-1">已有回复</label>
                  <div className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200 whitespace-pre-wrap">
                    {selectedFeedback.adminReply}
                  </div>
                </div>
              )}

              {/* Update Form */}
              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">更新状态</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as FeedbackStatus)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="pending">待处理</option>
                    <option value="reviewed">已查看</option>
                    <option value="resolved">已解决</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">回复内容 (可选)</label>
                  <textarea
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 h-32 resize-none"
                    placeholder="输入回复内容..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdateFeedback}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        保存中...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-lg">save</span>
                        保存更新
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
