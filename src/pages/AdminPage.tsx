import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { Edit, Trash2, Plus, FileText, Settings, LogOut } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mfaAuthenticated, setMfaAuthenticated } = useAppStore();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!mfaAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Fetch mock CMS data
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(console.error);
  }, [mfaAuthenticated, navigate]);

  if (!mfaAuthenticated) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {t('admin.title')}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your digital garden content efficiently.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Post
          </button>
          <button 
            onClick={() => {
              setMfaAuthenticated(false);
              navigate('/');
            }}
            className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium text-sm transition-colors">
            <FileText className="w-4 h-4" /> Posts
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-sm transition-colors">
            <Settings className="w-4 h-4" /> CMS Settings
          </button>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 uppercase text-xs font-semibold text-zinc-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {post.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Published
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {format(new Date(post.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3 text-zinc-400">
                      <button className="hover:text-blue-600 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
