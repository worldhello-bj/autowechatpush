import React, { useState } from 'react';
import { HtmlEditorRef } from '../../HtmlEditor';

interface EditorToolbarProps {
  editorRef: React.RefObject<HtmlEditorRef>;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editorRef }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const execCmd = (command: string, value: string = '') => {
    editorRef.current?.execCmd(command, value);
  };

  const applyTextColor = (color: string) => {
    execCmd('foreColor', color);
    setShowColorPicker(false);
  };

  const insertLink = () => {
    if (linkUrl && editorRef.current) {
      let sanitizedUrl = linkUrl.trim();
      // Basic validation
      if (!/^https?:\/\//i.test(sanitizedUrl) && !/^mailto:/i.test(sanitizedUrl) && !sanitizedUrl.startsWith('#')) {
        sanitizedUrl = 'http://' + sanitizedUrl;
      }
      
      const text = linkText || linkUrl;
      const linkHtml = `<a href="${sanitizedUrl}" style="color: #07c160; text-decoration: underline;">${text}</a>`;
      editorRef.current.insertHtmlAtCursor(linkHtml);
      
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  // Helper inserts
  const insertCard = () => {
    const cardHtml = `
      <section style="margin: 20px 0; padding: 20px; border: 1px solid #e0f2e9; background-color: #f6fffa; border-radius: 8px; box-shadow: 0 2px 4px rgba(7, 193, 96, 0.1);">
          <section style="font-size: 16px; font-weight: bold; color: #07c160; margin-bottom: 8px;">Title Here</section>
          <section style="font-size: 14px; color: #555; line-height: 1.6;">Enter your text content here...</section>
      </section>
      <p><br/></p>
    `;
    editorRef.current?.insertHtmlAtCursor(cardHtml);
  };

  const insertQuote = () => {
    const quoteHtml = `
      <section style="margin: 20px 0; padding: 15px 20px; background-color: #f7f7f7; border-left: 4px solid #07c160; border-radius: 0 8px 8px 0;">
          <section style="font-size: 15px; color: #666; font-style: italic; line-height: 1.6;">Enter quote here...</section>
      </section>
      <p><br/></p>
    `;
    editorRef.current?.insertHtmlAtCursor(quoteHtml);
  };

  const insertDivider = () => {
    const dividerHtml = `
      <section style="margin: 25px 0; text-align: center;">
          <section style="display: inline-block; width: 60%; height: 1px; background: linear-gradient(90deg, transparent, #07c160, transparent);"></section>
      </section>
      <p><br/></p>
    `;
    editorRef.current?.insertHtmlAtCursor(dividerHtml);
  };

  const colorPalette = [
    { hex: '#000000', name: '黑色' },
    { hex: '#333333', name: '深灰' },
    { hex: '#666666', name: '灰色' },
    { hex: '#999999', name: '浅灰' },
    { hex: '#07c160', name: '微信绿' },
    { hex: '#10b981', name: '翠绿' },
    { hex: '#3b82f6', name: '蓝色' },
    { hex: '#6366f1', name: '靛蓝' },
    { hex: '#8b5cf6', name: '紫色' },
    { hex: '#ec4899', name: '粉色' },
    { hex: '#ef4444', name: '红色' },
    { hex: '#f97316', name: '橙色' },
    { hex: '#eab308', name: '黄色' },
    { hex: '#84cc16', name: '青绿' },
    { hex: '#14b8a6', name: '青色' },
    { hex: '#06b6d4', name: '天蓝' }
  ];

  return (
    <div className="flex items-center justify-center p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 mb-4 gap-1 flex-wrap z-30 sticky top-0 mx-4">
        {/* Undo/Redo */}
        <button onClick={() => execCmd('undo')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="撤销">
            <span className="material-icons text-sm">undo</span>
        </button>
        <button onClick={() => execCmd('redo')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="重做">
            <span className="material-icons text-sm">redo</span>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        
        {/* Text Formatting */}
        <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="加粗">
            <span className="material-icons text-sm">format_bold</span>
        </button>
        <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="斜体">
            <span className="material-icons text-sm">format_italic</span>
        </button>
        <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="下划线">
            <span className="material-icons text-sm">format_underlined</span>
        </button>
        <button onClick={() => execCmd('strikeThrough')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="删除线">
            <span className="material-icons text-sm">strikethrough_s</span>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        
        {/* Text Color */}
        <div className="relative">
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)} 
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center transition" 
            title="文字颜色"
          >
            <span className="material-icons text-sm">format_color_text</span>
            <span className="material-icons text-[10px]">arrow_drop_down</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1 w-32">
              {colorPalette.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => applyTextColor(color.hex)}
                  className="w-6 h-6 rounded-full border border-gray-100 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
        <button onClick={() => execCmd('removeFormat')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="清除格式">
            <span className="material-icons text-sm">format_clear</span>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        
        {/* Headers */}
        <button onClick={() => execCmd('formatBlock', '<h2>')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 font-bold text-xs transition" title="标题2">H2</button>
        <button onClick={() => execCmd('formatBlock', '<h3>')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 font-bold text-xs transition" title="标题3">H3</button>
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        
        {/* Alignment */}
        <button onClick={() => execCmd('justifyLeft')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="左对齐">
            <span className="material-icons text-sm">format_align_left</span>
        </button>
        <button onClick={() => execCmd('justifyCenter')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="居中">
            <span className="material-icons text-sm">format_align_center</span>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        
        {/* Lists */}
        <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="无序列表">
            <span className="material-icons text-sm">format_list_bulleted</span>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        
        {/* Insert Elements */}
        <button onClick={() => setShowLinkDialog(true)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="插入链接">
            <span className="material-icons text-sm">link</span>
        </button>
        <button onClick={() => editorRef.current?.triggerImageUpload()} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="插入图片">
            <span className="material-icons text-sm">add_photo_alternate</span>
        </button>
        <button onClick={insertQuote} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="插入引用">
            <span className="material-icons text-sm">format_quote</span>
        </button>
        <button onClick={insertCard} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="插入卡片">
            <span className="material-icons text-sm">dashboard</span>
        </button>
        <button onClick={insertDivider} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition" title="插入分割线">
            <span className="material-icons text-sm">horizontal_rule</span>
        </button>
        
        <div className="w-px h-4 bg-gray-200 mx-1"></div>
        
        <button 
            onClick={() => editorRef.current?.toggleSource()} 
            className="text-xs font-medium px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
            源码
        </button>

        {/* Link Dialog */}
        {showLinkDialog && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-fade-in w-72 mx-auto">
            <h3 className="text-sm font-bold text-gray-800 mb-3">插入链接</h3>
            <div className="space-y-3">
              <div>
                <input 
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="链接地址 (https://...)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
              <div>
                <input 
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="显示文字 (可选)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowLinkDialog(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                取消
              </button>
              <button 
                onClick={insertLink}
                className="px-4 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-600/30 transition"
              >
                插入
              </button>
            </div>
        </div>
        )}
    </div>
  );
};

export default EditorToolbar;
