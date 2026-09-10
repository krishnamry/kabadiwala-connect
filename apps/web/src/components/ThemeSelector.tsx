import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, ThemeId } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, currentThemeConfig } = useTheme();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getThemeName = (tId: ThemeId) => {
    const found = THEMES.find(th => th.id === tId);
    if (!found) return '';
    if (language === 'hi') return found.nameHi;
    if (language === 'mr') return found.nameMr;
    return found.nameEn;
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
        title={t('themeTitle', 'Change Color Theme')}
        aria-label="Change Color Theme"
      >
        <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
        <span
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-sm border border-white"
          style={{ backgroundColor: currentThemeConfig.primary }}
        />
        <span className="hidden md:inline text-xs font-bold text-slate-700">
          {getThemeName(theme)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-150 py-2.5 z-50 text-sm animate-fade-in">
          <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
            <span>{t('themeSelect', 'Color Palette')}</span>
            <span className="text-[10px] font-mono text-slate-400">M3</span>
          </div>

          <div className="p-1.5 space-y-1">
            {THEMES.map((th) => {
              const isSelected = theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => {
                    setTheme(th.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-slate-100 font-bold text-slate-900 shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm border-2 border-white ring-1 ring-slate-200"
                      style={{ backgroundColor: th.primary }}
                    />
                    <span className="text-xs sm:text-sm">
                      {getThemeName(th.id)}
                    </span>
                  </div>

                  {isSelected && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: th.primary }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
