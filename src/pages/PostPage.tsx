import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import { Clock, Calendar, ArrowLeft, Send, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store';
import { fetchPostBySlug, fetchComments, createComment } from '../services/api';

export default function PostPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { fontSize } = useAppStore();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isQuickRead, setIsQuickRead] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchPostBySlug(slug)
      .then(async data => {
        if (!data) throw new Error('Not found');
        setPost(data);
        const commentData = await fetchComments(data.id);
        setComments(commentData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim() || !post) return;
    
    await createComment(post.id, { author: authorName, text: newComment });
    
    const updatedComments = await fetchComments(post.id);
    setComments(updatedComments);
    setNewComment('');
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div></div>;
  if (!post) return <div className="text-center mt-20 text-2xl font-bold">Post not found</div>;

  // Simple Quick Read mode logic: Filter out mostly standard text to emphasize headings/lists.
  // We keep headers, bullet points, and codeblocks. Or just show the excerpt and headers.
  const displayContent = isQuickRead 
    ? post.content.split('\n').filter((line: string) => line.startsWith('#') || line.startsWith('-') || line.startsWith('*') || line.startsWith('>')).join('\n') || '*No headings/lists found for quick read mode. The author did not structure this post with headings.*'
    : post.content;

  const displayDate = (dateString?: string) => {
    try {
      if (!dateString) return 'Date unknown';
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return 'Date unknown';
    }
  };

  return (
    <article className="animate-in fade-in duration-500">
      <Helmet>
        <title>{post.title} | {t('blog.title')}</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content={post.author} />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": "${post.title}",
              "image": [],
              "author": {
                "@type": "Person",
                "name": "${post.author}"
              },
              "publisher": {
                "@type": "Organization",
                "name": "DevBlog Pro"
              },
              "datePublished": "${post.date}",
              "dateModified": "${post.date}",
              "description": "${post.excerpt}"
            }
          `}
        </script>
      </Helmet>

      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('post.back')}
        </Link>
        
        <button 
          onClick={() => setIsQuickRead(!isQuickRead)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isQuickRead ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <Zap className="w-3.5 h-3.5" />
          {isQuickRead ? 'QUICK READ ACTIVE' : 'QUICK READ'}
        </button>
      </div>

      <header className="mb-12">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 text-zinc-900 dark:text-zinc-50 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {displayDate(post.date)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {t('post.read_time', { min: post.readTime || 5 })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            {post.author}
          </div>
        </div>
      </header>

      {isQuickRead && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl text-blue-800 dark:text-blue-300 text-sm flex gap-3 text-left">
          <Zap className="w-5 h-5 flex-shrink-0" />
          <p>Super-fast skimming enabled! We've extracted only the main headings and key takeaways for you.</p>
        </div>
      )}

      <div className={`prose prose-zinc dark:prose-invert max-w-none mb-16 prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 prose-img:rounded-xl 
        ${isQuickRead ? 'prose-h1:text-blue-600 dark:prose-h1:text-blue-400 prose-li:font-bold' : ''}
        ${fontSize === 'sm' ? 'prose-sm' : fontSize === 'lg' ? 'prose-lg' : 'prose-base'}
      `}>
        <ReactMarkdown>{displayContent}</ReactMarkdown>
      </div>

      {/* Comments Section */}
      <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="text-2xl font-bold mb-8 text-zinc-900 dark:text-white">
          {t('post.comments')} ({comments.length})
        </h3>
        
        <div className="space-y-8 mb-10">
          {comments.length === 0 && (
             <p className="text-zinc-500 italic border border-dashed border-zinc-200 dark:border-zinc-800 p-6 rounded-xl dark:bg-zinc-900/30">Be the first to share your thoughts!</p>
          )}
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{comment.author}</span>
                  <span className="text-xs text-zinc-500">{displayDate(comment.date)}</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitComment} className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
          <h4 className="text-sm font-semibold mb-4 text-zinc-900 dark:text-zinc-100">{t('post.add_comment')}</h4>
          <input 
            type="text" 
            placeholder="Name" 
            required
            value={authorName} 
            onChange={e => setAuthorName(e.target.value)}
            className="w-full mb-3 px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea 
            rows={3}
            required
            placeholder="Your comment..." 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="w-full mb-3 px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
              <Send className="w-4 h-4" /> {t('post.send')}
            </button>
          </div>
        </form>
      </section>
    </article>
  );
}
