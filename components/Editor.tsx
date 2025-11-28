import React, { useState, useRef, useEffect } from 'react';
import { generateArticleStructure, analyzeImage, generateSpeech, GenerationResult } from '../services/geminiService';
import { generateArticleStructureDeepSeek } from '../services/deepSeekService';
import { generateArticleStructureQwen, analyzeImageQwen, generateSpeechQwen } from '../services/qwenService';
import HtmlEditor from './HtmlEditor';
import { ArticleBlock, GroundingSource, WeChatCredentials, BlockType, AIProvider } from '../types';
import { getAccessToken, saveDraft, uploadImage } from '../services/wechatService';

interface EditorProps {
  onError: (msg: string) => void;
}

// --- Helper: Base64 to Blob ---
const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// --- Helper: Convert Blocks to WeChat-compatible HTML ---
const convertBlocksToHtml = (blocks: ArticleBlock[]): string => {
  if (!blocks || blocks.length === 0) return '';
  
  return blocks.map(block => {
    switch (block.type) {
      case BlockType.HEADER:
        return `
          <section style="margin: 20px 0 10px 0; text-align: left;">
            <section style="display: flex; align-items: center;">
               <section style="width: 4px; height: 18px; background-color: #07c160; border-radius: 2px; margin-right: 8px;"></section>
               <section style="font-size: 18px; font-weight: bold; color: #333;">${block.content}</section>
            </section>
          </section>
        `;
      case BlockType.PARAGRAPH:
        return `
          <section style="margin-bottom: 16px; font-size: 16px; line-height: 1.8; color: #444; text-align: justify; letter-spacing: 0.5px;">
            ${block.content}
          </section>
        `;
      case BlockType.QUOTE:
        return `
          <section style="margin: 20px 0; padding: 15px; background-color: #f7f7f7; border-left: 4px solid #07c160; border-radius: 0 4px 4px 0;">
            <section style="font-size: 15px; color: #666; font-style: italic; line-height: 1.6;">${block.content}</section>
          </section>
        `;
      case BlockType.CARD:
        return `
          <section style="margin: 20px 0; padding: 20px; border: 1px solid #e0f2e9; background-color: #f6fffa; border-radius: 8px; box-shadow: 0 2px 4px rgba(7, 193, 96, 0.1);">
            ${block.title ? `<section style="font-size: 16px; font-weight: bold; color: #07c160; margin-bottom: 8px;">${block.title}</section>` : ''}
            <section style="font-size: 14px; color: #555; line-height: 1.6;">${block.content}</section>
          </section>
        `;
      case BlockType.LIST:
        const listItems = block.items?.map(item => `
          <section style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <section style="width: 6px; height: 6px; background-color: #07c160; border-radius: 50%; margin-top: 9px; margin-right: 10px; flex-shrink: 0;"></section>
            <section style="font-size: 16px; color: #444; line-height: 1.6;">${item}</section>
          </section>
        `).join('') || '';
        return `<section style="margin: 15px 0;">${listItems}</section>`;
      case BlockType.IMAGE:
        const imgSrc = block.content.startsWith('http') ? block.content : `https://picsum.photos/600/350?random=${block.id}`;
        return `
          <section style="margin: 20px 0; text-align: center;">
            <img src="${imgSrc}" style="width: 100%; height: auto; border-radius: 6px; display: block;" />
            ${block.title ? `<section style="font-size: 12px; color: #888; margin-top: 8px;">${block.title}</section>` : ''}
          </section>
        `;
      default:
        return '';
    }
  }).join('');
};

const DRAFT_KEY = 'wechat_editor_draft';
const CREDS_KEY = 'wechat_creds';
const PROVIDER_KEY = 'ai_provider';
const GOOGLE_KEY = 'google_api_key';
const DEEPSEEK_KEY = 'deepseek_key';
const DASHSCOPE_KEY = 'dashscope_key';

const Editor: React.FC<EditorProps> = ({ onError }) => {
  // --- State ---
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [imageContext, setImageContext] = useState<string>('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  
  // WeChat Config
  const [wechatCreds, setWechatCreds] = useState<WeChatCredentials>({ appId: '', appSecret: '' });
  const [showConfig, setShowConfig] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // AI Provider Config
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.GOOGLE);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [deepSeekApiKey, setDeepSeekApiKey] = useState('');
  const [dashScopeApiKey, setDashScopeApiKey] = useState('');

  // Article Content
  const [articleTitle, setArticleTitle] = useState('New Article');
  const [articleDigest, setArticleDigest] = useState('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  
  // HTML Content State
  const [htmlContent, setHtmlContent] = useState<string>('<p style="color:#888; text-align:center;">Generated content will appear here...</p>');
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Draft State
  const [foundDraft, setFoundDraft] = useState(false);

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!topic.trim()) {
        onError("Please enter a topic");
        return;
    }
    setLoading(true);
    
    try {
      let result: GenerationResult;
      
      if (aiProvider === AIProvider.DEEPSEEK) {
        if (!deepSeekApiKey) throw new Error("DeepSeek API Key is missing. Please configure it in Settings.");
        result = await generateArticleStructureDeepSeek(topic, deepSeekApiKey);
      } else if (aiProvider === AIProvider.QWEN) {
        if (!dashScopeApiKey) throw new Error("DashScope API Key is missing. Please configure it in Settings.");
        result = await generateArticleStructureQwen(topic, dashScopeApiKey, useSearch, imageContext);
      } else {
        // Default to Google
        result = await generateArticleStructure(topic, useSearch, imageContext, googleApiKey);
      }

      setArticleTitle(result.title);
      setArticleDigest(result.digest);
      setSources(result.sources);
      
      const generatedHtml = convertBlocksToHtml(result.blocks);
      setHtmlContent(generatedHtml);

    } catch (e: any) {
      onError(e.message || "Failed to generate article");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Base64 Preview always works
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const mimeType = file.type;
      setUploadedImagePreview(reader.result as string);

      // Analyze if Google or Qwen
      if (aiProvider === AIProvider.GOOGLE || aiProvider === AIProvider.QWEN) {
        setAnalyzingImage(true);
        try {
          let analysis = "";
          if (aiProvider === AIProvider.QWEN) {
             if (!dashScopeApiKey) throw new Error("DashScope Key missing for analysis.");
             analysis = await analyzeImageQwen(base64String, mimeType, dashScopeApiKey);
          } else {
             analysis = await analyzeImage(base64String, mimeType, googleApiKey);
          }
          setImageContext(analysis);
        } catch (err: any) {
          onError("Failed to analyze image: " + err.message);
        } finally {
          setAnalyzingImage(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTTS = async () => {
    if (aiProvider === AIProvider.DEEPSEEK) {
        onError("TTS is not supported with DeepSeek.");
        return;
    }

    if (isPlaying) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsPlaying(false);
      return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textToRead = tempDiv.textContent || tempDiv.innerText || "";
    
    if (textToRead.length < 5) {
        onError("Content too short to read.");
        return;
    }

    try {
      setIsPlaying(true);
      
      let audioBufferData: ArrayBuffer;
      if (aiProvider === AIProvider.QWEN) {
          if (!dashScopeApiKey) throw new Error("DashScope Key missing for TTS.");
          audioBufferData = await generateSpeechQwen(textToRead.slice(0, 500), dashScopeApiKey);
      } else {
          audioBufferData = await generateSpeech(textToRead.slice(0, 800), googleApiKey); 
      }
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const audioBuffer = await ctx.decodeAudioData(audioBufferData);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
      audioSourceRef.current = source;
    } catch (err: any) {
      onError("Failed to generate speech: " + err.message);
      setIsPlaying(false);
    }
  };
  
  const handlePublish = async () => {
     if (!wechatCreds.appId || !wechatCreds.appSecret) {
         setShowConfig(true);
         onError("Please configure WeChat Credentials first.");
         return;
     }
     
     setIsPublishing(true);
     try {
         const token = await getAccessToken(wechatCreds);
         
         let thumb_media_id = ""; 
         if (uploadedImagePreview) {
             const imageBlob = dataURLtoBlob(uploadedImagePreview);
             thumb_media_id = await uploadImage(token, imageBlob);
         } else {
             console.warn("No cover image found, attempting to upload default or simulate.");
             thumb_media_id = "MEDIA_ID_PLACEHOLDER_NO_IMAGE"; 
         }

         const payload = {
             articles: [{
                 title: articleTitle,
                 author: "AI Assistant",
                 digest: articleDigest,
                 content: htmlContent,
                 content_source_url: "",
                 thumb_media_id: thumb_media_id,
                 show_cover_pic: 1,
                 need_open_comment: 1,
                 only_fans_can_comment: 0
             }]
         };
         
         const result = await saveDraft(token, payload);
         alert(`Success! Article saved to WeChat Draft Box.\nMedia ID: ${result.media_id || 'Simulated'}`);

     } catch (e: any) {
         onError(e.message || "Failed to publish to WeChat");
     } finally {
         setIsPublishing(false);
     }
  };

  // --- Draft Logic ---
  
  const saveLocalDraft = () => {
    const draft = {
      title: articleTitle,
      digest: articleDigest,
      content: htmlContent,
      topic: topic,
      timestamp: Date.now()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    alert("Draft saved locally!");
  };

  const loadLocalDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    
    setArticleTitle(draft.title || 'Untitled');
    setArticleDigest(draft.digest || '');
    setHtmlContent(draft.content || '');
    setTopic(draft.topic || '');
    setFoundDraft(false);
  };

  const handleConfigSave = () => {
      localStorage.setItem(CREDS_KEY, JSON.stringify(wechatCreds));
      setShowConfig(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
        setFoundDraft(true);
    }

    const rawCreds = localStorage.getItem(CREDS_KEY);
    if (rawCreds) {
        try {
            setWechatCreds(JSON.parse(rawCreds));
        } catch(e) {}
    }

    const savedProvider = localStorage.getItem(PROVIDER_KEY);
    if (savedProvider) setAiProvider(savedProvider as AIProvider);

    const savedGoogleKey = localStorage.getItem(GOOGLE_KEY);
    if (savedGoogleKey) setGoogleApiKey(savedGoogleKey);

    const savedDSKey = localStorage.getItem(DEEPSEEK_KEY);
    if (savedDSKey) setDeepSeekApiKey(savedDSKey);

    const savedDashKey = localStorage.getItem(DASHSCOPE_KEY);
    if (savedDashKey) setDashScopeApiKey(savedDashKey);

    return () => {
       if (audioSourceRef.current) audioSourceRef.current.stop();
       if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Helper to determine badge color
  const getProviderColor = () => {
      switch(aiProvider) {
          case AIProvider.GOOGLE: return 'bg-green-500';
          case AIProvider.DEEPSEEK: return 'bg-blue-500';
          case AIProvider.QWEN: return 'bg-purple-500';
          default: return 'bg-gray-500';
      }
  };

  const getProviderName = () => {
       switch(aiProvider) {
          case AIProvider.GOOGLE: return 'Google Gemini';
          case AIProvider.DEEPSEEK: return 'DeepSeek';
          case AIProvider.QWEN: return 'Qwen (Tongyi)';
          default: return 'Unknown';
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      
      {/* Draft Notification */}
      {foundDraft && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
            <span className="text-sm font-medium">Found an unsaved draft from a previous session.</span>
            <div className="flex gap-3">
                <button onClick={() => setFoundDraft(false)} className="text-blue-100 hover:text-white text-sm">Discard</button>
                <button onClick={loadLocalDraft} className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-bold hover:bg-blue-50">Restore Draft</button>
            </div>
        </div>
      )}

      {/* Settings Modal (Quick Access) */}
      {showConfig && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">WeChat API Configuration</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">AppID</label>
                          <input 
                            type="text" 
                            value={wechatCreds.appId} 
                            onChange={e => setWechatCreds(prev => ({...prev, appId: e.target.value}))}
                            className="w-full mt-1 p-2 border rounded"
                            placeholder="wx..."
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">AppSecret</label>
                          <input 
                            type="password" 
                            value={wechatCreds.appSecret} 
                            onChange={e => setWechatCreds(prev => ({...prev, appSecret: e.target.value}))}
                            className="w-full mt-1 p-2 border rounded"
                          />
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                      <button onClick={() => setShowConfig(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={handleConfigSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                  </div>
              </div>
          </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">New User Guide</h3>
                      <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">
                          <span className="material-icons">close</span>
                      </button>
                  </div>
                  
                  <div className="prose prose-sm prose-green max-w-none">
                      <p>Follow these steps to automate your WeChat Official Account publishing.</p>
                      <h4>1. Get Credentials</h4>
                      <ul>
                          <li>Log in to WeChat Official Account Admin.</li>
                          <li>Go to <strong>Development</strong> &gt; <strong>Basic Configuration</strong>.</li>
                          <li>Copy your <strong>AppID</strong> and <strong>AppSecret</strong>.</li>
                      </ul>
                      <h4>2. Whitelist IP</h4>
                      <ul>
                          <li>In Basic Configuration, add your current IP address to the whitelist.</li>
                      </ul>
                      <h4>3. Publishing</h4>
                      <ul>
                          <li>Generate content with AI.</li>
                          <li>Edit visually in the right panel.</li>
                          <li>Save draft locally if needed.</li>
                          <li>Click "Publish to WeChat" to send to Draft Box.</li>
                      </ul>
                  </div>
                  <div className="mt-6 flex justify-end">
                      <button onClick={() => setShowGuide(false)} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Got it</button>
                  </div>
              </div>
          </div>
      )}

      {/* Left Panel: Controls */}
      <div className="w-full lg:w-1/2 p-6 flex flex-col gap-6 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">Editor Workspace</h2>
                    <button onClick={() => setShowGuide(true)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1">
                        <span className="material-icons text-[14px]">help_outline</span> Guide
                    </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${getProviderColor()}`}></span>
                  <p className="text-gray-500 text-sm">Powered by {getProviderName()}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={saveLocalDraft} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" title="Save Local Draft">
                    <span className="material-icons">save</span>
                </button>
                <button onClick={() => setShowConfig(true)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition" title="API Settings">
                    <span className="material-icons">settings</span>
                </button>
            </div>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Prompt</label>
                <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Write a guide about traveling to Kyoto in Autumn..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[120px]"
                />
            </div>

            <div className="flex gap-4 items-center flex-wrap">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 transition ${aiProvider === AIProvider.DEEPSEEK ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-100'}`}>
                    <input 
                        type="checkbox" 
                        checked={useSearch} 
                        onChange={(e) => setUseSearch(e.target.checked)}
                        disabled={aiProvider === AIProvider.DEEPSEEK}
                        className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                        {aiProvider === AIProvider.GOOGLE ? 'Use Google Search' : 'Use Web Search'}
                    </span>
                </label>
            </div>

            {/* Image Analysis Upload */}
            <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 transition text-center relative ${aiProvider === AIProvider.DEEPSEEK ? 'hover:bg-gray-50 opacity-80' : 'hover:bg-gray-100'}`}>
                 <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="pointer-events-none flex flex-col items-center justify-center">
                    {uploadedImagePreview ? (
                         <div className="relative">
                            <img src={uploadedImagePreview} alt="Context" className="h-24 object-contain rounded shadow-sm mb-2" />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${analyzingImage ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {analyzingImage ? 'Analyzing...' : (aiProvider !== AIProvider.DEEPSEEK ? 'Analyzed & Ready' : 'Cover Only')}
                            </span>
                         </div>
                    ) : (
                        <>
                             <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             <span className="text-sm text-gray-500 font-medium">Upload Image (Cover)</span>
                             {aiProvider !== AIProvider.DEEPSEEK && <span className="text-xs text-gray-400 mt-1">+ Image Analysis ({getProviderName()})</span>}
                        </>
                    )}
                 </div>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={loading || analyzingImage}
                className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex justify-center items-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <span className="material-icons">auto_awesome</span> Generate Article
                    </>
                )}
            </button>
        </div>

        {/* References */}
        {sources.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-800 uppercase mb-2">Sources Used</h3>
                <ul className="text-xs space-y-1">
                    {sources.map((s, idx) => (
                        <li key={idx}>
                            <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                                • {s.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>

      {/* Right Panel: Preview & Edit */}
      <div className="w-full lg:w-1/2 bg-gray-100 p-8 flex flex-col items-center justify-center relative">
         <div className="absolute top-4 right-4 flex gap-2">
            <button 
                onClick={handleTTS}
                disabled={aiProvider === AIProvider.DEEPSEEK}
                className={`p-2 rounded-full shadow-lg transition-colors ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} ${aiProvider === AIProvider.DEEPSEEK ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={aiProvider === AIProvider.DEEPSEEK ? "TTS unavailable with DeepSeek" : "Read Article Aloud"}
            >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
         </div>

         {/* Phone Mockup with HTML Editor */}
         <div className="w-[375px] h-[700px] bg-white rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden relative flex flex-col">
            {/* Status Bar */}
            <div className="h-6 bg-white w-full flex justify-between items-center px-6 pt-2 z-10 shrink-0">
                <span className="text-[10px] font-bold">9:41</span>
                <div className="flex gap-1">
                     <div className="w-4 h-1.5 bg-black rounded-sm"></div>
                     <div className="w-4 h-1.5 bg-black rounded-sm"></div>
                     <div className="w-0.5 h-1.5 bg-black rounded-sm"></div>
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
    </div>
  );
};

export default Editor;