import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAppStore } from '../store';
import { fetchPosts } from '../services/api';
import { Filter } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { layoutDensity } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPosts()
      .then(data => {
        setPosts(data);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load posts. Missing permissions or database error.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleExpand = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const categories = useMemo(() => {
    const rawCategories = posts.map(p => p.category).filter(Boolean);
    return ['All', ...Array.from(new Set(rawCategories))];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return posts;
    return posts.filter(p => p.category === activeCategory);
  }, [posts, activeCategory]);

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
        <p className="text-zinc-500 text-sm animate-pulse tracking-widest uppercase">Fetching entries...</p>
      </div>
    );
  }

  const calculateReadTime = (content: string) => {
    if (!content) return { min: 1, words: 0 };
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return {
      min: Math.max(1, Math.ceil(words / 200)),
      words
    };
  };

  const displayDate = (dateString?: string) => {
    try {
      if (!dateString) return 'Date unknown';
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Date unknown';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{t('home.latest_insights')}</h1>
        <div className="hidden sm:flex space-x-2 shrink-0">
           <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{t('home.headless_cms')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && categories.length > 1 && (
        <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                activeCategory === category 
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' 
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filteredPosts.length === 0 && !loading && !error && (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500">
            {posts.length === 0 ? t('home.no_content') : 'No posts found for this category.'}
          </p>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 ${layoutDensity === 'compact' ? 'gap-4 pb-12' : 'gap-6 pb-20'}`}>
        {filteredPosts.map((post, index) => (
          <div key={post.id} className={index === 0 
            ? "col-span-1 md:col-span-2 group relative bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none" 
            : "group relative border-b border-zinc-200 dark:border-zinc-800 pb-6 md:border md:p-6 md:rounded-xl md:bg-white dark:md:bg-zinc-900/30 dark:hover:border-zinc-700 hover:border-zinc-300 transition-colors md:shadow-sm dark:md:shadow-none"
          }>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono text-blue-500 uppercase flex gap-2 tracking-wider">
                {post.category && <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">{post.category}</span>}
                {post.tags?.map((t: string) => `#${t.toUpperCase().replace(/\s+/g, '')}`).join(' ')}
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline-block">{t('post.read_time', { min: calculateReadTime(post.content).min })} • {calculateReadTime(post.content).words} words • {t('home.quick_read')}</span>
            </div>
            <h2 className={`font-semibold mb-3 transition-colors ${index === 0 ? 'text-2xl text-zinc-900 dark:text-zinc-100' : 'text-lg mt-1 mb-2 text-zinc-800 dark:text-zinc-200'} group-hover:text-blue-500 dark:group-hover:text-blue-400`}>
              <Link to={`/post/${post.slug}`}>
                <span className="absolute inset-0"></span>
                {post.title}
              </Link>
            </h2>
            <div className={`relative z-10 ${index === 0 ? 'mb-6' : ''}`}>
              <p className={`text-zinc-500 dark:text-zinc-400 leading-relaxed transition-all ${index === 0 ? 'text-sm' : 'text-xs'} ${expandedPosts[post.id] ? '' : (index === 0 ? 'line-clamp-3' : 'line-clamp-2')}`}>
                {post.excerpt}
              </p>
              {post.excerpt?.length > (index === 0 ? 150 : 100) && (
                <button
                  onClick={(e) => toggleExpand(e, post.id)}
                  className="text-blue-500 dark:text-blue-400 hover:text-blue-600 font-medium text-xs mt-1"
                >
                  {expandedPosts[post.id] ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
            {index === 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex space-x-4 text-xs text-zinc-500">
                  <span>{displayDate(post.date)}</span>
                </div>
                <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 pointer-events-none transition-colors">{t('home.read_full')}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
