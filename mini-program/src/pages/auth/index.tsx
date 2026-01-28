import React, { useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Input, Button } from '@tarojs/components';
import { useAuth } from '../../context/AuthContext';

// 简化的表单字段组件
const AuthField: React.FC<{
  type: 'text' | 'password' | 'number' | 'idcard' | 'digit' | 'safe-password';
  placeholder: string;
  value: string;
  onInput: (e: any) => void;
  icon: string;
  isPassword?: boolean;
}> = ({ type, placeholder, value, onInput, icon, isPassword = false }) => {
  return (
    <View className="relative mb-4 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
      <View className="flex items-center">
        <Text className="mr-3 text-gray-400 text-lg">{icon}</Text>
        <Input
          type={type}
          value={value}
          onInput={onInput}
          password={isPassword}
          placeholder={placeholder}
          placeholderStyle="color: #bbbbbb"
          className="flex-1 text-gray-800 text-base"
          style={{ color: '#333333' }}
        />
      </View>
    </View>
  );
};

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const { login, loginWithWeChat, register } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('请填写完整信息');
      return;
    }
    
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let result;
      if (mode === 'login') {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }

      if (result.success) {
        Taro.reLaunch({ url: '/pages/index/index' });
      } else {
        setError(result.error || '操作失败');
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-white flex flex-col items-center justify-center p-6 pt-10">
      {/* Disclaimer Dialog */}
      {showDisclaimer && (
        <View className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <View className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <View className="relative bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm">
             <Text className="block text-2xl font-bold text-gray-900 mb-4 text-center">使用声明</Text>
             <View className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-gray-600 space-y-3">
               <Text className="block">1. 本平台仅供个人学习和交流使用</Text>
               <Text className="block">2. 严禁用于商业用途或任何非法活动</Text>
               <Text className="block">3. 请遵守相关平台规则，文责自负</Text>
               <Text className="block">4. 使用产生的后果由用户自行承担</Text>
             </View>
             <Button 
               onClick={() => setShowDisclaimer(false)}
               className="w-full bg-green-600 text-white rounded-xl font-bold border-none h-12 flex items-center justify-center"
             >
               同意并继续
             </Button>
          </View>
        </View>
      )}

      {/* Auth Content */}
      <View className="w-full max-w-sm relative z-10">
        <View className="text-center mb-10">
          <View className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Text className="text-white text-4xl">📄</Text>
          </View>
          <Text className="block text-2xl font-bold text-gray-900 mb-1">WeChat AI Publisher</Text>
          <Text className="text-gray-400">{mode === 'login' ? '登录您的账户' : '创建新账户'}</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl">
          {/* WeChat Login Button (Primary Option) */}
          <Button
            onClick={async () => {
              setIsLoading(true);
              const res = await loginWithWeChat();
              if (res.success) {
                Taro.reLaunch({ url: '/pages/index/index' });
              } else {
                setError(res.error || '微信登录失败');
                setIsLoading(false);
              }
            }}
            className="w-full bg-green-600 text-white rounded-xl py-3 font-bold mb-6 border-none shadow-lg shadow-green-600/20 h-14 flex items-center justify-center gap-2"
          >
            <Text className="text-xl">💬</Text>
            <Text>微信一键登录</Text>
          </Button>

          <View className="relative flex py-2 items-center mb-6">
            <View className="flex-grow border-t border-gray-100"></View>
            <Text className="flex-shrink mx-4 text-gray-300 text-xs">或使用账号密码</Text>
            <View className="flex-grow border-t border-gray-100"></View>
          </View>

          {mode === 'register' && (
            <AuthField 
              type="text" 
              placeholder="显示名称" 
              value={name} 
              onInput={e => setName(e.detail.value)} 
              icon="👤" 
            />
          )}

          <AuthField 
            type="text" 
            placeholder={mode === 'login' ? "用户名/邮箱" : "邮箱地址"} 
            value={email} 
            onInput={e => setEmail(e.detail.value)} 
            icon="✉️" 
            isPassword={false}
          />

          <AuthField 
            type="text" 
            placeholder="请输入密码" 
            value={password} 
            onInput={e => setPassword(e.detail.value)} 
            icon="🔒" 
            isPassword={true} 
          />

          {mode === 'register' && (
            <AuthField 
              type="text" 
              placeholder="请确认密码" 
              value={confirmPassword} 
              onInput={e => setConfirmPassword(e.detail.value)} 
              icon="🔒" 
              isPassword={true} 
            />
          )}

          {error && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-100">
              <Text className="text-red-500 text-sm text-center block">{error}</Text>
            </View>
          )}

          <Button 
            onClick={handleSubmit} 
            loading={isLoading}
            className="w-full bg-green-600 text-white rounded-xl py-2 font-bold mb-6 border-none shadow-lg shadow-green-600/20 h-12 flex items-center justify-center"
          >
            {mode === 'login' ? '立即登录' : '提交注册'}
          </Button>

          <View className="flex justify-center items-center">
            <Text className="text-gray-400 text-sm">
              {mode === 'login' ? '还没有账号？' : '已有账号？'}
            </Text>
            <Text 
              className="text-green-600 text-sm font-bold ml-2"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? '立即注册' : '去登录'}
            </Text>
          </View>
        </View>

        <View className="mt-10 text-center">
           <Text className="text-gray-300 text-[10px]">京ICP备2026002161号</Text>
        </View>
      </View>
    </View>
  );
}
