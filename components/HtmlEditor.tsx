import React, { useEffect, useRef, useState } from 'react';

interface HtmlEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  title: string;
  author: string;
  date: string;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({ initialHtml, onChange, title, author, date }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  }, [showSource, internalHtml]);

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

  const insertHtmlAtCursor = (html: string) => {
    if (showSource) return; // Only works in visual mode

    // Focus the editor first
    if (contentRef.current) {
        contentRef.current.focus();
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && contentRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();

        // Create a temporary container for the HTML
        const el = document.createElement("div");
        el.innerHTML = html;
        
        const frag = document.createDocumentFragment();
        let node; 
        let lastNode;
        while ((node = el.firstChild)) {
            lastNode = frag.appendChild(node);
        }
        
        range.insertNode(frag);

        // Move cursor after inserted content
        if (lastNode) {
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    } else {
        // Fallback: Append to end if no selection
        if (contentRef.current) {
            contentRef.current.innerHTML += html;
        }
    }
    handleInput();
  };

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
        reader.onerror = () => {
            console.error("Failed to read image file");
        };
        reader.onload = (ev) => {
            const src = ev.target?.result as string;
            if (!src) return;
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
                onBlur={handleInput}
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
};

export default HtmlEditor;