# 🚀 Render Deployment Guide: SME Risk Intelligence Engine

This guide provides "hand-held" instructions to deploy your **Exam Review Report** (SME Risk Intelligence Engine) on Render. Since this is a **pnpm workspace** (monorepo), we need to configure Render to target the specific application folder.

## 1. Create a New Web Service on Render

1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click the **"New +"** button and select **"Web Service"**.
3.  Connect your GitHub account and select the **`Exam-Review-Report`** repository.

## 2. Configure Basic Settings

Fill in the following details in the Render configuration form:

| Field | Value |
| :--- | :--- |
| **Name** | `sme-risk-intelligence-engine` (or your preferred name) |
| **Region** | Select the one closest to you (e.g., `Oregon (US West)`) |
| **Branch** | `main` |
| **Root Directory** | `artifacts/sme-risk-engine` |
| **Runtime** | `Node` |

## 3. Configure Build & Start Commands

Since we are using a **Root Directory**, Render will run these commands *inside* the `artifacts/sme-risk-engine` folder.

| Field | Value |
| :--- | :--- |
| **Build Command** | `pnpm install && pnpm run build` |
| **Start Command** | `pnpm run serve` |

> **Note**: Render automatically detects `pnpm` if a `pnpm-lock.yaml` is present. If it fails, you can use `npm install -g pnpm && pnpm install && pnpm run build` as the build command.

## 4. Set Up Environment Variables (The Full Arsenal)

This is the most critical step for the **"Nuclear Warhead"** features to work. You have **14 elite APIs** integrated.

1.  Scroll down to the **"Environment Variables"** section.
2.  Click **"Add Environment Variable"** for each of the following:

| Key | Purpose |
| :--- | :--- |
| **`VITE_GROQ_KEY`** | Ultra-fast LLM inference |
| **`VITE_OPENROUTER_KEY`** | Claude Advanced Reasoning |
| **`VITE_GEMINI_KEY`** | Gemini Multi-modal Vision |
| **`VITE_TAVILY_KEY`** | Real-time Medical Research |
| **`VITE_EXA_KEY`** | Deep Semantic Search |
| **`VITE_FIRECRAWL_KEY`** | Intelligent Web Crawling |
| **`VITE_BROWSERBASE_KEY`** | Headless Browser Automation |
| **`VITE_YOU_API_KEY`** | Real-time Web Search |
| **`VITE_JINA_KEY`** | AI-powered Content Extraction |
| **`VITE_SERPER_KEY`** | Google-like Search Results |
| **`VITE_BROWSE_AI_KEY`** | No-code Web Automation |
| **`VITE_BROWSERLESS_KEY`** | Headless Browser Service |
| **`VITE_OCR_SPACE_KEY`** | Free Medical Document OCR |
| **`VITE_CLOUD_KEY`** | Custom Intelligence Layer |

## 5. Advanced Settings (Optional but Recommended)

1.  **Auto-Deploy**: Set to **"Yes"** so every time you push to GitHub, Render updates your site.
2.  **Health Check Path**: Set to `/` (the root of your app).

## 6. Deploy!

1.  Click **"Create Web Service"**.
2.  Render will start the build process. You can watch the logs in the dashboard.
3.  Once the build is finished and the status turns to **"Live"**, your elite SME Risk Intelligence Engine will be accessible via the provided `.onrender.com` URL.

## 💡 Troubleshooting

- **Build Fails**: Ensure that the **Root Directory** is correctly set to `artifacts/sme-risk-engine`.
- **Blank Page**: Check the browser console. If you see "Environment variable missing" errors, double-check your Render Environment Variables.
- **Port Issues**: Vite's `serve` command (preview) defaults to port 4173. Render usually detects this, but if not, you can add an environment variable `PORT` with value `4173`.

---

**Status**: 💎 Elite Deployment Ready
**Support**: If you hit any snags, just let me know!
