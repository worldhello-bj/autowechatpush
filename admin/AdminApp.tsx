import React, { useState, useEffect } from 'react';
import FeedbackManagement from './components/FeedbackManagement';

// API configuration
const API_BASE = '/api/v1';

// Types
type AdminTab = 'dashboard' | 'users' | 'apiconfig' | 'analytics' | 'feedback';

interface User {
  id: string;
  email: string;
  name: string;
  quota: number;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

interface AdminStats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  totalQuotaAllocated: number;
}

interface ApiConfig {
  googleApiKey: string;
  deepSeekApiKey: string;
  dashScopeApiKey: string;
  updatedAt?: string;
}

interface AIKeyConfig {
  key: string;
  name?: string;
  enabled: boolean;
  weight?: number;
  maxConcurrent?: number;
}

interface KeyPoolConfig {
  deepseek: AIKeyConfig[];
  qwen: AIKeyConfig[];
}

interface KeyPoolStats {
  [key: string]: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    currentConcurrent: number;
    lastUsed?: number;
    lastError?: string;
  };
}

interface KeyPoolResponse {
  config: KeyPoolConfig;
  stats: KeyPoolStats;
}

// Token management
const getAccessToken = (): string | null => localStorage.getItem('admin_access_token');
const getRefreshToken = (): string | null => localStorage.getItem('admin_refresh_token');
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('admin_access_token', accessToken);
  localStorage.setItem('admin_refresh_token', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
};

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

// Login Component
const AdminLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await request<{ accessToken: string; refreshToken: string; user: User }>('/auth/token', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (result.success && result.data) {
        if (result.data.user.role !== 'admin') {
          setError('权限不足：仅管理员可登录');
          return;
        }
        setTokens(result.data.accessToken, result.data.refreshToken);
        onLogin(result.data.user);
      } else {
        setError(result.error?.message || '登录失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl mb-4 border border-white/20">
            <span className="material-icons text-white text-4xl">admin_panel_settings</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">管理后台</h1>
          <p className="text-white/60">WeChat AI Publisher</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                管理员邮箱
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-white/40">
                  email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-white/40">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  <span className="material-icons">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-icons text-lg">error_outline</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </>
              ) : (
                <>
                  <span className="material-icons">login</span>
                  登录管理后台
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-white/40 text-sm">
          <p>仅限管理员账户登录</p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const AdminDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<{
    totalEvents: number;
    totalUsers: number;
    activeUsersToday: number;
    activeUsersWeek: number;
    topEvents: Array<{ eventType: string; count: number }>;
    recentEvents: any[];
    hourlyDistribution?: Array<{ hour: number; events: number; percentage: number }>;
    weekdayDistribution?: Array<{ day: string; events: number; percentage: number }>;
    monthlyDistribution?: Array<{ month: string; events: number; percentage: number }>;
    timeOfDay?: {
      morning: { events: number; percentage: number };
      afternoon: { events: number; percentage: number };
      evening: { events: number; percentage: number };
      night: { events: number; percentage: number };
    };
    weekendVsWeekday?: {
      weekend: { events: number; percentage: number };
      weekday: { events: number; percentage: number };
    };
    peakHour?: { hour: number; events: number };
    peakDay?: { day: string; events: number };
  } | null>(null);
  const [segmentationData, setSegmentationData] = useState<any>(null);
  const [timeAnalyticsData, setTimeAnalyticsData] = useState<{
    dailyChart: Array<{ date: string; events: number }>;
    hourlyChart: Array<{ time: string; events: number }>;
    weeklyChart: Array<{ week: string; events: number }>;
  } | null>(null);
  const [behaviorData, setBehaviorData] = useState<{
    behaviorPatterns: Record<string, number>;
    userCount: number;
  } | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'segmentation' | 'time' | 'behavior' | 'timedistribution'>('overview');
  
  // AI Key Pool State
  const [keyPool, setKeyPool] = useState<KeyPoolResponse | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [keyPoolMessage, setKeyPoolMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [editingKey, setEditingKey] = useState<{ provider: 'deepseek' | 'qwen'; index: number; key: AIKeyConfig } | null>(null);

  // Fetch stats and users
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsResult, usersResult, analyticsResult, keyPoolResult] = await Promise.all([
          request<AdminStats>('/admin/stats'),
          request<{ users: User[] }>('/admin/users'),
          request<any>('/admin/analytics'),
          request<KeyPoolResponse>('/admin/keypool'),
        ]);

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data.users);
        }
        if (analyticsResult.success && analyticsResult.data) {
          setAnalyticsData(analyticsResult.data);
        }
        if (keyPoolResult.success && keyPoolResult.data) {
          setKeyPool(keyPoolResult.data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    clearTokens();
    onLogout();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？')) return;
    
    const result = await request(`/admin/users/${userId}`, { method: 'DELETE' });
    if (result.success) {
      setUsers(users.filter(u => u.id !== userId));
      // Refresh stats
      const statsResult = await request<AdminStats>('/admin/stats');
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } else {
      alert(result.error?.message || '删除失败');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    const result = await request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    });
    if (result.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert(result.error?.message || '修改失败');
    }
  };

  // AI Key Pool Management Functions
  const handleSaveKeyPool = async () => {
    if (!keyPool) return;

    setIsLoadingKeys(true);
    setKeyPoolMessage(null);

    try {
      const result = await request<KeyPoolResponse>('/admin/keypool', {
        method: 'PUT',
        body: JSON.stringify(keyPool.config),
      });

      if (result.success && result.data) {
        setKeyPool(result.data);
        setKeyPoolMessage({ type: 'success', text: 'AI密钥池保存成功！' });
      } else {
        setKeyPoolMessage({ type: 'error', text: result.error?.message || '保存失败' });
      }
    } catch {
      setKeyPoolMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleToggleKey = (provider: 'deepseek' | 'qwen', index: number) => {
    if (!keyPool) return;

    const newConfig = { ...keyPool.config };
    newConfig[provider][index].enabled = !newConfig[provider][index].enabled;
    setKeyPool({ ...keyPool, config: newConfig });
  };

  const handleEditKey = (provider: 'deepseek' | 'qwen', index: number) => {
    if (!keyPool) return;

    setEditingKey({
      provider,
      index,
      key: { ...keyPool.config[provider][index] }
    });
  };

  const handleDeleteKey = (provider: 'deepseek' | 'qwen', index: number) => {
    if (!keyPool || !confirm('确定要删除此API密钥吗？')) return;

    const newConfig = { ...keyPool.config };
    newConfig[provider].splice(index, 1);
    setKeyPool({ ...keyPool, config: newConfig });
  };

  const handleAddKey = (provider: 'deepseek' | 'qwen') => {
    setShowAddKeyModal(true);
  };

  const handleReloadKeyPool = async () => {
    setIsLoadingKeys(true);
    try {
      const result = await request<KeyPoolResponse>('/admin/keypool/reload', {
        method: 'POST',
      });

      if (result.success && result.data) {
        setKeyPool(result.data);
        setKeyPoolMessage({ type: 'success', text: '密钥池已重新加载' });
      } else {
        setKeyPoolMessage({ type: 'error', text: result.error?.message || '重新加载失败' });
      }
    } catch {
      setKeyPoolMessage({ type: 'error', text: '重新加载失败，请重试' });
    } finally {
      setIsLoadingKeys(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="material-icons">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">管理后台</h1>
              <p className="text-sm text-white/70">WeChat AI Publisher</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-white/70">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
            >
              <span className="material-icons text-lg">logout</span>
              退出
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium rounded-t-lg transition ${
                activeTab === 'dashboard' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-icons text-sm mr-2 align-middle">dashboard</span>
              仪表盘
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium rounded-t-lg transition ${
                activeTab === 'users' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-icons text-sm mr-2 align-middle">people</span>
              用户管理
            </button>
            <button
              onClick={() => setActiveTab('apiconfig')}
              className={`px-6 py-3 font-medium rounded-t-lg transition ${
                activeTab === 'apiconfig' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-icons text-sm mr-2 align-middle">api</span>
              API设置
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium rounded-t-lg transition ${
                activeTab === 'analytics' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-icons text-sm mr-2 align-middle">bar_chart</span>
              数据分析
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-6 py-3 font-medium rounded-t-lg transition ${
                activeTab === 'feedback' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-icons text-sm mr-2 align-middle">feedback</span>
              用户反馈
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'dashboard' ? (
          /* Dashboard Tab */
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '总用户数', value: stats?.totalUsers || 0, icon: 'people', color: 'bg-blue-500' },
                { label: '管理员', value: stats?.adminCount || 0, icon: 'admin_panel_settings', color: 'bg-purple-500' },
                { label: '普通用户', value: stats?.userCount || 0, icon: 'person', color: 'bg-green-500' },
                { label: '总配额分配', value: stats?.totalQuotaAllocated || 0, icon: 'token', color: 'bg-orange-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
                  <div>
                    <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
                    <div className="text-3xl font-bold text-gray-800">{stat.value.toLocaleString()}</div>
                  </div>
                  <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <span className="material-icons text-white text-2xl">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">最近注册用户</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b">
                      <th className="pb-3 font-medium">用户</th>
                      <th className="pb-3 font-medium">角色</th>
                      <th className="pb-3 font-medium">配额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{u.name}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role === 'admin' ? '管理员' : '用户'}
                          </span>
                        </td>
                        <td className="py-4 text-gray-700">{u.quota}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'users' ? (
          /* Users Tab */
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">用户列表</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <span className="material-icons text-lg">person_add</span>
                添加用户
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm bg-gray-50">
                    <th className="px-6 py-3 font-medium">用户</th>
                    <th className="px-6 py-3 font-medium">角色</th>
                    <th className="px-6 py-3 font-medium">配额</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{u.name}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as 'user' | 'admin')}
                          className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                          disabled={u.id === user.id}
                        >
                          <option value="user">用户</option>
                          <option value="admin">管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{u.quota}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === user.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u.id === user.id ? '不能删除自己' : '删除用户'}
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'apiconfig' ? (
          /* AI Key Pool Management Tab */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons text-purple-500">key</span>
                  AI密钥池管理
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  管理系统中所有AI服务的API密钥，支持负载均衡和使用统计。
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Key Pool Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="material-icons text-blue-500 text-lg">smart_toy</span>
                      DeepSeek密钥池
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">总数量:</span>
                        <span className="font-medium">{keyPool?.config.deepseek.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">已启用:</span>
                        <span className="font-medium text-green-600">
                          {keyPool?.config.deepseek.filter(k => k.enabled).length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="material-icons text-green-500 text-lg">psychology</span>
                      Qwen密钥池
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">总数量:</span>
                        <span className="font-medium">{keyPool?.config.qwen.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">已启用:</span>
                        <span className="font-medium text-green-600">
                          {keyPool?.config.qwen.filter(k => k.enabled).length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddKeyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <span className="material-icons text-lg">add</span>
                    添加密钥
                  </button>
                  <button
                    onClick={handleReloadKeyPool}
                    disabled={isLoadingKeys}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <span className="material-icons text-lg">refresh</span>
                    重新加载
                  </button>
                </div>

                {/* DeepSeek Keys */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="material-icons text-blue-500">smart_toy</span>
                    DeepSeek API密钥
                    <button
                      onClick={() => handleAddKey('deepseek')}
                      className="ml-auto text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition"
                    >
                      + 添加
                    </button>
                  </h4>
                  <div className="space-y-3">
                    {keyPool?.config.deepseek.map((key, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{key.name || `密钥 ${index + 1}`}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              key.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {key.enabled ? '启用' : '禁用'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 font-mono mt-1">
                            {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                          </div>
                          {(key.weight || key.maxConcurrent) && (
                            <div className="text-xs text-gray-400 mt-1">
                              {key.weight && `权重: ${key.weight}`}
                              {key.weight && key.maxConcurrent && ' | '}
                              {key.maxConcurrent && `并发限制: ${key.maxConcurrent}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {keyPool.stats[key.key] && (
                            <div className="text-xs text-gray-500 text-right">
                              <div>请求: {keyPool.stats[key.key].totalRequests}</div>
                              <div>并发: {keyPool.stats[key.key].currentConcurrent}</div>
                            </div>
                          )}
                          <button
                            onClick={() => handleToggleKey('deepseek', index)}
                            className={`p-1 rounded ${
                              key.enabled ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={key.enabled ? '禁用密钥' : '启用密钥'}
                          >
                            <span className="material-icons text-lg">
                              {key.enabled ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleEditKey('deepseek', index)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="编辑密钥"
                          >
                            <span className="material-icons text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteKey('deepseek', index)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="删除密钥"
                          >
                            <span className="material-icons text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!keyPool?.config.deepseek || keyPool.config.deepseek.length === 0) && (
                      <div className="text-center py-8 text-gray-400">
                        <span className="material-icons text-4xl mb-2">key_off</span>
                        <p>暂无DeepSeek API密钥</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Qwen Keys */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="material-icons text-green-500">psychology</span>
                    Qwen API密钥
                    <button
                      onClick={() => handleAddKey('qwen')}
                      className="ml-auto text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition"
                    >
                      + 添加
                    </button>
                  </h4>
                  <div className="space-y-3">
                    {keyPool?.config.qwen.map((key, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{key.name || `密钥 ${index + 1}`}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              key.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {key.enabled ? '启用' : '禁用'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 font-mono mt-1">
                            {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                          </div>
                          {(key.weight || key.maxConcurrent) && (
                            <div className="text-xs text-gray-400 mt-1">
                              {key.weight && `权重: ${key.weight}`}
                              {key.weight && key.maxConcurrent && ' | '}
                              {key.maxConcurrent && `并发限制: ${key.maxConcurrent}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {keyPool.stats[key.key] && (
                            <div className="text-xs text-gray-500 text-right">
                              <div>请求: {keyPool.stats[key.key].totalRequests}</div>
                              <div>并发: {keyPool.stats[key.key].currentConcurrent}</div>
                            </div>
                          )}
                          <button
                            onClick={() => handleToggleKey('qwen', index)}
                            className={`p-1 rounded ${
                              key.enabled ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={key.enabled ? '禁用密钥' : '启用密钥'}
                          >
                            <span className="material-icons text-lg">
                              {key.enabled ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleEditKey('qwen', index)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="编辑密钥"
                          >
                            <span className="material-icons text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteKey('qwen', index)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="删除密钥"
                          >
                            <span className="material-icons text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!keyPool?.config.qwen || keyPool.config.qwen.length === 0) && (
                      <div className="text-center py-8 text-gray-400">
                        <span className="material-icons text-4xl mb-2">key_off</span>
                        <p>暂无Qwen API密钥</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    {keyPoolMessage && (
                      <div className={`text-sm flex items-center gap-2 ${
                        keyPoolMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span className="material-icons text-lg">
                          {keyPoolMessage.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        {keyPoolMessage.text}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSaveKeyPool}
                    disabled={isLoadingKeys}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {isLoadingKeys ? (
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
                        保存配置
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          /* Analytics Tab */
          <div className="space-y-6">
            {/* Analytics Sub-tabs */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="border-b">
                <div className="flex gap-1 p-6">
                  <button
                    onClick={() => setAnalyticsTab('overview')}
                    className={`px-6 py-3 font-medium rounded-t-lg transition ${
                      analyticsTab === 'overview'
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2 align-middle">dashboard</span>
                    总览
                  </button>
                  <button
                    onClick={() => {
                      setAnalyticsTab('segmentation');
                      // Load segmentation data
                      if (!segmentationData) {
                        request('/admin/analytics/segmentation').then(result => {
                          if (result.success && result.data) {
                            setSegmentationData(result.data as any);
                          }
                        });
                      }
                    }}
                    className={`px-6 py-3 font-medium rounded-t-lg transition ${
                      analyticsTab === 'segmentation'
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2 align-middle">pie_chart</span>
                    用户分类
                  </button>
                  <button
                    onClick={() => {
                      setAnalyticsTab('time');
                      // Load time analytics data
                      if (!timeAnalyticsData) {
                        request('/admin/analytics/time?days=30').then(result => {
                          if (result.success && result.data) {
                            setTimeAnalyticsData(result.data as any);
                          }
                        });
                      }
                    }}
                    className={`px-6 py-3 font-medium rounded-t-lg transition ${
                      analyticsTab === 'time'
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2 align-middle">show_chart</span>
                    时间趋势
                  </button>
                  <button
                    onClick={() => {
                      setAnalyticsTab('behavior');
                      // Load behavior data
                      if (!behaviorData) {
                        request('/admin/analytics/behavior').then(result => {
                          if (result.success && result.data) {
                            setBehaviorData(result.data as { behaviorPatterns: Record<string, number>; userCount: number; });
                          }
                        });
                      }
                    }}
                    className={`px-6 py-3 font-medium rounded-t-lg transition ${
                      analyticsTab === 'behavior'
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2 align-middle">psychology</span>
                    行为分析
                  </button>
                  <button
                    onClick={() => {
                      setAnalyticsTab('timedistribution');
                      // Load time distribution data
                      if (!analyticsData?.hourlyDistribution) {
                        request('/admin/analytics/timedistribution').then(result => {
                          if (result.success && result.data) {
                            setAnalyticsData(prev => prev ? { ...prev, ...(result.data as any) } : result.data);
                          }
                        });
                      }
                    }}
                    className={`px-6 py-3 font-medium rounded-t-lg transition ${
                      analyticsTab === 'timedistribution'
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2 align-middle">schedule</span>
                    时间分布
                  </button>
                </div>
              </div>

              <div className="p-6">
                {analyticsTab === 'timedistribution' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-icons text-teal-500">schedule</span>
                      事件时间分布分析
                    </h3>

                    {/* Time Distribution Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                            <span className="material-icons text-white">schedule</span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-teal-800">峰值小时</div>
                            <div className="text-sm text-teal-600">最活跃时间段</div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-teal-800">
                          {analyticsData?.peakHour ? `${analyticsData.peakHour.hour}:00` : '--'}
                        </div>
                        <div className="text-sm text-teal-600 mt-1">
                          {analyticsData?.peakHour ? `${analyticsData.peakHour.events} 事件` : '暂无数据'}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <span className="material-icons text-white">event</span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-indigo-800">峰值星期</div>
                            <div className="text-sm text-indigo-600">最活跃日期</div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-indigo-800">
                          {analyticsData?.peakDay ? analyticsData.peakDay.day : '--'}
                        </div>
                        <div className="text-sm text-indigo-600 mt-1">
                          {analyticsData?.peakDay ? `${analyticsData.peakDay.events} 事件` : '暂无数据'}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                            <span className="material-icons text-white">weekend</span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-amber-800">周末占比</div>
                            <div className="text-sm text-amber-600">周末vs工作日</div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-amber-800">
                          {analyticsData?.weekendVsWeekday ?
                            ((analyticsData.weekendVsWeekday.weekend.events /
                              (analyticsData.weekendVsWeekday.weekend.events + analyticsData.weekendVsWeekday.weekday.events)) * 100).toFixed(1) + '%'
                            : '--'
                          }
                        </div>
                        <div className="text-sm text-amber-600 mt-1">
                          {analyticsData?.weekendVsWeekday ?
                            `${analyticsData.weekendVsWeekday.weekend.events} 周末事件`
                            : '暂无数据'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Hourly Distribution */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-icons text-blue-500">access_time</span>
                        24小时活跃度分布 (最近7天)
                      </h4>
                      <div className="h-64 flex items-end justify-between gap-1">
                        {analyticsData?.hourlyDistribution?.map((hour, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-full mb-2 transition-all hover:from-blue-600 hover:to-blue-500"
                              style={{
                                height: `${Math.max(hour.percentage * 2, 2)}%`,
                                minHeight: '8px'
                              }}
                              title={`${hour.hour}:00 - ${hour.events} 事件 (${hour.percentage.toFixed(1)}%)`}
                            ></div>
                            <div className="text-xs text-gray-500 font-medium">
                              {hour.hour}:00
                            </div>
                            <div className="text-xs text-gray-400">
                              {hour.percentage.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center text-sm text-gray-600">
                        鼠标悬停查看详细数据 | 蓝色柱状图显示各小时的事件分布
                      </div>
                    </div>

                    {/* Time of Day Breakdown */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-icons text-green-500">wb_sunny</span>
                        时段活跃度分析 (最近7天)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {analyticsData?.timeOfDay && [
                          {
                            label: '早上 (6:00-12:00)',
                            data: analyticsData.timeOfDay.morning,
                            color: 'bg-yellow-500',
                            icon: 'wb_sunny'
                          },
                          {
                            label: '下午 (12:00-18:00)',
                            data: analyticsData.timeOfDay.afternoon,
                            color: 'bg-orange-500',
                            icon: 'wb_twighlight'
                          },
                          {
                            label: '晚上 (18:00-24:00)',
                            data: analyticsData.timeOfDay.evening,
                            color: 'bg-indigo-500',
                            icon: 'nightlight'
                          },
                          {
                            label: '深夜 (0:00-6:00)',
                            data: analyticsData.timeOfDay.night,
                            color: 'bg-purple-500',
                            icon: 'bedtime'
                          },
                        ].map((period, i) => (
                          <div key={i} className="bg-white rounded-lg p-4 border">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`material-icons text-lg ${period.color.replace('bg-', 'text-')}`}>
                                {period.icon}
                              </span>
                              <span className="text-sm font-medium text-gray-700">{period.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mb-1">
                              {period.data.events}
                            </div>
                            <div className="text-sm text-gray-500">
                              {period.data.percentage.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Distribution */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-icons text-purple-500">calendar_view_week</span>
                        星期活跃度分布 (最近30天)
                      </h4>
                      <div className="h-48 flex items-end justify-between gap-2">
                        {analyticsData?.weekdayDistribution?.map((day, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t w-full mb-2 transition-all hover:from-purple-600 hover:to-purple-500"
                              style={{
                                height: `${Math.max(day.percentage * 1.5, 2)}%`,
                                minHeight: '8px'
                              }}
                              title={`${day.day}: ${day.events} 事件 (${day.percentage.toFixed(1)}%)`}
                            ></div>
                            <div className="text-sm font-medium text-gray-700">{day.day}</div>
                            <div className="text-xs text-gray-500">{day.events}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center text-sm text-gray-600">
                        紫色柱状图显示各星期的活跃度 | 工作日vs周末对比分析
                      </div>
                    </div>

                    {/* Monthly Distribution */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-icons text-red-500">calendar_month</span>
                        月度活跃度分布 (全年)
                      </h4>
                      <div className="h-48 flex items-end justify-between gap-1">
                        {analyticsData?.monthlyDistribution?.map((month, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="bg-gradient-to-t from-red-500 to-red-400 rounded-t w-full mb-2 transition-all hover:from-red-600 hover:to-red-500"
                              style={{
                                height: `${Math.max(month.percentage * 2, 2)}%`,
                                minHeight: '8px'
                              }}
                              title={`${month.month}: ${month.events} 事件 (${month.percentage.toFixed(1)}%)`}
                            ></div>
                            <div className="text-xs font-medium text-gray-700">{month.month}</div>
                            <div className="text-xs text-gray-500">{month.events}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center text-sm text-gray-600">
                        红色柱状图显示全年各月的活跃度 | 反映季节性使用模式
                      </div>
                    </div>

                    {/* Weekend vs Weekday Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
                            <span className="material-icons text-white">work</span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-cyan-800">工作日活跃度</div>
                            <div className="text-sm text-cyan-600">周一至周五</div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-cyan-800 mb-2">
                          {analyticsData?.weekendVsWeekday?.weekday.events || 0}
                        </div>
                        <div className="text-sm text-cyan-600">
                          占总事件 {analyticsData?.weekendVsWeekday ?
                            ((analyticsData.weekendVsWeekday.weekday.events /
                              (analyticsData.weekendVsWeekday.weekday.events + analyticsData.weekendVsWeekday.weekend.events)) * 100).toFixed(1) + '%'
                            : '--'
                          }
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                            <span className="material-icons text-white">weekend</span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-pink-800">周末活跃度</div>
                            <div className="text-sm text-pink-600">周六和周日</div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-pink-800 mb-2">
                          {analyticsData?.weekendVsWeekday?.weekend.events || 0}
                        </div>
                        <div className="text-sm text-pink-600">
                          占总事件 {analyticsData?.weekendVsWeekday ?
                            ((analyticsData.weekendVsWeekday.weekend.events /
                              (analyticsData.weekendVsWeekday.weekday.events + analyticsData.weekendVsWeekday.weekend.events)) * 100).toFixed(1) + '%'
                            : '--'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {analyticsTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Analytics Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: '总事件数', value: analyticsData?.totalEvents || 0, icon: 'event', color: 'bg-blue-500' },
                        { label: '活跃用户(今日)', value: analyticsData?.activeUsersToday || 0, icon: 'today', color: 'bg-green-500' },
                        { label: '活跃用户(本周)', value: analyticsData?.activeUsersWeek || 0, icon: 'date_range', color: 'bg-orange-500' },
                        { label: '总用户数', value: analyticsData?.totalUsers || 0, icon: 'people', color: 'bg-purple-500' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between border">
                          <div>
                            <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
                            <div className="text-3xl font-bold text-gray-800">{stat.value.toLocaleString()}</div>
                          </div>
                          <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center`}>
                            <span className="material-icons text-white text-2xl">{stat.icon}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Top Events */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-icons text-blue-500">trending_up</span>
                        热门事件类型
                      </h3>
                      <div className="space-y-3">
                        {analyticsData?.topEvents?.slice(0, 10).map((event: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">{i + 1}</span>
                              </div>
                              <span className="font-mono text-sm text-gray-700">{event.eventType}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-800">{event.count.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">次</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!analyticsData?.topEvents || analyticsData.topEvents.length === 0) && (
                          <div className="text-center py-8 text-gray-400">
                            <span className="material-icons text-4xl mb-2">info</span>
                            <p>暂无数据</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Events */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="material-icons text-green-500">history</span>
                        最近事件
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                          <thead>
                            <tr className="text-left text-gray-500 border-b">
                              <th className="pb-3 font-medium w-32">时间</th>
                              <th className="pb-3 font-medium w-24">用户ID</th>
                              <th className="pb-3 font-medium w-24">事件类型</th>
                              <th className="pb-3 font-medium min-w-0 flex-1">数据</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData?.recentEvents?.slice(0, 20).map((event: any) => (
                              <tr key={event.id} className="border-b last:border-0 hover:bg-white">
                                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                                  <div className="text-xs">
                                    {new Date(event.timestamp).toLocaleDateString('zh-CN')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(event.timestamp).toLocaleTimeString('zh-CN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </td>
                                <td className="py-3 pr-4">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate max-w-20" title={event.userId}>
                                    {event.userId.substring(0, 8)}...
                                  </code>
                                </td>
                                <td className="py-3 pr-4">
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                                    {event.eventType}
                                  </span>
                                </td>
                                <td className="py-3 pr-4">
                                  {event.eventData ? (
                                    <div className="max-w-xs">
                                      <code className="text-xs bg-white px-2 py-1 rounded border block truncate" title={JSON.stringify(event.eventData)}>
                                        {JSON.stringify(event.eventData).substring(0, 40)}
                                        {JSON.stringify(event.eventData).length > 40 ? '...' : ''}
                                      </code>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {(!analyticsData?.recentEvents || analyticsData.recentEvents.length === 0) && (
                          <div className="text-center py-8 text-gray-400">
                            <span className="material-icons text-4xl mb-2">info</span>
                            <p>暂无事件记录</p>
                          </div>
                        )}
                      </div>

                      {/* Mobile-friendly card view for small screens */}
                      <div className="md:hidden space-y-3 mt-4">
                        {analyticsData?.recentEvents?.slice(0, 10).map((event: any) => (
                          <div key={event.id} className="bg-white rounded-lg p-4 border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {event.eventType}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              <code className="bg-gray-100 px-2 py-1 rounded">
                                {event.userId.substring(0, 8)}...
                              </code>
                            </div>
                            {event.eventData && (
                              <div className="text-xs text-gray-500 truncate" title={JSON.stringify(event.eventData)}>
                                数据: {JSON.stringify(event.eventData).substring(0, 30)}
                                {JSON.stringify(event.eventData).length > 30 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {analyticsTab === 'segmentation' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-icons text-purple-500">pie_chart</span>
                      用户分类分析
                    </h3>

                    {segmentationData ? (
                      <>
                        {/* User Segmentation Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                <span className="material-icons text-white">new_releases</span>
                              </div>
                              <div>
                                <div className="text-sm text-green-700 font-medium">新用户</div>
                                <div className="text-xs text-green-600">最近7天注册</div>
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-green-800">{segmentationData.newUsers}</div>
                            <div className="text-sm text-green-600 mt-1">
                              占总用户 {(segmentationData.totalUsers > 0 ? (segmentationData.newUsers / segmentationData.totalUsers * 100).toFixed(1) : 0)}%
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <span className="material-icons text-white">flash_on</span>
                              </div>
                              <div>
                                <div className="text-sm text-blue-700 font-medium">活跃用户</div>
                                <div className="text-xs text-blue-600">今日活跃</div>
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-blue-800">{segmentationData.activeUsers}</div>
                            <div className="text-sm text-blue-600 mt-1">
                              占总用户 {(segmentationData.totalUsers > 0 ? (segmentationData.activeUsers / segmentationData.totalUsers * 100).toFixed(1) : 0)}%
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                <span className="material-icons text-white">loyalty</span>
                              </div>
                              <div>
                                <div className="text-sm text-purple-700 font-medium">忠实用户</div>
                                <div className="text-xs text-purple-600">事件≥10次</div>
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-purple-800">{segmentationData.regularUsers}</div>
                            <div className="text-sm text-purple-600 mt-1">
                              占总用户 {(segmentationData.totalUsers > 0 ? (segmentationData.regularUsers / segmentationData.totalUsers * 100).toFixed(1) : 0)}%
                            </div>
                          </div>
                        </div>

                        {/* Activity Levels */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="material-icons text-orange-500">bar_chart</span>
                            用户活跃度分布
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { label: '高活跃用户', value: segmentationData.activityLevels.high, color: 'bg-red-500', desc: '事件≥50次' },
                              { label: '中活跃用户', value: segmentationData.activityLevels.medium, color: 'bg-yellow-500', desc: '事件10-49次' },
                              { label: '低活跃用户', value: segmentationData.activityLevels.low, color: 'bg-green-500', desc: '事件1-9次' },
                            ].map((level, i) => (
                              <div key={i} className="bg-white rounded-lg p-4 border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">{level.label}</span>
                                  <span className={`px-2 py-1 text-xs rounded-full text-white ${level.color}`}>{level.value}</span>
                                </div>
                                <div className="text-xs text-gray-500">{level.desc}</div>
                                <div className="text-lg font-bold text-gray-800 mt-2">
                                  {segmentationData.totalUsers > 0 ? ((level.value / segmentationData.totalUsers) * 100).toFixed(1) : 0}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dormant Users */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                                <span className="material-icons text-white">snooze</span>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-gray-800">休眠用户</div>
                                <div className="text-sm text-gray-600">超过30天未活跃</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-gray-800">{segmentationData.dormantUsers}</div>
                              <div className="text-sm text-gray-600">
                                占总用户 {(segmentationData.totalUsers > 0 ? (segmentationData.dormantUsers / segmentationData.totalUsers * 100).toFixed(1) : 0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                )}

                {analyticsTab === 'time' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-icons text-blue-500">show_chart</span>
                        时间趋势分析
                      </h3>
                      <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                        <option value="30">最近30天</option>
                        <option value="7">最近7天</option>
                        <option value="90">最近90天</option>
                      </select>
                    </div>

                    {timeAnalyticsData ? (
                      <>
                        {/* Time Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-xl p-6">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <span className="material-icons text-green-500">calendar_view_day</span>
                              每日趋势
                            </h4>
                            <div className="h-64 flex items-end justify-between gap-1">
                              {timeAnalyticsData.dailyChart.slice(-14).map((item, index) => {
                                const maxValue = Math.max(...timeAnalyticsData.dailyChart.map(d => d.events));
                                const height = maxValue > 0 ? (item.events / maxValue) * 100 : 0;
                                return (
                                  <div key={index} className="flex-1 flex flex-col items-center">
                                    <div
                                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-full mb-2 transition-all hover:from-blue-600 hover:to-blue-500"
                                      style={{ height: `${Math.max(height, 2)}%`, minHeight: '8px' }}
                                      title={`${item.date}: ${item.events} 事件`}
                                    ></div>
                                    <div className="text-xs text-gray-500 transform -rotate-45 origin-top">
                                      {new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-6">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <span className="material-icons text-purple-500">schedule</span>
                              小时活跃度
                            </h4>
                            <div className="h-64 flex items-end justify-between gap-1">
                              {timeAnalyticsData.hourlyChart.slice(-24).map((item, index) => {
                                const maxValue = Math.max(...timeAnalyticsData.hourlyChart.map(d => d.events));
                                const height = maxValue > 0 ? (item.events / maxValue) * 100 : 0;
                                return (
                                  <div key={index} className="flex-1 flex flex-col items-center">
                                    <div
                                      className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t w-full mb-2 transition-all hover:from-purple-600 hover:to-purple-500"
                                      style={{ height: `${Math.max(height, 2)}%`, minHeight: '8px' }}
                                      title={`${item.time.slice(-5)}: ${item.events} 事件`}
                                    ></div>
                                    <div className="text-xs text-gray-500">
                                      {item.time.slice(-5)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Weekly Trend */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="material-icons text-orange-500">date_range</span>
                            周趋势
                          </h4>
                          <div className="h-32 flex items-end justify-between gap-4">
                            {timeAnalyticsData.weeklyChart.map((item, index) => {
                              const maxValue = Math.max(...timeAnalyticsData.weeklyChart.map(d => d.events));
                              const height = maxValue > 0 ? (item.events / maxValue) * 100 : 0;
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                  <div
                                    className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t w-full mb-2 transition-all hover:from-orange-600 hover:to-orange-500"
                                    style={{ height: `${Math.max(height, 2)}%`, minHeight: '8px' }}
                                    title={`${item.week}: ${item.events} 事件`}
                                  ></div>
                                  <div className="text-sm font-medium text-gray-700">{item.week}</div>
                                  <div className="text-xs text-gray-500">{item.events}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                )}

                {analyticsTab === 'behavior' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-icons text-indigo-500">psychology</span>
                      用户行为分析
                    </h3>

                    {behaviorData ? (
                      <>
                        {/* Behavior Patterns */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="material-icons text-indigo-500">analytics</span>
                            用户行为模式
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(behaviorData.behaviorPatterns).map(([pattern, count]) => (
                              <div key={pattern} className="bg-white rounded-lg p-4 border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700 capitalize">{pattern}</span>
                                  <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">{count} 用户</span>
                                </div>
                                <div className="text-lg font-bold text-gray-800">
                                  {behaviorData.userCount > 0 ? ((count as number / behaviorData.userCount) * 100).toFixed(1) : 0}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* User Engagement Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                <span className="material-icons text-white">people</span>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-indigo-800">总用户数</div>
                                <div className="text-sm text-indigo-600">参与数据分析</div>
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-indigo-800">{behaviorData.userCount}</div>
                          </div>

                          <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                                <span className="material-icons text-white">trending_up</span>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-teal-800">行为模式数</div>
                                <div className="text-sm text-teal-600">不同使用偏好</div>
                              </div>
                            </div>
                            <div className="text-3xl font-bold text-teal-800">{Object.keys(behaviorData.behaviorPatterns).length}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'feedback' ? (
          /* Feedback Management Tab */
          <FeedbackManagement />
        ) : null}
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newUser) => {
            setUsers([newUser, ...users]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Add/Edit Key Modal */}
      {(showAddKeyModal || editingKey) && (
        <KeyModal
          keyPool={keyPool}
          editingKey={editingKey}
          onClose={() => {
            setShowAddKeyModal(false);
            setEditingKey(null);
          }}
          onSave={(newKey, provider) => {
            if (!keyPool) return;

            const newConfig = { ...keyPool.config };

            if (editingKey) {
              // Edit existing key
              newConfig[provider][editingKey.index] = newKey;
            } else {
              // Add new key
              newConfig[provider].push(newKey);
            }

            setKeyPool({ ...keyPool, config: newConfig });
            setShowAddKeyModal(false);
            setEditingKey(null);
          }}
        />
      )}
    </div>
  );
};

// Create User Modal
const CreateUserModal: React.FC<{ onClose: () => void; onCreated: (user: User) => void }> = ({ onClose, onCreated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [quota, setQuota] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !name) {
      setError('请填写所有必填字段');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await request<User>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role, quota }),
      });
      
      if (result.success && result.data) {
        onCreated(result.data);
      } else {
        setError(result.error?.message || '创建失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">创建新用户</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="输入用户名"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="user@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="至少6个字符"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">初始配额</label>
              <input
                type="number"
                value={quota}
                onChange={(e) => setQuota(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? '创建中...' : '创建用户'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add/Edit Key Modal
const KeyModal: React.FC<{
  keyPool: KeyPoolResponse | null;
  editingKey: { provider: 'deepseek' | 'qwen'; index: number; key: AIKeyConfig } | null;
  onClose: () => void;
  onSave: (key: AIKeyConfig, provider: 'deepseek' | 'qwen') => void;
}> = ({ keyPool, editingKey, onClose, onSave }) => {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [weight, setWeight] = useState<number | undefined>(100);
  const [maxConcurrent, setMaxConcurrent] = useState<number | undefined>();
  const [provider, setProvider] = useState<'deepseek' | 'qwen'>('deepseek');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingKey) {
      setKey(editingKey.key.key);
      setName(editingKey.key.name || '');
      setEnabled(editingKey.key.enabled);
      setWeight(editingKey.key.weight || 100);
      setMaxConcurrent(editingKey.key.maxConcurrent);
      setProvider(editingKey.provider);
    }
  }, [editingKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!key.trim()) {
      setError('请输入API密钥');
      return;
    }

    if (!name.trim()) {
      setError('请输入密钥名称');
      return;
    }

    onSave({
      key: key.trim(),
      name: name.trim(),
      enabled,
      weight: weight || 100,
      maxConcurrent: maxConcurrent || undefined,
    }, provider);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {editingKey ? '编辑API密钥' : '添加API密钥'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI服务提供商</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'deepseek' | 'qwen')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="deepseek">DeepSeek</option>
                <option value="qwen">Qwen</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密钥名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="例如：主密钥、备用密钥等"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API密钥 *</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
              placeholder={provider === 'deepseek' ? 'sk-...' : 'sk-...'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">权重 (1-1000)</label>
              <input
                type="number"
                value={weight || ''}
                onChange={(e) => setWeight(e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                max="1000"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大并发</label>
              <input
                type="number"
                value={maxConcurrent || ''}
                onChange={(e) => setMaxConcurrent(e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="不限制"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded focus:ring-purple-400"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              启用此密钥
            </label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {editingKey ? '保存修改' : '添加密钥'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Admin App
const AdminApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getAccessToken();
      if (token) {
        const result = await request<User>('/auth/me');
        if (result.success && result.data && result.data.role === 'admin') {
          setUser(result.data);
        } else {
          clearTokens();
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={setUser} />;
  }

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
};

export default AdminApp;
