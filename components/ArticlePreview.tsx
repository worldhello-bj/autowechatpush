import React from 'react';
import { ArticleBlock, BlockType } from '../types';

interface ArticlePreviewProps {
  title: string;
  author: string;
  date: string;
  blocks: ArticleBlock[];
}

// Helper to get style color classes
const getStyleClass = (style?: string) => {
  switch(style) {
    case 'red': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', accent: 'bg-red-500' };
    case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' };
    case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' };
    case 'orange': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', accent: 'bg-orange-500' };
    case 'gold': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', accent: 'bg-yellow-500' };
    case 'pink': return { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', accent: 'bg-pink-500' };
    case 'cyan': return { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', accent: 'bg-cyan-500' };
    case 'teal': return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', accent: 'bg-teal-500' };
    case 'indigo': return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', accent: 'bg-indigo-500' };
    case 'amber': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', accent: 'bg-amber-500' };
    case 'rose': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', accent: 'bg-rose-500' };
    case 'lime': return { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-600', accent: 'bg-lime-500' };
    case 'gradient': return { bg: 'bg-gradient-to-r from-purple-50 to-blue-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-gradient-to-r from-purple-500 to-blue-500' };
    case 'gradient_warm': return { bg: 'bg-gradient-to-r from-orange-50 to-rose-50', border: 'border-orange-200', text: 'text-orange-600', accent: 'bg-gradient-to-r from-orange-500 to-rose-500' };
    case 'gradient_cool': return { bg: 'bg-gradient-to-r from-cyan-50 to-blue-50', border: 'border-cyan-200', text: 'text-cyan-600', accent: 'bg-gradient-to-r from-cyan-500 to-blue-500' };
    case 'gradient_nature': return { bg: 'bg-gradient-to-r from-green-50 to-teal-50', border: 'border-green-200', text: 'text-green-600', accent: 'bg-gradient-to-r from-green-500 to-teal-500' };
    default: return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', accent: 'bg-green-500' };
  }
};

// Helper to get callout icon and colors (using styled symbols for better design)
const getCalloutConfig = (icon?: string) => {
  switch(icon) {
    case 'info': return { symbol: 'i', bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', iconBg: 'bg-blue-500' };
    case 'warning': return { symbol: '!', bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', iconBg: 'bg-orange-500' };
    case 'success': return { symbol: '✓', bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', iconBg: 'bg-green-500' };
    case 'error': return { symbol: '×', bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700', iconBg: 'bg-red-500' };
    case 'tip': return { symbol: '★', bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', iconBg: 'bg-yellow-500' };
    case 'note': return { symbol: '¶', bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', iconBg: 'bg-purple-500' };
    default: return { symbol: 'i', bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', iconBg: 'bg-blue-500' };
  }
};

// Default header level when not specified
const DEFAULT_HEADER_LEVEL = 2;

const ArticlePreview: React.FC<ArticlePreviewProps> = ({ title, author, date, blocks }) => {
  
  const renderBlock = (block: ArticleBlock) => {
    const styleClass = getStyleClass(block.style);
    const alignment = block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left';

    switch (block.type) {
      case BlockType.HEADER:
        const level = Number(block.level) || DEFAULT_HEADER_LEVEL;
        const headerSize = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg';
        const barHeight = level === 1 ? 'h-7' : level === 2 ? 'h-6' : 'h-5';
        return (
          <div key={block.id} className={`my-6 px-4 ${alignment}`}>
            <div className="inline-flex items-center">
              <div className={`w-1.5 ${barHeight} ${styleClass.accent} mr-2 rounded-full`}></div>
              <h2 className={`${headerSize} font-bold text-gray-800`}>{block.content}</h2>
            </div>
          </div>
        );
      case BlockType.PARAGRAPH:
        // Check if content contains HTML tags (WeChat sections)
        const hasHtmlTags = typeof block.content === 'string' && /<[^>]+>/.test(block.content);
        
        if (hasHtmlTags) {
          // Render as HTML (for WeChat styled sections)
          return (
            <div 
              key={block.id} 
              className="wechat-section"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        }
        
        // Render as plain text
        return (
          <p key={block.id} className={`mb-4 px-4 text-gray-700 text-base leading-7 tracking-wide ${alignment}`}>
            {block.content}
          </p>
        );
      case BlockType.QUOTE:
        return (
          <div key={block.id} className={`mx-4 my-6 p-4 ${styleClass.bg} border-l-4 ${styleClass.border} rounded-r-lg ${alignment}`}>
            <p className="text-gray-600 italic">{block.content}</p>
          </div>
        );
      case BlockType.CARD:
        return (
          <div key={block.id} className={`mx-4 my-6 p-5 border ${styleClass.border} rounded-xl shadow-sm ${styleClass.bg}`}>
            {block.title && <h3 className={`text-lg font-semibold ${styleClass.text} mb-2`}>{block.title}</h3>}
            <p className="text-gray-700 text-sm leading-relaxed">{block.content}</p>
          </div>
        );
      case BlockType.LIST:
        return (
          <ul key={block.id} className="mx-4 my-4 space-y-2">
            {block.items?.map((item, idx) => (
              <li key={idx} className="flex items-start text-gray-700">
                <span className={`flex-shrink-0 w-2 h-2 mt-2 mr-3 ${styleClass.accent} rounded-full`}></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case BlockType.NUMBERED_LIST:
        return (
          <ol key={block.id} className="mx-4 my-4 space-y-3">
            {block.items?.map((item, idx) => (
              <li key={idx} className="flex items-start text-gray-700">
                <span className={`flex-shrink-0 w-6 h-6 mr-3 ${styleClass.accent} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {idx + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        );
      case BlockType.IMAGE:
         const imgSrc = block.content.startsWith('http') ? block.content : `https://picsum.photos/600/350?random=${block.id}`;
        return (
          <div key={block.id} className="my-6">
            <img src={imgSrc} alt="Article visual" className="w-full h-auto object-cover" />
            {block.title && <p className="text-center text-gray-500 text-xs mt-2">{block.title}</p>}
          </div>
        );
      case BlockType.DIVIDER:
        return (
          <div key={block.id} className="my-8 px-4 flex justify-center">
            <div className={`w-3/5 h-px ${styleClass.accent} opacity-50`}></div>
          </div>
        );
      case BlockType.CODE:
        return (
          <div key={block.id} className="mx-4 my-6 rounded-lg overflow-hidden bg-gray-900">
            <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs font-mono">
              {block.language || 'code'}
            </div>
            <pre className="p-4 text-gray-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {block.content}
            </pre>
          </div>
        );
      case BlockType.CALLOUT:
        const calloutConfig = getCalloutConfig(block.icon);
        return (
          <div key={block.id} className={`mx-4 my-6 p-4 ${calloutConfig.bg} border-l-4 ${calloutConfig.border} rounded-r-lg`}>
            <div className="flex items-start">
              <span className={`w-6 h-6 rounded-full ${calloutConfig.iconBg} text-white text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0`}>{calloutConfig.symbol}</span>
              <div>
                {block.title && <h4 className={`font-semibold ${calloutConfig.text} mb-1`}>{block.title}</h4>}
                <p className="text-gray-700 text-sm leading-relaxed">{block.content}</p>
              </div>
            </div>
          </div>
        );
      case BlockType.HIGHLIGHT:
        return (
          <div key={block.id} className={`mx-4 my-6 p-5 ${styleClass.bg} rounded-lg relative overflow-hidden ${alignment}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${styleClass.accent}`}></div>
            <p className="text-gray-800 font-medium leading-relaxed">{block.content}</p>
          </div>
        );
      case BlockType.TABLE:
        return (
          <div key={block.id} className={`mx-4 my-6 rounded-lg overflow-hidden border ${styleClass.border}`}>
            {block.title && (
              <div className={`px-4 py-3 ${styleClass.bg} font-semibold text-gray-800 border-b ${styleClass.border}`}>
                {block.title}
              </div>
            )}
            <table className="w-full">
              {block.headers && block.headers.length > 0 && (
                <thead>
                  <tr className={styleClass.accent}>
                    {block.headers.map((h, idx) => (
                      <th key={idx} className="px-4 py-3 text-white text-sm font-semibold text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.rows?.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-gray-700 text-sm text-center border-b border-gray-100">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case BlockType.SVG:
        return (
          <div key={block.id} className="my-6 overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );
      case BlockType.SECTION:
        return (
          <div key={block.id} className={`my-6 p-5 ${styleClass.bg} rounded-xl relative overflow-hidden`}>
            {/* Background decoration */}
            <div className={`absolute -top-5 -right-5 w-24 h-24 ${styleClass.accent} opacity-[0.06] rounded-full`}></div>
            <div className={`absolute -bottom-3 left-5 w-16 h-16 ${styleClass.accent} opacity-[0.04] rounded-full`}></div>
            {/* Content */}
            <div className="relative z-10">
              {block.title && <h3 className={`text-lg font-bold text-gray-800 mb-3 ${alignment}`}>{block.title}</h3>}
              {block.content && <p className="text-sm text-gray-600 leading-relaxed mb-3">{block.content}</p>}
              {/* Render children blocks */}
              {block.children?.map((child, idx) => {
                const childStyle = getStyleClass(child.style);
                return (
                  <div key={child.id || `child-${idx}`} className="mb-2">
                    {child.type === BlockType.HEADER && (
                      <h4 className="text-base font-bold text-gray-800 my-2">{child.content}</h4>
                    )}
                    {child.type === BlockType.PARAGRAPH && (
                      <p className="text-sm text-gray-600 leading-relaxed">{child.content}</p>
                    )}
                    {child.type === BlockType.CARD && (
                      <div className={`p-3 border ${childStyle.border} rounded-lg ${childStyle.bg} my-2`}>
                        {child.title && <h5 className={`text-sm font-semibold ${childStyle.text} mb-1`}>{child.title}</h5>}
                        <p className="text-xs text-gray-600 leading-relaxed">{child.content}</p>
                      </div>
                    )}
                    {child.type === BlockType.LIST && (
                      <ul className="my-2 space-y-1">
                        {child.items?.map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-600">
                            <span className={`flex-shrink-0 w-1.5 h-1.5 mt-2 mr-2 ${childStyle.accent} rounded-full`}></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {child.type === BlockType.HIGHLIGHT && (
                      <div className={`p-3 ${childStyle.bg} rounded-md relative my-2`}>
                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${childStyle.accent}`}></div>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">{child.content}</p>
                      </div>
                    )}
                    {child.type === BlockType.QUOTE && (
                      <div className={`p-3 ${childStyle.bg} border-l-4 ${childStyle.border} rounded-r-md my-2`}>
                        <p className="text-sm text-gray-600 italic">{child.content}</p>
                      </div>
                    )}
                    {(child.type === BlockType.DIVIDER) && (
                      <div className="my-3 flex justify-center">
                        <div className={`w-1/2 h-px ${childStyle.accent} opacity-30`}></div>
                      </div>
                    )}
                    {/* Fallback for other types */}
                    {(() => {
                      const handledTypes = new Set([BlockType.HEADER, BlockType.PARAGRAPH, BlockType.CARD, BlockType.LIST, BlockType.HIGHLIGHT, BlockType.QUOTE, BlockType.DIVIDER, BlockType.NUMBERED_LIST]);
                      return !handledTypes.has(child.type) ? <p className="text-sm text-gray-600 my-1">{child.content}</p> : null;
                    })()}
                    {child.type === BlockType.NUMBERED_LIST && (
                      <ol className="my-2 space-y-2">
                        {child.items?.map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-600">
                            <span className={`flex-shrink-0 w-5 h-5 mr-2 ${childStyle.accent} rounded-full flex items-center justify-center text-white text-xs font-bold`}>{i + 1}</span>
                            <span className="pt-0.5">{item}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white overflow-y-auto">
      {/* WeChat Header Mimic */}
      <div className="p-5 pb-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">{title}</h1>
        <div className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
           <span className="text-green-600 font-medium">{author}</span>
           <span>{date}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="pb-10 font-sans">
        {blocks.map(renderBlock)}
      </div>

      {/* Footer mimic */}
      <div className="px-4 pb-8 pt-4 border-t border-gray-100 text-gray-400 text-xs flex justify-between">
         <span>Read 100k+</span>
         <div className="flex gap-2">
            <span>Like 456</span>
            <span>Wow 123</span>
         </div>
      </div>
    </div>
  );
};

export default ArticlePreview;