import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useAppStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters if needed (e.g., prompt: 'select_account')
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setIsAuthenticated(true);
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Firebase auth/unauthorized-domain error!\n\nPlease go to Firebase Console -> Authentication -> Settings -> Authorized domains\nAnd add the following domains:\n- ais-dev-7effeedoscxx7kiqt3nb7w-555345878913.asia-east1.run.app\n- ais-pre-7effeedoscxx7kiqt3nb7w-555345878913.asia-east1.run.app");
      } else {
        alert('Failed to login with Google: ' + (error.message || String(error)));
      }
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

      <button 
        onClick={handleGoogleLogin} 
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 mt-6"
      >
        Sign in with Google
      </button>
    </div>
  );
}
