import React from 'react';
import HtmlEditor, { HtmlEditorRef } from '../../HtmlEditor';
import { AIProvider } from '../../../types';

interface PreviewPanelProps {
  // Article Content
  htmlContent: string;
  setHtmlContent: (content: string) => void;
  articleTitle: string;

  // TTS
  isPlaying: boolean;
  handleTTS: () => void;
  featuresAvailable: any;
  aiProvider: AIProvider;

  // HTML Editor
  htmlEditorRef: React.RefObject<HtmlEditorRef>;

  // Publishing
  isPublishing: boolean;
  handlePublish: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  htmlContent,
  setHtmlContent,
  articleTitle,
  isPlaying,
  handleTTS,
  featuresAvailable,
  aiProvider,
  htmlEditorRef,
  isPublishing,
  handlePublish
}) => {
  return (
    <div className="w-full lg:w-1/2 bg-gray-100 p-8 flex flex-col items-center justify-center relative overflow-y-auto">
      <div className="absolute top-4 right-4 flex gap-2">
        {/* TTS Button - only show if feature is available */}
        {featuresAvailable.textToSpeech && (
          <button
            onClick={handleTTS}
            disabled={aiProvider === AIProvider.DEEPSEEK}
            className={`p-1.5 rounded-full shadow-lg transition-colors ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} ${aiProvider === AIProvider.DEEPSEEK ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={aiProvider === AIProvider.DEEPSEEK ? "TTS unavailable with DeepSeek" : "Read Article Aloud"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>

      {/* Phone Mockup with HTML Editor */}
      <div className="w-[390px] h-[844px] bg-white rounded-[3.5rem] border-[12px] border-gray-900 shadow-2xl overflow-hidden relative flex flex-col shrink-0">
        {/* Status Bar */}
        <div className="h-6 bg-white w-full flex justify-between items-center px-6 pt-2 z-10 shrink-0">
          <span className="text-[10px] font-bold">9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-1.5 bg-black rounded-sm"></div>
            <div className="w-4 h-1.5 bg-black rounded-sm"></div>
            <div className="w-1 h-1.5 bg-black rounded-sm"></div>
          </div>
        </div>
        {/* App Header */}
        <div className="h-12 bg-white w-full flex items-center px-4 border-b border-gray-100 z-10 shrink-0">
          <span className="text-lg font-medium">WeChat</span>
          <div className="ml-auto flex gap-3">
            <div className="w-1 h-1 bg-black rounded-full"></div>
            <div className="w-1 h-1 bg-black rounded-full"></div>
            <div className="w-1 h-1 bg-black rounded-full"></div>
          </div>
        </div>

        {/* Editor Component */}
        <div className="flex-1 overflow-hidden relative">
          <HtmlEditor
            ref={htmlEditorRef}
            initialHtml={htmlContent}
            onChange={(newHtml) => setHtmlContent(newHtml)}
            title={articleTitle}
            author="Official Account"
            date={new Date().toLocaleDateString()}
          />
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isPublishing ? 'Publishing...' : 'Publish to WeChat'}
        </button>
      </div>
    </div>
  );
};

export default PreviewPanel;
