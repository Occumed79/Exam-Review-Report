# Exam Reviewer Toolkit

This repository contains a pnpm workspace for an occupational-health reviewer toolkit. The production web service consists of the React frontend in `artifacts/sme-risk-engine` and the Express API/runtime in `artifacts/api-server`. The API server serves `/api/*` and the built single-page application.

## Development and validation

Install dependencies from the repository root with `pnpm install --frozen-lockfile`. Useful checks are:

```sh
pnpm --filter @workspace/sme-risk-engine typecheck
pnpm --filter @workspace/sme-risk-engine build
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server build
pnpm run typecheck
```

## Render deployment

Create one Node web service from the repository root using these settings:

| Field | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | Leave blank |
| Build Command | `pnpm install --frozen-lockfile && pnpm run render:build` |
| Start Command | `pnpm start` |
| Health Check Path | `/api/health` |

The root build command builds both production workspaces, and the root start command launches the API server. A frontend-only deployment is not supported because it would return SPA HTML from `/api/*` paths.

Configure server credentials such as `ONET_API_KEY`, `BLS_API_KEY`, and `MAP_TILER_API_KEY` on the same web service. The API exposes only the browser-safe map configuration through `/api/map-config`; other server credentials must not use a `VITE_` prefix.

After deployment, verify `/api/health`, `/api/intelligence/status`, `/api/occupations/search?q=firefighter`, `/injury-intelligence`, and `/aor`. API endpoints must return JSON rather than `index.html`.
