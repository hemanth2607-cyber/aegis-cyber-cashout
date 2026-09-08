# Aegis-Cyber // 100% Completely Free Deployment Guide
**Zero Cost ($0.00) • Zero Credit Cards Required • 100% Free Forever**

If you do not want to use AWS or pay for cloud infrastructure, this guide details three completely free alternatives to host Aegis live on the internet.

---

## Quick Comparison of Free Options

| Method | Best For | Cost | Credit Card Needed? | Setup Time |
|---|---|---|---|---|
| **Option 1: Vercel + Render** | **Permanent Cloud Hosting** (Recommended) | **$0 / month** | **NO** | ~3 minutes |
| **Option 2: Cloudflare Tunnel** | **Instant Live Demo** (Share local app with judges) | **$0 / month** | **NO (No account needed!)** | **5 seconds** |
| **Option 3: Hugging Face Spaces** | High-RAM ML Hosting (16 GB Free RAM) | **$0 / month** | **NO** | ~4 minutes |

---

## 🚀 Option 1: Permanent Free Cloud (Vercel + Render)

This is the standard, most popular production stack for modern web applications. Both services have genuine free tiers that never charge your bank.

### Part A: Deploy Frontend to Vercel (100% Free)
1. Go to [https://vercel.com/signup](https://vercel.com/signup) and log in with your **GitHub** account.
2. Click **Add New... ➔ Project**.
3. Select your repository: `hemanth2607-cyber/aegis-cyber-cashout`.
4. Under **Root Directory**, click *Edit* and select the **`frontend`** directory.
5. (Optional) Under *Environment Variables*, add:
   * `NEXT_PUBLIC_API_BASE`: `https://your-backend.onrender.com/api/v1`
   * `NEXT_PUBLIC_WS_URL`: `wss://your-backend.onrender.com/ws/alerts`
6. Click **Deploy**.
7. In **60 seconds**, Vercel generates your live URL: `https://aegis-cyber-cashout.vercel.app`.

---

### Part B: Deploy Backend to Render.com (100% Free)
We have already added a [`render.yaml`](file:///c:/Users/heman/Desktop/Projects/pervekkala/render.yaml) Blueprint to the repository.

1. Go to [https://render.com](https://render.com) and sign up with your **GitHub** account (no credit card required).
2. Click **New +** (top right) ➔ **Blueprint**.
3. Connect your repository: `hemanth2607-cyber/aegis-cyber-cashout`.
4. Render will automatically detect [`render.yaml`](file:///c:/Users/heman/Desktop/Projects/pervekkala/render.yaml) and configure the Python FastAPI backend service (`aegis-backend`).
5. Click **Apply**.
6. Render builds the environment using Python 3.11 and launches your FastAPI server with free SSL: `https://aegis-backend.onrender.com`.

---

## ⚡ Option 2: Instant Public URL in 5 Seconds (Cloudflare Tunnel)

If you already have Aegis running on your computer and want to give a judge, mentor, or evaluator a **live public HTTPS URL right now**:

1. Open a terminal or double-click:
   ```bash
   python scripts/start_free_tunnel.py
   ```
   *(or double-click [`scripts/start_free_tunnel.bat`](file:///c:/Users/heman/Desktop/Projects/pervekkala/scripts/start_free_tunnel.bat) on Windows).*

2. It will automatically download Cloudflare's free tunnel and output:
   ```text
   ====================================================================
   🎉  YOUR 100% FREE PUBLIC LIVE URL IS READY!
   ====================================================================
   👉  Interactive Simulation: https://xxxx-xxxx-xxxx.trycloudflare.com/simulation
   👉  Tactical Command Center: https://xxxx-xxxx-xxxx.trycloudflare.com/dashboard
   ====================================================================
   ```
3. Anyone on a phone, tablet, or laptop anywhere in the world can open that link and test your application live!
4. **Zero accounts, zero signups, zero credit cards, 100% free.**

---

## 🤗 Option 3: Hugging Face Spaces (Free 16 GB RAM for ML Models)

If you want a free cloud server with **16 GB of RAM** (more memory than AWS free tier) to run heavy Python machine learning pipelines:

1. Go to [https://huggingface.co/spaces](https://huggingface.co/spaces) and create a free account.
2. Click **Create new Space**.
3. **Space SDK**: Select **Docker** (Blank).
4. **Space hardware**: Select **CPU basic • 2 vCPU • 16GB RAM • Free**.
5. Connect your GitHub repository or push the code.
6. Hugging Face builds [`deploy/Dockerfile.backend`](file:///c:/Users/heman/Desktop/Projects/pervekkala/deploy/Dockerfile.backend) and provides a permanent free public endpoint: `https://<username>-aegis-backend.hf.space`.

---

## 💡 Summary Recommendation

- **For Permanent Hackathon Submission**: Deploy the frontend on **Vercel** (`https://*.vercel.app`) and the backend on **Render** (`https://*.onrender.com`).
- **For Quick Live Evaluation Today**: Double-click [`scripts/start_free_tunnel.bat`](file:///c:/Users/heman/Desktop/Projects/pervekkala/scripts/start_free_tunnel.bat) to get an instant public HTTPS link in 5 seconds.
