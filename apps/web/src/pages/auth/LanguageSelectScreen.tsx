import React, { useState } from 'react';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';
import { ArrowRight, Check, Volume2, Globe } from 'lucide-react';

interface LanguageSelectScreenProps {
  onComplete: () => void;
}

interface LanguageOption {
  code: Language;
  nameNative: string;
  nameEnglish: string;
  tagline: string;
  badge: string;
  sampleAudioText: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    nameNative: 'English',
    nameEnglish: 'English',
    tagline: 'Standard English interface with metric units',
    badge: 'Default',
    sampleAudioText: 'Welcome to Kabadiwala Connect. Please select English to continue.'
  },
  {
    code: 'hi',
    nameNative: 'हिन्दी',
    nameEnglish: 'Hindi',
    tagline: 'स्वाभाविक हिंदी • तकनीकी शब्द एवं संख्याएं स्पष्ट',
    badge: 'लोकप्रिय',
    sampleAudioText: 'कबाड़ीवाला कनेक्ट में आपका स्वागत है। आगे बढ़ने के लिए हिन्दी चुनें।'
  },
  {
    code: 'mr',
    nameNative: 'मराठी',
    nameEnglish: 'Marathi',
    tagline: 'सहज आणि सोपी मराठी • तांत्रिक शब्द व आकडे स्पष्ट',
    badge: 'महाराष्ट्र',
    sampleAudioText: 'कबाडीवाला कनेक्ट मध्ये आपले स्वागत आहे. पुढे जाण्यासाठी मराठी निवडा.'
  }
];

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({ onComplete }) => {
  const { language, setLanguage, speak, stopSpeaking, isSpeaking } = useLanguage();
  const { currentThemeConfig } = useTheme();
  const [selectedLang, setSelectedLang] = useState<Language>(language || 'en');

  const handleSelect = (code: Language) => {
    triggerHaptic(20);
    setSelectedLang(code);
    setLanguage(code);
  };

  const handlePlayAudioSample = (e: React.MouseEvent, opt: LanguageOption) => {
    e.stopPropagation();
    triggerHaptic(15);
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(opt.sampleAudioText, opt.code);
    }
  };

  const handleContinue = () => {
    triggerHaptic(25);
    localStorage.setItem('dhatu_language_onboarded', 'true');
    setLanguage(selectedLang);
    onComplete();
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 p-4 sm:p-6 transition-colors duration-200"
      style={{
        paddingTop: 'max(1rem, var(--app-top-inset, env(safe-area-inset-top, 0px)))'
      }}
    >
      {/* Top Header */}
      <div className="w-full max-w-md mx-auto pt-2 sm:pt-6 text-center">
        {/* App Logo Emblem */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[22px] bg-emerald-600/10 dark:bg-emerald-500/20 border-2 border-emerald-500/30 mb-4 shadow-sm animate-fade-in">
          <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white">
          Choose Language
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <span>अपनी भाषा चुनें</span>
          <span>•</span>
          <span>तुमची भाषा निवडा</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Select your preferred language for an intuitive experience. You can change this anytime in Settings.
        </p>
      </div>

      {/* Language Options Cards */}
      <div className="w-full max-w-md mx-auto my-6 space-y-3.5">
        {LANGUAGES.map((opt) => {
          const isSelected = selectedLang === opt.code;
          return (
            <div
              key={opt.code}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(opt.code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(opt.code);
                }
              }}
              className={`w-full text-left p-4 rounded-[24px] border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm ${
                isSelected
                  ? 'bg-white dark:bg-slate-800/90 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Radio Indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-lg text-slate-900 dark:text-white">
                      {opt.nameNative}
                    </span>
                    {opt.nameNative !== opt.nameEnglish && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ({opt.nameEnglish})
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {opt.tagline}
                  </p>
                </div>
              </div>

              {/* Right Voice Listen Preview Button */}
              <button
                type="button"
                onClick={(e) => handlePlayAudioSample(e, opt)}
                title={`Listen sample in ${opt.nameEnglish}`}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform shrink-0"
              >
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Area */}
      <div className="w-full max-w-md mx-auto pb-6 sm:pb-8">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-display font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <span>
            {selectedLang === 'hi'
              ? 'आगे बढ़ें (Continue)'
              : selectedLang === 'mr'
              ? 'पुढे जा (Continue)'
              : 'Continue to Sign In'}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-mono">
          Kabadiwala Connect • Dhatu Ecosystem v1.0
        </p>
      </div>
    </div>
  );
};
