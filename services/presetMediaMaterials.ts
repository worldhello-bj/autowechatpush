/**
 * Preset Media Materials - 预设媒体素材
 * 
 * Pre-built SVG widgets, decorative elements, and icons for quick insertion.
 * These are embedded directly as SVG code for maximum compatibility.
 */

export interface PresetMediaMaterial {
  id: string;
  name: string;
  nameZh: string;
  type: 'svg' | 'gif';
  category: PresetMediaCategory;
  content: string; // SVG code or GIF URL
  tags: string[];
}

export type PresetMediaCategory = 
  | 'icons'        // 图标
  | 'decorations'  // 装饰元素
  | 'dividers'     // 分割线
  | 'badges'       // 徽章标签
  | 'arrows'       // 箭头指示
  | 'social';      // 社交图标

// --- SVG Icons ---
const iconMaterials: PresetMediaMaterial[] = [
  {
    id: 'icon-star',
    name: 'Star Icon',
    nameZh: '星星图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#FFD700"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    tags: ['星星', '评分', '收藏']
  },
  {
    id: 'icon-heart',
    name: 'Heart Icon',
    nameZh: '爱心图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#FF6B6B"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    tags: ['爱心', '喜欢', '收藏']
  },
  {
    id: 'icon-check',
    name: 'Check Icon',
    nameZh: '对勾图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#4CAF50"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    tags: ['对勾', '完成', '成功']
  },
  {
    id: 'icon-warning',
    name: 'Warning Icon',
    nameZh: '警告图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#FF9800"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    tags: ['警告', '注意', '提示']
  },
  {
    id: 'icon-info',
    name: 'Info Icon',
    nameZh: '信息图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#2196F3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
    tags: ['信息', '说明', '提示']
  },
  {
    id: 'icon-gift',
    name: 'Gift Icon',
    nameZh: '礼物图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#E91E63"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>`,
    tags: ['礼物', '福利', '赠品']
  },
  {
    id: 'icon-fire',
    name: 'Fire Icon',
    nameZh: '火焰图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#FF5722"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`,
    tags: ['火焰', '热门', '爆款']
  },
  {
    id: 'icon-lightning',
    name: 'Lightning Icon',
    nameZh: '闪电图标',
    type: 'svg',
    category: 'icons',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#FFC107"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`,
    tags: ['闪电', '快速', '秒杀']
  }
];

// --- Decorative Elements ---
const decorationMaterials: PresetMediaMaterial[] = [
  {
    id: 'deco-ribbon',
    name: 'Ribbon Banner',
    nameZh: '丝带横幅',
    type: 'svg',
    category: 'decorations',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60"><path d="M10 30 L30 10 L170 10 L190 30 L170 50 L30 50 Z" fill="#07C160" stroke="#059048" stroke-width="2"/><text x="100" y="35" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" font-weight="bold">精选推荐</text></svg>`,
    tags: ['丝带', '横幅', '标题']
  },
  {
    id: 'deco-badge-new',
    name: 'New Badge',
    nameZh: 'NEW徽章',
    type: 'svg',
    category: 'decorations',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="28" fill="#FF4757"/><text x="30" y="36" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" font-weight="bold">NEW</text></svg>`,
    tags: ['新品', '徽章', 'NEW']
  },
  {
    id: 'deco-badge-hot',
    name: 'Hot Badge',
    nameZh: 'HOT徽章',
    type: 'svg',
    category: 'decorations',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="28" fill="#FF6B35"/><text x="30" y="36" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" font-weight="bold">HOT</text></svg>`,
    tags: ['热门', '徽章', 'HOT']
  },
  {
    id: 'deco-badge-sale',
    name: 'Sale Badge',
    nameZh: '促销徽章',
    type: 'svg',
    category: 'decorations',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40" width="80" height="40"><rect x="2" y="2" width="76" height="36" rx="18" fill="#E91E63"/><text x="40" y="26" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" font-weight="bold">限时特惠</text></svg>`,
    tags: ['促销', '特惠', '折扣']
  },
  {
    id: 'deco-corner-fold',
    name: 'Corner Fold',
    nameZh: '角标折叠',
    type: 'svg',
    category: 'decorations',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><path d="M0 0 L80 0 L80 80 Z" fill="#07C160"/><text x="50" y="30" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" font-weight="bold" transform="rotate(45 50 30)">推荐</text></svg>`,
    tags: ['角标', '推荐', '标记']
  },
  {
    id: 'deco-quote-mark',
    name: 'Quote Mark',
    nameZh: '引号装饰',
    type: 'svg',
    category: 'decorations',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50" width="60" height="50"><text x="5" y="45" font-family="Georgia, serif" font-size="60" fill="#07C160" opacity="0.3">"</text></svg>`,
    tags: ['引号', '引用', '装饰']
  }
];

// --- Dividers ---
const dividerMaterials: PresetMediaMaterial[] = [
  {
    id: 'div-wave',
    name: 'Wave Divider',
    nameZh: '波浪分割线',
    type: 'svg',
    category: 'dividers',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 30" width="100%" height="30"><path d="M0 15 Q50 0 100 15 T200 15 T300 15 T400 15" stroke="#07C160" stroke-width="2" fill="none"/></svg>`,
    tags: ['波浪', '分割线', '装饰']
  },
  {
    id: 'div-dots',
    name: 'Dots Divider',
    nameZh: '圆点分割线',
    type: 'svg',
    category: 'dividers',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 20" width="100%" height="20"><circle cx="180" cy="10" r="4" fill="#07C160"/><circle cx="200" cy="10" r="4" fill="#07C160"/><circle cx="220" cy="10" r="4" fill="#07C160"/></svg>`,
    tags: ['圆点', '分割线', '简约']
  },
  {
    id: 'div-diamond',
    name: 'Diamond Divider',
    nameZh: '菱形分割线',
    type: 'svg',
    category: 'dividers',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 20" width="100%" height="20"><line x1="0" y1="10" x2="170" y2="10" stroke="#07C160" stroke-width="1"/><polygon points="200,2 208,10 200,18 192,10" fill="#07C160"/><line x1="230" y1="10" x2="400" y2="10" stroke="#07C160" stroke-width="1"/></svg>`,
    tags: ['菱形', '分割线', '优雅']
  },
  {
    id: 'div-arrows',
    name: 'Arrows Divider',
    nameZh: '箭头分割线',
    type: 'svg',
    category: 'dividers',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 20" width="100%" height="20"><path d="M185 10 L195 5 L195 15 Z" fill="#07C160"/><path d="M200 10 L210 5 L210 15 Z" fill="#07C160"/><path d="M215 10 L225 5 L225 15 Z" fill="#07C160"/></svg>`,
    tags: ['箭头', '分割线', '动感']
  },
  {
    id: 'div-leaf',
    name: 'Leaf Divider',
    nameZh: '叶子分割线',
    type: 'svg',
    category: 'dividers',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 30" width="100%" height="30"><line x1="0" y1="15" x2="175" y2="15" stroke="#07C160" stroke-width="1"/><path d="M200 5 Q210 15 200 25 Q190 15 200 5" fill="#07C160"/><line x1="225" y1="15" x2="400" y2="15" stroke="#07C160" stroke-width="1"/></svg>`,
    tags: ['叶子', '分割线', '自然']
  }
];

// --- Badges ---
const badgeMaterials: PresetMediaMaterial[] = [
  {
    id: 'badge-vip',
    name: 'VIP Badge',
    nameZh: 'VIP徽章',
    type: 'svg',
    category: 'badges',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30" width="80" height="30"><defs><linearGradient id="vipGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#FFD700"/><stop offset="100%" style="stop-color:#FFA500"/></linearGradient></defs><rect x="0" y="0" width="80" height="30" rx="4" fill="url(#vipGrad)"/><text x="40" y="20" font-family="Arial, sans-serif" font-size="12" fill="#8B4513" text-anchor="middle" font-weight="bold">VIP会员</text></svg>`,
    tags: ['VIP', '会员', '尊享']
  },
  {
    id: 'badge-official',
    name: 'Official Badge',
    nameZh: '官方认证',
    type: 'svg',
    category: 'badges',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 30" width="90" height="30"><rect x="0" y="0" width="90" height="30" rx="4" fill="#1890FF"/><text x="45" y="20" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" font-weight="bold">官方认证</text></svg>`,
    tags: ['官方', '认证', '可信']
  },
  {
    id: 'badge-quality',
    name: 'Quality Badge',
    nameZh: '品质保证',
    type: 'svg',
    category: 'badges',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 30" width="90" height="30"><rect x="0" y="0" width="90" height="30" rx="4" fill="#52C41A"/><text x="45" y="20" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" font-weight="bold">品质保证</text></svg>`,
    tags: ['品质', '保证', '信任']
  },
  {
    id: 'badge-free',
    name: 'Free Badge',
    nameZh: '免费标签',
    type: 'svg',
    category: 'badges',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 30" width="70" height="30"><rect x="0" y="0" width="70" height="30" rx="4" fill="#F5222D"/><text x="35" y="20" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" font-weight="bold">免费</text></svg>`,
    tags: ['免费', '福利', '赠送']
  },
  {
    id: 'badge-recommend',
    name: 'Recommend Badge',
    nameZh: '推荐标签',
    type: 'svg',
    category: 'badges',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30" width="80" height="30"><rect x="0" y="0" width="80" height="30" rx="4" fill="#722ED1"/><text x="40" y="20" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" font-weight="bold">强烈推荐</text></svg>`,
    tags: ['推荐', '精选', '热门']
  }
];

// --- Arrows ---
const arrowMaterials: PresetMediaMaterial[] = [
  {
    id: 'arrow-right',
    name: 'Right Arrow',
    nameZh: '右箭头',
    type: 'svg',
    category: 'arrows',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 30" width="50" height="30"><path d="M5 15 L35 15 L25 5 M35 15 L25 25" stroke="#07C160" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    tags: ['箭头', '右', '指向']
  },
  {
    id: 'arrow-down',
    name: 'Down Arrow',
    nameZh: '下箭头',
    type: 'svg',
    category: 'arrows',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 50" width="30" height="50"><path d="M15 5 L15 35 L5 25 M15 35 L25 25" stroke="#07C160" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    tags: ['箭头', '下', '指向']
  },
  {
    id: 'arrow-curved',
    name: 'Curved Arrow',
    nameZh: '弯曲箭头',
    type: 'svg',
    category: 'arrows',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="60" height="40"><path d="M10 30 Q30 5 50 20 L45 15 M50 20 L45 25" stroke="#07C160" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    tags: ['箭头', '弯曲', '指向']
  },
  {
    id: 'arrow-double',
    name: 'Double Arrow',
    nameZh: '双箭头',
    type: 'svg',
    category: 'arrows',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="60" height="30"><path d="M5 15 L25 15 L15 5 M25 15 L15 25" stroke="#07C160" stroke-width="2" fill="none"/><path d="M30 15 L50 15 L40 5 M50 15 L40 25" stroke="#07C160" stroke-width="2" fill="none"/></svg>`,
    tags: ['箭头', '双', '快进']
  },
  {
    id: 'arrow-finger',
    name: 'Finger Point',
    nameZh: '手指指向',
    type: 'svg',
    category: 'arrows',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 40" width="50" height="40"><path d="M10 25 L30 25 L30 15 L45 20 L30 25" fill="#FFB347" stroke="#E67E22" stroke-width="1"/><ellipse cx="15" cy="28" rx="8" ry="6" fill="#FFB347" stroke="#E67E22" stroke-width="1"/></svg>`,
    tags: ['手指', '指向', '点击']
  }
];

// --- Social Icons ---
const socialMaterials: PresetMediaMaterial[] = [
  {
    id: 'social-wechat',
    name: 'WeChat Icon',
    nameZh: '微信图标',
    type: 'svg',
    category: 'social',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50"><circle cx="25" cy="25" r="23" fill="#07C160"/><path d="M18 18 Q25 14 32 18 Q36 22 34 28 Q32 32 26 34 L26 37 L24 34 Q18 33 16 28 Q14 22 18 18" fill="white"/><circle cx="21" cy="23" r="2" fill="#07C160"/><circle cx="29" cy="23" r="2" fill="#07C160"/></svg>`,
    tags: ['微信', '社交', '聊天']
  },
  {
    id: 'social-weibo',
    name: 'Weibo Icon',
    nameZh: '微博图标',
    type: 'svg',
    category: 'social',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50"><circle cx="25" cy="25" r="23" fill="#E6162D"/><text x="25" y="32" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" font-weight="bold">微</text></svg>`,
    tags: ['微博', '社交', '分享']
  },
  {
    id: 'social-qq',
    name: 'QQ Icon',
    nameZh: 'QQ图标',
    type: 'svg',
    category: 'social',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50"><circle cx="25" cy="25" r="23" fill="#12B7F5"/><ellipse cx="25" cy="22" rx="12" ry="14" fill="white"/><ellipse cx="21" cy="20" rx="3" ry="4" fill="black"/><ellipse cx="29" cy="20" rx="3" ry="4" fill="black"/></svg>`,
    tags: ['QQ', '社交', '聊天']
  },
  {
    id: 'social-phone',
    name: 'Phone Icon',
    nameZh: '电话图标',
    type: 'svg',
    category: 'social',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50"><circle cx="25" cy="25" r="23" fill="#52C41A"/><path d="M18 16 L22 16 L24 22 L21 25 Q24 30 29 29 L32 26 L38 28 L38 32 Q38 36 32 36 Q20 35 16 22 Q14 16 18 16" fill="white"/></svg>`,
    tags: ['电话', '联系', '客服']
  },
  {
    id: 'social-email',
    name: 'Email Icon',
    nameZh: '邮箱图标',
    type: 'svg',
    category: 'social',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50"><circle cx="25" cy="25" r="23" fill="#1890FF"/><rect x="12" y="17" width="26" height="18" rx="2" fill="white"/><path d="M12 17 L25 27 L38 17" fill="none" stroke="#1890FF" stroke-width="2"/></svg>`,
    tags: ['邮箱', '邮件', '联系']
  },
  {
    id: 'social-location',
    name: 'Location Icon',
    nameZh: '位置图标',
    type: 'svg',
    category: 'social',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50"><circle cx="25" cy="25" r="23" fill="#FA541C"/><path d="M25 10 Q35 10 35 22 Q35 32 25 42 Q15 32 15 22 Q15 10 25 10" fill="white"/><circle cx="25" cy="20" r="5" fill="#FA541C"/></svg>`,
    tags: ['位置', '地址', '定位']
  }
];

// --- Export All Materials ---
export const allPresetMediaMaterials: PresetMediaMaterial[] = [
  ...iconMaterials,
  ...decorationMaterials,
  ...dividerMaterials,
  ...badgeMaterials,
  ...arrowMaterials,
  ...socialMaterials
];

// --- Get Materials by Category ---
export const getPresetMediaByCategory = (category: PresetMediaCategory): PresetMediaMaterial[] => {
  return allPresetMediaMaterials.filter(m => m.category === category);
};

// --- Get All Categories ---
export const getPresetMediaCategories = (): { 
  id: PresetMediaCategory; 
  name: string; 
  nameZh: string; 
  icon: string;
  count: number;
}[] => {
  return [
    { id: 'icons', name: 'Icons', nameZh: '图标', icon: '⭐', count: iconMaterials.length },
    { id: 'decorations', name: 'Decorations', nameZh: '装饰', icon: '🎀', count: decorationMaterials.length },
    { id: 'dividers', name: 'Dividers', nameZh: '分割线', icon: '➖', count: dividerMaterials.length },
    { id: 'badges', name: 'Badges', nameZh: '徽章', icon: '🏷️', count: badgeMaterials.length },
    { id: 'arrows', name: 'Arrows', nameZh: '箭头', icon: '➡️', count: arrowMaterials.length },
    { id: 'social', name: 'Social', nameZh: '社交', icon: '💬', count: socialMaterials.length }
  ];
};

// --- Search Materials ---
export const searchPresetMedia = (query: string): PresetMediaMaterial[] => {
  const lowerQuery = query.toLowerCase();
  return allPresetMediaMaterials.filter(m => 
    m.name.toLowerCase().includes(lowerQuery) ||
    m.nameZh.includes(query) ||
    m.tags.some(t => t.includes(query))
  );
};
