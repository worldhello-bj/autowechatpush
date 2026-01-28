export default defineAppConfig({
  pages: [
    'pages/entry/index',
    'pages/index/index',
    'pages/drafts/index',
    'pages/analytics/index',
    'pages/settings/index',
    'pages/welcome/index',
    'pages/auth/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'AI 发文助手',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#10b981',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '创作',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/drafts/index',
        text: '草稿',
        iconPath: 'assets/tabbar/drafts.png',
        selectedIconPath: 'assets/tabbar/drafts-active.png'
      },
      {
        pagePath: 'pages/analytics/index',
        text: '分析',
        iconPath: 'assets/tabbar/stats.png',
        selectedIconPath: 'assets/tabbar/stats-active.png'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: 'assets/tabbar/user.png',
        selectedIconPath: 'assets/tabbar/user-active.png'
      }
    ]
  }
})
