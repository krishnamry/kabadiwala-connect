/**
 * Android WebView SpeechSynthesis Polyfill
 * Seamlessly connects window.speechSynthesis to native AndroidTTS bridge in Capacitor WebView.
 */
export function initTTSPolyfill() {
  if (typeof window === 'undefined') return;

  const hasAndroidTTS = !!(window as any).AndroidTTS;
  const hasSpeechSynthesis = 'speechSynthesis' in window && !!window.speechSynthesis;

  if (hasAndroidTTS && (!hasSpeechSynthesis || !(window as any).speechSynthesis?.speak)) {
    console.log('[TTS] Registering Android WebView SpeechSynthesis bridge polyfill');

    (window as any).speechSynthesis = {
      speaking: false,
      paused: false,
      pending: false,
      onvoiceschanged: null,
      getVoices: () => [
        { name: 'Google हिन्दी (भारत)', lang: 'hi-IN', default: true, voiceURI: 'hi-in-google' },
        { name: 'Google मराठी (भारत)', lang: 'mr-IN', default: false, voiceURI: 'mr-in-google' },
        { name: 'Google English (India)', lang: 'en-IN', default: false, voiceURI: 'en-in-google' }
      ],
      speak: (utterance: any) => {
        if (!utterance || !utterance.text) return;
        const text = utterance.text;
        const lang = utterance.lang || 'hi';
        const rate = utterance.rate || 1.0;
        const pitch = utterance.pitch || 1.0;

        (window as any).speechSynthesis.speaking = true;
        utterance.onstart?.();

        (window as any).__onAndroidTTSEnd = () => {
          (window as any).speechSynthesis.speaking = false;
          utterance.onend?.();
        };

        (window as any).__onAndroidTTSError = (err: any) => {
          (window as any).speechSynthesis.speaking = false;
          utterance.onerror?.(err);
        };

        try {
          (window as any).AndroidTTS.speak(text, lang, rate, pitch);
        } catch (e) {
          console.warn('[TTS Polyfill] Speak failed:', e);
          (window as any).speechSynthesis.speaking = false;
          utterance.onerror?.(e);
        }
      },
      cancel: () => {
        (window as any).speechSynthesis.speaking = false;
        try {
          (window as any).AndroidTTS?.stop?.();
        } catch {}
      },
      pause: () => {},
      resume: () => {}
    };
  }
}
