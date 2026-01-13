import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, isAuthenticated, clearTokens } from '../services/apiClient';
import analytics from '../services/analytics';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const result = await authApi.getMe();
          if (result.success && result.data) {
            setUser(result.data);
          } else {
            // Token is invalid, clear it
            clearTokens();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          clearTokens();
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      if (result.success && result.data) {
        setUser(result.data.user);
        analytics.track('user_login', { email });
        return { success: true };
      }
      return { 
        success: false, 
        error: result.error?.message || '登录失败，请检查邮箱和密码' 
      };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: '网络错误，请稍后重试' 
      };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const result = await authApi.register(email, password, name);
      if (result.success && result.data) {
        setUser(result.data.user);
        analytics.track('user_register', { email, name });
        return { success: true };
      }
      return { 
        success: false, 
        error: result.error?.message || '注册失败，请稍后重试' 
      };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: '网络错误，请稍后重试' 
      };
    }
  };

  const logout = async () => {
    analytics.track('user_logout');
    await authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (isAuthenticated()) {
      const result = await authApi.getMe();
      if (result.success && result.data) {
        setUser(result.data);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
