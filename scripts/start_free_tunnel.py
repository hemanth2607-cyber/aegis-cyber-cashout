#!/usr/bin/env python3
"""
Aegis-Cyber // Instant Free Public Tunnel using Cloudflare Quick Tunnels
100% Free Forever • Zero Accounts • Zero Credit Card • Instant HTTPS URL
"""
import os
import sys
import urllib.request
import subprocess
import shutil
import re

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

CLOUDFLARED_URL_WINDOWS = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
LOCAL_BIN_DIR = os.path.join(os.path.dirname(__file__), "bin")
CLOUDFLARED_EXE = os.path.join(LOCAL_BIN_DIR, "cloudflared.exe")

def ensure_cloudflared():
    existing = shutil.which("cloudflared")
    if existing:
        return existing

    if os.path.exists(CLOUDFLARED_EXE):
        return CLOUDFLARED_EXE

    os.makedirs(LOCAL_BIN_DIR, exist_ok=True)
    print("[-] Downloading Cloudflare standalone tunnel tool (free, no account needed)...")
    urllib.request.urlretrieve(CLOUDFLARED_URL_WINDOWS, CLOUDFLARED_EXE)
    print("[+] Download complete!")
    return CLOUDFLARED_EXE

def main():
    print("====================================================================")
    print("[*] AEGIS-CYBER // INSTANT 100% FREE PUBLIC TUNNEL (ZERO COST)")
    print("====================================================================")
    print("Starting secure tunnel to local Aegis Console (http://localhost:3000)...")
    print("No credit card required. No Cloudflare account required.")
    print("====================================================================\n")

    bin_path = ensure_cloudflared()

    cmd = [bin_path, "tunnel", "--url", "http://localhost:3000"]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True,
        encoding="utf-8",
        errors="replace"
    )

    url_found = False
    for line in iter(proc.stdout.readline, ""):
        match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
        if match and not url_found:
            url_found = True
            public_url = match.group(0)
            print("\n" + "=" * 68)
            print("[+] YOUR 100% FREE PUBLIC LIVE URL IS READY!")
            print("=" * 68)
            print(f"--> Interactive Simulation: {public_url}/simulation")
            print(f"--> Tactical Command Center: {public_url}/dashboard")
            print("=" * 68)
            print("Share this link with anyone or judges worldwide to test live!\n")
            print("Press Ctrl+C at any time to stop the tunnel.\n")
        else:
            if not url_found:
                sys.stdout.write(".")
                sys.stdout.flush()

    proc.wait()

if __name__ == "__main__":
    main()
