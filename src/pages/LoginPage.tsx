import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useAppStore } from '../store';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setMfaAuthenticated } = useAppStore();
  
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setStep(2);
    } else {
      alert('Invalid credentials. Use admin/admin');
    }
  };

  const handleMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length === 6) {
      setMfaAuthenticated(true);
      navigate('/admin');
    } else {
      alert('Enter any 6 digit code');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-zinc-900/50 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('login.title')}</h2>
        <p className="text-sm text-zinc-500 mt-2">Secure access to Headless CMS</p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2 mt-6">
            {t('login.step1')} <LogIn className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleMfa} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('login.step2')}</label>
            <input 
              type="text" 
              required
              maxLength={6}
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-6">
            {t('login.button')}
          </button>
        </form>
      )}
    </div>
  );
}
