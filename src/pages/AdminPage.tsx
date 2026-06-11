import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { Edit, Trash2, Plus, FileText, Settings, LogOut, X, Save } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import MDEditor from '@uiw/react-md-editor';
import { fetchPosts, deletePost, createPost, updatePost } from '../services/api';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    isAuthenticated, setIsAuthenticated, authInitialized,
    theme, setTheme, language, setLanguage, 
    fontSize, setFontSize, layoutDensity, setLayoutDensity
  } = useAppStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  
  // Form State
  const CATEGORIES = ['Technology', 'Design', 'Lifestyle', 'Business', 'Other'];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', category: 'Technology', excerpt: '', content: '', tags: '', metaTitle: '', metaDescription: '', ogImage: '', targetKeyword: '' });

  const [error, setError] = useState<string | null>(null);

  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError(t('admin.error_load'));
    }
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
    if (!confirm(t('admin.confirm_delete'))) return;
    try {
      await deletePost(id);
      loadPosts();
    } catch (err) {
      console.error(err);
      alert(t('admin.error_delete'));
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      category: post.category || 'Technology',
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags ? post.tags.join(', ') : '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      ogImage: post.ogImage || '',
      targetKeyword: post.targetKeyword || ''
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPost(null);
    setFormData({ title: '', category: 'Technology', excerpt: '', content: '', tags: '', metaTitle: '', metaDescription: '', ogImage: '', targetKeyword: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    try {
      if (editingPost) {
        await updatePost(editingPost.id, payload);
      } else {
        await createPost(payload);
      }
      setIsModalOpen(false);
      loadPosts();
    } catch (err) {
      console.error(err);
      alert(t('admin.error_save'));
    }
  };

  const displayDate = (dateString?: string) => {
    try {
      if (!dateString) return 'Unknown';
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const calculateSeoScore = () => {
    let score = 0;
    const feedback = [];
    
    // Meta Title Length (between 40 and 60 chars) - Weight: 25
    const titleLength = formData.metaTitle.length || formData.title.length;
    if (titleLength >= 40 && titleLength <= 60) {
      score += 25;
      feedback.push({ type: 'success', text: t('admin.seo.good_title_length') });
    } else if (titleLength > 60) {
      score += 10;
      feedback.push({ type: 'warning', text: t('admin.seo.title_too_long') });
    } else {
      score += 5;
      feedback.push({ type: 'error', text: t('admin.seo.title_too_short') });
    }

    // Meta Description Length (between 120 and 160 chars) - Weight: 25
    const descLength = formData.metaDescription.length || formData.excerpt.length;
    if (descLength >= 120 && descLength <= 160) {
      score += 25;
      feedback.push({ type: 'success', text: t('admin.seo.good_desc_length') });
    } else if (descLength > 160) {
      score += 10;
      feedback.push({ type: 'warning', text: t('admin.seo.desc_too_long') });
    } else {
      score += 5;
      feedback.push({ type: 'error', text: t('admin.seo.desc_too_short') });
    }

    if (formData.targetKeyword) {
      const keyword = formData.targetKeyword.toLowerCase();
      
      // Keyword in Title - Weight: 15
      const title = (formData.metaTitle || formData.title).toLowerCase();
      if (title.includes(keyword)) {
        score += 15;
        feedback.push({ type: 'success', text: t('admin.seo.keyword_in_title') });
      } else {
        feedback.push({ type: 'error', text: t('admin.seo.keyword_missing_title') });
      }

      // Keyword in Description - Weight: 15
      const description = (formData.metaDescription || formData.excerpt).toLowerCase();
      if (description.includes(keyword)) {
        score += 15;
        feedback.push({ type: 'success', text: t('admin.seo.keyword_in_desc') });
      } else {
        feedback.push({ type: 'error', text: t('admin.seo.keyword_missing_desc') });
      }

      // Keyword Density in Content - Weight: 20
      const content = formData.content.toLowerCase();
      const contentWords = content.split(/\s+/).filter(Boolean).length;
      if (contentWords > 0) {
        // Count overlapping occurrences of keyword
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        const keywordCount = matches ? matches.length : 0;
        const keywordWords = keyword.split(/\s+/).filter(Boolean).length;
        
        // Approximate density based on words
        const totalWords = contentWords;
        const density = totalWords > 0 ? ((keywordCount * keywordWords) / totalWords) * 100 : 0;

        if (density >= 1 && density <= 3) {
          score += 20;
          feedback.push({ type: 'success', text: `${t('admin.seo.good_density')} (${density.toFixed(1)}%).` });
        } else if (density > 3) {
          score += 5;
          feedback.push({ type: 'warning', text: `${t('admin.seo.density_too_high')} (${density.toFixed(1)}%).` });
        } else {
          score += 0;
          feedback.push({ type: 'error', text: `${t('admin.seo.density_too_low')} (${density.toFixed(1)}%).` });
        }
      } else {
        feedback.push({ type: 'error', text: t('admin.seo.no_content') });
      }
    } else {
      score += 20; // Give free points if they haven't set a keyword, or maybe just 0
      feedback.push({ type: 'warning', text: t('admin.seo.set_keyword') });
    }

    return { score, feedback };
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
          <p className="text-sm text-zinc-500 mt-1">{t('admin.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            <Plus className="w-4 h-4" /> {t('admin.new_post')}
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
          <button 
            onClick={() => setActiveTab('posts')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'posts' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
          >
            <FileText className="w-4 h-4" /> {t('admin.posts')}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'settings' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
          >
            <Settings className="w-4 h-4" /> {t('admin.cms_settings')}
          </button>
        </div>

        <div className="lg:col-span-3">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          
          {activeTab === 'posts' && (
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 uppercase text-xs font-semibold text-zinc-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t('admin.table_title')}</th>
                  <th className="px-6 py-4">{t('admin.table_status')}</th>
                  <th className="px-6 py-4">{t('admin.table_date')}</th>
                  <th className="px-6 py-4 text-right">{t('admin.table_actions')}</th>
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
                        {t('admin.status_published')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {displayDate(post.date)}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3 text-zinc-400">
                      <button onClick={() => handleEdit(post)} className="hover:text-blue-600 transition-colors" title={t('admin.edit_post')}>
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
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">{t('admin.no_posts')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm dark:shadow-none space-y-6">
              <h2 className="text-xl font-medium text-zinc-900 dark:text-white">{t('admin.settings_global')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('admin.settings_theme')}</label>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                    {['light', 'dark', 'system'].map(tTheme => (
                      <button
                        key={tTheme}
                        onClick={() => setTheme(tTheme as any)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${theme === tTheme ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                      >
                        {t(`theme.${tTheme}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('admin.settings_language')}</label>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                    <button
                      onClick={() => setLanguage('vi')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${language === 'vi' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      Tiếng Việt
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${language === 'en' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('admin.settings_font_size')}</label>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                    {['sm', 'md', 'lg'].map(s => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s as any)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all uppercase ${fontSize === s ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('admin.settings_layout_density')}</label>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                    <button
                      onClick={() => setLayoutDensity('compact')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${layoutDensity === 'compact' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      {t('admin.settings_compact')}
                    </button>
                    <button
                      onClick={() => setLayoutDensity('comfortable')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${layoutDensity === 'comfortable' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      {t('admin.settings_comfortable')}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{editingPost ? t('admin.edit_post') : t('admin.create_post')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-hidden flex-1 flex flex-col gap-4 max-h-[85vh]">
              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('admin.form_title')}</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('admin.form_category')}</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('admin.form_tags')}</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('admin.form_excerpt')}</label>
                <textarea required rows={2} value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full px-4 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm text-zinc-900 dark:text-white"></textarea>
              </div>

              <div className="flex-1 flex flex-col min-h-[300px] overflow-hidden">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('admin.form_content')}</label>
                <div data-color-mode={theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'} className="flex-1 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
                  <MDEditor
                    value={formData.content}
                    onChange={(val) => setFormData({...formData, content: val || ''})}
                    height={400}
                    style={{ flex: 1, minHeight: 0 }}
                  />
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                {(() => {
                  const seoData = calculateSeoScore();
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t('admin.seo_details')}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-500 uppercase">{t('admin.seo_score')}</span>
                          <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${seoData.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : seoData.score >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {seoData.score}/100
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md">
                          <h4 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wide">{t('admin.seo_analysis')}</h4>
                          <ul className="space-y-1.5">
                            {seoData.feedback.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className={`mt-0.5 ${item.type === 'success' ? 'text-green-500' : item.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>
                                  {item.type === 'success' ? '✓' : item.type === 'warning' ? '!' : '✗'}
                                </span>
                                <span className="text-zinc-600 dark:text-zinc-400">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('admin.seo_target_keyword')}</label>
                          <input type="text" value={formData.targetKeyword} onChange={e => setFormData({...formData, targetKeyword: e.target.value})} placeholder="e.g. react hooks" className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('admin.seo_og_image')}</label>
                          <input type="url" value={formData.ogImage} onChange={e => setFormData({...formData, ogImage: e.target.value})} placeholder="https://..." className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('admin.seo_meta_title')}</label>
                            <span className={`text-xs ${(formData.metaTitle.length || formData.title.length) >= 40 && (formData.metaTitle.length || formData.title.length) <= 60 ? 'text-green-500' : ((formData.metaTitle.length || formData.title.length) > 60 || (formData.metaTitle.length || formData.title.length) < 10 && (formData.metaTitle.length || formData.title.length) > 0) ? 'text-red-500' : 'text-zinc-500'}`}>
                              {formData.metaTitle.length || formData.title.length}/60
                            </span>
                          </div>
                          <input type="text" value={formData.metaTitle} onChange={e => setFormData({...formData, metaTitle: e.target.value})} placeholder={t('admin.seo_meta_title_placeholder')} className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('admin.seo_meta_description')}</label>
                            <span className={`text-xs ${(formData.metaDescription.length || formData.excerpt.length) >= 120 && (formData.metaDescription.length || formData.excerpt.length) <= 160 ? 'text-green-500' : ((formData.metaDescription.length || formData.excerpt.length) > 160 || (formData.metaDescription.length || formData.excerpt.length) < 50 && (formData.metaDescription.length || formData.excerpt.length) > 0) ? 'text-red-500' : 'text-zinc-500'}`}>
                              {formData.metaDescription.length || formData.excerpt.length}/160
                            </span>
                          </div>
                          <textarea rows={2} value={formData.metaDescription} onChange={e => setFormData({...formData, metaDescription: e.target.value})} placeholder={t('admin.seo_meta_description_placeholder')} className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-zinc-900 dark:text-white text-sm"></textarea>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <button type="submit" className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2.5 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                  <Save className="w-4 h-4" /> {t('admin.form_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
