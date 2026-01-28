import React, { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Input, Button, ScrollView, Textarea } from '@tarojs/components';
import { useAuth } from '../../context/AuthContext';
import { useArticleGenerator } from '../../hooks/editor/useArticleGenerator';
import { AIProvider, ArticleBlock, BlockType } from '@shared/types';
import { convertBlocksToHtml } from '../../utils/editor/blockConverter';

export default function Index() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [blocks, setBlocks] = useState<ArticleBlock[]>([]);
  const [articleTitle, setArticleTitle] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.DEEPSEEK);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      Taro.reLaunch({ url: '/pages/welcome/index' });
    }
  }, [isLoading, isLoggedIn]);

  const {
    topic,
    setTopic,
    loading,
    handleGenerate,
  } = useArticleGenerator({
    aiProvider,
    onError: (msg) => Taro.showToast({ title: msg, icon: 'none' }),
    setArticleTitle,
    convertBlocksToHtml,
    onSuccess: (result) => {
      if (result.blocks) setBlocks(result.blocks);
    }
  });

  // 处理块内容修改
  const openEditModal = (block: ArticleBlock) => {
    setEditingBlockId(block.id);
    setTempContent(block.content);
  };

  const saveBlockEdit = () => {
    if (editingBlockId) {
      setBlocks(prev => prev.map(b => 
        b.id === editingBlockId ? { ...b, content: tempContent } : b
      ));
      setEditingBlockId(null);
      Taro.showToast({ title: '已更新', icon: 'success' });
    }
  };

  if (isLoading) {
    return (
      <View className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <View className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></View>
        <Text className="mt-2 text-gray-400 text-sm">加载中...</Text>
      </View>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <View className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* 顶部 Header */}
      <View className="p-4 pt-10 bg-white flex justify-between items-center shrink-0 border-b border-gray-100">
        <View className="flex items-center gap-2">
          <View className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Text className="text-white text-xs">AI</Text>
          </View>
          <Text className="text-lg font-black text-gray-800">创作中心</Text>
        </View>
        <View className="flex bg-gray-100 p-1 rounded-xl">
          <View 
            className={`px-4 py-1 rounded-lg text-xs ${viewMode === 'edit' ? 'bg-white shadow-sm font-bold text-green-600' : 'text-gray-400'}`}
            onClick={() => setViewMode('edit')}
          >
            编辑
          </View>
          <View 
            className={`px-4 py-1 rounded-lg text-xs ${viewMode === 'preview' ? 'bg-white shadow-sm font-bold text-green-600' : 'text-gray-400'}`}
            onClick={() => setViewMode('preview')}
          >
            预览
          </View>
        </View>
      </View>

      <ScrollView scrollY className="flex-1">
        <View className="p-4 pb-32">
          {/* 输入区 - 仅在未生成或编辑模式显示 */}
          {blocks.length === 0 && (
            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6">
              <Text className="block text-sm font-bold text-gray-800 mb-4">输入文章主题</Text>
              <Textarea 
                value={topic}
                onInput={(e) => setTopic(e.detail.value)}
                placeholder="例如：写一篇关于秋天养生的公众号文章，要求语气亲切，包含3个核心建议..."
                className="w-full bg-gray-50 p-4 rounded-2xl text-sm h-32 mb-4"
                maxlength={500}
              />
              <Button 
                onClick={handleGenerate}
                loading={loading}
                className="w-full bg-green-600 text-white font-bold rounded-2xl h-14 flex items-center justify-center border-none shadow-lg shadow-green-600/20"
              >
                开始 AI 创作
              </Button>
            </View>
          )}

          {/* 结构化编辑区 */}
          {viewMode === 'edit' && blocks.length > 0 && (
            <View className="space-y-4">
              <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                 <Text className="text-xs text-gray-400 mb-2 block">文章标题</Text>
                 <Input 
                   value={articleTitle} 
                   onInput={e => setArticleTitle(e.detail.value)}
                   className="text-lg font-bold text-gray-800"
                 />
              </View>

              {blocks.map((block, index) => (
                <View 
                  key={block.id} 
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
                  onClick={() => openEditModal(block)}
                >
                  <View className="flex justify-between items-center mb-2">
                    <View className="flex items-center gap-2">
                      <View className="px-2 py-0.5 bg-green-50 rounded text-[10px] text-green-600 font-bold">
                        {block.type.toUpperCase()}
                      </View>
                      <Text className="text-[10px] text-gray-300"># {index + 1}</Text>
                    </View>
                    <Text className="text-xs text-blue-500 font-bold">点击修改</Text>
                  </View>
                  <Text className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {block.content || '(空内容)'}
                  </Text>
                </View>
              ))}
              
              <Button 
                className="w-full bg-gray-100 text-gray-500 rounded-2xl py-3 text-sm border-none"
                onClick={() => setBlocks([])}
              >
                清空内容重新生成
              </Button>
            </View>
          )}

          {/* HTML 预览区 */}
          {viewMode === 'preview' && blocks.length > 0 && (
            <View className="bg-white rounded-2xl p-4 shadow-sm min-h-[60vh]">
              <Text className="text-center block font-bold text-xl mb-6">{articleTitle}</Text>
              <rich-text nodes={convertBlocksToHtml(blocks)} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部悬浮操作栏 */}
      {blocks.length > 0 && (
        <View className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl p-4 pb-8 border-t border-gray-100 flex gap-4 z-40">
          <Button 
            className="flex-1 bg-blue-600 text-white font-bold rounded-2xl h-14 flex items-center justify-center shadow-lg shadow-blue-600/20 border-none"
            onClick={() => Taro.showToast({ title: '已复制 HTML', icon: 'success' })}
          >
            复制 HTML
          </Button>
          <Button 
            className="flex-1 bg-green-600 text-white font-bold rounded-2xl h-14 flex items-center justify-center shadow-lg shadow-green-600/20 border-none"
            onClick={() => Taro.showToast({ title: '已同步至草稿箱', icon: 'success' })}
          >
            同步草稿
          </Button>
        </View>
      )}

      {/* 块内容快速编辑弹窗 */}
      {editingBlockId && (
        <View className="fixed inset-0 z-50 flex flex-col bg-white animate-fade-in">
          <View className="p-4 pt-12 flex justify-between items-center border-b border-gray-100">
            <Text className="font-bold text-gray-800" onClick={() => setEditingBlockId(null)}>取消</Text>
            <Text className="text-lg font-black">编辑段落</Text>
            <Text className="font-bold text-green-600" onClick={saveBlockEdit}>保存</Text>
          </View>
          <View className="flex-1 p-6">
            <Text className="text-xs text-gray-400 mb-4 block">请修改文字内容（排版样式将自动保留）：</Text>
            <Textarea 
              value={tempContent}
              onInput={e => setTempContent(e.detail.value)}
              className="w-full h-full text-gray-700 text-base leading-loose"
              maxlength={2000}
              focus
              autoHeight={false}
            />
          </View>
          <View className="p-6 pb-12 bg-gray-50 border-t border-gray-100 flex gap-4">
             <Button className="flex-1 bg-white text-blue-600 border border-blue-100 rounded-xl text-sm" onClick={() => setTempContent(prev => prev + '！')}>加感叹号</Button>
             <Button className="flex-1 bg-white text-blue-600 border border-blue-100 rounded-xl text-sm" onClick={() => setTempContent('')}>清空内容</Button>
          </View>
        </View>
      )}
    </View>
  );
}