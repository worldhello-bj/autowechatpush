/**
 * Material Library Content - 素材库内容
 * 
 * Pre-built text templates and copywriting materials for quick insertion.
 * Organized by category for easy access.
 */

export interface TextMaterial {
  id: string;
  name: string;
  nameZh: string;
  category: TextMaterialCategory;
  content: string;
  tags: string[];
}

export type TextMaterialCategory = 
  | 'opening'      // 开场白
  | 'closing'      // 结尾语
  | 'transition'   // 过渡语
  | 'cta'          // 行动号召
  | 'quote'        // 名言警句
  | 'greeting'     // 问候语
  | 'announcement' // 公告
  | 'promotion';   // 促销

// --- Opening Templates (开场白) ---
const openingMaterials: TextMaterial[] = [
  {
    id: 'open-question',
    name: 'Question Hook',
    nameZh: '提问式开场',
    category: 'opening',
    content: '你有没有想过，为什么有些人能够轻松做到，而另一些人却总是困难重重？今天，我们来揭开这个秘密。',
    tags: ['提问', '引人入胜', '悬念']
  },
  {
    id: 'open-story',
    name: 'Story Hook',
    nameZh: '故事式开场',
    category: 'opening',
    content: '三年前的一个深夜，我收到了一条改变命运的消息。当时的我还不知道，这将彻底改变我的人生轨迹...',
    tags: ['故事', '悬念', '情感']
  },
  {
    id: 'open-statistic',
    name: 'Statistics Hook',
    nameZh: '数据式开场',
    category: 'opening',
    content: '最新调查显示，超过80%的人都曾遇到过这个问题。然而，只有不到10%的人知道正确的解决方法。',
    tags: ['数据', '权威', '吸引']
  },
  {
    id: 'open-quote',
    name: 'Quote Hook',
    nameZh: '引用式开场',
    category: 'opening',
    content: '正如爱因斯坦所说："提出一个问题往往比解决一个问题更重要。"今天，让我们从一个问题开始...',
    tags: ['名言', '权威', '智慧']
  },
  {
    id: 'open-direct',
    name: 'Direct Hook',
    nameZh: '直接式开场',
    category: 'opening',
    content: '废话不多说，今天直接上干货。这篇文章将给你最实用的技巧，看完立马就能用。',
    tags: ['直接', '干货', '实用']
  },
  {
    id: 'open-relatable',
    name: 'Relatable Hook',
    nameZh: '共鸣式开场',
    category: 'opening',
    content: '如果你也曾在深夜辗转反侧，思考人生的方向；如果你也曾对未来感到迷茫和不安——那么这篇文章，就是为你而写的。',
    tags: ['共鸣', '情感', '理解']
  },
  {
    id: 'open-surprising',
    name: 'Surprising Hook',
    nameZh: '惊人式开场',
    category: 'opening',
    content: '我要告诉你一个可能颠覆你认知的事实：你一直以为正确的做法，可能恰恰是错误的根源。',
    tags: ['惊讶', '颠覆', '新观点']
  },
  {
    id: 'open-scenario',
    name: 'Scenario Hook',
    nameZh: '场景式开场',
    category: 'opening',
    content: '想象一下，一年后的今天，当你回顾现在做出的决定时，你希望看到什么样的自己？',
    tags: ['场景', '未来', '想象']
  }
];

// --- Closing Templates (结尾语) ---
const closingMaterials: TextMaterial[] = [
  {
    id: 'close-summary',
    name: 'Summary Close',
    nameZh: '总结式结尾',
    category: 'closing',
    content: '总结一下今天分享的核心要点：第一，[要点一]；第二，[要点二]；第三，[要点三]。希望这些能给你带来启发。',
    tags: ['总结', '要点', '清晰']
  },
  {
    id: 'close-inspire',
    name: 'Inspirational Close',
    nameZh: '励志式结尾',
    category: 'closing',
    content: '记住，每一个成功的人都曾是个普通人。只要你愿意开始，一切都不会太晚。加油！',
    tags: ['励志', '鼓励', '正能量']
  },
  {
    id: 'close-question',
    name: 'Question Close',
    nameZh: '反问式结尾',
    category: 'closing',
    content: '看到这里的你，准备好迈出第一步了吗？欢迎在评论区告诉我你的想法。',
    tags: ['互动', '反问', '引导']
  },
  {
    id: 'close-quote',
    name: 'Quote Close',
    nameZh: '金句式结尾',
    category: 'closing',
    content: '最后，送给大家一句话：种一棵树最好的时间是十年前，其次是现在。愿我们都能成为更好的自己。',
    tags: ['金句', '智慧', '祝福']
  },
  {
    id: 'close-thanks',
    name: 'Gratitude Close',
    nameZh: '感谢式结尾',
    category: 'closing',
    content: '感谢你的阅读。如果这篇文章对你有帮助，欢迎点赞收藏，分享给需要的朋友。我们下期见！',
    tags: ['感谢', '互动', '分享']
  },
  {
    id: 'close-call',
    name: 'Call to Action Close',
    nameZh: '号召式结尾',
    category: 'closing',
    content: '行动起来吧！别让今天的犹豫成为明天的遗憾。现在就开始，你一定可以。',
    tags: ['号召', '行动', '激励']
  }
];

// --- Transition Templates (过渡语) ---
const transitionMaterials: TextMaterial[] = [
  {
    id: 'trans-next',
    name: 'Next Point',
    nameZh: '接下来',
    category: 'transition',
    content: '说完了[上一点]，接下来我们来看看[下一点]。',
    tags: ['过渡', '逻辑', '连接']
  },
  {
    id: 'trans-contrast',
    name: 'Contrast',
    nameZh: '对比',
    category: 'transition',
    content: '然而，事情并没有这么简单。让我们换一个角度来看这个问题...',
    tags: ['对比', '转折', '深入']
  },
  {
    id: 'trans-important',
    name: 'Highlight Important',
    nameZh: '重点强调',
    category: 'transition',
    content: '这里要划重点了！接下来的内容非常关键，一定要认真看。',
    tags: ['重点', '强调', '关键']
  },
  {
    id: 'trans-example',
    name: 'Give Example',
    nameZh: '举例说明',
    category: 'transition',
    content: '为了让大家更好理解，我来举个例子：',
    tags: ['举例', '说明', '具体']
  },
  {
    id: 'trans-deeper',
    name: 'Go Deeper',
    nameZh: '深入分析',
    category: 'transition',
    content: '表面上看是这样，但如果我们深入分析一下，就会发现其中的奥妙...',
    tags: ['深入', '分析', '探究']
  },
  {
    id: 'trans-summary-mid',
    name: 'Mid Summary',
    nameZh: '中途小结',
    category: 'transition',
    content: '到这里，我们已经了解了[前面内容]。接下来，让我们继续探索[后面内容]。',
    tags: ['小结', '承上启下', '过渡']
  }
];

// --- CTA Templates (行动号召) ---
const ctaMaterials: TextMaterial[] = [
  {
    id: 'cta-follow',
    name: 'Follow CTA',
    nameZh: '关注号召',
    category: 'cta',
    content: '点击关注，不错过每一篇精彩内容。让我们一起成长！',
    tags: ['关注', '订阅', '增长']
  },
  {
    id: 'cta-share',
    name: 'Share CTA',
    nameZh: '分享号召',
    category: 'cta',
    content: '如果你觉得这篇文章有价值，欢迎转发给身边需要的朋友，让更多人受益。',
    tags: ['分享', '转发', '传播']
  },
  {
    id: 'cta-comment',
    name: 'Comment CTA',
    nameZh: '评论号召',
    category: 'cta',
    content: '你怎么看待这个问题？欢迎在评论区分享你的观点，我们一起讨论。',
    tags: ['评论', '互动', '讨论']
  },
  {
    id: 'cta-like',
    name: 'Like CTA',
    nameZh: '点赞号召',
    category: 'cta',
    content: '如果这篇文章对你有帮助，别忘了点个赞👍，你的支持是我创作的动力！',
    tags: ['点赞', '支持', '鼓励']
  },
  {
    id: 'cta-save',
    name: 'Save CTA',
    nameZh: '收藏号召',
    category: 'cta',
    content: '建议先收藏⭐，以后随时可以翻出来复习。好内容值得反复品味。',
    tags: ['收藏', '保存', '复习']
  },
  {
    id: 'cta-action',
    name: 'Action CTA',
    nameZh: '行动号召',
    category: 'cta',
    content: '看完不是目的，行动才是关键。现在就开始，从最简单的第一步做起！',
    tags: ['行动', '实践', '开始']
  },
  {
    id: 'cta-complete',
    name: 'Complete CTA',
    nameZh: '综合号召',
    category: 'cta',
    content: '点赞👍+收藏⭐+关注，不错过任何一篇干货。有问题欢迎评论区交流！',
    tags: ['综合', '互动', '全面']
  }
];

// --- Quote Templates (名言警句) ---
const quoteMaterials: TextMaterial[] = [
  {
    id: 'quote-confucius',
    name: 'Confucius Quote',
    nameZh: '孔子名言',
    category: 'quote',
    content: '"知之为知之，不知为不知，是知也。" —— 孔子',
    tags: ['孔子', '学习', '智慧']
  },
  {
    id: 'quote-laozi',
    name: 'Laozi Quote',
    nameZh: '老子名言',
    category: 'quote',
    content: '"千里之行，始于足下。" —— 老子',
    tags: ['老子', '开始', '行动']
  },
  {
    id: 'quote-einstein',
    name: 'Einstein Quote',
    nameZh: '爱因斯坦名言',
    category: 'quote',
    content: '"想象力比知识更重要，因为知识是有限的，而想象力概括着世界的一切。" —— 爱因斯坦',
    tags: ['爱因斯坦', '想象力', '科学']
  },
  {
    id: 'quote-jobs',
    name: 'Steve Jobs Quote',
    nameZh: '乔布斯名言',
    category: 'quote',
    content: '"Stay hungry, stay foolish. 求知若饥，虚心若愚。" —— 史蒂夫·乔布斯',
    tags: ['乔布斯', '创新', '进取']
  },
  {
    id: 'quote-success',
    name: 'Success Quote',
    nameZh: '成功名言',
    category: 'quote',
    content: '"成功不是终点，失败也不是终结，重要的是继续前进的勇气。" —— 丘吉尔',
    tags: ['成功', '坚持', '勇气']
  },
  {
    id: 'quote-time',
    name: 'Time Quote',
    nameZh: '时间名言',
    category: 'quote',
    content: '"你不能改变过去，但你可以创造未来。现在开始，永远不晚。"',
    tags: ['时间', '开始', '未来']
  },
  {
    id: 'quote-growth',
    name: 'Growth Quote',
    nameZh: '成长名言',
    category: 'quote',
    content: '"人生没有白走的路，每一步都算数。"',
    tags: ['成长', '经历', '积累']
  },
  {
    id: 'quote-persist',
    name: 'Persistence Quote',
    nameZh: '坚持名言',
    category: 'quote',
    content: '"水滴石穿，不是因为水的力量，而是因为坚持的力量。"',
    tags: ['坚持', '毅力', '耐心']
  }
];

// --- Greeting Templates (问候语) ---
const greetingMaterials: TextMaterial[] = [
  {
    id: 'greet-morning',
    name: 'Morning Greeting',
    nameZh: '早安问候',
    category: 'greeting',
    content: '早安！新的一天，愿你满怀希望，迎接美好。☀️',
    tags: ['早安', '问候', '正能量']
  },
  {
    id: 'greet-evening',
    name: 'Evening Greeting',
    nameZh: '晚安问候',
    category: 'greeting',
    content: '晚安！愿你今夜好梦，明日精彩继续。🌙',
    tags: ['晚安', '问候', '祝福']
  },
  {
    id: 'greet-weekend',
    name: 'Weekend Greeting',
    nameZh: '周末问候',
    category: 'greeting',
    content: '周末愉快！放松心情，享受生活，为下周储备能量。🎉',
    tags: ['周末', '放松', '愉快']
  },
  {
    id: 'greet-monday',
    name: 'Monday Greeting',
    nameZh: '周一问候',
    category: 'greeting',
    content: '周一好！新的一周，新的开始，让我们一起加油！💪',
    tags: ['周一', '开始', '加油']
  },
  {
    id: 'greet-holiday',
    name: 'Holiday Greeting',
    nameZh: '节日问候',
    category: 'greeting',
    content: '节日快乐！愿这个特别的日子给你带来幸福和欢乐。🎊',
    tags: ['节日', '祝福', '快乐']
  }
];

// --- Announcement Templates (公告) ---
const announcementMaterials: TextMaterial[] = [
  {
    id: 'announce-new',
    name: 'New Feature',
    nameZh: '新功能公告',
    category: 'announcement',
    content: '【重磅发布】期待已久的新功能终于上线了！立即体验，感受不一样的惊喜。',
    tags: ['新功能', '发布', '更新']
  },
  {
    id: 'announce-activity',
    name: 'Activity Notice',
    nameZh: '活动公告',
    category: 'announcement',
    content: '【活动预告】精彩活动即将开始，名额有限，先到先得！',
    tags: ['活动', '预告', '参与']
  },
  {
    id: 'announce-important',
    name: 'Important Notice',
    nameZh: '重要通知',
    category: 'announcement',
    content: '【重要通知】请各位注意以下重要信息变更，请仔细阅读。',
    tags: ['通知', '重要', '注意']
  },
  {
    id: 'announce-maintenance',
    name: 'Maintenance Notice',
    nameZh: '维护公告',
    category: 'announcement',
    content: '【系统维护】为提供更好的服务，我们将于[时间]进行系统升级维护，届时暂停服务，敬请谅解。',
    tags: ['维护', '升级', '通知']
  }
];

// --- Promotion Templates (促销) ---
const promotionMaterials: TextMaterial[] = [
  {
    id: 'promo-limited',
    name: 'Limited Time',
    nameZh: '限时优惠',
    category: 'promotion',
    content: '【限时特惠】仅限今天！错过这次，再等一年！',
    tags: ['限时', '优惠', '促销']
  },
  {
    id: 'promo-discount',
    name: 'Discount',
    nameZh: '折扣优惠',
    category: 'promotion',
    content: '【惊喜折扣】全场低至X折！心动不如行动，快来抢购！',
    tags: ['折扣', '优惠', '抢购']
  },
  {
    id: 'promo-gift',
    name: 'Free Gift',
    nameZh: '赠品优惠',
    category: 'promotion',
    content: '【买就送】购买即送超值好礼，数量有限，送完即止！',
    tags: ['赠品', '免费', '福利']
  },
  {
    id: 'promo-member',
    name: 'Member Exclusive',
    nameZh: '会员专享',
    category: 'promotion',
    content: '【会员专属】尊贵会员独享福利，专属优惠等你来拿！',
    tags: ['会员', '专属', 'VIP']
  },
  {
    id: 'promo-flash',
    name: 'Flash Sale',
    nameZh: '秒杀活动',
    category: 'promotion',
    content: '【秒杀开抢】整点开抢，手慢无！准备好你的手速！',
    tags: ['秒杀', '抢购', '限量']
  }
];

// --- Export All Materials ---
export const allTextMaterials: TextMaterial[] = [
  ...openingMaterials,
  ...closingMaterials,
  ...transitionMaterials,
  ...ctaMaterials,
  ...quoteMaterials,
  ...greetingMaterials,
  ...announcementMaterials,
  ...promotionMaterials
];

// --- Get Materials by Category ---
export const getMaterialsByCategory = (category: TextMaterialCategory): TextMaterial[] => {
  return allTextMaterials.filter(m => m.category === category);
};

// --- Get Material by ID ---
export const getMaterialById = (id: string): TextMaterial | undefined => {
  return allTextMaterials.find(m => m.id === id);
};

// --- Search Materials ---
export const searchMaterials = (query: string): TextMaterial[] => {
  const lowerQuery = query.toLowerCase();
  return allTextMaterials.filter(m => 
    m.name.toLowerCase().includes(lowerQuery) ||
    m.nameZh.includes(query) ||
    m.content.includes(query) ||
    m.tags.some(t => t.includes(query))
  );
};

// --- Get All Categories ---
export const getTextMaterialCategories = (): { 
  id: TextMaterialCategory; 
  name: string; 
  nameZh: string; 
  icon: string;
  count: number;
}[] => {
  return [
    { id: 'opening', name: 'Opening', nameZh: '开场白', icon: '🎬', count: openingMaterials.length },
    { id: 'closing', name: 'Closing', nameZh: '结尾语', icon: '🎯', count: closingMaterials.length },
    { id: 'transition', name: 'Transition', nameZh: '过渡语', icon: '🔗', count: transitionMaterials.length },
    { id: 'cta', name: 'CTA', nameZh: '行动号召', icon: '📣', count: ctaMaterials.length },
    { id: 'quote', name: 'Quote', nameZh: '名言警句', icon: '💬', count: quoteMaterials.length },
    { id: 'greeting', name: 'Greeting', nameZh: '问候语', icon: '👋', count: greetingMaterials.length },
    { id: 'announcement', name: 'Announcement', nameZh: '公告', icon: '📢', count: announcementMaterials.length },
    { id: 'promotion', name: 'Promotion', nameZh: '促销', icon: '🎁', count: promotionMaterials.length }
  ];
};
