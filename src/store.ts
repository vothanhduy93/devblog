import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeType = 'light' | 'dark' | 'system';

interface AppState {
  theme: ThemeType;
  language: 'en' | 'vi';
  mfaAuthenticated: boolean;
  setTheme: (theme: ThemeType) => void;
  setLanguage: (lang: 'en' | 'vi') => void;
  setMfaAuthenticated: (status: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'vi',
      mfaAuthenticated: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setMfaAuthenticated: (mfaAuthenticated) => set({ mfaAuthenticated }),
    }),
    {
      name: 'devblog-preferences',
    }
  )
);
