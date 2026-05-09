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

## 4. Set Up Environment Variables

This is the most critical step for the **"Nuclear Fuel"** features to work.

1.  Scroll down to the **"Environment Variables"** section.
2.  Click **"Add Environment Variable"** for each of the following (refer to your `.env.example` or the `nuclearWarheadAPIs.ts` file):

| Key | Value |
| :--- | :--- |
| **`VITE_GROQ_KEY`** | *Your Groq API Key* |
| **`VITE_GEMINI_KEY`** | *Your Google Gemini API Key* |
| **`VITE_OPENROUTER_KEY`** | *Your OpenRouter API Key* |
| **`VITE_TAVILY_KEY`** | *Your Tavily API Key* |
| **`VITE_EXA_KEY`** | *Your Exa Search API Key* |
| **`VITE_FIRECRAWL_KEY`** | *Your Firecrawl API Key* |
| **`VITE_YOU_API_KEY`** | *Your You.com API Key* |
| **`VITE_JINA_KEY`** | *Your Jina AI API Key* |
| **`VITE_OCR_SPACE_KEY`** | *Your OCR.space API Key* |

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
