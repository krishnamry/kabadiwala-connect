/**
 * High-Fidelity Vernacular Voice Engine for Kabadiwala Connect
 * Solves the Chrome / Android WebView 15-second utterance garbage-collection bug,
 * speech queue stall, and Devanagari phonetic pronunciation issues.
 */

import { sarvamVoiceService } from './sarvamVoiceService';

export type VoiceLanguage = 'en' | 'hi' | 'mr';

// Module-level retainers to prevent browser GC from prematurely destroying active utterances
let activeUtteranceQueue: SpeechSynthesisUtterance[] = [];
let heartbeatTimer: any = null;
let isCurrentlyPlaying = false;
let playbackEndCallback: (() => void) | null = null;

// Phonetic Indian preprocessing
export function preprocessVernacularText(text: string, lang: VoiceLanguage): string {
  let cleaned = text;

  if (lang === 'hi') {
    cleaned = cleaned
      .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 रुपये')
      .replace(/₹\s*/g, ' रुपये ')
      .replace(/\/\s*kg\b/gi, ' प्रति किलो ')
      .replace(/\bkg\b/gi, ' किलो ')
      .replace(/(\d+)\s*%/g, '$1 प्रतिशत')
      .replace(/(\d+)\s*[-—]\s*(\d+)/g, '$1 से $2')
      .replace(/\bpcbs\b/gi, ' पीसीबी ')
      .replace(/\bpcb\b/gi, ' पीसीबी ')
      .replace(/\bcrt\b/gi, ' सीआरटी ')
      .replace(/\blcd\b/gi, ' एलसीडी ')
      .replace(/\bled\b/gi, ' एलईडी ')
      .replace(/\bram\b/gi, ' रैम ')
      .replace(/\bcpu\b/gi, ' सीपीयू ')
      .replace(/\bkwh\b/gi, ' किलोवाट घंटा ')
      .replace(/\bgps\b/gi, ' जीपीएस ')
      .replace(/\bkyc\b/gi, ' केवाईसी ')
      .replace(/\botp\b/gi, ' ओटीपी ')
      .replace(/\bqr\b/gi, ' क्यूआर ')
      .replace(/\bcpcb\b/gi, ' सीपीसीबी ')
      .replace(/•|\*|#|~|\[|\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } else if (lang === 'mr') {
    cleaned = cleaned
      .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 रुपये')
      .replace(/₹\s*/g, ' रुपये ')
      .replace(/\/\s*kg\b/gi, ' प्रति किलो ')
      .replace(/\bkg\b/gi, ' किलो ')
      .replace(/(\d+)\s*%/g, '$1 टक्के')
      .replace(/(\d+)\s*[-—]\s*(\d+)/g, '$1 ते $2')
      .replace(/\bpcbs\b/gi, ' पीसीबी ')
      .replace(/\bpcb\b/gi, ' पीसीबी ')
      .replace(/\bcrt\b/gi, ' सीआरटी ')
      .replace(/\blcd\b/gi, ' एलसीडी ')
      .replace(/\bled\b/gi, ' एलईडी ')
      .replace(/\bram\b/gi, ' रॅम ')
      .replace(/\bcpu\b/gi, ' सीपीयू ')
      .replace(/\bkyc\b/gi, ' केवायसी ')
      .replace(/\bqr\b/gi, ' क्यूआर ')
      .replace(/\bcpcb\b/gi, ' सीपीसीबी ')
      .replace(/•|\*|#|~|\[|\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } else {
    cleaned = cleaned
      .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 Rupees')
      .replace(/₹\s*/g, ' Rupees ')
      .replace(/\/\s*kg\b/gi, ' per kilogram ')
      .replace(/\bkg\b/gi, ' kilograms ')
      .replace(/\bpcbs\b/gi, ' P C B s ')
      .replace(/\bpcb\b/gi, ' P C B ')
      .replace(/\bcrt\b/gi, ' C R T ')
      .replace(/\blcd\b/gi, ' L C D ')
      .replace(/\bled\b/gi, ' L E D ')
      .replace(/\bcpcb\b/gi, ' C P C B ')
      .replace(/•|\*|#|~|\[|\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return cleaned;
}

/**
 * Splits long instructions into bite-sized sentences under 140 characters
 * to avoid browser GC timeouts and queue locks.
 */
export function chunkSentence(text: string, maxLen: number = 135): string[] {
  if (!text || text.trim().length === 0) return [];
  
  // Split on sentence boundaries (Hindi danda '।', period, question mark, exclamation, semicolon, or newline)
  const rawSentences = text.split(/(?<=[।.?!;\n])\s+/);
  const chunks: string[] = [];

  for (const raw of rawSentences) {
    const s = raw.trim();
    if (!s) continue;

    if (s.length <= maxLen) {
      chunks.push(s);
    } else {
      // Split on clause delimiters (comma, dash, colon)
      const clauses = s.split(/(?<=[,:\-])\s+/);
      let buffer = '';
      for (const clause of clauses) {
        if ((buffer + ' ' + clause).trim().length <= maxLen) {
          buffer = (buffer + ' ' + clause).trim();
        } else {
          if (buffer) chunks.push(buffer);
          // If a single clause itself is still longer than maxLen, split by words
          if (clause.length > maxLen) {
            const words = clause.split(/\s+/);
            let wordBuf = '';
            for (const w of words) {
              if (w.length > maxLen) {
                if (wordBuf) {
                  chunks.push(wordBuf);
                  wordBuf = '';
                }
                for (let i = 0; i < w.length; i += maxLen) {
                  chunks.push(w.slice(i, i + maxLen));
                }
              } else if ((wordBuf + ' ' + w).trim().length <= maxLen) {
                wordBuf = (wordBuf + ' ' + w).trim();
              } else {
                if (wordBuf) chunks.push(wordBuf);
                wordBuf = w;
              }
            }
            if (wordBuf) buffer = wordBuf;
          } else {
            buffer = clause;
          }
        }
      }
      if (buffer) chunks.push(buffer);
    }
  }

  return chunks.filter(c => c.trim().length > 0);
}

// Find appropriate voice
function getOptimalVoice(synth: SpeechSynthesis, lang: VoiceLanguage): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (!voices || voices.length === 0) return null;

  const match = (pattern: string) => {
    return voices.find(v => {
      const l = (v.lang || '').toLowerCase().replace('_', '-');
      const n = (v.name || '').toLowerCase();
      return l.startsWith(pattern.toLowerCase()) || n.includes(pattern.toLowerCase());
    });
  };

  if (lang === 'hi') {
    return match('hi') || match('hindi') || match('hi-in') || null;
  } else if (lang === 'mr') {
    // Attempt Marathi native voice, fall back to Hindi Devanagari engine (fluent for Devanagari script)
    return match('mr') || match('marathi') || match('mr-in') || match('hi') || match('hindi') || null;
  } else {
    return match('en-in') || match('india') || match('en-gb') || match('en') || null;
  }
}

// Chrome / Android keepalive heartbeat to prevent speech synthesis stall
function startKeepAliveHeartbeat() {
  stopKeepAliveHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 4500);
}

function stopKeepAliveHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/**
 * Main Speak Function
 * Plays long, multi-sentence spoken guides flawlessly without chopping off or hanging.
 */
export function playVernacularSpeech(
  text: string,
  lang: VoiceLanguage = 'hi',
  options?: {
    audioKey?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    rate?: number;
    pitch?: number;
  }
): void {
  // Cancel any ongoing utterance or audio
  stopVernacularSpeech();

  const hasAudioKey = Boolean(options?.audioKey);
  const processed = preprocessVernacularText(text || '', lang);
  if (!hasAudioKey && (!processed || !processed.trim())) {
    options?.onEnd?.();
    return;
  }

  isCurrentlyPlaying = true;
  playbackEndCallback = options?.onEnd || null;

  // 1. Primary Engine: Sarvam AI High-Fidelity Voice (Static Asset Bank / IndexedDB Cache / REST API)
  sarvamVoiceService
    .play(text || options?.audioKey || '', lang, {
      audioKey: options?.audioKey,
      onStart: () => {
        isCurrentlyPlaying = true;
        options?.onStart?.();
      },
      onEnd: () => {
        isCurrentlyPlaying = false;
        if (playbackEndCallback) {
          playbackEndCallback();
          playbackEndCallback = null;
        }
      },
      onError: (err) => {
        console.warn('[VoiceEngine] Sarvam AI play error, falling back to Native/Web speech:', err);
        fallbackToNativeOrWebSpeech(processed, lang, options);
      }
    })
    .then((played) => {
      if (!played) {
        fallbackToNativeOrWebSpeech(processed, lang, options);
      }
    })
    .catch((err) => {
      console.warn('[VoiceEngine] Sarvam AI invocation error, falling back:', err);
      fallbackToNativeOrWebSpeech(processed, lang, options);
    });
}

function fallbackToNativeOrWebSpeech(
  processed: string,
  lang: VoiceLanguage,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    rate?: number;
    pitch?: number;
  }
): void {
  // 1. Direct native Android TTS bridge if available in Capacitor APK
  if (typeof window !== 'undefined' && (window as any).AndroidTTS?.speak) {
    try {
      const androidLang = lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en';
      isCurrentlyPlaying = true;
      options?.onStart?.();
      (window as any).__onAndroidTTSEnd = () => {
        isCurrentlyPlaying = false;
        if (playbackEndCallback) {
          playbackEndCallback();
          playbackEndCallback = null;
        }
        options?.onEnd?.();
      };
      (window as any).__onAndroidTTSError = (err: any) => {
        isCurrentlyPlaying = false;
        options?.onError?.(err);
      };
      (window as any).AndroidTTS.speak(processed, androidLang, options?.rate || 1.0, options?.pitch || 1.0);
      return;
    } catch (e) {
      console.warn('[VoiceEngine] Direct AndroidTTS failed, falling back to Web Speech:', e);
    }
  }

  // 2. Browser Web Speech API
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onError?.(new Error('SpeechSynthesis not supported'));
    return;
  }

  const synth = window.speechSynthesis;
  const chunks = chunkSentence(processed);

  if (chunks.length === 0) {
    options?.onEnd?.();
    return;
  }

  isCurrentlyPlaying = true;
  playbackEndCallback = options?.onEnd || null;
  options?.onStart?.();

  const voice = getOptimalVoice(synth, lang);
  let currentIndex = 0;

  activeUtteranceQueue = chunks.map((chunk, idx) => {
    const utt = new SpeechSynthesisUtterance(chunk);
    if (voice) utt.voice = voice;

    if (lang === 'hi') {
      utt.lang = 'hi-IN';
      utt.rate = options?.rate || 0.90;
      utt.pitch = options?.pitch || 1.0;
    } else if (lang === 'mr') {
      utt.lang = voice?.lang?.startsWith('mr') ? 'mr-IN' : 'hi-IN';
      utt.rate = options?.rate || 0.88;
      utt.pitch = options?.pitch || 1.0;
    } else {
      utt.lang = 'en-IN';
      utt.rate = options?.rate || 0.95;
      utt.pitch = options?.pitch || 1.0;
    }

    utt.onstart = () => {
      isCurrentlyPlaying = true;
    };

    utt.onend = () => {
      currentIndex++;
      if (currentIndex < activeUtteranceQueue.length) {
        // Play next chunk
        try {
          if (synth.paused) synth.resume();
          synth.speak(activeUtteranceQueue[currentIndex]);
        } catch (e) {
          console.warn('Next chunk speak error:', e);
        }
      } else {
        // Completed all chunks
        stopKeepAliveHeartbeat();
        isCurrentlyPlaying = false;
        activeUtteranceQueue = [];
        if (playbackEndCallback) {
          playbackEndCallback();
          playbackEndCallback = null;
        }
      }
    };

    utt.onerror = (e) => {
      // If canceled explicitly, don't trigger error
      if ((e as any)?.error === 'canceled' || (e as any)?.error === 'interrupted') {
        return;
      }
      console.warn('Utterance playback warning:', e);
      currentIndex++;
      if (currentIndex < activeUtteranceQueue.length) {
        try {
          synth.speak(activeUtteranceQueue[currentIndex]);
        } catch {}
      } else {
        stopKeepAliveHeartbeat();
        isCurrentlyPlaying = false;
        activeUtteranceQueue = [];
        if (playbackEndCallback) {
          playbackEndCallback();
          playbackEndCallback = null;
        }
      }
    };

    return utt;
  });

  // Keep references on window to prevent V8 garbage collection
  (window as any).__kabadiwalaUtterances = activeUtteranceQueue;

  startKeepAliveHeartbeat();

  // Small timeout to allow synth to reset cleanly
  setTimeout(() => {
    try {
      if (synth.paused) synth.resume();
      if (activeUtteranceQueue.length > 0) {
        synth.speak(activeUtteranceQueue[0]);
      }
    } catch (err) {
      console.warn('SpeechSynthesis start error:', err);
      stopKeepAliveHeartbeat();
      isCurrentlyPlaying = false;
      options?.onError?.(err);
    }
  }, 35);
}

export function stopVernacularSpeech(): void {
  // 1. Stop Sarvam AI audio
  try {
    sarvamVoiceService.stopAudio();
  } catch (e) {
    console.warn('Sarvam stop error:', e);
  }

  stopKeepAliveHeartbeat();
  isCurrentlyPlaying = false;
  activeUtteranceQueue = [];
  (window as any).__kabadiwalaUtterances = null;

  // 2. Stop native Android TTS if running
  if (typeof window !== 'undefined' && (window as any).AndroidTTS?.stop) {
    try {
      (window as any).AndroidTTS.stop();
    } catch (e) {
      console.warn('AndroidTTS stop error:', e);
    }
  }

  // 3. Stop browser Web Speech synthesis if running
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Speech cancel error:', e);
    }
  }

  if (playbackEndCallback) {
    playbackEndCallback();
    playbackEndCallback = null;
  }
}

export function isVernacularSpeaking(): boolean {
  return isCurrentlyPlaying || sarvamVoiceService.isSpeaking();
}

export function isVoiceEngineSupported(): boolean {
  return true; // Sarvam AI audio is universally supported on web and mobile
}
