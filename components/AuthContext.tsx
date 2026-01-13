import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, isAuthenticated, clearTokens } from '../services/apiClient';
import analytics from '../services/analytics';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isGuestMode: boolean;
  canUseFreeAccess: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  startGuestMode: () => void;
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
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Check if user has used their free access
  const canUseFreeAccess = () => {
    const hasUsedFreeAccess = localStorage.getItem('has_used_free_access');
    return !hasUsedFreeAccess;
  };

  const [canUseFree, setCanUseFree] = useState(canUseFreeAccess());

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if in guest mode
      const guestMode = localStorage.getItem('guest_mode');
      if (guestMode === 'true') {
        setIsGuestMode(true);
        setIsLoading(false);
        return;
      }

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

  const startGuestMode = () => {
    if (canUseFree) {
      localStorage.setItem('guest_mode', 'true');
      localStorage.setItem('has_used_free_access', 'true');
      setIsGuestMode(true);
      setCanUseFree(false);
      analytics.track('guest_mode_started');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      if (result.success && result.data) {
        setUser(result.data.user);
        // Clear guest mode on successful login
        localStorage.removeItem('guest_mode');
        setIsGuestMode(false);
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
        // Clear guest mode on successful registration
        localStorage.removeItem('guest_mode');
        setIsGuestMode(false);
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
    // Clear guest mode on logout
    localStorage.removeItem('guest_mode');
    setIsGuestMode(false);
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
      isLoggedIn: !!user || isGuestMode,
      isGuestMode,
      canUseFreeAccess: canUseFree,
      login,
      register,
      logout,
      refreshUser,
      startGuestMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
