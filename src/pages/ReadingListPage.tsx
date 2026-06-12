import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, ArrowRight } from 'lucide-react';
import { useReadingList } from '../hooks/useReadingList';
import { Helmet } from 'react-helmet-async';
import { format, parseISO } from 'date-fns';

export default function ReadingListPage() {
  const { readingList, toggleSave } = useReadingList();

  const displayDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto py-8">
      <Helmet>
        <title>Reading List | DevBlog</title>
      </Helmet>
      
      <header className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-blue-500" fill="currentColor" />
          Reading List
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Articles you've saved to read later. Saved locally in your browser.
        </p>
      </header>

      {readingList.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
          <Bookmark className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Your reading list is empty</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            When you find an article you want to read later, just click the "Save for later" button.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform">
            Browse Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {readingList.map((post) => (
            <div key={post.id} className="group relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                    <span>{displayDate(post.date)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime} min read</span>
                  </div>
                  <Link to={`/post/${post.slug}`} className="block">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 group-hover:text-blue-500 transition-colors">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex sm:flex-col justify-between items-end">
                  <button 
                    onClick={() => toggleSave(post)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors tooltip-trigger"
                    aria-label="Remove from reading list"
                  >
                    <Bookmark className="w-5 h-5" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
