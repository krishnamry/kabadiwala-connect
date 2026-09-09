import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAssistProps {
  text: string;
  hindiText?: string;
  marathiText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceAssistButton: React.FC<VoiceAssistProps> = ({
  text,
  hindiText,
  marathiText,
  size = 'md',
  className = ''
}) => {
  const [speaking, setSpeaking] = useState(false);
  const { language, speak, stopSpeaking, t } = useLanguage();

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
    speak(speechText, language);

    // Auto-reset speaking icon state after speech completes
    setTimeout(() => {
      setSpeaking(false);
    }, Math.max(2500, Math.min(15000, speechText.length * 75)));
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base'
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={
        speaking
          ? language === 'hi' ? 'आवाज़ रोकें' : language === 'mr' ? 'आवाज थांबवा' : 'Stop Audio'
          : language === 'hi' ? 'बोलकर सुनें' : language === 'mr' ? 'ऐका' : 'Listen Aloud'
      }
      className={`inline-flex items-center justify-center rounded-lg border transition-all ${
        speaking
          ? 'bg-signal-500 text-white border-signal-600 animate-pulse shadow-md'
          : 'bg-paper-200 hover:bg-brass-100 text-steel-800 border-paper-300 hover:border-brass-400'
      } ${sizeClasses[size]} ${className}`}
    >
      {speaking ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-copper-600" />}
      <span className="sr-only">Voice Assist</span>
    </button>
  );
};

