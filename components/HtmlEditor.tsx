import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface HtmlEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  title: string;
  author: string;
  date: string;
}

// Exposed methods for parent component
export interface HtmlEditorRef {
  insertHtmlAtCursor: (html: string) => void;
  focus: () => void;
  saveCursorPosition: () => void;
}

// Saved cursor position info that survives DOM changes
interface SavedCursorPosition {
  range: Range;
  // Also save character offset from start of editor as fallback
  charOffset: number;
}

const HtmlEditor = forwardRef<HtmlEditorRef, HtmlEditorProps>(({ initialHtml, onChange, title, author, date }, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedPositionRef = useRef<SavedCursorPosition | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [internalHtml, setInternalHtml] = useState(initialHtml);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Sync incoming props to internal state.
  // We separate the prop sync from the visual DOM sync to handle the source view correctly.
  useEffect(() => {
    setInternalHtml(initialHtml);
    
    // If we are in visual mode, we only update the DOM if it's significantly different
    // to avoid cursor jumping (e.g. if the update originated from this component).
    if (!showSource && contentRef.current) {
        if (contentRef.current.innerHTML !== initialHtml) {
            contentRef.current.innerHTML = initialHtml;
        }
    }
  }, [initialHtml, showSource]);

  // When switching from Source -> Visual, we must populate the contentEditable div
  // AFTER it has been mounted. The dependency on [showSource] ensures this runs right after render.
  useEffect(() => {
    if (!showSource && contentRef.current) {
        // Force update the visual editor with the current internal HTML
        contentRef.current.innerHTML = internalHtml;
    }
  }, [showSource]);

  const handleInput = () => {
    if (contentRef.current) {
      const html = contentRef.current.innerHTML;
      setInternalHtml(html);
      onChange(html);
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInternalHtml(val);
    onChange(val);
  };

  const toggleSource = () => {
    setShowSource(!showSource);
  };

  const execCmd = (command: string, value: string = '') => {
    // Ensure the editor is focused before executing commands
    if (contentRef.current) {
      contentRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleInput(); // sync change
  };

  // --- Insert Logic ---

  // Helper: Calculate character offset from start of contentEditable
  const getCharOffset = (container: Node, offset: number, root: HTMLElement): number => {
    let charCount = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    
    while ((node = walker.nextNode())) {
      if (node === container) {
        return charCount + offset;
      }
      charCount += (node.textContent?.length || 0);
    }
    
    // If we're at an element node, count up to that position
    return charCount;
  };

  // Helper: Find position from character offset
  const findPositionFromOffset = (targetOffset: number, root: HTMLElement): { node: Node; offset: number } | null => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let charCount = 0;
    let node: Node | null;
    let lastNode: Node | null = null;
    
    while ((node = walker.nextNode())) {
      const length = node.textContent?.length || 0;
      if (charCount + length >= targetOffset) {
        return { node, offset: targetOffset - charCount };
      }
      charCount += length;
      lastNode = node;
    }
    
    // Return end of last text node or null
    if (lastNode) {
      return { node: lastNode, offset: lastNode.textContent?.length || 0 };
    }
    return null;
  };

  // Save the current cursor position for later use (e.g., before opening a modal)
  const saveCursorPosition = () => {
    if (showSource || !contentRef.current) return;
    
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.anchorNode && contentRef.current.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0).cloneRange();
      const charOffset = getCharOffset(range.startContainer, range.startOffset, contentRef.current);
      
      savedPositionRef.current = {
        range: range,
        charOffset: charOffset
      };
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    if (showSource) {
      // In source mode, append to end of text
      const newHtml = internalHtml + '\n' + html;
      setInternalHtml(newHtml);
      onChange(newHtml);
      return;
    }

    if (!contentRef.current) return;

    // Find scrollable parent container
    // Walk up the DOM tree to find the first scrollable ancestor
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;
      let current: HTMLElement | null = element.parentElement;
      while (current) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    };

    // Save scroll position before focus to prevent scroll jump
    const scrollContainer = findScrollableParent(contentRef.current);
    const savedScrollTop = scrollContainer?.scrollTop || 0;

    // Focus the editor first
    contentRef.current.focus();

    // Restore scroll position immediately after focus
    if (scrollContainer) {
      scrollContainer.scrollTop = savedScrollTop;
    }

    const sel = window.getSelection();
    
    // Determine which range to use
    // PRIORITY: Saved position > Current selection > Fallback
    let rangeToUse: Range | null = null;
    
    // Try 1: Use saved range if its startContainer is still in the DOM
    // This is prioritized because the modal interaction loses the real cursor position
    // Wrap in try-catch in case the DOM node was removed or is invalid
    try {
      if (savedPositionRef.current?.range?.startContainer && 
          contentRef.current && 
          contentRef.current.contains(savedPositionRef.current.range.startContainer)) {
        rangeToUse = savedPositionRef.current.range;
      }
    } catch {
      // DOM node may have been removed, fall through to next option
      rangeToUse = null;
    }
    
    // Try 2: Reconstruct range from character offset (if saved range was invalidated)
    if (!rangeToUse && savedPositionRef.current && savedPositionRef.current.charOffset >= 0 && contentRef.current) {
      const position = findPositionFromOffset(savedPositionRef.current.charOffset, contentRef.current);
      if (position) {
        rangeToUse = document.createRange();
        try {
          rangeToUse.setStart(position.node, position.offset);
          rangeToUse.collapse(true);
        } catch {
          rangeToUse = null;
        }
      }
    }
    
    // Try 3: Use current selection if no saved position (direct insert without modal)
    if (!rangeToUse && sel && sel.rangeCount > 0 && sel.anchorNode && contentRef.current && contentRef.current.contains(sel.anchorNode)) {
      rangeToUse = sel.getRangeAt(0);
    }
    
    if (rangeToUse && sel && contentRef.current) {
        // Apply the range to the selection
        sel.removeAllRanges();
        sel.addRange(rangeToUse);
        
        // Use execCommand insertHTML for contentEditable
        // Note: execCommand is deprecated but still widely supported for contentEditable
        // and provides better cross-browser behavior than manual DOM manipulation
        document.execCommand('insertHTML', false, html);
        
        // Clear saved position after use
        savedPositionRef.current = null;
    } else if (contentRef.current) {
        // Fallback: Append to end if no valid position found
        contentRef.current.innerHTML += html;
    }
    
    // Restore scroll position after insertion to prevent scroll jump
    if (scrollContainer) {
      scrollContainer.scrollTop = savedScrollTop;
    }
    
    handleInput();
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    insertHtmlAtCursor,
    focus: () => contentRef.current?.focus(),
    saveCursorPosition
  }));

  const insertCard = () => {
    const cardHtml = `
      <section style="margin: 20px 0; padding: 20px; border: 1px solid #e0f2e9; background-color: #f6fffa; border-radius: 8px; box-shadow: 0 2px 4px rgba(7, 193, 96, 0.1);">
          <section style="font-size: 16px; font-weight: bold; color: #07c160; margin-bottom: 8px;">Title Here</section>
          <section style="font-size: 14px; color: #555; line-height: 1.6;">Enter your text content here...</section>
      </section>
      <p><br/></p>
    `;
    insertHtmlAtCursor(cardHtml);
  };

  // Insert Quote Block
  const insertQuote = () => {
    const quoteHtml = `
      <section style="margin: 20px 0; padding: 15px 20px; background-color: #f7f7f7; border-left: 4px solid #07c160; border-radius: 0 8px 8px 0;">
          <section style="font-size: 15px; color: #666; font-style: italic; line-height: 1.6;">Enter quote here...</section>
      </section>
      <p><br/></p>
    `;
    insertHtmlAtCursor(quoteHtml);
  };

  // Insert Horizontal Divider
  const insertDivider = () => {
    const dividerHtml = `
      <section style="margin: 25px 0; text-align: center;">
          <section style="display: inline-block; width: 60%; height: 1px; background: linear-gradient(90deg, transparent, #07c160, transparent);"></section>
      </section>
      <p><br/></p>
    `;
    insertHtmlAtCursor(dividerHtml);
  };

  // Apply text color with validation
  const applyTextColor = (color: string) => {
    // Validate hex color format to prevent injection
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      execCmd('foreColor', color);
    }
    setShowColorPicker(false);
  };

  // HTML escape helper to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Insert link with proper sanitization
  const insertLink = () => {
    if (linkUrl) {
      // Validate URL to prevent javascript: and other malicious protocols
      let sanitizedUrl = linkUrl.trim();
      let isValidUrl = false;
      
      try {
        const url = new URL(sanitizedUrl, window.location.origin);
        // Only allow http, https, and mailto protocols
        if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
          sanitizedUrl = url.href;
          isValidUrl = true;
        }
      } catch {
        // URL parsing failed
        isValidUrl = false;
      }
      
      // For invalid or relative URLs, default to '#' for safety
      if (!isValidUrl) {
        sanitizedUrl = '#';
      }
      
      const displayText = escapeHtml(linkText || linkUrl);
      // Don't escape the already-validated URL (it would break the href)
      const linkHtml = `<a href="${sanitizedUrl}" style="color: #07c160; text-decoration: underline;">${displayText}</a>`;
      insertHtmlAtCursor(linkHtml);
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  // Close color picker on escape key
  const handleColorPickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowColorPicker(false);
    }
  };

  // Color palette for text color picker with names for accessibility
  const colorPalette = [
    { hex: '#000000', name: '黑色 Black' },
    { hex: '#333333', name: '深灰 Dark Gray' },
    { hex: '#666666', name: '灰色 Gray' },
    { hex: '#999999', name: '浅灰 Light Gray' },
    { hex: '#07c160', name: '微信绿 WeChat Green' },
    { hex: '#10b981', name: '翠绿 Emerald' },
    { hex: '#3b82f6', name: '蓝色 Blue' },
    { hex: '#6366f1', name: '靛蓝 Indigo' },
    { hex: '#8b5cf6', name: '紫色 Purple' },
    { hex: '#ec4899', name: '粉色 Pink' },
    { hex: '#ef4444', name: '红色 Red' },
    { hex: '#f97316', name: '橙色 Orange' },
    { hex: '#eab308', name: '黄色 Yellow' },
    { hex: '#84cc16', name: '青绿 Lime' },
    { hex: '#14b8a6', name: '青色 Teal' },
    { hex: '#06b6d4', name: '天蓝 Cyan' }
  ];

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target?.result as string;
            const imgHtml = `
                <section style="margin: 20px 0; text-align: center;">
                    <img src="${src}" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                    <section style="font-size: 12px; color: #888; margin-top: 6px;">Image Caption</section>
                </section>
                <p><br/></p>
            `;
            insertHtmlAtCursor(imgHtml);
        };
        reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle drag and drop for images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Visual feedback: add a class or style when dragging over
    if (contentRef.current && e.dataTransfer.types.includes('Files')) {
      contentRef.current.style.outline = '2px dashed #10b981';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only remove outline if actually leaving the editor (not just moving between children)
    if (contentRef.current && 
        e.relatedTarget && 
        !contentRef.current.contains(e.relatedTarget as Node)) {
      contentRef.current.style.outline = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback
    if (contentRef.current) {
      contentRef.current.style.outline = '';
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        const target = e.target as HTMLElement;
        
        // Check if dropped on an existing image (placeholder or otherwise)
        let imgElement: HTMLImageElement | null = null;
        if (target.tagName === 'IMG') {
          imgElement = target as HTMLImageElement;
        } else {
          // Check if target contains an image
          imgElement = target.querySelector('img');
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          
          if (imgElement) {
            // Replace existing image using DOM methods (secure)
            imgElement.setAttribute('src', src);
            imgElement.removeAttribute('data-placeholder');
            handleInput();
          } else {
            // Insert new image at drop location
            // Create image element securely
            const section = document.createElement('section');
            section.style.margin = '20px 0';
            section.style.textAlign = 'center';
            
            const img = document.createElement('img');
            img.setAttribute('src', src);
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '6px';
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            
            const caption = document.createElement('section');
            caption.style.fontSize = '12px';
            caption.style.color = '#888';
            caption.style.marginTop = '6px';
            caption.textContent = 'Image Caption';
            
            const spacer = document.createElement('p');
            spacer.innerHTML = '<br/>';
            
            section.appendChild(img);
            section.appendChild(caption);
            
            // Insert at cursor position or at the end
            if (contentRef.current && document.getSelection()?.rangeCount) {
              const selection = document.getSelection();
              const range = selection!.getRangeAt(0);
              
              // Only delete contents if range is not collapsed (has selection)
              if (!range.collapsed) {
                range.deleteContents();
              }
              
              range.insertNode(spacer);
              range.insertNode(section);
              handleInput();
            } else {
              // Fallback: append to content
              if (contentRef.current) {
                contentRef.current.appendChild(section);
                contentRef.current.appendChild(spacer);
                handleInput();
              }
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageFile} 
        className="hidden" 
        accept="image/*"
      />

      {/* Toolbar */}
      <div 
        className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-50"
        role="toolbar"
        aria-label="文章格式化工具栏"
      >
        {/* Undo/Redo */}
        <button onClick={() => execCmd('undo')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="撤销 (Undo)">
            <span className="material-icons text-[20px]">undo</span>
        </button>
        <button onClick={() => execCmd('redo')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="重做 (Redo)">
            <span className="material-icons text-[20px]">redo</span>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>
        
        {/* Text Formatting */}
        <button onClick={() => execCmd('bold')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="加粗 (Bold)">
            <span className="material-icons text-[20px]">format_bold</span>
        </button>
        <button onClick={() => execCmd('italic')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="斜体 (Italic)">
            <span className="material-icons text-[20px]">format_italic</span>
        </button>
        <button onClick={() => execCmd('underline')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="下划线 (Underline)">
            <span className="material-icons text-[20px]">format_underlined</span>
        </button>
        <button onClick={() => execCmd('strikeThrough')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="删除线 (Strikethrough)">
            <span className="material-icons text-[20px]">strikethrough_s</span>
        </button>
        
        {/* Text Color */}
        <div className="relative" onKeyDown={handleColorPickerKeyDown}>
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)} 
            className="h-8 px-1 flex justify-center items-center gap-0.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" 
            title="文字颜色"
            aria-haspopup="true"
            aria-expanded={showColorPicker}
          >
            <span className="material-icons text-[20px]">format_color_text</span>
            <span className="material-icons text-[14px] text-gray-500">arrow_drop_down</span>
          </button>
          {showColorPicker && (
            <div 
              className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 grid grid-cols-4 gap-1"
              role="listbox"
              aria-label="选择文字颜色"
            >
              {colorPalette.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => applyTextColor(color.hex)}
                  className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={color.name}
                  role="option"
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Clear Format */}
        <button onClick={() => execCmd('removeFormat')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="清除格式">
            <span className="material-icons text-[20px]">format_clear</span>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>
        
        {/* Headers */}
        <button onClick={() => execCmd('formatBlock', '<h2>')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 font-bold text-sm" title="标题 2">
             H2
        </button>
        <button onClick={() => execCmd('formatBlock', '<h3>')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 font-bold text-sm" title="标题 3">
             H3
        </button>
        <button onClick={() => execCmd('formatBlock', '<p>')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 text-sm" title="段落">
             P
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>
        
        {/* Alignment */}
        <button onClick={() => execCmd('justifyLeft')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="左对齐">
            <span className="material-icons text-[20px]">format_align_left</span>
        </button>
        <button onClick={() => execCmd('justifyCenter')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="居中对齐">
            <span className="material-icons text-[20px]">format_align_center</span>
        </button>
        <button onClick={() => execCmd('justifyRight')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="右对齐">
            <span className="material-icons text-[20px]">format_align_right</span>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>
        
        {/* Lists */}
        <button onClick={() => execCmd('insertUnorderedList')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="无序列表">
            <span className="material-icons text-[20px]">format_list_bulleted</span>
        </button>
        <button onClick={() => execCmd('insertOrderedList')} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="有序列表">
            <span className="material-icons text-[20px]">format_list_numbered</span>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>
        
        {/* Insert Elements */}
        <button onClick={() => setShowLinkDialog(true)} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="插入链接">
            <span className="material-icons text-[20px]">link</span>
        </button>
        <button onClick={triggerImageUpload} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="插入图片">
            <span className="material-icons text-[20px]">add_photo_alternate</span>
        </button>
        <button onClick={insertQuote} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="插入引用">
            <span className="material-icons text-[20px]">format_quote</span>
        </button>
        <button onClick={insertCard} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="插入卡片">
            <span className="material-icons text-[20px]">dashboard</span>
        </button>
        <button onClick={insertDivider} className="w-8 h-8 flex justify-center items-center hover:bg-gray-200 rounded text-gray-700 transition-colors" title="插入分割线">
            <span className="material-icons text-[20px]">horizontal_rule</span>
        </button>
        
        <div className="ml-auto flex items-center gap-1">
            <button 
                onClick={toggleSource} 
                className={`px-2 h-8 flex items-center justify-center rounded border text-xs font-medium transition-colors ${showSource ? 'bg-green-100 text-green-700 border-green-200' : 'text-gray-600 hover:bg-gray-200 border-gray-200 bg-white'}`}
            >
                {showSource ? '可视化' : 'HTML'}
            </button>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div 
          className="absolute inset-0 bg-black/30 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-dialog-title"
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowLinkDialog(false); setLinkUrl(''); setLinkText(''); } }}
        >
          <div className="bg-white rounded-lg shadow-xl p-4 w-80">
            <h3 id="link-dialog-title" className="text-sm font-bold text-gray-800 mb-3">插入链接</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="link-url-input" className="block text-xs text-gray-600 mb-1">链接地址</label>
                <input 
                  id="link-url-input"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="link-text-input" className="block text-xs text-gray-600 mb-1">显示文字 (可选)</label>
                <input 
                  id="link-text-input"
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="点击这里"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => { setShowLinkDialog(false); setLinkUrl(''); setLinkText(''); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                取消
              </button>
              <button 
                onClick={insertLink}
                disabled={!linkUrl}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative scroll-smooth">
         {/* WeChat Header Simulation */}
        <div className="px-5 pt-5 pb-0 select-none">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">{title}</h1>
            <div className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
                <span className="text-green-600 font-medium">{author}</span>
                <span>{date}</span>
            </div>
        </div>

        {showSource ? (
            <textarea 
                className="w-full h-full p-4 font-mono text-sm text-gray-800 bg-gray-50 resize-none outline-none"
                value={internalHtml}
                onChange={handleSourceChange}
            />
        ) : (
            <div 
                ref={contentRef}
                className="max-w-none px-5 pb-10 focus:outline-none article-content min-h-[300px]"
                contentEditable
                onInput={handleInput}
                onBlur={() => {
                    // Save cursor position before losing focus
                    saveCursorPosition();
                    handleInput();
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                suppressContentEditableWarning={true}
            />
        )}
      </div>
      
      {/* Footer Simulation */}
      <div className="px-4 pb-8 pt-4 border-t border-gray-100 text-gray-400 text-xs flex justify-between select-none shrink-0">
         <span>Read 100k+</span>
         <div className="flex gap-2">
            <span>Like 456</span>
            <span>Wow 123</span>
         </div>
      </div>
    </div>
  );
});

export default HtmlEditor;