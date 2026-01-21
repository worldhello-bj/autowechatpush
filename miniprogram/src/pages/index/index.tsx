import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import { View, Text, Input, Button, Switch, Label, RadioGroup, Radio, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import apiClient from '../../services/apiClient'
import { ArticleDraft } from '../../types'
import './index.scss'

export default function Index() {
  const [topic, setTopic] = useState('')
  const [provider, setProvider] = useState('deepseek')
  const [thinkingMode, setThinkingMode] = useState(true)
  const [drafts, setDrafts] = useState<ArticleDraft[]>([])

  useDidShow(async () => {
    // Load drafts on show
    try {
      const res = await apiClient.draft.list()
      if (res.success && res.data) {
        setDrafts(res.data)
      }
    } catch (e) {
      console.error('Failed to load drafts', e)
    }
  })

  const handleGenerate = () => {
    if (!topic.trim()) {
      Taro.showToast({ title: 'Please enter a topic', icon: 'none' })
      return
    }

    // Navigate to generate page with params
    Taro.navigateTo({
      url: `/pages/generate/index?topic=${encodeURIComponent(topic)}&provider=${provider}&thinkingMode=${thinkingMode}`
    })
  }

  return (
    <View className='container'>
      <View className='header'>
        <Text className='title'>WeChat AI Publisher</Text>
        <Text className='subtitle'>Create amazing articles in seconds</Text>
      </View>

      <View className='form-group'>
        <Text className='label'>Topic / Prompt</Text>
        <Input 
          className='input-topic' 
          placeholder='What do you want to write about?'
          value={topic}
          onInput={(e) => setTopic(e.detail.value)}
        />
      </View>

      <View className='form-group'>
        <Text className='label'>AI Model</Text>
        <RadioGroup onChange={(e) => setProvider(e.detail.value)} className='radio-group'>
          <Label className='radio-label'>
            <Radio value='deepseek' checked={provider === 'deepseek'} color='#07c160' />
            <Text>DeepSeek</Text>
          </Label>
          <Label className='radio-label'>
            <Radio value='qwen' checked={provider === 'qwen'} color='#07c160' />
            <Text>Qwen</Text>
          </Label>
        </RadioGroup>
      </View>

      <View className='form-group switch-group'>
        <Text className='label'>Thinking Mode</Text>
        <Switch 
          checked={thinkingMode} 
          onChange={(e) => setThinkingMode(e.detail.value)} 
          color='#07c160'
        />
      </View>

      <Button className='btn-generate' onClick={handleGenerate}>
        Start Writing
      </Button>

      <View className='recent-section'>
        <Text className='section-title'>Recent Drafts</Text>
        {drafts.length > 0 ? (
          <ScrollView scrollY className='drafts-list'>
            {drafts.map(draft => (
              <View key={draft.id} className='draft-item' onClick={() => {
                // TODO: Load draft to preview
                // Need to parse content back to blocks or just show html in preview
                // For MVP, just showing toast
                Taro.showToast({ title: 'Draft selection not implemented', icon: 'none' })
              }}>
                <Text className='draft-title'>{draft.title}</Text>
                <Text className='draft-date'>{new Date(draft.createdAt).toLocaleDateString()}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className='empty-state'>
             <Text>No drafts yet</Text>
          </View>
        )}
      </View>
    </View>
  )
}
