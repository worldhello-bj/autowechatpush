# Tab Bar Icons

小程序底部导航栏需要以下图标文件：

| 文件名 | 说明 | 尺寸 | 颜色 |
|--------|------|------|------|
| editor.png | 编辑器图标（未选中） | 81x81 | #999999 |
| editor-active.png | 编辑器图标（选中） | 81x81 | #07c160 |
| drafts.png | 草稿图标（未选中） | 81x81 | #999999 |
| drafts-active.png | 草稿图标（选中） | 81x81 | #07c160 |
| settings.png | 设置图标（未选中） | 81x81 | #999999 |
| settings-active.png | 设置图标（选中） | 81x81 | #07c160 |

## 图标设计建议

- **编辑器图标**：铅笔/编辑符号
- **草稿图标**：文档/草稿符号
- **设置图标**：齿轮/设置符号

## 获取图标

推荐从以下平台获取免费图标：

1. [Iconfont](https://www.iconfont.cn/) - 阿里巴巴矢量图标库
2. [Icons8](https://icons8.com/) - 免费图标集合
3. [Flaticon](https://www.flaticon.com/) - 矢量图标
4. [Heroicons](https://heroicons.com/) - Tailwind CSS官方图标

## 临时方案

如果暂时没有图标，可以修改 `app.json` 暂时移除 `tabBar` 配置，使用页面跳转方式导航。
