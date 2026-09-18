import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';

export interface VoicePillProps {
  text?: string;
  hindiText?: string;
  marathiText?: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const VoicePill: React.FC<VoicePillProps> = ({
  text,
  hindiText,
  marathiText,
  label,
  size = 'md',
  className = ''
}) => {
  const { language, speak, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  const getTargetText = () => {
    if (language === 'hi' && hindiText) return hindiText;
    if (language === 'mr' && marathiText) return marathiText;
    return text || hindiText || marathiText || '';
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(20);

    const hasNativeTTS = typeof window !== 'undefined' && !!(window as any).AndroidTTS?.isAvailable?.();
    const hasWebTTS = typeof window !== 'undefined' && 'speechSynthesis' in window && !!window.speechSynthesis;

    if (hasNativeTTS || hasWebTTS) {
      if (isPlaying) {
        if (hasNativeTTS) (window as any).AndroidTTS.stop();
        if (hasWebTTS) {
          try { window.speechSynthesis.cancel(); } catch {}
        }
        setIsPlaying(false);
        return;
      }

      const spokenContent = getTargetText();
      if (!spokenContent) return;

      setIsPlaying(true);
      speak(spokenContent);

      // Reset animation when speaking finishes
      const estimatedDuration = Math.max(2500, (spokenContent.length / 12) * 1000);
      setTimeout(() => {
        setIsPlaying(false);
      }, estimatedDuration);
    }
  };

  const displayLabel =
    label || (language === 'hi' ? 'सुनें' : language === 'mr' ? 'ऐका' : 'Listen');

  const sizeStyles =
    size === 'sm'
      ? 'h-8 px-2.5 text-xs gap-1.5'
      : 'h-10 px-3.5 text-xs sm:text-sm gap-2';

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex items-center rounded-full font-bold select-none transition-all active:scale-95 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 shadow-2xs hover:bg-amber-100/80 dark:hover:bg-amber-900/60 ${sizeStyles} ${className}`}
      title="Tap to listen in chosen language"
      aria-label="Spoken Voice Guidance"
    >
      {isPlaying ? (
        <VolumeX className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 animate-pulse shrink-0" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
      )}

      {/* Animated Sound Wave Bars */}
      <div className="flex items-center gap-0.5 h-3 px-0.5">
        <span
          className={`w-0.5 bg-amber-600 dark:bg-amber-400 rounded-full transition-all ${
            isPlaying ? 'h-3 animate-pulse' : 'h-1.5'
          }`}
        />
        <span
          className={`w-0.5 bg-amber-600 dark:bg-amber-400 rounded-full transition-all ${
            isPlaying ? 'h-2.5 animate-bounce' : 'h-2.5'
          }`}
        />
        <span
          className={`w-0.5 bg-amber-600 dark:bg-amber-400 rounded-full transition-all ${
            isPlaying ? 'h-3.5 animate-pulse' : 'h-1'
          }`}
        />
      </div>

      <span className="font-display font-bold">{displayLabel}</span>
    </button>
  );
};
