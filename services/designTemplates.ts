/**
 * Design Templates Library - 精美设计格式库
 * 
 * A collection of pre-designed HTML templates for WeChat articles.
 * Each template provides beautiful, ready-to-use formatting.
 */

export interface DesignTemplate {
  id: string;
  name: string;
  nameZh: string;
  category: 'header' | 'card' | 'list' | 'quote' | 'callout' | 'divider' | 'special';
  preview: string; // Short description
  previewZh: string;
  html: string;
}

// --- Beautiful Header Templates ---
const headerTemplates: DesignTemplate[] = [
  {
    id: 'header-ribbon',
    name: 'Ribbon Header',
    nameZh: '绸带标题',
    category: 'header',
    preview: 'Elegant ribbon-style section header',
    previewZh: '优雅的绸带风格章节标题',
    html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="display: inline-block; position: relative; padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-size: 18px; font-weight: bold; border-radius: 4px;">
          <section style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-right: 10px solid #667eea;"></section>
          <section style="position: absolute; right: -10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-left: 10px solid #764ba2;"></section>
          在此输入标题
        </section>
      </section>
    `
  },
  {
    id: 'header-bracket',
    name: 'Bracket Header',
    nameZh: '括号标题',
    category: 'header',
    preview: 'Modern bracket-style header',
    previewZh: '现代括号风格标题',
    html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="display: inline-flex; align-items: center; gap: 12px;">
          <section style="font-size: 32px; color: #07c160; font-weight: 300;">【</section>
          <section style="font-size: 20px; font-weight: bold; color: #333; letter-spacing: 2px;">在此输入标题</section>
          <section style="font-size: 32px; color: #07c160; font-weight: 300;">】</section>
        </section>
      </section>
    `
  },
  {
    id: 'header-underline',
    name: 'Gradient Underline',
    nameZh: '渐变下划线',
    category: 'header',
    preview: 'Header with gradient underline',
    previewZh: '带渐变下划线的标题',
    html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px;">在此输入标题</section>
        <section style="width: 80px; height: 4px; background: linear-gradient(90deg, #fa5151, #f39c12, #07c160, #3498db, #9b59b6); border-radius: 2px; margin: 0 auto;"></section>
      </section>
    `
  },
  {
    id: 'header-number',
    name: 'Numbered Section',
    nameZh: '序号章节',
    category: 'header',
    preview: 'Section header with large number',
    previewZh: '带大号序号的章节标题',
    html: `
      <section style="margin: 24px 0; display: flex; align-items: center; gap: 16px;">
        <section style="width: 48px; height: 48px; background: linear-gradient(135deg, #fa5151 0%, #f39c12 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: bold; box-shadow: 0 4px 12px rgba(250, 81, 81, 0.3);">01</section>
        <section style="font-size: 20px; font-weight: bold; color: #333;">在此输入标题</section>
      </section>
    `
  },
  {
    id: 'header-badge',
    name: 'Badge Header',
    nameZh: '徽章标题',
    category: 'header',
    preview: 'Header with decorative badge',
    previewZh: '带装饰徽章的标题',
    html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="display: inline-block; position: relative; padding: 16px 32px; background: #fff; border: 2px solid #07c160; border-radius: 50px;">
          <section style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #07c160; color: #fff; font-size: 12px; padding: 4px 16px; border-radius: 12px;">SECTION</section>
          <section style="font-size: 18px; font-weight: bold; color: #333;">在此输入标题</section>
        </section>
      </section>
    `
  }
];

// --- Card & Box Templates ---
const cardTemplates: DesignTemplate[] = [
  {
    id: 'card-glass',
    name: 'Glass Card',
    nameZh: '玻璃卡片',
    category: 'card',
    preview: 'Frosted glass effect card',
    previewZh: '磨砂玻璃效果卡片',
    html: `
      <section style="margin: 20px 0; padding: 24px; background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%); border: 1px solid rgba(255,255,255,0.5); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
        <section style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 12px;">💡 标题</section>
        <section style="font-size: 14px; color: #666; line-height: 1.8;">在此输入内容描述，可以是要点总结、知识点或重要提示。</section>
      </section>
    `
  },
  {
    id: 'card-gradient-border',
    name: 'Gradient Border',
    nameZh: '渐变边框卡片',
    category: 'card',
    preview: 'Card with gradient border',
    previewZh: '带渐变边框的卡片',
    html: `
      <section style="margin: 20px 0; padding: 3px; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); border-radius: 12px;">
        <section style="background: #fff; padding: 20px; border-radius: 10px;">
          <section style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px;">✨ 精选内容</section>
          <section style="font-size: 14px; color: #666; line-height: 1.8;">在此输入内容，渐变边框让卡片更加醒目和精致。</section>
        </section>
      </section>
    `
  },
  {
    id: 'card-icon-left',
    name: 'Icon Left Card',
    nameZh: '左侧图标卡片',
    category: 'card',
    preview: 'Card with left icon accent',
    previewZh: '左侧带图标强调的卡片',
    html: `
      <section style="margin: 20px 0; display: flex; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
        <section style="width: 60px; background: linear-gradient(180deg, #3498db 0%, #2980b9 100%); display: flex; align-items: center; justify-content: center; font-size: 24px;">📚</section>
        <section style="flex: 1; padding: 16px 20px;">
          <section style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 6px;">知识要点</section>
          <section style="font-size: 14px; color: #666; line-height: 1.6;">在此输入要点内容，简洁明了地传达信息。</section>
        </section>
      </section>
    `
  },
  {
    id: 'card-quote-box',
    name: 'Quote Box',
    nameZh: '引用框',
    category: 'card',
    preview: 'Elegant quote box with marks',
    previewZh: '带引号标记的优雅引用框',
    html: `
      <section style="margin: 20px 0; padding: 24px 28px; background: linear-gradient(135deg, #fef6e4 0%, #fff9f0 100%); border-radius: 12px; position: relative;">
        <section style="position: absolute; top: 12px; left: 16px; font-size: 48px; color: #d4af37; opacity: 0.5; font-family: Georgia, serif; line-height: 1;">"</section>
        <section style="font-size: 15px; color: #555; line-height: 1.8; font-style: italic; padding-left: 20px;">在此输入引用内容或名言警句，让文章更有深度。</section>
        <section style="text-align: right; margin-top: 12px; font-size: 13px; color: #888;">—— 作者名</section>
      </section>
    `
  },
  {
    id: 'card-tip-box',
    name: 'Tip Box',
    nameZh: '提示框',
    category: 'card',
    preview: 'Colorful tip/note box',
    previewZh: '彩色提示/笔记框',
    html: `
      <section style="margin: 20px 0; padding: 16px 20px; background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f6 100%); border-left: 4px solid #07c160; border-radius: 0 8px 8px 0;">
        <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <section style="width: 20px; height: 20px; background: #07c160; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: bold;">✓</section>
          <section style="font-size: 14px; font-weight: bold; color: #07c160;">小提示</section>
        </section>
        <section style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 28px;">在此输入提示内容，帮助读者更好地理解要点。</section>
      </section>
    `
  }
];

// --- List Templates ---
const listTemplates: DesignTemplate[] = [
  {
    id: 'list-timeline',
    name: 'Timeline',
    nameZh: '时间线',
    category: 'list',
    preview: 'Vertical timeline layout',
    previewZh: '垂直时间线布局',
    html: `
      <section style="margin: 20px 0; padding-left: 20px; border-left: 2px solid #07c160;">
        <section style="margin-bottom: 20px; position: relative;">
          <section style="position: absolute; left: -27px; top: 0; width: 12px; height: 12px; background: #07c160; border-radius: 50%; border: 2px solid #fff;"></section>
          <section style="font-size: 13px; color: #07c160; font-weight: bold; margin-bottom: 4px;">步骤一</section>
          <section style="font-size: 14px; color: #555; line-height: 1.6;">在此描述第一步的内容和要点。</section>
        </section>
        <section style="margin-bottom: 20px; position: relative;">
          <section style="position: absolute; left: -27px; top: 0; width: 12px; height: 12px; background: #3498db; border-radius: 50%; border: 2px solid #fff;"></section>
          <section style="font-size: 13px; color: #3498db; font-weight: bold; margin-bottom: 4px;">步骤二</section>
          <section style="font-size: 14px; color: #555; line-height: 1.6;">在此描述第二步的内容和要点。</section>
        </section>
        <section style="position: relative;">
          <section style="position: absolute; left: -27px; top: 0; width: 12px; height: 12px; background: #9b59b6; border-radius: 50%; border: 2px solid #fff;"></section>
          <section style="font-size: 13px; color: #9b59b6; font-weight: bold; margin-bottom: 4px;">步骤三</section>
          <section style="font-size: 14px; color: #555; line-height: 1.6;">在此描述第三步的内容和要点。</section>
        </section>
      </section>
    `
  },
  {
    id: 'list-check',
    name: 'Checklist',
    nameZh: '清单列表',
    category: 'list',
    preview: 'Beautiful checklist style',
    previewZh: '精美清单样式',
    html: `
      <section style="margin: 20px 0;">
        <section style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <section style="width: 22px; height: 22px; background: linear-gradient(135deg, #07c160 0%, #10b981 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: #fff; font-size: 14px;">✓</section>
          <section style="font-size: 15px; color: #444; line-height: 1.6;">第一条待办事项或要点说明</section>
        </section>
        <section style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <section style="width: 22px; height: 22px; background: linear-gradient(135deg, #07c160 0%, #10b981 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: #fff; font-size: 14px;">✓</section>
          <section style="font-size: 15px; color: #444; line-height: 1.6;">第二条待办事项或要点说明</section>
        </section>
        <section style="display: flex; align-items: flex-start;">
          <section style="width: 22px; height: 22px; background: linear-gradient(135deg, #07c160 0%, #10b981 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: #fff; font-size: 14px;">✓</section>
          <section style="font-size: 15px; color: #444; line-height: 1.6;">第三条待办事项或要点说明</section>
        </section>
      </section>
    `
  },
  {
    id: 'list-numbered-fancy',
    name: 'Fancy Numbers',
    nameZh: '精美序号',
    category: 'list',
    preview: 'Colorful numbered list',
    previewZh: '彩色序号列表',
    html: `
      <section style="margin: 20px 0;">
        <section style="display: flex; align-items: flex-start; margin-bottom: 16px;">
          <section style="width: 32px; height: 32px; background: linear-gradient(135deg, #fa5151 0%, #f39c12 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0; color: #fff; font-size: 15px; font-weight: bold; box-shadow: 0 2px 8px rgba(250, 81, 81, 0.3);">1</section>
          <section style="flex: 1; padding-top: 4px;">
            <section style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;">第一点标题</section>
            <section style="font-size: 14px; color: #666; line-height: 1.6;">详细描述内容可以在这里展开。</section>
          </section>
        </section>
        <section style="display: flex; align-items: flex-start; margin-bottom: 16px;">
          <section style="width: 32px; height: 32px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0; color: #fff; font-size: 15px; font-weight: bold; box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);">2</section>
          <section style="flex: 1; padding-top: 4px;">
            <section style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;">第二点标题</section>
            <section style="font-size: 14px; color: #666; line-height: 1.6;">详细描述内容可以在这里展开。</section>
          </section>
        </section>
        <section style="display: flex; align-items: flex-start;">
          <section style="width: 32px; height: 32px; background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0; color: #fff; font-size: 15px; font-weight: bold; box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);">3</section>
          <section style="flex: 1; padding-top: 4px;">
            <section style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;">第三点标题</section>
            <section style="font-size: 14px; color: #666; line-height: 1.6;">详细描述内容可以在这里展开。</section>
          </section>
        </section>
      </section>
    `
  }
];

// --- Divider Templates ---
const dividerTemplates: DesignTemplate[] = [
  {
    id: 'divider-dots',
    name: 'Dot Divider',
    nameZh: '圆点分割线',
    category: 'divider',
    preview: 'Three dots divider',
    previewZh: '三圆点分割线',
    html: `
      <section style="margin: 30px 0; text-align: center;">
        <section style="display: inline-flex; align-items: center; gap: 12px;">
          <section style="width: 8px; height: 8px; background: #07c160; border-radius: 50%;"></section>
          <section style="width: 8px; height: 8px; background: #3498db; border-radius: 50%;"></section>
          <section style="width: 8px; height: 8px; background: #9b59b6; border-radius: 50%;"></section>
        </section>
      </section>
    `
  },
  {
    id: 'divider-wave',
    name: 'Wave Divider',
    nameZh: '波浪分割线',
    category: 'divider',
    preview: 'Decorative wave divider',
    previewZh: '装饰性波浪分割线',
    html: `
      <section style="margin: 30px 0; text-align: center; color: #ccc; font-size: 14px; letter-spacing: 4px;">
        ～～～✿～～～
      </section>
    `
  },
  {
    id: 'divider-gradient',
    name: 'Gradient Line',
    nameZh: '渐变分割线',
    category: 'divider',
    preview: 'Beautiful gradient line',
    previewZh: '精美渐变线条',
    html: `
      <section style="margin: 30px 0; text-align: center;">
        <section style="display: inline-block; width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #667eea, #764ba2, transparent); border-radius: 1px;"></section>
      </section>
    `
  },
  {
    id: 'divider-icon',
    name: 'Icon Divider',
    nameZh: '图标分割线',
    category: 'divider',
    preview: 'Divider with center icon',
    previewZh: '带中心图标的分割线',
    html: `
      <section style="margin: 30px 0; display: flex; align-items: center; justify-content: center; gap: 16px;">
        <section style="flex: 1; max-width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #ddd);"></section>
        <section style="font-size: 18px;">✦</section>
        <section style="flex: 1; max-width: 100px; height: 1px; background: linear-gradient(90deg, #ddd, transparent);"></section>
      </section>
    `
  }
];

// --- Quote Templates ---
const quoteTemplates: DesignTemplate[] = [
  {
    id: 'quote-large',
    name: 'Large Quote',
    nameZh: '大引号引用',
    category: 'quote',
    preview: 'Quote with large quotation marks',
    previewZh: '带大引号的引用',
    html: `
      <section style="margin: 24px 0; text-align: center; padding: 20px;">
        <section style="font-size: 60px; color: #07c160; opacity: 0.3; line-height: 1;">"</section>
        <section style="font-size: 16px; color: #555; font-style: italic; line-height: 1.8; margin: -10px 0 10px 0;">在此输入引用内容，可以是名人名言、格言警句或重要观点。</section>
        <section style="font-size: 14px; color: #888;">—— 作者姓名</section>
      </section>
    `
  },
  {
    id: 'quote-side',
    name: 'Side Border Quote',
    nameZh: '侧边框引用',
    category: 'quote',
    preview: 'Quote with colorful side border',
    previewZh: '带彩色侧边框的引用',
    html: `
      <section style="margin: 24px 0; padding: 16px 20px; background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); border-left: 4px solid #667eea; border-radius: 0 8px 8px 0; position: relative; overflow: hidden;">
        <section style="position: absolute; left: 0; top: 0; width: 4px; height: 100%; background: linear-gradient(180deg, #667eea, #764ba2);"></section>
        <section style="font-size: 15px; color: #555; line-height: 1.8; font-style: italic; padding-left: 4px;">在此输入引用内容，让文章更有说服力和深度。</section>
      </section>
    `
  }
];

// --- Callout Templates ---
const calloutTemplates: DesignTemplate[] = [
  {
    id: 'callout-info',
    name: 'Info Callout',
    nameZh: '信息提示',
    category: 'callout',
    preview: 'Blue info callout box',
    previewZh: '蓝色信息提示框',
    html: `
      <section style="margin: 20px 0; padding: 16px 20px; background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%); border-radius: 8px; border-left: 4px solid #3498db;">
        <section style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <section style="width: 24px; height: 24px; background: #3498db; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: bold;">i</section>
          <section style="font-size: 15px; font-weight: bold; color: #3498db;">提示信息</section>
        </section>
        <section style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 34px;">在此输入提示内容，帮助读者了解重要信息。</section>
      </section>
    `
  },
  {
    id: 'callout-warning',
    name: 'Warning Callout',
    nameZh: '警告提示',
    category: 'callout',
    preview: 'Orange warning callout box',
    previewZh: '橙色警告提示框',
    html: `
      <section style="margin: 20px 0; padding: 16px 20px; background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%); border-radius: 8px; border-left: 4px solid #f39c12;">
        <section style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <section style="width: 24px; height: 24px; background: #f39c12; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: bold;">!</section>
          <section style="font-size: 15px; font-weight: bold; color: #f39c12;">注意事项</section>
        </section>
        <section style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 34px;">在此输入需要注意的内容，提醒读者关注。</section>
      </section>
    `
  },
  {
    id: 'callout-success',
    name: 'Success Callout',
    nameZh: '成功提示',
    category: 'callout',
    preview: 'Green success callout box',
    previewZh: '绿色成功提示框',
    html: `
      <section style="margin: 20px 0; padding: 16px 20px; background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f6 100%); border-radius: 8px; border-left: 4px solid #07c160;">
        <section style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <section style="width: 24px; height: 24px; background: #07c160; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: bold;">✓</section>
          <section style="font-size: 15px; font-weight: bold; color: #07c160;">操作成功</section>
        </section>
        <section style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 34px;">在此输入成功信息或正面反馈内容。</section>
      </section>
    `
  }
];

// --- Special/Footer Templates ---
const specialTemplates: DesignTemplate[] = [
  {
    id: 'special-end-card',
    name: 'Article End Card',
    nameZh: '文末卡片',
    category: 'special',
    preview: 'Beautiful article ending card',
    previewZh: '精美文末结束卡片',
    html: `
      <section style="margin: 30px 0; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; color: #fff;">
        <section style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">感谢阅读</section>
        <section style="font-size: 14px; opacity: 0.9; margin-bottom: 16px;">如果觉得有帮助，欢迎点赞和分享 ❤️</section>
        <section style="display: inline-flex; gap: 12px;">
          <section style="padding: 8px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 13px;">👍 点赞</section>
          <section style="padding: 8px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 13px;">↗ 分享</section>
        </section>
      </section>
    `
  },
  {
    id: 'special-author-box',
    name: 'Author Box',
    nameZh: '作者信息框',
    category: 'special',
    preview: 'Author introduction box',
    previewZh: '作者介绍框',
    html: `
      <section style="margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 12px; display: flex; align-items: center; gap: 16px;">
        <section style="width: 60px; height: 60px; background: linear-gradient(135deg, #07c160 0%, #10b981 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; flex-shrink: 0;">👤</section>
        <section style="flex: 1;">
          <section style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 4px;">作者名称</section>
          <section style="font-size: 13px; color: #888; line-height: 1.5;">简短的作者介绍，可以写一两句话描述。</section>
        </section>
      </section>
    `
  },
  {
    id: 'special-highlight-box',
    name: 'Key Takeaway',
    nameZh: '核心要点框',
    category: 'special',
    preview: 'Highlight key takeaways',
    previewZh: '突出显示核心要点',
    html: `
      <section style="margin: 24px 0; padding: 20px 24px; background: linear-gradient(135deg, #fef6e4 0%, #fff9f0 100%); border-radius: 12px; border: 2px solid #d4af37;">
        <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <section style="font-size: 20px;">⭐</section>
          <section style="font-size: 16px; font-weight: bold; color: #d4af37;">核心要点</section>
        </section>
        <section style="font-size: 15px; color: #555; line-height: 1.8;">在此总结文章的核心观点或最重要的信息，帮助读者快速把握重点。</section>
      </section>
    `
  },
  {
    id: 'special-cta-box',
    name: 'Call to Action',
    nameZh: '行动号召框',
    category: 'special',
    preview: 'Call to action box',
    previewZh: '行动号召框',
    html: `
      <section style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #fa5151 0%, #f39c12 100%); border-radius: 12px; text-align: center; color: #fff;">
        <section style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">🎯 立即行动</section>
        <section style="font-size: 14px; opacity: 0.95; margin-bottom: 16px;">现在就开始实践今天学到的内容吧！</section>
        <section style="display: inline-block; padding: 10px 28px; background: rgba(255,255,255,0.95); color: #fa5151; border-radius: 25px; font-size: 14px; font-weight: bold;">开始尝试 →</section>
      </section>
    `
  },
  {
    id: 'special-summary',
    name: 'Summary Box',
    nameZh: '总结框',
    category: 'special',
    preview: 'Article summary box',
    previewZh: '文章总结框',
    html: `
      <section style="margin: 24px 0; padding: 20px 24px; background: #f8f9fa; border-radius: 12px; border-top: 4px solid #3498db;">
        <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <section style="font-size: 18px;">📝</section>
          <section style="font-size: 16px; font-weight: bold; color: #3498db;">本文总结</section>
        </section>
        <section style="font-size: 14px; color: #555; line-height: 1.8;">
          <section style="margin-bottom: 8px;">• 要点一：简要描述</section>
          <section style="margin-bottom: 8px;">• 要点二：简要描述</section>
          <section>• 要点三：简要描述</section>
        </section>
      </section>
    `
  }
];

// --- Export All Templates ---
export const allDesignTemplates: DesignTemplate[] = [
  ...headerTemplates,
  ...cardTemplates,
  ...listTemplates,
  ...dividerTemplates,
  ...quoteTemplates,
  ...calloutTemplates,
  ...specialTemplates
];

// --- Get Templates by Category ---
export const getTemplatesByCategory = (category: DesignTemplate['category']): DesignTemplate[] => {
  return allDesignTemplates.filter(t => t.category === category);
};

// --- Get Template by ID ---
export const getTemplateById = (id: string): DesignTemplate | undefined => {
  return allDesignTemplates.find(t => t.id === id);
};

// --- Get All Categories ---
export const getCategories = (): { id: DesignTemplate['category']; name: string; nameZh: string; icon: string }[] => {
  return [
    { id: 'header', name: 'Headers', nameZh: '标题', icon: '📌' },
    { id: 'card', name: 'Cards', nameZh: '卡片', icon: '🎴' },
    { id: 'list', name: 'Lists', nameZh: '列表', icon: '📋' },
    { id: 'quote', name: 'Quotes', nameZh: '引用', icon: '💬' },
    { id: 'callout', name: 'Callouts', nameZh: '提示', icon: '💡' },
    { id: 'divider', name: 'Dividers', nameZh: '分割线', icon: '➖' },
    { id: 'special', name: 'Special', nameZh: '特殊', icon: '✨' }
  ];
};
