import React, { useEffect, useState } from 'react';
import { Mail, Check, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { subscribeNewsletter } from '../services/api';

export default function NewsletterModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if user already saw or subscribed
    const hasSeenModal = localStorage.getItem('newsletter_modal_seen');
    if (hasSeenModal) return;

    const scrollContainer = document.getElementById('scroll-container');
    if (!scrollContainer) {
      // Fallback to window scroll if container is not found, although in our layout it is scroll-container
      const handleWindowScroll = () => {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScroll <= 0) return;
        
        const percentage = (window.scrollY / totalScroll) * 100;
        if (percentage >= 70) {
          setIsOpen(true);
          localStorage.setItem('newsletter_modal_seen', 'true');
          window.removeEventListener('scroll', handleWindowScroll);
        }
      };
      window.addEventListener('scroll', handleWindowScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleWindowScroll);
    }

    const handleScroll = () => {
      const totalScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      if (totalScroll <= 0) return;
      
      const currentScroll = scrollContainer.scrollTop;
      const percentage = (currentScroll / totalScroll) * 100;
      
      if (percentage >= 70) {
        setIsOpen(true);
        localStorage.setItem('newsletter_modal_seen', 'true');
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initially in case they render already scrolled down (e.g. short post)
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setStatus('loading');
    const result = await subscribeNewsletter(email);
    
    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 mx-auto">
          <Mail className="w-6 h-6" />
        </div>
        
        <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-2">
          {t('newsletter.title')}
        </h3>
        <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          {t('newsletter.desc')}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder')} 
            disabled={status === 'loading' || status === 'success'}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
            required
          />
          <button 
            type="submit" 
            disabled={status === 'loading' || status === 'success' || !email}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center"
          >
            {status === 'loading' ? '...' : status === 'success' ? <Check className="w-5 h-5" /> : t('newsletter.button')}
          </button>
        </form>
        
        {status === 'error' && (
          <p className="text-xs text-red-500 mt-4 flex items-center justify-center gap-1">
            <AlertCircle className="w-4 h-4" /> {t('newsletter.error')}
          </p>
        )}
      </div>
    </div>
  );
}
