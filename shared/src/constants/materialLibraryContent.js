"use strict";
/**
 * Material Library Content - 素材库内容
 *
 * Pre-built text templates and copywriting materials for quick insertion.
 * Organized by category for easy access.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMaterials = exports.getMaterialsByCategory = exports.allMaterials = void 0;
// --- Opening Templates (开场白) ---
const openingMaterials = [
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
        tags: ['数据', '权威', '科普']
    },
    {
        id: 'open-scene',
        name: 'Scene Description',
        nameZh: '场景描述开场',
        category: 'opening',
        content: '清晨的阳光透过窗帘洒在书桌上，一杯热咖啡冒着腾腾热气。在这个安静的时刻，我想和你聊聊...',
        tags: ['场景', '氛围', '情感']
    }
];
// --- Closing Templates (结尾语) ---
const closingMaterials = [
    {
        id: 'close-summary',
        name: 'Summary Close',
        nameZh: '总结式结尾',
        category: 'closing',
        content: '总而言之，无论我们选择哪条路，重要的是迈出第一步。希望今天的分享能给你带来一些启发。',
        tags: ['总结', '鼓励']
    },
    {
        id: 'close-interaction',
        name: 'Interaction Close',
        nameZh: '互动式结尾',
        category: 'closing',
        content: '对于这个问题，你有什么看法？欢迎在评论区留言，和我一起讨论。',
        tags: ['互动', '评论']
    },
    {
        id: 'close-quote',
        name: 'Quote Close',
        nameZh: '金句结尾',
        category: 'closing',
        content: '最后，送给大家一句话："种一棵树最好的时间是十年前，其次是现在。" 与君共勉。',
        tags: ['金句', '升华']
    }
];
// --- Transition Templates (过渡语) ---
const transitionMaterials = [
    {
        id: 'trans-turn',
        name: 'Turn Transition',
        nameZh: '转折过渡',
        category: 'transition',
        content: '然而，事情并没有这么简单。接下来发生的一幕，出乎所有人的意料。',
        tags: ['转折', '悬念']
    },
    {
        id: 'trans-summary',
        name: 'Summary Transition',
        nameZh: '承上启下',
        category: 'transition',
        content: '说完了这一点，让我们把目光转向另一个同样重要的方面。',
        tags: ['承接', '流畅']
    },
    {
        id: 'trans-question',
        name: 'Question Transition',
        nameZh: '设问过渡',
        category: 'transition',
        content: '那么，具体该怎么做呢？这里有三个实用的建议。',
        tags: ['设问', '引出']
    }
];
// --- CTA Templates (行动号召) ---
const ctaMaterials = [
    {
        id: 'cta-subscribe',
        name: 'Subscribe CTA',
        nameZh: '关注引导',
        category: 'cta',
        content: '如果你喜欢今天的文章，请点个"在看"，并关注我的公众号，获取更多干货分享。',
        tags: ['关注', '在看']
    },
    {
        id: 'cta-share',
        name: 'Share CTA',
        nameZh: '转发引导',
        category: 'cta',
        content: '觉得有帮助？转发给身边的朋友，让更多人受益。',
        tags: ['转发', '分享']
    },
    {
        id: 'cta-community',
        name: 'Community CTA',
        nameZh: '入群引导',
        category: 'cta',
        content: '扫描下方二维码，加入我们的交流群，获取专属福利和答疑机会。',
        tags: ['社群', '引流']
    }
];
// --- Greeting Templates (问候语) ---
const greetingMaterials = [
    {
        id: 'greet-morning',
        name: 'Morning Greeting',
        nameZh: '早安问候',
        category: 'greeting',
        content: '早安，奋斗者！又是元气满满的一天。',
        tags: ['早安', '正能量']
    },
    {
        id: 'greet-evening',
        name: 'Evening Greeting',
        nameZh: '晚安问候',
        category: 'greeting',
        content: '夜深了，卸下一天的疲惫，愿你今晚做个好梦。晚安。',
        tags: ['晚安', '温馨']
    }
];
exports.allMaterials = [
    ...openingMaterials,
    ...closingMaterials,
    ...transitionMaterials,
    ...ctaMaterials,
    ...greetingMaterials
];
const getMaterialsByCategory = (category) => {
    return exports.allMaterials.filter(m => m.category === category);
};
exports.getMaterialsByCategory = getMaterialsByCategory;
const searchMaterials = (keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return exports.allMaterials.filter(m => m.name.toLowerCase().includes(lowerKeyword) ||
        m.nameZh.includes(keyword) ||
        m.content.includes(keyword) ||
        m.tags.some(t => t.includes(keyword)));
};
exports.searchMaterials = searchMaterials;
//# sourceMappingURL=materialLibraryContent.js.map