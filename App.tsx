import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import Editor from './components/Editor';
import { AIProvider } from './types';

// --- Shared Types ---
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

interface WeChatConfig {
  appId: string;
  appSecret: string;
}

// --- Placeholder Page Components ---

const DraftsPage: React.FC = () => {
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('wechat_editor_draft');
    if (raw) {
      try {
        setDraft(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  return (
    <div className="p-8 w-full max-w-5xl mx-auto h-full overflow-y-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Drafts</h2>
      {draft ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{draft.title || 'Untitled Draft'}</h3>
                  <p className="text-gray-500 line-clamp-2">{draft.digest || 'No summary provided.'}</p>
               </div>
               <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Local Draft</span>
            </div>
            <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-400">
                   Last edited: {draft.timestamp ? new Date(draft.timestamp).toLocaleString() : 'Unknown'}
                </div>
                <Link to="/" className="text-green-600 font-medium hover:text-green-700 hover:underline flex items-center gap-1">
                   Continue Editing <span className="material-icons text-sm">arrow_forward</span>
                </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
           <span className="material-icons text-gray-300 text-6xl mb-4">drafts</span>
           <p className="text-gray-500 text-lg">You don't have any saved drafts.</p>
           <Link to="/" className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition">
             Create New Article
           </Link>
        </div>
      )}
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleSyncData = () => {
    const rawCreds = localStorage.getItem('wechat_creds');
    if (!rawCreds) {
      alert("Please configure your WeChat API Credentials in Settings first.");
      return;
    }
    const creds = JSON.parse(rawCreds);
    if (!creds.appId || !creds.appSecret) {
      alert("Please configure your WeChat API Credentials in Settings first.");
      return;
    }

    setLoading(true);
    // Simulate API fetch since we can't make real cross-origin analytic calls in this demo env
    setTimeout(() => {
        setData({
            totalReads: 12450,
            followers: 856,
            shares: 3240,
            favorites: 1120,
            trend: [...Array(30)].map(() => Math.floor(Math.random() * 70) + 10)
        });
        setLoading(false);
    }, 1500);
  };

  if (!data) {
      return (
        <div className="p-8 w-full max-w-6xl mx-auto h-full overflow-y-auto flex flex-col items-center justify-center">
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center max-w-lg">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons text-4xl text-green-600">bar_chart</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect to Analytics</h2>
                <p className="text-gray-500 mb-8">
                    Sync with your WeChat Official Account to view real-time reads, engagement, and follower growth.
                </p>
                <button 
                    onClick={handleSyncData}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                           <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           Syncing Data...
                        </>
                    ) : 'Sync Data'}
                </button>
                <p className="text-xs text-gray-400 mt-4">Requires AppID & AppSecret configuration.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="p-8 w-full max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Analytics</h2>
          <button onClick={() => setData(null)} className="text-sm text-gray-500 hover:text-green-600">Disconnect</button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         {[
           { label: 'Total Reads', value: data.totalReads.toLocaleString(), color: 'text-gray-800', icon: 'visibility' },
           { label: 'New Followers', value: `+${data.followers}`, color: 'text-green-600', icon: 'person_add' },
           { label: 'Shares', value: data.shares.toLocaleString(), color: 'text-blue-600', icon: 'share' },
           { label: 'Favorites', value: data.favorites.toLocaleString(), color: 'text-orange-500', icon: 'star' }
         ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-2">{stat.label}</div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
                <span className={`material-icons text-3xl opacity-20 ${stat.color}`}>{stat.icon}</span>
             </div>
         ))}
      </div>

      {/* Chart */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8 relative">
         <h3 className="text-lg font-bold text-gray-800 mb-6">Engagement Trends (Last 30 Days)</h3>
         <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-gray-100 pb-2">
             {data.trend.map((val: number, i: number) => {
                 const height = val; 
                 return (
                     <div key={i} className="w-full bg-green-100 hover:bg-green-500 rounded-t transition-all relative group" style={{ height: `${height}%` }}>
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                            {val * 10} reads
                        </div>
                     </div>
                 )
             })}
         </div>
         <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
             <span>30 days ago</span>
             <span>Today</span>
         </div>
         <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
             Demo Data Mode
         </div>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  // Profile State
  const [profile, setProfile] = useState<UserProfile>({ name: 'Admin', email: 'admin@example.com', avatar: 'https://picsum.photos/100/100' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Credentials State
  const [config, setConfig] = useState<WeChatConfig>({ appId: '', appSecret: '' });
  const [showConfigSecret, setShowConfigSecret] = useState(false);

  // AI Provider State
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.GOOGLE);
  
  // Provider Keys
  const [googleKey, setGoogleKey] = useState('');
  const [showGoogleKey, setShowGoogleKey] = useState(false);

  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [showDeepSeekKey, setShowDeepSeekKey] = useState(false);
  
  const [dashScopeKey, setDashScopeKey] = useState('');
  const [showDashScopeKey, setShowDashScopeKey] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedCreds = localStorage.getItem('wechat_creds');
    if (savedCreds) setConfig(JSON.parse(savedCreds));

    const savedProvider = localStorage.getItem('ai_provider');
    if (savedProvider) setAiProvider(savedProvider as AIProvider);

    const savedGoogleKey = localStorage.getItem('google_api_key');
    if (savedGoogleKey) setGoogleKey(savedGoogleKey);

    const savedDSKey = localStorage.getItem('deepseek_key');
    if (savedDSKey) setDeepSeekKey(savedDSKey);
    
    const savedDashKey = localStorage.getItem('dashscope_key');
    if (savedDashKey) setDashScopeKey(savedDashKey);
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setIsEditingProfile(false);
  };

  const handleSaveConfig = () => {
    localStorage.setItem('wechat_creds', JSON.stringify(config));
    localStorage.setItem('ai_provider', aiProvider);
    
    // Save API Keys
    localStorage.setItem('google_api_key', googleKey);
    localStorage.setItem('deepseek_key', deepSeekKey);
    localStorage.setItem('dashscope_key', dashScopeKey);
    
    alert("Configuration saved!");
  };

  return (
    <div className="p-8 w-full max-w-3xl mx-auto h-full overflow-y-auto">
       <h2 className="text-3xl font-bold mb-8 text-gray-800">Settings</h2>
       
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
          
          {/* Account Settings */}
          <div className="p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-gray-400">account_circle</span> Account
             </h3>
             <div className="flex items-start gap-4 mb-4">
                <img src={profile.avatar} alt="Avatar" className="w-16 h-16 rounded-full border border-gray-200" />
                <div className="flex-1">
                    {isEditingProfile ? (
                        <div className="space-y-3 max-w-md">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                                <input 
                                    type="text" 
                                    value={profile.name}
                                    onChange={e => setProfile({...profile, name: e.target.value})}
                                    className="w-full border p-2 rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    value={profile.email}
                                    onChange={e => setProfile({...profile, email: e.target.value})}
                                    className="w-full border p-2 rounded text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveProfile} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded">Save Profile</button>
                                <button onClick={() => setIsEditingProfile(false)} className="text-gray-500 text-xs px-3 py-1.5">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="font-medium text-lg">{profile.name}</div>
                            <div className="text-sm text-gray-500">{profile.email}</div>
                        </div>
                    )}
                </div>
                {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} className="ml-auto text-sm text-green-600 font-medium hover:underline border border-green-600 rounded px-3 py-1 hover:bg-green-50">
                        Edit Profile
                    </button>
                )}
             </div>
          </div>

          {/* AI Provider Settings */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-gray-400">smart_toy</span> AI Provider
             </h3>
             <div className="space-y-4 max-w-lg">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
                   <div className="flex flex-col gap-2">
                       <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${aiProvider === AIProvider.GOOGLE ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                           <input 
                              type="radio" 
                              name="provider" 
                              value={AIProvider.GOOGLE}
                              checked={aiProvider === AIProvider.GOOGLE}
                              onChange={() => setAiProvider(AIProvider.GOOGLE)}
                              className="text-green-600 focus:ring-green-500"
                           />
                           <div>
                               <span className="font-medium block text-gray-900">Google Gemini</span>
                               <span className="text-xs text-gray-500">Includes Search, Image Analysis, TTS</span>
                           </div>
                       </label>
                       
                       <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${aiProvider === AIProvider.DEEPSEEK ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                           <input 
                              type="radio" 
                              name="provider" 
                              value={AIProvider.DEEPSEEK}
                              checked={aiProvider === AIProvider.DEEPSEEK}
                              onChange={() => setAiProvider(AIProvider.DEEPSEEK)}
                              className="text-blue-600 focus:ring-blue-500"
                           />
                           <div>
                               <span className="font-medium block text-gray-900">DeepSeek</span>
                               <span className="text-xs text-gray-500">Text Generation only</span>
                           </div>
                       </label>

                       <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${aiProvider === AIProvider.QWEN ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                           <input 
                              type="radio" 
                              name="provider" 
                              value={AIProvider.QWEN}
                              checked={aiProvider === AIProvider.QWEN}
                              onChange={() => setAiProvider(AIProvider.QWEN)}
                              className="text-purple-600 focus:ring-purple-500"
                           />
                           <div>
                               <span className="font-medium block text-gray-900">Qwen (Tongyi Qianwen)</span>
                               <span className="text-xs text-gray-500">Includes Web Search, Image Analysis, TTS</span>
                           </div>
                       </label>
                   </div>
                </div>

                {/* API Key Inputs */}
                {aiProvider === AIProvider.GOOGLE && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Google Gemini API Key</label>
                        <div className="relative">
                            <input 
                                type={showGoogleKey ? "text" : "password"} 
                                value={googleKey}
                                onChange={e => setGoogleKey(e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                                placeholder="AIza..."
                            />
                             <button 
                                onClick={() => setShowGoogleKey(!showGoogleKey)}
                                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-icons text-lg">{showGoogleKey ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Leave empty if using environment variables (process.env.API_KEY).
                        </div>
                    </div>
                )}

                {aiProvider === AIProvider.DEEPSEEK && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">DeepSeek API Key</label>
                        <div className="relative">
                            <input 
                                type={showDeepSeekKey ? "text" : "password"} 
                                value={deepSeekKey}
                                onChange={e => setDeepSeekKey(e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                placeholder="sk-..."
                            />
                             <button 
                                onClick={() => setShowDeepSeekKey(!showDeepSeekKey)}
                                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-icons text-lg">{showDeepSeekKey ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>
                )}
                
                {aiProvider === AIProvider.QWEN && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">DashScope API Key (Qwen)</label>
                        <div className="relative">
                            <input 
                                type={showDashScopeKey ? "text" : "password"} 
                                value={dashScopeKey}
                                onChange={e => setDashScopeKey(e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                                placeholder="sk-..."
                            />
                             <button 
                                onClick={() => setShowDashScopeKey(!showDashScopeKey)}
                                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-icons text-lg">{showDashScopeKey ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Requires a key from Aliyun DashScope.
                        </div>
                    </div>
                )}
             </div>
          </div>

          {/* API Configuration */}
          <div className="p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-gray-400">api</span> WeChat Configuration
             </h3>
             <div className="space-y-4 max-w-lg">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">AppID</label>
                    <input 
                        type="text" 
                        value={config.appId}
                        onChange={e => setConfig({...config, appId: e.target.value})}
                        className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                        placeholder="wx..."
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">AppSecret</label>
                    <div className="relative">
                        <input 
                            type={showConfigSecret ? "text" : "password"} 
                            value={config.appSecret}
                            onChange={e => setConfig({...config, appSecret: e.target.value})}
                            className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                        />
                        <button 
                            onClick={() => setShowConfigSecret(!showConfigSecret)}
                            className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-icons text-lg">{showConfigSecret ? 'visibility_off' : 'visibility'}</span>
                        </button>
                    </div>
                 </div>
                 <div className="pt-2">
                     <button onClick={handleSaveConfig} className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-black">
                         Save Configuration
                     </button>
                 </div>
             </div>
          </div>

          {/* Preferences */}
          <div className="p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-gray-400">tune</span> General Preferences
             </h3>
             <div className="flex items-center justify-between py-2">
                <div>
                    <div className="font-medium text-gray-800">Dark Mode</div>
                    <div className="text-sm text-gray-500">Use dark theme for the editor interface</div>
                </div>
                <button className="w-12 h-6 bg-gray-200 rounded-full relative transition-colors focus:outline-none cursor-not-allowed opacity-60">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                </button>
             </div>
             <div className="flex items-center justify-between py-2">
                <div>
                    <div className="font-medium text-gray-800">Auto-Save Drafts</div>
                    <div className="text-sm text-gray-500">Automatically save your work to local storage</div>
                </div>
                <button className="w-12 h-6 bg-green-500 rounded-full relative transition-colors focus:outline-none">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                </button>
             </div>
          </div>
          
           <div className="p-6 bg-gray-50">
               <div className="text-sm text-gray-500 text-center">WeChat AI Publisher v1.2.0</div>
           </div>
       </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  // Helper for NavLink classes to style active tab
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    isActive 
      ? "text-green-600 font-bold border-b-2 border-green-600 h-full flex items-center px-1 transition-colors"
      : "text-gray-500 hover:text-gray-900 h-full flex items-center px-1 transition-colors border-b-2 border-transparent hover:border-gray-200";

  return (
    <HashRouter>
      <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
        
        {/* Top Notification Bar for Errors */}
        {error && (
          <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium flex justify-between items-center relative z-50 shadow-md">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 hover:bg-red-600 rounded p-1">
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
        )}

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between flex-shrink-0 z-40 relative shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  <span className="material-icons text-xl">article</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-800">WeChat <span className="text-green-600">AI Publisher</span></h1>
           </div>
           
           <nav className="hidden md:flex gap-8 text-sm font-medium h-full items-center">
              <NavLink to="/" className={getNavLinkClass}>Editor</NavLink>
              <NavLink to="/drafts" className={getNavLinkClass}>Drafts</NavLink>
              <NavLink to="/analytics" className={getNavLinkClass}>Analytics</NavLink>
              <NavLink to="/settings" className={getNavLinkClass}>Settings</NavLink>
           </nav>
           
           <div className="flex items-center gap-4">
              <Link to="/settings" className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden border border-gray-300 ring-2 ring-transparent hover:ring-green-100 transition cursor-pointer">
                 <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover"/>
              </Link>
           </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 overflow-hidden relative">
           <Routes>
             <Route path="/" element={<Editor onError={(msg) => setError(msg)} />} />
             <Route path="/drafts" element={<DraftsPage />} />
             <Route path="/analytics" element={<AnalyticsPage />} />
             <Route path="/settings" element={<SettingsPage />} />
           </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;