import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Button } from '@tarojs/components';
import { useAuth } from '../../context/AuthContext';

export default function WelcomePage() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      Taro.reLaunch({ url: '/pages/index/index' });
      return;
    }
  }, [isLoggedIn]);

  const onEnter = () => {
    Taro.navigateTo({ url: '/pages/auth/index' });
  };

  const features = [
    {
      icon: '🤖',
      title: 'AI 智能写作',
      description: '深度整合多款 AI 模型，一键生成高质量文章'
    },
    {
      icon: '📝',
      title: '可视化编辑器',
      description: '所见即所得，支持多种区块，实时预览'
    },
    {
      icon: '🚀',
      title: '一键发布',
      description: '无缝对接公众号，直接发布到草稿箱'
    }
  ];

  return (
    <View className="min-h-screen bg-white flex flex-col relative pt-16">
      {/* Main Content */}
      <View className="flex-1 flex flex-col items-center p-6 relative z-10">
        <View className="w-full max-w-lg">
          {/* Header */}
          <View className="text-center mb-10">
            <View className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-3xl shadow-xl mb-6 mx-auto">
               <Text className="text-black text-4xl">📄</Text>
            </View>

            <View className="mb-2">
              <Text className="text-3xl font-black tracking-tight" style={{ color: '#1a1a1a' }}>
                WeChat{' '}
              </Text>
              <Text className="text-3xl font-black text-green-600">
                AI Publisher
              </Text>
            </View>

            <View className="h-8 mb-4 flex justify-center items-center">
              <Text style={{ color: '#666666', fontSize: '16px', fontWeight: '500' }}>
                智能微信公众号创作专家
              </Text>
            </View>

            <View className="inline-flex items-center gap-2 bg-green-50 rounded-full px-4 py-1.5 mb-6">
              <Text className="text-green-600 text-[10px] font-bold">v1.3.0 PRODUCTION</Text>
            </View>
          </View>

          {/* Features Grid */}
          <View className="mb-10">
            {features.map((feature, index) => (
              <View key={index} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col mb-4">
                <View className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                  <Text className="text-xl">{feature.icon}</Text>
                </View>
                <Text className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>{feature.title}</Text>
                <Text className="text-sm leading-relaxed" style={{ color: '#666666' }}>{feature.description}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <View className="text-center px-4">
            <Button
              onClick={onEnter}
              className="w-full py-4 bg-green-600 text-black text-lg font-bold rounded-2xl shadow-xl shadow-green-600/20 border-none h-14 flex items-center justify-center"
            >
              立即进入
            </Button>

            <Text className="block text-gray-400 text-xs mt-4">
              ✨ 开启您的 AI 创作之旅
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="relative z-10 p-6 text-center">
        <Text className="text-gray-300 text-[10px]">© 2024 AI Publisher • 技术支持</Text>
      </View>
    </View>
  );
}