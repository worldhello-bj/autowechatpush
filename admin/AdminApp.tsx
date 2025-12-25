import React, { useState, useEffect } from 'react';

// API configuration
const API_BASE = '/api/v1';

// Types
type AdminTab = 'dashboard' | 'users' | 'apiconfig' | 'analytics';

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
  wechatAppId: string;
  wechatAppSecret: string;
  googleApiKey: string;
  deepSeekApiKey: string;
  dashScopeApiKey: string;
  updatedAt?: string;
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
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  // API Config State
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    wechatAppId: '',
    wechatAppSecret: '',
    googleApiKey: '',
    deepSeekApiKey: '',
    dashScopeApiKey: '',
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch stats and users
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsResult, usersResult, configResult, analyticsResult] = await Promise.all([
          request<AdminStats>('/admin/stats'),
          request<{ users: User[] }>('/admin/users'),
          request<ApiConfig>('/admin/config'),
          request<any>('/admin/analytics'),
        ]);
        
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data.users);
        }
        if (configResult.success && configResult.data) {
          setApiConfig(configResult.data);
        }
        if (analyticsResult.success && analyticsResult.data) {
          setAnalyticsData(analyticsResult.data);
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

  const handleSaveApiConfig = async () => {
    setIsSavingConfig(true);
    setConfigMessage(null);
    
    try {
      const result = await request<ApiConfig>('/admin/config', {
        method: 'PATCH',
        body: JSON.stringify(apiConfig),
      });
      
      if (result.success && result.data) {
        setApiConfig(result.data);
        setConfigMessage({ type: 'success', text: 'API配置保存成功！' });
      } else {
        setConfigMessage({ type: 'error', text: result.error?.message || '保存失败' });
      }
    } catch {
      setConfigMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsSavingConfig(false);
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
          /* API Config Tab */
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="material-icons text-purple-500">api</span>
                API配置管理
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                配置系统使用的各种API密钥，这些配置将被所有用户共享使用。
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* WeChat Configuration */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="material-icons text-green-500 text-lg">chat</span>
                  微信公众号配置
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AppID</label>
                    <input
                      type="text"
                      value={apiConfig.wechatAppId}
                      onChange={(e) => setApiConfig({ ...apiConfig, wechatAppId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                      placeholder="wx..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AppSecret</label>
                    <input
                      type="password"
                      value={apiConfig.wechatAppSecret}
                      onChange={(e) => setApiConfig({ ...apiConfig, wechatAppSecret: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* AI API Keys */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="material-icons text-blue-500 text-lg">psychology</span>
                  AI服务API密钥
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Google API Key
                      <span className="text-gray-400 font-normal ml-2">(Gemini)</span>
                    </label>
                    <input
                      type="password"
                      value={apiConfig.googleApiKey}
                      onChange={(e) => setApiConfig({ ...apiConfig, googleApiKey: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                      placeholder="AIza..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DeepSeek API Key
                    </label>
                    <input
                      type="password"
                      value={apiConfig.deepSeekApiKey}
                      onChange={(e) => setApiConfig({ ...apiConfig, deepSeekApiKey: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                      placeholder="sk-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DashScope API Key
                      <span className="text-gray-400 font-normal ml-2">(Qwen/通义千问)</span>
                    </label>
                    <input
                      type="password"
                      value={apiConfig.dashScopeApiKey}
                      onChange={(e) => setApiConfig({ ...apiConfig, dashScopeApiKey: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                      placeholder="sk-..."
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  {configMessage && (
                    <div className={`text-sm flex items-center gap-2 ${
                      configMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="material-icons text-lg">
                        {configMessage.type === 'success' ? 'check_circle' : 'error'}
                      </span>
                      {configMessage.text}
                    </div>
                  )}
                  {apiConfig.updatedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      上次更新: {new Date(apiConfig.updatedAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSaveApiConfig}
                  disabled={isSavingConfig}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isSavingConfig ? (
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
        ) : (
          /* Analytics Tab */
          <div className="space-y-6">
            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '总事件数', value: analyticsData?.totalEvents || 0, icon: 'event', color: 'bg-blue-500' },
                { label: '活跃用户(今日)', value: analyticsData?.activeUsersToday || 0, icon: 'today', color: 'bg-green-500' },
                { label: '活跃用户(本周)', value: analyticsData?.activeUsersWeek || 0, icon: 'date_range', color: 'bg-orange-500' },
                { label: '总用户数', value: analyticsData?.totalUsers || 0, icon: 'people', color: 'bg-purple-500' },
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

            {/* Top Events */}
            <div className="bg-white rounded-xl shadow-sm p-6">
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-icons text-green-500">history</span>
                最近事件
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-3 font-medium">时间</th>
                      <th className="pb-3 font-medium">用户ID</th>
                      <th className="pb-3 font-medium">事件类型</th>
                      <th className="pb-3 font-medium">数据</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData?.recentEvents?.slice(0, 20).map((event: any) => (
                      <tr key={event.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 text-gray-600">
                          {new Date(event.timestamp).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {event.userId.substring(0, 8)}...
                          </code>
                        </td>
                        <td className="py-3">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {event.eventType}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-xs">
                          {event.eventData ? (
                            <code className="bg-gray-50 px-2 py-1 rounded">
                              {JSON.stringify(event.eventData).substring(0, 50)}
                              {JSON.stringify(event.eventData).length > 50 ? '...' : ''}
                            </code>
                          ) : (
                            <span className="text-gray-400">-</span>
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
            </div>
          </div>
        )}
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
