# 微信AI发布助手 - 小程序版

这是「微信AI发布助手」的微信小程序版本，基于原有React Web应用迁移而来。

## 目录结构

```
miniprogram/
├── app.js                 # 小程序入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── sitemap.json           # sitemap配置
│
├── pages/                 # 页面目录
│   ├── index/             # 主编辑器页面（AI文章生成）
│   ├── drafts/            # 草稿箱页面
│   ├── settings/          # 设置页面
│   └── login/             # 登录页面
│
├── components/            # 组件目录
│   ├── editor/            # 编辑器组件
│   ├── article-preview/   # 文章预览组件
│   └── material-library/  # 素材库组件
│
├── utils/                 # 工具函数
│   ├── api.js             # API请求封装
│   ├── auth.js            # 认证相关
│   └── util.js            # 通用工具函数
│
└── images/                # 图片资源
```

## 功能特性

### 已实现功能

- ✅ **AI文章生成**：支持Google Gemini、DeepSeek、Qwen三种AI模型
- ✅ **双AI模式**：文案AI + 美化AI并行处理
- ✅ **格式化模式**：将现有文本转换为精美排版
- ✅ **图片上传**：支持封面图片上传和AI图像分析
- ✅ **草稿保存**：本地草稿自动保存和恢复
- ✅ **用户认证**：登录/注册/退出登录
- ✅ **设置管理**：AI密钥配置、后端服务配置
- ✅ **微信登录**：使用微信账号快捷登录（静默登录 + 头像昵称授权）
- ✅ **微信发布**：一键发布文章到公众号草稿箱

### 待完善功能

- ⏳ **素材库**：图片/视频/SVG素材管理
- ⏳ **AI工具面板**：标题生成、摘要、关键词等
- ⏳ **设计模板库**：预设排版模板

## 微信登录

小程序支持两种微信登录方式：

### 1. 静默登录
使用 `wx.login()` 获取临时登录凭证(code)，发送到后端换取用户信息。
- 无需用户授权
- 适合快速登录

### 2. 授权登录（获取头像昵称）
使用 `wx.getUserProfile()` 获取用户头像和昵称。
- 需要用户点击按钮触发
- 可以获取用户微信头像和昵称

### 后端接口要求

后端需要实现以下接口支持微信登录：

```
POST /auth/wechat-login
{
  "code": "xxx",        // wx.login获取的code
  "userInfo": {...}     // 可选，用户信息
}
```

## 微信公众号发布

参照源代码 `services/wechatService.ts` 实现，直接调用微信公众号API。

### 配置步骤

1. 在「设置」页面配置微信公众号的 AppID 和 AppSecret
2. 上传封面图片（微信要求必须有封面）
3. 生成文章后，点击「发布」按钮
4. 文章将保存到公众号草稿箱

### API调用流程

发布文章的完整流程（与源代码一致）：

```
1. 获取Access Token
   GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appId}&secret={appSecret}

2. 上传封面图片（永久素材）
   POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={token}&type=image
   使用 wx.uploadFile 上传图片

3. 保存草稿
   POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token={token}
   {
     "articles": [{
       "title": "文章标题",
       "author": "作者",
       "digest": "摘要",
       "content": "<html>内容</html>",
       "thumb_media_id": "封面图片media_id",
       "need_open_comment": 0,
       "only_fans_can_comment": 0
     }]
   }
```

### 域名白名单配置

在微信公众平台小程序设置中，需要将以下域名添加到request合法域名：

- `https://api.weixin.qq.com`

### 参考文档

- [获取Access Token](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html)
- [上传永久素材](https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/Adding_Permanent_Assets.html)
- [新建草稿](https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html)

## 开发指南

### 环境要求

- 微信开发者工具（最新版）
- Node.js 16+（后端服务）

### 开始开发

1. **打开项目**
   - 使用微信开发者工具打开 `miniprogram` 目录
   - 填入你的小程序 AppID（在 project.config.json 中配置）

2. **配置后端**
   - 在「设置」页面配置后端 API 地址
   - 确保后端服务已启动（参考根目录的 README.md）

3. **配置AI密钥**
   - 在「设置」页面配置相应AI模型的API密钥

### 编译和预览

- 点击微信开发者工具的「编译」按钮即可预览
- 真机调试请使用「真机调试」功能

## 技术架构

### 与Web版的主要区别

| 特性 | Web版 (React) | 小程序版 |
|------|---------------|----------|
| 框架 | React 18 | 原生小程序 |
| 视图 | JSX / HTML | WXML |
| 样式 | CSS / Tailwind | WXSS |
| 路由 | React Router | 小程序路由 |
| 存储 | localStorage | wx.setStorage |
| 网络 | fetch | wx.request |
| 渲染 | DOM | 原生组件 |

### API适配

小程序使用 `wx.request` 替代 `fetch`，所有网络请求通过 `utils/api.js` 统一封装：

```javascript
// 示例：调用AI生成接口
const { aiApi } = require('../../utils/api');

const result = await aiApi.generate({
  message: '写一篇关于秋天的文章',
  provider: 'deepseek'
});
```

### 认证流程

1. 用户登录后，Access Token 和 Refresh Token 存储在本地
2. 请求时自动附加 Authorization 头
3. Token 过期时自动刷新

## 注意事项

### 域名白名单

在微信公众平台配置小程序的服务器域名：
- request合法域名：你的后端API地址
- uploadFile合法域名：你的文件上传地址

### 安全考虑

- API密钥存储在本地，建议使用后端代理模式
- 生产环境请启用HTTPS
- 敏感操作需要二次确认

## 发布

1. 在微信开发者工具中点击「上传」
2. 在微信公众平台提交审核
3. 审核通过后即可发布

## License

MIT License - 与主项目保持一致
