# 示例文件 (Examples)

这个目录包含了项目的示例文件和演示代码。

## Material Icons 工具栏示例

**文件:** `material-icons-toolbar-example.html`

这是一个独立的 HTML 文件，演示了如何正确使用 Material Icons 来构建富文本编辑器工具栏。

### 主要特性

- ✅ 完整的工具栏界面，包含常用编辑功能
- ✅ 正确引入 Material Icons 字体
- ✅ 响应式设计，支持移动端
- ✅ 包含详细的使用说明文档
- ✅ 可编辑的内容区域演示

### 使用方法

1. 直接在浏览器中打开 `material-icons-toolbar-example.html`
2. 查看工具栏中的图标是否正确显示
3. 阅读页面下方的说明文档，了解 Material Icons 的工作原理

### 学习要点

本示例重点说明：

1. **Material Icons 是字体，不是图片**
   - Material Icons 是一种特殊的 Web Font
   - 浏览器需要下载字体文件才能显示图标

2. **必须引入字体链接**
   - 在 HTML `<head>` 中必须包含：
     ```html
     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
     ```

3. **正确使用图标**
   - 使用 `<span class="material-icons">图标名称</span>` 格式
   - 图标名称要正确（如 `undo`、`format_bold` 等）

### 故障排查

如果图标不显示：

- 检查是否正确引入了 Material Icons 字体链接
- 确认网络能够访问 Google Fonts
- 验证图标名称是否正确
- 检查浏览器控制台是否有错误信息

### 参考资源

- [Material Icons 官方文档](https://fonts.google.com/icons)
- [Material Design Icons 指南](https://material.io/resources/icons/)
