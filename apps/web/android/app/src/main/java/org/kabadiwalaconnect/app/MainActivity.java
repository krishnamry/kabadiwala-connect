package org.kabadiwalaconnect.app;

import android.media.AudioAttributes;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;
import java.util.UUID;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "KabadiwalaTTS";
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private String pendingText = null;
    private String pendingLang = null;
    private float pendingRate = 1.0f;
    private float pendingPitch = 1.0f;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initNativeTTS();

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                webView.addJavascriptInterface(new AndroidTTSInterface(), "AndroidTTS");
                Log.d(TAG, "AndroidTTS JavascriptInterface successfully registered in WebView");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring WebView for AndroidTTS", e);
        }
    }

    private void initNativeTTS() {
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                ttsReady = true;
                Log.d(TAG, "Native Android TextToSpeech engine initialized successfully");

                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        AudioAttributes attributes = new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build();
                        tts.setAudioAttributes(attributes);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Could not set AudioAttributes: " + e.getMessage());
                }

                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {
                        notifyJs("window.__onAndroidTTSStart && window.__onAndroidTTSStart('" + utteranceId + "');");
                    }

                    @Override
                    public void onDone(String utteranceId) {
                        notifyJs("window.__onAndroidTTSEnd && window.__onAndroidTTSEnd('" + utteranceId + "');");
                    }

                    @Override
                    public void onError(String utteranceId) {
                        notifyJs("window.__onAndroidTTSError && window.__onAndroidTTSError('" + utteranceId + "');");
                    }
                });

                if (pendingText != null) {
                    final String textToSpeak = pendingText;
                    final String langToSpeak = pendingLang;
                    final float rateToSpeak = pendingRate;
                    final float pitchToSpeak = pendingPitch;
                    pendingText = null;
                    pendingLang = null;
                    speakInternal(textToSpeak, langToSpeak, rateToSpeak, pitchToSpeak);
                }
            } else {
                Log.e(TAG, "Native TextToSpeech engine init failed with status: " + status);
            }
        });
    }

    private void notifyJs(String script) {
        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(script, null);
                }
            } catch (Exception e) {
                Log.w(TAG, "Error delivering TTS callback to JS: " + e.getMessage());
            }
        });
    }

    private synchronized void speakInternal(String text, String lang, float rate, float pitch) {
        if (text == null || text.trim().isEmpty()) {
            return;
        }

        if (!ttsReady || tts == null) {
            Log.d(TAG, "TTS not ready yet, queuing speech request: " + text);
            pendingText = text;
            pendingLang = lang;
            pendingRate = rate;
            pendingPitch = pitch;
            return;
        }

        Locale targetLocale = getLocaleForLang(lang);
        int langResult = tts.setLanguage(targetLocale);
        if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
            Log.w(TAG, "Locale " + targetLocale + " not supported or missing data; trying fallback");
            if (lang != null && (lang.startsWith("mr") || lang.startsWith("hi"))) {
                int hiResult = tts.setLanguage(new Locale("hi", "IN"));
                if (hiResult == TextToSpeech.LANG_MISSING_DATA || hiResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setLanguage(new Locale("en", "IN"));
                }
            } else {
                tts.setLanguage(Locale.US);
            }
        }

        tts.setSpeechRate(rate > 0 ? rate : 1.0f);
        tts.setPitch(pitch > 0 ? pitch : 1.0f);

        String utteranceId = UUID.randomUUID().toString();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Bundle params = new Bundle();
            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
        } else {
            java.util.HashMap<String, String> params = new java.util.HashMap<>();
            params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
        }
        Log.d(TAG, "Speaking (" + lang + "): " + text);
    }

    private Locale getLocaleForLang(String lang) {
        if (lang == null) return new Locale("hi", "IN");
        String l = lang.toLowerCase().trim();
        if (l.startsWith("hi")) {
            return new Locale("hi", "IN");
        } else if (l.startsWith("mr")) {
            return new Locale("mr", "IN");
        } else {
            return new Locale("en", "IN");
        }
    }

    public class AndroidTTSInterface {
        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        @JavascriptInterface
        public boolean isReady() {
            return ttsReady;
        }

        @JavascriptInterface
        public void speak(String text, String lang, float rate, float pitch) {
            speakInternal(text, lang, rate, pitch);
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) {
                tts.stop();
            }
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        super.onDestroy();
    }
}
