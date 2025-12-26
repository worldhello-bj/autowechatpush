
import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { aiApi } from '../services/apiClient';
import analytics from '../services/analytics';
import { 
  GenerationResult
} from '../services/geminiService';
import { 
  generateArticleStructureDeepSeek,
  generateTitleSuggestionsDeepSeek,
  generateSummaryDeepSeek,
  expandContentDeepSeek,
  polishContentDeepSeek,
  extractKeywordsDeepSeek,
  translateContentDeepSeek,
  suggestStylesDeepSeek,
  generateHookDeepSeek,
  generateCTADeepSeek,
  rewriteContentDeepSeek,
  StyleSuggestion
} from '../services/deepSeekService';
import { 
  generateArticleStructureQwen, 
  analyzeImageQwen, 
  generateSpeechQwen,
  generateTitleSuggestionsQwen,
  generateSummaryQwen,
  expandContentQwen,
  polishContentQwen,
  extractKeywordsQwen,
  translateContentQwen,
  suggestStylesQwen,
  generateHookQwen,
  generateCTAQwen,
  rewriteContentQwen
} from '../services/qwenService';
import {
  generateWithDualAI,
  loadMemory,
  saveMemory,
  AIMemory
} from '../services/dualAIService';
import HtmlEditor, { HtmlEditorRef } from './HtmlEditor';
import MaterialLibrary from './MaterialLibrary';
import AIToolsPanel, { AISettings, DEFAULT_AI_SETTINGS } from './AIToolsPanel';
import { ArticleBlock, GroundingSource, WeChatCredentials, BlockType, AIProvider } from '../types';
import { getAccessToken, saveDraft, uploadImage } from '../services/wechatService';
import { 
  allDesignTemplates, 
  getCategories, 
  getTemplatesByCategory, 
  DesignTemplate 
} from '../services/designTemplates';

interface EditorProps {
  onError: (msg: string) => void;
}

// --- Helper: Base64 to Blob ---
const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// --- Helper: Create Default Cover Image (Canvas) ---
const createDefaultCoverBlob = (titleText: string = "AI Article"): Promise<Blob> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        // WeChat cover ratio is roughly 2.35:1 (900x383 is a standard safe size)
        canvas.width = 900;
        canvas.height = 383; 
        const ctx = canvas.getContext('2d');
        if (ctx) {
             // 1. Create a nice gradient background (Emerald Green theme)
             const gradient = ctx.createLinearGradient(0, 0, 900, 383);
             gradient.addColorStop(0, '#10b981'); // Emerald 500
             gradient.addColorStop(1, '#047857'); // Emerald 700
             ctx.fillStyle = gradient;
             ctx.fillRect(0, 0, canvas.width, canvas.height);

             // 2. Add decorative pattern/border
             ctx.lineWidth = 8;
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
             ctx.strokeRect(20, 20, 860, 343);

             // 3. Add Article Title
             ctx.fillStyle = '#ffffff';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             // Dynamic font sizing based on title length
             const fontSize = titleText.length > 15 ? 48 : 64;
             ctx.font = `bold ${fontSize}px "Noto Sans SC", sans-serif`;
             
             // Simple truncation if text is extremely long
             const displayTitle = titleText.length > 25 ? titleText.substring(0, 25) + '...' : titleText;
             
             // Shadow for text
             ctx.shadowColor = "rgba(0,0,0,0.3)";
             ctx.shadowBlur = 10;
             ctx.shadowOffsetX = 2;
             ctx.shadowOffsetY = 2;

             ctx.fillText(displayTitle, 450, 160);
             
             // 4. Add App Name / Footer text
             ctx.font = '30px sans-serif';
             ctx.shadowBlur = 0; // Reset shadow
             ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
             ctx.fillText('WeChat AI Publisher', 450, 240);
        }
        
        // Export as JPEG (WeChat requires JPG/PNG)
        canvas.toBlob((blob) => {
             resolve(blob || new Blob());
        }, 'image/jpeg', 0.9);
    });
}

// --- Helper: HTML Escape for XSS Prevention ---
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// --- Helper: Convert plain text to safe HTML ---
const textToSafeHtml = (text: string): string => {
  const escaped = escapeHtml(text);
  return `<p style="font-size: 16px; line-height: 1.8; color: #444;">${escaped.replace(/\n\n/g, '</p><p style="font-size: 16px; line-height: 1.8; color: #444; margin-top: 16px;">').replace(/\n/g, '<br/>')}</p>`;
};

// --- Helper: Color Mapping ---
const getStyleColors = (style?: string) => {
  switch(style) {
      case 'red': return { main: '#fa5151', bg: '#fff0f0', border: '#ffc2c2' };
      case 'blue': return { main: '#3498db', bg: '#f0f8ff', border: '#cce6ff' };
      case 'purple': return { main: '#9b59b6', bg: '#fbf2ff', border: '#e8ccec' };
      case 'orange': return { main: '#f39c12', bg: '#fef5e6', border: '#fdebd0' };
      case 'gold': return { main: '#d4af37', bg: '#fcf8e3', border: '#f7ecb5' };
      case 'warning': return { main: '#e6a23c', bg: '#fdf6ec', border: '#faecd8' };
      case 'quote': return { main: '#888888', bg: '#f7f7f7', border: '#cccccc' };
      case 'green': return { main: '#07c160', bg: '#f6fffa', border: '#e0f2e9' };
      case 'pink': return { main: '#eb4d9c', bg: '#fff0f7', border: '#ffc2e2' };
      case 'cyan': return { main: '#00bcd4', bg: '#e0f7fa', border: '#b2ebf2' };
      case 'gradient': return { main: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', bg: 'linear-gradient(135deg, #f5f7fa 0%, #f8f4ff 100%)', border: '#d4c4e8' };
      default: return { main: '#07c160', bg: '#f6fffa', border: '#e0f2e9' }; // Default Green
  }
}

// --- Helper: Get Callout Icon (using styled symbols for better design) ---
const getCalloutIcon = (icon?: string) => {
  switch(icon) {
      case 'info': return { symbol: 'i', color: '#3498db', bg: '#f0f8ff' };
      case 'warning': return { symbol: '!', color: '#f39c12', bg: '#fef5e6' };
      case 'success': return { symbol: '✓', color: '#07c160', bg: '#f6fffa' };
      case 'error': return { symbol: '×', color: '#fa5151', bg: '#fff0f0' };
      case 'tip': return { symbol: '★', color: '#d4af37', bg: '#fcf8e3' };
      case 'note': return { symbol: '¶', color: '#9b59b6', bg: '#fbf2ff' };
      default: return { symbol: 'i', color: '#3498db', bg: '#f0f8ff' };
  }
}

// Default header level when not specified
const DEFAULT_HEADER_LEVEL = 2;

// --- Helper: Convert Blocks to WeChat-compatible HTML ---
const convertBlocksToHtml = (blocks: ArticleBlock[]): string => {
  if (!blocks || blocks.length === 0) return '';
  
  return blocks.map(block => {
    const colors = getStyleColors(block.style);
    const isGradient = block.style === 'gradient';
    const alignment = block.alignment || 'left';
    const textAlign = `text-align: ${alignment};`;

    switch (block.type) {
      case BlockType.HEADER:
        const headerLevel = Number(block.level) || DEFAULT_HEADER_LEVEL;
        const headerFontSize = headerLevel === 1 ? '22px' : headerLevel === 2 ? '18px' : '16px';
        const headerHeight = headerLevel === 1 ? '24px' : headerLevel === 2 ? '18px' : '14px';
        const headerBarWidth = headerLevel === 1 ? '5px' : headerLevel === 2 ? '4px' : '3px';
        return `
          <section style="margin: 20px 0 10px 0; ${textAlign}">
            <section style="display: inline-flex; align-items: center;">
               <section style="width: ${headerBarWidth}; height: ${headerHeight}; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; border-radius: 2px; margin-right: 8px;"></section>
               <section style="font-size: ${headerFontSize}; font-weight: bold; color: #333;">${block.content}</section>
            </section>
          </section>
        `;
      case BlockType.PARAGRAPH:
        return `
          <section style="margin-bottom: 16px; font-size: 16px; line-height: 1.8; color: #444; ${textAlign} letter-spacing: 0.5px;">
            ${block.content}
          </section>
        `;
      case BlockType.QUOTE:
        return `
          <section style="margin: 20px 0; padding: 15px; ${isGradient ? `background: ${colors.bg}` : `background-color: ${colors.bg}`}; border-left: 4px solid ${isGradient ? '#667eea' : colors.main}; border-radius: 0 4px 4px 0; ${textAlign}">
            <section style="font-size: 15px; color: #666; font-style: italic; line-height: 1.6;">${block.content}</section>
          </section>
        `;
      case BlockType.CARD:
        return `
          <section style="margin: 20px 0; padding: 20px; border: 1px solid ${colors.border}; ${isGradient ? `background: ${colors.bg}` : `background-color: ${colors.bg}`}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0, 0.05);">
            ${block.title ? `<section style="font-size: 16px; font-weight: bold; ${isGradient ? `background: ${colors.main}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;` : `color: ${colors.main};`} margin-bottom: 8px;">${block.title}</section>` : ''}
            <section style="font-size: 14px; color: #555; line-height: 1.6;">${block.content}</section>
          </section>
        `;
      case BlockType.LIST:
        const listItems = block.items?.map(item => `
          <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <section style="width: 6px; height: 6px; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; border-radius: 50%; margin-top: 9px; margin-right: 10px; flex-shrink: 0;"></section>
            <section style="font-size: 16px; color: #444; line-height: 1.6;">${item}</section>
          </section>
        `).join('') || '';
        return `<section style="margin: 15px 0;">${listItems}</section>`;
      case BlockType.NUMBERED_LIST:
        const numberedItems = block.items?.map((item, idx) => `
          <section style="display: flex; align-items: flex-start; margin-bottom: 10px;">
            <section style="width: 24px; height: 24px; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
              <section style="color: #fff; font-size: 12px; font-weight: bold;">${idx + 1}</section>
            </section>
            <section style="font-size: 16px; color: #444; line-height: 1.6; padding-top: 2px;">${item}</section>
          </section>
        `).join('') || '';
        return `<section style="margin: 15px 0;">${numberedItems}</section>`;
      case BlockType.IMAGE:
        const isUrl = block.content.startsWith('http') || block.content.startsWith('data:');
        
        if (isUrl) {
           return `
            <section style="margin: 20px 0; text-align: center;">
              <img src="${block.content}" style="width: 100%; height: auto; border-radius: 6px; display: block;" />
              ${block.title ? `<section style="font-size: 12px; color: #888; margin-top: 8px;">${block.title}</section>` : ''}
            </section>
          `;
        } else {
           return `
            <section style="margin: 20px 0; padding: 30px 20px; border: 2px dashed #ddd; background-color: #fafafa; border-radius: 8px; text-align: center; color: #999;">
               <section style="width: 48px; height: 48px; margin: 0 auto 12px; border: 2px solid #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                 <section style="width: 20px; height: 16px; border: 2px solid #999; border-radius: 2px; position: relative;">
                   <section style="width: 6px; height: 6px; background: #999; border-radius: 50%; position: absolute; top: 2px; right: 2px;"></section>
                 </section>
               </section>
               <section style="font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #666;">Suggested Image</section>
               <section style="font-size: 13px;">"${block.content}"</section>
               ${block.title ? `<section style="font-size: 12px; color: #aaa; margin-top: 5px;">Caption: ${block.title}</section>` : ''}
            </section>
           `;
        }
      case BlockType.DIVIDER:
        return `
          <section style="margin: 25px 0; text-align: center;">
            <section style="display: inline-block; width: 60%; height: 1px; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; opacity: 0.5;"></section>
          </section>
        `;
      case BlockType.CODE:
        const language = block.language || 'code';
        return `
          <section style="margin: 20px 0; border-radius: 8px; overflow: hidden; background-color: #1e1e1e;">
            <section style="padding: 8px 12px; background-color: #2d2d2d; color: #888; font-size: 12px; font-family: monospace;">${language}</section>
            <section style="padding: 15px; color: #d4d4d4; font-size: 14px; line-height: 1.5; font-family: 'Consolas', 'Monaco', monospace; white-space: pre-wrap; overflow-x: auto;">${block.content}</section>
          </section>
        `;
      case BlockType.CALLOUT:
        const calloutConfig = getCalloutIcon(block.icon);
        return `
          <section style="margin: 20px 0; padding: 16px 20px; background-color: ${calloutConfig.bg}; border-left: 4px solid ${calloutConfig.color}; border-radius: 0 8px 8px 0;">
            <section style="display: flex; align-items: flex-start;">
              <section style="width: 24px; height: 24px; border-radius: 50%; background-color: ${calloutConfig.color}; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">${calloutConfig.symbol}</section>
              <section>
                ${block.title ? `<section style="font-size: 15px; font-weight: bold; color: ${calloutConfig.color}; margin-bottom: 6px;">${block.title}</section>` : ''}
                <section style="font-size: 14px; color: #555; line-height: 1.6;">${block.content}</section>
              </section>
            </section>
          </section>
        `;
      case BlockType.HIGHLIGHT:
        return `
          <section style="margin: 20px 0; padding: 20px 24px; ${isGradient ? `background: ${colors.bg}` : `background-color: ${colors.bg}`}; border-radius: 8px; ${textAlign} position: relative;">
            <section style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; border-radius: 8px 8px 0 0;"></section>
            <section style="font-size: 16px; color: #333; line-height: 1.8; font-weight: 500;">${block.content}</section>
          </section>
        `;
      case BlockType.TABLE:
        const tableHeaders = block.headers?.map(h => `
          <section style="flex: 1; padding: 10px 12px; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; color: #fff; font-weight: bold; font-size: 14px; text-align: center;">${h}</section>
        `).join('') || '';
        const tableRows = block.rows?.map((row, rowIdx) => `
          <section style="display: flex; border-bottom: 1px solid #eee; ${rowIdx % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #fff;'}">
            ${row.map(cell => `
              <section style="flex: 1; padding: 10px 12px; font-size: 14px; color: #555; text-align: center;">${cell}</section>
            `).join('')}
          </section>
        `).join('') || '';
        return `
          <section style="margin: 20px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${colors.border};">
            ${block.title ? `<section style="padding: 12px 16px; ${isGradient ? `background: ${colors.bg}` : `background-color: ${colors.bg}`}; font-weight: bold; font-size: 15px; color: #333; border-bottom: 1px solid ${colors.border};">${block.title}</section>` : ''}
            ${block.headers && block.headers.length > 0 ? `<section style="display: flex;">${tableHeaders}</section>` : ''}
            ${tableRows}
          </section>
        `;
      
      // --- Special Block Types ---
      case BlockType.QRCODE:
        return `
          <section style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%); border-radius: 16px; border: 2px solid #667eea; text-align: center;">
            <section style="width: 120px; height: 120px; margin: 0 auto 16px; background: #fff; border: 2px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <section style="font-size: 48px;">📱</section>
            </section>
            <section style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 8px;">${block.title || '扫码关注'}</section>
            <section style="font-size: 14px; color: #888;">${block.content}</section>
          </section>
        `;
      
      case BlockType.FAQ:
        const faqItems = (block.items || []).map((question, idx) => {
          const answer = block.answers?.[idx] || block.content;
          const faqColor = idx % 2 === 0 ? '#667eea' : '#9b59b6';
          return `
            <section style="margin-bottom: 16px; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
              <section style="padding: 16px 20px; background: ${faqColor}; color: #fff; font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                <section>Q</section>
                <section>${question}</section>
              </section>
              <section style="padding: 16px 20px; font-size: 14px; color: #555; line-height: 1.7; display: flex; align-items: flex-start; gap: 8px;">
                <section style="color: ${faqColor}; font-weight: bold;">A</section>
                <section>${answer}</section>
              </section>
            </section>
          `;
        }).join('');
        return `<section style="margin: 24px 0;">${faqItems}</section>`;
      
      case BlockType.COUNTDOWN:
        const cd = block.countdown || { days: '00', hours: '00', minutes: '00', seconds: '00' };
        return `
          <section style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; text-align: center; color: #fff;">
            <section style="font-size: 14px; color: #feca57; margin-bottom: 16px; letter-spacing: 2px;">⏰ ${block.title || '距离活动开始还有'}</section>
            <section style="display: flex; justify-content: center; gap: 12px;">
              <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <section style="font-size: 28px; font-weight: bold;">${cd.days || '00'}</section>
                <section style="font-size: 12px; opacity: 0.8; margin-top: 4px;">天</section>
              </section>
              <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <section style="font-size: 28px; font-weight: bold;">${cd.hours || '00'}</section>
                <section style="font-size: 12px; opacity: 0.8; margin-top: 4px;">时</section>
              </section>
              <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <section style="font-size: 28px; font-weight: bold;">${cd.minutes || '00'}</section>
                <section style="font-size: 12px; opacity: 0.8; margin-top: 4px;">分</section>
              </section>
              <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <section style="font-size: 28px; font-weight: bold;">${cd.seconds || '00'}</section>
                <section style="font-size: 12px; opacity: 0.8; margin-top: 4px;">秒</section>
              </section>
            </section>
          </section>
        `;
      
      case BlockType.PROGRESS:
        const pct = block.percentage || 50;
        return `
          <section style="margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 12px;">
            <section style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <section style="font-size: 14px; font-weight: bold; color: #333;">${block.title || '进度'}</section>
              <section style="font-size: 14px; color: ${colors.main}; font-weight: bold;">${pct}%</section>
            </section>
            <section style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
              <section style="width: ${pct}%; height: 100%; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; border-radius: 4px;"></section>
            </section>
            ${block.content ? `<section style="font-size: 13px; color: #666; margin-top: 8px;">${block.content}</section>` : ''}
          </section>
        `;
      
      case BlockType.GIFT:
        return `
          <section style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); border-radius: 16px; text-align: center; color: #fff; position: relative; overflow: hidden;">
            <section style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%;"></section>
            <section style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></section>
            <section style="font-size: 28px; margin-bottom: 8px;">🎁</section>
            <section style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${block.title || '限时福利'}</section>
            <section style="font-size: 14px; opacity: 0.95; margin-bottom: 16px;">${block.content}</section>
            <section style="display: inline-block; padding: 10px 24px; background: #fff; color: #ff6b6b; font-size: 14px; font-weight: bold; border-radius: 20px;">立即领取</section>
          </section>
        `;
      
      case BlockType.CONTACT:
        const contactItems = (block.items || ['邮箱', '电话', '地址']).map((label, idx) => {
          const value = block.values?.[idx] || block.content;
          const icons = ['📧', '📱', '📍', '🌐', '💬'];
          return `
            <section style="flex: 1; min-width: 140px; padding: 12px; background: #fff; border-radius: 8px; text-align: center;">
              <section style="font-size: 20px; margin-bottom: 6px;">${icons[idx] || '📌'}</section>
              <section style="font-size: 12px; color: #888; margin-bottom: 4px;">${label}</section>
              <section style="font-size: 13px; color: #333;">${value}</section>
            </section>
          `;
        }).join('');
        return `
          <section style="margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 12px;">
            <section style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 16px; text-align: center;">📞 ${block.title || '联系我们'}</section>
            <section style="display: flex; gap: 12px; flex-wrap: wrap;">${contactItems}</section>
          </section>
        `;
      
      case BlockType.STATS:
        const statItems = (block.values || ['1000+', '50%', '99%']).map((value, idx) => {
          const label = block.labels?.[idx] || `指标${idx + 1}`;
          const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
          ];
          return `
            <section style="flex: 1; padding: 20px; background: ${gradients[idx % gradients.length]}; border-radius: 12px; text-align: center; color: #fff;">
              <section style="font-size: 32px; font-weight: bold;">${value}</section>
              <section style="font-size: 12px; opacity: 0.9; margin-top: 4px;">${label}</section>
            </section>
          `;
        }).join('');
        return `<section style="margin: 20px 0; display: flex; gap: 16px;">${statItems}</section>`;
      
      case BlockType.TESTIMONIAL:
        return `
          <section style="margin: 20px 0; padding: 24px; background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%); border-radius: 16px; border: 1px solid #e8e8ff;">
            <section style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <section style="width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">👤</section>
              <section>
                <section style="font-size: 15px; font-weight: bold; color: #333;">${block.author || '用户名'}</section>
                <section style="font-size: 12px; color: #888;">${block.role || '职位/身份'}</section>
              </section>
              <section style="margin-left: auto; color: #f39c12; font-size: 14px;">★★★★★</section>
            </section>
            <section style="font-size: 14px; color: #555; line-height: 1.8; font-style: italic;">"${block.content}"</section>
          </section>
        `;
      
      case BlockType.STEPS:
        const stepItems = (block.items || []).map((step, idx) => {
          const stepColors = ['#667eea', '#9b59b6', '#764ba2'];
          const stepBgs = ['#f8f9ff', '#faf5ff', '#f5f0ff'];
          return `
            <section style="margin-bottom: 24px; position: relative;">
              <section style="position: absolute; left: -24px; width: 24px; height: 24px; background: ${stepColors[idx % stepColors.length]}; border-radius: 50%; color: #fff; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);">${idx + 1}</section>
              <section style="background: ${stepBgs[idx % stepBgs.length]}; padding: 16px; border-radius: 8px; margin-left: 12px;">
                <section style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;">${block.labels?.[idx] || `步骤 ${idx + 1}`}</section>
                <section style="font-size: 13px; color: #666; line-height: 1.6;">${step}</section>
              </section>
            </section>
          `;
        }).join('');
        return `
          <section style="margin: 20px 0; padding-left: 30px; position: relative;">
            <section style="position: absolute; left: 11px; top: 20px; bottom: 20px; width: 2px; background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);"></section>
            ${stepItems}
          </section>
        `;
      
      case BlockType.SVG:
        // SVG block for decorative graphics, icons, dividers, badges, etc.
        // content should be SVG code or a description for placeholder
        const svgContent = block.content.trim();
        // More robust SVG detection with case-insensitive check
        const isSvgCode = /^\s*(<\?xml|<svg)/i.test(svgContent);
        if (isSvgCode) {
          // Sanitize SVG using DOMPurify for security
          const sanitizedSvg = DOMPurify.sanitize(svgContent, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ['use'],
            ADD_ATTR: ['xlink:href']
          });
          // Render sanitized SVG code
          return `
            <section style="margin: 20px 0; text-align: ${alignment};">
              <span style="display: inline-block; vertical-align: middle;">
                ${sanitizedSvg}
              </span>
              ${block.title ? `<section style="font-size: 12px; color: #888; margin-top: 8px;">${block.title}</section>` : ''}
            </section>
          `;
        } else {
          // Placeholder for SVG description
          return `
            <section style="margin: 20px 0; padding: 24px; border: 2px dashed ${colors.main}; background-color: ${colors.bg}; border-radius: 8px; text-align: center; color: #666;">
              <section style="font-size: 24px; margin-bottom: 8px;">🎨</section>
              <section style="font-weight: 600; font-size: 14px; margin-bottom: 5px; color: ${colors.main};">建议SVG图形</section>
              <section style="font-size: 13px; color: #888;">"${svgContent}"</section>
              ${block.title ? `<section style="font-size: 12px; color: #aaa; margin-top: 5px;">${block.title}</section>` : ''}
            </section>
          `;
        }

      default:
        return '';
    }
  }).join('');
};

const DRAFT_KEY = 'wechat_editor_draft';
const PROVIDER_KEY = 'ai_provider';

const Editor: React.FC<EditorProps> = ({ onError }) => {
  // --- State ---
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [isFormattingMode, setIsFormattingMode] = useState(false); // NEW Toggle
  const [useDualAI, setUseDualAI] = useState(false); // Dual AI Mode Toggle
  const [imageContext, setImageContext] = useState<string>('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  
  // WeChat Config (managed by admin via backend)
  const [wechatCreds, setWechatCreds] = useState<WeChatCredentials>({ appId: '', appSecret: '' });
  const [showGuide, setShowGuide] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // AI Provider Config (managed by admin via backend)
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.DEEPSEEK);
  const [deepSeekApiKey, setDeepSeekApiKey] = useState('');
  const [dashScopeApiKey, setDashScopeApiKey] = useState('');

  // Dual AI Memory State
  const [aiMemory, setAiMemory] = useState<AIMemory>(() => loadMemory());
  const [designNotes, setDesignNotes] = useState<string>('');

  // Article Content
  const [articleTitle, setArticleTitle] = useState('New Article');
  const [articleDigest, setArticleDigest] = useState('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  
  // HTML Content State
  const [htmlContent, setHtmlContent] = useState<string>('<p style="color:#888; text-align:center;">Generated content will appear here...</p>');
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // HTML Editor Ref (for inserting at cursor)
  const htmlEditorRef = useRef<HtmlEditorRef>(null);
  const stitchFileInputRef = useRef<HTMLInputElement>(null);
  const [stitchLoading, setStitchLoading] = useState(false);

  // Draft State
  const [foundDraft, setFoundDraft] = useState(false);

  // AI Tools Panel State
  const [showAITools, setShowAITools] = useState(false);
  const [aiToolLoading, setAiToolLoading] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([]);
  const [generatedHook, setGeneratedHook] = useState('');
  const [generatedCTA, setGeneratedCTA] = useState('');

  // Design Templates Panel State
  const [showDesignTemplates, setShowDesignTemplates] = useState(false);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<DesignTemplate['category']>('header');
  const templateCategories = getCategories();
  
  // Template Preview Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DesignTemplate | null>(null);

  // Material Library Panel State
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false);

  // AI Settings State (with sliders)
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!topic.trim()) {
        onError(isFormattingMode ? "Please enter the text you want to format." : "Please enter a topic.");
        return;
    }
    setLoading(true);
    
    try {
      let result: GenerationResult;
      
      // Check if Dual AI mode is enabled (requires Qwen or DeepSeek)
      if (useDualAI && !isFormattingMode) {
        // Dual AI Mode: Content AI + Design AI working in parallel
        const contentProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
        const designProvider = aiProvider === AIProvider.QWEN ? 'qwen' : 'deepseek';
        
        const contentKey = aiProvider === AIProvider.QWEN ? dashScopeApiKey : deepSeekApiKey;
        const designKey = aiProvider === AIProvider.QWEN ? dashScopeApiKey : deepSeekApiKey;
        
        // Dual AI mode requires API keys to be configured
        // The service will validate and throw a helpful error if keys are missing
        
        console.log('[Editor] Using Dual AI Mode - Content AI + Design AI');
        
        const dualResult = await generateWithDualAI(
          topic,
          {
            contentProvider,
            designProvider,
            contentApiKey: contentKey,
            designApiKey: designKey
          },
          aiMemory,
          imageContext
        );
        
        result = dualResult.result;
        
        // Update memory with the new interaction
        if (dualResult.memoryUpdate) {
          const newMemory = { ...aiMemory, ...dualResult.memoryUpdate };
          setAiMemory(newMemory);
          saveMemory(newMemory);
        }
        
        // Store design notes for user reference
        if (dualResult.designNotes) {
          setDesignNotes(dualResult.designNotes);
          console.log('[Editor] Design Notes:', dualResult.designNotes);
        }
        
      } else {
        // Use backend API with automatic fallback support
        console.log('[Editor] Using Backend AI API with provider:', aiProvider);
        
        const response = await aiApi.generate({
          message: topic,
          provider: aiProvider,
          useSearch: useSearch,
          imageContext: imageContext || undefined,
          isFormattingMode: isFormattingMode,
        });
        
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to generate article');
        }
        
        // Convert API response to GenerationResult type
        result = {
          title: response.data.title,
          digest: response.data.digest,
          blocks: response.data.blocks as any as ArticleBlock[],
          sources: response.data.sources,
        };
        console.log('[Editor] Backend API generated article successfully');
      }

      setArticleTitle(result.title);
      setArticleDigest(result.digest);
      setSources(result.sources);
      
      const generatedHtml = (result as any).html ?? convertBlocksToHtml(result.blocks);
      setHtmlContent(generatedHtml);

      // Track article generation event
      analytics.track('article_generate', {
        provider: aiProvider,
        useDualAI,
        useSearch,
        hasImage: !!imageContext,
        topicLength: topic.length,
      });

    } catch (e: any) {
      console.error('[Editor] Article generation error:', e);
      onError(e.message || "Failed to generate article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Base64 Preview always works
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const mimeType = file.type;
      setUploadedImagePreview(reader.result as string);

      // Analyze if Qwen
      if (aiProvider === AIProvider.QWEN) {
        setAnalyzingImage(true);
        try {
          let analysis = "";
          // Allow empty key - backend will use server-configured key as fallback
          analysis = await analyzeImageQwen(base64String, mimeType, dashScopeApiKey || '');
          setImageContext(analysis);
        } catch (err: any) {
          onError("Failed to analyze image: " + err.message);
        } finally {
          setAnalyzingImage(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStitchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readers = files.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.readAsDataURL(file);
    }));

    Promise.all(readers)
      .then(async (imgs) => {
        const validImgs = imgs.filter(Boolean);
        if (!validImgs.length) return;
        setStitchLoading(true);
        const resp = await fetch('/api/v1/utility/stitch-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: validImgs })
        });
        if (!resp.ok) throw new Error('Stitch failed');
        const data = await resp.json();
        const stitchedHtml = data.data?.html || data.html;
        if (!stitchedHtml) return;

        if (htmlEditorRef.current) {
          htmlEditorRef.current.insertHtmlAtCursor(stitchedHtml);
        } else {
          setHtmlContent((prev) => (prev.trim() ? `${prev}\n${stitchedHtml}` : stitchedHtml));
        }
      })
      .catch((err) => {
        console.error(err);
        onError('拼接服务调用失败，请重试');
      })
      .finally(() => {
        setStitchLoading(false);
        if (e.target) e.target.value = '';
      });
  };

  const handleTTS = async () => {
    if (aiProvider === AIProvider.DEEPSEEK) {
        onError("TTS is not supported with DeepSeek.");
        return;
    }

    if (isPlaying) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsPlaying(false);
      return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textToRead = tempDiv.textContent || tempDiv.innerText || "";
    
    if (textToRead.length < 5) {
        onError("Content too short to read.");
        return;
    }

    try {
      setIsPlaying(true);
      
      let audioBufferData: ArrayBuffer;
      // Allow empty key - backend will use server-configured key as fallback
      audioBufferData = await generateSpeechQwen(textToRead.slice(0, 500), dashScopeApiKey || '');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const audioBuffer = await ctx.decodeAudioData(audioBufferData);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
      audioSourceRef.current = source;
    } catch (err: any) {
      onError("Failed to generate speech: " + err.message);
      setIsPlaying(false);
    }
  };
  
  const handlePublish = async () => {
     if (!wechatCreds.appId || !wechatCreds.appSecret) {
         onError("WeChat API 未配置。请联系管理员在后台配置 AppID 和 AppSecret。");
         return;
     }
     
     setIsPublishing(true);
     try {
         const token = await getAccessToken(wechatCreds);
         
         let thumb_media_id = ""; 
         
         if (uploadedImagePreview) {
             // Case 1: User uploaded an image explicitly
             const imageBlob = dataURLtoBlob(uploadedImagePreview);
             thumb_media_id = await uploadImage(token, imageBlob);
         } else {
             // Case 2: No image, generate a default one via Canvas
             console.log("No user cover image. Generating default cover...");
             try {
                // Generate a Blob from canvas with the current article title
                const defaultBlob = await createDefaultCoverBlob(articleTitle);
                // Upload this generated image to WeChat to get a valid ID
                thumb_media_id = await uploadImage(token, defaultBlob);
                console.log("Generated cover uploaded successfully. Media ID:", thumb_media_id);
             } catch (err: any) {
                console.error("Failed to upload generated cover:", err);
                throw new Error("Failed to generate and upload default cover image. Please try uploading an image manually.");
             }
         }

         const payload = {
             articles: [{
                 title: articleTitle,
                 author: "AI Assistant",
                 digest: articleDigest,
                 content: htmlContent,
                 content_source_url: "",
                 thumb_media_id: thumb_media_id,
                 show_cover_pic: 1,
                 need_open_comment: 1,
                 only_fans_can_comment: 0
             }]
         };
         
         const result = await saveDraft(token, payload);
         alert(`Success! Article saved to WeChat Draft Box.\nMedia ID: ${result.media_id}`);

         // Track publish event
         analytics.track('article_publish', {
           titleLength: articleTitle.length,
           contentLength: htmlContent.length,
           hasCoverImage: !!uploadedImagePreview,
         });

     } catch (e: any) {
         onError(e.message || "Failed to publish to WeChat");
     } finally {
         setIsPublishing(false);
     }
  };

  // --- Draft Logic ---
  
  const saveLocalDraft = () => {
    const draft = {
      title: articleTitle,
      digest: articleDigest,
      content: htmlContent,
      topic: topic,
      timestamp: Date.now()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    alert("Draft saved locally!");
    
    // Track draft save event
    analytics.track('article_save_draft', {
      titleLength: articleTitle.length,
      contentLength: htmlContent.length,
    });
  };

  const loadLocalDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    
    setArticleTitle(draft.title || 'Untitled');
    setArticleDigest(draft.digest || '');
    setHtmlContent(draft.content || '');
    setTopic(draft.topic || '');
    setFoundDraft(false);
  };

  // --- AI Tools Handlers ---
  
  const getPlainTextContent = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const handleGenerateTitles = async () => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let titles: string[] = [];
      if (aiProvider === AIProvider.DEEPSEEK) {
        titles = await generateTitleSuggestionsDeepSeek(content, 5, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        titles = await generateTitleSuggestionsQwen(content, 5, dashScopeApiKey);
      }
      setTitleSuggestions(titles);
    } catch (e: any) {
      onError(e.message || "Failed to generate titles");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let summary: string = "";
      if (aiProvider === AIProvider.DEEPSEEK) {
        summary = await generateSummaryDeepSeek(content, 120, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        summary = await generateSummaryQwen(content, 120, dashScopeApiKey);
      }
      setArticleDigest(summary);
    } catch (e: any) {
      onError(e.message || "Failed to generate summary");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleExtractKeywords = async () => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let kws: string[] = [];
      if (aiProvider === AIProvider.DEEPSEEK) {
        kws = await extractKeywordsDeepSeek(content, 10, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        kws = await extractKeywordsQwen(content, 10, dashScopeApiKey);
      }
      setKeywords(kws);
    } catch (e: any) {
      onError(e.message || "Failed to extract keywords");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleSuggestStyles = async () => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let styles: StyleSuggestion[] = [];
      if (aiProvider === AIProvider.DEEPSEEK) {
        styles = await suggestStylesDeepSeek(content, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        styles = await suggestStylesQwen(content, dashScopeApiKey);
      }
      setStyleSuggestions(styles);
    } catch (e: any) {
      onError(e.message || "Failed to suggest styles");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateHook = async (style: 'question' | 'story' | 'statistic' | 'quote' | 'surprising') => {
    if (!topic.trim()) {
      onError("Please enter a topic first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let hook: string = "";
      if (aiProvider === AIProvider.DEEPSEEK) {
        hook = await generateHookDeepSeek(topic, style, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        hook = await generateHookQwen(topic, style, dashScopeApiKey);
      }
      setGeneratedHook(hook);
    } catch (e: any) {
      onError(e.message || "Failed to generate hook");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleGenerateCTA = async (ctaType: 'subscribe' | 'share' | 'comment' | 'action' | 'reflection') => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let cta: string = "";
      if (aiProvider === AIProvider.DEEPSEEK) {
        cta = await generateCTADeepSeek(content, ctaType, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        cta = await generateCTAQwen(content, ctaType, dashScopeApiKey);
      }
      setGeneratedCTA(cta);
    } catch (e: any) {
      onError(e.message || "Failed to generate CTA");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handlePolishContent = async (tone: 'professional' | 'casual' | 'formal' | 'creative') => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let polished: string = "";
      if (aiProvider === AIProvider.DEEPSEEK) {
        polished = await polishContentDeepSeek(content, tone, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        polished = await polishContentQwen(content, tone, dashScopeApiKey);
      }
      // Convert polished text back to safe HTML
      setHtmlContent(textToSafeHtml(polished));
    } catch (e: any) {
      onError(e.message || "Failed to polish content");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleRewriteContent = async (style: 'humorous' | 'serious' | 'inspirational' | 'educational' | 'conversational') => {
    const content = getPlainTextContent();
    if (content.length < 50) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let rewritten: string = "";
      if (aiProvider === AIProvider.DEEPSEEK) {
        rewritten = await rewriteContentDeepSeek(content, style, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        rewritten = await rewriteContentQwen(content, style, dashScopeApiKey);
      }
      setHtmlContent(textToSafeHtml(rewritten));
    } catch (e: any) {
      onError(e.message || "Failed to rewrite content");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleTranslate = async (targetLang: 'zh' | 'en') => {
    const content = getPlainTextContent();
    if (content.length < 10) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let translated: string = "";
      if (aiProvider === AIProvider.DEEPSEEK) {
        translated = await translateContentDeepSeek(content, targetLang, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        translated = await translateContentQwen(content, targetLang, dashScopeApiKey);
      }
      setHtmlContent(textToSafeHtml(translated));
    } catch (e: any) {
      onError(e.message || "Failed to translate content");
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleExpandContent = async (style: 'detailed' | 'examples' | 'storytelling') => {
    const content = getPlainTextContent();
    if (content.length < 30) {
      onError("Please generate some article content first.");
      return;
    }
    setAiToolLoading(true);
    try {
      let expanded: string = "";
      if (aiProvider === AIProvider.DEEPSEEK) {
        expanded = await expandContentDeepSeek(content, style, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        expanded = await expandContentQwen(content, style, dashScopeApiKey);
      }
      setHtmlContent(textToSafeHtml(expanded));
    } catch (e: any) {
      onError(e.message || "Failed to expand content");
    } finally {
      setAiToolLoading(false);
    }
  };

  // --- Design Template Handler ---
  const handleInsertTemplate = (template: DesignTemplate) => {
    // Use ref to insert at cursor position if available
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(template.html);
    } else {
      // Fallback: append to end
      const separator = htmlContent.trim() ? '\n' : '';
      const newContent = htmlContent + separator + template.html;
      setHtmlContent(newContent);
    }
  };

  // --- Material Library Handlers ---
  const handleInsertMaterialImage = (imageDataUrl: string) => {
    const imgHtml = `
      <section style="margin: 20px 0; text-align: center;">
        <img src="${imageDataUrl}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
      </section>
    `;
    // Use ref to insert at cursor position if available
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(imgHtml);
    } else {
      // Fallback: append to end
      const separator = htmlContent.trim() ? '\n' : '';
      setHtmlContent(htmlContent + separator + imgHtml);
    }
  };

  const handleInsertMaterialText = (text: string) => {
    const safeText = escapeHtml(text);
    // Insert text inline (without wrapper) to preserve cursor position
    // Use a span for inline styling that works with cursor positioning
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(safeText);
    } else {
      // Fallback: append with proper paragraph wrapper
      const textHtml = `<p style="font-size: 16px; line-height: 1.8; color: #444;">${safeText}</p>`;
      const separator = htmlContent.trim() ? '\n' : '';
      setHtmlContent(htmlContent + separator + textHtml);
    }
  };

  const handleInsertMaterialVideo = (videoDataUrl: string) => {
    const videoHtml = `
      <section style="margin: 20px 0; text-align: center;">
        <video src="${videoDataUrl}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" controls></video>
        <section style="font-size: 12px; color: #888; margin-top: 6px;">视频</section>
      </section>
    `;
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(videoHtml);
    } else {
      const separator = htmlContent.trim() ? '\n' : '';
      setHtmlContent(htmlContent + separator + videoHtml);
    }
  };

  const handleInsertMaterialGif = (gifDataUrl: string) => {
    const gifHtml = `
      <section style="margin: 20px 0; text-align: center;">
        <img src="${gifDataUrl}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
      </section>
    `;
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(gifHtml);
    } else {
      const separator = htmlContent.trim() ? '\n' : '';
      setHtmlContent(htmlContent + separator + gifHtml);
    }
  };

  const handleInsertMaterialSvg = (svgContent: string) => {
    // Sanitize SVG using DOMPurify for proper security
    const sanitizedSvg = DOMPurify.sanitize(svgContent, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'],
      ADD_ATTR: ['xlink:href', 'href']
    });
    
    // Wrap SVG in a span to make it inline and preserve cursor position
    const inlineSvg = `<span style="display:inline-block; vertical-align:middle;">${sanitizedSvg}</span>`;
    
    if (htmlEditorRef.current) {
      htmlEditorRef.current.insertHtmlAtCursor(inlineSvg);
    } else {
      // Fallback: append with wrapper for proper block display
      const svgHtml = `
        <section style="margin: 20px 0; text-align: center;">
          ${sanitizedSvg}
        </section>
      `;
      const separator = htmlContent.trim() ? '\n' : '';
      setHtmlContent(htmlContent + separator + svgHtml);
    }
  };

  // --- Insert Hook Handler ---
  const handleInsertHookContent = (hook: string) => {
    const safeHook = escapeHtml(hook);
    const newContent = `<p style="font-size: 16px; line-height: 1.8; color: #444; font-style: italic; background: #f8f4ff; padding: 16px; border-radius: 8px; border-left: 4px solid #9b59b6;">${safeHook}</p>` + htmlContent;
    setHtmlContent(newContent);
  };

  // --- Insert CTA Handler ---
  const handleInsertCTAContent = (cta: string) => {
    const safeCTA = escapeHtml(cta);
    const newContent = htmlContent + `<p style="font-size: 16px; line-height: 1.8; color: #444; text-align: center; margin-top: 24px; padding: 16px; background: #fff0f0; border-radius: 8px; border: 1px solid #ffc2c2;">${safeCTA}</p>`;
    setHtmlContent(newContent);
  };

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
        setFoundDraft(true);
    }

    const savedProvider = localStorage.getItem(PROVIDER_KEY);
    if (savedProvider) setAiProvider(savedProvider as AIProvider);

    // Load WeChat credentials from localStorage
    const savedWechatCreds = localStorage.getItem('wechat_creds');
    if (savedWechatCreds) {
      try {
        const creds = JSON.parse(savedWechatCreds);
        setWechatCreds(creds);
      } catch (e) {
        console.error('Failed to parse WeChat credentials', e);
      }
    }

    // Note: API keys are managed by admin and used by backend services.
    // The frontend no longer fetches API keys directly for security reasons.
    // All AI operations should go through the backend AI endpoints.

    return () => {
       if (audioSourceRef.current) audioSourceRef.current.stop();
       if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Helper to determine badge color
  const getProviderColor = () => {
      switch(aiProvider) {
          case AIProvider.DEEPSEEK: return 'bg-blue-500';
          case AIProvider.QWEN: return 'bg-purple-500';
          default: return 'bg-gray-500';
      }
  };

  const getProviderName = () => {
       switch(aiProvider) {
          case AIProvider.DEEPSEEK: return 'DeepSeek';
          case AIProvider.QWEN: return 'Qwen (Tongyi)';
          default: return 'Unknown';
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      
      {/* Draft Notification */}
      {foundDraft && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
            <span className="text-sm font-medium">Found an unsaved draft from a previous session.</span>
            <div className="flex gap-3">
                <button onClick={() => setFoundDraft(false)} className="text-blue-100 hover:text-white text-sm">Discard</button>
                <button onClick={loadLocalDraft} className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-bold hover:bg-blue-50">Restore Draft</button>
            </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">New User Guide</h3>
                      <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">
                          <span className="material-icons">close</span>
                      </button>
                  </div>
                  
                  <div className="prose prose-sm prose-green max-w-none">
                      <p>Follow these steps to automate your WeChat Official Account publishing.</p>
                      <h4>1. Get Credentials</h4>
                      <ul>
                          <li>Log in to WeChat Official Account Admin.</li>
                          <li>Go to <strong>Development</strong> &gt; <strong>Basic Configuration</strong>.</li>
                          <li>Copy your <strong>AppID</strong> and <strong>AppSecret</strong>.</li>
                      </ul>
                      <h4>2. Whitelist IP</h4>
                      <ul>
                          <li>In Basic Configuration, add your current IP address to the whitelist.</li>
                      </ul>
                      <h4>3. Publishing</h4>
                      <ul>
                          <li>Generate content with AI (or format existing text).</li>
                          <li>Edit visually in the right panel.</li>
                          <li>Save draft locally if needed.</li>
                          <li>Click "Publish to WeChat" to send to Draft Box.</li>
                      </ul>
                  </div>
                  <div className="mt-6 flex justify-end">
                      <button onClick={() => setShowGuide(false)} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Got it</button>
                  </div>
              </div>
          </div>
      )}

      {/* Design Template Gallery Modal */}
      {showTemplateModal && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              <span className="material-icons text-pink-500">palette</span>
                              精美设计格式库
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">点击任意模板即可插入到文章中</p>
                      </div>
                      <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                          <span className="material-icons text-gray-400">close</span>
                      </button>
                  </div>
                  
                  {/* Category Tabs */}
                  <div className="flex gap-2 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto">
                      {templateCategories.map((cat) => (
                          <button
                              key={cat.id}
                              onClick={() => setSelectedTemplateCategory(cat.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                                  selectedTemplateCategory === cat.id 
                                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                              }`}
                          >
                              <span className="text-lg">{cat.icon}</span>
                              <span>{cat.nameZh}</span>
                          </button>
                      ))}
                  </div>
                  
                  {/* Templates Grid */}
                  <div className="flex-1 overflow-y-auto p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getTemplatesByCategory(selectedTemplateCategory).map((template) => (
                              <div 
                                  key={template.id}
                                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer group"
                                  onClick={() => {
                                      handleInsertTemplate(template);
                                      setShowTemplateModal(false);
                                  }}
                              >
                                  {/* Template Info */}
                                  <div className="p-4 bg-white border-b border-gray-100">
                                      <div className="flex items-center justify-between">
                                          <div>
                                              <h4 className="font-bold text-gray-800">{template.nameZh}</h4>
                                              <p className="text-xs text-gray-500 mt-1">{template.previewZh}</p>
                                          </div>
                                          <span className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition font-medium">
                                              点击插入
                                          </span>
                                      </div>
                                  </div>
                                  {/* Live Preview - Safe: template.html is from internal trusted source */}
                                  <div 
                                      className="p-4 bg-gray-50 min-h-[100px] flex items-center justify-center"
                                      dangerouslySetInnerHTML={{ __html: template.html }}
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  {/* Modal Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="material-icons text-lg text-pink-400">lightbulb</span>
                          模板插入后可在右侧预览中编辑内容
                      </div>
                      <button 
                          onClick={() => setShowTemplateModal(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                          关闭
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Left Panel: Controls */}
      <div className="w-full lg:w-1/2 p-6 flex flex-col gap-6 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">Editor Workspace</h2>
                    <button onClick={() => setShowGuide(true)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1">
                        <span className="material-icons text-[14px]">help_outline</span> Guide
                    </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${getProviderColor()}`}></span>
                  <p className="text-gray-500 text-sm">Powered by {getProviderName()}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={saveLocalDraft} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" title="Save Local Draft">
                    <span className="material-icons">save</span>
                </button>
            </div>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
            
            {/* Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setIsFormattingMode(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${!isFormattingMode ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="material-icons text-sm">auto_awesome</span>
                    Create New
                </button>
                <button 
                    onClick={() => setIsFormattingMode(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${isFormattingMode ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="material-icons text-sm">format_paint</span>
                    Format Existing
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFormattingMode ? 'Paste Text to Format' : 'Topic / Prompt'}
                </label>
                <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={isFormattingMode 
                        ? "Paste your article content here. The AI will format it into a rich WeChat layout..." 
                        : "e.g. Write a guide about traveling to Kyoto in Autumn..."}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[80px] max-h-[150px] overflow-y-auto resize-y"
                />
            </div>

            <div className="flex gap-4 items-center flex-wrap">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 transition ${aiProvider === AIProvider.DEEPSEEK || isFormattingMode ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-100'}`}>
                    <input 
                        type="checkbox" 
                        checked={useSearch} 
                        onChange={(e) => setUseSearch(e.target.checked)}
                        disabled={aiProvider === AIProvider.DEEPSEEK || isFormattingMode}
                        className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                        Use Web Search
                    </span>
                </label>
                
                {/* Dual AI Mode Toggle */}
                <label className={`flex items-center gap-2 px-3 py-2 rounded-md border transition ${
                  isFormattingMode 
                    ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' 
                    : useDualAI 
                      ? 'cursor-pointer bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300' 
                      : 'cursor-pointer hover:bg-purple-50 border-gray-200'
                }`}>
                    <input 
                        type="checkbox" 
                        checked={useDualAI} 
                        onChange={(e) => setUseDualAI(e.target.checked)}
                        disabled={isFormattingMode}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <span className="material-icons text-sm text-purple-500">psychology</span>
                        双AI模式
                    </span>
                    {useDualAI && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">文案+美化</span>}
                </label>
            </div>

            {/* Dual AI Mode Info */}
            {useDualAI && !isFormattingMode && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-icons text-purple-500 text-lg">auto_awesome</span>
                  <div>
                    <span className="font-medium text-purple-700">双并行AI模式已启用</span>
                    <p className="text-xs text-purple-600 mt-1">
                      ✨ 文案AI负责内容创作 → 美化AI负责排版设计 → 更优质的输出效果
                    </p>
                  </div>
                  </div>
                </div>
              )}

              {/* Image Analysis Upload */}
              <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 transition text-center relative ${aiProvider === AIProvider.DEEPSEEK ? 'hover:bg-gray-50 opacity-80' : 'hover:bg-gray-100'}`}>
                 <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="pointer-events-none flex flex-col items-center justify-center">
                     {uploadedImagePreview ? (
                          <div className="relative">
                             <img src={uploadedImagePreview} alt="Context" className="h-24 object-contain rounded shadow-sm mb-2" />
                             <span className={`text-xs px-2 py-0.5 rounded-full ${analyzingImage ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {analyzingImage ? 'Analyzing...' : (aiProvider !== AIProvider.DEEPSEEK ? 'Analyzed & Ready' : 'Cover Only')}
                            </span>
                         </div>
                    ) : (
                        <>
                             <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             <span className="text-xs text-gray-500 font-medium">Upload Image (Cover)</span>
                             {aiProvider !== AIProvider.DEEPSEEK && <span className="text-[10px] text-gray-400 mt-0.5">+ Image Analysis ({getProviderName()})</span>}
                        </>
                    )}
                 </div>
               </div>

              {/* Backend Stitch Control - Compact */}
              <div className="border border-green-200 rounded-lg p-2 bg-green-50">
                 <div className="flex items-center gap-2 flex-wrap">
                   <span className="material-icons text-green-600 text-sm">photo_library</span>
                   <span className="text-xs font-medium text-gray-700">无缝拼接</span>
                   <input
                     type="file"
                     accept="image/*"
                     multiple
                     ref={stitchFileInputRef}
                     onChange={handleStitchUpload}
                     className="hidden"
                   />
                   <button
                     type="button"
                     onClick={() => stitchFileInputRef.current?.click()}
                     disabled={stitchLoading}
                     className={`px-2 py-1 rounded text-white text-xs shadow ${stitchLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                   >
                     {stitchLoading ? '拼接中...' : '选择图片并拼接'}
                   </button>
                   <span className="text-[10px] text-gray-400 hidden sm:inline">多图拼接为长图</span>
                 </div>
              </div>

              <button 
                  onClick={handleGenerate}
                  disabled={loading || analyzingImage}
                className={`w-full font-semibold py-3 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition flex justify-center items-center gap-2 ${
                  useDualAI && !isFormattingMode
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {useDualAI && !isFormattingMode ? '双AI处理中...' : (isFormattingMode ? 'Formatting...' : 'Generating...')}
                    </>
                ) : (
                    <>
                        <span className="material-icons">{isFormattingMode ? 'brush' : (useDualAI ? 'psychology' : 'auto_awesome')}</span> 
                        {isFormattingMode ? 'Format Article' : (useDualAI ? '双AI生成' : 'Generate Article')}
                    </>
                )}
            </button>
        </div>

        {/* References */}
        {sources.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-800 uppercase mb-2">Sources Used</h3>
                <ul className="text-xs space-y-1">
                    {sources.map((s, idx) => (
                        <li key={idx}>
                            <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                                • {s.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}


        {/* Material Library Panel - Button Only */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => {
              // Save cursor position before opening the modal
              if (htmlEditorRef.current) {
                htmlEditorRef.current.saveCursorPosition();
              }
              setShowMaterialLibrary(true);
            }}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition"
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-blue-600 text-lg">folder_special</span>
              <span className="font-medium text-sm text-gray-800">素材库</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">NEW</span>
            </div>
            <span className="material-icons text-gray-500 text-sm">open_in_new</span>
          </button>
        </div>

        {/* AI Tools Panel - Button Only */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => setShowAITools(true)}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition"
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-purple-600 text-lg">psychology</span>
              <span className="font-medium text-sm text-gray-800">AI 智能工具</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">含滑动条</span>
            </div>
            <span className="material-icons text-gray-500 text-sm">open_in_new</span>
          </button>
        </div>

        {/* Design Templates Panel - Button Only */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => {
              // Save cursor position before opening modal
              if (htmlEditorRef.current) {
                htmlEditorRef.current.saveCursorPosition();
              }
              setShowDesignTemplates(true);
            }}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 transition"
          >
            <div className="flex items-center gap-2">
              <span className="material-icons text-pink-600 text-lg">palette</span>
              <span className="font-medium text-sm text-gray-800">精美设计格式库</span>
              <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">{allDesignTemplates.length}+</span>
            </div>
            <span className="material-icons text-gray-500 text-sm">open_in_new</span>
          </button>
        </div>
      </div>

      {/* Right Panel: Preview & Edit */}
      <div className="w-full lg:w-1/2 bg-gray-100 p-8 flex flex-col items-center justify-center relative overflow-y-auto">
         <div className="absolute top-4 right-4 flex gap-2">
            <button 
                onClick={handleTTS}
                disabled={aiProvider === AIProvider.DEEPSEEK}
                className={`p-1.5 rounded-full shadow-lg transition-colors ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} ${aiProvider === AIProvider.DEEPSEEK ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={aiProvider === AIProvider.DEEPSEEK ? "TTS unavailable with DeepSeek" : "Read Article Aloud"}
            >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
         </div>

         {/* Phone Mockup with HTML Editor */}
         <div className="w-[390px] h-[844px] bg-white rounded-[3.5rem] border-[12px] border-gray-900 shadow-2xl overflow-hidden relative flex flex-col shrink-0">
            {/* Status Bar */}
            <div className="h-6 bg-white w-full flex justify-between items-center px-6 pt-2 z-10 shrink-0">
                <span className="text-[10px] font-bold">9:41</span>
                <div className="flex gap-1">
                     <div className="w-4 h-1.5 bg-black rounded-sm"></div>
                     <div className="w-4 h-1.5 bg-black rounded-sm"></div>
                     <div className="w-0.5 h-1.5 bg-black rounded-sm"></div>
                </div>
            </div>
            {/* App Header */}
            <div className="h-12 bg-white w-full flex items-center px-4 border-b border-gray-100 z-10 shrink-0">
                <span className="text-lg font-medium">WeChat</span>
                <div className="ml-auto flex gap-3">
                   <div className="w-1 h-1 bg-black rounded-full"></div>
                   <div className="w-1 h-1 bg-black rounded-full"></div>
                   <div className="w-1 h-1 bg-black rounded-full"></div>
                </div>
            </div>

            {/* Editor Component */}
            <div className="flex-1 overflow-hidden relative">
                 <HtmlEditor 
                    ref={htmlEditorRef}
                    initialHtml={htmlContent}
                    onChange={(newHtml) => setHtmlContent(newHtml)}
                    title={articleTitle}
                    author="Official Account"
                    date={new Date().toLocaleDateString()}
                 />
            </div>
         </div>

         <div className="mt-8 flex gap-4">
             <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
             >
                {isPublishing ? 'Publishing...' : 'Publish to WeChat'}
             </button>
         </div>
      </div>

      {/* Material Library Modal Overlay */}
      {showMaterialLibrary && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-blue-600">folder_special</span>
                <span className="font-bold text-lg text-gray-800">素材库</span>
              </div>
              <button 
                onClick={() => setShowMaterialLibrary(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <MaterialLibrary
                onSelectMaterial={() => {}}
                onInsertImage={(img) => { handleInsertMaterialImage(img); setShowMaterialLibrary(false); }}
                onInsertText={(txt) => { handleInsertMaterialText(txt); setShowMaterialLibrary(false); }}
                onInsertVideo={(video) => { handleInsertMaterialVideo(video); setShowMaterialLibrary(false); }}
                onInsertGif={(gif) => { handleInsertMaterialGif(gif); setShowMaterialLibrary(false); }}
                onInsertSvg={(svg) => { handleInsertMaterialSvg(svg); setShowMaterialLibrary(false); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Tools Modal Overlay */}
      {showAITools && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-purple-600">psychology</span>
                <span className="font-bold text-lg text-gray-800">AI 智能工具</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">含滑动条</span>
              </div>
              <button 
                onClick={() => setShowAITools(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <AIToolsPanel
                settings={aiSettings}
                onSettingsChange={setAiSettings}
                onGenerateTitles={handleGenerateTitles}
                onGenerateSummary={handleGenerateSummary}
                onExtractKeywords={handleExtractKeywords}
                onGenerateHook={handleGenerateHook}
                onGenerateCTA={handleGenerateCTA}
                onSuggestStyles={handleSuggestStyles}
                onPolishContent={handlePolishContent}
                onRewriteContent={handleRewriteContent}
                onExpandContent={handleExpandContent}
                onTranslate={handleTranslate}
                titleSuggestions={titleSuggestions}
                keywords={keywords}
                styleSuggestions={styleSuggestions}
                generatedHook={generatedHook}
                generatedCTA={generatedCTA}
                onSelectTitle={(title) => { setArticleTitle(title); }}
                onInsertHook={(hook) => { handleInsertHookContent(hook); }}
                onInsertCTA={(cta) => { handleInsertCTAContent(cta); }}
                loading={aiToolLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Design Templates Modal Overlay */}
      {showDesignTemplates && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-orange-50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-pink-600">palette</span>
                <span className="font-bold text-lg text-gray-800">精美设计格式库</span>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{allDesignTemplates.length}+</span>
              </div>
              <button 
                onClick={() => setShowDesignTemplates(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-gray-100">
                {templateCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTemplateCategory(cat.id)}
                    className={`text-sm px-4 py-2 rounded-full transition flex items-center gap-1 ${
                      selectedTemplateCategory === cat.id 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.nameZh}</span>
                  </button>
                ))}
              </div>

              {/* Templates Grid with Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTemplatesByCategory(selectedTemplateCategory).map((template) => (
                  <div 
                    key={template.id}
                    className="border border-gray-200 rounded-xl hover:border-pink-400 hover:shadow-lg transition cursor-pointer group overflow-hidden"
                    onClick={() => { handleInsertTemplate(template); setShowDesignTemplates(false); }}
                  >
                    {/* Template Preview */}
                    <div 
                      className="bg-white p-4 border-b border-gray-100 min-h-[120px] flex items-center justify-center"
                      style={{ 
                        transform: 'scale(0.75)', 
                        transformOrigin: 'center center',
                        margin: '-20px -40px'
                      }}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: template.html }}
                        style={{ 
                          pointerEvents: 'none',
                          maxWidth: '100%',
                          overflow: 'hidden'
                        }}
                      />
                    </div>
                    {/* Template Info */}
                    <div className="p-3 bg-gray-50 group-hover:bg-pink-50/50 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{template.nameZh}</div>
                          <div className="text-xs text-gray-500">{template.previewZh}</div>
                        </div>
                        <div className="text-pink-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-xs">
                          <span className="material-icons text-sm">add_circle</span>
                          插入
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
