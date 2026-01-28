import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import { draftApi, ArticleDraft } from '../../services/apiClient';

export default function Drafts() {
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const res = await draftApi.list();
      if (res.success && res.data) {
        setDrafts(res.data);
      }
    } catch (e) {
      Taro.showToast({ title: '加载草稿失败', icon: 'none' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: any, id: string) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这篇草稿吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await draftApi.delete(id);
            Taro.showToast({ title: '已删除', icon: 'success' });
            fetchDrafts();
          } catch (err) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  };

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      <View className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900">我的草稿</Text>
        <Text className="text-xs text-gray-400">共 {drafts.length} 篇</Text>
      </View>

      <ScrollView scrollY className="flex-1 p-4">
        {isLoading ? (
          <View className="flex flex-col items-center justify-center pt-20">
            <View className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
            <Text className="text-gray-400 text-sm">加载中...</Text>
          </View>
        ) : drafts.length === 0 ? (
          <View className="flex flex-col items-center justify-center pt-20">
            <Text className="text-6xl mb-4">Empty 📭</Text>
            <Text className="text-gray-400 text-sm">还没有保存任何草稿</Text>
            <Button 
              onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
              className="mt-6 bg-green-600 text-white rounded-full px-8 border-none text-sm h-10 flex items-center"
            >
              去创作
            </Button>
          </View>
        ) : (
          <View className="space-y-4 pb-10">
            {drafts.map((draft) => (
              <View 
                key={draft.id} 
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 animate-fade-in"
                onClick={() => Taro.showToast({ title: '加载草稿功能开发中', icon: 'none' })}
              >
                <View className="flex justify-between items-start mb-2">
                  <Text className="text-lg font-bold text-gray-800 flex-1 mr-4 line-clamp-1">
                    {draft.title || '未命名文章'}
                  </Text>
                  <View 
                    className="p-1"
                    onClick={(e) => handleDelete(e, draft.id)}
                  >
                    <Text className="text-red-400">🗑️</Text>
                  </View>
                </View>
                
                <Text className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {draft.digest || '暂无摘要描述...'}
                </Text>
                
                <View className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <View className="flex items-center gap-2">
                    <View className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">👤</View>
                    <Text className="text-[10px] text-gray-400">来自 AI 生成</Text>
                  </View>
                  <Text className="text-[10px] text-gray-300">
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}