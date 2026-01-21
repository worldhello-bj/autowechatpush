import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import apiClient from '../../services/apiClient'
import { ArticleBlock } from '../../types'
import './index.scss'

export default function Preview() {
  const [blocks, setBlocks] = useState<ArticleBlock[]>([])

  useLoad(() => {
    const stored = Taro.getStorageSync('preview_blocks')
    if (stored) setBlocks(stored)
  })

  const blocksToHtml = (blocks: ArticleBlock[]) => {
    return blocks.map(b => {
        if (b.type === 'header') return `<h2>${b.content}</h2>`
        if (b.type === 'paragraph') return `<p>${b.content}</p>`
        if (b.type === 'image') return `<img src="${b.content}" />`
        return `<div class="block-${b.type}">${b.content}</div>`
    }).join('')
  }

  const handleSave = async () => {
    Taro.showLoading({ title: 'Saving...' })
    try {
        const html = blocksToHtml(blocks)
        const titleBlock = blocks.find(b => b.type === 'header')
        const title = titleBlock ? titleBlock.content : 'Untitled Draft'
        
        await apiClient.draft.save({
            title,
            digest: html.replace(/<[^>]*>?/gm, '').slice(0, 100),
            content: html
        })
        Taro.hideLoading()
        Taro.showToast({ title: 'Saved!', icon: 'success' })
        setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 1500)
    } catch (e) {
        Taro.hideLoading()
        console.error(e)
        Taro.showToast({ title: 'Save failed', icon: 'none' })
    }
  }

  return (
    <View className='preview-container'>
      <ScrollView scrollY className='content-area'>
        {blocks.map((block, index) => (
            <View key={index} className={`block block-${block.type}`}>
                {block.type === 'header' && <Text className='block-header'>{block.content}</Text>}
                {block.type === 'paragraph' && <Text className='block-p'>{block.content}</Text>}
                {block.type === 'image' && <Text className='block-img-placeholder'>[Image]</Text>}
                {!['header', 'paragraph', 'image'].includes(block.type) && (
                    <Text className='block-other'>{block.content}</Text>
                )}
            </View>
        ))}
      </ScrollView>

      <View className='action-bar'>
        <Button className='btn-save' onClick={handleSave}>Save as Draft</Button>
      </View>
    </View>
  )
}
