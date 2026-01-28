import React, { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import { useAuth } from '../../context/AuthContext';

export default function EntryPage() {
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        Taro.switchTab({ url: '/pages/index/index' });
      } else {
        Taro.reLaunch({ url: '/pages/welcome/index' });
      }
    }
  }, [isLoggedIn, isLoading]);

  return (
    <View className="flex items-center justify-center h-screen bg-white">
      {/* Optional: Add a loading spinner or splash screen logo here */}
    </View>
  );
}