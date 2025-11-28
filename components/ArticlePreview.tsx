import React from 'react';
import { ArticleBlock, BlockType } from '../types';

interface ArticlePreviewProps {
  title: string;
  author: string;
  date: string;
  blocks: ArticleBlock[];
}

const ArticlePreview: React.FC<ArticlePreviewProps> = ({ title, author, date, blocks }) => {
  
  const renderBlock = (block: ArticleBlock) => {
    switch (block.type) {
      case BlockType.HEADER:
        return (
          <div key={block.id} className="my-6 px-4">
            <div className="flex items-center">
              <div className="w-1.5 h-6 bg-green-600 mr-2 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">{block.content}</h2>
            </div>
          </div>
        );
      case BlockType.PARAGRAPH:
        return (
          <p key={block.id} className="mb-4 px-4 text-gray-700 text-base leading-7 tracking-wide text-justify">
            {block.content}
          </p>
        );
      case BlockType.QUOTE:
        return (
          <div key={block.id} className="mx-4 my-6 p-4 bg-gray-100 border-l-4 border-gray-400 rounded-r-lg">
            <p className="text-gray-600 italic">{block.content}</p>
          </div>
        );
      case BlockType.CARD:
        return (
          <div key={block.id} className="mx-4 my-6 p-5 border border-green-100 rounded-xl shadow-sm bg-green-50/50">
            {block.title && <h3 className="text-lg font-semibold text-green-800 mb-2">{block.title}</h3>}
            <p className="text-gray-700 text-sm leading-relaxed">{block.content}</p>
          </div>
        );
      case BlockType.LIST:
        return (
          <ul key={block.id} className="mx-4 my-4 space-y-2">
            {block.items?.map((item, idx) => (
              <li key={idx} className="flex items-start text-gray-700">
                <span className="flex-shrink-0 w-2 h-2 mt-2 mr-3 bg-green-500 rounded-full"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case BlockType.IMAGE:
         // Placeholder handling if content is not a valid URL
         const imgSrc = block.content.startsWith('http') ? block.content : `https://picsum.photos/600/350?random=${block.id}`;
        return (
          <div key={block.id} className="my-6">
            <img src={imgSrc} alt="Article visual" className="w-full h-auto object-cover" />
            {block.title && <p className="text-center text-gray-500 text-xs mt-2">{block.title}</p>}
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