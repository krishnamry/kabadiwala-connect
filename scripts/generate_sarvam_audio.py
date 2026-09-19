#!/usr/bin/env python3
"""
Sarvam AI Vernacular Voice Asset Generator for Dhatu
This script delegates to the centralized Voice Script Management Framework under voice_scripts/.

SAFETY NOTICE:
Voice regeneration is LOCKED until the final stage when requested by user.
To run dry-run validation: python3 scripts/generate_sarvam_audio.py
To execute synthesis in final stage: python3 scripts/generate_sarvam_audio.py --confirm-final-stage
"""

import os
import sys
import subprocess

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REGENERATE_SCRIPT = os.path.join(BASE_DIR, "voice_scripts", "regenerate_voice.py")

def main():
    cmd = [sys.executable, REGENERATE_SCRIPT] + sys.argv[1:]
    res = subprocess.run(cmd)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
