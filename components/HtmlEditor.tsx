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

    // Save scroll position before focus to prevent scroll jump
    const scrollContainer = contentRef.current.closest('.overflow-y-auto');
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
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 overflow-x-auto shrink-0">
        <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Bold">
            <span className="material-icons text-sm font-bold">format_bold</span>
        </button>
        <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Italic">
            <span className="material-icons text-sm italic">format_italic</span>
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button onClick={() => execCmd('formatBlock', '<h3>')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold" title="Header">
             H
        </button>
        <button onClick={() => execCmd('formatBlock', '<p>')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-serif" title="Paragraph">
             P
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button onClick={insertCard} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 flex items-center gap-1" title="Insert Card / Text Box">
            <span className="material-icons text-sm">check_box_outline_blank</span>
        </button>
        <button onClick={triggerImageUpload} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 flex items-center gap-1" title="Insert Image">
            <span className="material-icons text-sm">add_photo_alternate</span>
        </button>
        
        <div className="ml-auto">
            <button 
                onClick={toggleSource} 
                className={`text-xs font-medium px-2 py-1 rounded border transition-colors ${showSource ? 'bg-green-100 text-green-700 border-green-200' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                {showSource ? 'Visual' : 'HTML'}
            </button>
        </div>
      </div>

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
                className="prose max-w-none px-5 pb-10 focus:outline-none article-content min-h-[300px]"
                contentEditable
                onInput={handleInput}
                onBlur={() => {
                    // Save cursor position before losing focus
                    saveCursorPosition();
                    handleInput();
                }}
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