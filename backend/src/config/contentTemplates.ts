/**
 * Content Templates Library - 文章模板库
 * 
 * A collection of pre-designed full article layout templates for WeChat articles.
 * Each template provides a complete article structure with multiple sections.
 * 
 * These are SEPARATE from the Design Format Library (设计格式库) which provides
 * individual component styles (headers, cards, lists, etc.).
 * 
 * BACKEND COPY - Source of Truth for API
 */

export interface ContentTemplate {
  id: string;
  name: string;
  nameZh: string;
  category: 'tutorial' | 'story' | 'promotion' | 'newsletter' | 'report' | 'lifestyle';
  preview: string;
  previewZh: string;
  html: string;
}

// --- Tutorial / Knowledge Article Templates ---
const tutorialTemplates: ContentTemplate[] = [
  {
    id: 'content-tutorial-steps',
    name: 'Step-by-Step Tutorial',
    nameZh: '分步教程模板',
    category: 'tutorial',
    preview: 'A structured tutorial with numbered steps and tips',
    previewZh: '带编号步骤和提示的结构化教程',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; margin-bottom: 30px;">
          <p style="font-size: 22px; font-weight: bold; color: #1a1a2e; margin-bottom: 8px;"><span>在此输入教程标题</span></p>
          <p style="font-size: 14px; color: #999; letter-spacing: 1px;"><span>在此输入副标题描述</span></p>
          <section style="width: 60px; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 12px auto 0; border-radius: 2px;"></section>
        </section>
        <section style="padding: 16px; background: #f8f9ff; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #667eea;">
          <p style="font-size: 14px; color: #555; line-height: 1.8;"><span>📖 在此输入教程简介和背景说明，帮助读者了解本教程的目的和适用场景。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <section style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: bold; flex-shrink: 0;">1</section>
            <p style="font-size: 17px; font-weight: bold; color: #333;"><span>第一步：在此输入步骤标题</span></p>
          </section>
          <p style="font-size: 14px; color: #555; line-height: 1.8; margin-left: 48px;"><span>在此输入第一步的详细说明内容，包括具体操作方法和注意事项。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <section style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: bold; flex-shrink: 0;">2</section>
            <p style="font-size: 17px; font-weight: bold; color: #333;"><span>第二步：在此输入步骤标题</span></p>
          </section>
          <p style="font-size: 14px; color: #555; line-height: 1.8; margin-left: 48px;"><span>在此输入第二步的详细说明内容。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <section style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: bold; flex-shrink: 0;">3</section>
            <p style="font-size: 17px; font-weight: bold; color: #333;"><span>第三步：在此输入步骤标题</span></p>
          </section>
          <p style="font-size: 14px; color: #555; line-height: 1.8; margin-left: 48px;"><span>在此输入第三步的详细说明内容。</span></p>
        </section>
        <section style="padding: 16px; background: linear-gradient(135deg, #fff3e0, #fff8e1); border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: bold; color: #e65100; margin-bottom: 6px;"><span>💡 小贴士</span></p>
          <p style="font-size: 13px; color: #666; line-height: 1.7;"><span>在此输入实用的补充提示和技巧说明。</span></p>
        </section>
        <section style="text-align: center; padding: 20px; background: #f0f4ff; border-radius: 12px;">
          <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 6px;"><span>🎉 总结</span></p>
          <p style="font-size: 13px; color: #666; line-height: 1.7;"><span>在此输入教程总结，回顾关键要点。</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'content-tutorial-knowledge',
    name: 'Knowledge Share Article',
    nameZh: '知识分享模板',
    category: 'tutorial',
    preview: 'Knowledge sharing with key points and summary',
    previewZh: '带要点和总结的知识分享文章',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; margin-bottom: 28px;">
          <section style="display: inline-block; padding: 8px 24px; background: linear-gradient(135deg, #0d9488, #10b981); border-radius: 24px; margin-bottom: 12px;">
            <p style="font-size: 12px; color: rgba(255,255,255,0.9); letter-spacing: 2px;"><span>知识分享</span></p>
          </section>
          <p style="font-size: 22px; font-weight: bold; color: #1a1a2e;"><span>在此输入文章标题</span></p>
        </section>
        <section style="padding: 18px; background: #ecfdf5; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #065f46; line-height: 1.8;"><span>🌟 在此输入导语部分，简要介绍文章核心内容和读者将获得的价值。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <section style="width: 6px; height: 24px; background: #0d9488; border-radius: 3px;"></section>
            <p style="font-size: 18px; font-weight: bold; color: #333;"><span>核心概念一</span></p>
          </section>
          <p style="font-size: 14px; color: #555; line-height: 1.8; padding-left: 16px;"><span>在此输入第一个核心概念的详细解释和相关案例说明。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <section style="width: 6px; height: 24px; background: #0d9488; border-radius: 3px;"></section>
            <p style="font-size: 18px; font-weight: bold; color: #333;"><span>核心概念二</span></p>
          </section>
          <p style="font-size: 14px; color: #555; line-height: 1.8; padding-left: 16px;"><span>在此输入第二个核心概念的详细解释。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <section style="width: 6px; height: 24px; background: #0d9488; border-radius: 3px;"></section>
            <p style="font-size: 18px; font-weight: bold; color: #333;"><span>核心概念三</span></p>
          </section>
          <p style="font-size: 14px; color: #555; line-height: 1.8; padding-left: 16px;"><span>在此输入第三个核心概念的详细解释。</span></p>
        </section>
        <section style="padding: 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: bold; color: #166534; margin-bottom: 10px;"><span>📝 要点总结</span></p>
          <section style="display: flex; align-items: flex-start; margin-bottom: 6px;">
            <section style="width: 5px; height: 5px; background: #0d9488; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>要点一：在此输入总结要点</span></p>
          </section>
          <section style="display: flex; align-items: flex-start; margin-bottom: 6px;">
            <section style="width: 5px; height: 5px; background: #0d9488; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>要点二：在此输入总结要点</span></p>
          </section>
          <section style="display: flex; align-items: flex-start; margin-bottom: 6px;">
            <section style="width: 5px; height: 5px; background: #0d9488; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>要点三：在此输入总结要点</span></p>
          </section>
        </section>
        <section style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #999;"><span>感谢阅读，欢迎点赞和分享 ❤️</span></p>
        </section>
      </section>
    `
  }
];

// --- Story / Narrative Templates ---
const storyTemplates: ContentTemplate[] = [
  {
    id: 'content-story-personal',
    name: 'Personal Story',
    nameZh: '个人故事模板',
    category: 'story',
    preview: 'Personal narrative with intro, body and reflection',
    previewZh: '带引言、正文和感悟的个人叙事',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; margin-bottom: 28px;">
          <p style="font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 10px;"><span>在此输入故事标题</span></p>
          <p style="font-size: 13px; color: #999; font-style: italic;"><span>在此输入一句引言或感悟</span></p>
          <section style="width: 40px; height: 2px; background: #e74c3c; margin: 14px auto 0;"></section>
        </section>
        <section style="margin-bottom: 24px; padding: 20px; background: linear-gradient(to right, #fef2f2, #fff1f2); border-radius: 12px; border-left: 3px solid #e74c3c;">
          <p style="font-size: 15px; color: #444; line-height: 2; font-style: italic;"><span>在此输入故事的开头引言，用引人入胜的方式吸引读者继续阅读...</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #444; line-height: 2; text-indent: 2em;"><span>在此输入故事的第一段，描述背景和起因。好的故事需要一个引人入胜的开头来抓住读者的注意力。</span></p>
        </section>
        <section style="margin: 32px 0; text-align: center;">
          <span style="font-size: 18px; color: #ddd; letter-spacing: 12px;">· · ·</span>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #444; line-height: 2; text-indent: 2em;"><span>在此输入故事的核心部分，描述转折和高潮。这是故事最精彩的部分，需要详细展开。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #444; line-height: 2; text-indent: 2em;"><span>在此继续输入故事的发展部分。</span></p>
        </section>
        <section style="margin: 32px 0; text-align: center;">
          <span style="font-size: 18px; color: #ddd; letter-spacing: 12px;">· · ·</span>
        </section>
        <section style="padding: 20px; background: #fafafa; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 10px;"><span>✍️ 写在最后</span></p>
          <p style="font-size: 14px; color: #555; line-height: 1.9;"><span>在此输入你的感悟和思考，给读者留下深刻的印象。</span></p>
        </section>
        <section style="text-align: center; padding-top: 16px; border-top: 1px solid #f0f0f0;">
          <p style="font-size: 12px; color: #bbb;"><span>— END —</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'content-story-interview',
    name: 'Interview Article',
    nameZh: '人物访谈模板',
    category: 'story',
    preview: 'Q&A style interview with profile and quotes',
    previewZh: '带人物介绍和引用的问答式访谈',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; margin-bottom: 28px;">
          <p style="font-size: 12px; color: #3b82f6; letter-spacing: 3px; margin-bottom: 8px;"><span>人物专访</span></p>
          <p style="font-size: 22px; font-weight: bold; color: #1e293b;"><span>在此输入访谈标题</span></p>
          <section style="width: 50px; height: 3px; background: #3b82f6; margin: 12px auto 0; border-radius: 2px;"></section>
        </section>
        <section style="padding: 18px; background: #eff6ff; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 8px;"><span>👤 人物简介</span></p>
          <p style="font-size: 13px; color: #555; line-height: 1.8;"><span>在此输入受访者的简介、职业背景和成就。</span></p>
        </section>
        <section style="margin-bottom: 20px;">
          <p style="font-size: 14px; color: #444; line-height: 1.8;"><span>在此输入访谈的背景介绍和导语。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="padding: 14px 16px; background: #f0f9ff; border-radius: 10px; margin-bottom: 10px;">
            <p style="font-size: 14px; font-weight: bold; color: #2563eb;"><span>Q：在此输入第一个问题</span></p>
          </section>
          <section style="padding: 14px 16px; border-left: 3px solid #93c5fd; margin-left: 8px;">
            <p style="font-size: 14px; color: #444; line-height: 1.8;"><span>A：在此输入回答内容。</span></p>
          </section>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="padding: 14px 16px; background: #f0f9ff; border-radius: 10px; margin-bottom: 10px;">
            <p style="font-size: 14px; font-weight: bold; color: #2563eb;"><span>Q：在此输入第二个问题</span></p>
          </section>
          <section style="padding: 14px 16px; border-left: 3px solid #93c5fd; margin-left: 8px;">
            <p style="font-size: 14px; color: #444; line-height: 1.8;"><span>A：在此输入回答内容。</span></p>
          </section>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="padding: 14px 16px; background: #f0f9ff; border-radius: 10px; margin-bottom: 10px;">
            <p style="font-size: 14px; font-weight: bold; color: #2563eb;"><span>Q：在此输入第三个问题</span></p>
          </section>
          <section style="padding: 14px 16px; border-left: 3px solid #93c5fd; margin-left: 8px;">
            <p style="font-size: 14px; color: #444; line-height: 1.8;"><span>A：在此输入回答内容。</span></p>
          </section>
        </section>
        <section style="padding: 16px; background: #f1f5f9; border-radius: 12px; text-align: center;">
          <p style="font-size: 13px; color: #64748b; line-height: 1.7;"><span>编辑手记：在此输入编辑总结。</span></p>
        </section>
      </section>
    `
  }
];

// --- Promotion / Marketing Templates ---
const promotionTemplates: ContentTemplate[] = [
  {
    id: 'content-promo-product',
    name: 'Product Showcase',
    nameZh: '产品推广模板',
    category: 'promotion',
    preview: 'Product promotion with features and call-to-action',
    previewZh: '带功能亮点和行动号召的产品推广',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; margin-bottom: 24px;">
          <p style="font-size: 24px; font-weight: bold; color: #fff; margin-bottom: 8px;"><span>在此输入产品名称</span></p>
          <p style="font-size: 14px; color: rgba(255,255,255,0.85);"><span>在此输入一句产品宣传语</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #555; line-height: 1.9;"><span>在此输入产品介绍文字，说明产品的核心价值和解决的问题。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 17px; font-weight: bold; color: #333; margin-bottom: 16px; text-align: center;"><span>✨ 核心亮点</span></p>
          <section style="display: flex; gap: 12px; flex-wrap: wrap;">
            <section style="flex: 1; min-width: 140px; padding: 16px; background: #f8fafc; border-radius: 12px; text-align: center;">
              <p style="font-size: 24px; margin-bottom: 6px;">🚀</p>
              <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>亮点一</span></p>
              <p style="font-size: 12px; color: #888;"><span>简要描述</span></p>
            </section>
            <section style="flex: 1; min-width: 140px; padding: 16px; background: #f8fafc; border-radius: 12px; text-align: center;">
              <p style="font-size: 24px; margin-bottom: 6px;">💡</p>
              <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>亮点二</span></p>
              <p style="font-size: 12px; color: #888;"><span>简要描述</span></p>
            </section>
            <section style="flex: 1; min-width: 140px; padding: 16px; background: #f8fafc; border-radius: 12px; text-align: center;">
              <p style="font-size: 24px; margin-bottom: 6px;">🎯</p>
              <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>亮点三</span></p>
              <p style="font-size: 12px; color: #888;"><span>简要描述</span></p>
            </section>
          </section>
        </section>
        <section style="text-align: center; padding: 24px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px;">
          <p style="font-size: 16px; font-weight: bold; color: #92400e; margin-bottom: 10px;"><span>🎁 限时优惠</span></p>
          <p style="font-size: 14px; color: #a16207; margin-bottom: 14px;"><span>在此输入优惠详情</span></p>
          <section style="display: inline-block; padding: 10px 32px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-size: 15px; font-weight: bold; border-radius: 24px;">立即了解</section>
        </section>
      </section>
    `
  },
  {
    id: 'content-promo-event',
    name: 'Event Announcement',
    nameZh: '活动公告模板',
    category: 'promotion',
    preview: 'Event announcement with schedule and registration',
    previewZh: '带日程和报名信息的活动公告',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; padding: 28px 20px; background: linear-gradient(135deg, #ec4899, #f43f5e); border-radius: 16px; margin-bottom: 24px;">
          <p style="font-size: 12px; color: rgba(255,255,255,0.8); letter-spacing: 3px; margin-bottom: 8px;"><span>精彩活动</span></p>
          <p style="font-size: 22px; font-weight: bold; color: #fff; margin-bottom: 6px;"><span>在此输入活动名称</span></p>
          <p style="font-size: 14px; color: rgba(255,255,255,0.85);"><span>在此输入活动时间和地点</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #555; line-height: 1.9;"><span>在此输入活动介绍和背景说明，吸引读者参与。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 17px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>📋 活动日程</span></p>
          <section style="border-left: 3px solid #ec4899; padding-left: 16px; margin-left: 8px;">
            <section style="margin-bottom: 14px;">
              <p style="font-size: 13px; color: #ec4899; font-weight: bold;"><span>09:00 - 10:00</span></p>
              <p style="font-size: 14px; color: #444;"><span>在此输入日程内容</span></p>
            </section>
            <section style="margin-bottom: 14px;">
              <p style="font-size: 13px; color: #ec4899; font-weight: bold;"><span>10:00 - 12:00</span></p>
              <p style="font-size: 14px; color: #444;"><span>在此输入日程内容</span></p>
            </section>
            <section style="margin-bottom: 14px;">
              <p style="font-size: 13px; color: #ec4899; font-weight: bold;"><span>14:00 - 17:00</span></p>
              <p style="font-size: 14px; color: #444;"><span>在此输入日程内容</span></p>
            </section>
          </section>
        </section>
        <section style="padding: 20px; background: #fdf2f8; border-radius: 12px; text-align: center;">
          <p style="font-size: 15px; font-weight: bold; color: #be185d; margin-bottom: 10px;"><span>🔥 名额有限，立即报名</span></p>
          <p style="font-size: 13px; color: #9d174d; margin-bottom: 14px;"><span>在此输入报名方式和联系方式</span></p>
          <section style="display: inline-block; padding: 10px 32px; background: linear-gradient(135deg, #ec4899, #f43f5e); color: #fff; font-size: 15px; font-weight: bold; border-radius: 24px;">立即报名</section>
        </section>
      </section>
    `
  }
];

// --- Newsletter Templates ---
const newsletterTemplates: ContentTemplate[] = [
  {
    id: 'content-newsletter-weekly',
    name: 'Weekly Newsletter',
    nameZh: '周刊简报模板',
    category: 'newsletter',
    preview: 'Weekly digest with sections and links',
    previewZh: '带分栏和链接的周刊简报',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="padding: 20px; background: linear-gradient(135deg, #1e293b, #334155); border-radius: 16px; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #94a3b8; letter-spacing: 2px; margin-bottom: 6px;"><span>第 N 期 · YYYY年MM月DD日</span></p>
          <p style="font-size: 22px; font-weight: bold; color: #fff;"><span>在此输入简报标题</span></p>
          <section style="width: 40px; height: 3px; background: #38bdf8; border-radius: 2px; margin-top: 10px;"></section>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #555; line-height: 1.8;"><span>在此输入本期简报的编辑寄语或内容概览。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
            <p style="font-size: 16px;">📰</p>
            <p style="font-size: 16px; font-weight: bold; color: #1e293b;"><span>本周要闻</span></p>
          </section>
          <section style="padding: 14px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px;">
            <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>要闻一：在此输入标题</span></p>
            <p style="font-size: 13px; color: #666; line-height: 1.7;"><span>在此输入简要内容摘要。</span></p>
          </section>
          <section style="padding: 14px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px;">
            <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px;"><span>要闻二：在此输入标题</span></p>
            <p style="font-size: 13px; color: #666; line-height: 1.7;"><span>在此输入简要内容摘要。</span></p>
          </section>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
            <p style="font-size: 16px;">🔍</p>
            <p style="font-size: 16px; font-weight: bold; color: #1e293b;"><span>深度解读</span></p>
          </section>
          <p style="font-size: 14px; color: #555; line-height: 1.8;"><span>在此输入本期的深度分析内容。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <section style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
            <p style="font-size: 16px;">📚</p>
            <p style="font-size: 16px; font-weight: bold; color: #1e293b;"><span>推荐阅读</span></p>
          </section>
          <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <section style="width: 5px; height: 5px; background: #38bdf8; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>推荐文章/资源标题</span></p>
          </section>
          <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <section style="width: 5px; height: 5px; background: #38bdf8; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>推荐文章/资源标题</span></p>
          </section>
        </section>
        <section style="text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px;">
          <p style="font-size: 12px; color: #94a3b8;"><span>感谢您的阅读 · 我们下期再见 👋</span></p>
        </section>
      </section>
    `
  }
];

// --- Report Templates ---
const reportTemplates: ContentTemplate[] = [
  {
    id: 'content-report-data',
    name: 'Data Report',
    nameZh: '数据报告模板',
    category: 'report',
    preview: 'Data-driven report with metrics and analysis',
    previewZh: '带数据指标和分析的报告模板',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; margin-bottom: 28px;">
          <p style="font-size: 12px; color: #6366f1; letter-spacing: 3px; margin-bottom: 8px;"><span>数据报告</span></p>
          <p style="font-size: 22px; font-weight: bold; color: #1e1b4b;"><span>在此输入报告标题</span></p>
          <p style="font-size: 13px; color: #999; margin-top: 6px;"><span>报告周期：YYYY年MM月</span></p>
          <section style="width: 60px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 12px auto 0; border-radius: 2px;"></section>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 14px; color: #555; line-height: 1.8;"><span>在此输入报告概述，简要说明本期数据的整体表现和关键发现。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>📊 核心指标</span></p>
          <section style="display: flex; gap: 12px; flex-wrap: wrap;">
            <section style="flex: 1; min-width: 120px; padding: 16px; background: linear-gradient(135deg, #eef2ff, #e0e7ff); border-radius: 12px; text-align: center;">
              <p style="font-size: 28px; font-weight: bold; color: #4f46e5;"><span>0</span></p>
              <p style="font-size: 12px; color: #6366f1; margin-top: 4px;"><span>指标名称</span></p>
              <p style="font-size: 11px; color: #22c55e;">↑ 0%</p>
            </section>
            <section style="flex: 1; min-width: 120px; padding: 16px; background: linear-gradient(135deg, #fef2f2, #fee2e2); border-radius: 12px; text-align: center;">
              <p style="font-size: 28px; font-weight: bold; color: #dc2626;"><span>0</span></p>
              <p style="font-size: 12px; color: #ef4444; margin-top: 4px;"><span>指标名称</span></p>
              <p style="font-size: 11px; color: #ef4444;">↓ 0%</p>
            </section>
            <section style="flex: 1; min-width: 120px; padding: 16px; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; text-align: center;">
              <p style="font-size: 28px; font-weight: bold; color: #059669;"><span>0</span></p>
              <p style="font-size: 12px; color: #10b981; margin-top: 4px;"><span>指标名称</span></p>
              <p style="font-size: 11px; color: #22c55e;">→ 持平</p>
            </section>
          </section>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>📈 详细分析</span></p>
          <p style="font-size: 14px; color: #555; line-height: 1.8;"><span>在此输入详细的数据分析内容，包括趋势解读和原因分析。</span></p>
        </section>
        <section style="padding: 18px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 8px;"><span>💡 关键发现</span></p>
          <section style="display: flex; align-items: flex-start; margin-bottom: 6px;">
            <section style="width: 5px; height: 5px; background: #8b5cf6; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>发现一：在此输入关键发现</span></p>
          </section>
          <section style="display: flex; align-items: flex-start; margin-bottom: 6px;">
            <section style="width: 5px; height: 5px; background: #8b5cf6; border-radius: 50%; margin-top: 8px; margin-right: 8px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>发现二：在此输入关键发现</span></p>
          </section>
        </section>
        <section style="padding: 16px; background: #f8fafc; border-radius: 12px;">
          <p style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 8px;"><span>📋 下期展望</span></p>
          <p style="font-size: 13px; color: #666; line-height: 1.7;"><span>在此输入下一步计划和改进方向。</span></p>
        </section>
      </section>
    `
  }
];

// --- Lifestyle Templates ---
const lifestyleTemplates: ContentTemplate[] = [
  {
    id: 'content-lifestyle-travel',
    name: 'Travel Guide',
    nameZh: '旅行攻略模板',
    category: 'lifestyle',
    preview: 'Travel guide with itinerary and tips',
    previewZh: '带行程和实用贴士的旅行攻略',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; padding: 28px 20px; background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 16px; margin-bottom: 24px;">
          <p style="font-size: 12px; color: rgba(255,255,255,0.8); letter-spacing: 3px; margin-bottom: 8px;"><span>旅行攻略</span></p>
          <p style="font-size: 22px; font-weight: bold; color: #fff;"><span>在此输入目的地名称</span></p>
          <p style="font-size: 14px; color: rgba(255,255,255,0.85); margin-top: 6px;"><span>在此输入旅行主题描述</span></p>
        </section>
        <section style="padding: 16px; background: #ecfeff; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #155e75; line-height: 1.8;"><span>🗺️ 在此输入旅行概览和推荐理由。</span></p>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 17px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>📍 推荐行程</span></p>
          <section style="padding: 14px; background: #f0fdfa; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #14b8a6;">
            <p style="font-size: 14px; font-weight: bold; color: #0d9488; margin-bottom: 4px;"><span>Day 1 在此输入行程标题</span></p>
            <p style="font-size: 13px; color: #555; line-height: 1.7;"><span>在此输入行程详情。</span></p>
          </section>
          <section style="padding: 14px; background: #f0fdfa; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #14b8a6;">
            <p style="font-size: 14px; font-weight: bold; color: #0d9488; margin-bottom: 4px;"><span>Day 2 在此输入行程标题</span></p>
            <p style="font-size: 13px; color: #555; line-height: 1.7;"><span>在此输入行程详情。</span></p>
          </section>
          <section style="padding: 14px; background: #f0fdfa; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #14b8a6;">
            <p style="font-size: 14px; font-weight: bold; color: #0d9488; margin-bottom: 4px;"><span>Day 3 在此输入行程标题</span></p>
            <p style="font-size: 13px; color: #555; line-height: 1.7;"><span>在此输入行程详情。</span></p>
          </section>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 17px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>💡 实用贴士</span></p>
          <section style="padding: 14px; background: #fff7ed; border-radius: 10px;">
            <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
              <p style="font-size: 13px; margin-right: 8px;">🎒</p>
              <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>在此输入实用贴士一</span></p>
            </section>
            <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
              <p style="font-size: 13px; margin-right: 8px;">🍜</p>
              <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>在此输入实用贴士二</span></p>
            </section>
            <section style="display: flex; align-items: flex-start;">
              <p style="font-size: 13px; margin-right: 8px;">📸</p>
              <p style="font-size: 13px; color: #555; line-height: 1.6;"><span>在此输入实用贴士三</span></p>
            </section>
          </section>
        </section>
        <section style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #999;"><span>祝旅途愉快！记得收藏和分享 🌟</span></p>
        </section>
      </section>
    `
  },
  {
    id: 'content-lifestyle-recipe',
    name: 'Recipe Article',
    nameZh: '美食食谱模板',
    category: 'lifestyle',
    preview: 'Recipe with ingredients and step-by-step instructions',
    previewZh: '带食材和分步说明的美食食谱',
    html: `
      <section style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <section style="text-align: center; margin-bottom: 28px;">
          <p style="font-size: 28px; margin-bottom: 8px;">🍳</p>
          <p style="font-size: 22px; font-weight: bold; color: #1a1a2e;"><span>在此输入菜名</span></p>
          <p style="font-size: 13px; color: #999; margin-top: 4px;"><span>在此输入一句美食描述</span></p>
          <section style="width: 40px; height: 3px; background: #f59e0b; margin: 12px auto 0; border-radius: 2px;"></section>
        </section>
        <section style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
          <section style="flex: 1; min-width: 80px; padding: 10px; background: #fef3c7; border-radius: 10px; text-align: center;">
            <p style="font-size: 11px; color: #92400e;">⏱ 烹饪时间</p>
            <p style="font-size: 14px; font-weight: bold; color: #78350f;"><span>30分钟</span></p>
          </section>
          <section style="flex: 1; min-width: 80px; padding: 10px; background: #fef3c7; border-radius: 10px; text-align: center;">
            <p style="font-size: 11px; color: #92400e;">👥 份量</p>
            <p style="font-size: 14px; font-weight: bold; color: #78350f;"><span>2-3人</span></p>
          </section>
          <section style="flex: 1; min-width: 80px; padding: 10px; background: #fef3c7; border-radius: 10px; text-align: center;">
            <p style="font-size: 11px; color: #92400e;">📊 难度</p>
            <p style="font-size: 14px; font-weight: bold; color: #78350f;"><span>简单</span></p>
          </section>
        </section>
        <section style="padding: 16px; background: #fffbeb; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 15px; font-weight: bold; color: #92400e; margin-bottom: 10px;"><span>🥗 所需食材</span></p>
          <section style="display: flex; align-items: center; margin-bottom: 6px;">
            <section style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; margin-right: 10px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555;"><span>食材一：适量</span></p>
          </section>
          <section style="display: flex; align-items: center; margin-bottom: 6px;">
            <section style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; margin-right: 10px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555;"><span>食材二：适量</span></p>
          </section>
          <section style="display: flex; align-items: center; margin-bottom: 6px;">
            <section style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; margin-right: 10px; flex-shrink: 0;"></section>
            <p style="font-size: 13px; color: #555;"><span>食材三：适量</span></p>
          </section>
        </section>
        <section style="margin-bottom: 24px;">
          <p style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 14px;"><span>👨‍🍳 烹饪步骤</span></p>
          <section style="margin-bottom: 14px; padding: 12px; background: #fff; border-radius: 10px; border: 1px solid #fde68a;">
            <p style="font-size: 13px; font-weight: bold; color: #d97706; margin-bottom: 4px;"><span>Step 1</span></p>
            <p style="font-size: 13px; color: #555; line-height: 1.7;"><span>在此输入第一步操作说明。</span></p>
          </section>
          <section style="margin-bottom: 14px; padding: 12px; background: #fff; border-radius: 10px; border: 1px solid #fde68a;">
            <p style="font-size: 13px; font-weight: bold; color: #d97706; margin-bottom: 4px;"><span>Step 2</span></p>
            <p style="font-size: 13px; color: #555; line-height: 1.7;"><span>在此输入第二步操作说明。</span></p>
          </section>
          <section style="margin-bottom: 14px; padding: 12px; background: #fff; border-radius: 10px; border: 1px solid #fde68a;">
            <p style="font-size: 13px; font-weight: bold; color: #d97706; margin-bottom: 4px;"><span>Step 3</span></p>
            <p style="font-size: 13px; color: #555; line-height: 1.7;"><span>在此输入第三步操作说明。</span></p>
          </section>
        </section>
        <section style="padding: 14px; background: linear-gradient(135deg, #fff7ed, #fffbeb); border-radius: 12px;">
          <p style="font-size: 13px; color: #92400e; line-height: 1.7;"><span>💡 小窍门：在此输入烹饪小窍门和注意事项。</span></p>
        </section>
      </section>
    `
  }
];

// --- Combined Export ---
export const allContentTemplates: ContentTemplate[] = [
  ...tutorialTemplates,
  ...storyTemplates,
  ...promotionTemplates,
  ...newsletterTemplates,
  ...reportTemplates,
  ...lifestyleTemplates
];

// --- Get Templates by Category ---
export const getContentTemplatesByCategory = (category: ContentTemplate['category']): ContentTemplate[] => {
  return allContentTemplates.filter(t => t.category === category);
};

// --- Get Template by ID ---
export const getContentTemplateById = (id: string): ContentTemplate | undefined => {
  return allContentTemplates.find(t => t.id === id);
};
