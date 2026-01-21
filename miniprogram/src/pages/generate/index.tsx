import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState } from 'react'
import apiClient from '../../services/apiClient'
import { ArticleBlock } from '../../types'
import './index.scss'

export default function Generate() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<ArticleBlock[]>([])
  const [thinking, setThinking] = useState('')
  const [status, setStatus] = useState<'generating' | 'complete' | 'error'>('generating')
  const [errorMsg, setErrorMsg] = useState('')

  useLoad(() => {
    const { topic, provider, thinkingMode } = router.params
    if (topic) {
      startGeneration(decodeURIComponent(topic), provider || 'deepseek', thinkingMode === 'true')
    }
  })

  const startGeneration = async (topic: string, provider: string, thinkingMode: boolean) => {
    setStatus('generating')
    setBlocks([])
    setThinking('')
    setErrorMsg('')

    const req = {
        message: topic,
        provider: provider as any,
        thinkingMode,
        isFormattingMode: false
    }

    try {
        await apiClient.streamGeneration(req, {
            onThinking: (data) => {
                setThinking(prev => prev + data.message)
            },
            onBlock: (block) => {
                setBlocks(prev => [...prev, block])
            },
            onComplete: (data) => {
                setStatus('complete')
            },
            onError: (err) => {
                console.error('Stream error:', err)
                setStatus('error')
                setErrorMsg(err.message)
            }
        })
    } catch (e) {
        setStatus('error')
        setErrorMsg('Failed to start generation')
    }
  }

  const handlePreview = () => {
    Taro.setStorageSync('preview_blocks', blocks)
    Taro.navigateTo({ url: '/pages/preview/index' })
  }

  return (
    <View className='generate-container'>
      {thinking && (
        <ScrollView scrollY className='thinking-box'>
           <Text className='thinking-text'>{thinking}</Text>
        </ScrollView>
      )}

      <ScrollView scrollY className='content-area' scrollIntoView={`block-${blocks.length - 1}`}>
        {blocks.map((block, index) => (
            <View key={block.id || index} id={`block-${index}`} className={`block block-${block.type}`}>
                {block.type === 'header' && <Text className='block-header'>{block.content}</Text>}
                {block.type === 'paragraph' && <Text className='block-p'>{block.content}</Text>}
                {block.type === 'image' && <Text className='block-img-placeholder'>[Image: {block.content}]</Text>}
                {/* Fallback for other types */}
                {!['header', 'paragraph', 'image'].includes(block.type) && (
                    <Text className='block-other'>[{block.type}]: {block.content}</Text>
                )}
            </View>
        ))}
        {status === 'generating' && <View className='loading-cursor'>|</View>}
      </ScrollView>

      <View className='action-bar'>
        {status === 'error' && <Text className='error-text'>Error: {errorMsg}</Text>}
        {status === 'complete' && (
            <Button className='btn-preview' onClick={handlePreview}>Preview Article</Button>
        )}
      </View>
    </View>
  )
}
