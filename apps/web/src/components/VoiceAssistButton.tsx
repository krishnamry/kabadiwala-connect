import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VoiceAssistProps {
  text: string;
  hindiText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceAssistButton: React.FC<VoiceAssistProps> = ({
  text,
  hindiText,
  size = 'md',
  className = ''
}) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const speechText = hindiText || text;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = hindiText ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel(); // clear previous
    window.speechSynthesis.speak(utterance);
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={speaking ? 'Stop Speaking' : 'बोलकर सुनें / Listen Aloud'}
      className={`inline-flex items-center justify-center rounded-full transition-all ${
        speaking
          ? 'bg-amber-500 text-white animate-pulse shadow-md'
          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
      } ${sizeClasses[size]} ${className}`}
    >
      {speaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      <span className="sr-only">Voice Assist</span>
    </button>
  );
};
