#!/usr/bin/env python3
"""
Studio Neural Voiceover Generator for Project VerdantNANDA
Uses edge-tts with en-US-ChristopherNeural / en-US-AndrewMultilingualNeural
"""

import asyncio
import json
import os
import subprocess
import edge_tts

VOICE = "en-US-ChristopherNeural"
RATE = "+3%"

SEGMENTS = [
    {
        "id": "seg1",
        "title": "Scene 1: Hook & 3D Spatial Agentic Mesh",
        "subtitle": "VerdantNANDA: Zero-Trust 3D Spatial Agentic Web Mesh (MIT NANDA & MVP Spec v0.2)",
        "text": "Today's web is built for human clicks, not autonomous AI agents. Meet VerdantNANDA—a zero-trust, 3D spatial agentic web mesh compliant with Worldwide Agentic Web MVP Spec v0.2 and MIT NANDA discovery standards. Here, three independent web nodes—a Buyer Concierge Hub, PineRidge Eco-Stays, and EmeraldFjord Expeditions—discover, verify, and negotiate deals autonomously in real time."
    },
    {
        "id": "seg2",
        "title": "Scene 2: MIT NANDA Registry & Cryptographic Identity",
        "subtitle": "MIT NANDA Decentralized Registry & WebCrypto ECDSA-P256 Identity Attestation",
        "text": "Every node publishes canonical agent manifests indexed under the MIT NANDA registry protocol and ITU-T S17 decentralized identity standards. Using browser-native WebCrypto ECDSA-P256 signatures, each agent cryptographically proves its identity and action schemas before any cross-origin negotiation begins."
    },
    {
        "id": "seg3",
        "title": "Scene 3: Live Cross-Site AAOSA Negotiation & Deal Lock-In",
        "subtitle": "Live Cross-Site Negotiation: $605 ➔ $418 (Saved 30.9%) Locked with SHA-256 Attested Receipt",
        "text": "Now let's launch a live cross-site negotiation with a strict 420 dollar budget cap. Powered by Mozilla Otari and Nebius Token Factory, the Concierge agent coordinates multi-round AAOSA counter-offers across both partner sites simultaneously. Within seconds, total rack pricing drops from 605 dollars down to 418 dollars—saving 30.9 percent—and locks in a cryptographically attested SHA-256 booking receipt."
    },
    {
        "id": "seg4",
        "title": "Scene 4: 1-Line Agentify SDK & DOM Compiler",
        "subtitle": "1-Line Drop-in SDK & DOM Compiler: Turn Any HTML Webpage into an Agentic Web Node Instantly",
        "text": "To scale across the open web, any legacy HTML website can join the mesh using our 1-Line Agentify SDK. Dropping a single script tag automatically scans semantic DOM attributes and compiles compliant agent manifests on the fly."
    },
    {
        "id": "seg5",
        "title": "Scene 5: Zero-Leak Dual-Provider Gateway & Closing",
        "subtitle": "Zero-Leak Dual-Provider Gateway: Mozilla Hosted Otari & Nebius Token Factory",
        "text": "Finally, our dual-mode AI gateway ensures zero credential leakage—supporting both a rate-limited judge sandbox proxy and client-side BYOK across Mozilla Otari and Nebius Token Factory. VerdantNANDA turns isolated websites into a verifiable, autonomous economic web."
    }
]

def get_duration(file_path):
    cmd = [
        "ffmpeg", "-i", file_path
    ]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    # Search for Duration: 00:00:15.24
    for line in res.stderr.split("\n"):
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = parts.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 0.0

async def generate():
    os.makedirs("build-demo", exist_ok=True)
    results = []
    
    print(f"🎙️ Generating 5 Studio Neural Voiceovers with {VOICE} ({RATE})...")
    
    for i, seg in enumerate(SEGMENTS):
        mp3_path = os.path.join("build-demo", f"{seg['id']}.mp3")
        communicate = edge_tts.Communicate(seg["text"], VOICE, rate=RATE)
        await communicate.save(mp3_path)
        
        duration = get_duration(mp3_path)
        print(f"  [{i+1}/5] {seg['id']}.mp3 generated: {duration:.2f}s - \"{seg['subtitle']}\"")
        
        results.append({
            "id": seg["id"],
            "title": seg["title"],
            "subtitle": seg["subtitle"],
            "text": seg["text"],
            "audioPath": mp3_path,
            "duration": duration,
            "durationMs": int(duration * 1000)
        })
    
    # Concatenate all into master audio
    concat_list = os.path.join("build-demo", "concat_list.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for r in results:
            # Escape path for ffmpeg concat
            norm_path = r["audioPath"].replace("\\", "/")
            f.write(f"file '{norm_path}'\n")
            
    master_audio = os.path.join("build-demo", "voiceover_master.mp3")
    concat_cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c", "copy", master_audio
    ]
    subprocess.run(concat_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    total_duration = get_duration(master_audio)
    print(f"\n Master Voiceover Track Assembled: {master_audio} ({total_duration:.2f}s total)")
    
    manifest = {
        "voice": VOICE,
        "rate": RATE,
        "totalDuration": total_duration,
        "totalDurationMs": int(total_duration * 1000),
        "segments": results
    }
    
    manifest_path = os.path.join("build-demo", "voiceover_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    print(f"✨ Manifest saved to {manifest_path}")

if __name__ == "__main__":
    asyncio.run(generate())
