import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Button, Input, Switch, ScrollView } from '@tarojs/components';
import { useAuth } from '../../context/AuthContext';
import { wechatAccountService } from '../../services/wechatAccountService';
import { wechatOpenPlatformService } from '../../services/wechatOpenPlatformService';
import { WeChatAccount } from '@shared/types';

export default function Settings() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<WeChatAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'credentials' | 'authorization'>('authorization');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for credentials mode
  const [name, setName] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const list = wechatAccountService.getAllAccounts();
    setAccounts(list);
  };

  const handleLogout = async () => {
    await logout();
    Taro.reLaunch({ url: '/pages/welcome/index' });
  };

  const handleAddCredentials = async () => {
    if (!name || !appId || !appSecret) {
      setError('请填写完整信息');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Test the credentials first
      const isValid = await wechatAccountService.addAccount(name, appId, appSecret, isDefault);
      if (isValid) {
        setShowAddModal(false);
        resetForm();
        loadAccounts();
        Taro.showToast({ title: '添加成功', icon: 'success' });
      } else {
        setError('账号校验失败，请检查 AppID 和 AppSecret');
      }
    } catch (err: any) {
      setError(err.message || '添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authUrl = await wechatOpenPlatformService.getAuthUrl();
      // In a Mini Program, we usually show a QR code or redirect to a web-view
      // For now, let's copy the link and tell the user to open it, or use Taro.setClipboardData
      Taro.setClipboardData({
        data: authUrl,
        success: () => {
          Taro.showModal({
            title: '授权引导',
            content: '授权链接已复制到剪贴板。请在浏览器中打开此链接进行公众号扫码授权。完成后回到此处点击“同步授权状态”。',
            confirmText: '去同步',
            success: (res) => {
              if (res.confirm) {
                syncAuthStatus();
              }
            }
          });
        }
      });
    } catch (err: any) {
      setError(err.message || '获取授权链接失败');
    } finally {
      setIsLoading(false);
    }
  };

  const syncAuthStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const remoteAccounts = await wechatOpenPlatformService.getAuthorizedAccounts();
      if (remoteAccounts.length === 0) {
        setError('未发现新的授权公众号，请确保已在浏览器中完成扫码。');
        return;
      }

      // Sync remote accounts to local storage
      remoteAccounts.forEach(acc => {
        // Check if already exists
        const exists = accounts.find(la => la.appId === acc.appId);
        if (!exists) {
          wechatAccountService.addAuthorizedAccount({
            name: acc.nickName || '未命名公众号',
            appId: acc.appId,
            authorization: acc.authorization
          });
        }
      });

      loadAccounts();
      Taro.showToast({ title: '同步成功', icon: 'success' });
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || '同步授权状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除该公众号配置吗？',
      success: (res) => {
        if (res.confirm) {
          wechatAccountService.deleteAccount(id);
          loadAccounts();
        }
      }
    });
  };

  const resetForm = () => {
    setName('');
    setAppId('');
    setAppSecret('');
    setIsDefault(true);
    setError(null);
  };

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      <ScrollView className="flex-1 p-4">
        {/* User Info Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100">
          <View className="flex items-center gap-4 mb-6">
            <View className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </View>
            <View>
              <Text className="block text-xl font-bold text-gray-800">{user?.name}</Text>
              <Text className="block text-sm text-gray-500">{user?.email}</Text>
            </View>
          </View>

          <View className="space-y-4">
            <View className="flex justify-between items-center py-2 border-b border-gray-50">
              <Text className="text-gray-500 text-sm">账号配额</Text>
              <Text className="font-bold text-green-600">{user?.quota || 0} Credits</Text>
            </View>
          </View>
        </View>

        {/* WeChat Accounts Section */}
        <View className="mb-6">
          <View className="flex justify-between items-center mb-4 px-2">
            <Text className="text-lg font-bold text-gray-800">公众号管理</Text>
            <Button 
              size="mini"
              className="m-0 bg-green-600 text-white rounded-full px-4 text-xs h-8 flex items-center border-none"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              + 添加账号
            </Button>
          </View>

          {accounts.length === 0 ? (
            <View className="bg-white rounded-3xl p-10 flex flex-col items-center border border-dashed border-gray-300">
              <Text className="text-4xl mb-4">📢</Text>
              <Text className="text-gray-400 text-sm">暂未绑定公众号</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {accounts.map(acc => (
                <View key={acc.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <View className="flex items-center gap-3">
                    <View className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${acc.authType === 'authorization' ? 'bg-blue-500' : 'bg-green-500'}`}>
                      {acc.authType === 'authorization' ? 'A' : 'K'}
                    </View>
                    <View>
                      <Text className="block font-bold text-gray-800 text-sm">{acc.name}</Text>
                      <Text className="block text-[10px] text-gray-400">ID: {acc.appId}</Text>
                    </View>
                  </View>
                  <View className="flex items-center gap-2">
                    {acc.isDefault && (
                      <View className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full">默认</View>
                    )}
                    <View 
                      className="p-2"
                      onClick={() => handleDeleteAccount(acc.id)}
                    >
                      <Text className="text-red-400 text-lg">🗑️</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <Button 
          onClick={handleLogout}
          className="w-full bg-white text-red-500 font-bold rounded-2xl py-2 border border-red-100 shadow-sm h-12 flex items-center justify-center mb-10"
        >
          退出当前登录
        </Button>
      </ScrollView>

      {/* Add Account Modal Overlay */}
      {showAddModal && (
        <View className="fixed inset-0 z-50 flex items-end">
          <View className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <View className="relative bg-white w-full rounded-t-[40px] p-6 pt-8 animate-slide-up shadow-2xl overflow-hidden">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <Text className="block text-2xl font-bold text-gray-900 mb-6 text-center">添加公众号</Text>
            
            {/* Mode Switcher */}
            <View className="flex bg-gray-100 p-1 rounded-2xl mb-6">
              <View 
                className={`flex-1 py-3 text-center rounded-xl transition-all ${addMode === 'authorization' ? 'bg-white shadow-sm text-green-600 font-bold' : 'text-gray-500'}`}
                onClick={() => setAddMode('authorization')}
              >
                扫码授权 (推荐)
              </View>
              <View 
                className={`flex-1 py-3 text-center rounded-xl transition-all ${addMode === 'credentials' ? 'bg-white shadow-sm text-green-600 font-bold' : 'text-gray-500'}`}
                onClick={() => setAddMode('credentials')}
              >
                手动配置 Key
              </View>
            </View>

            {addMode === 'authorization' ? (
              <View className="py-6">
                <View className="bg-blue-50 rounded-2xl p-4 mb-6">
                  <Text className="block text-blue-600 font-bold text-sm mb-2">💡 什么是扫码授权？</Text>
                  <Text className="block text-blue-500/80 text-xs leading-5">
                    通过微信第三方平台授权，您无需提供 AppSecret。只需管理员扫码确认，即可安全地使用发文和素材管理功能。
                  </Text>
                </View>
                
                {error && (
                  <View className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 border border-red-100">
                    {error}
                  </View>
                )}

                <Button 
                  loading={isLoading}
                  onClick={handleStartAuth}
                  className="w-full bg-green-600 text-white rounded-2xl py-3 font-bold h-14 flex items-center justify-center border-none shadow-lg shadow-green-600/20"
                >
                  立即开始授权
                </Button>
                
                <View className="mt-4 text-center" onClick={syncAuthStatus}>
                  <Text className="text-gray-400 text-xs">授权完成后点击此处</Text>
                  <Text className="text-green-600 text-xs font-bold ml-1">同步状态</Text>
                </View>
              </View>
            ) : (
              <View className="space-y-4">
                <View className="space-y-1">
                  <Text className="text-xs font-bold text-gray-500 ml-1">公众号名称</Text>
                  <Input 
                    value={name}
                    onInput={e => setName(e.detail.value)}
                    placeholder="例如：极客发布"
                    className="bg-gray-50 rounded-xl p-4 text-sm"
                  />
                </View>
                <View className="space-y-1">
                  <Text className="text-xs font-bold text-gray-500 ml-1">AppID</Text>
                  <Input 
                    value={appId}
                    onInput={e => setAppId(e.detail.value)}
                    placeholder="wx................"
                    className="bg-gray-50 rounded-xl p-4 text-sm"
                  />
                </View>
                <View className="space-y-1">
                  <Text className="text-xs font-bold text-gray-500 ml-1">AppSecret</Text>
                  <Input 
                    password
                    value={appSecret}
                    onInput={e => setAppSecret(e.detail.value)}
                    placeholder="请输入 AppSecret"
                    className="bg-gray-50 rounded-xl p-4 text-sm"
                  />
                </View>
                
                <View className="flex justify-between items-center py-2 px-1">
                  <Text className="text-sm text-gray-600">设为默认账号</Text>
                  <Switch 
                    checked={isDefault} 
                    onChange={e => setIsDefault(e.detail.value)}
                    color="#10b981"
                  />
                </View>

                {error && (
                  <View className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-2 border border-red-100">
                    {error}
                  </View>
                )}

                <Button 
                  loading={isLoading}
                  onClick={handleAddCredentials}
                  className="w-full bg-green-600 text-white rounded-xl py-3 font-bold h-14 flex items-center justify-center border-none shadow-lg shadow-green-600/20 mt-4"
                >
                  保存配置
                </Button>
              </View>
            )}

            <View className="h-10" />
          </View>
        </View>
      )}
    </View>
  );
}