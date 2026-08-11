# Render Deployment Guide — Exam Reviewer Toolkit

This repository is a **pnpm workspace**. The production service must run the Express API server, which also serves the built frontend. Do **not** deploy only `artifacts/sme-risk-engine`, because frontend-only hosting will cause `/api/*` requests to return the SPA HTML instead of JSON.

## Required Render settings

| Field | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | **leave blank** |
| Runtime | `Node` |
| Build Command | `pnpm install --frozen-lockfile && pnpm run render:build` |
| Start Command | `pnpm start` |
| Health Check Path | `/api/health` |

The root `render:build` script builds both:

- `@workspace/sme-risk-engine`
- `@workspace/api-server`

The root `start` script starts `@workspace/api-server`. Express registers `/api/*` first, then serves the built SPA for normal browser routes.

## Environment variables

Add credentials to the **same Render Web Service** that runs the app. Relevant variables include:

- `ONET_API_KEY`
- `BLS_API_KEY`
- `MAP_TILER_API_KEY` — used by the interactive AOR country map
- other source credentials used by enabled server integrations

`MAP_TILER_API_KEY` intentionally keeps the normal server-style name in Render. The API server exposes only the MapTiler browser key through `/api/map-config` at runtime, so there is no separate `VITE_MAP_TILER_API_KEY` build-time variable to maintain.

Do not prefix other server-side credentials with `VITE_` unless a browser-exposed variable is explicitly required.

## Verification after deployment

Open these paths on the deployed service:

- `/api/health` → must return JSON
- `/api/map-config` → must return `{ configured: true, ... }` when `MAP_TILER_API_KEY` is set
- `/api/intelligence/status` → must return JSON
- `/api/occupations/search?q=firefighter` → must return JSON, not `index.html`
- `/aor` → must load the interactive MapTiler AOR map
- `/injury-intelligence` → must load the SPA route

If an `/api/*` path returns `text/html`, Render is running a frontend-only server or the Root Directory / Start Command is wrong.
