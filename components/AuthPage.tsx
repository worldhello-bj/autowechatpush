import React, { useState } from 'react';
import { useAuth } from './AuthContext';

interface AuthPageProps {
  onSuccess?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, register } = useAuth();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !password) {
      setError(mode === 'login' ? '请填写用户名/邮箱和密码' : '请填写邮箱和密码');
      return;
    }
    
    // Only validate email format in register mode
    if (mode === 'register' && !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    
    if (mode === 'register') {
      if (!name.trim()) {
        setError('请输入用户名');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      let result;
      if (mode === 'login') {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || '操作失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-4">
            <span className="material-icons text-white text-3xl">article</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            WeChat <span className="text-green-600">AI Publisher</span>
          </h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' ? '登录您的账户' : '创建新账户'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xl">
                    person
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="输入您的用户名"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Email/Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'login' ? '用户名或邮箱' : '邮箱地址'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xl">
                  {mode === 'login' ? 'person' : 'email'}
                </span>
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder={mode === 'login' ? '用户名或邮箱' : 'your@email.com'}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xl">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="至少6个字符"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xl">
                    lock_outline
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="再次输入密码"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="material-icons text-lg">error_outline</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  处理中...
                </>
              ) : (
                <>
                  <span className="material-icons text-lg">
                    {mode === 'login' ? 'login' : 'person_add'}
                  </span>
                  {mode === 'login' ? '登录' : '注册'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-400">或者</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Switch Mode */}
          <div className="text-center">
            <p className="text-gray-600">
              {mode === 'login' ? '还没有账户？' : '已有账户？'}
              <button
                type="button"
                onClick={switchMode}
                className="ml-1 text-green-600 font-medium hover:text-green-700 hover:underline"
              >
                {mode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-400">
          <p>WeChat AI Publisher v1.3.0</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
