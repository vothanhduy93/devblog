import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAuthorByName, fetchPostsByAuthor } from '../services/api';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

export default function AuthorPage() {
  const { authorId } = useParams();
  const decodedAuthor = decodeURIComponent(authorId || '');
  const { t } = useTranslation();
  const { layoutDensity } = useAppStore();

  const [author, setAuthor] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthorData = async () => {
      setLoading(true);
      try {
        const [authorData, authorPosts] = await Promise.all([
          fetchAuthorByName(decodedAuthor),
          fetchPostsByAuthor(decodedAuthor)
        ]);
        setAuthor(authorData);
        setPosts(authorPosts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (decodedAuthor) {
      loadAuthorData();
    }
  }, [decodedAuthor]);

  if (loading) {
    return <div className="text-center mt-20 text-zinc-500 animate-pulse uppercase tracking-widest text-sm">Loading author...</div>;
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full`}>
      <Link to="/" className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>
      
      <div className="mb-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm">
        {author?.avatarUrl ? (
          <img src={author.avatarUrl} alt={decodedAuthor} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-100 dark:border-zinc-800" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-4 border-white dark:border-zinc-900">
            <User className="w-10 h-10 text-zinc-400" />
          </div>
        )}
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{decodedAuthor}</h1>
          {author?.bio ? (
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">{author.bio}</p>
          ) : (
            <p className="text-zinc-500 text-sm mb-4">No bio available for this author.</p>
          )}
          <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-medium text-zinc-500">
            <span>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
            {author?.website && (
              <>
                <span>•</span>
                <a href={author.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Website</a>
              </>
            )}
            {author?.twitter && (
              <>
                <span>•</span>
                <a href={`https://twitter.com/${author.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Twitter</a>
              </>
            )}
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 uppercase tracking-widest text-sm border-b border-zinc-200 dark:border-zinc-800 pb-4">Articles by {decodedAuthor}</h2>
      
      <div className={`grid gap-6 ${layoutDensity === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        {posts.map(post => (
          <div key={post.id} className="group flex flex-col border-b border-zinc-200 dark:border-zinc-800 pb-6 relative h-full bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono text-blue-500 uppercase flex gap-2 tracking-wider">
               {post.category && <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">{post.category}</span>}
              </span>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1.5"><Clock className="w-3 h-3" />{post.readTime?.min || post.readTime || 1} min read</span>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              <Link to={`/post/${post.slug}`}>
                <span className="absolute inset-0"></span>
                {post.title}
              </Link>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3 md:line-clamp-2">{post.excerpt}</p>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="col-span-full py-10 text-center text-zinc-500">
            No posts found for this author.
          </div>
        )}
      </div>
    </div>
  );
}
