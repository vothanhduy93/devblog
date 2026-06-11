import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAppStore } from '../store';
import { fetchPosts } from '../services/api';

export default function HomePage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { layoutDensity } = useAppStore();

  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
        <p className="text-zinc-500 text-sm animate-pulse tracking-widest uppercase">Fetching entries...</p>
      </div>
    );
  }

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{t('home.latest_insights')}</h1>
        <div className="hidden sm:flex space-x-2">
           <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{t('home.headless_cms')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading && !error && (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500">{t('home.no_content')}</p>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 ${layoutDensity === 'compact' ? 'gap-4 pb-12' : 'gap-6 pb-20'}`}>
        {posts.map((post, index) => (
          <div key={post.id} className={index === 0 
            ? "col-span-1 md:col-span-2 group relative bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none" 
            : "group relative border-b border-zinc-200 dark:border-zinc-800 pb-6 md:border md:p-6 md:rounded-xl md:bg-white dark:md:bg-zinc-900/30 dark:hover:border-zinc-700 hover:border-zinc-300 transition-colors md:shadow-sm dark:md:shadow-none"
          }>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono text-blue-500 uppercase flex gap-2 tracking-wider">
                {post.tags?.map((t: string) => `#${t.toUpperCase().replace(/\s+/g, '')}`).join(' ') || '#GENERAL'}
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline-block">{t('post.read_time', { min: post.readTime || 5 })} • {t('home.quick_read')}</span>
            </div>
            <h2 className={`font-semibold mb-3 transition-colors ${index === 0 ? 'text-2xl text-zinc-900 dark:text-zinc-100' : 'text-lg mt-1 mb-2 text-zinc-800 dark:text-zinc-200'} group-hover:text-blue-500 dark:group-hover:text-blue-400`}>
              <Link to={`/post/${post.slug}`}>
                <span className="absolute inset-0"></span>
                {post.title}
              </Link>
            </h2>
            <p className={`text-zinc-500 dark:text-zinc-400 leading-relaxed ${index === 0 ? 'text-sm mb-6 line-clamp-3' : 'text-xs line-clamp-2'}`}>
              {post.excerpt}
            </p>
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
