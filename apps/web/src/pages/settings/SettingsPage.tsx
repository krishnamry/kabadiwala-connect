import React, { useState } from 'react';
import {
  ArrowLeft,
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
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { useTheme, THEMES, ThemeId, ColorMode } from '../../context/ThemeContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';
import { storage } from '../../lib/storage';

interface SettingsPageProps {
  onBack: () => void;
  onOpenProfile?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  onOpenProfile
}) => {
  const { theme, setTheme, colorMode, setColorMode, resolvedMode, currentThemeConfig } = useTheme();
  const { language, setLanguage, t, speak } = useLanguage();

  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => localStorage.getItem('dhatu_haptics') !== 'false');

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    localStorage.setItem('dhatu_haptics', next ? 'true' : 'false');
    if (next) triggerHaptic(25);
  };

  const handleClearCache = () => {
    triggerHaptic(30);
    storage.resetAll();
    setResetSuccess(t('cacheCleared', 'Local cache refreshed and datasets reset successfully.'));
    setTimeout(() => {
      setResetSuccess(null);
      window.location.reload();
    }, 1200);
  };

  const colorModes: Array<{ id: ColorMode; label: string; icon: React.FC<{ className?: string }>; desc: string }> = [
    {
      id: 'system',
      label: 'Device System',
      icon: Smartphone,
      desc: 'Matches device preference (defaults to light mode)'
    },
    {
      id: 'light',
      label: 'Light',
      icon: Sun,
      desc: 'High clarity, bright daylight surface'
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: Moon,
      desc: 'High contrast deep slate for night use'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-body transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#131D31]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onBack();
              }}
              className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
              title="Go Back"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                {t('settingsTitle', 'App Settings')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {t('settingsSubtitle', 'Personalize themes, display modes, voice & regional preferences')}
              </p>
            </div>
          </div>

          {onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onOpenProfile();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-transform active:scale-95 border border-slate-200 dark:border-slate-700"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('myProfile', 'My Profile')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        
        {/* SECTION 1: Appearance & Color Mode */}
        <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: currentThemeConfig.primary }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                Display Mode & Themes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Choose light, dark, or automatic device theme, and select your Material 3 color palette.
              </p>
            </div>
          </div>

          {/* Color Mode Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              1. Choose Appearance Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {colorModes.map(m => {
                const isSelected = colorMode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      setColorMode(m.id);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-display font-black text-sm text-slate-900 dark:text-white">
                        {m.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {m.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Material 3 Color Theme Palettes */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              2. Material 3 Accent Color Palette
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEMES.map(tOption => {
                const isSelected = theme === tOption.id;
                return (
                  <button
                    key={tOption.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      setTheme(tOption.id);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-100/80 dark:bg-slate-800 ring-2 ring-slate-400/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full shadow-sm shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: tOption.primary }}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {tOption.nameEn}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {language === 'hi' ? tOption.nameHi : language === 'mr' ? tOption.nameMr : tOption.primary}
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full border border-white/60 shrink-0"
                      style={{ backgroundColor: tOption.accent }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 2: Language & Voice Assistance */}
        <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                Language & Accessibility
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Set interface language, spoken audio assistance rate, and vibration feedback.
              </p>
            </div>
          </div>

          {/* Language Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              Application Language
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { code: 'en', native: 'English', desc: 'Default Latin numerals' },
                { code: 'hi', native: 'हिन्दी (Hindi)', desc: 'स्वाभाविक अनुवाद, स्पष्ट संख्याएं' },
                { code: 'mr', native: 'मराठी (Marathi)', desc: 'सहज भाषा, स्पष्ट आकडे' }
              ].map(item => {
                const isSelected = language === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      setLanguage(item.code as Language);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-black text-sm text-slate-900 dark:text-white">
                        {item.native}
                      </span>
                      {isSelected && <span className="text-emerald-600 font-bold text-sm">✓</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Haptics & Voice Audio Helpers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <Vibrate className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Haptic Touch Feedback
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tactile pulses on buttons & actions
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleHaptics}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  hapticsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Test Voice Assistance
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Spoken Hindi/Marathi audio preview
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  speak(
                    language === 'hi'
                      ? 'कबाड़ीवाला कनेक्ट वॉइस सहायता सक्रिय है।'
                      : language === 'mr'
                      ? 'कबाडीवाला कनेक्ट व्हॉइस मदत चालू आहे.'
                      : 'Kabadiwala Connect voice assistance is working.'
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
              >
                Play Audio
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: Offline Data, Storage & Regulatory Info */}
        <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                Data, Storage & Compliance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Offline local storage cache management and regulatory CPCB audit specs.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Reset Local Offline Datasets</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                Clears demo modifications and resets all offline lots, bookings, and ledger state to official CPCB benchmark seeds.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-transform active:scale-95 shrink-0"
            >
              Reset Local Data
            </button>
          </div>

          {resetSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* Compliance Info Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono">
            <div className="font-bold text-slate-700 dark:text-slate-300">
              Regulatory Standards:
            </div>
            <div>• CPCB E-Waste (Management) Rules 2022 (Form-2 & Form-6 Compliance)</div>
            <div>• Smart India Hackathon SIH26229 — Ministry of Mines</div>
            <div>• Cryptographic SHA-256 Ledger Auditability</div>
          </div>
        </section>

      </div>
    </div>
  );
};
