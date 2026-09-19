import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';

export interface VoicePillProps {
  text?: string;
  hindiText?: string;
  marathiText?: string;
  audioKey?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoicePill: React.FC<VoicePillProps> = ({
  text,
  hindiText,
  marathiText,
  audioKey,
  label,
  size = 'md',
  className = ''
}) => {
  const { language, speak, stopSpeaking, isSpeaking, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isSpeaking) {
      setIsPlaying(false);
    }
  }, [isSpeaking]);

  const getTargetText = () => {
    if (language === 'hi' && hindiText) return hindiText;
    if (language === 'mr' && marathiText) return marathiText;
    return text || hindiText || marathiText || '';
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(20);

    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    const spokenContent = getTargetText();
    if (!spokenContent && !audioKey) return;

    setIsPlaying(true);
    speak(spokenContent, language, {
      audioKey,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false)
    });
  };

  const displayLabel =
    label || (language === 'hi' ? 'सुनें' : language === 'mr' ? 'ऐका' : 'Listen');

  const sizeStyles =
    size === 'sm'
      ? 'h-8 px-2.5 text-xs gap-1.5'
      : size === 'lg'
      ? 'h-11 px-4 text-sm sm:text-base gap-2.5'
      : 'h-10 px-3.5 text-xs sm:text-sm gap-2';

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex items-center rounded-full font-bold select-none transition-all active:scale-95 shadow-xs ${
        isPlaying
          ? 'bg-amber-500 text-slate-950 border border-amber-600 ring-2 ring-amber-400/50 shadow-md'
          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-100/80 dark:hover:bg-amber-900/60'
      } ${sizeStyles} ${className}`}
      title="Tap to listen in chosen language"
      aria-label="Spoken Voice Guidance"
    >
      {isPlaying ? (
        <VolumeX className="w-3.5 h-3.5 text-slate-950 animate-pulse shrink-0" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
      )}

      {/* Animated Sound Wave Bars */}
      <div className="flex items-center gap-0.5 h-3 px-0.5">
        <span
          className={`w-0.5 bg-current rounded-full transition-all ${
            isPlaying ? 'h-3 animate-pulse' : 'h-1.5 opacity-60'
          }`}
        />
        <span
          className={`w-0.5 bg-current rounded-full transition-all ${
            isPlaying ? 'h-2.5 animate-bounce' : 'h-2.5 opacity-80'
          }`}
        />
        <span
          className={`w-0.5 bg-current rounded-full transition-all ${
            isPlaying ? 'h-3.5 animate-pulse' : 'h-1 opacity-60'
          }`}
        />
      </div>

      <span className="font-display font-bold tracking-tight">{displayLabel}</span>
    </button>
  );
};
