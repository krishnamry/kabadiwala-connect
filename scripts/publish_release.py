#!/usr/bin/env python3
import os
import sys
import subprocess
import requests

def get_token():
    cmd = "printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | grep '^password=' | cut -d= -f2"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
    return result.stdout.strip()

def main():
    token = get_token()
    if not token:
        print("Error: Could not retrieve GitHub token from git credentials.")
        sys.exit(1)
        
    repo = "krishnamry/kabadiwala-connect"
    tag = "v1.0.7"
    release_name = "Kabadiwala Connect v1.0.7 — Sarvam AI Voice, Tri-Lingual Audio, Mobile Chats & KYC Flow"
    
    body = """# 📥 [👉 Click Here to Download KabadiwalaConnect-v1.0.7.apk (51.9 MB)](https://github.com/krishnamry/kabadiwala-connect/releases/download/v1.0.7/KabadiwalaConnect-v1.0.7.apk)

---

## What's Changed in v1.0.7

### 🎙️ Sarvam AI Tri-Lingual Audio Integration
- **Pre-Rendered Offline Audio Packs**: Crystal-clear authentic spoken guidance in **Hindi (hi)**, **Marathi (mr)**, and **English (en)** for every collector workflow (daily overview, bidding room, mandi rates, pickup OTP, KYC, lot creation).
- **Material 3 Collapsible Voice Co-Pilot**: Interactive contextual voice bar that guides informal scrap collectors step-by-step through lot creation, weight calibration, and photo verification.
- **Dedicated Voice Scripts Management**: Full `voice_scripts/` suite with trilingual dictionaries, validation CLI, and automated regeneration engine.
- **Hybrid Voice Engine**: Instant local wav playback with seamless fallback to Android Native TTS bridge when offline.

### 💬 Dedicated Mobile Portrait Navigation Pages
- **Contextual Lots & Pickups Chats (`/chats`)**: Full-screen mobile layout with clean back navigation, quick chips, and direct partner coordination.
- **Unified Notifications Center (`/notifications`)**: Dedicated mobile alert inbox with category filters and action triggers.

### 📋 KYC Re-Application & Collector Onboarding
- **Self-Service Re-Application**: Collectors can re-submit documents and selfies after rejection directly from their dashboard.
- **Live Regulatory Status Banner**: Real-time status indicators (Verified, Pending, Rejected) with instant feedback.

### 📦 Android Release Package
- **Version Code**: `7`
- **Version Name**: `1.0.7`
- **Direct Downloads**:
  - [KabadiwalaConnect-v1.0.7.apk (51.9 MB)](https://github.com/krishnamry/kabadiwala-connect/releases/download/v1.0.7/KabadiwalaConnect-v1.0.7.apk)
  - [KabadiwalaConnect.apk (Latest Pointer)](https://github.com/krishnamry/kabadiwala-connect/releases/download/v1.0.7/KabadiwalaConnect.apk)
- **SHA-256 Checksum**:
  `e7425215b7627d6b3a7857bec985d84dc3200becbd7ed37a5cbff4b703b3c510`
"""

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "KabadiwalaConnect-Release-Agent"
    }

    print(f"Creating GitHub Release for {tag} on {repo}...")
    release_url = f"https://api.github.com/repos/{repo}/releases"
    payload = {
        "tag_name": tag,
        "target_commitish": "master",
        "name": release_name,
        "body": body,
        "draft": False,
        "prerelease": False
    }

    # Check if already exists
    check_res = requests.get(f"{release_url}/tags/{tag}", headers=headers)
    if check_res.status_code == 200:
        release_data = check_res.json()
        print(f"Release {tag} already exists with ID {release_data['id']}.")
    else:
        create_res = requests.post(release_url, headers=headers, json=payload)
        if create_res.status_code not in (200, 201):
            print(f"Failed to create release: {create_res.status_code} - {create_res.text}")
            sys.exit(1)
        release_data = create_res.json()
        print(f"Successfully created release {tag}! ID: {release_data['id']}")

    release_id = release_data["id"]
    html_url = release_data.get("html_url")
    print(f"Release URL: {html_url}")

    # Files to upload
    files_to_upload = [
        ("releases/KabadiwalaConnect-v1.0.7.apk", "KabadiwalaConnect-v1.0.7.apk"),
        ("releases/KabadiwalaConnect.apk", "KabadiwalaConnect.apk")
    ]

    existing_assets = {a["name"]: a["id"] for a in release_data.get("assets", [])}

    for file_path, asset_name in files_to_upload:
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} does not exist, skipping.")
            continue

        if asset_name in existing_assets:
            print(f"Deleting existing asset {asset_name} (ID: {existing_assets[asset_name]})...")
            del_url = f"https://api.github.com/repos/{repo}/releases/assets/{existing_assets[asset_name]}"
            requests.delete(del_url, headers=headers)

        print(f"Uploading {asset_name} ({os.path.getsize(file_path) / (1024*1024):.2f} MB)...")
        upload_url = f"https://uploads.github.com/repos/{repo}/releases/{release_id}/assets?name={asset_name}"
        upload_headers = {
            "Authorization": f"token {token}",
            "Content-Type": "application/vnd.android.package-archive",
            "User-Agent": "KabadiwalaConnect-Release-Agent"
        }
        with open(file_path, "rb") as f:
            upload_res = requests.post(upload_url, headers=upload_headers, data=f)
            if upload_res.status_code not in (200, 201):
                print(f"Failed to upload {asset_name}: {upload_res.status_code} - {upload_res.text}")
            else:
                print(f"Uploaded {asset_name} successfully!")

    print("\n🎉 Done! Release is live at:", html_url)

if __name__ == "__main__":
    main()
