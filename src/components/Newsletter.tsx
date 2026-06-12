import React, { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { subscribeNewsletter } from '../services/api';

export default function Newsletter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setStatus('loading');
    const result = await subscribeNewsletter(email);
    
    if (result.success) {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-lg p-4 shadow-sm">
      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5" />
        {t('newsletter.title')}
      </h4>
      <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
        {t('newsletter.desc')}
      </p>
      
      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('newsletter.placeholder')} 
          disabled={status === 'loading' || status === 'success'}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 pr-16 text-ellipsis"
        />
        <button 
          type="submit" 
          disabled={status === 'loading' || status === 'success' || !email}
          className="absolute right-1 top-1/2 -translate-y-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          {status === 'loading' ? '...' : status === 'success' ? <Check className="w-3 h-3" /> : t('newsletter.button')}
        </button>
      </form>
      
      {status === 'success' && (
        <p className="text-[10px] text-green-500 mt-2 flex items-center gap-1">
          <Check className="w-3 h-3" /> {t('newsletter.success')}
        </p>
      )}
      {status === 'error' && (
        <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {t('newsletter.error')}
        </p>
      )}
    </div>
  );
}
