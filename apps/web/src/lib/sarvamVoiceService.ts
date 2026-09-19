/**
 * Sarvam AI Vernacular Voice Service for Dhatu
 * Powered by Sarvam AI bulbul:v3 API
 * 
 * Features:
 * 1. Tier-1: Instant 0ms playback for pre-generated offline catalog assets (/audio/sarvam/{lang}/{key}.wav)
 * 2. Tier-2: Zero-cost IndexedDB caching for dynamic strings (no phrase synthesized twice)
 * 3. Tier-3: Online dynamic fallback to Sarvam AI REST API
 * 4. Tier-4: Graceful offline fallback to native AndroidTTS / Web Speech API
 * 5. Single-track playback with instant interruptibility (tap-to-mute)
 */

import { getSarvamStaticAudioUrl } from './sarvamAudioCatalog';

export interface SarvamPlayOptions {
  audioKey?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  rate?: number;
}

const DB_NAME = 'dhatu_sarvam_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'cached_audios';
const SARVAM_API_KEY = 'sk_me3cv0xh_9jf4NFlAgKGzEeEUUFvATtjB';
const SARVAM_API_URL = 'https://api.sarvam.ai/text-to-speech';

// Critical Policy Lock: Voice regeneration & dynamic API synthesis is LOCKED until final stage.
// Prevents accidental API quota consumption during development and feature improvisations.
const ENABLE_DYNAMIC_SARVAM_FETCH = false;

class SarvamVoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private stopCallbacks: Array<() => void> = [];

  constructor() {
    this.initDB();
  }

  /**
   * Initialize lightweight IndexedDB for local audio storage
   */
  private initDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
          }
        };
        req.onsuccess = (e: any) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Fast string hash for IndexedDB cache keys
   */
  private computeHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
  }

  /**
   * Retrieve cached base64 audio from IndexedDB
   */
  private async getCachedAudio(cacheKey: string): Promise<string | null> {
    const db = await this.initDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(cacheKey);
        req.onsuccess = () => {
          if (req.result && req.result.audioData) {
            resolve(req.result.audioData);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Store synthesized base64 audio into IndexedDB
   */
  private async saveCachedAudio(cacheKey: string, audioData: string): Promise<void> {
    const db = await this.initDB();
    if (!db) return;

    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ hash: cacheKey, audioData, timestamp: Date.now() });
    } catch (e) {
      console.warn('[SarvamVoice] Failed to cache audio in IndexedDB:', e);
    }
  }

  /**
   * Call Sarvam AI REST API for dynamic uncached text
   */
  private async fetchSarvamAudio(text: string, lang: string): Promise<string | null> {
    if (!ENABLE_DYNAMIC_SARVAM_FETCH) {
      // Audio generation is locked until final stage; fallback gracefully to device/native speech
      return null;
    }

    const langCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';

    try {
      const resp = await fetch(SARVAM_API_URL, {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: langCode,
          speaker: 'aditya',
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          speech_sample_rate: 22050,
          enable_preprocessing: true,
          model: 'bulbul:v3'
        })
      });

      if (!resp.ok) {
        console.warn('[SarvamVoice] API returned HTTP', resp.status);
        return null;
      }

      const data = await resp.json();
      if (data && data.audios && data.audios.length > 0) {
        return 'data:audio/wav;base64,' + data.audios[0];
      }
      return null;
    } catch (err) {
      console.warn('[SarvamVoice] API fetch error:', err);
      return null;
    }
  }

  /**
   * Stop any currently playing audio immediately (Tap-to-Mute)
   */
  public stopAudio(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }

    this.isPlaying = false;
    // Notify all listeners
    this.stopCallbacks.forEach(cb => {
      try { cb(); } catch {}
    });
    this.stopCallbacks = [];
  }

  /**
   * Is speech currently active?
   */
  public isSpeaking(): boolean {
    return this.isPlaying;
  }

  /**
   * Main playback function:
   * 1. Resolves static catalog asset if key exists
   * 2. Otherwise checks IndexedDB cache
   * 3. Otherwise calls Sarvam AI API and caches
   * 4. Plays audio and fires callbacks
   */
  public async play(
    textOrKey: string,
    lang: 'hi' | 'mr' | 'en' = 'hi',
    options?: SarvamPlayOptions
  ): Promise<boolean> {
    // 1. Stop any current speech
    this.stopAudio();

    // Check if an explicit audioKey was provided or textOrKey matches a catalog key
    const targetKey = options?.audioKey || textOrKey;
    if (!targetKey || !targetKey.trim()) {
      options?.onEnd?.();
      return false;
    }

    // Register callback
    if (options?.onEnd) {
      this.stopCallbacks.push(options.onEnd);
    }

    let audioSrc: string | null = null;
    const staticUrl = getSarvamStaticAudioUrl(targetKey, lang);

    if (staticUrl) {
      // Tier 1: Static Pre-generated Offline Asset
      audioSrc = staticUrl;
    } else {
      // Tier 2: Check IndexedDB Cache for dynamic text
      const cacheKey = `${lang}_${this.computeHash(textOrKey)}`;
      const cached = await this.getCachedAudio(cacheKey);

      if (cached) {
        audioSrc = cached;
      } else {
        // Tier 3: Fetch from Sarvam AI API & save into cache
        const freshAudio = await this.fetchSarvamAudio(textOrKey, lang);
        if (freshAudio) {
          audioSrc = freshAudio;
          // Asynchronously save to IndexedDB cache
          this.saveCachedAudio(cacheKey, freshAudio);
        }
      }
    }

    // Play resolved audio
    if (audioSrc && typeof window !== 'undefined') {
      try {
        const audio = new Audio(audioSrc);
        this.currentAudio = audio;
        this.isPlaying = true;
        options?.onStart?.();

        audio.onended = () => {
          this.isPlaying = false;
          this.currentAudio = null;
          options?.onEnd?.();
        };

        audio.onerror = (e) => {
          console.warn('[SarvamVoice] Playback error on source:', audioSrc, e);
          this.isPlaying = false;
          this.currentAudio = null;
          options?.onError?.(e);
        };

        await audio.play();
        return true;
      } catch (playErr) {
        console.warn('[SarvamVoice] Audio play() failed:', playErr);
        this.isPlaying = false;
        this.currentAudio = null;
        options?.onError?.(playErr);
        return false;
      }
    }

    // Return false if Sarvam AI audio could not be resolved (caller can fallback to Native/Web speech)
    return false;
  }
}

export const sarvamVoiceService = new SarvamVoiceService();
