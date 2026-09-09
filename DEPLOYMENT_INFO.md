# Kabadiwala Connect (धातु) — Production Deployment & Cloud Infrastructure

This document contains the complete deployment specification, cloud database configuration, service credentials, and collaborator management procedures for the **Kabadiwala Connect** platform.

---

## 1. Live Production Deployment Overview

| Property | Value / Link |
| :--- | :--- |
| **Live Web App & PWA** | [https://kabadiwala-connect-lb5k.onrender.com](https://kabadiwala-connect-lb5k.onrender.com) |
| **Backend REST API** | [https://kabadiwala-connect-lb5k.onrender.com/api](https://kabadiwala-connect-lb5k.onrender.com/api) |
| **Healthcheck Endpoint** | [https://kabadiwala-connect-lb5k.onrender.com/health](https://kabadiwala-connect-lb5k.onrender.com/health) (Status: `ok`) |
| **Hosting Provider** | **Render** (Free Tier Web Service, 0.1 CPU, 512 MB RAM) |
| **Cloud Database** | **Neon Serverless PostgreSQL 18** |
| **Primary Region** | **Singapore (ap-southeast-1)** *(Both Web & Database collocated for lowest latency)* |
| **GitHub Repository** | [https://github.com/krishnamry/kabadiwala-connect](https://github.com/krishnamry/kabadiwala-connect) |

---

## 2. Render Deployment Details

The web service on Render builds both the Vite React frontend and the Express backend, serving both from a single container with zero CORS configuration needed.

### Service Settings
- **Service Name:** `kabadiwala-connect-lb5k`
- **Environment:** `Node` (Node.js 20+ / 22+)
- **Region:** `Singapore (Southeast Asia)`
- **Branch:** `master`
- **Root Directory:** *(Empty — runs from repository root)*
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
  *(Compiles React into `apps/web/dist`, copies bundles to root assets, and compiles Express TypeScript into `apps/api/dist`)*
- **Start Command:**
  ```bash
  npm start
  ```
  *(Executes `node apps/api/dist/index.js`, which serves the interactive React frontend on `/` and the REST API on `/api/...`)*
- **Port:** `10000` (Injected automatically via Render's `$PORT`)

### Production Environment Variables in Render
| Variable Key | Description / Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string (see below) |
| `JWT_SECRET` | `kabadiwala-super-secret-jwt-key-2026` |

---

## 3. Neon Database Configuration

The project is linked to a serverless PostgreSQL database on Neon with Managed Better Auth enabled.

### Database Metadata
- **Project Name:** `Kabadiwala Connect`
- **Project ID:** `shiny-voice-45998959`
- **Default Branch:** `production` (Branch ID: `br-curly-surf-b3iiu0qv`)
- **Organization ID:** `org-calm-salad-06604879`
- **Region:** `aws-ap-southeast-1` (Singapore)
- **Postgres Engine Version:** `18`
- **Neon Policy (`neon.ts`):**
  ```ts
  import { defineConfig } from "@neon/config/v1";

  export default defineConfig({
    auth: true,
  });
  ```

### Connection Strings & Auth Endpoints
- **Pooled Connection String (`DATABASE_URL`):**
  ```
  postgresql://neondb_owner:npg_c5JmBuz9Slie@ep-divine-resonance-b3hfmbt9-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
  ```
- **Direct / Unpooled Connection String (`DATABASE_URL_UNPOOLED`):**
  ```
  postgresql://neondb_owner:npg_c5JmBuz9Slie@ep-divine-resonance-b3hfmbt9.c-4.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
  ```
- **Neon Auth Base URL:**
  ```
  https://ep-divine-resonance-b3hfmbt9.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth
  ```
- **JWKS Keyset URL:**
  ```
  https://ep-divine-resonance-b3hfmbt9.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json
  ```

### CLI Maintenance Commands
```bash
# Check branch status and config
neon status

# Open Neon web console
neon open

# Inspect Postgres performance and connection health
neon inspect db

# Connect directly via psql
neon psql production
```

---

## 4. GitHub Repository Privacy & Collaborator Access

To make your repository private so that it is only visible to you and authorized collaborators with full write/edit permissions:

### Step A: Make the Repository Private
1. Open the repository settings in your browser:
   👉 **[https://github.com/krishnamry/kabadiwala-connect/settings](https://github.com/krishnamry/kabadiwala-connect/settings)**
2. Scroll to the very bottom to the **Danger Zone** section.
3. Locate **Change repository visibility** and click **Change visibility**.
4. Select **Make private**.
5. Type `krishnamry/kabadiwala-connect` to confirm and click **I understand, make this repository private**.
*(Your code, commits, and pull requests are now completely hidden from the public and search engines).*

### Step B: Invite Collaborators with Write Permissions
1. In the left navigation of your repository settings, click **Collaborators** (or open [https://github.com/krishnamry/kabadiwala-connect/settings/access](https://github.com/krishnamry/kabadiwala-connect/settings/access)).
2. Click the green **"Add people"** button.
3. Enter your collaborator's GitHub username or email address.
4. Select the permission level:
   - **Write** *(Recommended)*: Allows collaborators to push commits, create branches, review code, and trigger Render auto-deploys.
   - **Admin**: Grants full control, including modifying repository settings.
5. Click **"Add [username] to this repository"**.
6. The collaborator will receive an invitation email and notification. Once they accept, they have full access to view, clone, and make changes to the private repository.

---

## 5. Mobile Progressive Web App (PWA) Deployment

The frontend includes a configured web manifest ([`manifest.json`](file:///home/krishna/KBD/manifest.json)), high-resolution iconography, and viewport safe-area styling for full-screen standalone mobile use.

### Instant Installation
1. Navigate to [https://kabadiwala-connect-lb5k.onrender.com](https://kabadiwala-connect-lb5k.onrender.com) on a mobile device.
2. **On Android (Chrome / Brave / Edge):**
   - Tap the browser menu (`⋮`) > **Add to Home screen** (or tap the **Install** prompt).
3. **On iOS (Safari):**
   - Tap the **Share** button > **Add to Home Screen**.
4. The application installs with the native icon **"धा (Dhatu)"**, opens without browser URL bars, and provides offline caching.

---

## 6. Architecture & File Reference

- [`apps/api/src/index.ts`](file:///home/krishna/KBD/apps/api/src/index.ts): Express server serving the REST API on `/api` and the SPA frontend on `/`.
- [`apps/web/`](file:///home/krishna/KBD/apps/web/): React 18 + Vite frontend with Citizen, Collector, Recycler, and Admin dashboards.
- [`neon.ts`](file:///home/krishna/KBD/neon.ts): Neon Infrastructure-as-Code specification (`auth: true`).
- [`render.yaml`](file:///home/krishna/KBD/render.yaml): Render Blueprint infrastructure file.
- [`vercel.json`](file:///home/krishna/KBD/vercel.json): Vercel configuration for alternative edge hosting.
