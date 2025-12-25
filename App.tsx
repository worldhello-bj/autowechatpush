import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import LogSettings from './components/LogSettings';
import PromptEditor from './components/PromptEditor';
import AuthPage from './components/AuthPage';
import { AuthProvider, useAuth } from './components/AuthContext';

// --- Shared Types ---
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
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

  // WeChat Credentials State
  const [wechatCreds, setWechatCreds] = useState({ appId: '', appSecret: '' });
  const [isEditingWechat, setIsEditingWechat] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedWechatCreds = localStorage.getItem('wechat_creds');
    if (savedWechatCreds) {
      try {
        setWechatCreds(JSON.parse(savedWechatCreds));
      } catch (e) {
        console.error('Failed to parse WeChat credentials', e);
      }
    }
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setIsEditingProfile(false);
  };

  const handleSaveWechatCreds = () => {
    localStorage.setItem('wechat_creds', JSON.stringify(wechatCreds));
    setIsEditingWechat(false);
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

          {/* Prompt Configuration */}
          <div className="border-t border-gray-100">
             <PromptEditor />
          </div>

          {/* WeChat Public Account Configuration */}
          <div className="p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-gray-400">cloud</span> 微信公众号配置
             </h3>
             <p className="text-sm text-gray-500 mb-4">
                配置您的微信公众号 AppID 和 AppSecret，用于发布文章到微信公众平台。每个用户可以配置自己的公众号。
             </p>
             
             {isEditingWechat ? (
               <div className="space-y-3 max-w-md">
                 <div>
                   <label className="block text-xs text-gray-500 mb-1">AppID</label>
                   <input 
                     type="text" 
                     value={wechatCreds.appId}
                     onChange={e => setWechatCreds({...wechatCreds, appId: e.target.value})}
                     placeholder="wx1234567890abcdef"
                     className="w-full border border-gray-300 p-2 rounded text-sm font-mono"
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 mb-1">AppSecret</label>
                   <input 
                     type="password" 
                     value={wechatCreds.appSecret}
                     onChange={e => setWechatCreds({...wechatCreds, appSecret: e.target.value})}
                     placeholder="••••••••••••••••••••••••••••••••"
                     className="w-full border border-gray-300 p-2 rounded text-sm font-mono"
                   />
                 </div>
                 <div className="flex gap-2">
                   <button 
                     onClick={handleSaveWechatCreds} 
                     className="bg-green-600 text-white text-xs px-4 py-2 rounded hover:bg-green-700 transition"
                   >
                     保存配置
                   </button>
                   <button 
                     onClick={() => setIsEditingWechat(false)} 
                     className="text-gray-500 text-xs px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                   >
                     取消
                   </button>
                 </div>
               </div>
             ) : (
               <div className="space-y-3">
                 <div className="bg-gray-50 rounded p-3 border border-gray-200">
                   <div className="text-xs text-gray-500 mb-1">AppID</div>
                   <div className="font-mono text-sm text-gray-800">
                     {wechatCreds.appId || <span className="text-gray-400 italic">未配置</span>}
                   </div>
                 </div>
                 <div className="bg-gray-50 rounded p-3 border border-gray-200">
                   <div className="text-xs text-gray-500 mb-1">AppSecret</div>
                   <div className="font-mono text-sm text-gray-800">
                     {wechatCreds.appSecret ? '••••••••••••••••••••••••••••••••' : <span className="text-gray-400 italic">未配置</span>}
                   </div>
                 </div>
                 <button 
                   onClick={() => setIsEditingWechat(true)} 
                   className="text-sm text-green-600 font-medium hover:underline border border-green-600 rounded px-4 py-2 hover:bg-green-50 transition"
                 >
                   编辑配置
                 </button>
               </div>
             )}
          </div>

          {/* Log Settings */}
          <div className="p-6">
             <LogSettings />
          </div>
          
           <div className="p-6 bg-gray-50">
               <div className="text-sm text-gray-500 text-center">WeChat AI Publisher v1.3.0</div>
           </div>
       </div>
    </div>
  );
};

// --- Protected Route Component ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// --- User Menu Component ---
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };
  
  if (!user) return null;
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 h-9 px-3 rounded-full bg-gray-100 hover:bg-gray-200 transition"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
        <span className="material-icons text-gray-400 text-sm">expand_more</span>
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-2">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-medium text-gray-800">{user.name}</div>
              <div className="text-sm text-gray-500 truncate">{user.email}</div>
              {user.role === 'admin' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  管理员
                </span>
              )}
            </div>
            
            <div className="py-1">
              <Link 
                to="/settings"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="material-icons text-lg text-gray-400">settings</span>
                设置
              </Link>
              
              <div className="flex items-center gap-3 px-4 py-2 text-gray-700">
                <span className="material-icons text-lg text-gray-400">token</span>
                <span>配额: <strong className="text-green-600">{user.quota}</strong></span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition w-full text-left"
              >
                <span className="material-icons text-lg">logout</span>
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- Main App Layout Component ---
const AppLayout: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, isLoading } = useAuth();

  // Helper for NavLink classes to style active tab
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    isActive 
      ? "text-green-600 font-bold border-b-2 border-green-600 h-full flex items-center px-1 transition-colors"
      : "text-gray-500 hover:text-gray-900 h-full flex items-center px-1 transition-colors border-b-2 border-transparent hover:border-gray-200";

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
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
         
         {isLoggedIn && (
           <nav className="hidden md:flex gap-8 text-sm font-medium h-full items-center">
              <NavLink to="/" className={getNavLinkClass}>Editor</NavLink>
              <NavLink to="/drafts" className={getNavLinkClass}>Drafts</NavLink>
              <NavLink to="/analytics" className={getNavLinkClass}>Analytics</NavLink>
              <NavLink to="/settings" className={getNavLinkClass}>Settings</NavLink>
           </nav>
         )}
         
         <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <span className="material-icons text-lg">login</span>
                登录
              </Link>
            )}
         </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative">
         <Routes>
           <Route path="/login" element={
             isLoggedIn ? <Navigate to="/" replace /> : <AuthPage />
           } />
           <Route path="/" element={
             <ProtectedRoute>
               <Editor onError={(msg) => setError(msg)} />
             </ProtectedRoute>
           } />
           <Route path="/drafts" element={
             <ProtectedRoute>
               <DraftsPage />
             </ProtectedRoute>
           } />
           <Route path="/analytics" element={
             <ProtectedRoute>
               <AnalyticsPage />
             </ProtectedRoute>
           } />
           <Route path="/settings" element={
             <ProtectedRoute>
               <SettingsPage />
             </ProtectedRoute>
           } />
         </Routes>
      </main>
    </div>
  );
};

// --- Main App Component (with AuthProvider) ---
const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;