import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { Edit, Trash2, Plus, FileText, Settings, LogOut, X, Save } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { fetchPosts, deletePost, createPost, updatePost } from '../services/api';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated, authInitialized } = useAppStore();
  const [posts, setPosts] = useState<any[]>([]);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', excerpt: '', content: '', tags: '' });

  const loadPosts = async () => {
    const data = await fetchPosts();
    setPosts(data);
  };

  useEffect(() => {
    if (authInitialized && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (authInitialized && isAuthenticated) {
      loadPosts();
    }
  }, [authInitialized, isAuthenticated, navigate]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await deletePost(id);
    loadPosts();
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags ? post.tags.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPost(null);
    setFormData({ title: '', excerpt: '', content: '', tags: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    if (editingPost) {
      await updatePost(editingPost.id, payload);
    } else {
      await createPost(payload);
    }
    
    setIsModalOpen(false);
    loadPosts();
  };

  const displayDate = (dateString?: string) => {
    try {
      if (!dateString) return 'Unknown';
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  if (!authInitialized) {
    return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div></div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {t('admin.title')}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your digital garden content efficiently.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Post
          </button>
          <button 
            onClick={async () => {
              await signOut(auth);
              setIsAuthenticated(false);
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
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                      {post.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Published
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {displayDate(post.date)}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3 text-zinc-400">
                      <button onClick={() => handleEdit(post)} className="hover:text-blue-600 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No posts found. Create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{editingPost ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-hidden flex-1 flex flex-col gap-4 max-h-[85vh]">
              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tags</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Excerpt</label>
                <textarea required rows={2} value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full px-4 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm text-zinc-900 dark:text-white"></textarea>
              </div>

              <div className="flex-1 flex gap-6 min-h-[300px] overflow-hidden">
                <div className="flex-1 flex flex-col h-full">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Content (Markdown)</label>
                  <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full flex-1 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm text-zinc-900 dark:text-white"></textarea>
                </div>
                <div className="flex-1 flex col h-full hidden lg:flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-6">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Live Preview</label>
                  <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-transparent border border-zinc-200 dark:border-zinc-800 prose prose-zinc dark:prose-invert max-w-none prose-sm">
                    <ReactMarkdown>{formData.content || '*Start typing to see preview...*'}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <button type="submit" className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2.5 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                  <Save className="w-4 h-4" /> Save Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
