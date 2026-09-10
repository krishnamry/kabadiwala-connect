import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type ThemeId = 'emerald' | 'cobalt' | 'copper' | 'slate' | 'amethyst';

export interface ThemeConfig {
  id: ThemeId;
  nameEn: string;
  nameHi: string;
  nameMr: string;
  primary: string;
  primaryHover: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryLight: string;
  accent: string;
  swatchClass: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'emerald',
    nameEn: 'Forest Emerald',
    nameHi: 'हरित वन',
    nameMr: 'हरित वन',
    primary: '#006C4C',
    primaryHover: '#00533A',
    primaryContainer: '#E6F7F0',
    onPrimaryContainer: '#003825',
    primaryLight: '#10B981',
    accent: '#34D399',
    swatchClass: 'bg-emerald-600'
  },
  {
    id: 'cobalt',
    nameEn: 'Tech Cobalt',
    nameHi: 'नील टेक',
    nameMr: 'नील टेक',
    primary: '#1D4ED8',
    primaryHover: '#1E40AF',
    primaryContainer: '#EFF6FF',
    onPrimaryContainer: '#1E3A8A',
    primaryLight: '#3B82F6',
    accent: '#60A5FA',
    swatchClass: 'bg-blue-600'
  },
  {
    id: 'copper',
    nameEn: 'Dhatu Copper',
    nameHi: 'धातु तांबा',
    nameMr: 'धातू तांबे',
    primary: '#C2410C',
    primaryHover: '#9A3412',
    primaryContainer: '#FFF7ED',
    onPrimaryContainer: '#7C2D12',
    primaryLight: '#EA580C',
    accent: '#FB923C',
    swatchClass: 'bg-orange-600'
  },
  {
    id: 'slate',
    nameEn: 'Nordic Slate',
    nameHi: 'स्टील स्लेट',
    nameMr: 'स्टील स्लेट',
    primary: '#334155',
    primaryHover: '#1E293B',
    primaryContainer: '#F1F5F9',
    onPrimaryContainer: '#0F172A',
    primaryLight: '#64748B',
    accent: '#94A3B8',
    swatchClass: 'bg-slate-700'
  },
  {
    id: 'amethyst',
    nameEn: 'Amethyst Violet',
    nameHi: 'नीलम बैंगनी',
    nameMr: 'जांभळा नीलम',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryContainer: '#F5F3FF',
    onPrimaryContainer: '#4C1D95',
    primaryLight: '#8B5CF6',
    accent: '#A78BFA',
    swatchClass: 'bg-purple-600'
  }
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  availableThemes: ThemeConfig[];
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeVariables(cfg: ThemeConfig) {
  const root = document.documentElement;
  root.setAttribute('data-theme', cfg.id);
  root.style.setProperty('--color-primary', cfg.primary);
  root.style.setProperty('--color-primary-hover', cfg.primaryHover);
  root.style.setProperty('--color-primary-container', cfg.primaryContainer);
  root.style.setProperty('--color-on-primary-container', cfg.onPrimaryContainer);
  root.style.setProperty('--color-primary-light', cfg.primaryLight);
  root.style.setProperty('--color-primary-focus', `${cfg.primary}33`);
  root.style.setProperty('--gradient-hero', `linear-gradient(135deg, ${cfg.primary}EE 0%, #0F172A 100%)`);
  root.style.setProperty('--gradient-hero-subtle', `linear-gradient(135deg, ${cfg.primaryContainer} 0%, #FFFFFF 100%)`);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('dhatu_theme') as ThemeId;
    return (saved && THEMES.some(t => t.id === saved)) ? saved : 'emerald';
  });

  const currentThemeConfig = THEMES.find(t => t.id === theme) || THEMES[0];

  useEffect(() => {
    applyThemeVariables(currentThemeConfig);
  }, [theme, currentThemeConfig]);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem('dhatu_theme', newTheme);
    const cfg = THEMES.find(t => t.id === newTheme) || THEMES[0];
    applyThemeVariables(cfg);

    if (Capacitor.isNativePlatform()) {
      try {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        availableThemes: THEMES,
        currentThemeConfig
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
