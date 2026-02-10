import DOMPurify from 'dompurify';
import { ArticleBlock, BlockType } from '../../../types';
import { getStyleColors } from './styleUtils';
import { getCalloutIcon } from './styleUtils';

// Default header level when not specified
const DEFAULT_HEADER_LEVEL = 2;

// --- Helper: Convert Blocks to WeChat-compatible HTML ---
export const convertBlocksToHtml = (blocks: ArticleBlock[]): string => {
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
        const listItems = block.items?.map((item: string) => `
          <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <section style="width: 6px; height: 6px; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; border-radius: 50%; margin-top: 9px; margin-right: 10px; flex-shrink: 0;"></section>
            <section style="font-size: 16px; color: #444; line-height: 1.6;">${item}</section>
          </section>
        `).join('') || '';
        return `<section style="margin: 15px 0;">${listItems}</section>`;
      case BlockType.NUMBERED_LIST:
        const numberedItems = block.items?.map((item: string, idx: number) => `
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
        const tableHeaders = block.headers?.map((h: string) => `
          <section style="flex: 1; padding: 10px 12px; ${isGradient ? `background: ${colors.main}` : `background-color: ${colors.main}`}; color: #fff; font-weight: bold; font-size: 14px; text-align: center;">${h}</section>
        `).join('') || '';
        const tableRows = block.rows?.map((row: string[], rowIdx: number) => `
          <section style="display: flex; border-bottom: 1px solid #eee; ${rowIdx % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #fff;'}">
            ${row.map((cell: string) => `
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
        const faqItems = (block.items || []).map((question: string, idx: number) => {
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
      
      // --- Section Container Block ---
      case BlockType.SECTION:
        const sectionBgStyle = block.backgroundStyle || 'solid';
        let sectionBg = '';
        if (sectionBgStyle === 'gradient' || isGradient) {
          sectionBg = `background: ${colors.bg};`;
        } else if (sectionBgStyle === 'pattern') {
          sectionBg = `background-color: ${colors.bg.startsWith('linear') ? '#f8f9fa' : colors.bg};`;
        } else {
          sectionBg = isGradient ? `background: ${colors.bg};` : `background-color: ${colors.bg};`;
        }
        
        // Generate decoration elements
        let sectionDeco = '';
        const decoType = block.decoration || '';
        if (decoType === 'circles' || sectionBgStyle === 'pattern') {
          sectionDeco = `
            <section style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: ${isGradient ? 'rgba(102,126,234,0.1)' : colors.main}; opacity: 0.08; border-radius: 50%;"></section>
            <section style="position: absolute; bottom: -15px; left: 20px; width: 60px; height: 60px; background: ${isGradient ? 'rgba(118,75,162,0.1)' : colors.main}; opacity: 0.06; border-radius: 50%;"></section>
            <section style="position: absolute; top: 30px; left: -10px; width: 40px; height: 40px; background: ${isGradient ? 'rgba(102,126,234,0.08)' : colors.main}; opacity: 0.05; border-radius: 50%;"></section>
          `;
        } else if (decoType === 'dots') {
          sectionDeco = `
            <section style="position: absolute; top: 12px; right: 16px; display: flex; gap: 4px;">
              <section style="width: 4px; height: 4px; background: ${isGradient ? '#667eea' : colors.main}; opacity: 0.15; border-radius: 50%;"></section>
              <section style="width: 4px; height: 4px; background: ${isGradient ? '#667eea' : colors.main}; opacity: 0.12; border-radius: 50%;"></section>
              <section style="width: 4px; height: 4px; background: ${isGradient ? '#667eea' : colors.main}; opacity: 0.08; border-radius: 50%;"></section>
            </section>
          `;
        } else if (decoType === 'waves') {
          sectionDeco = `
            <section style="position: absolute; bottom: 0; left: 0; right: 0; height: 30px; background: linear-gradient(180deg, transparent, ${isGradient ? 'rgba(102,126,234,0.05)' : colors.main + '08'}); border-radius: 0 0 12px 12px;"></section>
          `;
        } else if (decoType === 'geometric') {
          sectionDeco = `
            <section style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: ${isGradient ? 'rgba(102,126,234,0.06)' : colors.main}; opacity: 0.06; transform: rotate(45deg); border-radius: 4px;"></section>
            <section style="position: absolute; bottom: 10px; left: 10px; width: 30px; height: 30px; background: ${isGradient ? 'rgba(118,75,162,0.08)' : colors.main}; opacity: 0.05; transform: rotate(45deg); border-radius: 2px;"></section>
          `;
        } else if (decoType === 'stars') {
          sectionDeco = `
            <section style="position: absolute; top: 10px; right: 20px; font-size: 16px; opacity: 0.15;">✦</section>
            <section style="position: absolute; bottom: 15px; left: 15px; font-size: 12px; opacity: 0.1;">✦</section>
            <section style="position: absolute; top: 40%; right: 10%; font-size: 10px; opacity: 0.08;">★</section>
          `;
        }
        
        // Render child blocks recursively
        const childrenHtml = (block.children || []).map(child => {
          const childColors = getStyleColors(child.style);
          const childIsGradient = child.style === 'gradient' || child.style?.startsWith('gradient_');
          const childAlignment = child.alignment || 'left';
          const childTextAlign = `text-align: ${childAlignment};`;
          
          switch (child.type) {
            case 'header':
              const childHeaderLevel = Number(child.level) || 2;
              const childHeaderSize = childHeaderLevel === 1 ? '20px' : childHeaderLevel === 2 ? '17px' : '15px';
              return `<section style="margin: 12px 0 8px 0; font-size: ${childHeaderSize}; font-weight: bold; color: #333; ${childTextAlign}">${child.content}</section>`;
            case 'paragraph':
              return `<section style="margin-bottom: 10px; font-size: 14px; line-height: 1.8; color: #555; ${childTextAlign}">${child.content}</section>`;
            case 'card':
              return `<section style="margin: 10px 0; padding: 14px; border: 1px solid ${childColors.border}; ${childIsGradient ? `background: ${childColors.bg}` : `background-color: ${childColors.bg}`}; border-radius: 8px;">${child.title ? `<section style="font-size: 14px; font-weight: bold; color: ${typeof childColors.main === 'string' && childColors.main.startsWith('linear') ? '#333' : childColors.main}; margin-bottom: 6px;">${child.title}</section>` : ''}<section style="font-size: 13px; color: #555; line-height: 1.6;">${child.content}</section></section>`;
            case 'list':
              const childListItems = (child.items || []).map((item: string) => `<section style="display: flex; align-items: flex-start; margin-bottom: 6px;"><section style="width: 5px; height: 5px; ${childIsGradient ? `background: ${childColors.main}` : `background-color: ${childColors.main}`}; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section><section style="font-size: 14px; color: #555; line-height: 1.6;">${item}</section></section>`).join('');
              return `<section style="margin: 10px 0;">${childListItems}</section>`;
            case 'numbered_list':
              const childNumItems = (child.items || []).map((item: string, idx: number) => `<section style="display: flex; align-items: flex-start; margin-bottom: 8px;"><section style="width: 20px; height: 20px; ${childIsGradient ? `background: ${childColors.main}` : `background-color: ${childColors.main}`}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0;"><section style="color: #fff; font-size: 11px; font-weight: bold;">${idx + 1}</section></section><section style="font-size: 14px; color: #555; line-height: 1.6; padding-top: 1px;">${item}</section></section>`).join('');
              return `<section style="margin: 10px 0;">${childNumItems}</section>`;
            case 'quote':
              return `<section style="margin: 10px 0; padding: 12px; ${childIsGradient ? `background: ${childColors.bg}` : `background-color: ${childColors.bg}`}; border-left: 3px solid ${childIsGradient ? '#667eea' : childColors.main}; border-radius: 0 4px 4px 0;"><section style="font-size: 14px; color: #666; font-style: italic; line-height: 1.6;">${child.content}</section></section>`;
            case 'highlight':
              return `<section style="margin: 10px 0; padding: 14px 16px; ${childIsGradient ? `background: ${childColors.bg}` : `background-color: ${childColors.bg}`}; border-radius: 6px; position: relative;"><section style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; ${childIsGradient ? `background: ${childColors.main}` : `background-color: ${childColors.main}`}; border-radius: 6px 6px 0 0;"></section><section style="font-size: 14px; color: #333; line-height: 1.7; font-weight: 500;">${child.content}</section></section>`;
            case 'callout':
              return `<section style="margin: 10px 0; padding: 12px 14px; background-color: #f0f8ff; border-left: 3px solid #3498db; border-radius: 0 6px 6px 0;"><section style="font-size: 14px; color: #555; line-height: 1.6;">${child.content}</section></section>`;
            case 'divider':
              return `<section style="margin: 14px 0; text-align: center;"><section style="display: inline-block; width: 50%; height: 1px; ${childIsGradient ? `background: ${childColors.main}` : `background-color: ${childColors.main}`}; opacity: 0.3;"></section></section>`;
            case 'image':
              return `<section style="margin: 10px 0; text-align: center;"><section style="padding: 20px; border: 1px dashed #ddd; border-radius: 6px; background: rgba(255,255,255,0.5); color: #999; font-size: 13px;">${child.content}</section></section>`;
            default:
              return `<section style="margin: 8px 0; font-size: 14px; color: #555; line-height: 1.7;">${child.content}</section>`;
          }
        }).join('');
        
        return `
          <section style="margin: 24px 0; padding: 24px 20px; ${sectionBg} border-radius: 12px; position: relative; overflow: hidden;">
            ${sectionDeco}
            <section style="position: relative; z-index: 1;">
              ${block.title ? `<section style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 14px; ${textAlign}">${block.title}</section>` : ''}
              ${block.content ? `<section style="font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 12px;">${block.content}</section>` : ''}
              ${childrenHtml}
            </section>
          </section>
        `;
      default:
        return '';
    }
  }).join('');
};
