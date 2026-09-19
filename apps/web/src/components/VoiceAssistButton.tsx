import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface VoiceAssistProps {
  text: string;
  hindiText?: string;
  marathiText?: string;
  audioKey?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceAssistButton: React.FC<VoiceAssistProps> = ({
  text,
  hindiText,
  marathiText,
  audioKey,
  label,
  size = 'md',
  className = ''
}) => {
  const [speaking, setSpeaking] = useState(false);
  const { language, speak, stopSpeaking, isSpeaking, t } = useLanguage();

  useEffect(() => {
    if (!isSpeaking) {
      setSpeaking(false);
    }
  }, [isSpeaking]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    let speechText = text;
    if (language === 'hi') {
      speechText = hindiText || t(text, text);
    } else if (language === 'mr') {
      speechText = marathiText || (hindiText ? t(hindiText, hindiText) : t(text, text));
    }

    setSpeaking(true);
    speak(speechText, language, {
      audioKey,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false)
    });
  };

  const sizeClasses = {
    sm: 'py-1 px-2.5 text-xs gap-1.5',
    md: 'py-1.5 px-3.5 text-xs sm:text-sm gap-2',
    lg: 'py-2 px-4 text-sm sm:text-base gap-2.5'
  };

  const displayTitle = speaking
    ? language === 'hi' ? 'आवाज़ रोकें' : language === 'mr' ? 'आवाज थांबवा' : 'Stop Audio'
    : language === 'hi' ? 'सुनें' : language === 'mr' ? 'ऐका' : 'Listen';

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={displayTitle}
      className={`inline-flex items-center justify-center font-bold select-none rounded-full border transition-all active:scale-95 shadow-xs ${
        speaking
          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/50'
          : 'bg-amber-100/90 hover:bg-amber-200/90 text-amber-950 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 dark:text-amber-200 border-amber-300/90 dark:border-amber-700/80'
      } ${sizeClasses[size]} ${className}`}
    >
      {speaking ? (
        <VolumeX className="w-3.5 h-3.5 text-slate-950 animate-pulse shrink-0" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300 shrink-0" />
      )}

      {/* Animated Sound Wave Bars */}
      <div className="flex items-center gap-0.5 h-3 px-0.5">
        <span
          className={`w-0.5 bg-current rounded-full transition-all ${
            speaking ? 'h-3 animate-pulse' : 'h-1.5 opacity-60'
          }`}
        />
        <span
          className={`w-0.5 bg-current rounded-full transition-all ${
            speaking ? 'h-2.5 animate-bounce' : 'h-2.5 opacity-80'
          }`}
        />
        <span
          className={`w-0.5 bg-current rounded-full transition-all ${
            speaking ? 'h-3.5 animate-pulse' : 'h-1 opacity-60'
          }`}
        />
      </div>

      {label ? (
        <span className="font-display font-bold tracking-tight">{label}</span>
      ) : (
        <span className="sr-only">Voice Assist</span>
      )}
    </button>
  );
};
