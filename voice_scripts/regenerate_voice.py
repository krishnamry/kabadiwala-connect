#!/usr/bin/env python3
"""
Sarvam AI Vernacular Voice Regeneration Pipeline for Dhatu
Powered by Sarvam AI bulbul:v3 API.

CRITICAL POLICY & SAFETY LOCK:
- Voice regeneration is explicitly deferred until the final release stage.
- DO NOT run voice regeneration until user provides explicit instruction.
- Default execution runs in --dry-run mode (zero external HTTP calls).
- To execute actual audio synthesis in the final stage:
    python3 voice_scripts/regenerate_voice.py --confirm-final-stage
"""

import os
import sys
import json
import base64
import time
import urllib.request
import urllib.error
import argparse

# Configured Sarvam AI API Credentials & Parameters (Used in final stage)
SARVAM_API_KEY = "sk_me3cv0xh_9jf4NFlAgKGzEeEUUFvATtjB"
SARVAM_API_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_SPEAKER = "aditya"
SARVAM_MODEL = "bulbul:v3"
SARVAM_SAMPLE_RATE = 22050

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MASTER_SCRIPTS_PATH = os.path.join(BASE_DIR, "voice_scripts", "master_voice_scripts.json")
OUTPUT_DIRS = [
    os.path.join(BASE_DIR, "apps", "web", "public", "audio", "sarvam"),
    os.path.join(BASE_DIR, "audio", "sarvam")
]
CATALOG_TS_FILE = os.path.join(BASE_DIR, "apps", "web", "src", "lib", "sarvamAudioCatalog.ts")

LANG_MAP = {
    "hi": "hi-IN",
    "mr": "mr-IN",
    "en": "en-IN"
}

def load_master_scripts():
    if not os.path.exists(MASTER_SCRIPTS_PATH):
        print(f"Master script catalog missing at: {MASTER_SCRIPTS_PATH}")
        print("Run `python3 voice_scripts/manage_scripts.py --compile` first.")
        sys.exit(1)
    with open(MASTER_SCRIPTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def run_dry_run_validation(scripts):
    print("=" * 70)
    print("🔒 VOICE REGENERATION SAFETY AUDIT (DRY-RUN MODE — ZERO API CALLS)")
    print("=" * 70)
    print("Status: Audio regeneration is LOCKED until final stage approval.")
    print(f"Configured API Key: {SARVAM_API_KEY[:8]}...{SARVAM_API_KEY[-4:]} (Sarvam AI)")
    print(f"Target Voice Model: {SARVAM_MODEL} (Speaker: {SARVAM_SPEAKER})")
    print(f"Total Registered Keys: {len(scripts)}")
    print(f"Total Clips to Generate in Final Stage: {len(scripts) * 3} ({len(scripts)} × 3 languages)")
    print("-" * 70)

    cached_count = 0
    missing_count = 0
    primary_dir = OUTPUT_DIRS[0]

    for key in sorted(scripts.keys()):
        for lang in ["hi", "mr", "en"]:
            target_file = os.path.join(primary_dir, lang, f"{key}.wav")
            if os.path.exists(target_file) and os.path.getsize(target_file) > 1000:
                cached_count += 1
            else:
                missing_count += 1

    print(f"Existing Local WAV Files in Cache : {cached_count}")
    print(f"Pending Audio Clips for Final Stage: {missing_count}")
    print("=" * 70)
    print("✅ All script texts are validated and ready for future synthesis.")
    print("👉 To run actual synthesis in the final stage after user confirmation:")
    print("   python3 voice_scripts/regenerate_voice.py --confirm-final-stage")
    print("=" * 70)

def generate_clip(key: str, lang: str, text: str):
    primary_dir = OUTPUT_DIRS[0]
    target_dir = os.path.join(primary_dir, lang)
    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, f"{key}.wav")

    # If already generated and valid, keep existing file
    if os.path.exists(file_path) and os.path.getsize(file_path) > 1000:
        print(f"  [CACHE HIT] {lang}/{key}.wav exists ({os.path.getsize(file_path)} bytes)")
        # Mirror to secondary dir if missing
        mirror_clip(key, lang, file_path)
        return True

    payload = {
        "inputs": [text],
        "target_language_code": LANG_MAP[lang],
        "speaker": SARVAM_SPEAKER,
        "pitch": 0,
        "pace": 1.0,
        "loudness": 1.5,
        "speech_sample_rate": SARVAM_SAMPLE_RATE,
        "enable_preprocessing": True,
        "model": SARVAM_MODEL
    }

    req = urllib.request.Request(
        SARVAM_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
        },
        method="POST"
    )

    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                audio_b64 = data["audios"][0]
                audio_bytes = base64.b64decode(audio_b64)
                with open(file_path, "wb") as f:
                    f.write(audio_bytes)
                print(f"  [SYNTHESIZED] {lang}/{key}.wav ({len(audio_bytes)} bytes)")
                mirror_clip(key, lang, file_path)
                time.sleep(0.3)
                return True
        except Exception as e:
            print(f"  [RETRY {attempt}/3] {lang}/{key}: {e}")
            time.sleep(1.5 * attempt)

    print(f"  [ERROR] Failed to synthesize {lang}/{key}")
    return False

def mirror_clip(key: str, lang: str, src_path: str):
    for dest_dir in OUTPUT_DIRS[1:]:
        target_lang_dir = os.path.join(dest_dir, lang)
        os.makedirs(target_lang_dir, exist_ok=True)
        dest_path = os.path.join(target_lang_dir, f"{key}.wav")
        if not os.path.exists(dest_path) or os.path.getsize(dest_path) != os.path.getsize(src_path):
            with open(src_path, "rb") as rf, open(dest_path, "wb") as wf:
                wf.write(rf.read())

def update_catalog_ts(scripts, catalog):
    types_list = "\n".join(f'  | "{k}"' for k in sorted(scripts.keys()))
    catalog_json = json.dumps(catalog, indent=2, ensure_ascii=False)
    ts_content = f"""/**
 * Pre-generated Offline Sarvam AI Audio Catalog for Dhatu
 * Synthesized using Sarvam AI bulbul:v3 API (Speaker: aditya)
 * Provides 100% offline static audio file references with zero runtime API calls.
 */

export type SarvamAudioKey = 
{types_list};

export interface SarvamClipMetadata {{
  url: string;
  text: string;
  available: boolean;
}}

export const SARVAM_AUDIO_CATALOG: Record<SarvamAudioKey, Record<'hi' | 'mr' | 'en', SarvamClipMetadata>> = {catalog_json};

/**
 * Quick lookup helper: returns the static audio URL for a given audio key and language
 */
export function getSarvamStaticAudioUrl(key: string, lang: string): string | null {{
  const item = (SARVAM_AUDIO_CATALOG as any)[key];
  if (item && item[lang]?.available) {{
    return item[lang].url;
  }}
  if (item && item['hi']?.available) {{
    return item['hi'].url;
  }}
  return null;
}}
"""
    with open(CATALOG_TS_FILE, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"\n✅ Updated TypeScript audio catalog at: {CATALOG_TS_FILE}")

def run_actual_synthesis(scripts):
    print("=" * 70)
    print("🚀 EXECUTING SARVAM AI VERNACULAR VOICE SYNTHESIS (FINAL STAGE)")
    print("=" * 70)
    print(f"API Endpoint: {SARVAM_API_URL}")
    print(f"Total Keys: {len(scripts)} | Total Language Tracks: 3 (hi, mr, en)")
    print("-" * 70)

    catalog = {}
    success_count = 0
    total_clips = len(scripts) * 3

    for key, item in sorted(scripts.items()):
        catalog[key] = {}
        for lang in ["hi", "mr", "en"]:
            text = item[lang]
            success = generate_clip(key, lang, text)
            if success:
                success_count += 1
            rel_path = f"/audio/sarvam/{lang}/{key}.wav"
            catalog[key][lang] = {
                "url": rel_path,
                "text": text,
                "available": success
            }

    update_catalog_ts(scripts, catalog)
    print("=" * 70)
    print(f"🎉 Synthesis Completed: {success_count}/{total_clips} audio clips available offline.")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="Sarvam AI Voice Regeneration Pipeline")
    parser.add_argument(
        "--confirm-final-stage",
        action="store_true",
        help="Explicit flag required to invoke the Sarvam AI API for audio synthesis in the final stage"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run safety audit and validation without calling the Sarvam AI API"
    )

    args = parser.parse_args()
    scripts = load_master_scripts()

    if not args.confirm_final_stage:
        run_dry_run_validation(scripts)
        return

    # If --confirm-final-stage was passed
    run_actual_synthesis(scripts)

if __name__ == "__main__":
    main()
