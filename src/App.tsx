import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Sun, Moon, Monitor, Rss, Lock, Bell } from 'lucide-react';
import { useAppStore } from './store';
import { cn } from './lib/utils';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';

// Pages
import HomePage from './pages/HomePage';
import PostPage from './pages/PostPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

function App() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage, mfaAuthenticated } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

  // Apply Theme
  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      let effectiveTheme = theme;
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        effectiveTheme = systemTheme;
      }
      
      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.style.colorScheme = 'light';
      }
    };
    applyTheme();
    
    // Listen to system theme changes if set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply Language
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Real-time Push Notifications (SSE)
  useEffect(() => {
    const eventSource = new EventSource('/api/notifications');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_COMMENT') {
          setNotification(`New comment: ${data.snippet}`);
          setTimeout(() => setNotification(''), 5000);
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };
    return () => eventSource.close();
  }, []);

  // Search Debounce
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => setSearchResults(data))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col overflow-hidden transition-colors duration-200 select-none">
      <Helmet>
        <title>{t('blog.title')}</title>
        <meta name="description" content={t('blog.subtitle')} />
        {/* Mock Google Analytics Tag */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MOCKABC123"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MOCKABC123');
          `}
        </script>
      </Helmet>

      {/* Push Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <Bell className="w-5 h-5" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 bg-zinc-100/50 dark:bg-zinc-950/50 backdrop-blur-md shrink-0">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-lg font-bold tracking-tighter text-zinc-900 dark:text-white">
            DEVBLOG<span className="text-blue-500">.</span>
          </Link>
          <div className="hidden sm:flex space-x-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <Link to="/" className="text-zinc-900 dark:text-white">Articles</Link>
          </div>
        </div>

        <div className="flex flex-1 justify-end max-w-md mx-6 relative items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Cmd + K to search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md px-3 py-1.5 pl-9 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
            {/* Search Dropdown */}
            {searchResults.length > 0 && searchQuery && (
              <div className="absolute top-10 right-0 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-2 z-50 text-left">
                <div className="px-3 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Results</div>
                {searchResults.map(post => (
                  <Link 
                    key={post.id} 
                    to={`/post/${post.slug}`}
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{post.title}</div>
                    <div className="text-xs text-zinc-500 line-clamp-1 mt-1">{post.excerpt}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 border-l border-zinc-300 dark:border-zinc-800 pl-4">
            <div className={`w-2 h-2 rounded-full ${mfaAuthenticated ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-zinc-500">MFA</span>
          </div>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 flex-col shrink-0 bg-transparent overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold">Identity</h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-900 flex items-center justify-center text-xs text-white uppercase font-bold">DP</div>
              <div>
                <p className="text-sm font-medium">DevBlog</p>
                <p className="text-[10px] text-zinc-500">Admin</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold">Preferences</h3>
            <div className="space-y-2">
              <div className="text-xs p-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded flex items-center justify-between">
                <span className="text-zinc-500">Theme</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setTheme('light')} className={cn("p-1 rounded transition-colors", theme === 'light' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-500')}><Sun className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setTheme('dark')} className={cn("p-1 rounded transition-colors", theme === 'dark' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-500')}><Moon className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setTheme('system')} className={cn("p-1 rounded transition-colors", theme === 'system' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-500')}><Monitor className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="text-xs p-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded flex items-center justify-between">
                <span className="text-zinc-500">Lang</span>
                <div className="flex items-center gap-1 font-medium text-[10px]">
                  <button onClick={() => setLanguage('vi')} className={cn("px-1.5 py-0.5 rounded transition-colors", language === 'vi' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-500')}>VI</button>
                  <button onClick={() => setLanguage('en')} className={cn("px-1.5 py-0.5 rounded transition-colors", language === 'en' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-500')}>EN</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold">Stats</h3>
            <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-lg p-4 shadow-sm">
              <div className="text-xs text-zinc-400 mb-2">Live Analytics</div>
              <div className="flex items-end space-x-1 h-12">
                <div className="flex-1 bg-blue-500/20 h-[40%]"></div>
                <div className="flex-1 bg-blue-500/40 h-[60%]"></div>
                <div className="flex-1 bg-blue-500/60 h-[80%]"></div>
                <div className="flex-1 bg-blue-500/80 h-[100%]"></div>
                <div className="flex-1 bg-blue-500/40 h-[50%]"></div>
                <div className="flex-1 bg-blue-500/60 h-[75%]"></div>
              </div>
              <div className="text-[10px] text-zinc-500 mt-2 text-right">+12.4% this week</div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-2">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1 font-bold">Feeds</h3>
            <a href="/api/rss" target="_blank" rel="noreferrer" className="text-xs p-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded flex items-center justify-between group hover:border-zinc-400 transition-colors">
              <span className="text-zinc-500 italic flex items-center gap-2"><Rss className="w-3.5 h-3.5" />/feed.xml</span>
              <span className="text-blue-500 font-medium">Active</span>
            </a>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
              <span>Status</span>
              <span className="text-green-500 font-mono">ONLINE</span>
            </div>
          </div>
        </aside>

        {/* Center Content Area */}
        <section className="flex-1 flex flex-col dark:bg-zinc-950 relative overflow-hidden">
          <div className="p-8 flex-1 overflow-y-auto w-full">
            <div className="max-w-4xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/post/:slug" element={<PostPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </div>
          </div>

          <div className="h-20 border-t border-zinc-200 dark:border-zinc-800 px-8 flex items-center justify-between text-zinc-500 shrink-0 bg-zinc-50 dark:bg-zinc-950">
            <div className="text-[10px] flex space-x-8 uppercase tracking-[0.2em]">
              <span>Privacy</span>
              <span>API Doc</span>
            </div>
            <div className="text-[10px] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="uppercase tracking-widest font-bold hidden sm:inline">Push Notifications</span>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Quick Actions */}
        <aside className="hidden lg:flex w-14 border-l border-zinc-200 dark:border-zinc-800 flex-col items-center py-6 space-y-8 bg-zinc-100/50 dark:bg-zinc-900/10 shrink-0">
          <Link to="/admin" className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors" title="Admin">
            <Lock className="w-4 h-4" />
          </Link>
        </aside>
      </main>
    </div>
  );
}

export default App;
