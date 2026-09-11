import React, { useState } from 'react';
import {
  X,
  Palette,
  Sun,
  Moon,
  Smartphone,
  Check,
  Languages,
  Volume2,
  Vibrate,
  Database,
  Info,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useTheme, THEMES, ThemeId, ColorMode } from '../context/ThemeContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';
import { storage } from '../lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile
}) => {
  const { theme, setTheme, colorMode, setColorMode, resolvedMode, currentThemeConfig } = useTheme();
  const { language, setLanguage, t, speak } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<'appearance' | 'language' | 'system'>('appearance');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => localStorage.getItem('dhatu_haptics') !== 'false');

  if (!isOpen) return null;

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    localStorage.setItem('dhatu_haptics', next ? 'true' : 'false');
    if (next) triggerHaptic(25);
  };

  const handleClearCache = () => {
    triggerHaptic(30);
    storage.resetAll();
    setResetSuccess(t('cacheCleared', 'Local cache refreshed and mock datasets reset successfully.'));
    setTimeout(() => {
      setResetSuccess(null);
      window.location.reload();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131D31] text-slate-900 dark:text-slate-100 rounded-[32px] border border-slate-200/80 dark:border-slate-800 max-w-xl w-full p-6 sm:p-8 shadow-m3-4 max-h-[92vh] flex flex-col space-y-6 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: currentThemeConfig.primary }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight">
                {t('settingsTitle', 'App Settings')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('settingsSubtitle', 'Personalize theme, display modes, voice & regional preferences')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => { setActiveCategory('appearance'); triggerHaptic(10); }}
            className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              activeCategory === 'appearance'
                ? 'bg-white dark:bg-[#1A263D] text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{t('tabTheme', 'Appearance')}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategory('language'); triggerHaptic(10); }}
            className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              activeCategory === 'language'
                ? 'bg-white dark:bg-[#1A263D] text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{t('tabLang', 'Language & Voice')}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategory('system'); triggerHaptic(10); }}
            className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              activeCategory === 'system'
                ? 'bg-white dark:bg-[#1A263D] text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{t('tabAbout', 'About & Data')}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {resetSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* TAB 1: APPEARANCE (Color Mode & Palette) */}
          {activeCategory === 'appearance' && (
            <div className="space-y-6">
              {/* Light / Dark / System Segmented Switcher */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {t('colorMode', 'Display Mode (Light / Dark)')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'light' as ColorMode, label: t('modeLight', 'Light Mode'), icon: Sun },
                    { id: 'dark' as ColorMode, label: t('modeDark', 'Dark Mode'), icon: Moon },
                    { id: 'system' as ColorMode, label: t('modeSystem', 'System Auto'), icon: Smartphone },
                  ].map(m => {
                    const isSelected = colorMode === m.id;
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setColorMode(m.id);
                          triggerHaptic(15);
                        }}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white font-bold shadow-m3-1 scale-[1.02]'
                            : 'bg-slate-50 dark:bg-[#1A263D] hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-xs sm:text-sm">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {resolvedMode === 'dark' ? '🌙 Dark Mode is actively applied' : '☀️ Light Mode is actively applied'}
                  {colorMode === 'system' && ' (matching your operating system)'}.
                </p>
              </div>

              {/* Material 3 Expressive Accent Palette */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {t('accentTheme', 'Material 3 Color Palette')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEMES.map(th => {
                    const isSelected = theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          setTheme(th.id);
                          triggerHaptic(15);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-50 dark:bg-[#1A263D] border-2 shadow-sm font-bold'
                            : 'bg-white dark:bg-[#131D31] hover:bg-slate-50 dark:hover:bg-[#1A263D] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        style={{
                          borderColor: isSelected ? th.primary : undefined
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-full shrink-0 shadow-sm border-2 border-white ring-1 ring-slate-200 dark:ring-slate-700"
                            style={{ backgroundColor: th.primary }}
                          />
                          <div>
                            <span className="text-sm font-bold block text-slate-900 dark:text-white">
                              {language === 'hi' ? th.nameHi : language === 'mr' ? th.nameMr : th.nameEn}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {th.primary}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: th.primary }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANGUAGE & VOICE */}
          {activeCategory === 'language' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {t('selectLanguage', 'Select Application Language')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { code: 'en' as Language, title: 'English', sub: 'Default' },
                    { code: 'hi' as Language, title: 'हिन्दी', sub: 'Hindi' },
                    { code: 'mr' as Language, title: 'मराठी', sub: 'Marathi' },
                  ].map(l => {
                    const isSelected = language === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          triggerHaptic(15);
                        }}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-600 text-emerald-900 dark:text-emerald-100 font-bold shadow-sm scale-[1.02]'
                            : 'bg-slate-50 dark:bg-[#1A263D] hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-base font-bold">{l.title}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{l.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Haptic Vibration & Audio Assistance */}
              <div className="p-4 bg-slate-50 dark:bg-[#1A263D] rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Vibrate className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        {t('hapticsFeedback', 'Haptic Touch Feedback')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t('hapticsSub', 'Tactile vibrations on Android device button taps')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleHaptics}
                    className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${
                      hapticsEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        {t('voiceAssistance', 'Audio Pronunciation (TTS)')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t('voiceSub', 'Voice guidance for scrap rates & orders')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speak(language === 'hi' ? 'नमस्ते, धातु ई-कचरा मंच तैयार है' : language === 'mr' ? 'नमस्कार, धातु ई-कचरा व्यासपीठ सज्ज आहे' : 'Hello, Dhatu circular resource engine is active')}
                    className="btn-primary-m3 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm"
                  >
                    {t('testVoice', 'Test Audio')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM, STORAGE & ABOUT */}
          {activeCategory === 'system' && (
            <div className="space-y-5">
              {/* Account Quick Shortcut */}
              {onOpenProfile && (
                <div className="p-4 bg-slate-50 dark:bg-[#1A263D] rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('accountProfile', 'My Personal & Security Profile')}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('manageAccSub', 'View KYC, Aadhaar link, PIN and device sessions')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="btn-primary-m3 px-4 py-2 text-xs sm:text-sm font-bold rounded-full"
                  >
                    {t('viewProfile', 'View Profile →')}
                  </button>
                </div>
              )}

              {/* Local Storage & Cache */}
              <div className="p-4 bg-slate-50 dark:bg-[#1A263D] rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('offlineStorage', 'Local Offline Cache')}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('offlineSub', 'Pickups, lots, and rates cached for instant offline access')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('resetMockData', 'Clear Local Cache & Reset Data')}</span>
                </button>
              </div>

              {/* App Version Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 bg-slate-50/60 dark:bg-[#1A263D]/60 font-body">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Application Version</span>
                  <span className="font-bold text-slate-900 dark:text-white">v1.0.0 (Android 17 & Web)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Traceability Standard</span>
                  <span className="font-bold text-emerald-600">CPCB Form-2 Compliant</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Hackathon Problem Statement</span>
                  <span className="font-bold text-slate-900 dark:text-white">SIH26229</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer close button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full font-bold text-sm transition-colors"
          >
            {t('close', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};
