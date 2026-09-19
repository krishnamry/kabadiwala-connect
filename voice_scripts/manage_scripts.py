#!/usr/bin/env python3
"""
Voice Script Manager & Compiler for Dhatu
Organizes, validates, compiles, and audits vernacular voice scripts across Hindi, Marathi, and English.
Part of the Voice Script Management Framework.
"""

import os
import sys
import json
import glob
import argparse

VOICE_SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(VOICE_SCRIPTS_DIR, ".."))
MASTER_JSON_PATH = os.path.join(VOICE_SCRIPTS_DIR, "master_voice_scripts.json")
CATALOG_TS_FILE = os.path.join(BASE_DIR, "apps", "web", "src", "lib", "sarvamAudioCatalog.ts")
AUDIO_WEB_DIR = os.path.join(BASE_DIR, "apps", "web", "public", "audio", "sarvam")
SUPPORTED_LANGUAGES = ["hi", "mr", "en"]

def find_modular_script_files():
    pattern = os.path.join(VOICE_SCRIPTS_DIR, "*_scripts.json")
    files = glob.glob(pattern)
    return [f for f in files if os.path.basename(f) != "master_voice_scripts.json"]

def load_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

def compile_scripts():
    print("=" * 60)
    print("Compiling Master Voice Scripts Catalog")
    print("=" * 60)

    files = find_modular_script_files()
    if not files:
        print("❌ No modular script files (*_scripts.json) found.")
        return False

    master_catalog = {}
    seen_keys = {}
    errors = []

    for filepath in sorted(files):
        filename = os.path.basename(filepath)
        try:
            data = load_json(filepath)
        except Exception as e:
            errors.append(f"JSON syntax error in {filename}: {e}")
            continue

        for key, entry in data.items():
            if key in seen_keys:
                errors.append(f"Duplicate key '{key}' found in '{filename}' (already defined in '{seen_keys[key]}')")
                continue
            seen_keys[key] = filename

            # Validation
            missing_langs = [lang for lang in SUPPORTED_LANGUAGES if not entry.get(lang) or not entry[lang].strip()]
            if missing_langs:
                errors.append(f"Key '{key}' in '{filename}' is missing language(s): {', '.join(missing_langs)}")

            master_catalog[key] = {
                "source_file": filename,
                "description": entry.get("description", ""),
                "hi": entry.get("hi", "").strip(),
                "mr": entry.get("mr", "").strip(),
                "en": entry.get("en", "").strip()
            }

    if errors:
        print("❌ Compilation encountered errors:")
        for err in errors:
            print(f"  • {err}")
        return False

    save_json(MASTER_JSON_PATH, master_catalog)
    print(f"✅ Successfully compiled {len(master_catalog)} voice scripts from {len(files)} modular files into:")
    print(f"   {MASTER_JSON_PATH}")

    sync_audio_catalog(master_catalog)
    return True

def sync_audio_catalog(master_catalog):
    """
    Synchronizes apps/web/src/lib/sarvamAudioCatalog.ts with all keys in master_catalog.
    Checks whether audio files exist in apps/web/public/audio/sarvam/{lang}/{key}.wav.
    Sets available: True if file exists and size > 1000, else False.
    """
    catalog = {}
    cached_clips = 0
    pending_clips = 0

    for key, item in sorted(master_catalog.items()):
        catalog[key] = {}
        for lang in SUPPORTED_LANGUAGES:
            target_file = os.path.join(AUDIO_WEB_DIR, lang, f"{key}.wav")
            is_avail = os.path.exists(target_file) and os.path.getsize(target_file) > 1000
            if is_avail:
                cached_clips += 1
            else:
                pending_clips += 1
            catalog[key][lang] = {
                "url": f"/audio/sarvam/{lang}/{key}.wav",
                "text": item.get(lang, ""),
                "available": is_avail
            }

    types_list = "\n".join(f'  | "{k}"' for k in sorted(master_catalog.keys()))
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

    print(f"✅ Synchronized TypeScript catalog at: {CATALOG_TS_FILE}")
    print(f"   • Registered Keys      : {len(master_catalog)}")
    print(f"   • Existing Cached WAVs : {cached_clips}")
    print(f"   • Pending Final Stage  : {pending_clips}")

def validate_scripts():
    print("=" * 60)
    print("Validating Voice Scripts Syntax and Language Completeness")
    print("=" * 60)

    files = find_modular_script_files()
    total_keys = 0
    all_valid = True

    for filepath in sorted(files):
        filename = os.path.basename(filepath)
        try:
            data = load_json(filepath)
        except Exception as e:
            print(f"❌ {filename}: JSON Parse Error -> {e}")
            all_valid = False
            continue

        file_keys = len(data)
        total_keys += file_keys
        missing_count = 0

        for key, entry in data.items():
            for lang in SUPPORTED_LANGUAGES:
                if not entry.get(lang) or not str(entry[lang]).strip():
                    print(f"  ⚠️  [{filename}] Key '{key}' missing '{lang}' text")
                    missing_count += 1

        if missing_count == 0:
            print(f"✅ {filename:30s} : {file_keys:2d} keys (100% complete across hi, mr, en)")
        else:
            all_valid = False

    print("-" * 60)
    if all_valid:
        print(f"🎉 All {total_keys} voice script keys are valid with complete tri-lingual coverage.")
    else:
        print("⚠️  Some voice script keys have missing languages or errors.")
    return all_valid

def print_stats():
    print("=" * 60)
    print("Dhatu Voice Scripts Inventory & Word Counts")
    print("=" * 60)

    files = find_modular_script_files()
    grand_total_keys = 0
    grand_words = {"hi": 0, "mr": 0, "en": 0}

    print(f"{'Module File':32s} | {'Keys':4s} | {'Hindi Words':11s} | {'Marathi Words':13s} | {'English Words':13s}")
    print("-" * 85)

    for filepath in sorted(files):
        filename = os.path.basename(filepath)
        data = load_json(filepath)
        key_count = len(data)
        grand_total_keys += key_count

        words = {
            "hi": sum(len(e.get("hi", "").split()) for e in data.values()),
            "mr": sum(len(e.get("mr", "").split()) for e in data.values()),
            "en": sum(len(e.get("en", "").split()) for e in data.values())
        }

        for lang in SUPPORTED_LANGUAGES:
            grand_words[lang] += words[lang]

        print(f"{filename:32s} | {key_count:4d} | {words['hi']:11d} | {words['mr']:13d} | {words['en']:13d}")

    print("-" * 85)
    print(f"{'TOTALS':32s} | {grand_total_keys:4d} | {grand_words['hi']:11d} | {grand_words['mr']:13d} | {grand_words['en']:13d}")
    print("=" * 85)

def main():
    parser = argparse.ArgumentParser(description="Dhatu Voice Script Manager & Compiler")
    parser.add_argument("--compile", action="store_true", help="Compile modular scripts into master_voice_scripts.json")
    parser.add_argument("--validate", action="store_true", help="Validate all script files for syntax & completeness")
    parser.add_argument("--stats", action="store_true", help="Print script statistics and word counts")

    args = parser.parse_args()

    if not (args.compile or args.validate or args.stats):
        # Default behavior: compile, validate, and show stats
        compile_scripts()
        validate_scripts()
        print_stats()
        return

    if args.compile:
        compile_scripts()
    if args.validate:
        validate_scripts()
    if args.stats:
        print_stats()

if __name__ == "__main__":
    main()
