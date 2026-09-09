# Safe & Free Deployment Guide — Kabadiwala Connect (धातु)

This guide provides the **most reliable, 100% free forever, and security-hardened** methods to deploy the **Kabadiwala Connect Web Application**, the **Mobile App (PWA / Android APK)**, and the **Backend API & Database**.

---

## Architecture & Free Tier Stack

| Component | Recommended Free Provider | Free Tier Allowance | Security & Safety |
| :--- | :--- | :--- | :--- |
| **Frontend Web & PWA** | **Vercel** / **Cloudflare Pages** | 100% Free Forever, Unlimited Bandwidth | Automatic Free SSL (HTTPS), DDoS Shield, Edge CDN |
| **Mobile App (Android/iOS)** | **Progressive Web App (PWA)** / **PWABuilder** | 100% Free | Sandboxed, verified cryptographic origin |
| **Database** | **Neon Postgres** or **Supabase** | 0.5 GiB – 500 MB Free Forever | TLS 1.3 / SSL encryption, Daily Backups, RLS |
| **Backend REST API** | **Render** or **Vercel Serverless** | Free Web Service (0.1 CPU, 512MB RAM) | Automated HTTPS, isolated containers, zero card needed |

---

## Method 1: Deploying the Frontend (Website & App) on Vercel (Recommended)

Vercel provides the fastest, safest, and most seamless deployment for Vite + React applications.

### Option A: 1-Click via GitHub (Easiest)
1. Push your repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: complete e-waste platform with location and vernacular support"
   git push origin master
   ```
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub (100% free).
3. Click **"Add New..."** > **"Project"** and select your `kabadiwala-connect` repository.
4. In the Project Configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web` (or leave at root, the included `vercel.json` will auto-configure)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (or `apps/web/dist` if root)
5. Click **"Deploy"**.
6. In ~45 seconds, your site will be live at `https://your-project.vercel.app` with free SSL and global CDN!

### Option B: Deploy from Terminal via Vercel CLI
```bash
# In your terminal
npx vercel
# Follow the interactive prompts (select default settings)
# For production deploy:
npx vercel --prod
```

---

## Method 2: Deploying the Mobile App (PWA & Android APK)

Kabadiwala Connect is pre-configured as an installable **Progressive Web App (PWA)** with `manifest.json`, high-resolution icons, responsive mobile touch targets, and offline fallback.

### 1. Direct Install on Android & iOS (No App Store Needed, Free)
- **On Android (Chrome / Brave / Edge)**:
  1. Open your deployed URL (e.g. `https://your-project.vercel.app`).
  2. Tap the browser menu (three dots `⋮`) and select **"Add to Home screen"** or tap the **"Install App"** banner.
  3. The app icon **"धा (Dhatu)"** will be added to your mobile home screen and app drawer, running full screen like a native app.
- **On iPhone / iPad (Safari)**:
  1. Open your deployed URL in Safari.
  2. Tap the **Share** button (box with upward arrow).
  3. Scroll and tap **"Add to Home Screen"**.

### 2. Generate an Android `.apk` file (Free with PWABuilder)
To distribute an installable Android `.apk` to collectors without paying Google Play Store developer fees ($25):
1. Go to [PWABuilder.com](https://www.pwabuilder.com/) (Free open-source tool backed by Microsoft).
2. Enter your live Vercel URL and click **"Start"**.
3. PWABuilder validates your manifest and service worker.
4. Click **"Package for Android"** > **"Generate Package"**.
5. Download the signed `.apk` file and install it directly on any Android device!

---

## Method 3: Deploying the Database (Safe & Free)

The backend supports PostgreSQL for production cloud deployment.

### Option A: Neon Serverless Postgres (Zero Maintenance, Free Forever)
1. Go to [neon.tech](https://neon.tech) and sign up for free (no credit card).
2. Click **"New Project"**, name it `kabadiwala-db`.
3. Copy your connection string:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```
4. In `apps/api/.env` or your cloud provider environment variables:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require"
   ```
5. Run migrations:
   ```bash
   cd apps/api
   npx prisma db push
   npm run seed
   ```

### Option B: Supabase PostgreSQL (500 MB Free Forever)
1. Go to [supabase.com](https://supabase.com) and click **"New Project"**.
2. Select your closest region (e.g. `ap-south-1 Mumbai` for India low-latency).
3. Go to **Settings** > **Database** and copy the **Connection string (URI)**.
4. Set `DATABASE_URL` to the copied string with `?sslmode=require`.

---

## Method 4: Deploying Fullstack (Frontend + Backend) on Render

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint file.

1. Push this repository to GitHub.
2. Go to [render.com](https://render.com) and sign in for free.
3. Click **"New +"** > **"Blueprint"**.
4. Select your GitHub repository.
5. Render reads `render.yaml` and automatically provisions:
   - **`kabadiwala-web`**: The static frontend website (Free tier, HTTPS included).
   - **`kabadiwala-api`**: The Node.js Express API (Free tier).
6. Click **"Apply"** to launch both services with zero configuration!

---

## Security & Safety Checklist

- [x] **Automatic HTTPS / SSL**: All communication encrypted in transit via TLS 1.3.
- [x] **DDoS & Scraping Protection**: Handled by Vercel / Cloudflare edge networks.
- [x] **Security Headers Configured**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`.
- [x] **Offline Resilience**: App works and stores lots locally even if network drops or the free backend wakes up from sleep.
- [x] **Zero Secret Leakage**: Database credentials and JWT secrets are managed strictly through cloud environment variables.
