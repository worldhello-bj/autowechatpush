import React from 'react';
import HtmlEditor, { HtmlEditorRef } from '../../HtmlEditor';
import EditorToolbar from './EditorToolbar';
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
    <div className="w-full lg:w-1/2 p-4 lg:p-8 flex flex-col items-center relative overflow-y-auto rounded-2xl bg-slate-50/50">
      {/* Floating Toolbar */}
      <div className="sticky top-0 z-40 mb-6">
        <EditorToolbar editorRef={htmlEditorRef} />
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-20">
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
      <div className="w-[430px] h-[932px] bg-white rounded-[3.5rem] border-[14px] border-gray-900 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative flex flex-col shrink-0 transition-transform hover:scale-[1.005] duration-500 mb-20">
        {/* Dynamic Island / Notch Area (iPhone 14 Pro Max style) */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-[35px] w-[126px] bg-black rounded-b-3xl z-20"></div>
        
        {/* Status Bar */}
        <div className="h-12 bg-white w-full flex justify-between items-center px-8 pt-4 z-10 shrink-0 select-none">
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

      <div className="fixed bottom-8 right-8 lg:absolute lg:bottom-8 lg:right-auto flex gap-4 z-50">
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-full shadow-xl hover:shadow-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 flex items-center gap-2"
        >
          <span className="material-icons">send</span>
          {isPublishing ? '发布中...' : '发布到微信'}
        </button>
      </div>
    </div>
  );
};

export default PreviewPanel;
