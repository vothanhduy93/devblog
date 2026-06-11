import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeType = 'light' | 'dark' | 'system';
type FontSize = 'sm' | 'md' | 'lg';
type LayoutDensity = 'compact' | 'comfortable';

interface AppState {
  theme: ThemeType;
  language: 'en' | 'vi';
  isAuthenticated: boolean;
  authInitialized: boolean;
  fontSize: FontSize;
  layoutDensity: LayoutDensity;
  setTheme: (theme: ThemeType) => void;
  setLanguage: (lang: 'en' | 'vi') => void;
  setIsAuthenticated: (status: boolean) => void;
  setAuthInitialized: (status: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setLayoutDensity: (density: LayoutDensity) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'vi',
      isAuthenticated: false,
      authInitialized: false,
      fontSize: 'md',
      layoutDensity: 'comfortable',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setAuthInitialized: (authInitialized) => set({ authInitialized }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLayoutDensity: (layoutDensity) => set({ layoutDensity }),
    }),
    {
      name: 'devblog-preferences',
      partialize: (state) => ({ 
        theme: state.theme, 
        language: state.language, 
        fontSize: state.fontSize, 
        layoutDensity: state.layoutDensity 
      }),
    }
  )
);
