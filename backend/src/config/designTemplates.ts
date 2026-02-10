
/**
 * Design Templates Library - 精美设计格式库
 * 
 * A collection of pre-designed HTML templates for WeChat articles.
 * Each template provides beautiful, ready-to-use formatting.
 * 
 * BACKEND COPY - Source of Truth for API
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
          <p style="font-size: 32px; color: #07c160; font-weight: 300;"><span>【</span></p>
          <p style="font-size: 20px; font-weight: bold; color: #333; letter-spacing: 2px;"><span>在此输入标题</span></p>
          <p style="font-size: 32px; color: #07c160; font-weight: 300;"><span>】</span></p>
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
        <p style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px;"><span>在此输入标题</span></p>
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
        <p style="font-size: 20px; font-weight: bold; color: #333;"><span>在此输入标题</span></p>
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
          <p style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #07c160; color: #fff; font-size: 12px; padding: 4px 16px; border-radius: 12px;"><span>SECTION</span></p>
          <p style="font-size: 18px; font-weight: bold; color: #333;"><span>在此输入标题</span></p>
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
        <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 12px;"><span>💡 标题</span></p>
        <p style="font-size: 14px; color: #666; line-height: 1.8;"><span>在此输入内容描述，可以是要点总结、知识点或重要提示。</span></p>
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
          <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px;"><span>✨ 精选内容</span></p>
          <p style="font-size: 14px; color: #666; line-height: 1.8;"><span>在此输入内容，渐变边框让卡片更加醒目和精致。</span></p>
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
          <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 6px;"><span>知识要点</span></p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;"><span>在此输入要点内容，简洁明了地传达信息。</span></p>
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
        <p style="position: absolute; top: 12px; left: 16px; font-size: 48px; color: #d4af37; opacity: 0.5; font-family: Georgia, serif; line-height: 1;"><span>"</span></p>
        <p style="font-size: 15px; color: #555; line-height: 1.8; font-style: italic; padding-left: 20px;"><span>在此输入引用内容或名言警句，让文章更有深度。</span></p>
        <p style="text-align: right; margin-top: 12px; font-size: 13px; color: #888;"><span>—— 作者名</span></p>
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
          <p style="font-size: 14px; font-weight: bold; color: #07c160;"><span>小提示</span></p>
        </section>
        <p style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 28px;"><span>在此输入提示内容，帮助读者更好地理解要点。</span></p>
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
          <p style="font-size: 13px; color: #07c160; font-weight: bold; margin-bottom: 4px;"><span>步骤一</span></p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;"><span>在此描述第一步的内容和要点。</span></p>
        </section>
        <section style="margin-bottom: 20px; position: relative;">
          <section style="position: absolute; left: -27px; top: 0; width: 12px; height: 12px; background: #3498db; border-radius: 50%; border: 2px solid #fff;"></section>
          <p style="font-size: 13px; color: #3498db; font-weight: bold; margin-bottom: 4px;"><span>步骤二</span></p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;"><span>在此描述第二步的内容和要点。</span></p>
        </section>
        <section style="position: relative;">
          <section style="position: absolute; left: -27px; top: 0; width: 12px; height: 12px; background: #9b59b6; border-radius: 50%; border: 2px solid #fff;"></section>
          <p style="font-size: 13px; color: #9b59b6; font-weight: bold; margin-bottom: 4px;"><span>步骤三</span></p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;"><span>在此描述第三步的内容和要点。</span></p>
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
          <p style="font-size: 15px; color: #444; line-height: 1.6;"><span>第一条待办事项或要点说明</span></p>
        </section>
        <section style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <section style="width: 22px; height: 22px; background: linear-gradient(135deg, #07c160 0%, #10b981 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: #fff; font-size: 14px;">✓</section>
          <p style="font-size: 15px; color: #444; line-height: 1.6;"><span>第二条待办事项或要点说明</span></p>
        </section>
        <section style="display: flex; align-items: flex-start;">
          <section style="width: 22px; height: 22px; background: linear-gradient(135deg, #07c160 0%, #10b981 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: #fff; font-size: 14px;">✓</section>
          <p style="font-size: 15px; color: #444; line-height: 1.6;"><span>第三条待办事项或要点说明</span></p>
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
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第一点标题</span></p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;"><span>详细描述内容可以在这里展开。</span></p>
          </section>
        </section>
        <section style="display: flex; align-items: flex-start; margin-bottom: 16px;">
          <section style="width: 32px; height: 32px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0; color: #fff; font-size: 15px; font-weight: bold; box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);">2</section>
          <section style="flex: 1; padding-top: 4px;">
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第二点标题</span></p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;"><span>详细描述内容可以在这里展开。</span></p>
          </section>
        </section>
        <section style="display: flex; align-items: flex-start;">
          <section style="width: 32px; height: 32px; background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0; color: #fff; font-size: 15px; font-weight: bold; box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);">3</section>
          <section style="flex: 1; padding-top: 4px;">
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第三点标题</span></p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;"><span>详细描述内容可以在这里展开。</span></p>
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
        <p style="font-size: 18px;"><span>✦</span></p>
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
        <p style="font-size: 60px; color: #07c160; opacity: 0.3; line-height: 1;"><span>"</span></p>
        <p style="font-size: 16px; color: #555; font-style: italic; line-height: 1.8; margin: -10px 0 10px 0;"><span>在此输入引用内容，可以是名人名言、格言警句或重要观点。</span></p>
        <p style="font-size: 14px; color: #888;"><span>—— 作者姓名</span></p>
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
        <p style="font-size: 15px; color: #555; line-height: 1.8; font-style: italic; padding-left: 4px;"><span>在此输入引用内容，让文章更有说服力和深度。</span></p>
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
          <p style="font-size: 15px; font-weight: bold; color: #3498db;"><span>提示信息</span></p>
        </section>
        <p style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 34px;"><span>在此输入提示内容，帮助读者了解重要信息。</span></p>
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
          <p style="font-size: 15px; font-weight: bold; color: #f39c12;"><span>注意事项</span></p>
        </section>
        <p style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 34px;"><span>在此输入需要注意的内容，提醒读者关注。</span></p>
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
          <p style="font-size: 15px; font-weight: bold; color: #07c160;"><span>操作成功</span></p>
        </section>
        <p style="font-size: 14px; color: #555; line-height: 1.7; padding-left: 34px;"><span>在此输入成功信息或正面反馈内容。</span></p>
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
        <p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;"><span>感谢阅读</span></p>
        <p style="font-size: 14px; opacity: 0.9; margin-bottom: 16px;"><span>如果觉得有帮助，欢迎点赞和分享 ❤️</span></p>
        <section style="display: inline-flex; gap: 12px;">
          <p style="padding: 8px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 13px;"><span>👍 点赞</span></p>
          <p style="padding: 8px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 13px;"><span>↗ 分享</span></p>
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
          <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>作者名称</span></p>
          <p style="font-size: 13px; color: #888; line-height: 1.5;"><span>简短的作者介绍，可以写一两句话描述。</span></p>
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
          <p style="font-size: 20px;"><span>⭐</span></p>
          <p style="font-size: 16px; font-weight: bold; color: #d4af37;"><span>核心要点</span></p>
        </section>
        <p style="font-size: 15px; color: #555; line-height: 1.8;"><span>在此总结文章的核心观点或最重要的信息，帮助读者快速把握重点。</span></p>
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
        <p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;"><span>🎯 立即行动</span></p>
        <p style="font-size: 14px; opacity: 0.95; margin-bottom: 16px;"><span>现在就开始实践今天学到的内容吧！</span></p>
        <p style="display: inline-block; padding: 10px 28px; background: rgba(255,255,255,0.95); color: #fa5151; border-radius: 25px; font-size: 14px; font-weight: bold;"><span>开始尝试 →</span></p>
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
          <p style="font-size: 18px;"><span>📝</span></p>
          <p style="font-size: 16px; font-weight: bold; color: #3498db;"><span>本文总结</span></p>
        </section>
        <section style="font-size: 14px; color: #555; line-height: 1.8;">
          <section style="margin-bottom: 8px;">• 要点一：简要描述</section>
          <section style="margin-bottom: 8px;">• 要点二：简要描述</section>
          <section>• 要点三：简要描述</section>
        </section>
      </section>
    `
  },
  {
    id: 'seamless-long-hero',
    name: 'Seamless Hero + Text + Footer',
    nameZh: '无缝长图（头图-文字-尾图）',
    category: 'special',
    preview: 'Top image + colored text block + bottom image, stitched seamlessly',
    previewZh: '头图 + 文字块 + 尾图，无缝衔接长图',
    html: `
      <section style="max-width: 100%; margin: 0 auto; box-sizing: border-box;">
        <section style="line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x360/png" style="vertical-align: top; width: 100%; display: block;" />
        </section>
        <section style="margin-top: -1px; background-color: #89B630; padding: 22px; line-height: 1.75; font-size: 16px; color: #ffffff;">
          <p style="font-size: 18px; font-weight: bold; margin-bottom: 10px;"><span>欢迎来到办公技能培训</span></p>
          <section>这里填写正文，可介绍活动亮点、时间地点或引导读者继续阅读。背景色可按需替换（如 #89B630）。</section>
        </section>
        <section style="margin-top: -1px; line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x320/png" style="vertical-align: top; width: 100%; display: block;" />
        </section>
      </section>
    `
  },
  {
    id: 'seamless-gallery-triplet',
    name: 'Seamless Triple Image',
    nameZh: '无缝三图长条',
    category: 'special',
    preview: 'Three stacked images with zero gaps',
    previewZh: '三张图片垂直无缝衔接',
    html: `
      <section style="max-width: 100%; margin: 0 auto; box-sizing: border-box;">
        <section style="line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x320/png" style="vertical-align: top; width: 100%; display: block;" />
        </section>
        <section style="margin-top: -1px; line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x320/png?text=第二段" style="vertical-align: top; width: 100%; display: block;" />
        </section>
        <section style="margin-top: -1px; line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x320/png?text=第三段" style="vertical-align: top; width: 100%; display: block;" />
        </section>
      </section>
    `
  },
  {
    id: 'seamless-text-image-stack',
    name: 'Seamless Text + Image Stack',
    nameZh: '无缝文字/图片交错',
    category: 'special',
    preview: 'Alternating text and images stitched together',
    previewZh: '文字与图片交错无缝衔接',
    html: `
      <section style="max-width: 100%; margin: 0 auto; box-sizing: border-box;">
        <section style="line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x260/png?text=开头图" style="vertical-align: top; width: 100%; display: block;" />
        </section>
        <section style="margin-top: -1px; background-color: #0B7A75; padding: 20px; line-height: 1.75; font-size: 16px; color: #ffffff;">
          <section style="font-weight: bold; margin-bottom: 8px;">段落一：主题亮点</section>
          <section>用简洁文字描述核心价值或关键信息，强调色块能保证与上下图片无缝衔接。</section>
        </section>
        <section style="margin-top: -1px; line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x260/png?text=中部图" style="vertical-align: top; width: 100%; display: block;" />
        </section>
        <section style="margin-top: -1px; background-color: #0A5C85; padding: 20px; line-height: 1.75; font-size: 16px; color: #ffffff;">
          <section style="font-weight: bold; margin-bottom: 8px;">段落二：补充说明</section>
          <section>继续叙述细节、案例或引导动作，可根据需求调整背景色与内边距。</section>
        </section>
        <section style="margin-top: -1px; line-height: 0; font-size: 0; background-color: transparent;">
          <img src="https://placehold.co/900x260/png?text=收尾图" style="vertical-align: top; width: 100%; display: block;" />
        </section>
      </section>
    `
  }
];

// --- New Expanded Header Templates ---
const expandedHeaderTemplates: DesignTemplate[] = [
  {
    id: 'header-diamond',
    name: 'Diamond Header',
    nameZh: '钻石标题',
    category: 'header',
    preview: 'Header with diamond decorations',
    previewZh: '带钻石装饰的标题',
    html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="display: inline-flex; align-items: center; gap: 12px;">
          <p style="font-size: 20px; color: #f39c12;"><span>◆</span></p>
          <p style="font-size: 20px; font-weight: bold; color: #333; letter-spacing: 2px;"><span>在此输入标题</span></p>
          <p style="font-size: 20px; color: #f39c12;"><span>◆</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'header-wave',
    name: 'Wave Header',
    nameZh: '波浪标题',
    category: 'header',
    preview: 'Header with wave decoration',
    previewZh: '带波浪装饰的标题',
    html: `
      <section style="margin: 24px 0; text-align: center;">
        <p style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px;"><span>在此输入标题</span></p>
        <section style="width: 100px; height: 20px; margin: 0 auto;">
          <svg viewBox="0 0 100 20" style="width: 100%; height: 100%;">
            <path d="M0,10 Q25,0 50,10 T100,10" fill="none" stroke="#3498db" stroke-width="2"/>
          </svg>
        </section>
      </section>
    `
  },
  {
    id: 'header-gradient-bg',
    name: 'Gradient Background',
    nameZh: '渐变背景标题',
    category: 'header',
    preview: 'Header with gradient background',
    previewZh: '带渐变背景的标题',
    html: `
      <section style="margin: 24px 0; text-align: center;">
        <section style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 30px; color: #fff; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
          在此输入标题
        </section>
      </section>
    `
  },
  {
    id: 'header-label',
    name: 'Label Header',
    nameZh: '标签式标题',
    category: 'header',
    preview: 'Header with label decoration',
    previewZh: '带标签装饰的标题',
    html: `
      <section style="margin: 24px 0;">
        <section style="display: inline-flex; align-items: stretch;">
          <section style="width: 8px; background: linear-gradient(180deg, #fa5151 0%, #f39c12 100%); border-radius: 4px 0 0 4px;"></section>
          <p style="padding: 12px 20px; background: linear-gradient(90deg, #fff5f5 0%, #fff 100%); font-size: 18px; font-weight: bold; color: #333; border-radius: 0 8px 8px 0;"><span>在此输入标题</span></p>
        </section>
      </section>
    `
  }
];

// --- New Expanded Card Templates ---
const expandedCardTemplates: DesignTemplate[] = [
  {
    id: 'card-stat',
    name: 'Statistics Card',
    nameZh: '数据统计卡片',
    category: 'card',
    preview: 'Card for displaying statistics',
    previewZh: '用于展示统计数据的卡片',
    html: `
      <section style="margin: 20px 0; display: flex; gap: 16px;">
        <section style="flex: 1; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; color: #fff;">
          <p style="font-size: 32px; font-weight: bold;"><span>1000+</span></p>
          <p style="font-size: 12px; opacity: 0.9; margin-top: 4px;"><span>用户数量</span></p>
        </section>
        <section style="flex: 1; padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; text-align: center; color: #fff;">
          <p style="font-size: 32px; font-weight: bold;"><span>50%</span></p>
          <p style="font-size: 12px; opacity: 0.9; margin-top: 4px;"><span>增长率</span></p>
        </section>
        <section style="flex: 1; padding: 20px; background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%); border-radius: 12px; text-align: center; color: #fff;">
          <p style="font-size: 32px; font-weight: bold;"><span>99%</span></p>
          <p style="font-size: 12px; opacity: 0.9; margin-top: 4px;"><span>满意度</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'card-image-text',
    name: 'Image Text Card',
    nameZh: '图文卡片',
    category: 'card',
    preview: 'Card with image and text side by side',
    previewZh: '图片和文字并排的卡片',
    html: `
      <section style="margin: 20px 0; display: flex; background: #f8f9fa; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
        <section style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <p style="font-size: 40px;"><span>📷</span></p>
        </section>
        <section style="flex: 1; padding: 16px;">
          <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 8px;"><span>标题文字</span></p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;"><span>这里是描述文字，可以写一些简短的介绍内容。</span></p>
          <section style="margin-top: 12px;">
            <p style="display: inline-block; padding: 4px 12px; background: #667eea; color: #fff; font-size: 12px; border-radius: 12px;"><span>了解更多</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'card-feature',
    name: 'Feature Card',
    nameZh: '特性卡片',
    category: 'card',
    preview: 'Card for highlighting features',
    previewZh: '用于突出特性的卡片',
    html: `
      <section style="margin: 20px 0; display: flex; gap: 12px;">
        <section style="flex: 1; padding: 20px; background: #fff; border: 1px solid #eee; border-radius: 12px; text-align: center;">
          <section style="width: 48px; height: 48px; margin: 0 auto 12px; background: linear-gradient(135deg, #fa5151 0%, #f39c12 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🚀</section>
          <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;"><span>快速高效</span></p>
          <p style="font-size: 12px; color: #888; line-height: 1.5;"><span>简短描述文字</span></p>
        </section>
        <section style="flex: 1; padding: 20px; background: #fff; border: 1px solid #eee; border-radius: 12px; text-align: center;">
          <section style="width: 48px; height: 48px; margin: 0 auto 12px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🔒</section>
          <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;"><span>安全可靠</span></p>
          <p style="font-size: 12px; color: #888; line-height: 1.5;"><span>简短描述文字</span></p>
        </section>
        <section style="flex: 1; padding: 20px; background: #fff; border: 1px solid #eee; border-radius: 12px; text-align: center;">
          <section style="width: 48px; height: 48px; margin: 0 auto 12px; background: linear-gradient(135deg, #07c160 0%, #10b981 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">💡</section>
          <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;"><span>智能便捷</span></p>
          <p style="font-size: 12px; color: #888; line-height: 1.5;"><span>简短描述文字</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'card-testimonial',
    name: 'Testimonial Card',
    nameZh: '用户评价卡片',
    category: 'card',
    preview: 'Card for user testimonials',
    previewZh: '用户评价/推荐卡片',
    html: `
      <section style="margin: 20px 0; padding: 24px; background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%); border-radius: 16px; border: 1px solid #e8e8ff;">
        <section style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <section style="width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">👤</section>
          <section>
            <p style="font-size: 15px; font-weight: bold; color: #333;"><span>用户名</span></p>
            <p style="font-size: 12px; color: #888;"><span>职位/身份</span></p>
          </section>
          <p style="margin-left: auto; color: #f39c12; font-size: 14px;"><span>★★★★★</span></p>
        </section>
        <p style="font-size: 14px; color: #555; line-height: 1.8; font-style: italic;"><span>"这里是用户的评价内容，描述他们的使用体验和感受。"</span></p>
      </section>
    `
  }
];

// --- New Expanded List Templates ---
const expandedListTemplates: DesignTemplate[] = [
  {
    id: 'list-icons',
    name: 'Icon List',
    nameZh: '图标列表',
    category: 'list',
    preview: 'List with decorative icons',
    previewZh: '带装饰图标的列表',
    html: `
      <section style="margin: 20px 0;">
        <section style="display: flex; align-items: flex-start; margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
          <p style="font-size: 24px; margin-right: 12px;"><span>✅</span></p>
          <section>
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第一点功能特性</span></p>
            <p style="font-size: 13px; color: #666;"><span>简短的描述说明文字</span></p>
          </section>
        </section>
        <section style="display: flex; align-items: flex-start; margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
          <p style="font-size: 24px; margin-right: 12px;"><span>✅</span></p>
          <section>
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第二点功能特性</span></p>
            <p style="font-size: 13px; color: #666;"><span>简短的描述说明文字</span></p>
          </section>
        </section>
        <section style="display: flex; align-items: flex-start; padding: 12px; background: #f8f9fa; border-radius: 8px;">
          <p style="font-size: 24px; margin-right: 12px;"><span>✅</span></p>
          <section>
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第三点功能特性</span></p>
            <p style="font-size: 13px; color: #666;"><span>简短的描述说明文字</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'list-steps-vertical',
    name: 'Vertical Steps',
    nameZh: '竖向步骤条',
    category: 'list',
    preview: 'Vertical step-by-step list',
    previewZh: '竖向步骤列表',
    html: `
      <section style="margin: 20px 0; padding-left: 30px; position: relative;">
        <section style="position: absolute; left: 11px; top: 20px; bottom: 20px; width: 2px; background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);"></section>
        
        <section style="margin-bottom: 24px; position: relative;">
          <section style="position: absolute; left: -24px; width: 24px; height: 24px; background: #667eea; border-radius: 50%; color: #fff; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);">1</section>
          <section style="background: #f8f9ff; padding: 16px; border-radius: 8px; margin-left: 12px;">
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第一步：准备工作</span></p>
            <p style="font-size: 13px; color: #666; line-height: 1.6;"><span>详细描述这一步需要做什么</span></p>
          </section>
        </section>
        
        <section style="margin-bottom: 24px; position: relative;">
          <section style="position: absolute; left: -24px; width: 24px; height: 24px; background: #9b59b6; border-radius: 50%; color: #fff; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(155, 89, 182, 0.4);">2</section>
          <section style="background: #faf5ff; padding: 16px; border-radius: 8px; margin-left: 12px;">
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第二步：执行操作</span></p>
            <p style="font-size: 13px; color: #666; line-height: 1.6;"><span>详细描述这一步需要做什么</span></p>
          </section>
        </section>
        
        <section style="position: relative;">
          <section style="position: absolute; left: -24px; width: 24px; height: 24px; background: #764ba2; border-radius: 50%; color: #fff; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(118, 75, 162, 0.4);">3</section>
          <section style="background: #f5f0ff; padding: 16px; border-radius: 8px; margin-left: 12px;">
            <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>第三步：完成确认</span></p>
            <p style="font-size: 13px; color: #666; line-height: 1.6;"><span>详细描述这一步需要做什么</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'list-comparison',
    name: 'Comparison List',
    nameZh: '对比列表',
    category: 'list',
    preview: 'Before/After comparison list',
    previewZh: '前后对比列表',
    html: `
      <section style="margin: 20px 0; display: flex; gap: 16px;">
        <section style="flex: 1; padding: 20px; background: #fff5f5; border-radius: 12px; border: 1px solid #ffc2c2;">
          <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <p style="font-size: 20px;"><span>❌</span></p>
            <p style="font-size: 16px; font-weight: bold; color: #fa5151;"><span>之前</span></p>
          </section>
          <section style="font-size: 14px; color: #666; line-height: 1.6;">
            <section style="margin-bottom: 8px;">• 问题点一</section>
            <section style="margin-bottom: 8px;">• 问题点二</section>
            <section>• 问题点三</section>
          </section>
        </section>
        <section style="flex: 1; padding: 20px; background: #f6fffa; border-radius: 12px; border: 1px solid #b7ebb5;">
          <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <p style="font-size: 20px;"><span>✅</span></p>
            <p style="font-size: 16px; font-weight: bold; color: #07c160;"><span>之后</span></p>
          </section>
          <section style="font-size: 14px; color: #666; line-height: 1.6;">
            <section style="margin-bottom: 8px;">• 改进点一</section>
            <section style="margin-bottom: 8px;">• 改进点二</section>
            <section>• 改进点三</section>
          </section>
        </section>
      </section>
    `
  }
];

// --- New Expanded Special Templates ---
const expandedSpecialTemplates: DesignTemplate[] = [
  {
    id: 'special-qrcode-box',
    name: 'QR Code Box',
    nameZh: '二维码区域',
    category: 'special',
    preview: 'Box for QR code with text',
    previewZh: '带说明的二维码区域',
    html: `
      <section style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%); border-radius: 16px; border: 2px solid #667eea; text-align: center;">
        <section style="width: 120px; height: 120px; margin: 0 auto 16px; background: #fff; border: 2px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <p style="font-size: 48px;"><span>📱</span></p>
        </section>
        <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 8px;"><span>扫码关注公众号</span></p>
        <p style="font-size: 14px; color: #888;"><span>获取更多精彩内容</span></p>
      </section>
    `
  },
  {
    id: 'special-gift-box',
    name: 'Gift/Offer Box',
    nameZh: '福利/优惠框',
    category: 'special',
    preview: 'Promotional gift or offer box',
    previewZh: '促销福利框',
    html: `
      <section style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); border-radius: 16px; text-align: center; color: #fff; position: relative; overflow: hidden;">
        <section style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%;"></section>
        <section style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></section>
        <p style="font-size: 28px; margin-bottom: 8px;"><span>🎁</span></p>
        <p style="font-size: 20px; font-weight: bold; margin-bottom: 8px;"><span>限时福利</span></p>
        <p style="font-size: 14px; opacity: 0.95; margin-bottom: 16px;"><span>在此描述福利内容和优惠详情</span></p>
        <p style="display: inline-block; padding: 10px 24px; background: #fff; color: #ff6b6b; font-size: 14px; font-weight: bold; border-radius: 20px;"><span>立即领取</span></p>
      </section>
    `
  },
  {
    id: 'special-faq',
    name: 'FAQ Section',
    nameZh: 'FAQ问答区',
    category: 'special',
    preview: 'Frequently asked questions section',
    previewZh: '常见问题解答区',
    html: `
      <section style="margin: 24px 0;">
        <section style="margin-bottom: 16px; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
          <section style="padding: 16px 20px; background: #667eea; color: #fff; font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <section>Q</section>
            <section>这里是问题标题？</section>
          </section>
          <section style="padding: 16px 20px; font-size: 14px; color: #555; line-height: 1.7; display: flex; align-items: flex-start; gap: 8px;">
            <p style="color: #667eea; font-weight: bold;"><span>A</span></p>
            <section>这里是问题的详细解答内容，可以写多行文字来说明。</section>
          </section>
        </section>
        <section style="margin-bottom: 16px; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
          <section style="padding: 16px 20px; background: #9b59b6; color: #fff; font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <section>Q</section>
            <section>第二个问题在这里？</section>
          </section>
          <section style="padding: 16px 20px; font-size: 14px; color: #555; line-height: 1.7; display: flex; align-items: flex-start; gap: 8px;">
            <p style="color: #9b59b6; font-weight: bold;"><span>A</span></p>
            <section>这里是问题的详细解答内容，可以写多行文字来说明。</section>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'special-contact',
    name: 'Contact Info',
    nameZh: '联系方式',
    category: 'special',
    preview: 'Contact information section',
    previewZh: '联系方式展示区',
    html: `
      <section style="margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 12px;">
        <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 16px; text-align: center;"><span>📞 联系我们</span></p>
        <section style="display: flex; gap: 12px; flex-wrap: wrap;">
          <section style="flex: 1; min-width: 140px; padding: 12px; background: #fff; border-radius: 8px; text-align: center;">
            <p style="font-size: 20px; margin-bottom: 6px;"><span>📧</span></p>
            <p style="font-size: 12px; color: #888; margin-bottom: 4px;"><span>邮箱</span></p>
            <p style="font-size: 13px; color: #333;"><span>email@example.com</span></p>
          </section>
          <section style="flex: 1; min-width: 140px; padding: 12px; background: #fff; border-radius: 8px; text-align: center;">
            <p style="font-size: 20px; margin-bottom: 6px;"><span>📱</span></p>
            <p style="font-size: 12px; color: #888; margin-bottom: 4px;"><span>电话</span></p>
            <p style="font-size: 13px; color: #333;"><span>400-123-4567</span></p>
          </section>
          <section style="flex: 1; min-width: 140px; padding: 12px; background: #fff; border-radius: 8px; text-align: center;">
            <p style="font-size: 20px; margin-bottom: 6px;"><span>📍</span></p>
            <p style="font-size: 12px; color: #888; margin-bottom: 4px;"><span>地址</span></p>
            <p style="font-size: 13px; color: #333;"><span>北京市朝阳区</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'special-progress',
    name: 'Progress Bar',
    nameZh: '进度条',
    category: 'special',
    preview: 'Progress indicator section',
    previewZh: '进度展示区',
    html: `
      <section style="margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 12px;">
        <section style="margin-bottom: 16px;">
          <section style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <p style="font-size: 14px; font-weight: bold; color: #333;"><span>进度一</span></p>
            <p style="font-size: 14px; color: #667eea; font-weight: bold;"><span>80%</span></p>
          </section>
          <section style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
            <section style="width: 80%; height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); border-radius: 4px;"></section>
          </section>
        </section>
        <section style="margin-bottom: 16px;">
          <section style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <p style="font-size: 14px; font-weight: bold; color: #333;"><span>进度二</span></p>
            <p style="font-size: 14px; color: #07c160; font-weight: bold;"><span>60%</span></p>
          </section>
          <section style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
            <section style="width: 60%; height: 100%; background: linear-gradient(90deg, #07c160 0%, #10b981 100%); border-radius: 4px;"></section>
          </section>
        </section>
        <section>
          <section style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <p style="font-size: 14px; font-weight: bold; color: #333;"><span>进度三</span></p>
            <p style="font-size: 14px; color: #f39c12; font-weight: bold;"><span>45%</span></p>
          </section>
          <section style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
            <section style="width: 45%; height: 100%; background: linear-gradient(90deg, #f39c12 0%, #fa5151 100%); border-radius: 4px;"></section>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'special-countdown',
    name: 'Countdown',
    nameZh: '倒计时',
    category: 'special',
    preview: 'Countdown timer display',
    previewZh: '倒计时展示',
    html: `
      <section style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; text-align: center; color: #fff;">
        <p style="font-size: 14px; color: #feca57; margin-bottom: 16px; letter-spacing: 2px;"><span>⏰ 距离活动开始还有</span></p>
        <section style="display: flex; justify-content: center; gap: 12px;">
          <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <p style="font-size: 28px; font-weight: bold;"><span>03</span></p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;"><span>天</span></p>
          </section>
          <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <p style="font-size: 28px; font-weight: bold;"><span>12</span></p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;"><span>时</span></p>
          </section>
          <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <p style="font-size: 28px; font-weight: bold;"><span>45</span></p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;"><span>分</span></p>
          </section>
          <section style="padding: 16px 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <p style="font-size: 28px; font-weight: bold;"><span>30</span></p>
            <p style="font-size: 12px; opacity: 0.8; margin-top: 4px;"><span>秒</span></p>
          </section>
        </section>
      </section>
    `
  }
];

// --- New Divider Templates ---
const expandedDividerTemplates: DesignTemplate[] = [
  {
    id: 'divider-emoji',
    name: 'Emoji Divider',
    nameZh: '表情分割线',
    category: 'divider',
    preview: 'Divider with emojis',
    previewZh: '带表情的分割线',
    html: `
      <section style="margin: 30px 0; text-align: center; font-size: 16px; letter-spacing: 8px;">
        🌟 ✨ 🌟
      </section>
    `
  },
  {
    id: 'divider-double-line',
    name: 'Double Line',
    nameZh: '双线分割线',
    category: 'divider',
    preview: 'Elegant double line divider',
    previewZh: '优雅双线分割线',
    html: `
      <section style="margin: 30px 0; text-align: center;">
        <section style="display: inline-block; width: 60%;">
          <section style="height: 1px; background: linear-gradient(90deg, transparent, #ddd, transparent); margin-bottom: 3px;"></section>
          <section style="height: 1px; background: linear-gradient(90deg, transparent, #ddd, transparent);"></section>
        </section>
      </section>
    `
  },
  {
    id: 'divider-text',
    name: 'Text Divider',
    nameZh: '文字分割线',
    category: 'divider',
    preview: 'Divider with text in middle',
    previewZh: '中间带文字的分割线',
    html: `
      <section style="margin: 30px 0; display: flex; align-items: center; justify-content: center; gap: 16px;">
        <section style="flex: 1; max-width: 80px; height: 1px; background: linear-gradient(90deg, transparent, #ddd);"></section>
        <p style="font-size: 12px; color: #888; white-space: nowrap;"><span>— 分割线文字 —</span></p>
        <section style="flex: 1; max-width: 80px; height: 1px; background: linear-gradient(90deg, #ddd, transparent);"></section>
      </section>
    `
  }
];

// --- Rich Layout Templates (丰富的排版布局模板) ---
// These templates demonstrate diverse visual compositions using existing block types
const richLayoutTemplates: DesignTemplate[] = [
  // --- Header Layout Variations ---
  {
    id: 'header-icon-left',
    name: 'Icon Left Header',
    nameZh: '图标左侧标题',
    category: 'header',
    preview: 'Header with emoji icon on left',
    previewZh: '左侧emoji图标标题',
    html: `
      <section style="margin: 24px 0; display: flex; align-items: center; gap: 12px;">
        <section style="width: 42px; height: 42px; background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(13,148,136,0.3);">📌</section>
        <section>
          <p style="font-size: 18px; font-weight: bold; color: #333;"><span>在此输入标题</span></p>
          <p style="font-size: 12px; color: #999; margin-top: 2px;"><span>副标题描述文字</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'header-center-deco',
    name: 'Center Decorated Header',
    nameZh: '居中装饰标题',
    category: 'header',
    preview: 'Centered header with decorative elements',
    previewZh: '带装饰元素的居中标题',
    html: `
      <section style="margin: 30px 0; text-align: center;">
        <section style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
          <section style="width: 30px; height: 2px; background: linear-gradient(90deg, transparent, #e11d48);"></section>
          <p style="font-size: 13px; color: #e11d48; letter-spacing: 4px;"><span>✦ CHAPTER ✦</span></p>
          <section style="width: 30px; height: 2px; background: linear-gradient(90deg, #e11d48, transparent);"></section>
        </section>
        <p style="font-size: 22px; font-weight: bold; color: #333; letter-spacing: 1px;"><span>在此输入标题</span></p>
        <section style="width: 40px; height: 3px; background: linear-gradient(90deg, #e11d48, #f97316); border-radius: 2px; margin: 10px auto 0;"></section>
      </section>
    `
  },
  {
    id: 'header-full-bg',
    name: 'Full Background Header',
    nameZh: '全背景色标题',
    category: 'header',
    preview: 'Header with full-width background color',
    previewZh: '全宽背景色标题',
    html: `
      <section style="margin: 24px 0; padding: 20px 24px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 12px; position: relative; overflow: hidden;">
        <section style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></section>
        <section style="position: absolute; bottom: -10px; left: 30px; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%;"></section>
        <p style="font-size: 13px; color: rgba(255,255,255,0.7); letter-spacing: 2px; margin-bottom: 6px;"><span>SECTION TITLE</span></p>
        <p style="font-size: 20px; font-weight: bold; color: #fff;"><span>在此输入标题</span></p>
      </section>
    `
  },
  {
    id: 'header-side-stripe',
    name: 'Side Stripe Header',
    nameZh: '侧边条纹标题',
    category: 'header',
    preview: 'Header with colorful side stripe',
    previewZh: '彩色侧边条纹标题',
    html: `
      <section style="margin: 24px 0; display: flex; align-items: stretch;">
        <section style="width: 6px; background: linear-gradient(180deg, #f97316, #ef4444, #ec4899); border-radius: 3px; margin-right: 14px;"></section>
        <section>
          <p style="font-size: 19px; font-weight: bold; color: #333;"><span>在此输入标题</span></p>
          <p style="font-size: 13px; color: #888; margin-top: 4px;"><span>这是一个带有侧边彩色条纹的标题样式</span></p>
        </section>
      </section>
    `
  },

  // --- Content Card Layout Variations ---
  {
    id: 'card-gradient-top',
    name: 'Gradient Top Card',
    nameZh: '渐变顶部卡片',
    category: 'card',
    preview: 'Card with gradient top border',
    previewZh: '顶部渐变边框卡片',
    html: `
      <section style="margin: 20px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <section style="height: 4px; background: linear-gradient(90deg, #fa5151, #f39c12, #07c160, #3498db, #9b59b6);"></section>
        <section style="padding: 20px;">
          <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px;"><span>💡 卡片标题</span></p>
          <p style="font-size: 14px; color: #666; line-height: 1.8;"><span>在此输入卡片内容，这种布局适合展示重要信息或总结要点。</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'card-icon-feature',
    name: 'Icon Feature Card',
    nameZh: '图标特色卡片',
    category: 'card',
    preview: 'Feature card with large icon',
    previewZh: '带大图标的特色卡片',
    html: `
      <section style="margin: 20px 0; padding: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%); border-radius: 12px; border: 1px solid #a7f3d0; text-align: center;">
        <p style="font-size: 36px; margin-bottom: 12px;"><span>🎯</span></p>
        <p style="font-size: 17px; font-weight: bold; color: #0d9488; margin-bottom: 8px;"><span>特色功能标题</span></p>
        <p style="font-size: 14px; color: #555; line-height: 1.7;"><span>在此输入特色说明，这种卡片适合展示产品特色或核心卖点。</span></p>
      </section>
    `
  },
  {
    id: 'card-stats-row',
    name: 'Stats Row Card',
    nameZh: '数据统计行卡片',
    category: 'card',
    preview: 'Horizontal stats display card',
    previewZh: '横向数据统计展示',
    html: `
      <section style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px;">
        <section style="display: flex; justify-content: space-around; text-align: center;">
          <section>
            <p style="font-size: 28px; font-weight: bold; color: #feca57;"><span>100+</span></p>
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;"><span>合作伙伴</span></p>
          </section>
          <section style="width: 1px; background: rgba(255,255,255,0.15);"></section>
          <section>
            <p style="font-size: 28px; font-weight: bold; color: #48dbfb;"><span>50万</span></p>
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;"><span>服务用户</span></p>
          </section>
          <section style="width: 1px; background: rgba(255,255,255,0.15);"></section>
          <section>
            <p style="font-size: 28px; font-weight: bold; color: #ff6b6b;"><span>99%</span></p>
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;"><span>满意度</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'card-quote-golden',
    name: 'Golden Quote Card',
    nameZh: '金句卡片',
    category: 'card',
    preview: 'Beautiful golden quote card',
    previewZh: '精美金句卡片',
    html: `
      <section style="margin: 24px 0; padding: 28px 24px; background: linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%); border-radius: 16px; text-align: center; position: relative;">
        <p style="font-size: 40px; color: rgba(255,215,0,0.3); position: absolute; top: 10px; left: 20px;"><span>"</span></p>
        <p style="font-size: 17px; color: #fff; line-height: 1.8; font-style: italic; padding: 0 20px;"><span>在此输入金句内容，一句话打动读者的心</span></p>
        <section style="width: 40px; height: 2px; background: linear-gradient(90deg, #d4af37, #ffd700); margin: 16px auto 12px;"></section>
        <p style="font-size: 13px; color: rgba(255,255,255,0.6);"><span>—— 作者姓名</span></p>
        <p style="font-size: 40px; color: rgba(255,215,0,0.3); position: absolute; bottom: 10px; right: 20px;"><span>"</span></p>
      </section>
    `
  },
  {
    id: 'card-highlight-box',
    name: 'Highlight Box',
    nameZh: '重点高亮框',
    category: 'card',
    preview: 'Highlighted information box',
    previewZh: '高亮信息展示框',
    html: `
      <section style="margin: 20px 0; padding: 20px 24px; background-color: #fffbeb; border-left: 5px solid #d97706; border-radius: 0 8px 8px 0; position: relative;">
        <p style="position: absolute; top: -8px; left: 12px; background: #d97706; color: #fff; font-size: 11px; padding: 2px 10px; border-radius: 0 0 6px 6px; font-weight: bold;"><span>⚡ 划重点</span></p>
        <p style="font-size: 15px; color: #92400e; line-height: 1.8; margin-top: 8px;"><span>在此输入重点内容，这种布局非常适合突出关键信息或重要提醒。</span></p>
      </section>
    `
  },

  // --- List Layout Variations ---
  {
    id: 'list-checklist',
    name: 'Checklist Style',
    nameZh: '打勾清单列表',
    category: 'list',
    preview: 'Checklist with green checks',
    previewZh: '绿色打勾清单',
    html: `
      <section style="margin: 20px 0; padding: 20px; background-color: #f6fffa; border-radius: 12px; border: 1px solid #e0f2e9;">
        <p style="font-size: 16px; font-weight: bold; color: #07c160; margin-bottom: 14px;"><span>✅ 清单标题</span></p>
        <section style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e0f2e9;">
          <section style="width: 20px; height: 20px; background: #07c160; border-radius: 50%; color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0;">✓</section>
          <p style="font-size: 14px; color: #555;"><span>第一个清单项目</span></p>
        </section>
        <section style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e0f2e9;">
          <section style="width: 20px; height: 20px; background: #07c160; border-radius: 50%; color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0;">✓</section>
          <p style="font-size: 14px; color: #555;"><span>第二个清单项目</span></p>
        </section>
        <section style="display: flex; align-items: center; padding: 8px 0;">
          <section style="width: 20px; height: 20px; background: #07c160; border-radius: 50%; color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0;">✓</section>
          <p style="font-size: 14px; color: #555;"><span>第三个清单项目</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'list-tag-prefix',
    name: 'Tag Prefix List',
    nameZh: '标签前缀列表',
    category: 'list',
    preview: 'List with colorful tag prefixes',
    previewZh: '彩色标签前缀列表',
    html: `
      <section style="margin: 20px 0;">
        <section style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <p style="padding: 2px 10px; background-color: #fa5151; color: #fff; font-size: 12px; border-radius: 4px; margin-right: 10px; flex-shrink: 0; font-weight: bold;"><span>01</span></p>
          <p style="font-size: 14px; color: #444; line-height: 1.6;"><span>列表项目内容一</span></p>
        </section>
        <section style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <p style="padding: 2px 10px; background-color: #3498db; color: #fff; font-size: 12px; border-radius: 4px; margin-right: 10px; flex-shrink: 0; font-weight: bold;"><span>02</span></p>
          <p style="font-size: 14px; color: #444; line-height: 1.6;"><span>列表项目内容二</span></p>
        </section>
        <section style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <p style="padding: 2px 10px; background-color: #9b59b6; color: #fff; font-size: 12px; border-radius: 4px; margin-right: 10px; flex-shrink: 0; font-weight: bold;"><span>03</span></p>
          <p style="font-size: 14px; color: #444; line-height: 1.6;"><span>列表项目内容三</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'list-icon-card',
    name: 'Icon Card List',
    nameZh: '图标卡片列表',
    category: 'list',
    preview: 'List items as mini cards with icons',
    previewZh: '图标迷你卡片列表',
    html: `
      <section style="margin: 20px 0;">
        <section style="display: flex; align-items: center; padding: 14px 16px; background-color: #eef2ff; border-radius: 10px; margin-bottom: 10px;">
          <p style="font-size: 22px; margin-right: 12px;"><span>🚀</span></p>
          <section>
            <p style="font-size: 15px; font-weight: bold; color: #4f46e5;"><span>项目标题</span></p>
            <p style="font-size: 13px; color: #666; margin-top: 2px;"><span>简短描述说明</span></p>
          </section>
        </section>
        <section style="display: flex; align-items: center; padding: 14px 16px; background-color: #fff1f2; border-radius: 10px; margin-bottom: 10px;">
          <p style="font-size: 22px; margin-right: 12px;"><span>💡</span></p>
          <section>
            <p style="font-size: 15px; font-weight: bold; color: #e11d48;"><span>项目标题</span></p>
            <p style="font-size: 13px; color: #666; margin-top: 2px;"><span>简短描述说明</span></p>
          </section>
        </section>
        <section style="display: flex; align-items: center; padding: 14px 16px; background-color: #f0fdfa; border-radius: 10px;">
          <p style="font-size: 22px; margin-right: 12px;"><span>🎯</span></p>
          <section>
            <p style="font-size: 15px; font-weight: bold; color: #0d9488;"><span>项目标题</span></p>
            <p style="font-size: 13px; color: #666; margin-top: 2px;"><span>简短描述说明</span></p>
          </section>
        </section>
      </section>
    `
  },

  // --- Quote Layout Variations ---
  {
    id: 'quote-bubble',
    name: 'Speech Bubble Quote',
    nameZh: '对话气泡引用',
    category: 'quote',
    preview: 'Quote styled as speech bubble',
    previewZh: '对话气泡风格引用',
    html: `
      <section style="margin: 24px 0;">
        <section style="padding: 18px 22px; background-color: #eef2ff; border-radius: 16px 16px 16px 4px; position: relative;">
          <p style="font-size: 15px; color: #4f46e5; line-height: 1.8; font-style: italic;"><span>"在此输入引用内容，这种气泡样式非常适合对话或名人名言。"</span></p>
        </section>
        <section style="display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-left: 12px;">
          <section style="width: 32px; height: 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: bold;">A</section>
          <p style="font-size: 13px; color: #666;"><span>作者姓名 · 身份/来源</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'quote-large-mark',
    name: 'Large Quote Mark',
    nameZh: '大引号引用',
    category: 'quote',
    preview: 'Quote with oversized quote marks',
    previewZh: '带超大引号的引用',
    html: `
      <section style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%); border-radius: 12px; position: relative;">
        <p style="font-size: 60px; color: #d4c4e8; position: absolute; top: 0; left: 16px; line-height: 1;"><span>"</span></p>
        <p style="font-size: 16px; color: #555; line-height: 1.9; padding: 20px 10px 0 40px; font-style: italic;"><span>在此输入引用文字内容，大引号装饰让引用更加醒目和有设计感。</span></p>
        <p style="text-align: right; margin-top: 12px; font-size: 13px; color: #9b59b6;"><span>—— 来源出处</span></p>
      </section>
    `
  },

  // --- Callout/Notice Layout Variations ---
  {
    id: 'callout-warm-tip',
    name: 'Warm Tip Box',
    nameZh: '温馨提示框',
    category: 'callout',
    preview: 'Warm-styled tip callout',
    previewZh: '暖色温馨提示',
    html: `
      <section style="margin: 20px 0; padding: 18px 20px; background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%); border-radius: 12px; border: 1px solid #fed7aa;">
        <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <p style="font-size: 18px;"><span>🌟</span></p>
          <p style="font-size: 15px; font-weight: bold; color: #d97706;"><span>温馨提示</span></p>
        </section>
        <p style="font-size: 14px; color: #92400e; line-height: 1.7; padding-left: 26px;"><span>在此输入提示内容，适合放置友好提醒或注意事项。</span></p>
      </section>
    `
  },
  {
    id: 'callout-gradient-notice',
    name: 'Gradient Notice',
    nameZh: '渐变通知框',
    category: 'callout',
    preview: 'Gradient background notice',
    previewZh: '渐变背景通知',
    html: `
      <section style="margin: 20px 0; border-radius: 12px; overflow: hidden;">
        <section style="padding: 12px 20px; background: linear-gradient(90deg, #4f46e5, #7c3aed); display: flex; align-items: center; gap: 8px;">
          <p style="font-size: 16px;"><span>📢</span></p>
          <p style="font-size: 14px; font-weight: bold; color: #fff;"><span>重要公告</span></p>
        </section>
        <p style="padding: 16px 20px; background-color: #eef2ff; font-size: 14px; color: #555; line-height: 1.7;"><span>在此输入通知详情内容，渐变头部吸引注意力。</span></p>
      </section>
    `
  },

  // --- Special Section Layout Variations ---
  {
    id: 'special-feature-grid',
    name: 'Feature Grid',
    nameZh: '特色网格',
    category: 'special',
    preview: '2x2 feature grid layout',
    previewZh: '2x2特色展示网格',
    html: `
      <section style="margin: 24px 0;">
        <section style="display: flex; gap: 10px; margin-bottom: 10px;">
          <section style="flex: 1; padding: 20px; background-color: #eef2ff; border-radius: 12px; text-align: center;">
            <p style="font-size: 28px; margin-bottom: 8px;"><span>🎨</span></p>
            <p style="font-size: 14px; font-weight: bold; color: #4f46e5; margin-bottom: 4px;"><span>特色标题</span></p>
            <p style="font-size: 12px; color: #888;"><span>简短说明文字</span></p>
          </section>
          <section style="flex: 1; padding: 20px; background-color: #fff1f2; border-radius: 12px; text-align: center;">
            <p style="font-size: 28px; margin-bottom: 8px;"><span>⚡</span></p>
            <p style="font-size: 14px; font-weight: bold; color: #e11d48; margin-bottom: 4px;"><span>特色标题</span></p>
            <p style="font-size: 12px; color: #888;"><span>简短说明文字</span></p>
          </section>
        </section>
        <section style="display: flex; gap: 10px;">
          <section style="flex: 1; padding: 20px; background-color: #f0fdfa; border-radius: 12px; text-align: center;">
            <p style="font-size: 28px; margin-bottom: 8px;"><span>💎</span></p>
            <p style="font-size: 14px; font-weight: bold; color: #0d9488; margin-bottom: 4px;"><span>特色标题</span></p>
            <p style="font-size: 12px; color: #888;"><span>简短说明文字</span></p>
          </section>
          <section style="flex: 1; padding: 20px; background-color: #fffbeb; border-radius: 12px; text-align: center;">
            <p style="font-size: 28px; margin-bottom: 8px;"><span>🏆</span></p>
            <p style="font-size: 14px; font-weight: bold; color: #d97706; margin-bottom: 4px;"><span>特色标题</span></p>
            <p style="font-size: 12px; color: #888;"><span>简短说明文字</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'special-step-flow',
    name: 'Step Flow Layout',
    nameZh: '步骤流程布局',
    category: 'special',
    preview: 'Horizontal step flow with arrows',
    previewZh: '水平步骤流程带箭头',
    html: `
      <section style="margin: 24px 0; padding: 20px; background-color: #f8f9ff; border-radius: 12px;">
        <p style="font-size: 16px; font-weight: bold; color: #4f46e5; text-align: center; margin-bottom: 16px;"><span>📋 操作流程</span></p>
        <section style="display: flex; align-items: center; justify-content: center; gap: 4px;">
          <section style="text-align: center; flex: 1;">
            <section style="width: 36px; height: 36px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 50%; color: #fff; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">1</section>
            <p style="font-size: 13px; color: #555; font-weight: 500;"><span>第一步</span></p>
          </section>
          <p style="color: #c7d2fe; font-size: 16px;"><span>→</span></p>
          <section style="text-align: center; flex: 1;">
            <section style="width: 36px; height: 36px; background: linear-gradient(135deg, #0d9488, #10b981); border-radius: 50%; color: #fff; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">2</section>
            <p style="font-size: 13px; color: #555; font-weight: 500;"><span>第二步</span></p>
          </section>
          <p style="color: #a7f3d0; font-size: 16px;"><span>→</span></p>
          <section style="text-align: center; flex: 1;">
            <section style="width: 36px; height: 36px; background: linear-gradient(135deg, #d97706, #f59e0b); border-radius: 50%; color: #fff; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">3</section>
            <p style="font-size: 13px; color: #555; font-weight: 500;"><span>第三步</span></p>
          </section>
          <p style="color: #fde68a; font-size: 16px;"><span>→</span></p>
          <section style="text-align: center; flex: 1;">
            <section style="width: 36px; height: 36px; background: linear-gradient(135deg, #e11d48, #f43f5e); border-radius: 50%; color: #fff; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;">4</section>
            <p style="font-size: 13px; color: #555; font-weight: 500;"><span>完成</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'special-info-banner',
    name: 'Info Banner',
    nameZh: '信息横幅',
    category: 'special',
    preview: 'Full-width info banner with gradient',
    previewZh: '全宽渐变信息横幅',
    html: `
      <section style="margin: 24px 0; padding: 24px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; position: relative; overflow: hidden;">
        <section style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.08); border-radius: 50%;"></section>
        <section style="position: absolute; bottom: -20px; left: -20px; width: 60px; height: 60px; background: rgba(255,255,255,0.05); border-radius: 50%;"></section>
        <p style="font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 8px;"><span>横幅主标题</span></p>
        <p style="font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.6;"><span>在此输入横幅描述文字，适合重要公告或活动宣传。</span></p>
      </section>
    `
  },
  {
    id: 'special-testimonial-card',
    name: 'Testimonial Card',
    nameZh: '用户评价卡片',
    category: 'special',
    preview: 'User testimonial with avatar',
    previewZh: '带头像的用户评价',
    html: `
      <section style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 12px;">
        <section style="display: flex; gap: 14px;">
          <section style="width: 44px; height: 44px; background: linear-gradient(135deg, #e11d48, #f43f5e); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: bold; flex-shrink: 0;">U</section>
          <section style="flex: 1;">
            <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <p style="font-size: 15px; font-weight: bold; color: #333;"><span>用户名称</span></p>
              <p style="font-size: 12px; color: #f39c12;"><span>★★★★★</span></p>
            </section>
            <p style="font-size: 14px; color: #666; line-height: 1.7; font-style: italic;"><span>"在此输入用户评价内容，真实的反馈能增强说服力。"</span></p>
          </section>
        </section>
      </section>
    `
  },

  // --- Divider Layout Variations ---
  {
    id: 'divider-rainbow',
    name: 'Rainbow Divider',
    nameZh: '彩虹分割线',
    category: 'divider',
    preview: 'Colorful rainbow divider line',
    previewZh: '彩色彩虹分割线',
    html: `
      <section style="margin: 30px 0; padding: 0 20px;">
        <section style="height: 3px; background: linear-gradient(90deg, #fa5151, #f39c12, #d4af37, #07c160, #3498db, #9b59b6, #eb4d9c); border-radius: 2px;"></section>
      </section>
    `
  },
  {
    id: 'divider-icon-center',
    name: 'Icon Center Divider',
    nameZh: '中心图标分割线',
    category: 'divider',
    preview: 'Divider with icon in center',
    previewZh: '中心带图标的分割线',
    html: `
      <section style="margin: 30px 0; display: flex; align-items: center; justify-content: center; gap: 12px;">
        <section style="flex: 1; max-width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #d4c4e8);"></section>
        <section style="width: 28px; height: 28px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">✦</section>
        <section style="flex: 1; max-width: 100px; height: 1px; background: linear-gradient(90deg, #d4c4e8, transparent);"></section>
      </section>
    `
  },
  {
    id: 'divider-dots-gradient',
    name: 'Gradient Dots Divider',
    nameZh: '渐变圆点分割线',
    category: 'divider',
    preview: 'Gradient colored dots divider',
    previewZh: '渐变色圆点分割',
    html: `
      <section style="margin: 30px 0; display: flex; justify-content: center; gap: 6px;">
        <section style="width: 6px; height: 6px; border-radius: 50%; background-color: #fa5151;"></section>
        <section style="width: 6px; height: 6px; border-radius: 50%; background-color: #f39c12;"></section>
        <section style="width: 6px; height: 6px; border-radius: 50%; background-color: #07c160;"></section>
        <section style="width: 6px; height: 6px; border-radius: 50%; background-color: #3498db;"></section>
        <section style="width: 6px; height: 6px; border-radius: 50%; background-color: #9b59b6;"></section>
      </section>
    `
  }
];

// --- Section Container Templates (全文容器模板) ---
// These demonstrate the section container pattern: full-width background + decorations + nested child blocks
const sectionContainerTemplates: DesignTemplate[] = [
  {
    id: 'section-blue-circles',
    name: 'Blue Section with Circles',
    nameZh: '蓝色圆形装饰容器',
    category: 'special',
    preview: 'Blue background section with circle decorations and nested content',
    previewZh: '蓝色背景容器带圆形装饰和嵌套内容',
    html: `
      <section style="margin: 24px 0; padding: 24px 20px; background-color: #f0f8ff; border-radius: 12px; position: relative; overflow: hidden;">
        <section style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: #3498db; opacity: 0.08; border-radius: 50%;"></section>
        <section style="position: absolute; bottom: -15px; left: 20px; width: 60px; height: 60px; background: #3498db; opacity: 0.06; border-radius: 50%;"></section>
        <section style="position: relative; z-index: 1;">
          <p style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>📘 章节标题</span></p>
          <p style="margin-bottom: 10px; font-size: 14px; line-height: 1.8; color: #555;"><span>这是容器内的段落文字内容，展示了section容器的基本用法。</span></p>
          <section style="margin: 10px 0; padding: 14px; border: 1px solid #cce6ff; background-color: #f0f8ff; border-radius: 8px;">
            <p style="font-size: 14px; font-weight: bold; color: #3498db; margin-bottom: 6px;"><span>💡 要点标题</span></p>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>这是嵌套在容器内的卡片内容</span></p>
          </section>
          <section style="margin: 10px 0;">
            <section style="display: flex; align-items: flex-start; margin-bottom: 6px;">
              <section style="width: 5px; height: 5px; background-color: #3498db; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
              <p style="font-size: 14px; color: #555; line-height: 1.6;"><span>列表项目一</span></p>
            </section>
            <section style="display: flex; align-items: flex-start; margin-bottom: 6px;">
              <section style="width: 5px; height: 5px; background-color: #3498db; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
              <p style="font-size: 14px; color: #555; line-height: 1.6;"><span>列表项目二</span></p>
            </section>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'section-green-dots',
    name: 'Green Section with Dots',
    nameZh: '绿色点阵装饰容器',
    category: 'special',
    preview: 'Green background section with dot decorations',
    previewZh: '绿色背景容器带点阵装饰',
    html: `
      <section style="margin: 24px 0; padding: 24px 20px; background-color: #f6fffa; border-radius: 12px; position: relative; overflow: hidden;">
        <section style="position: absolute; top: 12px; right: 16px; display: flex; gap: 4px;">
          <section style="width: 4px; height: 4px; background: #07c160; opacity: 0.15; border-radius: 50%;"></section>
          <section style="width: 4px; height: 4px; background: #07c160; opacity: 0.12; border-radius: 50%;"></section>
          <section style="width: 4px; height: 4px; background: #07c160; opacity: 0.08; border-radius: 50%;"></section>
        </section>
        <section style="position: relative; z-index: 1;">
          <p style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>🌿 清新章节</span></p>
          <p style="margin-bottom: 10px; font-size: 14px; line-height: 1.8; color: #555;"><span>清新风格的容器内容区域。</span></p>
          <section style="margin: 10px 0; padding: 14px 16px; background-color: #e8f8f0; border-radius: 6px; position: relative;">
            <section style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background-color: #07c160; border-radius: 6px 6px 0 0;"></section>
            <p style="font-size: 14px; color: #333; line-height: 1.7; font-weight: 500;"><span>这是高亮强调的内容</span></p>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'section-gradient-geometric',
    name: 'Gradient Section with Geometric',
    nameZh: '渐变几何装饰容器',
    category: 'special',
    preview: 'Gradient background section with geometric decorations',
    previewZh: '渐变背景容器带几何装饰',
    html: `
      <section style="margin: 24px 0; padding: 24px 20px; background: linear-gradient(135deg, #eef2ff 0%, #f8f4ff 100%); border-radius: 12px; position: relative; overflow: hidden;">
        <section style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: #667eea; opacity: 0.06; transform: rotate(45deg); border-radius: 4px;"></section>
        <section style="position: absolute; bottom: 10px; left: 10px; width: 30px; height: 30px; background: #764ba2; opacity: 0.05; transform: rotate(45deg); border-radius: 2px;"></section>
        <section style="position: relative; z-index: 1;">
          <p style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>🎯 重点内容</span></p>
          <section style="margin: 10px 0; padding: 12px; background: linear-gradient(135deg, #f5f7fa 0%, #f8f4ff 100%); border-left: 3px solid #667eea; border-radius: 0 4px 4px 0;">
            <p style="font-size: 14px; color: #666; font-style: italic; line-height: 1.6;"><span>这是嵌套在渐变容器中的引用内容</span></p>
          </section>
          <section style="margin: 10px 0;">
            <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
              <section style="width: 20px; height: 20px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0;">
                <p style="color: #fff; font-size: 11px; font-weight: bold;"><span>1</span></p>
              </section>
              <p style="font-size: 14px; color: #555; line-height: 1.6; padding-top: 1px;"><span>第一个步骤说明</span></p>
            </section>
            <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
              <section style="width: 20px; height: 20px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0;">
                <p style="color: #fff; font-size: 11px; font-weight: bold;"><span>2</span></p>
              </section>
              <p style="font-size: 14px; color: #555; line-height: 1.6; padding-top: 1px;"><span>第二个步骤说明</span></p>
            </section>
          </section>
        </section>
      </section>
    `
  },
  {
    id: 'section-warm-waves',
    name: 'Warm Section with Waves',
    nameZh: '暖色波浪装饰容器',
    category: 'special',
    preview: 'Warm amber section with wave bottom decoration',
    previewZh: '暖色容器带底部波浪装饰',
    html: `
      <section style="margin: 24px 0; padding: 24px 20px; background-color: #fffbeb; border-radius: 12px; position: relative; overflow: hidden;">
        <section style="position: absolute; bottom: 0; left: 0; right: 0; height: 30px; background: linear-gradient(180deg, transparent, rgba(217,119,6,0.05)); border-radius: 0 0 12px 12px;"></section>
        <section style="position: relative; z-index: 1;">
          <p style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>🌟 温馨提示</span></p>
          <section style="margin: 10px 0; padding: 12px 14px; background-color: #fff7ed; border-left: 3px solid #d97706; border-radius: 0 6px 6px 0;">
            <p style="font-size: 14px; color: #555; line-height: 1.6;"><span>这是嵌套在暖色容器中的提示内容</span></p>
          </section>
          <p style="margin-bottom: 10px; font-size: 14px; line-height: 1.8; color: #555;"><span>补充说明文字放在提示框后面。</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'section-rose-stars',
    name: 'Rose Section with Stars',
    nameZh: '玫红色星标装饰容器',
    category: 'special',
    preview: 'Rose background section with star decorations',
    previewZh: '玫红色背景容器带星标装饰',
    html: `
      <section style="margin: 24px 0; padding: 24px 20px; background-color: #fff1f2; border-radius: 12px; position: relative; overflow: hidden;">
        <p style="position: absolute; top: 10px; right: 20px; font-size: 16px; opacity: 0.15;"><span>✦</span></p>
        <p style="position: absolute; bottom: 15px; left: 15px; font-size: 12px; opacity: 0.1;"><span>✦</span></p>
        <p style="position: absolute; top: 40%; right: 10%; font-size: 10px; opacity: 0.08;"><span>★</span></p>
        <section style="position: relative; z-index: 1;">
          <p style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 14px; text-align: center;"><span>💭 读者心声</span></p>
          <section style="margin: 10px 0; padding: 12px; background-color: #fce7f3; border-left: 3px solid #e11d48; border-radius: 0 4px 4px 0;">
            <p style="font-size: 14px; color: #666; font-style: italic; line-height: 1.6;"><span>"这是嵌套在玫红容器中的引用内容"</span></p>
          </section>
          <p style="margin-bottom: 10px; font-size: 14px; line-height: 1.8; color: #555; text-align: center;"><span>—— 来自一位忠实读者</span></p>
        </section>
      </section>
    `
  }
];
export const allDesignTemplates: DesignTemplate[] = [
  ...headerTemplates,
  ...expandedHeaderTemplates,
  ...cardTemplates,
  ...expandedCardTemplates,
  ...listTemplates,
  ...expandedListTemplates,
  ...dividerTemplates,
  ...expandedDividerTemplates,
  ...quoteTemplates,
  ...calloutTemplates,
  ...specialTemplates,
  ...expandedSpecialTemplates,
  ...richLayoutTemplates,
  ...sectionContainerTemplates
];

// --- Get Template by ID ---
export const getTemplateById = (id: string): DesignTemplate | undefined => {
  return allDesignTemplates.find(t => t.id === id);
};
